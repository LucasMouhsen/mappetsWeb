const isBrowser = typeof window !== "undefined";
const isHttpsContext = isBrowser && window.location.protocol === "https:";

export const VITE_API_BASE_URL = isHttpsContext
    ? "https://secure-api.mappets.com.ar"
    : "http://api.mappets.com.ar:3000";

export const API_BASE_URL = VITE_API_BASE_URL.replace(/\/$/, "");