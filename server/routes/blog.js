import { randomUUID } from "crypto";
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "../config.js";

const router = Router();

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// POST /api/blog/image-upload
router.post("/image-upload", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: "Supabase não configurado" });
    }

    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Token inválido" });

    const role = user.user_metadata?.role;
    if (role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { fileName, contentType, type } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: "fileName e contentType são obrigatórios" });
    }

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

    return res.json({
      uploadUrl: data.signedUrl,
      imageUrl: urlData.publicUrl,
    });
  } catch (err) {
    console.error("[blog/image-upload]", err);
    return res.status(500).json({ error: err.message ?? "Erro interno" });
  }
});

export default router;
