import { API_BASE_URL } from "../config";

function extractErrorMessage(payload) {
  if (!payload) return "No se pudo completar la solicitud.";
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors[0].msg || payload.errors[0].message || "Datos invalidos.";
  }
  return "No se pudo completar la solicitud.";
}

async function request(path, token, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data;
}

function asArray(payload, key = "requests") {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload[key])) return payload[key];
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export function normalizePhoneTo54(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("54") ? `+${digits}` : `+54${digits}`;
}

export function denormalizePhoneFrom54(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("54") ? digits.slice(2) : digits;
}

export async function fetchCommerceTypes() {
  const payload = await request("/api/commerce/types");
  return asArray(payload);
}

export async function createCommerceRequest(formData) {
  return request("/api/commerce/requests", null, {
    method: "POST",
    body: formData
  });
}

export async function fetchAdminCommerceRequests(token, status = "PENDING") {
  const statusQuery = status ? `?status=${encodeURIComponent(status)}` : "";
  const payload = await request(`/api/admin/commerce/requests${statusQuery}`, token);
  return asArray(payload);
}

export async function fetchAdminCommerceRequestById(token, commerceId) {
  if (!commerceId) throw new Error("commerceId es obligatorio.");
  return request(`/api/admin/commerce/requests/${commerceId}`, token);
}

export async function updateAdminCommerce(token, commerceId, formData) {
  return request(`/admin/commerce/${commerceId}`, token, {
    method: "PUT",
    body: formData
  });
}

async function updateCommerceRequestStatus(token, commerceId, action, notes = "") {
  if (!commerceId) throw new Error("commerceId es obligatorio.");
  return request(`/api/admin/commerce/requests/${commerceId}/${action}`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: String(notes || "").trim() || null })
  });
}

export async function approveAdminCommerceRequest(token, commerceId, notes = "") {
  return updateCommerceRequestStatus(token, commerceId, "approve", notes);
}

export async function rejectAdminCommerceRequest(token, commerceId, notes = "") {
  return updateCommerceRequestStatus(token, commerceId, "reject", notes);
}

export async function suspendAdminCommerceRequest(token, commerceId, notes = "") {
  return updateCommerceRequestStatus(token, commerceId, "suspend", notes);
}

export function resolveAdminCommerceImageUrl(imagePath) {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const apiBase = API_BASE_URL.replace(/\/$/, "");
  return `${apiBase}/public/images/${encodeURIComponent(imagePath)}`;
}
