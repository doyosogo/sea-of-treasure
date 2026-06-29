import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required."),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required."),
  PORT: z.coerce.number().int().positive("PORT must be a positive integer."),
  CLIENT_ORIGIN: z.string().min(1, "CLIENT_ORIGIN is required."),
  NODE_ENV: z.string().optional().default("development")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues.map((issue) => `- ${issue.message}`).join("\n");
  throw new Error(`Invalid server environment configuration:\n${details}`);
}

export const env = {
  ...parsedEnv.data,
  environment: parsedEnv.data.NODE_ENV
};
