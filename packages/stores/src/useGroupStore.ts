import type { Group } from "@mooch/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      addGroup: (group) =>
        set((s) => {
          const existingIndex = s.groups.findIndex((g) => g.id === group.id);
          if (existingIndex === -1) {
            return { groups: [group, ...s.groups] };
          }

          const nextGroups = [...s.groups];
          nextGroups[existingIndex] = group;
          return { groups: nextGroups };
        }),
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
