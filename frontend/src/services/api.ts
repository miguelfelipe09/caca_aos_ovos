import axios from "axios";
import { useAuthStore } from "../store/authStore";

const envBaseURL = import.meta.env.VITE_API_URL?.trim();
const baseURL = envBaseURL || (import.meta.env.DEV ? "http://localhost:4000" : "");

const defaultHeaders: Record<string, string> = {
  Accept: "application/json",
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

// Only send this header when requests actually go through ngrok.
if (baseURL.includes("ngrok-free.app")) {
  defaultHeaders["ngrok-skip-browser-warning"] = "true";
}

export const api = axios.create({
  baseURL,
  headers: defaultHeaders,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
