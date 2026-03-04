import { create } from "zustand";

type GroupStore = {
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
};

export const useGroupStore = create<GroupStore>((set) => ({
  activeGroupId: null,
  setActiveGroupId: (id) => set({ activeGroupId: id }),
}));
