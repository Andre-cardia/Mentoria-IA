import { randomUUID } from "crypto";
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { S3Adapter } from "../adapters/s3-adapter.js";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "../config.js";

const router = Router();
const s3 = new S3Adapter();

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
    const s3Key = `${prefix}/${randomUUID()}.${ext}`;

    const uploadUrl = await s3.getUploadUrl(s3Key, contentType);
    const imageUrl = `/api/blog/image/${s3Key}`;

    return res.json({ uploadUrl, imageUrl });
  } catch (err) {
    console.error("[blog/image-upload]", err);
    return res.status(500).json({ error: err.message ?? "Erro interno" });
  }
});

// GET /api/blog/image/*
// Proxy: gera presigned GET URL e redireciona
router.get("/image/*", async (req, res) => {
  try {
    const s3Key = req.params[0];
    if (!s3Key || (!s3Key.startsWith("blog-images/") && !s3Key.startsWith("blog-covers/"))) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const url = await s3.getDownloadUrl(s3Key);
    res.setHeader("Cache-Control", "public, max-age=3300, stale-while-revalidate=300");
    return res.redirect(302, url);
  } catch (err) {
    console.error("[blog/image]", err);
    return res.status(500).json({ error: err.message ?? "Erro ao gerar URL" });
  }
});

export default router;
