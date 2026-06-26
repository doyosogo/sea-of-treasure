const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const hasJson = response.headers.get("content-type")?.includes("application/json");
  const payload = hasJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Authentication request failed.");
  }

  return payload;
}

export function register({ username, email, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password })
  });
}

export function login({ identifier, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: identifier, username: identifier, password })
  });
}

export function logout(refreshToken) {
  if (!refreshToken) {
    return Promise.resolve({ success: true });
  }

  return request("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export function refresh(refreshToken) {
  return request("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export function getCurrentUser(accessToken) {
  return request("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
