import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { avatarUrl } = req.body ?? {};
  if (!avatarUrl)
    return res.status(400).json({ error: "avatarUrl é obrigatório" });

  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user)
    return res.status(401).json({ error: "Token inválido" });

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let dbError;
  if (existing) {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    dbError = error;
  } else {
    const { error } = await supabaseAdmin.from("profiles").insert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
      avatar_url: avatarUrl,
    });
    dbError = error;
  }

  if (dbError) {
    console.error("[api/profile/update-avatar]", dbError);
    return res.status(500).json({ error: dbError.message });
  }

  return res.json({ success: true });
}
