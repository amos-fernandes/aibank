
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BankProvider } from "./contexts/BankContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OpenFinance from "./pages/OpenFinance";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import Crypto from "./pages/Crypto";
import Settings from "./pages/Settings";
import CreditCard from "./pages/CreditCard";
import NotFound from "./pages/NotFound";
import DashboardAgenteAgnus from "./pages/Dashboard-agnus";
import { Layout } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BankProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              {/* <Route path="/agente" element={<Agente />} /> */}
              {/* Semi-protected route (requires auth but not OpenFinance) */}
              <Route 
                path="/open-finance" 
                element={
                  <ProtectedRoute requireOpenFinance={false}>
                    <OpenFinance />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes (require both auth and OpenFinance) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transfer" 
                element={
                  <ProtectedRoute>
                    <Transfer />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/crypto" 
                element={
                  <ProtectedRoute>
                    <Crypto />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/credit-card" 
                element={
                  <ProtectedRoute>
                    <CreditCard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/agente" element={
                  <ProtectedRoute>
                    <DashboardAgenteAgnus />
                  </ProtectedRoute>
                }  />

                
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BankProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
