import { createClient } from "@mooch/db/server";
import { redirect } from "next/navigation";
import { GroupsPageClient } from "@/components/groups/GroupsPageClient";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GroupsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships, error: membershipsError } = await admin
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (membershipsError || !memberships?.length) {
    return <GroupsPageClient groups={[]} />;
  }

  const groupIds = Array.from(
    new Set(memberships.map((entry) => entry.group_id)),
  );

  const { data: groups, error: groupsError } = await admin
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupsError || !groups) {
    return <GroupsPageClient groups={[]} />;
  }

  const { data: memberCounts, error: memberCountsError } = await admin
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  if (memberCountsError) {
    const groupsWithZeroCounts = groups.map((group) => ({
      ...group,
      memberCount: 0,
    }));
    return <GroupsPageClient groups={groupsWithZeroCounts} />;
  }

  const countsMap = new Map<string, number>();
  for (const row of memberCounts ?? []) {
    countsMap.set(row.group_id, (countsMap.get(row.group_id) ?? 0) + 1);
  }

  const groupsWithCounts = groups.map((group) => ({
    ...group,
    memberCount: countsMap.get(group.id) ?? 0,
  }));

  return <GroupsPageClient groups={groupsWithCounts} />;
}
