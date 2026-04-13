import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Invalid token" });

  const role = user.user_metadata?.role;
  if (role !== "admin") return res.status(403).json({ error: "Forbidden" });

  const { fileName, contentType, type } = req.body;
  if (!fileName || !contentType) {
    return res.status(400).json({ error: "fileName e contentType são obrigatórios" });
  }

  try {
    const prefix = type === "cover" ? "blog-covers" : "blog-images";
    const ext = fileName.split(".").pop();
    const filePath = `${prefix}/${randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("blog-images")
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filePath);

    return res.status(200).json({
      uploadUrl: data.signedUrl,
      imageUrl: urlData.publicUrl,
    });
  } catch (err) {
    console.error("[blog/image-upload]", err);
    return res.status(500).json({ error: err.message ?? "Erro interno" });
  }
}
