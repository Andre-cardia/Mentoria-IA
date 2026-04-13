import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Validate Bearer token
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Invalid token" });

  // Verify admin
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

  // URL permanente via proxy — não expira, redireciona para presigned GET
  const imageUrl = `/api/blog/image/${s3Key}`;

  return res.status(200).json({ uploadUrl, imageUrl });
}
