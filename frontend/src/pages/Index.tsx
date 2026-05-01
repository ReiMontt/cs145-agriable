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
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const tiles = [
    {
      title: "Kiosk Demo",
      description: "Walk through the on-device dispenser flow.",
      icon: Monitor,
      path: "/kiosk",
    },
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
      title: "Admin Dashboard",
      description: "Manage farmers and review live transactions.",
      icon: ShieldCheck,
      path: "/admin",
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-background bg-topo">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl">
        {tiles.map((tile, i) => (
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
    </div>
  );
};

export default Index;
