import { createClient } from "@supabase/supabase-js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "id é obrigatório" });
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from("materials")
      .select("s3_key, title")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Material não encontrado" });
    }

    const s3 = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: data.s3_key,
      }),
      { expiresIn: 900 }
    );

    return res.json({ downloadUrl, title: data.title });
  } catch (err) {
    console.error("[api/materials/[id]/download]", err);
    return res.status(500).json({ error: "Erro interno ao gerar URL de download" });
  }
}
