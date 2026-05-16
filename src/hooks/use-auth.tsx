import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentAdminStatus } from "@/lib/auth.functions";

export function useAuth() {
  const getAdminStatus = useServerFn(getCurrentAdminStatus);
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
      const result = await getAdminStatus();
      setIsAdmin(result.isAdmin);
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
  }, [getAdminStatus]);

  return { session, user: session?.user ?? null, isAdmin, loading };
}
