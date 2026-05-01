import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api, ApiError, type Farmer } from "@/lib/api";
import {
  Sprout,
  Home,
  Cpu,
  ScanLine,
  Send,
  Ban,
  RefreshCw,
  Loader2,
  Terminal,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type LogLevel = "info" | "ok" | "err" | "tx";
type LogEntry = { ts: string; level: LogLevel; msg: string };

const DEFAULT_MACHINE = "SIMULATOR_ESP32";

const HwSimulator = () => {
  const [machineId, setMachineId] = useState(DEFAULT_MACHINE);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [selectedUin, setSelectedUin] = useState<string>("");
  const [dob, setDob] = useState("1990-01-01");
  const [kg, setKg] = useState("2.5");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [logging, setLogging] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const append = (level: LogLevel, msg: string) =>
    setLogs((prev) => [
      ...prev,
      { ts: new Date().toLocaleTimeString(), level, msg },
    ]);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight });
  }, [logs]);

  const loadFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const res = await api.farmers();
      setFarmers(res.data ?? []);
      append("info", `Loaded ${res.data?.length ?? 0} farmer(s) from RSBSA registry.`);
      if (!selectedUin && res.data?.[0]) setSelectedUin(res.data[0].national_id);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
      append("err", `GET /api/admin/farmers failed: ${msg}`);
    } finally {
      setLoadingFarmers(false);
    }
  };

  useEffect(() => {
    append("info", "ESP32 simulator ready. Boot sequence complete.");
    loadFarmers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedFarmer = farmers.find((f) => f.national_id === selectedUin) ?? null;

  const verify = async () => {
    if (!selectedFarmer) {
      toast({ title: "Pick a farmer first", variant: "destructive" });
      return;
    }
    setVerifying(true);
    append("info", `[SCAN] UIN=${selectedFarmer.national_id} -> POST /api/verify-farmer`);
    try {
      const res = await api.verifyFarmer({
        uin: selectedFarmer.national_id,
        name: selectedFarmer.name,
        dob,
        machine_id: machineId,
      });
      const sid =
        (res.session_id as string | undefined) ??
        (res.session as { id?: string } | undefined)?.id ??
        null;
      setSessionId(sid);
      append("ok", `Verified ${selectedFarmer.name}. session_id=${sid ?? "(none)"}`);
      const remaining =
        (res.remaining_quota_kg as number | undefined) ??
        (res.farmer as Farmer | undefined)?.remaining_quota_kg;
      if (typeof remaining === "number") {
        append("info", `Remaining quota: ${remaining} kg`);
      }
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
      append("err", `verify-farmer failed: ${msg}`);
    } finally {
      setVerifying(false);
    }
  };

  const log = async () => {
    if (!sessionId || !selectedFarmer) {
      toast({ title: "No active session", description: "Verify a farmer first.", variant: "destructive" });
      return;
    }
    const changed = parseFloat(kg);
    if (!Number.isFinite(changed) || changed <= 0) {
      toast({ title: "Invalid weight", variant: "destructive" });
      return;
    }
    setLogging(true);
    append("tx", `[DISPENSE] ${changed} kg -> POST /api/log-transaction`);
    try {
      await api.logTransaction({
        session_id: sessionId,
        target_id: selectedFarmer.national_id,
        source_id: machineId,
        changed_kg: Number(changed.toFixed(2)),
      });
      append("ok", `Transaction logged. Session ${sessionId} closed.`);
      setSessionId(null);
      // refresh farmers to reflect new remaining quota
      loadFarmers();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
      append("err", `log-transaction failed: ${msg}`);
    } finally {
      setLogging(false);
    }
  };

  const cancel = async () => {
    if (!sessionId) return;
    setCancelling(true);
    append("info", `[ABORT] POST /api/cancel-session ${sessionId}`);
    try {
      await api.cancelSession(sessionId);
      append("ok", `Session ${sessionId} cancelled.`);
      setSessionId(null);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e);
      append("err", `cancel-session failed: ${msg}`);
    } finally {
      setCancelling(false);
    }
  };

  const levelClass: Record<LogLevel, string> = {
    info: "text-muted-foreground",
    ok: "text-primary",
    err: "text-destructive",
    tx: "text-accent-foreground bg-accent/30 px-1 rounded",
  };

  const LevelIcon = ({ l }: { l: LogLevel }) => {
    if (l === "ok") return <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />;
    if (l === "err") return <XCircle className="w-3.5 h-3.5 inline mr-1" />;
    return <Terminal className="w-3.5 h-3.5 inline mr-1" />;
  };

  return (
    <div className="min-h-screen bg-background bg-topo">
      <header className="h-14 flex items-center border-b px-4 gap-3 bg-background sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2 press">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-semibold">AgriAble</span>
        </Link>
        <span className="text-muted-foreground font-body">/ HW Simulator</span>
        <Link to="/" className="ml-auto">
          <Button variant="ghost" size="sm" className="press">
            <Home className="w-4 h-4 mr-1.5" /> Home
          </Button>
        </Link>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">ESP32 Hardware Simulator</h1>
            <p className="text-sm text-muted-foreground font-body">
              Emulates the dispenser firmware: scan → verify → dispense → log.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold">Device</h2>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    sessionId ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {sessionId ? "SESSION ACTIVE" : "IDLE"}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="machine">Machine ID</Label>
                <Input id="machine" value={machineId} onChange={(e) => setMachineId(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Farmer (RSBSA)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 press"
                    onClick={loadFarmers}
                    disabled={loadingFarmers}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingFarmers ? "animate-spin" : ""}`} />
                    Reload
                  </Button>
                </div>
                <Select value={selectedUin} onValueChange={setSelectedUin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farmer to scan" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.map((f) => (
                      <SelectItem key={f.national_id} value={f.national_id}>
                        {f.name} — {f.national_id} ({f.remaining_quota_kg} kg left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dob">DOB</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kg">Dispense (kg)</Label>
                  <Input
                    id="kg"
                    type="number"
                    min={0}
                    step="0.1"
                    value={kg}
                    onChange={(e) => setKg(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <Button className="press" onClick={verify} disabled={verifying || !selectedFarmer}>
                  {verifying ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ScanLine className="w-4 h-4 mr-1.5" />}
                  Scan + Verify
                </Button>
                <Button className="press" variant="secondary" onClick={log} disabled={logging || !sessionId}>
                  {logging ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                  Log Transaction
                </Button>
                <Button
                  className="press"
                  variant="outline"
                  onClick={cancel}
                  disabled={cancelling || !sessionId}
                >
                  {cancelling ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Ban className="w-4 h-4 mr-1.5" />}
                  Cancel Session
                </Button>
              </div>

              {selectedFarmer && (
                <div className="text-xs font-body text-muted-foreground pt-2 border-t">
                  Selected: <span className="font-medium text-foreground">{selectedFarmer.name}</span> —
                  remaining {selectedFarmer.remaining_quota_kg} / {selectedFarmer.total_quota_kg} kg
                </div>
              )}
            </CardContent>
          </Card>

          {/* Serial console */}
          <Card className="animate-fade-in">
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-muted-foreground" />
                  <span className="font-heading text-sm font-semibold">Serial console</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 press" onClick={() => setLogs([])}>
                  Clear
                </Button>
              </div>
              <div
                ref={consoleRef}
                className="h-[420px] overflow-y-auto bg-foreground/[0.03] font-mono text-xs p-3 space-y-1"
              >
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">No output yet.</p>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className={levelClass[l.level]}>
                      <span className="opacity-60">{l.ts}</span>{" "}
                      <LevelIcon l={l.level} />
                      {l.msg}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HwSimulator;
