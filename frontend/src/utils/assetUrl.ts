import { api } from "../services/api";

const hasProtocol = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

const ensureTrailingSlash = (value: string) => (value.endsWith("/") ? value : `${value}/`);

export const resolveAssetUrl = (rawUrl?: string | null) => {
  const value = rawUrl?.trim();
  if (!value) return "";

  if (hasProtocol(value) || value.startsWith("blob:") || value.startsWith("data:")) {
    return value;
  }

  const baseURL = typeof api.defaults.baseURL === "string" ? api.defaults.baseURL.trim() : "";

  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  if (!baseURL) {
    return value;
  }

  try {
    return new URL(value, ensureTrailingSlash(baseURL)).toString();
  } catch {
    return value;
  }
};
