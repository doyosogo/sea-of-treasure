import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import saveRoutes from "./routes/save.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/save", saveRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
