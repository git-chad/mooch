"use client";

import { supabase } from "@/lib/supabase";

import { getProfile } from "@mooch/db";
import { useAuthStore } from "@mooch/stores";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setProfile, reset } = useAuthStore();
  

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount with the current session,
    // so no separate getSession() call is needed — avoids concurrent lock acquisitions.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        const profile = await getProfile(supabase, session.user.id);
        setProfile(profile);
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
