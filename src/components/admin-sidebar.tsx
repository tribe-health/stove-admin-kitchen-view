
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { 
  Home, 
  ShoppingCart, 
  ListOrdered, 
  Users, 
  MapPin, 
  Settings, 
  Menu, 
  X, 
  Package, 
  Building
} from "lucide-react";
import { Button } from "./ui/button";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function SidebarLink({ to, icon, label, collapsed }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )
      }
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export function AdminSidebar() {
  const { collapsed, mobileOpen, toggleMobileOpen, setMobileOpen } = useSidebarStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen, setMobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", 
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/c87a99a7-e0cf-4c42-92fb-67cfae755328.png" 
                alt="FoodOnTheStove" 
                className="h-8 w-8 object-contain" 
              />
              <span className="font-semibold text-sidebar-foreground">FoodOnTheStove</span>
            </div>
          )}
          {isMobile ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileOpen}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : (
            !collapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => useSidebarStore.getState().toggleCollapsed()}
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )
          )}
        </div>

        <div className="flex-1 overflow-auto px-3 py-4">
          <nav className="flex flex-col gap-2">
            <SidebarLink
              to="/dashboard"
              icon={<Home className="h-5 w-5" />}
              label="Dashboard"
              collapsed={collapsed}
            />
            <SidebarLink
              to="/orders"
              icon={<ListOrdered className="h-5 w-5" />}
              label="Orders"
              collapsed={collapsed}
            />
            <SidebarLink
              to="/products"
              icon={<Package className="h-5 w-5" />}
              label="Products"
              collapsed={collapsed}
            />
            <SidebarLink
              to="/users"
              icon={<Users className="h-5 w-5" />}
              label="Users"
              collapsed={collapsed}
            />
            <SidebarLink
              to="/sites"
              icon={<Building className="h-5 w-5" />}
              label="Sites"
              collapsed={collapsed}
            />
            <SidebarLink
              to="/delivery-locations"
              icon={<MapPin className="h-5 w-5" />}
              label="Delivery Locations"
              collapsed={collapsed}
            />
            <SidebarLink
              to="/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              collapsed={collapsed}
            />
          </nav>
        </div>
      </div>
    </>
  );
}
