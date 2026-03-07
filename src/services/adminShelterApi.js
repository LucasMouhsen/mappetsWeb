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

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.requests)) return payload.requests;
  return [];
}

export async function fetchAdminShelterRequests(token, status = "PENDING") {
  const statusQuery = status ? `?status=${encodeURIComponent(status)}` : "";
  const payload = await request(`/admin/shelters/requests${statusQuery}`, token);
  return asArray(payload);
}

async function updateShelterRequestStatus(token, userRoleId, action, notes = "") {
  if (!userRoleId) throw new Error("userRoleId es obligatorio.");
  return request(`/admin/shelters/requests/${userRoleId}/${action}`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: String(notes || "").trim() || null })
  });
}

export async function approveAdminShelterRequest(token, userRoleId, notes = "") {
  return updateShelterRequestStatus(token, userRoleId, "approve", notes);
}

export async function rejectAdminShelterRequest(token, userRoleId, notes = "") {
  return updateShelterRequestStatus(token, userRoleId, "reject", notes);
}

export async function suspendAdminShelterRequest(token, userRoleId, notes = "") {
  return updateShelterRequestStatus(token, userRoleId, "suspend", notes);
}

export function resolveAdminUserImageUrl(imagePath) {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const apiBase = API_BASE_URL.replace(/\/$/, "");
  return `${apiBase}/public/images/${encodeURIComponent(`profiles/${imagePath}`)}`;
}
