import { createClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient, requireAuthenticatedUser } from "../../server/lib/auth.js";
import {
  FIRST_ACCESS_PASSWORD_REQUIREMENTS,
  isStrongFirstAccessPassword,
  requiresFirstAccessPasswordChange,
} from "../../shared/first-access.js";

const SAME_PASSWORD_ERROR = "A nova senha deve ser diferente da senha atual.";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const supabase = createServiceSupabaseClient();
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabase || !anonKey) {
    return res.status(503).json({ error: "Não foi possível validar a sessão. Tente novamente." });
  }

  const user = await requireAuthenticatedUser(req, res, { supabase, allowFirstAccess: true });
  if (!user) return;
  if (!requiresFirstAccessPasswordChange(user)) {
    return res.status(409).json({ error: "A troca de senha do primeiro acesso já foi concluída." });
  }

  if (!user.email) {
    return res.status(422).json({ error: "A conta precisa de um e-mail para alterar a senha." });
  }

  const { currentPassword, password } = req.body ?? {};
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({ error: "Informe a senha atual." });
  }
  if (!isStrongFirstAccessPassword(password)) {
    return res.status(400).json({ error: FIRST_ACCESS_PASSWORD_REQUIREMENTS });
  }
  if (password === currentPassword) {
    return res.status(400).json({ error: SAME_PASSWORD_ERROR });
  }

  // Usa um cliente de Auth separado para verificar a senha atual da mesma conta.
  const verifier = createClient(process.env.VITE_SUPABASE_URL, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await verifier.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (error && error.code !== "invalid_credentials") {
    return res.status(503).json({ error: "Não foi possível confirmar a senha atual. Tente novamente." });
  }
  if (error || data?.user?.id !== user.id) {
    return res.status(400).json({ error: "Senha atual incorreta." });
  }

  // O Supabase aplica a senha e mescla app_metadata na mesma atualização.
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    app_metadata: { password_change_required: false },
  });
  if (updateError?.code === "same_password") {
    return res.status(400).json({ error: SAME_PASSWORD_ERROR });
  }
  if (updateError) {
    return res.status(503).json({ error: "Não foi possível alterar a senha. Tente novamente." });
  }

  return res.json({ ok: true });
}
