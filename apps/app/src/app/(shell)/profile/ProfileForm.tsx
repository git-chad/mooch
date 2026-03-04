"use client";

import { createBrowserClient, updateProfile } from "@mooch/db";
import type { Profile } from "@mooch/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CURRENCIES = ["USD", "EUR", "ARS", "BRL"];
const LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export default function ProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [locale, setLocale] = useState(profile.locale);
  const [currency, setCurrency] = useState(profile.default_currency);
  const [avatarUrl, setAvatarUrl] = useState(profile.photo_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    const updated = await updateProfile(supabase, profile.id, {
      display_name: displayName.trim(),
      locale,
      default_currency: currency,
    });
    setSaving(false);

    if (!updated) {
      setError("Failed to save. Please try again.");
      return;
    }

    setSaved(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const compressed = await compressImage(file, 256);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${profile.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      await updateProfile(supabase, profile.id, { photo_url: publicUrl });
      setAvatarUrl(publicUrl);
    } catch (err) {
      setError("Avatar upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div>
      <div>
        {avatarUrl && (
          // biome-ignore lint/performance/noImgElement: avatar preview
          <img src={avatarUrl} alt="Avatar" width={64} height={64} />
        )}
        <div>
          <label htmlFor="avatar">
            {uploading ? "Uploading…" : "Change avatar"}
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} disabled readOnly />
        </div>
        <div>
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <label htmlFor="locale">Language</label>
          <select
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            {LOCALES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="currency">Default currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {error && <p role="alert">{error}</p>}
        {saved && <p>Saved.</p>}
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </form>

      <button type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}

async function compressImage(file: File, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      // Cover-crop to square
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
