const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const localApiUrl = import.meta.env.DEV ? "http://localhost:5000" : "";
const apiUrl = configuredApiUrl || localApiUrl;

if (!apiUrl) {
  throw new Error("VITE_API_URL is required for production builds.");
}

export const API_BASE_URL = apiUrl.replace(/\/+$/, "");
