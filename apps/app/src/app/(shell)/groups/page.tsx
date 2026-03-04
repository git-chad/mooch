import { getProfile } from "@mooch/db";
import { createClient } from "@mooch/db/server";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const profile = session ? await getProfile(supabase, session.user.id) : null;

  return (
    <div>
      <h1>Welcome, {profile?.display_name ?? "there"}</h1>
      <p>Groups — coming soon</p>
    </div>
  );
}
