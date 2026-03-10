import { getProfile } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { Container, Text, Button } from "@mooch/ui";
import { CreditCard } from "lucide-react";
import Link from "next/link";
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
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-5xl space-y-6">
        <Text as="h1" variant="title">Profile</Text>
        <ProfileForm profile={profile} email={user.email ?? ""} />

        <div className="rounded-xl border border-[#EDE3DA] bg-[#FDFCFB] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-[#8C7463]" />
              <div>
                <Text variant="body" className="font-medium">Billing & Tokens</Text>
                <Text variant="caption" color="subtle">Manage your subscription and corruption tokens</Text>
              </div>
            </div>
            <Link href="/billing">
              <Button variant="secondary" size="sm">Manage</Button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
