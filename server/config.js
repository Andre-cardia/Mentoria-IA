// dotenv só carrega em dev local — no Vercel as vars são injetadas automaticamente
if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  return value;
};

export const PAGBANK_TOKEN = required("PAGBANK_TOKEN");
export const PAGBANK_ENV = process.env.PAGBANK_ENV || "sandbox";
export const PAGBANK_BASE_URL =
  PAGBANK_ENV === "production"
    ? "https://api.pagseguro.com"
    : "https://sandbox.api.pagseguro.com";

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export const PORT = process.env.PORT || 3001;
