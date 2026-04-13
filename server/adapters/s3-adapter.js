import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AWS_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "../config.js";

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const UPLOAD_EXPIRES_IN = 300;   // 5 min para upload
const DOWNLOAD_EXPIRES_IN = 3600; // 1h para download (alinha com proxy cache max-age=3300)

export class S3Adapter {
  /**
   * Gera uma presigned URL para upload direto ao S3 (PUT).
   * @param {string} s3Key - Caminho do arquivo no bucket
   * @param {string} contentType - MIME type do arquivo
   * @returns {Promise<string>} URL assinada para PUT
   */
  async getUploadUrl(s3Key, contentType) {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
      ContentType: contentType,
    });
    return getSignedUrl(s3, command, { expiresIn: UPLOAD_EXPIRES_IN });
  }

  /**
   * Gera uma presigned URL para download do S3 (GET).
   * @param {string} s3Key - Caminho do arquivo no bucket
   * @returns {Promise<string>} URL assinada para GET
   */
  async getDownloadUrl(s3Key) {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
    });
    return getSignedUrl(s3, command, { expiresIn: DOWNLOAD_EXPIRES_IN });
  }
}
