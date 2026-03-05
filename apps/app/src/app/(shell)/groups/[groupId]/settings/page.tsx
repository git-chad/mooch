import { getGroupById } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { notFound, redirect } from "next/navigation";
import { GroupSettingsClient } from "@/components/groups/GroupSettingsClient";

type GroupSettingsPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupSettingsPage({
  params,
}: GroupSettingsPageProps) {
  const { groupId } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const group = await getGroupById(supabase, groupId);

  if (!group) {
    notFound();
  }

  const currentMember = group.members.find(
    (member) => member.user_id === session.user.id,
  );

  const currentUserRole =
    currentMember?.role === "admin" ? "admin" : currentMember ? "member" : null;

  return (
    <GroupSettingsClient
      group={group}
      currentUserId={session.user.id}
      currentUserRole={currentUserRole}
    />
  );
}
