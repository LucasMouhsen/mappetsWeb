import { API_BASE_URL } from "../config";

const ADMIN_TOKEN_KEY = "mappets_admin_access_token";

function extractErrorMessage(payload) {
  if (!payload) return "No se pudo completar la solicitud.";
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
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

function pickToken(payload) {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (typeof payload?.token === "string" && payload.token.trim()) return payload.token.trim();
  if (typeof payload?.jwt === "string" && payload.jwt.trim()) return payload.jwt.trim();
  if (typeof payload?.accessToken === "string" && payload.accessToken.trim()) {
    return payload.accessToken.trim();
  }
  if (typeof payload?.data?.token === "string" && payload.data.token.trim()) {
    return payload.data.token.trim();
  }
  return "";
}

export async function loginAdminWithEmailPassword(email, password) {
  const payload = await request("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const token = pickToken(payload);
  if (!token) {
    throw new Error("El backend no devolvio un token administrativo valido.");
  }
  return token;
}

export function getStoredAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function storeAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearStoredAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
