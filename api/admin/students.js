import { createClient, isAuthSessionMissingError } from "@supabase/supabase-js";
import { requiresFirstAccessPasswordChange } from "../../shared/first-access.js";

const SESSION_ERROR_CODES = new Set([
  "bad_jwt", "no_authorization", "session_not_found", "session_expired", "user_not_found",
]);
const AUTH_ERRORS = {
  401: "Sessão inválida. Entre novamente na Gestão.",
  403: "Acesso negado",
  503: "Não foi possível validar a sessão. Tente novamente.",
};

function makeClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

async function verifyAdmin(token, supabase) {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      // O gateway também pode responder 401 por uma chave de API inválida.
      const sessionRejected = isAuthSessionMissingError(error) || SESSION_ERROR_CODES.has(error.code);
      return sessionRejected ? 401 : 503;
    }
    if (!data?.user?.id) return 503;
    return data.user.app_metadata?.role === "admin" && !requiresFirstAccessPasswordChange(data.user) ? 200 : 403;
  } catch {
    return 503;
  }
}

export default async function handler(req, res) {
  const authorization = req.headers.authorization;
  const token = typeof authorization === "string" ? authorization.match(/^Bearer\s+(\S+)$/i)?.[1] : null;
  if (!token) return res.status(401).json({ error: AUTH_ERRORS[401] });

  let supabase;
  try {
    supabase = makeClient();
  } catch {
    return res.status(503).json({ error: AUTH_ERRORS[503] });
  }

  const authStatus = await verifyAdmin(token, supabase);
  if (authStatus !== 200) {
    return res.status(authStatus).json({ error: AUTH_ERRORS[authStatus] });
  }

  // GET — lista alunos ou compradores sem cadastro
  if (req.method === "GET") {
    const results = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
      supabase.from("payments").select("email, reference_id, amount, created_at")
        .eq("status", "PAID")
        .not("email", "is", null)
        .order("created_at", { ascending: false }),
    ]).catch(() => null);
    if (!results) return res.status(500).json({ error: "Erro ao buscar a lista de alunos" });

    const [profilesRes, usersRes, paymentsRes] = results;
    if (profilesRes.error || !Array.isArray(profilesRes.data)
      || !profilesRes.data.every((profile) => typeof profile?.user_id === "string")) {
      return res.status(500).json({ error: "Erro ao buscar perfis" });
    }
    if (usersRes.error || !Array.isArray(usersRes.data?.users)
      || !usersRes.data.users.every((user) => typeof user?.id === "string"
        && (user.email == null || typeof user.email === "string"))
      || paymentsRes.error || !Array.isArray(paymentsRes.data)
      || !paymentsRes.data.every((payment) => typeof payment?.email === "string"
        && (payment.reference_id == null || typeof payment.reference_id === "string"))) {
      return res.status(500).json({ error: "Erro ao buscar a lista de alunos" });
    }

    const authUsers = usersRes.data.users;
    const emailMap = Object.fromEntries(authUsers.map((u) => [u.id, u.email]));
    const registeredEmails = new Set(authUsers.map((u) => u.email?.toLowerCase()));

    // Alunos matriculados
    const students = profilesRes.data.map((p) => ({
      ...p,
      email: emailMap[p.user_id] ?? null,
    }));

    // Compradores PAID que não criaram conta
    // Deduplica por email (um comprador pode ter mais de um pagamento)
    const seenEmails = new Set();
    const pendingRegistration = paymentsRes.data
      .filter((p) => {
        const email = p.email?.toLowerCase();
        if (!email || registeredEmails.has(email) || seenEmails.has(email)) return false;
        seenEmails.add(email);
        return true;
      })
      .map((p) => ({
        email: p.email,
        plan: p.reference_id?.split("-")[0] ?? "—",
        amount: p.amount,
        purchased_at: p.created_at,
      }));

    return res.json({ students, pendingRegistration });
  }

  // POST — cria novo aluno (sem validação de pagamento)
  if (req.method === "POST") {
    const { email, password, full_name, phone, origin } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "email, password e full_name são obrigatórios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      app_metadata: { password_change_required: true },
    });

    if (authError) {
      const msg = authError.message?.includes("already registered") || authError.code === "email_exists"
        ? "E-mail já cadastrado"
        : "Erro ao criar usuário";
      return res.status(authError.code === "email_exists" ? 409 : 500).json({ error: msg });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: authData.user.id,
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
      origin: origin?.trim() || null,
      status: "active",
    });

    if (profileError) {
      // Rollback: remove o usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: "Erro ao criar perfil do aluno" });
    }

    return res.status(201).json({ ok: true, userId: authData.user.id });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
