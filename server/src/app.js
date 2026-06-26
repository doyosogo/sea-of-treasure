import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
