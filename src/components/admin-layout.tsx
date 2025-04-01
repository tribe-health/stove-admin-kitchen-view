
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { useAuthStore } from "@/store/use-auth-store";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { expanded } = useSidebarStore();
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  return isLoggedIn ? (
    <div className="min-h-screen bg-background text-foreground flex">
      <AdminSidebar />
      <div
        className={cn(
          "flex flex-col flex-1 transition-all duration-300",
          expanded ? "lg:ml-64" : "lg:ml-16"
        )}
      >
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  ) : null;
}
