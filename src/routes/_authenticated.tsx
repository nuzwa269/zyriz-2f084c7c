import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { LogOut, Sun, Moon } from "lucide-react";
import { SITE } from "@/lib/config";

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
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-y-2 px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            <Link to="/admin" className="font-serif text-lg sm:text-xl gold-gradient truncate">{SITE.name} Admin</Link>
            <Link to="/admin" className="hidden sm:inline text-sm text-muted-foreground hover:text-primary">Products</Link>
            <Link to="/" className="hidden sm:inline text-sm text-muted-foreground hover:text-primary">View Site</Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <span className="text-xs text-muted-foreground hidden lg:inline truncate max-w-[180px]">{user?.email}</span>
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
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
