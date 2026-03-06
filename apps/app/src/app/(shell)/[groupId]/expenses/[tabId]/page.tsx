import {
  getBalances,
  getExpenses,
  getGroupById,
  getTabById,
} from "@mooch/db";
import { createClient } from "@mooch/db/server";
import type { BalanceWithProfiles } from "@mooch/stores";
import { notFound, redirect } from "next/navigation";
import { ExpensesTabProvider } from "@/components/expenses/ExpensesProvider";
import { TabDetailClient } from "@/components/expenses/TabDetailClient";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ groupId: string; tabId: string }>;
};

export default async function TabDetailPage({ params }: Props) {
  const { groupId, tabId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [group, tab, initialExpenses, initialBalances] = await Promise.all([
    getGroupById(admin, groupId),
    getTabById(admin, tabId),
    getExpenses(admin, tabId),
    getBalances(admin, tabId),
  ]);

  if (!group || !tab || tab.group_id !== groupId) notFound();

  return (
    <ExpensesTabProvider
      tabId={tabId}
      initialExpenses={initialExpenses}
      initialBalances={initialBalances as BalanceWithProfiles[]}
    >
      <TabDetailClient
        groupId={groupId}
        tabId={tabId}
        tab={tab}
        group={group}
        currentUserId={user.id}
      />
    </ExpensesTabProvider>
  );
}
