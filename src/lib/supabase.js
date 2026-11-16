import { createClient } from "@supabase/supabase-js";
import { isGestaoApp } from "./app-env";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey = "placeholder-anon-key";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error("Supabase: variáveis de ambiente não configuradas. Verifique o arquivo .env");
}

export const supabase = createClient(
  supabaseUrl || fallbackSupabaseUrl,
  supabaseAnonKey || fallbackSupabaseAnonKey,
  // A gestão guarda a sessão em outra chave: entrar (ou sair) em um
  // ambiente não afeta o outro, mesmo no mesmo navegador.
  isGestaoApp() ? { auth: { storageKey: "neuralhub-gestao-auth" } } : undefined,
);
