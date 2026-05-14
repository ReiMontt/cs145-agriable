import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import { RequireAdmin } from "./components/RequireAdmin";
import KioskPage from "./pages/KioskPage.tsx";
import FarmerPortal from "./pages/FarmerPortal.tsx";
import HwSimulator from "./pages/HwSimulator.tsx";
import AuditLogs from "./pages/AuditLogs.tsx";
import RsbsaRegistry from "./pages/RsbsaRegistry.tsx";

import AdminDashboard from "./pages/AdminDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAdmin><Index /></RequireAdmin>} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/farmer" element={<FarmerPortal />} />
          <Route path="/simulator" element={<HwSimulator />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/registry" element={<RsbsaRegistry />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/transactions" element={<AdminDashboard />} />
          <Route path="/admin/farmers" element={<AdminDashboard />} />
          <Route path="/admin/system" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
