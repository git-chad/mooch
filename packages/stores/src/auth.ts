import type { User } from "@supabase/supabase-js";
import type { Profile } from "@mooch/types";
import { create } from "zustand";

type AuthStore = {
  user: User | null;
  profile: Profile | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  reset: () => set({ user: null, profile: null }),
}));
