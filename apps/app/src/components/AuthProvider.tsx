"use client";

import { createBrowserClient, getProfile } from "@mooch/db";
import { useAuthStore } from "@mooch/stores";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, setProfile, reset } = useAuthStore();
  const supabase = createBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        const profile = await getProfile(supabase, session.user.id);
        setProfile(profile);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
