import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("polls")
    .update({ is_closed: true, updated_at: now })
    .eq("is_closed", false)
    .lt("closes_at", now)
    .select("id");

  if (error) {
    console.error("Failed to close expired polls:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  const count = data?.length ?? 0;
  console.log(`Closed ${count} expired poll(s)`);

  return new Response(
    JSON.stringify({ success: true, closed: count }),
    { status: 200 },
  );
});
