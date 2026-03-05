import { getGroupById } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { notFound, redirect } from "next/navigation";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";

type GroupOverviewPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupOverviewPage({
  params,
}: GroupOverviewPageProps) {
  const { groupId } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const group = await getGroupById(supabase, groupId);

  if (!group) notFound();

  return <GroupDetailClient group={group} currentUserId={session.user.id} />;
}
