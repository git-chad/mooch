import { getGroupById } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { notFound, redirect } from "next/navigation";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";

type GroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(supabase, groupId);

  if (!group) {
    notFound();
  }

  return <GroupDetailClient group={group} currentUserId={user.id} />;
}
