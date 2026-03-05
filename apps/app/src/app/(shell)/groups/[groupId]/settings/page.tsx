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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(supabase, groupId);

  if (!group) {
    notFound();
  }

  const currentMember = group.members.find(
    (member) => member.user_id === user.id,
  );

  const currentUserRole =
    currentMember?.role === "admin" ? "admin" : currentMember ? "member" : null;

  return (
    <GroupSettingsClient
      group={group}
      currentUserId={user.id}
      currentUserRole={currentUserRole}
    />
  );
}
