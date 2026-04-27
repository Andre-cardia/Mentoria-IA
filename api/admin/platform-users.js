import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["admin", "comercial"];

function makeClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

async function getAdminUser(req, supabase) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.user_metadata?.role === "admin" ? user : null;
}

function sanitizeUser(user) {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    role: metadata.role ?? null,
    full_name: metadata.full_name || metadata.name || user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
  };
}

function normalizeRole(role) {
  return String(role ?? "").trim().toLowerCase();
}

export default async function handler(req, res) {
  const supabase = makeClient();
  const adminUser = await getAdminUser(req, supabase);

  if (!adminUser) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) return res.status(500).json({ error: "Erro ao listar usuários" });

    const users = (data?.users ?? [])
      .filter((user) => ALLOWED_ROLES.includes(user.user_metadata?.role))
      .map(sanitizeUser)
      .sort((a, b) => String(a.full_name).localeCompare(String(b.full_name), "pt-BR"));

    return res.json({ users, currentUserId: adminUser.id });
  }

  if (req.method === "POST") {
    const { email, password, full_name, role } = req.body;
    const nextRole = normalizeRole(role);

    if (!email || !password || !full_name || !nextRole) {
      return res.status(400).json({ error: "email, password, full_name e role são obrigatórios" });
    }
    if (!ALLOWED_ROLES.includes(nextRole)) {
      return res.status(400).json({ error: "Role inválido" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        role: nextRole,
      },
    });

    if (error) {
      const alreadyExists = error.message?.includes("already registered") || error.code === "email_exists";
      return res.status(alreadyExists ? 409 : 500).json({
        error: alreadyExists ? "E-mail já cadastrado" : "Erro ao criar usuário",
      });
    }

    return res.status(201).json({ ok: true, user: sanitizeUser(data.user) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
