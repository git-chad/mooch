import { getUserPlan, getUserTokenBalance } from "@mooch/db";
import { createClient } from "@mooch/db/server";
import { Container } from "@mooch/ui";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const plan = await getUserPlan(supabase, user.id);
  const tokenBalance = await getUserTokenBalance(supabase, user.id);

  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-4xl">
        <BillingClient plan={plan} tokenBalance={tokenBalance} />
      </div>
    </Container>
  );
}
