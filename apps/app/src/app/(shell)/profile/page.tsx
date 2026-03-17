import { getProfile } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { Button, Container, Text } from "@mooch/ui";
import { CreditCard, Settings2 } from "lucide-react";
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
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-3xl space-y-6">
        <div className="rounded-2xl border border-[#E7D8CC] bg-[linear-gradient(180deg,#FDFCFB_0%,#F7F1EA_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_14px_30px_rgba(92,63,42,0.09)] sm:px-6">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#DCCBC0] bg-[#F7EFE7] px-3 py-1">
            <Settings2 className="h-3.5 w-3.5 text-[#806D5E]" />
            <Text variant="caption" className="font-medium text-[#806D5E]">
              Account settings
            </Text>
          </div>
          <Text as="h1" variant="title">
            Your profile
          </Text>
          <Text variant="body" color="subtle" className="mt-1">
            Manage identity, language, and default currency preferences.
          </Text>
        </div>

        <ProfileForm profile={profile} email={user.email ?? ""} />

        <div className="rounded-2xl border border-[#E7D8CC] bg-[#FDFCFB] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_24px_rgba(92,63,42,0.07)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F1E7DE]">
                <CreditCard size={18} className="text-[#8C7463]" />
              </span>
              <div>
                <Text variant="body" className="font-medium">
                  Billing & Tokens
                </Text>
                <Text variant="caption" color="subtle">
                  Manage your subscription and corruption tokens
                </Text>
              </div>
            </div>
            <Link href="/billing">
              <Button variant="secondary" size="sm">
                Manage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
