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

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/ar-points", arPointRoutes);
app.use("/captures", captureRoutes);

// Serve frontend build for single-host deploy (e.g., ngrok free tier)
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit();
});
