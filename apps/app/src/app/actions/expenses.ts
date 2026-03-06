"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { recalculateBalances } from "@/lib/recalculate-balances";
import { createClient } from "@mooch/db/server";
import type { Expense, ExpenseCategory, SplitType } from "@mooch/types";
import { revalidatePath } from "next/cache";

const RECEIPT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const RECEIPT_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
]);

// ─────────────────────────────────────────────
// Receipt photo upload
// ─────────────────────────────────────────────

async function ensureReceiptsBucket() {
  const admin = createAdminClient();
  const { data: bucket, error: bucketError } =
    await admin.storage.getBucket("receipts");

  if (bucket) return;

  const isNotFound =
    bucketError?.message?.toLowerCase().includes("not found") ||
    (bucketError as { statusCode?: number | string } | null)?.statusCode === 404 ||
    (bucketError as { statusCode?: number | string } | null)?.statusCode === "404";

  if (bucketError && !isNotFound) return;

  await admin.storage.createBucket("receipts", {
    public: false,
    fileSizeLimit: "5MB",
  });
}

export async function uploadReceiptPhoto(
  formData: FormData,
): Promise<{ path: string } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("receipt");
  if (!(file instanceof File)) return { error: "No file provided" };

  if (file.size > RECEIPT_MAX_SIZE_BYTES)
    return { error: "File too large. Maximum size is 5 MB." };

  if (file.type && !RECEIPT_ALLOWED_TYPES.has(file.type.toLowerCase()))
    return { error: "Unsupported format. Use PNG, JPG, WEBP, or HEIC." };

  await ensureReceiptsBucket();

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const path = `${user.id}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await admin.storage
    .from("receipts")
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) return { error: uploadError.message };

  return { path };
}

// ─────────────────────────────────────────────
// Add expense
// ─────────────────────────────────────────────

type ParticipantInput = {
  user_id: string;
  share_amount: number;
};

type AddExpenseInput = {
  description: string;
  notes?: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  converted_amount?: number;
  rate_fetched_at?: string;
  category: ExpenseCategory;
  // Lucide icon name — only used when category is 'other'
  custom_category?: string;
  paid_by: string;
  split_type: SplitType;
  photo_url?: string;
  participants: ParticipantInput[];
};

export async function addExpense(
  groupId: string,
  data: AddExpenseInput,
): Promise<{ expense: Expense } | { error: string }> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.participants.length === 0)
    return { error: "At least one participant is required" };

  const { data: expense, error: expenseError } = await admin
    .from("expenses")
    .insert({
      group_id: groupId,
      description: data.description,
      notes: data.notes ?? null,
      amount: data.amount,
      currency: data.currency,
      exchange_rate: data.exchange_rate ?? null,
      converted_amount: data.converted_amount ?? null,
      rate_fetched_at: data.rate_fetched_at ?? null,
      category: data.category,
      custom_category: data.category === "other" ? (data.custom_category ?? null) : null,
      paid_by: data.paid_by,
      split_type: data.split_type,
      photo_url: data.photo_url ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (expenseError || !expense)
    return { error: expenseError?.message ?? "Failed to create expense" };

  const { error: participantsError } = await admin
    .from("expense_participants")
    .insert(
      data.participants.map((p) => ({
        expense_id: expense.id,
        user_id: p.user_id,
        share_amount: p.share_amount,
      })),
    );

  if (participantsError) {
    await admin.from("expenses").delete().eq("id", expense.id);
    return { error: participantsError.message };
  }

  await recalculateBalances(groupId);
  revalidatePath(`/${groupId}/expenses`);

  return { expense: expense as Expense };
}

// ─────────────────────────────────────────────
// Update expense
// ─────────────────────────────────────────────

type UpdateExpenseInput = Partial<
  Omit<AddExpenseInput, "participants">
> & {
  participants?: ParticipantInput[];
};

export async function updateExpense(
  expenseId: string,
  data: UpdateExpenseInput,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify caller is the creator or a group admin.
  const { data: expense } = await admin
    .from("expenses")
    .select("group_id, created_by")
    .eq("id", expenseId)
    .single();

  if (!expense) return { error: "Expense not found" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", expense.group_id)
    .eq("user_id", user.id)
    .single();

  if (expense.created_by !== user.id && member?.role !== "admin")
    return { error: "Only the creator or an admin can edit this expense" };

  const { participants, ...fields } = data;

  if (Object.keys(fields).length > 0) {
    const { error } = await admin
      .from("expenses")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", expenseId);

    if (error) return { error: error.message };
  }

  if (participants && participants.length > 0) {
    await admin
      .from("expense_participants")
      .delete()
      .eq("expense_id", expenseId);

    const { error } = await admin.from("expense_participants").insert(
      participants.map((p) => ({
        expense_id: expenseId,
        user_id: p.user_id,
        share_amount: p.share_amount,
      })),
    );

    if (error) return { error: error.message };
  }

  await recalculateBalances(expense.group_id);
  revalidatePath(`/${expense.group_id}/expenses`);
}

// ─────────────────────────────────────────────
// Delete expense
// ─────────────────────────────────────────────

export async function deleteExpense(
  expenseId: string,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: expense } = await admin
    .from("expenses")
    .select("group_id, created_by")
    .eq("id", expenseId)
    .single();

  if (!expense) return { error: "Expense not found" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", expense.group_id)
    .eq("user_id", user.id)
    .single();

  if (expense.created_by !== user.id && member?.role !== "admin")
    return { error: "Only the creator or an admin can delete this expense" };

  const { error } = await admin
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) return { error: error.message };

  await recalculateBalances(expense.group_id);
  revalidatePath(`/${expense.group_id}/expenses`);
}

// ─────────────────────────────────────────────
// Apply / refresh exchange rate on an expense
// Called when the user triggers conversion or re-runs a stale rate.
// ─────────────────────────────────────────────

export async function applyExchangeRate(
  expenseId: string,
  exchangeRate: number,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: expense } = await admin
    .from("expenses")
    .select("group_id, amount, created_by")
    .eq("id", expenseId)
    .single();

  if (!expense) return { error: "Expense not found" };

  const { data: member } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", expense.group_id)
    .eq("user_id", user.id)
    .single();

  if (expense.created_by !== user.id && member?.role !== "admin")
    return { error: "Only the creator or an admin can update the exchange rate" };

  const converted_amount =
    Math.round(Number(expense.amount) * exchangeRate * 100) / 100;

  const { error } = await admin
    .from("expenses")
    .update({
      exchange_rate: exchangeRate,
      converted_amount,
      rate_fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", expenseId);

  if (error) return { error: error.message };

  await recalculateBalances(expense.group_id);
  revalidatePath(`/${expense.group_id}/expenses`);
}

// ─────────────────────────────────────────────
// Settle up
// Creates a settlement payment record and recalculates balances.
// ─────────────────────────────────────────────

type SettleUpInput = {
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  converted_amount?: number;
  rate_fetched_at?: string;
  notes?: string;
};

export async function settleUp(
  groupId: string,
  data: SettleUpInput,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.from_user === data.to_user)
    return { error: "Cannot settle with yourself" };

  const { error } = await admin.from("settlement_payments").insert({
    group_id: groupId,
    from_user: data.from_user,
    to_user: data.to_user,
    amount: data.amount,
    currency: data.currency,
    exchange_rate: data.exchange_rate ?? null,
    converted_amount: data.converted_amount ?? null,
    rate_fetched_at: data.rate_fetched_at ?? null,
    notes: data.notes ?? null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  await recalculateBalances(groupId);
  revalidatePath(`/${groupId}/expenses`);
}
