import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email e password são obrigatórios" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Valida se o email tem pagamento PAID
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, status, email")
    .eq("email", email.toLowerCase().trim())
    .eq("status", "PAID")
    .maybeSingle();

  if (paymentError) {
    console.error("[api/auth/register] Erro ao consultar payments:", paymentError);
    return res.status(500).json({ error: "Erro interno ao validar pagamento" });
  }

  if (!payment) {
    return res.status(402).json({
      error: "Pagamento não encontrado",
      message: "Não encontramos um pagamento confirmado para este e-mail. Verifique o e-mail utilizado na compra ou entre em contato com o suporte.",
    });
  }

  // Cria a conta no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message?.includes("already registered") || authError.code === "email_exists") {
      return res.status(409).json({
        error: "E-mail já cadastrado",
        message: "Este e-mail já possui uma conta. Acesse a plataforma pelo login.",
      });
    }
    console.error("[api/auth/register] Erro ao criar usuário:", authError);
    return res.status(500).json({ error: "Erro ao criar conta" });
  }

  return res.status(201).json({ ok: true, userId: authData.user.id });
}
