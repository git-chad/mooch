"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@mooch/db/server";
import type { Tab } from "@mooch/types";
import { revalidatePath } from "next/cache";

type CreateTabInput = {
  name: string;
  emoji?: string;
  currency?: string;
};

export async function createTab(
  groupId: string,
  data: CreateTabInput,
): Promise<{ tab: Tab; groupId: string } | { error: string }> {
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

  if (!member) return { error: "Not a member of this group" };

  // Default tab currency to the group's currency
  let tabCurrency = data.currency;
  if (!tabCurrency) {
    const { data: group } = await admin
      .from("groups")
      .select("currency")
      .eq("id", groupId)
      .single();
    tabCurrency = (group?.currency as string) ?? "USD";
  }

  const { data: tab, error } = await admin
    .from("tabs")
    .insert({
      group_id: groupId,
      name: data.name.trim(),
      emoji: data.emoji ?? "lucide:Receipt",
      currency: tabCurrency,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !tab) return { error: error?.message ?? "Failed to create tab" };

  revalidatePath(`/${groupId}/expenses`);

  return { tab: tab as Tab, groupId };
}

type UpdateTabInput = {
  name?: string;
  emoji?: string;
  currency?: string;
};

export async function updateTab(
  tabId: string,
  data: UpdateTabInput,
): Promise<{ tab: Tab } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: tab } = await admin
    .from("tabs")
    .select("group_id, created_by")
    .eq("id", tabId)
    .single();

  if (!tab) return { error: "Tab not found" };

  // Check creator or admin
  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", tab.group_id)
    .eq("user_id", user.id)
    .single();

  if (tab.created_by !== user.id && member?.role !== "admin")
    return { error: "Only the tab creator or an admin can edit this tab" };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.emoji !== undefined) updates.emoji = data.emoji;
  if (data.currency !== undefined) updates.currency = data.currency;

  const { data: updated, error } = await admin
    .from("tabs")
    .update(updates)
    .eq("id", tabId)
    .select("*")
    .single();

  if (error || !updated) return { error: error?.message ?? "Failed to update tab" };

  revalidatePath(`/${tab.group_id}/expenses`);

  return { tab: updated as Tab };
}

export async function closeTab(
  tabId: string,
): Promise<{ tab: Tab } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: tab } = await admin
    .from("tabs")
    .select("group_id, created_by, status")
    .eq("id", tabId)
    .single();

  if (!tab) return { error: "Tab not found" };
  if (tab.status === "closed") return { error: "Tab is already closed" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", tab.group_id)
    .eq("user_id", user.id)
    .single();

  if (tab.created_by !== user.id && member?.role !== "admin")
    return { error: "Only the tab creator or an admin can close this tab" };

  const { data: updated, error } = await admin
    .from("tabs")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", tabId)
    .select("*")
    .single();

  if (error || !updated) return { error: error?.message ?? "Failed to close tab" };

  revalidatePath(`/${tab.group_id}/expenses`);

  return { tab: updated as Tab };
}

export async function reopenTab(
  tabId: string,
): Promise<{ tab: Tab } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: tab } = await admin
    .from("tabs")
    .select("group_id, created_by, status")
    .eq("id", tabId)
    .single();

  if (!tab) return { error: "Tab not found" };
  if (tab.status === "open") return { error: "Tab is already open" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", tab.group_id)
    .eq("user_id", user.id)
    .single();

  if (tab.created_by !== user.id && member?.role !== "admin")
    return { error: "Only the tab creator or an admin can reopen this tab" };

  const { data: updated, error } = await admin
    .from("tabs")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", tabId)
    .select("*")
    .single();

  if (error || !updated) return { error: error?.message ?? "Failed to reopen tab" };

  revalidatePath(`/${tab.group_id}/expenses`);

  return { tab: updated as Tab };
}

export async function deleteTab(
  tabId: string,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: tab } = await admin
    .from("tabs")
    .select("group_id, created_by")
    .eq("id", tabId)
    .single();

  if (!tab) return { error: "Tab not found" };

  // Only admin can delete
  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", tab.group_id)
    .eq("user_id", user.id)
    .single();

  if (member?.role !== "admin")
    return { error: "Only a group admin can delete a tab" };

  // Only allow deleting empty tabs
  const { count } = await admin
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("tab_id", tabId);

  if (count && count > 0)
    return { error: "Cannot delete a tab that has expenses. Remove all expenses first." };

  const { error } = await admin.from("tabs").delete().eq("id", tabId);

  if (error) return { error: error.message };

  revalidatePath(`/${tab.group_id}/expenses`);
}
