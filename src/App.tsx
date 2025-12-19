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

// Admin only route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuthContext();
  
  if (isLoading) {
    return null;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/kasir" replace />;
  }
  
  return <>{children}</>;
}

// App routes with auth protection
function AppRoutes() {
  const { isAdmin } = useAuthContext();
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      {/* Kasir default route */}
      <Route path="/kasir" element={<ProtectedRoute><Kasir /></ProtectedRoute>} />
      {/* Admin only routes */}
      <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/produk" element={<AdminRoute><Produk /></AdminRoute>} />
      <Route path="/stok-opname" element={<AdminRoute><StokOpname /></AdminRoute>} />
      <Route path="/laporan" element={<AdminRoute><Laporan /></AdminRoute>} />
      <Route path="/supplier" element={<AdminRoute><Supplier /></AdminRoute>} />
      <Route path="/backup" element={<AdminRoute><Backup /></AdminRoute>} />
      <Route path="/manajemen-user" element={<AdminRoute><ManajemenUser /></AdminRoute>} />
      <Route path="/install" element={<AdminRoute><Install /></AdminRoute>} />
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
