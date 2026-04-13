import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { S3Adapter } from "../adapters/s3-adapter.js";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, AWS_BUCKET, AWS_REGION } from "../config.js";

const router = Router();
const s3 = new S3Adapter();

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT_MAP = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * Extrai e verifica o Bearer token, retornando o user_id autenticado.
 */
async function getAuthenticatedUserId(req, res) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação obrigatório" });
    return null;
  }
  const token = auth.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return null;
  }
  return user.id;
}

/**
 * POST /api/profile/avatar-upload
 * Gera presigned URL para upload direto ao S3.
 * Body: { fileName, contentType }
 * Requer: Bearer token válido (aluno autenticado)
 */
router.post("/avatar-upload", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase não configurado" });

    const userId = await getAuthenticatedUserId(req, res);
    if (!userId) return;

    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ error: "fileName e contentType são obrigatórios" });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ error: "Formato não suportado. Use JPEG, PNG ou WebP." });
    }

    const ext = EXT_MAP[contentType];
    const s3Key = `avatars/${userId}.${ext}`;

    const uploadUrl = await s3.getUploadUrl(s3Key, contentType);
    const avatarUrl = `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;

    return res.json({ uploadUrl, avatarUrl });
  } catch (err) {
    console.error("[profile/avatar-upload]", err);
    return res.status(500).json({ error: "Erro interno ao gerar URL de upload" });
  }
});

/**
 * PATCH /api/profile
 * Atualiza campos do perfil do aluno autenticado.
 * Body: { avatar_url?, full_name?, phone? }
 * Requer: Bearer token válido
 */
router.patch("/", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase não configurado" });

    const userId = await getAuthenticatedUserId(req, res);
    if (!userId) return;

    const { avatar_url, full_name, phone } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (full_name  !== undefined) updates.full_name  = full_name;
    if (phone      !== undefined) updates.phone      = phone;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);

    if (error) {
      console.error("[profile/patch]", error);
      return res.status(500).json({ error: "Erro ao atualizar perfil" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[profile/patch]", err);
    return res.status(500).json({ error: "Erro interno ao atualizar perfil" });
  }
});

/**
 * POST /api/profile/update-avatar
 * Persiste avatar_url no perfil — cria linha se não existir (suporte a admin).
 * Body: { avatarUrl }
 * Requer: Bearer token válido
 */
router.post("/update-avatar", async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: "Supabase não configurado" });

    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = auth.slice(7);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: "Token inválido" });

    const { avatarUrl } = req.body;
    if (!avatarUrl) return res.status(400).json({ error: "avatarUrl é obrigatório" });

    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let dbError;
    if (existing) {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      dbError = error;
    } else {
      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
        avatar_url: avatarUrl,
      });
      dbError = error;
    }

    if (dbError) {
      console.error("[profile/update-avatar]", dbError);
      return res.status(500).json({ error: dbError.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("[profile/update-avatar]", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
