import { getProfile } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { Container, Text } from "@mooch/ui";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);

  if (!profile) redirect("/login");

  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl space-y-6">
        <Text as="h1" variant="title">Profile</Text>
        <ProfileForm profile={profile} email={user.email ?? ""} />
      </div>
    </Container>
  );
}
