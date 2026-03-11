import { getExpenseById, getGroupById, getTabById } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { notFound, redirect } from "next/navigation";
import { ExpenseDetailClient } from "@/components/expenses/ExpenseDetailClient";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ groupId: string; tabId: string; expenseId: string }>;
};

export default async function ExpenseDetailPage({ params }: Props) {
  const { groupId, tabId, expenseId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [group, tab, expense] = await Promise.all([
    getGroupById(admin, groupId),
    getTabById(admin, tabId),
    getExpenseById(admin, expenseId),
  ]);

  if (
    !group ||
    !tab ||
    !expense ||
    tab.group_id !== groupId ||
    expense.group_id !== groupId ||
    expense.tab_id !== tabId
  ) {
    notFound();
  }

  const currentMember = group.members.find(
    (member) => member.user_id === user.id,
  );
  if (!currentMember) notFound();

  const canManage =
    expense.created_by === user.id || currentMember.role === "admin";

  // Generate a signed URL for the receipt photo if one exists
  let receiptSignedUrl: string | null = null;
  if (expense.photo_url) {
    const { data: signedData } = await admin.storage
      .from("receipts")
      .createSignedUrl(expense.photo_url, 60 * 60); // 1 hour
    receiptSignedUrl = signedData?.signedUrl ?? null;
  }

  return (
    <ExpenseDetailClient
      groupId={groupId}
      tabId={tabId}
      tabName={tab.name}
      tabCurrency={tab.currency}
      expense={expense}
      group={group}
      currentUserId={user.id}
      canManage={canManage}
      receiptUrl={receiptSignedUrl}
    />
  );
}
