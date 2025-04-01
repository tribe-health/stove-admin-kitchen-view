
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: error.message,
        });
        navigate("/login");
        return;
      }

      if (data.session) {
        toast({
          title: "Authentication successful",
          description: "You are now logged in.",
        });
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
      
      setLoading(false);
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {loading && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Authenticating...</p>
        </div>
      )}
    </div>
  );
}

export default Auth;
