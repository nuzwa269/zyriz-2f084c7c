import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { SITE } from "@/lib/config";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();

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
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="font-serif text-xl gold-gradient">{SITE.name} Admin</Link>
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary">Products</Link>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">View Site</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
