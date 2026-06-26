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

  console.error(error);

  return response.status(500).json({
    error: "Internal server error."
  });
}
