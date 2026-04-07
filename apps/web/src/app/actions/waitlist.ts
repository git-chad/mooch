"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { WaitlistActionState } from "@/components/sections/cta/waitlist-state";
import { createAdminClient } from "@/lib/supabase-admin";

const WAITLIST_SOURCE = "website_cta";
const EMAIL_MAX_LENGTH = 320;
const SOURCE_MAX_LENGTH = 100;
const USER_AGENT_MAX_LENGTH = 512;
const MAX_SIGNUPS_PER_IP_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_REGEX =
  /^(?!\.)(?!.*\.\.)[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(email);
}

function toIpAddress(forwardedFor: string | null) {
  if (!forwardedFor) return null;

  const firstEntry = forwardedFor
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);

  return firstEntry || null;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function submitWaitlistSignup(
  _prevState: WaitlistActionState,
  formData: FormData,
): Promise<WaitlistActionState> {
  const rawEmail = String(formData.get("email") ?? "");
  const honeypot = String(formData.get("company") ?? "").trim();
  const rawSource = String(formData.get("source") ?? WAITLIST_SOURCE).trim();

  if (honeypot) {
    return {
      status: "success",
      message: "You're on the list. We'll let you know when it's ready.",
    };
  }

  const email = rawEmail.trim();
  const emailNormalized = normalizeEmail(rawEmail);

  if (!email || !isValidEmail(emailNormalized)) {
    return {
      status: "error",
      fieldErrors: {
        email: "Enter a valid email address.",
      },
    };
  }

  const source = rawSource.slice(0, SOURCE_MAX_LENGTH) || WAITLIST_SOURCE;
  const requestHeaders = await headers();
  const ipAddress =
    toIpAddress(requestHeaders.get("x-forwarded-for")) ||
    requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders
    .get("user-agent")
    ?.trim()
    .slice(0, USER_AGENT_MAX_LENGTH);
  const ipHash = ipAddress ? hashValue(ipAddress) : null;
  const admin = createAdminClient();

  if (ipHash) {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: rateLimitError } = await admin
      .from("waitlist_signups")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (rateLimitError) {
      return {
        status: "error",
        message: "Something went wrong. Please try again in a bit.",
      };
    }

    if ((count ?? 0) >= MAX_SIGNUPS_PER_IP_PER_HOUR) {
      return {
        status: "error",
        message: "Too many signup attempts. Please try again later.",
      };
    }
  }

  const { error } = await admin.from("waitlist_signups").upsert(
    {
      email,
      email_normalized: emailNormalized,
      source,
      ip_hash: ipHash,
      user_agent: userAgent ?? null,
    },
    {
      onConflict: "email_normalized",
      ignoreDuplicates: false,
    },
  );

  if (error) {
    return {
      status: "error",
      message: "Something went wrong. Please try again in a bit.",
    };
  }

  return {
    status: "success",
    message: "You're on the list. We'll let you know when it's ready.",
  };
}
