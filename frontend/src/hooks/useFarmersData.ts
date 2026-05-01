import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Farmer, type RecentLog } from "@/lib/api";

export type FarmerRow = {
  national_id: string;
  name: string;
  role: "farmer" | "admin" | null;
  quota_kg: number; // total quota
  used_kg: number; // total - remaining
  remaining_kg: number;
};

export type TransactionRow = {
  id: string;
  target_id: string | null;
  source_id: string | null;
  changed_kg: number;
  timestamp: string | null;
  farmer_name?: string | null;
};

function toRow(f: Farmer): FarmerRow {
  const total = Number(f.total_quota_kg) || 0;
  const remaining = Number(f.remaining_quota_kg) || 0;
  return {
    national_id: f.national_id,
    name: f.name,
    role: (f.role as "farmer" | "admin" | null) ?? "farmer",
    quota_kg: total,
    used_kg: Math.max(0, total - remaining),
    remaining_kg: remaining,
  };
}

function toTx(l: RecentLog): TransactionRow {
  return {
    id: l.id,
    target_id: l.target_id ?? null,
    source_id: l.source_id ?? null,
    changed_kg: Number(l.changed_kg) || 0,
    timestamp: l.timestamp ?? null,
    farmer_name: l.farmer_name ?? null,
  };
}

export function useFarmersData() {
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [farmersRes, logsRes] = await Promise.all([
        api.farmers(),
        api.recentLogs(),
      ]);
      setFarmers((farmersRes.data ?? []).map(toRow));
      setTransactions((logsRes.data ?? []).map(toTx));
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? `${e.message} (HTTP ${e.status})`
          : e instanceof Error
          ? e.message
          : "Failed to load data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { farmers, transactions, loading, error, refresh };
}
