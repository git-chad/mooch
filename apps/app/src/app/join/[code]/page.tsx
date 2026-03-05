import { createClient } from "@mooch/db/server";
import { Button } from "@mooch/ui";
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
        <p className="text-sm text-[#7A6E65] font-sans">
          You were invited to join
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#D8C8BC] bg-[#F8F6F1] text-[#4A3728]">
            <GroupIcon value={groupPreview.emoji} size={24} />
          </span>
          <h1 className="text-2xl font-semibold text-[#1F2A23] font-sans">
            {groupPreview.name}
          </h1>
        </div>

        <p className="mt-2 text-xs text-[#7A6E65] font-mono tracking-widest uppercase">
          Code: {normalizedCode}
        </p>

        {error && (
          <p className="mt-4 text-xs text-[#C0392B] font-sans">{error}</p>
        )}

        <div className="mt-6">
          {!user ? (
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="inline-flex w-full items-center justify-center rounded-full border border-[#5A9629] px-4 py-2.5 text-sm font-medium text-[#F4FBFF] bg-[var(--action-gradient)] shadow-[var(--shadow-btn-primary)]"
            >
              Join this squad
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
        <h1 className="text-xl font-semibold text-[#1F2A23] font-sans">
          Invite not found
        </h1>
        <p className="mt-2 text-sm text-[#7A6E65] font-sans">
          This invite link is invalid or expired.
        </p>
        <div className="mt-5">
          <Link
            href="/groups"
            className="inline-flex items-center justify-center rounded-full border border-[#D8C8BC] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#4D6480]"
          >
            Go to groups
          </Link>
        </div>
      </div>
    </section>
  );
}
