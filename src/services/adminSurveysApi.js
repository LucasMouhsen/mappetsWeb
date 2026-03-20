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

function fullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email || "";
}

function normalizeSurvey(item) {
  return {
    surveyId: item?.surveyId || "",
    selected: Number(item?.selected || 0),
    description: item?.description || "",
    createdAt: item?.createdAt || null,
    petId: item?.petId || item?.Pet?.petId || "",
    petName: item?.Pet?.name || "Mascota sin nombre",
    petIsDog: item?.Pet?.isDog,
    petOwnerName: fullName(item?.Pet?.User),
    petOwnerEmail: item?.Pet?.User?.email || "",
    userName: fullName(item?.User),
    userEmail: item?.User?.email || "",
    helperName: fullName(item?.Helper),
    helperEmail: item?.Helper?.email || "",
    imageUrl: item?.Pet?.ImagesPets?.[0]?.imagePet || "",
  };
}

export async function fetchAdminSurveys(token) {
  const payload = await request("/admin/surveys", token);
  const raw = Array.isArray(payload) ? payload : payload?.surveys;
  return Array.isArray(raw) ? raw.map(normalizeSurvey) : [];
}
