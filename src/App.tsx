
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/admin-layout";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import Products from "./pages/products";
import Login from "./pages/login";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./store/use-auth-store";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const { isLoggedIn } = useAuthStore();

  // Apply the theme on app load
  useEffect(() => {
    // Apply dark mode if saved in store
    const isDark = localStorage.getItem('theme-storage') 
      ? JSON.parse(localStorage.getItem('theme-storage') || '{}').state?.theme === 'dark'
      : false;
      
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes - wrapped in the admin layout */}
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/products" element={<Products />} />
              <Route path="/users" element={<Dashboard />} /> {/* Placeholder for future implementation */}
              <Route path="/sites" element={<Dashboard />} /> {/* Placeholder for future implementation */}
              <Route path="/delivery-locations" element={<Dashboard />} /> {/* Placeholder for future implementation */}
              <Route path="/settings" element={<Dashboard />} /> {/* Placeholder for future implementation */}
              <Route path="/profile" element={<Dashboard />} /> {/* Placeholder for future implementation */}
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
