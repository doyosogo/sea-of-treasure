import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(request, response, next) {
  const header = request.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ error: "Missing bearer token." });
  }

  try {
    const payload = verifyAccessToken(token);

    if (!payload.sub) {
      return response.status(401).json({ error: "Invalid or expired token." });
    }

    request.user = {
      id: payload.sub
    };
    return next();
  } catch {
    return response.status(401).json({ error: "Invalid or expired token." });
  }
}
