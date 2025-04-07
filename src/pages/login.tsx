
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/use-auth-store";
import { LoginFormValues, loginSchema } from "@/lib/validations/auth-schema";
import { toast } from "sonner";
import { authService } from "@/lib/auth-service";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.login(data);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to login. Please check your credentials.";
      setError(errorMessage);
      toast.error("Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Login form */}
      <div className="flex flex-col justify-center p-8 md:p-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="flex items-center gap-2 mb-8">
          <img 
            src="/lovable-uploads/c87a99a7-e0cf-4c42-92fb-67cfae755328.png" 
            alt="FoodOnTheStove" 
            className="h-10 w-10 object-contain" 
          />
          <h1 className="text-2xl font-bold">FoodOnTheStove</h1>
        </div>
        
        <h2 className="text-3xl font-bold mb-2">Admin Login</h2>
        <p className="text-muted-foreground mb-8">
          Welcome back! Please sign in to continue.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="admin@foodonthestove.org" 
                      type="email" 
                      disabled={isLoading} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="••••••••" 
                      type="password" 
                      disabled={isLoading} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Contact your administrator if you need access to the system.</p>
        </div>
      </div>

      {/* Right side - Brand image */}
      <div className="hidden md:block bg-stove-blue">
        <div className="flex flex-col items-center justify-center h-full p-12 text-white">
          <img 
            src="/lovable-uploads/c87a99a7-e0cf-4c42-92fb-67cfae755328.png" 
            alt="FoodOnTheStove Logo" 
            className="w-32 h-32 object-contain mb-8" 
          />
          <h2 className="text-3xl font-bold mb-4 text-stove-gold">Admin Portal</h2>
          <p className="text-xl text-center mb-8">
            Manage your food ordering platform with ease
          </p>
          <div className="max-w-md text-center">
            <p>
              Food on the Stove is a Washington DC based non-profit organization 
              that increases awareness about health and wellness within the fire service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
