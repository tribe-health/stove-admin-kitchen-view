
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { useAuthStore } from "@/store/use-auth-store";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { collapsed } = useSidebarStore();
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
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  ) : null;
}
