import { getPolls } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import type { PollWithOptions } from "@mooch/stores";
import { notFound, redirect } from "next/navigation";
import { PollsProvider } from "@/components/polls/PollsProvider";
import { PollListClient } from "@/components/polls/PollListClient";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ groupId: string }> };

export default async function PollsPage({ params }: Props) {
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

  const initialPolls = await getPolls(admin, groupId);

  return (
    <PollsProvider groupId={groupId} initialPolls={initialPolls as PollWithOptions[]}>
      <PollListClient groupId={groupId} currentUserId={user.id} />
    </PollsProvider>
  );
}
