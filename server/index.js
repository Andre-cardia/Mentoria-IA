import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import pagbankRoutes from "./routes/pagbank.js";
import materialsRoutes from "./routes/materials.js";
import profileRoutes from "./routes/profile.js";
import blogRoutes from "./routes/blog.js";
import { PORT } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

// Rotas da API de pagamento
app.use("/api/pagbank", pagbankRoutes);

// Rotas da plataforma — materiais (upload/download S3)
app.use("/api/materials", materialsRoutes);

// Rotas da plataforma — perfil do aluno (avatar upload, dados)
app.use("/api/profile", profileRoutes);

// Rotas do blog (image upload)
app.use("/api/blog", blogRoutes);

// Em produção, servir o build estático do Vite
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const server = app.listen(PORT, () => {
  const env = process.env.PAGBANK_ENV || "sandbox";
  console.log(`Servidor rodando na porta ${PORT} [PagBank: ${env}]`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Porta ${PORT} já está em uso. Mate o processo anterior e tente de novo.\n`);
  } else {
    console.error("Erro no servidor:", err);
  }
  process.exit(1);
});
