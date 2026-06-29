import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export function getHealth(_request, response) {
  response.json({
    status: "ok",
    service: "sea-of-treasure-api",
    environment: env.environment,
    timestamp: new Date().toISOString()
  });
}

export async function getDatabaseHealth(_request, response) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return response.json({
      status: "ok",
      service: "sea-of-treasure-api",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database health check failed.", error);

    return response.status(503).json({
      status: "error",
      service: "sea-of-treasure-api",
      database: "unavailable",
      timestamp: new Date().toISOString()
    });
  }
}
