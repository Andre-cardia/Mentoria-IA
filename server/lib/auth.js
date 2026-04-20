import { createClient } from "@supabase/supabase-js";

export function createServiceSupabaseClient() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return null;
  }

  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

export function getBearerToken(req) {
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7).trim();
}

export async function getAuthenticatedUser(req, supabase = createServiceSupabaseClient()) {
  if (!supabase) {
    return { user: null, error: "missing_supabase" };
  }

  const token = getBearerToken(req);
  if (!token) {
    return { user: null, error: "missing_token" };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: "invalid_token" };
  }

  return { user, error: null };
}

export async function requireAuthenticatedUser(req, res, options = {}) {
  const { supabase = createServiceSupabaseClient(), requireAdmin = false } = options;
  const { user, error } = await getAuthenticatedUser(req, supabase);

  if (error === "missing_supabase") {
    res.status(503).json({ error: "Supabase não configurado" });
    return null;
  }

  if (error === "missing_token") {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (error) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }

  if (requireAdmin && user.user_metadata?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return user;
}
