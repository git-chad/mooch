import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase-admin";
import type Stripe from "stripe";

const TOKEN_PACK_AMOUNTS: Record<string, number> = {
  starter: 1,
  popular: 3,
  power: 9,
};

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  console.log(`[stripe-webhook] Received event: ${event.type} (${event.id})`);

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Handler error for ${event.type}:`, err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });

  // --- Handler implementations ---

  async function handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ) {
    if (session.mode !== "subscription") return;

    // Get userId from subscription metadata or customer metadata
    let userId: string | undefined;
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      userId = subscription.metadata?.userId;
    }
    if (!userId && session.customer) {
      const customer = await stripe.customers.retrieve(
        session.customer as string,
      );
      if (!customer.deleted) {
        userId = customer.metadata?.userId;
      }
    }
    if (!userId) {
      console.error("[stripe-webhook] checkout.session.completed: no userId found in metadata", {
        sessionId: session.id,
        subscription: session.subscription,
        customer: session.customer,
      });
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
    const item = subscription.items.data[0];
    const priceId = item?.price.id;
    const interval = item?.price.recurring?.interval;

    // Determine plan from price ID
    const planId = determinePlanFromPrice(priceId);
    console.log(`[stripe-webhook] Upgrading user ${userId} to ${planId} (${interval})`);

    const { error } = await supabase
      .from("subscriptions")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer as string,
        plan_id: planId,
        billing_cycle: interval === "year" ? "annual" : "monthly",
        status: "active",
        current_period_start: item
          ? new Date(item.current_period_start * 1000).toISOString()
          : null,
        current_period_end: item
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[stripe-webhook] Failed to update subscription:", error);
      throw error;
    }
  }

  async function handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ) {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error("[stripe-webhook] subscription.updated: no userId in metadata", {
        subscriptionId: subscription.id,
      });
      return;
    }

    const item = subscription.items.data[0];
    const priceId = item?.price.id;
    const interval = item?.price.recurring?.interval;
    const planId = determinePlanFromPrice(priceId);

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan_id: planId,
        billing_cycle: interval === "year" ? "annual" : "monthly",
        status: subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "canceled",
        current_period_start: item
          ? new Date(item.current_period_start * 1000).toISOString()
          : null,
        current_period_end: item
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[stripe-webhook] Failed to update subscription:", error);
      throw error;
    }
  }

  async function handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ) {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error("[stripe-webhook] subscription.deleted: no userId in metadata", {
        subscriptionId: subscription.id,
      });
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        plan_id: "free",
        status: "canceled",
        stripe_subscription_id: null,
        stripe_customer_id: null,
        current_period_start: null,
        current_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[stripe-webhook] Failed to delete subscription:", error);
      throw error;
    }
  }

  async function handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const { userId, pack } = paymentIntent.metadata;
    if (!userId || !pack) return; // Not a token purchase

    const tokenAmount = TOKEN_PACK_AMOUNTS[pack];
    if (!tokenAmount) return;

    console.log(`[stripe-webhook] Adding ${tokenAmount} tokens for user ${userId} (pack: ${pack})`);

    // Increment token balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from("token_balances")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("[stripe-webhook] Failed to fetch token balance:", fetchError);
      throw fetchError;
    }

    const { error: updateError } = await supabase
      .from("token_balances")
      .update({
        balance: (currentBalance?.balance ?? 0) + tokenAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[stripe-webhook] Failed to update token balance:", updateError);
      throw updateError;
    }

    // Record transaction
    const { error: insertError } = await supabase.from("token_transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: tokenAmount,
      stripe_payment_intent_id: paymentIntent.id,
    });

    if (insertError) {
      console.error("[stripe-webhook] Failed to insert token transaction:", insertError);
      throw insertError;
    }
  }

  async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionRef =
      invoice.parent?.subscription_details?.subscription;
    if (!subscriptionRef) return;

    const subscriptionId =
      typeof subscriptionRef === "string"
        ? subscriptionRef
        : subscriptionRef.id;

    const subscription =
      await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[stripe-webhook] Failed to mark subscription past_due:", error);
      throw error;
    }
  }
}

function determinePlanFromPrice(priceId: string): string {
  const proPrices = [
    process.env.STRIPE_PRICE_PRO_MONTHLY,
    process.env.STRIPE_PRICE_PRO_ANNUAL,
  ];
  const clubPrices = [
    process.env.STRIPE_PRICE_CLUB_MONTHLY,
    process.env.STRIPE_PRICE_CLUB_ANNUAL,
  ];

  if (proPrices.includes(priceId)) return "pro";
  if (clubPrices.includes(priceId)) return "club";
  return "free";
}
