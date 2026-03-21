import type { Plan, PlanAttachment, PlanStatus, Profile } from "@mooch/types";
import { create } from "zustand";

export type PlanWithDetails = Plan & {
    attachments: PlanAttachment[];
    organizer: Profile | null;
    created_by_profile: Profile;
};

type PlansBoardStore = {
    plans: PlanWithDetails[];
    setPlans: (plans: PlanWithDetails[]) => void;
    upsertPlan: (plan: PlanWithDetails) => void;
    removePlan: (id: string) => void;
    movePlan: (id: string, newStatus: PlanStatus, newSortOrder: number) => void;
    clear: () => void;
};

export const usePlansBoardStore = create<PlansBoardStore>((set) => ({
    plans: [],
    setPlans: (plans) => set({ plans }),
    upsertPlan: (plan) =>
        set((s) => {
            const idx = s.plans.findIndex((p) => p.id === plan.id);
            if (idx === -1) return { plans: [plan, ...s.plans] };
            const next = [...s.plans];
            next[idx] = plan;
            return { plans: next };
        }),
    removePlan: (id) =>
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
    movePlan: (id, newStatus, newSortOrder) =>
        set((s) => ({
            plans: s.plans.map((p) =>
                p.id === id ? { ...p, status: newStatus, sort_order: newSortOrder } : p,
            ),
        })),
    clear: () => set({ plans: [] }),
}));
