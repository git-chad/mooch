import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan, PlanAttachment, Profile } from "@mooch/types";

export type PlanWithDetails = Plan & {
    attachments: PlanAttachment[];
    organizer: Profile | null;
    created_by_profile: Profile;
};

export async function getPlans(
    supabase: SupabaseClient,
    groupId: string,
): Promise<PlanWithDetails[]> {
    const { data, error } = await supabase
        .from("group_plans")
        .select(
            "*, organizer:profiles!organizer_id(*), created_by_profile:profiles!created_by(*), group_plan_attachments(*)",
        )
        .eq("group_id", groupId)
        .order("sort_order", { ascending: true });

    if (error || !data) {
        console.error("[getPlans] query failed:", error?.message);
        return [];
    }

    // Group by status for consistent column ordering
    const statusOrder = ["ideas", "to_plan", "upcoming", "done"];

    return data
        .map((plan) => ({
            ...plan,
            attachments: (plan.group_plan_attachments ?? []) as PlanAttachment[],
            group_plan_attachments: undefined,
            organizer: plan.organizer as Profile | null,
            created_by_profile: plan.created_by_profile as Profile,
        }))
        .sort((a, b) => {
            const statusDiff =
                statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
            if (statusDiff !== 0) return statusDiff;
            return a.sort_order - b.sort_order;
        }) as PlanWithDetails[];
}

export async function getPlanById(
    supabase: SupabaseClient,
    planId: string,
): Promise<PlanWithDetails | null> {
    const { data, error } = await supabase
        .from("group_plans")
        .select(
            "*, organizer:profiles!organizer_id(*), created_by_profile:profiles!created_by(*), group_plan_attachments(*)",
        )
        .eq("id", planId)
        .single();

    if (error || !data) return null;

    return {
        ...data,
        attachments: (data.group_plan_attachments ?? []) as PlanAttachment[],
        group_plan_attachments: undefined,
        organizer: data.organizer as Profile | null,
        created_by_profile: data.created_by_profile as Profile,
    } as PlanWithDetails;
}
