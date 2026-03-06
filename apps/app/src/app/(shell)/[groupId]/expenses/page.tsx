import { getBalances, getExpenses, getGroupById } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import type { BalanceWithProfiles } from "@mooch/stores";
import { notFound, redirect } from "next/navigation";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { ExpensesProvider } from "@/components/expenses/ExpensesProvider";
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

  // Use admin for group (members + profiles join bypasses RLS)
  // and for expenses/balances (avoids any profile-join RLS edge cases)
  const [group, initialExpenses, initialBalances] = await Promise.all([
    getGroupById(admin, groupId),
    getExpenses(admin, groupId),
    getBalances(admin, groupId),
  ]);

  if (!group) notFound();

  return (
    <ExpensesProvider
      groupId={groupId}
      initialExpenses={initialExpenses}
      initialBalances={initialBalances as BalanceWithProfiles[]}
    >
      <ExpensesClient groupId={groupId} group={group} currentUserId={user.id} />
    </ExpensesProvider>
  );
}
