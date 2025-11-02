import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BrandProvider } from "./contexts/BrandContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Offers from "./pages/Offers";
import Workflows from "./pages/Workflows";
import SeedUsers from "./pages/SeedUsers";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BrandProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/seed-users" element={<SeedUsers />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/users" element={<Users />} />
                <Route path="/roles" element={<Roles />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/customers" element={<Dashboard />} />
                <Route path="/reports" element={<Dashboard />} />
                <Route path="/sales" element={<Dashboard />} />
                <Route path="/transactions" element={<Dashboard />} />
                <Route path="/settings" element={<Dashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrandProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
