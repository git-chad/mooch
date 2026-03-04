import { getProfile } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const profile = await getProfile(supabase, session.user.id);

  if (!profile) redirect("/login");

  return (
    <div>
      <h1>Profile</h1>
      <ProfileForm profile={profile} email={session.user.email ?? ""} />
    </div>
  );
}
