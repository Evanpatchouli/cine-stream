const API_BASE =
  import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:8793/api";

function getApiOrigin() {
  return new URL(API_BASE, window.location.origin).origin;
}

export function resolveMediaUrl(url?: string) {
  if (!url) {
    return "";
  }

  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/api/")) {
    return `${getApiOrigin()}${url}`;
  }

  return url;
}
