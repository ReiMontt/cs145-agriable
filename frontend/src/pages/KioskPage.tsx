import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { api, ApiError, type Farmer } from "@/lib/api";
import {
  Sprout,
  ScanLine,
  ShieldCheck,
  ShieldX,
  Package,
  Scale,
  Play,
  Square,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Weight,
  Loader2,
} from "lucide-react";

type KioskStep = "welcome" | "scan" | "result" | "quota" | "scale" | "dispensing" | "complete";

const STEP_ORDER: KioskStep[] = ["welcome", "scan", "result", "quota", "scale", "dispensing", "complete"];
const TOTAL_STEPS = 6;

const MACHINE_ID = "SIMULATOR_ESP32";

function getStepNumber(step: KioskStep): number {
  return STEP_ORDER.indexOf(step);
}

const StepIndicator = ({ step }: { step: KioskStep }) => {
  const num = getStepNumber(step);
  if (num < 1) return null;
  const pct = (num / TOTAL_STEPS) * 100;
  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
        <span className="text-xs font-body font-medium text-muted-foreground whitespace-nowrap">
          Step {num} of {TOTAL_STEPS}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const KioskWizard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<KioskStep>("welcome");
  const [scanStatus, setScanStatus] = useState<"waiting" | "verifying" | "done" | "error">("waiting");
  const [scanError, setScanError] = useState<string | null>(null);
  const [verified, setVerified] = useState(true);
  const [scaleStep, setScaleStep] = useState(0);
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispensedWeight, setDispensedWeight] = useState(0);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  // Live verified-farmer state from /api/verify-farmer
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quotaKg, setQuotaKg] = useState<number>(0);
  const [previousUsage, setPreviousUsage] = useState<number>(0);

  const sessionRef = useRef<string | null>(null);
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  // Trigger verify-farmer when entering the scan step
  useEffect(() => {
    if (step !== "scan") return;
    let cancelled = false;
    const run = async () => {
      setScanStatus("waiting");
      setScanError(null);
      try {
        // Simulate the brief "look for card" delay so the UI animation is visible
        await new Promise((r) => setTimeout(r, 1200));
        if (cancelled) return;
        setScanStatus("verifying");

        // ESP32 simulator: pick a registered farmer and submit a scan.
        // In a real device, the UIN/name/dob would come from the QR/NFC chip.
        const farmersRes = await api.farmers();
        if (cancelled) return;
        const list = farmersRes.data ?? [];
        if (list.length === 0) {
          throw new Error("No farmers registered yet. Add one in the Admin Dashboard.");
        }
        const candidate = list[Math.floor(Math.random() * list.length)];

        const verifyRes = await api.verifyFarmer({
          uin: candidate.national_id,
          name: candidate.name,
          dob: "1990/01/01",
          machine_id: MACHINE_ID,
        });
        if (cancelled) return;

        // The backend returns a flexible shape; pull common fields defensively.
        const sid =
          (verifyRes.session_id as string | undefined) ??
          (verifyRes.session as { id?: string } | undefined)?.id ??
          null;
        const f =
          (verifyRes.farmer as Farmer | undefined) ??
          (verifyRes.data as { farmer?: Farmer } | undefined)?.farmer ??
          candidate;
        const remaining =
          (verifyRes.remaining_quota_kg as number | undefined) ??
          (f?.remaining_quota_kg as number | undefined) ??
          candidate.remaining_quota_kg;
        const total =
          (f?.total_quota_kg as number | undefined) ?? candidate.total_quota_kg;

        setSessionId(sid);
        setFarmer(f ?? candidate);
        setQuotaKg(Number(remaining) || 0);
        setPreviousUsage(Math.max(0, (Number(total) || 0) - (Number(remaining) || 0)));
        setVerified(true);
        setScanStatus("done");
        setStep("result");
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? `${e.message} (HTTP ${e.status})`
            : e instanceof Error
            ? e.message
            : "Verification failed";
        setScanError(msg);
        setVerified(false);
        setScanStatus("error");
        setStep("result");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step]);

  // Simulate dispensing
  useEffect(() => {
    if (isDispensing && dispensedWeight < quotaKg) {
      const interval = setInterval(() => {
        setDispensedWeight((prev) => {
          const next = prev + 0.5;
          if (next >= quotaKg) {
            setIsDispensing(false);
            return quotaKg;
          }
          return next;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isDispensing, dispensedWeight, quotaKg]);

  // POST /api/log-transaction once dispensing completes (entering "complete" step)
  useEffect(() => {
    if (step !== "complete") return;
    if (logged || logging) return;
    if (!farmer || !sessionId || dispensedWeight <= 0) return;
    setLogging(true);
    api
      .logTransaction({
        session_id: sessionId,
        target_id: farmer.national_id,
        source_id: MACHINE_ID,
        changed_kg: Number(dispensedWeight.toFixed(2)),
      })
      .then(() => {
        setLogged(true);
        toast({
          title: "Transaction logged",
          description: `${dispensedWeight.toFixed(1)} kg recorded for ${farmer.name}.`,
        });
      })
      .catch((e: unknown) => {
        const msg =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to log transaction";
        toast({ title: "Logging failed", description: msg, variant: "destructive" });
      })
      .finally(() => setLogging(false));
  }, [step, farmer, sessionId, dispensedWeight, logged, logging]);

  const resetKiosk = useCallback(() => {
    // If a session was opened but never logged, cancel it server-side.
    if (sessionRef.current && !logged) {
      api.cancelSession(sessionRef.current).catch(() => {
        /* best-effort */
      });
    }
    setStep("welcome");
    setScanStatus("waiting");
    setScanError(null);
    setVerified(true);
    setScaleStep(0);
    setIsDispensing(false);
    setDispensedWeight(0);
    setFarmer(null);
    setSessionId(null);
    setQuotaKg(0);
    setPreviousUsage(0);
    setLogged(false);
    setLogging(false);
  }, [logged]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      const prev = STEP_ORDER[idx - 1];
      setStep(prev);
      if (prev === "scan") setScanStatus("waiting");
      if (prev === "scale") setScaleStep(0);
      if (prev === "dispensing") {
        setIsDispensing(false);
        setDispensedWeight(0);
      }
    }
  }, [step]);

  const showBack = step !== "welcome" && step !== "complete";

  const BackButton = () =>
    showBack ? (
      <button
        onClick={goBack}
        className="fixed top-14 left-4 sm:left-6 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors press"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
    ) : null;

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <div key="welcome" className="flex flex-col items-center justify-center min-h-screen gap-8 animate-fade-in px-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Sprout className="w-9 h-9 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-heading font-bold text-foreground tracking-tight">
              {t("welcome_title")}
            </h1>
            <p className="text-xl text-muted-foreground font-body max-w-md text-center">
              {t("welcome_subtitle")}
            </p>
            <Button
              size="lg"
              className="mt-6 h-16 px-16 text-xl font-heading font-semibold rounded-xl press"
              onClick={() => setStep("scan")}
            >
              {t("start")}
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        );

      case "scan":
        return (
          <div key="scan" className="flex flex-col items-center justify-center min-h-screen gap-8 animate-fade-in px-8">
            <p className="text-xl text-muted-foreground font-body text-center mb-4">
              {t("scan_instruction")}
            </p>
            <div className="relative w-64 h-64 rounded-2xl border-2 border-dashed border-primary/40 flex items-center justify-center bg-card">
              <ScanLine className="w-20 h-20 text-primary/60" />
              <div className="absolute left-4 right-4 h-0.5 bg-primary/70 rounded-full animate-scan-line" />
            </div>
            <p className="text-lg font-body text-muted-foreground flex items-center gap-2">
              {scanStatus === "verifying" && <Loader2 className="w-4 h-4 animate-spin" />}
              {scanStatus === "waiting" ? t("waiting_scan") : t("verifying")}
            </p>
            {scanStatus === "verifying" && (
              <div className="w-48">
                <Progress value={60} className="h-2" />
              </div>
            )}
          </div>
        );

      case "result":
        return (
          <div
            key="result"
            className={`flex flex-col items-center justify-center min-h-screen gap-6 animate-fade-in px-8 ${
              verified ? "bg-primary/5" : "bg-destructive/5"
            }`}
          >
            {verified ? (
              <>
                <div className="w-32 h-32 rounded-full bg-primary/15 flex items-center justify-center animate-scale-in shadow-lg shadow-primary/10 ring-8 ring-primary/5">
                  <ShieldCheck className="w-20 h-20 text-primary" strokeWidth={2.2} />
                </div>
                <h2 className="text-4xl font-heading font-bold text-foreground">
                  {t("verified")}
                </h2>
                <p className="text-lg text-muted-foreground font-body">
                  {farmer?.name ?? "Farmer"}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {farmer?.national_id}
                </p>
                <Button
                  size="lg"
                  className="mt-4 h-14 px-12 text-lg font-heading rounded-xl press"
                  onClick={() => setStep("quota")}
                >
                  {t("proceed")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <div className="w-32 h-32 rounded-full bg-destructive/15 flex items-center justify-center animate-scale-in shadow-lg shadow-destructive/10 ring-8 ring-destructive/5">
                  <ShieldX className="w-20 h-20 text-destructive" strokeWidth={2.2} />
                </div>
                <h2 className="text-4xl font-heading font-bold text-foreground">
                  {t("failed")}
                </h2>
                {scanError && (
                  <p className="text-sm font-body text-destructive max-w-md text-center">
                    {scanError}
                  </p>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="mt-4 h-14 px-12 text-lg font-heading rounded-xl press"
                  onClick={() => setStep("scan")}
                >
                  <RotateCcw className="mr-2 w-5 h-5" />
                  {t("try_again")}
                </Button>
              </>
            )}
          </div>
        );

      case "quota":
        return (
          <div key="quota" className="flex flex-col items-center justify-center min-h-screen gap-8 animate-fade-in px-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">
              {t("your_allocation")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
              <div className="bg-card rounded-xl border p-6 text-center hover-lift">
                <Package className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body mb-1">{t("remaining_quota")}</p>
                <p className="text-4xl font-heading font-bold text-foreground">{quotaKg} kg</p>
              </div>
              <div className="bg-card rounded-xl border p-6 text-center hover-lift">
                <Weight className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-body mb-1">{t("previous_usage")}</p>
                <p className="text-4xl font-heading font-bold text-muted-foreground">{previousUsage} kg</p>
              </div>
            </div>
            {quotaKg <= 0 ? (
              <p className="text-sm text-destructive font-body">
                No remaining quota for this farmer.
              </p>
            ) : (
              <Button
                size="lg"
                className="mt-4 h-14 px-12 text-lg font-heading rounded-xl press"
                onClick={() => setStep("scale")}
              >
                {t("proceed")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        );

      case "scale": {
        const steps = [t("step_zero"), t("step_container"), t("step_tare")];
        return (
          <div key="scale" className="flex flex-col items-center justify-center min-h-screen gap-8 animate-fade-in px-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">
              {t("scale_setup")}
            </h2>
            <div className="w-full max-w-sm space-y-4">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    i < scaleStep
                      ? "bg-primary/10 border-primary/30"
                      : i === scaleStep
                      ? "bg-card border-primary"
                      : "bg-card border-border opacity-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-heading font-bold ${
                      i < scaleStep
                        ? "bg-primary text-primary-foreground"
                        : i === scaleStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < scaleStep ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className="font-body text-foreground">{s}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4">
              {scaleStep === 0 && (
                <Button size="lg" className="h-14 px-10 text-lg font-heading rounded-xl press" onClick={() => setScaleStep(1)}>
                  ZERO
                </Button>
              )}
              {scaleStep === 1 && (
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-heading rounded-xl press" onClick={() => setScaleStep(2)}>
                  OK
                </Button>
              )}
              {scaleStep === 2 && (
                <Button size="lg" className="h-14 px-10 text-lg font-heading rounded-xl press" onClick={() => setScaleStep(3)}>
                  TARE
                </Button>
              )}
              {scaleStep >= 3 && (
                <Button size="lg" className="h-14 px-12 text-lg font-heading rounded-xl press" onClick={() => setStep("dispensing")}>
                  {t("proceed")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
            <div className="w-full max-w-sm">
              <div className="bg-card border rounded-xl p-6 text-center">
                <Scale className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-4xl font-heading font-bold text-foreground">0.0 kg</p>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {scaleStep >= 3 ? "Ready" : "---"}
                </p>
              </div>
            </div>
          </div>
        );
      }

      case "dispensing": {
        const progress = quotaKg > 0 ? (dispensedWeight / quotaKg) * 100 : 0;
        const done = quotaKg > 0 && dispensedWeight >= quotaKg;
        const hasDispensed = dispensedWeight > 0;
        const canFinish = !isDispensing && hasDispensed;
        return (
          <div key="dispensing" className="flex flex-col items-center justify-center min-h-screen gap-8 animate-fade-in px-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">
              {t("dispensing")}
            </h2>
            <div className="w-full max-w-sm bg-card border rounded-xl p-8 text-center">
              <p className="text-6xl font-heading font-bold text-foreground mb-2">
                {dispensedWeight.toFixed(1)} kg
              </p>
              <p className="text-sm text-muted-foreground font-body">/ {quotaKg} kg</p>
            </div>
            <div className="w-full max-w-sm">
              <Progress value={progress} className="h-4 rounded-full" />
            </div>
            {!done && !isDispensing && !hasDispensed && (
              <Button
                size="lg"
                className="h-16 px-14 text-xl font-heading rounded-xl press"
                onClick={() => setIsDispensing(true)}
              >
                <Play className="mr-2 w-6 h-6" />
                {t("start_dispensing")}
              </Button>
            )}
            {isDispensing && (
              <Button
                size="lg"
                variant="destructive"
                className="h-16 px-14 text-xl font-heading rounded-xl press"
                onClick={() => setIsDispensing(false)}
              >
                <Square className="mr-2 w-6 h-6" />
                {t("stop")}
              </Button>
            )}
            {canFinish && (
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {!done && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 text-lg font-heading rounded-xl press"
                    onClick={() => setIsDispensing(true)}
                  >
                    <Play className="mr-2 w-5 h-5" />
                    {t("start_dispensing")}
                  </Button>
                )}
                <Button
                  size="lg"
                  className="h-14 px-12 text-lg font-heading rounded-xl press"
                  onClick={() => setStep("complete")}
                >
                  {t("proceed")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        );
      }

      case "complete":
        return (
          <div key="complete" className="flex flex-col items-center justify-center min-h-screen gap-6 animate-fade-in px-8 bg-primary/5">
            <div className="w-32 h-32 rounded-full bg-primary/15 flex items-center justify-center animate-scale-in shadow-lg shadow-primary/10 ring-8 ring-primary/5">
              <CheckCircle2 className="w-20 h-20 text-primary" strokeWidth={2.2} />
            </div>
            <h2 className="text-4xl font-heading font-bold text-foreground">
              {t("complete")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
              <div className="bg-card rounded-xl border p-6 text-center">
                <p className="text-sm text-muted-foreground font-body mb-1">{t("amount_received")}</p>
                <p className="text-4xl font-heading font-bold text-primary">{dispensedWeight.toFixed(1)} kg</p>
              </div>
              <div className="bg-card rounded-xl border p-6 text-center">
                <p className="text-sm text-muted-foreground font-body mb-1">{t("remaining_quota")}</p>
                <p className="text-4xl font-heading font-bold text-foreground">
                  {Math.max(0, quotaKg - dispensedWeight).toFixed(1)} kg
                </p>
              </div>
            </div>
            <p className="text-xs font-body text-muted-foreground flex items-center gap-1.5 h-4">
              {logging && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Logging transaction…
                </>
              )}
              {logged && <>✓ Transaction logged to backend</>}
            </p>
            <Button
              size="lg"
              className="mt-2 h-14 px-12 text-lg font-heading rounded-xl press"
              disabled={logging}
              onClick={() => {
                resetKiosk();
                navigate("/");
              }}
            >
              {t("finish")}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background bg-topo">
      <StepIndicator step={step} />
      <BackButton />
      {renderStep()}
    </div>
  );
};

const KioskPage = () => (
  <LanguageProvider>
    <KioskWizard />
  </LanguageProvider>
);

export default KioskPage;
