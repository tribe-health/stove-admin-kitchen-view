
import React, { useEffect, useState } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Index from "./pages/index";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import ViewOrder from "./pages/view-order";
import EditOrder from "./pages/edit-order";
import Products from "./pages/products";
import CreateProductPage from "./pages/create-product";
import EditProductPage from "./pages/edit-product";
import NotFound from "./pages/not-found";
import { supabase } from "./integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Auth } from "./pages/auth";
import Users from "./pages/users";
import Sites from "./pages/sites";
import { AdminLayout } from "./components/admin-layout";
import DeliveryLocations from "./pages/delivery-locations";
import Settings from "./pages/settings";
import { useAuthStore } from "./store/use-auth-store";

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Hydrate auth store from Supabase session
        await useAuthStore.getState().hydrateFromSession();
        
        // Check if user is logged in after hydration
        const isLoggedIn = useAuthStore.getState().isLoggedIn;
        
        if (!isLoggedIn) {
          toast({
            title: "You are not logged in.",
            description: "Redirecting to login page.",
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setAuthChecked(true);
      }
    };
    
    initializeAuth();
  }, [toast]);

  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Admin routes with AdminLayout */}
        <Route path="/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
        
        {/* Order routes */}
        <Route path="/orders" element={<AdminLayout><Orders /></AdminLayout>} />
        <Route path="/orders/:id" element={<AdminLayout><ViewOrder /></AdminLayout>} />
        <Route path="/orders/edit/:id" element={<AdminLayout><EditOrder /></AdminLayout>} />
        
        {/* Product routes */}
        <Route path="/products" element={<AdminLayout><Products /></AdminLayout>} />
        <Route path="/products/create" element={<AdminLayout><CreateProductPage /></AdminLayout>} />
        <Route path="/products/edit/:id" element={<AdminLayout><EditProductPage /></AdminLayout>} />
        <Route path="/sites" element={<AdminLayout><Sites /></AdminLayout>} />
        <Route path="/users" element={<AdminLayout><Users /></AdminLayout>} />
        <Route path="/delivery-locations" element={<AdminLayout><DeliveryLocations /></AdminLayout>} />
        <Route path="/settings" element={<AdminLayout><Settings /></AdminLayout>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
