
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // For now, we'll just redirect to dashboard if they're on the root path
    navigate("/dashboard");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">FoodOnTheStove</h1>
        <p className="text-xl text-muted-foreground">Admin Portal</p>
        <div className="flex flex-col space-y-2">
          <Button onClick={() => navigate("/login")}>Login</Button>
          <Button onClick={() => navigate("/dashboard")} variant="outline">Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
