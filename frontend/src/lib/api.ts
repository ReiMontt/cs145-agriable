// Centralized API client for the AgriAble AWS backend.
// All frontend requests go through here.

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://18.210.79.21";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const detail =
      (body && typeof body === "object" && "detail" in body
        ? // FastAPI validation errors / messages
          JSON.stringify((body as { detail: unknown }).detail)
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(detail, res.status, body);
  }

  return body as T;
}

// ---------- Types ----------
export type HealthResponse = { status: string; system: string };

export type DashboardStats = {
  total_kg_dispensed: string | number;
  total_transactions: number;
  total_registered_farmers: number;
  active_machines: number;
};

export type RecentLog = {
  id: string;
  session_id: string;
  target_id: string;
  source_id: string;
  changed_kg: number;
  timestamp: string;
  farmer_name?: string | null;
};

export type Farmer = {
  id: string;
  national_id: string;
  name: string;
  total_quota_kg: number;
  remaining_quota_kg: number;
  created_at: string;
  role: string;
};

export type ScanRequest = {
  uin: string;
  name: string;
  dob: string;
  machine_id: string;
  location1?: string | null;
  location3?: string | null;
  zone?: string | null;
  postal_code?: string | null;
  address_line1?: string | null;
};

export type VerifyFarmerResponse = {
  status?: string;
  session_id?: string;
  farmer?: Farmer;
  remaining_quota_kg?: number;
  message?: string;
  // Backend returns flexible shape — keep open
  [k: string]: unknown;
};

export type DispenseLog = {
  session_id: string;
  target_id: string;
  source_id: string;
  changed_kg: number;
};

export type FarmerRegister = {
  national_id: string;
  name: string;
  quota_kg?: number;
};

export type QuotaUpdate = {
  new_quota_kg: number;
  reset_remaining?: boolean;
};

// ---------- Endpoints ----------
export const api = {
  health: () => request<HealthResponse>("/api/health"),

  verifyFarmer: (payload: ScanRequest) =>
    request<VerifyFarmerResponse>("/api/verify-farmer", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logTransaction: (payload: DispenseLog) =>
    request<{ status?: string; [k: string]: unknown }>("/api/log-transaction", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  cancelSession: (session_id: string) =>
    request<{ status?: string }>("/api/cancel-session", {
      method: "POST",
      body: JSON.stringify({ session_id }),
    }),

  dashboardStats: () => request<DashboardStats>("/api/dashboard-stats"),

  recentLogs: () =>
    request<{ status: string; data: RecentLog[] }>("/api/recent-logs"),

  // The OpenAPI schema exposes farmers under /api/admin/farmers.
  // /api/farmers does not exist; we alias to the admin endpoint for the
  // RSBSA Registry / farmer list use cases.
  farmers: () =>
    request<{ status: string; data: Farmer[] }>("/api/admin/farmers"),

  registerFarmer: (payload: FarmerRegister) =>
    request<{ status?: string; data?: Farmer }>("/api/admin/farmers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateFarmerQuota: (national_id: string, payload: QuotaUpdate) =>
    request<{ status?: string }>(
      `/api/admin/farmers/${encodeURIComponent(national_id)}/quota`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),

  deleteFarmer: (national_id: string) =>
    request<{ status?: string }>(
      `/api/admin/farmers/${encodeURIComponent(national_id)}`,
      { method: "DELETE" },
    ),
};
