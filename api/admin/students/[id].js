import { createClient } from "@supabase/supabase-js";

function makeClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

async function verifyAdmin(req, supabase) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return false;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.user_metadata?.role === "admin";
}

export default async function handler(req, res) {
  const supabase = makeClient();

  if (!(await verifyAdmin(req, supabase))) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  const { id } = req.query; // user_id (UUID)

  // PATCH — atualiza dados ou status do aluno
  if (req.method === "PATCH") {
    const { full_name, phone, origin, status } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (origin !== undefined) updates.origin = origin?.trim() || null;
    if (status !== undefined) {
      if (!["active", "suspended", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", id);

    if (error) {
      return res.status(500).json({ error: "Erro ao atualizar aluno" });
    }

    return res.json({ ok: true });
  }

  // DELETE — remove aluno permanentemente
  if (req.method === "DELETE") {
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      return res.status(500).json({ error: "Erro ao excluir aluno" });
    }

    // profiles e lesson_progress são removidos em cascata via FK
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
