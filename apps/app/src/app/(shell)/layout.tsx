import { createClient } from "@mooch/db/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <div>
      <nav>
        <Link href="/groups">Groups</Link>
        {" | "}
        <Link href="/profile">Profile</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
