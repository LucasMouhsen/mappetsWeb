import { API_BASE_URL } from "../config";

const TOKEN_KEY = "mappets_access_token";

function extractErrorMessage(payload) {
  if (!payload) return "No se pudo completar la solicitud.";
  if (typeof payload.error === "string") return payload.error;
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors[0].msg || payload.errors[0].message || "Datos invalidos.";
  }
  return "No se pudo completar la solicitud.";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}

export async function loginWithEmailPassword(email, password) {
  const payload = await request("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }
  if (payload && typeof payload.token === "string" && payload.token.trim()) {
    return payload.token.trim();
  }
  throw new Error("El backend no devolvio un token valido.");
}

export async function fetchProfile(token) {
  return request("/api/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}
