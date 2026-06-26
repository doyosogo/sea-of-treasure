const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request(path, accessToken, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {})
    }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Cloud save request failed.");
  }

  return payload;
}

export function getCloudSave(accessToken) {
  return request("/api/save", accessToken);
}

export function uploadCloudSave(save, accessToken) {
  return request("/api/save", accessToken, {
    method: "PUT",
    body: JSON.stringify({
      data: save,
      version: "1.0"
    })
  });
}
