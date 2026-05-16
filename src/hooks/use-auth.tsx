import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdminStatus = async (s: Session | null) => {
    setSession(s);
    if (!s?.user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: s.user.id,
        _role: "admin",
      });
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error(error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => void refreshAdminStatus(s), 0);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      await refreshAdminStatus(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, isAdmin, loading };
}
