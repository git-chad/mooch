import { createClient } from "@mooch/db/server";
import type { Group } from "@mooch/types";
import { redirect } from "next/navigation";
import { GroupsProvider } from "@/components/layout/GroupsProvider";
import { ShellTopNav } from "@/components/layout/ShellTopNav";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  let groups: Group[] = [];

  const { data: memberships, error: membershipsError } = await admin
    .from("group_members")
    .select("group_id")
    .eq("user_id", session.user.id);

  if (!membershipsError && memberships?.length) {
    const groupIds = Array.from(
      new Set(memberships.map((entry) => entry.group_id)),
    );
    const { data: groupsData } = await admin
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    groups = groupsData ?? [];
  }

  return (
    <GroupsProvider groups={groups}>
      <div className="min-h-screen bg-[#F8F6F1]">
        <ShellTopNav />
        <main className="pb-8">{children}</main>
      </div>
    </GroupsProvider>
  );
}
