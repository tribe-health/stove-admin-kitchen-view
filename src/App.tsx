import React, { useEffect, useState } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Index from "./pages";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import Products from "./pages/products";
import NotFound from "./pages/not-found";
import { supabase } from "./integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@/components/ui/toast";
import { Auth } from "./pages/auth";
import Users from "./pages/users";

// Add this import for the sites page
import Sites from "./pages/sites";

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const session = localStorage.getItem("supabase.auth.session");
    if (!session) {
      toast({
        title: "You are not logged in.",
        description: "Redirecting to login page.",
      });
    }
    setAuthChecked(true);
  }, [toast]);

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/users" element={<Users />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
