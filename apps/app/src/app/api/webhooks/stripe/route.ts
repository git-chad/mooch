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
  } catch {
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  const supabase = createAdminClient();

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
    if (!userId) return;

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
    const item = subscription.items.data[0];
    const priceId = item?.price.id;
    const interval = item?.price.recurring?.interval;

    // Determine plan from price ID
    const planId = determinePlanFromPrice(priceId);

    await supabase
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
  }

  async function handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const item = subscription.items.data[0];
    const priceId = item?.price.id;
    const interval = item?.price.recurring?.interval;
    const planId = determinePlanFromPrice(priceId);

    await supabase
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
  }

  async function handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await supabase
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
  }

  async function handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const { userId, pack } = paymentIntent.metadata;
    if (!userId || !pack) return; // Not a token purchase

    const tokenAmount = TOKEN_PACK_AMOUNTS[pack];
    if (!tokenAmount) return;

    // Increment token balance
    const { data: currentBalance } = await supabase
      .from("token_balances")
      .select("balance")
      .eq("user_id", userId)
      .single();

    await supabase
      .from("token_balances")
      .update({
        balance: (currentBalance?.balance ?? 0) + tokenAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Record transaction
    await supabase.from("token_transactions").insert({
      user_id: userId,
      type: "purchase",
      amount: tokenAmount,
      stripe_payment_intent_id: paymentIntent.id,
    });
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

    await supabase
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
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
