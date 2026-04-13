import { randomUUID } from "crypto";
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = Router();

router.post("/image-upload", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
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

  const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: s3Key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  );

  // URL permanente via proxy — não expira
  const imageUrl = `/api/blog/image/${s3Key}`;

  return res.json({ uploadUrl, imageUrl });
});

// GET /api/blog/image/:prefix/:filename
// Proxy que gera presigned GET e redireciona
router.get("/image/*", async (req, res) => {
  const s3Key = req.params[0];
  if (!s3Key || (!s3Key.startsWith("blog-images/") && !s3Key.startsWith("blog-covers/"))) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: s3Key }),
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
