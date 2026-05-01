import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { api, ApiError, type Farmer, type VerifyFarmerResponse } from "@/lib/api";
import {
  Sprout,
  Home,
  ShieldCheck,
  Loader2,
  Package,
  Weight,
  IdCard,
  User as UserIcon,
} from "lucide-react";

const PORTAL_MACHINE_ID = "WEB_PORTAL";

type FormState = {
  uin: string;
  name: string;
  dob: string;
};

const emptyForm: FormState = { uin: "", name: "", dob: "" };

const FarmerPortal = () => {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const verify = async () => {
    if (!form.uin.trim() || !form.name.trim() || !form.dob.trim()) {
      toast({
        title: "Missing fields",
        description: "National ID, name, and date of birth are required.",
        variant: "destructive",
      });
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res: VerifyFarmerResponse = await api.verifyFarmer({
        uin: form.uin.trim(),
        name: form.name.trim(),
        dob: form.dob.trim(),
        machine_id: PORTAL_MACHINE_ID,
      });
      const f =
        (res.farmer as Farmer | undefined) ??
        (res.data as { farmer?: Farmer } | undefined)?.farmer ??
        null;
      const sid =
        (res.session_id as string | undefined) ??
        (res.session as { id?: string } | undefined)?.id ??
        null;
      const rem =
        (res.remaining_quota_kg as number | undefined) ??
        (f?.remaining_quota_kg as number | undefined) ??
        0;
      const tot = (f?.total_quota_kg as number | undefined) ?? 0;

      setFarmer(f);
      setSessionId(sid);
      setRemaining(Number(rem) || 0);
      setTotal(Number(tot) || 0);
      toast({ title: "Verified", description: f?.name ?? "Farmer verified." });

      // Best-effort: release the session so it doesn't lock a machine slot.
      if (sid) {
        api.cancelSession(sid).catch(() => {
          /* ignore */
        });
      }
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError
          ? `${e.message} (HTTP ${e.status})`
          : e instanceof Error
          ? e.message
          : "Verification failed";
      setError(msg);
      setFarmer(null);
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setFarmer(null);
    setError(null);
    setSessionId(null);
    setRemaining(0);
    setTotal(0);
  };

  const usagePct = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background bg-topo">
      <header className="h-14 flex items-center border-b px-4 gap-3 bg-background sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2 press">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-semibold">AgriAble</span>
        </Link>
        <span className="text-muted-foreground font-body">/ Farmer Portal</span>
        <Link to="/" className="ml-auto">
          <Button variant="ghost" size="sm" className="press">
            <Home className="w-4 h-4 mr-1.5" /> Home
          </Button>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-10 space-y-6">
        <div className="space-y-2 animate-fade-in">
          <h1 className="text-3xl font-heading font-bold tracking-tight">Farmer Portal</h1>
          <p className="text-muted-foreground font-body">
            Verify your registration and check your remaining rice quota.
          </p>
        </div>

        {!farmer ? (
          <Card className="animate-fade-in">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="uin">National ID *</Label>
                <Input
                  id="uin"
                  inputMode="numeric"
                  value={form.uin}
                  onChange={(e) => setForm({ ...form, uin: e.target.value })}
                  placeholder="e.g. 5408602380"
                  disabled={verifying}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="As registered"
                  disabled={verifying}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  disabled={verifying}
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm font-body text-destructive">
                  {error}
                </div>
              )}

              <Button className="w-full press h-11 text-base" onClick={verify} disabled={verifying}>
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" /> Verify
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <UserIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-lg truncate">{farmer.name}</p>
                  <p className="text-xs font-mono text-muted-foreground flex items-center gap-1 mt-1">
                    <IdCard className="w-3 h-3" /> {farmer.national_id}
                  </p>
                </div>
                <div className="ml-auto px-3 py-1 rounded-full text-xs font-body bg-primary/10 text-primary capitalize">
                  {farmer.role ?? "farmer"}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="w-7 h-7 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-body">Remaining Quota</p>
                  <p className="text-3xl font-heading font-bold">{remaining} kg</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Weight className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-body">Total Quota</p>
                  <p className="text-3xl font-heading font-bold">{total} kg</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">
                    {(total - remaining).toFixed(1)} / {total} kg
                  </span>
                </div>
                <Progress value={usagePct} className="h-2.5" />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="press flex-1" onClick={reset}>
                Verify another
              </Button>
              <Link to="/kiosk" className="flex-1">
                <Button className="press w-full">Open Kiosk</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerPortal;
