"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@mooch/db/server";
import type { Plan, PlanAttachment, PlanStatus } from "@mooch/types";
import { revalidatePath } from "next/cache";

type CreatePlanInput = {
    title: string;
    description?: string;
    status?: PlanStatus;
    date?: string | null;
    organizer_id?: string | null;
};

export async function createPlan(
    groupId: string,
    data: CreatePlanInput,
): Promise<{ plan: Plan } | { error: string }> {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Verify membership
    const { data: member } = await admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (!member) return { error: "Not a group member" };

    // Get max sort_order for the target status column
    const status = data.status ?? "ideas";
    const { data: maxRow } = await admin
        .from("group_plans")
        .select("sort_order")
        .eq("group_id", groupId)
        .eq("status", status)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

    const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

    const { data: plan, error } = await admin
        .from("group_plans")
        .insert({
            group_id: groupId,
            title: data.title,
            description: data.description || null,
            status,
            sort_order: nextSortOrder,
            date: data.date || null,
            organizer_id: data.organizer_id || null,
            created_by: user.id,
        })
        .select("*")
        .single();

    if (error || !plan) {
        console.error("[createPlan] insert failed:", error?.message);
        return { error: error?.message ?? "Failed to create plan" };
    }

    revalidatePath(`/${groupId}/plans`);
    return { plan: plan as Plan };
}

export async function updatePlan(
    planId: string,
    data: Partial<Pick<Plan, "title" | "description" | "date" | "organizer_id" | "status">>,
): Promise<{ plan: Plan } | { error: string }> {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Fetch existing plan to verify access
    const { data: existing } = await admin
        .from("group_plans")
        .select("group_id, created_by")
        .eq("id", planId)
        .single();

    if (!existing) return { error: "Plan not found" };

    // Verify membership
    const { data: member } = await admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", existing.group_id)
        .eq("user_id", user.id)
        .single();

    if (!member) return { error: "Not a group member" };

    const { data: plan, error } = await admin
        .from("group_plans")
        .update({
            ...data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", planId)
        .select("*")
        .single();

    if (error || !plan) {
        console.error("[updatePlan] update failed:", error?.message);
        return { error: error?.message ?? "Failed to update plan" };
    }

    revalidatePath(`/${existing.group_id}/plans`);
    return { plan: plan as Plan };
}

export async function movePlan(
    planId: string,
    newStatus: PlanStatus,
    newSortOrder: number,
): Promise<{ plan: Plan } | { error: string }> {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: existing } = await admin
        .from("group_plans")
        .select("group_id")
        .eq("id", planId)
        .single();

    if (!existing) return { error: "Plan not found" };

    // Verify membership
    const { data: member } = await admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", existing.group_id)
        .eq("user_id", user.id)
        .single();

    if (!member) return { error: "Not a group member" };

    const { data: plan, error } = await admin
        .from("group_plans")
        .update({
            status: newStatus,
            sort_order: newSortOrder,
            updated_at: new Date().toISOString(),
        })
        .eq("id", planId)
        .select("*")
        .single();

    if (error || !plan) {
        console.error("[movePlan] update failed:", error?.message);
        return { error: error?.message ?? "Failed to move plan" };
    }

    revalidatePath(`/${existing.group_id}/plans`);
    return { plan: plan as Plan };
}

export async function reorderPlans(
    groupId: string,
    updates: { id: string; sort_order: number }[],
): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Verify membership
    const { data: member } = await admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (!member) return { error: "Not a group member" };

    // Batch update sort_orders
    for (const update of updates) {
        const { error } = await admin
            .from("group_plans")
            .update({ sort_order: update.sort_order, updated_at: new Date().toISOString() })
            .eq("id", update.id)
            .eq("group_id", groupId);

        if (error) {
            console.error("[reorderPlans] update failed:", error.message);
            return { error: error.message };
        }
    }

    revalidatePath(`/${groupId}/plans`);
    return { success: true };
}

export async function deletePlan(
    planId: string,
): Promise<{ success: true; groupId: string } | { error: string }> {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: existing } = await admin
        .from("group_plans")
        .select("group_id, created_by")
        .eq("id", planId)
        .single();

    if (!existing) return { error: "Plan not found" };

    // Verify membership
    const { data: member } = await admin
        .from("group_members")
        .select("role")
        .eq("group_id", existing.group_id)
        .eq("user_id", user.id)
        .single();

    if (!member) return { error: "Not a group member" };

    // Only creator or admin/owner can delete
    if (existing.created_by !== user.id && member.role === "member") {
        return { error: "Only the creator or an admin can delete this plan" };
    }

    const { error } = await admin.from("group_plans").delete().eq("id", planId);

    if (error) {
        console.error("[deletePlan] delete failed:", error.message);
        return { error: error.message };
    }

    revalidatePath(`/${existing.group_id}/plans`);
    return { success: true, groupId: existing.group_id };
}

export async function addPlanAttachment(
    planId: string,
    type: "photo" | "voice",
    url: string,
): Promise<{ attachment: PlanAttachment } | { error: string }> {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: plan } = await admin
        .from("group_plans")
        .select("group_id")
        .eq("id", planId)
        .single();

    if (!plan) return { error: "Plan not found" };

    // Verify membership
    const { data: member } = await admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", plan.group_id)
        .eq("user_id", user.id)
        .single();

    if (!member) return { error: "Not a group member" };

    const { data: attachment, error } = await admin
        .from("group_plan_attachments")
        .insert({ plan_id: planId, type, url })
        .select("*")
        .single();

    if (error || !attachment) {
        console.error("[addPlanAttachment] insert failed:", error?.message);
        return { error: error?.message ?? "Failed to add attachment" };
    }

    revalidatePath(`/${plan.group_id}/plans`);
    return { attachment: attachment as PlanAttachment };
}

export async function removePlanAttachment(
    attachmentId: string,
): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // Get attachment + plan to verify
    const { data: attachment } = await admin
        .from("group_plan_attachments")
        .select("plan_id, url")
        .eq("id", attachmentId)
        .single();

    if (!attachment) return { error: "Attachment not found" };

    const { data: plan } = await admin
        .from("group_plans")
        .select("group_id")
        .eq("id", attachment.plan_id)
        .single();

    if (!plan) return { error: "Plan not found" };

    // Verify membership
    const { data: member } = await admin
        .from("group_members")
        .select("user_id")
        .eq("group_id", plan.group_id)
        .eq("user_id", user.id)
        .single();

    if (!member) return { error: "Not a group member" };

    const { error } = await admin
        .from("group_plan_attachments")
        .delete()
        .eq("id", attachmentId);

    if (error) {
        console.error("[removePlanAttachment] delete failed:", error.message);
        return { error: error.message };
    }

    // Attempt to delete the file from storage
    if (attachment.url) {
        const { error: storageError } = await admin.storage
            .from("plan-attachments")
            .remove([attachment.url]);
        if (storageError) {
            console.error("[removePlanAttachment] storage delete failed:", storageError.message);
        }
    }

    revalidatePath(`/${plan.group_id}/plans`);
    return { success: true };
}
