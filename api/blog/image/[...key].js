import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * GET /api/blog/image/blog-images/uuid.ext
 * GET /api/blog/image/blog-covers/uuid.ext
 *
 * Gera presigned GET URL para o objeto S3 e redireciona.
 * URL armazenada no banco é permanente; presigned URL é renovada a cada requisição.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Vercel catch-all: req.query.key é um array de segmentos
  const keyParts = req.query.key;
  if (!keyParts || keyParts.length === 0) {
    return res.status(400).json({ error: "Key obrigatória" });
  }
  const s3Key = Array.isArray(keyParts) ? keyParts.join("/") : keyParts;

  // Só permite prefixos do blog
  if (!s3Key.startsWith("blog-images/") && !s3Key.startsWith("blog-covers/")) {
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
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: s3Key,
      }),
      { expiresIn: 3600 } // 1 hora; browser faz cache
    );

    // Cache público por 55 minutos (margem antes da expiração)
    res.setHeader("Cache-Control", "public, max-age=3300, stale-while-revalidate=300");
    return res.redirect(302, url);
  } catch (err) {
    console.error("[blog/image]", err);
    return res.status(500).json({ error: "Erro ao gerar URL" });
  }
}
