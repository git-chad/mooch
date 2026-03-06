import { createClient } from "@mooch/db/server";
import { Button, Text } from "@mooch/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { joinGroupByCode } from "@/app/actions/groups";
import { GroupIcon } from "@/components/groups/group-icon";
import { createAdminClient } from "@/lib/supabase-admin";

type JoinPageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function JoinByCodePage({
  params,
  searchParams,
}: JoinPageProps) {
  const { code } = await params;
  const { error } = await searchParams;

  const normalizedCode = code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  if (normalizedCode.length !== 6) {
    return <InvalidCodeState />;
  }

  let groupPreview: { id: string; name: string; emoji: string } | null = null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("groups")
      .select("id,name,emoji")
      .eq("invite_code", normalizedCode)
      .maybeSingle();

    if (data) {
      groupPreview = data;
    }
  } catch {
    groupPreview = null;
  }

  if (!groupPreview) {
    return <InvalidCodeState />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function handleJoin() {
    "use server";

    const result = await joinGroupByCode(normalizedCode);

    if ("error" in result) {
      redirect(
        `/join/${normalizedCode}?error=${encodeURIComponent(result.error)}`,
      );
    }

    redirect(`/${result.groupId}`);
  }

  const nextPath = `/join/${normalizedCode}`;

  return (
    <section className="mx-auto min-h-screen w-full max-w-xl grid place-items-center p-4">
      <div className="w-full rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-6 text-center shadow-[var(--shadow-elevated)]">
        <Text variant="body" color="muted">You were invited to join</Text>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#D8C8BC] bg-[#F8F6F1] text-[#4A3728]">
            <GroupIcon value={groupPreview.emoji} size={24} />
          </span>
          <Text as="h1" variant="title">{groupPreview.name}</Text>
        </div>

        <Text variant="caption" color="muted" className="mt-2 font-mono tracking-widest uppercase">
          Code: {normalizedCode}
        </Text>

        {error && <Text variant="caption" color="danger" className="mt-4">{error}</Text>}

        <div className="mt-6">
          {!user ? (
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
              <Button variant="primary" className="w-full">
                Join this squad
              </Button>
            </Link>
          ) : (
            <form action={handleJoin}>
              <Button type="submit" variant="primary" className="w-full">
                Join this squad
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function InvalidCodeState() {
  return (
    <section className="mx-auto min-h-screen w-full max-w-xl grid place-items-center p-4">
      <div className="w-full rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-6 text-center shadow-[var(--shadow-elevated)]">
        <Text as="h1" variant="heading">Invite not found</Text>
        <Text variant="body" color="muted" className="mt-2">
          This invite link is invalid or expired.
        </Text>
        <div className="mt-5">
          <Link href="/groups">
            <Button variant="secondary">
              Go to groups
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
