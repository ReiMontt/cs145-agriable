import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sprout, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_credentials")
      .select("id")
      .eq("username", username)
      .eq("password", password)
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast({ title: "Invalid credentials", description: "Check username and password.", variant: "destructive" });
      return;
    }
    sessionStorage.setItem("agriable_admin_authed", "1");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background bg-topo">
      <Card className="w-full max-w-sm animate-fade-in">
        <CardContent className="p-8 flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Sprout className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold tracking-tight">AgriAble</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center mt-1">
              <Lock className="w-3.5 h-3.5" /> Restricted access
            </p>
          </div>
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
