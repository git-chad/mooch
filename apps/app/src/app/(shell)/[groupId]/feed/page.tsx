import { getFeedItems, getProfile, getSignedFeedMediaUrl } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import type { Profile } from "@mooch/types";
import { notFound, redirect } from "next/navigation";
import { FeedListClient } from "@/components/feed/FeedListClient";
import type { FeedItemUI, FeedLinkOption } from "@/components/feed/types";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ groupId: string }> };

export default async function FeedPage({ params }: Props) {
  const { groupId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) notFound();

  const [profile, initialFeedItemsRaw, pollsRaw, expensesRaw] = await Promise.all([
    getProfile(admin, user.id),
    getFeedItems(admin, groupId, undefined, user.id),
    admin
      .from("polls")
      .select("id, question, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("expenses")
      .select("id, description, created_at, tab_id")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const initialFeedItems = (await Promise.all(
    initialFeedItemsRaw.map(async (item) => ({
      ...item,
      media_url: item.media_path
        ? await getSignedFeedMediaUrl(admin, item.media_path)
        : null,
    })),
  )) as FeedItemUI[];

  const pollOptions: FeedLinkOption[] =
    (pollsRaw.data ?? []).map((row) => ({
      id: row.id as string,
      label: row.question as string,
    })) ?? [];

  const expenseOptions: FeedLinkOption[] =
    (expensesRaw.data ?? []).map((row) => ({
      id: row.id as string,
      label: row.description as string,
      tabId: (row.tab_id as string) ?? undefined,
    })) ?? [];

  const fallbackProfile: Profile = {
    id: user.id,
    display_name: "You",
    photo_url: null,
    locale: "en-US",
    default_currency: "USD",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <FeedListClient
      groupId={groupId}
      currentUserProfile={profile ?? fallbackProfile}
      initialItems={initialFeedItems}
      pollOptions={pollOptions}
      expenseOptions={expenseOptions}
    />
  );
}
