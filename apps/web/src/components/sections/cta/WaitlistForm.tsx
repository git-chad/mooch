"use client";

import { Button, Input } from "@mooch/ui";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitWaitlistSignup } from "@/app/actions/waitlist";
import { initialWaitlistState } from "./waitlist-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="md"
      variant="primary"
      loading={pending}
      disabled={pending}
      className="h-[38px] px-4 py-[10px]"
    >
      {pending ? "Joining..." : "Sign up to Waitlist"}
    </Button>
  );
}

export function WaitlistForm() {
  const [state, formAction] = useActionState(
    submitWaitlistSignup,
    initialWaitlistState,
  );

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {state.status === "success" ? null : (
        <form
          action={formAction}
          className="flex w-full sm:w-auto flex-col items-center justify-center gap-3 sm:flex-row sm:gap-[19px]"
        >
          <input type="hidden" name="source" value="website_cta" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
          >
            <label htmlFor="waitlist-company">Company</label>
            <input
              id="waitlist-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="w-full sm:w-[240px]">
            <Input
              aria-label="Email"
              autoComplete="email"
              className="h-[36px] border-[#DCCABF] bg-[linear-gradient(in_oklab_180deg,oklab(100%_0_.0001_/_92%)_0%,oklab(94.7%_.005_.009_/_72%)_100%)] px-3 text-[13px] leading-[16px] text-[#68809A] shadow-none"
              error={state.fieldErrors?.email}
              id="waitlist-email"
              maxLength={320}
              name="email"
              placeholder="Your email..."
              required
              type="email"
            />
          </div>

          <SubmitButton />
        </form>
      )}

      <p
        aria-live="polite"
        className="min-h-[20px] w-full text-center text-xs font-sans leading-5 sm:basis-full"
      >
        {state.status === "success" ? (
          <span className="text-[#4F6B58]">{state.message}</span>
        ) : state.status === "error" && state.message ? (
          <span className="text-[#9B4D3A]">{state.message}</span>
        ) : null}
      </p>
    </div>
  );
}
