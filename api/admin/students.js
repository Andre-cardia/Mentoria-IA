import { createClient } from "@supabase/supabase-js";

function makeClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

async function verifyAdmin(req, supabase) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return false;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.user_metadata?.role === "admin";
}

export default async function handler(req, res) {
  const supabase = makeClient();

  if (!(await verifyAdmin(req, supabase))) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  // GET — lista alunos ou compradores sem cadastro
  if (req.method === "GET") {
    const [profilesRes, usersRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
      supabase.from("payments").select("email, reference_id, amount, created_at")
        .eq("status", "PAID")
        .not("email", "is", null)
        .order("created_at", { ascending: false }),
    ]);

    if (profilesRes.error) {
      return res.status(500).json({ error: "Erro ao buscar perfis" });
    }

    const authUsers = usersRes.data?.users ?? [];
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
    const pendingRegistration = (paymentsRes.data ?? [])
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
