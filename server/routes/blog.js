import { randomUUID } from "crypto";
import { Router } from "express";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import {
  AWS_BUCKET,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} from "../config.js";

const router = Router();

function makeS3() {
  return new S3Client({
    region: AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

// POST /api/blog/image-upload
router.post("/image-upload", async (req, res) => {
  try {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: "Invalid token" });

    const role = user.user_metadata?.role;
    if (role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { fileName, contentType, type } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: "fileName e contentType são obrigatórios" });
    }

    const prefix = type === "cover" ? "blog-covers" : "blog-images";
    const ext = fileName.split(".").pop();
    const s3Key = `${prefix}/${randomUUID()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      makeS3(),
      new PutObjectCommand({ Bucket: AWS_BUCKET, Key: s3Key, ContentType: contentType }),
      { expiresIn: 300 }
    );

    const imageUrl = `/api/blog/image/${s3Key}`;
    return res.json({ uploadUrl, imageUrl });
  } catch (err) {
    console.error("[blog/image-upload]", err);
    return res.status(500).json({ error: "Erro interno ao gerar URL de upload" });
  }
});

// GET /api/blog/image/:prefix/:filename
// Proxy que gera presigned GET e redireciona
router.get("/image/*", async (req, res) => {
  try {
    const s3Key = req.params[0];
    if (!s3Key || (!s3Key.startsWith("blog-images/") && !s3Key.startsWith("blog-covers/"))) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const url = await getSignedUrl(
      makeS3(),
      new GetObjectCommand({ Bucket: AWS_BUCKET, Key: s3Key }),
      { expiresIn: 3600 }
    );

    res.setHeader("Cache-Control", "public, max-age=3300, stale-while-revalidate=300");
    return res.redirect(302, url);
  } catch (err) {
    console.error("[blog/image]", err);
    return res.status(500).json({ error: "Erro ao gerar URL" });
  }
});

export default router;
