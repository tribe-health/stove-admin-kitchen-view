
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
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const { isLoggedIn, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            // Fetch user details from your users table
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', session.user.id)
              .single();
            
            login({
              id: session.user.id,
              email: session.user.email || '',
              firstName: userData?.first_name || 'Admin',
              lastName: userData?.last_name || 'User',
              role: 'admin', // You may want to fetch actual roles
            });
          } else {
            logout();
          }
        }
      );
      
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch user details from your users table
        const { data: userData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();
        
        login({
          id: session.user.id,
          email: session.user.email || '',
          firstName: userData?.first_name || 'Admin',
          lastName: userData?.last_name || 'User',
          role: 'admin', // You may want to fetch actual roles
        });
      }
      
      setIsLoading(false);
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    initializeAuth();

    // Apply dark mode if saved in store
    const isDark = localStorage.getItem('theme-storage') 
      ? JSON.parse(localStorage.getItem('theme-storage') || '{}').state?.theme === 'dark'
      : false;
      
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, [login, logout]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
