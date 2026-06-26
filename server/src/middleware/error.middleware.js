import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function notFoundMiddleware(request, response) {
  response.status(404).json({
    error: `Route not found: ${request.method} ${request.originalUrl}`
  });
}

export function errorMiddleware(error, _request, response, _next) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: "Validation failed.",
      details: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return response.status(409).json({
      error: "Email or username is already registered."
    });
  }

  if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
    return response.status(401).json({
      error: "Invalid or expired token."
    });
  }

  console.error(error);

  return response.status(500).json({
    error: "Internal server error."
  });
}
