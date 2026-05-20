import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useBrand } from "@/hooks/use-brand";
import { LogOut, Sun, Moon, Menu, X } from "lucide-react";

const ADMIN_NAV = [
  { to: "/admin", label: "Products" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/features", label: "Features" },
  { to: "/admin/hero", label: "Hero" },
  { to: "/admin/footer", label: "Footer" },
  { to: "/admin/sections", label: "Sections" },
  { to: "/admin/videos", label: "Videos" },
  { to: "/admin/social", label: "Social" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/", label: "View Site" },
] as const;

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const brand = useBrand();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-3xl">Access denied</h1>
        <p className="mt-2 text-muted-foreground text-sm">You don't have admin permissions for this account.</p>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}
          className="mt-6 rounded-md bg-primary px-5 py-2 text-sm text-primary-foreground"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3 lg:gap-6 min-w-0 flex-1">
            <Link to="/admin" className="flex items-center gap-2 min-w-0 shrink-0">
              {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="h-7 w-7 object-contain shrink-0" />}
              <span className="font-serif text-lg sm:text-xl gold-gradient truncate">{brand.name} Admin</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-5">
              {ADMIN_NAV.map((n) => (
                <Link key={n.to} to={n.to} className="text-sm text-muted-foreground hover:text-primary whitespace-nowrap">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden xl:inline truncate max-w-[180px]">{user?.email}</span>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 text-muted-foreground hover:text-primary transition"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive px-2 py-2"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden p-2 text-muted-foreground hover:text-primary transition"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <nav className="mx-auto max-w-7xl flex flex-col px-3 sm:px-4 py-2 max-h-[70vh] overflow-y-auto">
              {ADMIN_NAV.map((n) => {
                const active = currentPath === n.to || (n.to !== "/" && currentPath.startsWith(n.to));
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className={`py-3 px-2 text-sm border-b border-border/40 last:border-0 ${active ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
              {user?.email && (
                <span className="py-3 px-2 text-xs text-muted-foreground truncate border-t border-border/40">{user.email}</span>
              )}
            </nav>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}
