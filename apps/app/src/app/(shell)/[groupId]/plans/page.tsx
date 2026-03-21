import { getPlans } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import type { PlanWithDetails } from "@mooch/stores";
import { notFound, redirect } from "next/navigation";
import { PlansProvider } from "@/components/plans/PlansProvider";
import { KanbanBoard } from "@/components/plans/KanbanBoard";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ groupId: string }> };

export default async function PlansPage({ params }: Props) {
  const { groupId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify membership
  const { data: member } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!member) notFound();

  const initialPlans = await getPlans(admin, groupId);

  return (
    <PlansProvider groupId={groupId} initialPlans={initialPlans as PlanWithDetails[]}>
      <KanbanBoard groupId={groupId} currentUserId={user.id} />
    </PlansProvider>
  );
}
