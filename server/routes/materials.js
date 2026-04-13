import { Router } from "express";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { S3Adapter } from "../adapters/s3-adapter.js";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "../config.js";

const router = Router();
const s3 = new S3Adapter();

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * POST /api/materials/upload
 * Gera uma presigned URL para upload direto ao S3.
 * Body: { fileName, contentType, title, description }
 * Requer: usuário autenticado com role=admin (verificado via Bearer token)
 */
router.post("/upload", async (req, res) => {
  try {
    const { fileName, contentType, title, description, module_id } = req.body;

    if (!fileName || !contentType || !title) {
      return res.status(400).json({ error: "fileName, contentType e title são obrigatórios" });
    }

    const ext = fileName.split(".").pop();
    const s3Key = `materials/${randomUUID()}.${ext}`;

    const uploadUrl = await s3.getUploadUrl(s3Key, contentType);

    // Registra o material no Supabase (sem file_size ainda — será atualizado após upload se necessário)
    if (supabase) {
      const { error } = await supabase.from("materials").insert({
        title,
        description: description ?? null,
        s3_key: s3Key,
        module_id: module_id || null,
      });
      if (error) {
        console.error("[materials/upload] Erro ao registrar no Supabase:", error);
        return res.status(500).json({ error: "Erro ao registrar material" });
      }
    }

    return res.json({ uploadUrl, s3Key });
  } catch (err) {
    console.error("[materials/upload]", err);
    return res.status(500).json({ error: "Erro interno ao gerar URL de upload" });
  }
});

/**
 * GET /api/materials/:id/download
 * Retorna uma presigned URL para download do arquivo no S3.
 * Requer: usuário autenticado (verificado via Bearer token)
 */
router.get("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(503).json({ error: "Supabase não configurado" });
    }

    const { data, error } = await supabase
      .from("materials")
      .select("s3_key, title")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Material não encontrado" });
    }

    const downloadUrl = await s3.getDownloadUrl(data.s3_key);

    return res.json({ downloadUrl, title: data.title });
  } catch (err) {
    console.error("[materials/download]", err);
    return res.status(500).json({ error: "Erro interno ao gerar URL de download" });
  }
});

export default router;
