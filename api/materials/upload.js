import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, contentType, title, description, module_id } = req.body;

  if (!fileName || !contentType || !title) {
    return res.status(400).json({ error: "fileName, contentType e title são obrigatórios" });
  }

  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const ext = fileName.split(".").pop();
    const s3Key = `materials/${randomUUID()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: s3Key,
        ContentType: contentType,
      }),
      { expiresIn: 300 }
    );

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase.from("materials").insert({
      title,
      description: description ?? null,
      s3_key: s3Key,
      module_id: module_id || null,
    });

    if (error) {
      console.error("[api/materials/upload] Supabase:", error);
      return res.status(500).json({ error: "Erro ao registrar material" });
    }

    return res.json({ uploadUrl, s3Key });
  } catch (err) {
    console.error("[api/materials/upload]", err);
    return res.status(500).json({ error: "Erro interno ao gerar URL de upload" });
  }
}
