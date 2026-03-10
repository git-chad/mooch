import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch all users with their active plan's monthly grant
  const { data: users, error } = await supabase
    .from("subscriptions")
    .select("user_id, plans(tokens_monthly_grant)")
    .eq("status", "active");

  if (error) {
    console.error("Failed to fetch subscriptions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  let processed = 0;

  for (const row of users ?? []) {
    const grant = (row.plans as any)?.tokens_monthly_grant ?? 0;
    if (grant <= 0) continue;

    // Increment balance (additive — unspent tokens carry over)
    const { data: current } = await supabase
      .from("token_balances")
      .select("balance")
      .eq("user_id", row.user_id)
      .single();

    await supabase
      .from("token_balances")
      .update({
        balance: (current?.balance ?? 0) + grant,
        reset_at: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          1,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", row.user_id);

    // Record the grant transaction
    await supabase.from("token_transactions").insert({
      user_id: row.user_id,
      type: "monthly_grant",
      amount: grant,
    });

    processed++;
  }

  console.log(`Monthly token grant complete: ${processed} users processed`);

  return new Response(
    JSON.stringify({ success: true, processed }),
    { status: 200 },
  );
});
