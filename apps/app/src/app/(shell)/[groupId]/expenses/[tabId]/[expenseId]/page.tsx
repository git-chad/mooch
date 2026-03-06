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

  return (
    <ExpenseDetailClient
      groupId={groupId}
      tabId={tabId}
      tabName={tab.name}
      expense={expense}
      group={group}
      currentUserId={user.id}
      canManage={canManage}
    />
  );
}
