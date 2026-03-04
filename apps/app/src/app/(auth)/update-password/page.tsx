"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updatePasswordAction } from "./actions";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error } = await updatePasswordAction(password);
    setLoading(false);

    if (error) {
      setError(error);
      return;
    }

    router.push("/groups");
  }

  return (
    <div>
      <h1>Set new password</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Set password"}
        </button>
      </form>
    </div>
  );
}
