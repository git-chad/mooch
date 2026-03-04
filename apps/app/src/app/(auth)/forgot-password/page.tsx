"use client";

import { supabase } from "@/lib/supabase";


import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-callback`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <h1>Check your email</h1>
        <p>If an account exists for {email}, you will receive a password reset link.</p>
        <Link href="/login">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Reset password</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p>
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
