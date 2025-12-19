import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CloudSyncProvider } from "./components/CloudSyncProvider";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Kasir from "./pages/Kasir";
import Produk from "./pages/Produk";
import StokOpname from "./pages/StokOpname";
import Laporan from "./pages/Laporan";
import Supplier from "./pages/Supplier";
import Install from "./pages/Install";
import Backup from "./pages/Backup";
import Auth from "./pages/Auth";
import ManajemenUser from "./pages/ManajemenUser";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  
  if (isLoading) {
    return null;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

// App routes with auth protection
function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/kasir" element={<ProtectedRoute><Kasir /></ProtectedRoute>} />
      <Route path="/produk" element={<ProtectedRoute><Produk /></ProtectedRoute>} />
      <Route path="/stok-opname" element={<ProtectedRoute><StokOpname /></ProtectedRoute>} />
      <Route path="/laporan" element={<ProtectedRoute><Laporan /></ProtectedRoute>} />
      <Route path="/supplier" element={<ProtectedRoute><Supplier /></ProtectedRoute>} />
      <Route path="/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
      <Route path="/manajemen-user" element={<ProtectedRoute><ManajemenUser /></ProtectedRoute>} />
      <Route path="/install" element={<ProtectedRoute><Install /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CloudSyncProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </CloudSyncProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
