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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}

const pick = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

function asReports(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.reports)) return payload.reports;
  return [];
}

function isResolved(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized !== "pending" && normalized !== "";
}

function fullName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Usuario sin nombre"
  );
}

function ownerNameFromPet(pet) {
  if (!pet?.owner) return "";
  return (
    [pet.owner.firstName, pet.owner.lastName].filter(Boolean).join(" ").trim() ||
    pet.owner.email ||
    ""
  );
}

function imageFilesFromPet(pet) {
  if (!Array.isArray(pet?.images)) return [];
  return pet.images.map((image) => image?.file).filter(Boolean);
}

function normalizeReport(report) {
  const pet = report?.pet || null;
  const reporter = report?.reporter || null;
  const imageFiles = imageFilesFromPet(pet);
  const reportId = report?.reportId ?? null;

  return {
    id: String(reportId ?? crypto.randomUUID()),
    reportId,
    petId: report?.petId || pet?.petId || "",
    userId: report?.reporterUserId || reporter?.userId || "",
    reason: report?.reason || "Sin motivo",
    status: report?.status || "pending",
    resolved: isResolved(report?.status),
    resolvedAt: report?.resolvedAt || null,
    createdAt: report?.createdAt || report?.updatedAt || new Date().toISOString(),
    updatedAt: report?.updatedAt || null,
    petName: pet?.name || "Mascota sin nombre",
    petBreed: pet?.breed?.name || "",
    ownerName: ownerNameFromPet(pet),
    ownerEmail: pet?.owner?.email || "",
    reporterName: fullName(reporter),
    reporterEmail: reporter?.email || "",
    imageFiles,
    imageUrl: imageFiles[0] || ""
  };
}

export function sortReportsByPriority(a, b) {
  if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export async function fetchAdminPetReports(token) {
  const payload = await request("/admin/reports", token);
  return asReports(payload).map(normalizeReport).sort(sortReportsByPriority);
}

export async function resolveAdminPetReport(token, reportId, decision = "approve") {
  if (!reportId) throw new Error("reportId es obligatorio para resolver un reporte.");
  return request("/admin/pets/reports/resolve", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId: pick(reportId, ""),
      decision
    })
  });
}
