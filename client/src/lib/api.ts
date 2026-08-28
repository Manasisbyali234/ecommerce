// Use Next's same-origin proxy by default. This avoids browser CORS failures on refresh.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/backend-api";
const TOKEN_KEY = "metromindz_access_token";

export function getAccessToken() { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
export function setAccessToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearAccessToken() { localStorage.removeItem(TOKEN_KEY); }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const response = await fetch(`${API_URL}${path}`, { ...options, cache: options.cache || "no-store", headers: { ...(hasBody ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

/** Uploads an admin image directly to the configured Cloudflare R2 folder. */
export async function uploadImage(folder: "products" | "banners" | "categories" | "sub-categories" | "brands" | "favicon", file: File): Promise<string> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/admin/uploads/${folder}`, {
    method: "PUT",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Image upload failed");
  return data.image.url as string;
}

/** Fetches an authenticated file returned by the API and prompts a browser download. */
export async function downloadApiFile(path: string, fallbackName: string) {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {}, cache: "no-store" });
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || "File download failed"); }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const name = disposition.match(/filename="?([^";]+)"?/)?.[1] || fallbackName;
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

export const authApi = {
  requestOtp: (phone: string) => api<{ message: string; debugOtp?: string }>("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string) => api<{ token: string; user: { phone?: string; fullName?: string } }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, otp }) }),
  adminLogin: (email: string, password: string) => api<{ token: string; user: { role: string; fullName?: string; email?: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};
