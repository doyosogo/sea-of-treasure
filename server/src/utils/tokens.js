import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "30d";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createAccessToken(payload) {
  return jwt.sign(payload, getSecret("JWT_ACCESS_SECRET"), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });
}

export function createRefreshToken(payload) {
  return jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret("JWT_ACCESS_SECRET"));
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret("JWT_REFRESH_SECRET"));
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiry(now = Date.now()) {
  return new Date(now + REFRESH_TOKEN_TTL_MS);
}

function getSecret(name) {
  const secret = process.env[name];

  if (!secret) {
    throw new Error(`${name} is required.`);
  }

  return secret;
}
