"use server";

import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createOrRetrieveCustomer } from "@/lib/stripe-customers";
import { createClient } from "@mooch/db/server";
import { redirect } from "next/navigation";

// Stripe Price IDs — set these in your Stripe dashboard and update here
const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  club_monthly: process.env.STRIPE_PRICE_CLUB_MONTHLY!,
  club_annual: process.env.STRIPE_PRICE_CLUB_ANNUAL!,
} as const;

// Token pack definitions
const TOKEN_PACKS = {
  starter: { priceId: process.env.STRIPE_PRICE_TOKEN_STARTER!, tokens: 1 },
  popular: { priceId: process.env.STRIPE_PRICE_TOKEN_POPULAR!, tokens: 3 },
  power: { priceId: process.env.STRIPE_PRICE_TOKEN_POWER!, tokens: 9 },
} as const;

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorized");
  return user;
}

export async function createCheckoutSession(
  planId: "pro" | "club",
  billingCycle: "monthly" | "annual",
) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  try {
    const customer = await createOrRetrieveCustomer(user.email!, user.id);

    // Save stripe_customer_id to subscriptions if not already set
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customer.id })
      .eq("user_id", user.id);

    const priceKey =
      `${planId}_${billingCycle}` as keyof typeof STRIPE_PRICE_IDS;
    const priceId = STRIPE_PRICE_IDS[priceKey];

    const session = await stripe.checkout.sessions.create(
      {
        customer: customer.id,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          metadata: { userId: user.id, planId },
          ...(planId === "pro" ? { trial_period_days: 7 } : {}),
        },
        success_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") : "http://localhost:3000"}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/billing`,
        allow_promotion_codes: true,
      },
      {
        idempotencyKey: `checkout-${user.id}-${planId}-${billingCycle}-${Date.now()}`,
      },
    );

    if (!session.url) throw new Error("stripe_error");
    redirect(session.url);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeCardError) {
      throw new Error("card_declined");
    } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      throw new Error("invalid_request");
    } else {
      throw error;
    }
  }
}

export async function createTokenPurchaseSession(
  pack: "starter" | "popular" | "power",
) {
  const user = await getCurrentUser();

  try {
    const customer = await createOrRetrieveCustomer(user.email!, user.id);
    const tokenPack = TOKEN_PACKS[pack];

    const session = await stripe.checkout.sessions.create(
      {
        customer: customer.id,
        mode: "payment",
        line_items: [{ price: tokenPack.priceId, quantity: 1 }],
        payment_intent_data: {
          metadata: { userId: user.id, pack },
        },
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/billing?tokens=purchased`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/billing`,
      },
      {
        idempotencyKey: `token-purchase-${user.id}-${pack}-${Date.now()}`,
      },
    );

    if (!session.url) throw new Error("stripe_error");
    redirect(session.url);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeCardError) {
      throw new Error("card_declined");
    } else if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      throw new Error("invalid_request");
    } else {
      throw error;
    }
  }
}

export async function createPortalSession() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!subscription?.stripe_customer_id) {
    throw new Error("no_subscription");
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/billing`,
    });

    redirect(session.url);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      throw new Error("invalid_request");
    } else {
      throw error;
    }
  }
}
