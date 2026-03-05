import { getProfile } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import type { Group } from "@mooch/types";
import { redirect } from "next/navigation";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { GroupsProvider } from "@/components/layout/GroupsProvider";
import { MobileTopBar } from "@/components/layout/MobileTopBar";
import { Sidebar } from "@/components/layout/Sidebar";
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

  const profile = await getProfile(supabase, session.user.id);
  const profileData = profile
    ? { display_name: profile.display_name, photo_url: profile.photo_url }
    : null;

  return (
    <GroupsProvider groups={groups}>
      <div className="flex h-screen overflow-hidden bg-[#F8F6F1]">
        <Sidebar
          className="hidden md:flex flex-col w-60 shrink-0"
          profile={profileData}
        />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <MobileTopBar className="md:hidden" profile={profileData} />
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
          <BottomTabBar className="md:hidden" />
        </div>
      </div>
    </GroupsProvider>
  );
}
