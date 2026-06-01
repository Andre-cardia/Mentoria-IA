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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { password } = req.body;

  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Senha deve ter pelo menos 8 caracteres" });
  }

  const { error } = await supabase.auth.admin.updateUserById(id, { password });

  if (error) {
    return res.status(500).json({ error: "Erro ao redefinir senha" });
  }

  return res.json({ ok: true });
}
