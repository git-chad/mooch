import { getGlobalBalances, getGroupById, getTabs } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import type { BalanceWithProfiles } from "@mooch/stores";
import { notFound, redirect } from "next/navigation";
import { ExpensesGroupProvider } from "@/components/expenses/ExpensesProvider";
import { TabListClient } from "@/components/expenses/TabListClient";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ groupId: string }> };

export default async function ExpensesPage({ params }: Props) {
  const { groupId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [group, initialTabs, initialGlobalBalances] = await Promise.all([
    getGroupById(admin, groupId),
    getTabs(admin, groupId),
    getGlobalBalances(admin, groupId),
  ]);

  const { count: expenseCount } = await admin
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId);

  const hasAnyExpenses = (expenseCount ?? 0) > 0;

  if (!group) notFound();

  return (
    <ExpensesGroupProvider
      groupId={groupId}
      initialTabs={initialTabs}
      initialGlobalBalances={initialGlobalBalances as BalanceWithProfiles[]}
    >
      <TabListClient
        groupId={groupId}
        group={group}
        currentUserId={user.id}
        hasAnyExpenses={hasAnyExpenses}
      />
    </ExpensesGroupProvider>
  );
}
