import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Group } from "@mooch/types";

type GroupStore = {
  groups: Group[];
  activeGroupId: string | null;
  setGroups: (groups: Group[]) => void;
  setActiveGroup: (id: string | null) => void;
  addGroup: (group: Group) => void;
  removeGroup: (id: string) => void;
};

export const useGroupStore = create<GroupStore>()(
  persist(
    (set) => ({
      groups: [],
      activeGroupId: null,
      setGroups: (groups) => set({ groups }),
      setActiveGroup: (id) => set({ activeGroupId: id }),
      addGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),
      removeGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          activeGroupId: s.activeGroupId === id ? null : s.activeGroupId,
        })),
    }),
    {
      name: "mooch-active-group",
      partialize: (s) => ({ activeGroupId: s.activeGroupId }),
    },
  ),
);
