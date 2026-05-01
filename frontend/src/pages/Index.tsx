import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sprout,
  Monitor,
  ShieldCheck,
  UserRound,
  Cpu,
  ScrollText,
  ClipboardList,
  Code2,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const primaryTiles = [
    {
      title: "Kiosk Demo",
      description: "Walk through the on-device dispenser flow.",
      icon: Monitor,
      path: "/kiosk",
    },
    {
      title: "Admin Dashboard",
      description: "Manage farmers and review live transactions.",
      icon: ShieldCheck,
      path: "/admin",
    },
  ];

  const devTiles = [
    {
      title: "Farmer Portal",
      description: "Verify identity and check remaining quota.",
      icon: UserRound,
      path: "/farmer",
    },
    {
      title: "HW Simulator",
      description: "Emulate the ESP32 scan + dispense + log cycle.",
      icon: Cpu,
      path: "/simulator",
    },
    {
      title: "Audit Logs",
      description: "Recent dispense activity across all machines.",
      icon: ScrollText,
      path: "/audit",
    },
    {
      title: "RSBSA Registry",
      description: "All registered farmers and their quotas.",
      icon: ClipboardList,
      path: "/registry",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12 bg-background bg-topo">
      <div className="flex items-center gap-3 mb-3 animate-fade-in">
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <Sprout className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      <h1 className="text-4xl font-heading font-bold text-foreground tracking-tight animate-fade-in mb-1">
        AgriAble
      </h1>
      <p className="text-muted-foreground font-body text-center max-w-sm mb-10 animate-fade-in">
        Secure and verified fertilizer distribution for Filipino farmers
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl mb-12">
        {primaryTiles.map((tile, i) => (
          <Card
            key={tile.path}
            className="cursor-pointer hover-lift press hover:border-primary/40 animate-fade-in group"
            style={{ animationDelay: `${i * 80}ms` }}
            onClick={() => navigate(tile.path)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <tile.icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-heading font-semibold text-lg">{tile.title}</h2>
              <p className="text-sm text-muted-foreground font-body">{tile.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="w-full max-w-4xl animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
            <Code2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Developer
          </h3>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 sm:p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {devTiles.map((tile, i) => (
              <button
                key={tile.path}
                onClick={() => navigate(tile.path)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="press hover-lift text-left rounded-lg bg-background border border-border hover:border-primary/40 p-4 flex flex-col gap-2 group animate-fade-in"
              >
                <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <tile.icon className="w-4.5 h-4.5 text-foreground/70 group-hover:text-primary transition-colors" />
                </div>
                <h4 className="font-heading font-semibold text-sm">{tile.title}</h4>
                <p className="text-xs text-muted-foreground font-body leading-snug">
                  {tile.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
