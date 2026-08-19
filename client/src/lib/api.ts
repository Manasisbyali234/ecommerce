const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const TOKEN_KEY = "metromindz_access_token";

export function getAccessToken() { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
export function setAccessToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
export function clearAccessToken() { localStorage.removeItem(TOKEN_KEY); }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const hasBody = options.body !== undefined && options.body !== null;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(hasBody ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...options.headers } });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export const authApi = {
  requestOtp: (phone: string) => api<{ message: string; debugOtp?: string }>("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, code: string) => api<{ token: string; user: { phone?: string; fullName?: string } }>("/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code }) }),
  adminLogin: (email: string, password: string) => api<{ token: string; user: { role: string; fullName?: string; email?: string } }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};
