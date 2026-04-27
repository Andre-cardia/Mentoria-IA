import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["admin", "comercial"];

function makeClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

async function getAdminUser(req, supabase) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.user_metadata?.role === "admin" ? user : null;
}

function normalizeRole(role) {
  return String(role ?? "").trim().toLowerCase();
}

export default async function handler(req, res) {
  const supabase = makeClient();
  const adminUser = await getAdminUser(req, supabase);

  if (!adminUser) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { full_name, role } = req.body;
    const updates = {};
    const metadataUpdates = {};

    if (full_name !== undefined) {
      const nextName = String(full_name ?? "").trim();
      if (!nextName) return res.status(400).json({ error: "Nome é obrigatório" });
      metadataUpdates.full_name = nextName;
    }

    if (role !== undefined) {
      const nextRole = normalizeRole(role);
      if (!ALLOWED_ROLES.includes(nextRole)) {
        return res.status(400).json({ error: "Role inválido" });
      }
      if (id === adminUser.id && nextRole !== "admin") {
        return res.status(400).json({ error: "Você não pode remover seu próprio acesso admin" });
      }
      metadataUpdates.role = nextRole;
    }

    if (Object.keys(metadataUpdates).length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    const { data: currentData, error: getError } = await supabase.auth.admin.getUserById(id);
    if (getError || !currentData?.user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    updates.user_metadata = {
      ...(currentData.user.user_metadata ?? {}),
      ...metadataUpdates,
    };

    const { error } = await supabase.auth.admin.updateUserById(id, updates);
    if (error) {
      return res.status(500).json({ error: "Erro ao atualizar usuário" });
    }

    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    if (id === adminUser.id) {
      return res.status(400).json({ error: "Você não pode excluir seu próprio usuário" });
    }

    const { data: currentData, error: getError } = await supabase.auth.admin.getUserById(id);
    if (getError || !currentData?.user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (!ALLOWED_ROLES.includes(currentData.user.user_metadata?.role)) {
      return res.status(400).json({ error: "Este endpoint remove apenas usuários admin ou comercial" });
    }

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      return res.status(500).json({ error: "Erro ao excluir usuário" });
    }

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
