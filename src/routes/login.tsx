import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SITE } from "@/lib/config";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin Login — Zarrin Atelier" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Welcome back");
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-border bg-card p-8">
        <h1 className="font-serif text-3xl text-center gold-gradient">{SITE.name}</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Admin Login</p>
        <div className="mt-8 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2 text-sm" />
          </div>
          <button disabled={loading} className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
