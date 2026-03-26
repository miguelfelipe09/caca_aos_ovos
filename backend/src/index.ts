import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import arPointRoutes from "./routes/arPointRoutes.js";
import captureRoutes from "./routes/captureRoutes.js";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../../frontend/dist");
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim();

const corsOptions: cors.CorsOptions = {
  origin: frontendOrigin || true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/ar-points", arPointRoutes);
app.use("/captures", captureRoutes);

// app.use(express.static(distPath));
// app.get("*", (_req, res) => {
//   res.sendFile(path.join(distPath, "index.html"));
// });

const PORT = parseInt(process.env.PORT || "4000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});