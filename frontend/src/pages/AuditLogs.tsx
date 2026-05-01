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
import { api, ApiError, type RecentLog, type DashboardStats } from "@/lib/api";
import {
  Sprout,
  Home,
  RefreshCw,
  Loader2,
  Search,
  ScrollText,
  Activity,
  Boxes,
  Users,
  Cpu,
} from "lucide-react";

const AuditLogs = () => {
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, statsRes] = await Promise.all([api.recentLogs(), api.dashboardStats()]);
      setLogs(logsRes.data ?? []);
      setStats(statsRes);
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? `${e.message} (HTTP ${e.status})`
          : e instanceof Error
          ? e.message
          : "Failed to load logs";
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
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.target_id?.toLowerCase().includes(q) ||
        l.source_id?.toLowerCase().includes(q) ||
        l.session_id?.toLowerCase().includes(q) ||
        l.farmer_name?.toLowerCase().includes(q),
    );
  }, [logs, search]);

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof Activity;
    label: string;
    value: string | number;
  }) => (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-body text-muted-foreground">{label}</p>
          <p className="font-heading font-bold text-lg truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
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
        <span className="text-muted-foreground font-body">/ Audit Logs</span>
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
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold">Audit Logs</h1>
              <p className="text-sm text-muted-foreground font-body">
                Recent dispense transactions across all machines.
              </p>
            </div>
          </div>
          <Button variant="outline" className="press" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
          <StatCard
            icon={Boxes}
            label="Total kg dispensed"
            value={stats ? `${stats.total_kg_dispensed} kg` : "—"}
          />
          <StatCard icon={Activity} label="Total transactions" value={stats?.total_transactions ?? "—"} />
          <StatCard icon={Users} label="Registered farmers" value={stats?.total_registered_farmers ?? "—"} />
          <StatCard icon={Cpu} label="Active machines" value={stats?.active_machines ?? "—"} />
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by farmer, UIN, machine, or session…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 font-body"
          />
        </div>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="p-4 text-sm font-body text-destructive">
              Failed to load logs: {error}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-sm font-body text-muted-foreground">Loading audit trail…</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="font-heading font-semibold">No transactions found</p>
              <p className="text-sm text-muted-foreground font-body mt-1">
                {logs.length === 0 ? "No activity recorded yet." : "Try a different search."}
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
                      <TableHead className="font-heading">Timestamp</TableHead>
                      <TableHead className="font-heading">Farmer</TableHead>
                      <TableHead className="font-heading">Amount</TableHead>
                      <TableHead className="font-heading">Machine</TableHead>
                      <TableHead className="font-heading">Session</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow key={l.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-body text-muted-foreground whitespace-nowrap">
                          {l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="font-body">
                          <div className="flex flex-col">
                            <span className="font-medium">{l.farmer_name ?? "Unknown"}</span>
                            <span className="text-xs font-mono text-muted-foreground">{l.target_id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-body">{Number(l.changed_kg)} kg</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{l.source_id}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">
                          {l.session_id}
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
          Showing {filtered.length} of {logs.length} transactions • Source: <code>GET /api/recent-logs</code>
        </p>
      </main>
    </div>
  );
};

export default AuditLogs;
