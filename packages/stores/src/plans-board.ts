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
        set((s) => {
            const nextPlans = [...s.plans];
            const movingPlan = nextPlans.find((plan) => plan.id === id);

            if (!movingPlan) return { plans: s.plans };

            const sourceStatus = movingPlan.status;
            const sourceColumn = nextPlans
                .filter((plan) => plan.status === sourceStatus && plan.id !== id)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((plan, index) => ({ ...plan, sort_order: index }));

            const destinationColumn = nextPlans
                .filter((plan) => plan.status === newStatus && plan.id !== id)
                .sort((a, b) => a.sort_order - b.sort_order);

            const movedPlan = {
                ...movingPlan,
                status: newStatus,
                sort_order: newSortOrder,
            };

            destinationColumn.splice(newSortOrder, 0, movedPlan);
            const normalizedDestination = destinationColumn.map((plan, index) => ({
                ...plan,
                sort_order: index,
            }));

            const untouched = nextPlans.filter(
                (plan) => plan.status !== sourceStatus && plan.status !== newStatus,
            );

            return {
                plans: [...untouched, ...sourceColumn, ...normalizedDestination],
            };
        }),
    clear: () => set({ plans: [] }),
}));
