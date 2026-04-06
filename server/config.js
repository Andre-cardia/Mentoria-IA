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

// AWS S3 — Materiais da Plataforma
export const AWS_BUCKET = process.env.AWS_BUCKET || "";
export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
