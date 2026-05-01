import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError, type Farmer } from "@/lib/api";
import {
  Sprout,
  Home,
  RefreshCw,
  Loader2,
  Search,
  ClipboardList,
  IdCard,
  User as UserIcon,
  Download,
} from "lucide-react";

const downloadCsv = (rows: Farmer[]) => {
  const header = ["national_id", "name", "role", "total_quota_kg", "remaining_quota_kg", "created_at"];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      header
        .map((k) => {
          const v = (r as unknown as Record<string, unknown>)[k];
          const s = v == null ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rsbsa-registry-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const RsbsaRegistry = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.farmers();
      setFarmers(res.data ?? []);
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? `${e.message} (HTTP ${e.status})`
          : e instanceof Error
          ? e.message
          : "Failed to load registry";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return farmers;
    return farmers.filter(
      (f) => f.national_id.toLowerCase().includes(q) || f.name.toLowerCase().includes(q),
    );
  }, [farmers, search]);

  const totals = useMemo(
    () => ({
      count: farmers.length,
      quota: farmers.reduce((s, f) => s + (Number(f.total_quota_kg) || 0), 0),
      remaining: farmers.reduce((s, f) => s + (Number(f.remaining_quota_kg) || 0), 0),
    }),
    [farmers],
  );

  return (
    <div className="min-h-screen bg-background bg-topo">
      <header className="h-14 flex items-center border-b px-4 gap-3 bg-background sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2 press">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-semibold">AgriAble</span>
        </Link>
        <span className="text-muted-foreground font-body">/ RSBSA Registry</span>
        <Link to="/" className="ml-auto">
          <Button variant="ghost" size="sm" className="press">
            <Home className="w-4 h-4 mr-1.5" /> Home
          </Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">RSBSA Registry</h1>
              <p className="text-sm text-muted-foreground font-body">
                Registry System for Basic Sectors in Agriculture — registered farmers and quotas.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="press"
              onClick={() => downloadCsv(filtered)}
              disabled={loading || filtered.length === 0}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV
            </Button>
            <Button variant="outline" className="press" onClick={refresh} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-body text-muted-foreground">Registered farmers</p>
              <p className="font-heading font-bold text-2xl">{totals.count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-body text-muted-foreground">Total quota</p>
              <p className="font-heading font-bold text-2xl">{totals.quota.toFixed(1)} kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-body text-muted-foreground">Remaining quota</p>
              <p className="font-heading font-bold text-2xl">{totals.remaining.toFixed(1)} kg</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by national ID or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-body"
          />
        </div>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="p-4 text-sm font-body text-destructive">
              Failed to load registry: {error}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-sm font-body text-muted-foreground">Loading registry…</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="font-heading font-semibold">No farmers found</p>
              <p className="text-sm text-muted-foreground font-body mt-1">
                {farmers.length === 0 ? "Registry is empty." : "Try a different search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-heading">Farmer</TableHead>
                      <TableHead className="font-heading">National ID</TableHead>
                      <TableHead className="font-heading">Role</TableHead>
                      <TableHead className="font-heading">Total Quota</TableHead>
                      <TableHead className="font-heading">Remaining</TableHead>
                      <TableHead className="font-heading">Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-body">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <UserIcon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{f.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                            <IdCard className="w-3 h-3" />
                            {f.national_id}
                          </span>
                        </TableCell>
                        <TableCell className="font-body capitalize text-muted-foreground">{f.role}</TableCell>
                        <TableCell className="font-body">{Number(f.total_quota_kg)} kg</TableCell>
                        <TableCell className="font-body">{Number(f.remaining_quota_kg)} kg</TableCell>
                        <TableCell className="font-body text-muted-foreground whitespace-nowrap">
                          {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground font-body">
          Showing {filtered.length} of {farmers.length} farmers • Source: <code>GET /api/admin/farmers</code>
        </p>
      </main>
    </div>
  );
};

export default RsbsaRegistry;
