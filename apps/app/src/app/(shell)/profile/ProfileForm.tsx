"use client";

import { updateProfile } from "@mooch/db";
import type { Profile } from "@mooch/types";
import { Avatar, Button, Input, Select, Text } from "@mooch/ui";
import { Camera, CheckCircle2, LogOut, Save } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { supabase } from "@/lib/supabase";
import { signOutProfileAction } from "./actions";

const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "ARS", label: "ARS" },
  { value: "BRL", label: "BRL" },
];

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
  const reducedMotion = useReducedMotion() ?? false;

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [locale, setLocale] = useState(profile.locale);
  const [currency, setCurrency] = useState(profile.default_currency);
  const [avatarUrl, setAvatarUrl] = useState(profile.photo_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    displayName: profile.display_name,
    locale: profile.locale,
    currency: profile.default_currency,
  }));

  const normalizedDisplayName = displayName.trim();
  const hasProfileChanges =
    normalizedDisplayName !== savedSnapshot.displayName ||
    locale !== savedSnapshot.locale ||
    currency !== savedSnapshot.currency;

  const containerVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.04,
          },
        },
      };

  const itemVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 8, filter: "blur(1px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: motionDuration.standard,
            ease: motionEase.out,
          },
        },
      };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (normalizedDisplayName.length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }
    if (!hasProfileChanges) return;

    setSaving(true);
    const updated = await updateProfile(supabase, profile.id, {
      display_name: normalizedDisplayName,
      locale,
      default_currency: currency,
    });
    setSaving(false);

    if (!updated) {
      setError("Failed to save. Please try again.");
      return;
    }

    setSaved(true);
    setSavedSnapshot({
      displayName: normalizedDisplayName,
      locale,
      currency,
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSaved(false);

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
      setSaved(true);
    } catch (err) {
      setError("Avatar upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSignOut() {
    setError(null);
    setSigningOut(true);
    const result = await signOutProfileAction();
    if (result.error) {
      setError(result.error);
      setSigningOut(false);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <motion.div
      className="rounded-2xl border border-[#E7D8CC] bg-[#FDFCFB]/95 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_16px_30px_rgba(92,63,42,0.08)] sm:p-6"
      variants={containerVariants}
      initial={reducedMotion ? undefined : "hidden"}
      animate={reducedMotion ? undefined : "visible"}
    >
      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Avatar
            src={avatarUrl || undefined}
            name={displayName || "User"}
            size="lg"
            tooltip={false}
            className="ring-2 ring-[#F1E7DE]"
          />
          <div>
            <Text variant="subheading">{displayName || "Unnamed user"}</Text>
            <Text variant="caption" color="subtle">
              {email}
            </Text>
          </div>
        </div>

        <label
          htmlFor="avatar"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[12px] border border-[#DCCBC0] bg-[#F6EEE7] px-3 py-2 text-xs font-medium text-[#7B6656] transition-colors hover:bg-[#F1E7DE]"
        >
          <Camera className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : "Change photo"}
        </label>
        <input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          disabled={uploading}
          className="sr-only"
        />
      </motion.div>

      <motion.form
        variants={itemVariants}
        onSubmit={handleSave}
        className="space-y-4"
      >
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          disabled
          readOnly
          helperText="Email is managed by your auth provider."
        />
        <Input
          id="displayName"
          label="Display name"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setSaved(false);
          }}
          required
          minLength={2}
          placeholder="Your name"
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            id="locale"
            label="Language"
            value={locale}
            onValueChange={(value) => {
              setLocale(value);
              setSaved(false);
            }}
            options={LOCALES}
          />
          <Select
            id="currency"
            label="Default currency"
            value={currency}
            onValueChange={(value) => {
              setCurrency(value);
              setSaved(false);
            }}
            options={CURRENCIES}
          />
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: motionDuration.fast,
                ease: motionEase.out,
              }}
              className="rounded-[10px] border border-[#E2A39B] bg-[#FCEDEB] px-3 py-2 text-xs text-danger"
            >
              {error}
            </motion.p>
          ) : saved ? (
            <motion.p
              key="saved"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: motionDuration.fast,
                ease: motionEase.out,
              }}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#BFDFA4] bg-[#EDF8DE] px-3 py-2 text-xs text-[#3D6B1A]"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved.
            </motion.p>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#EDE2D8] pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSignOut}
            className="border-[#E6B7B0] bg-[#FFF4F2] text-[#A4453A] hover:bg-[#FEEBE8]"
            disabled={signingOut || saving || uploading}
          >
            <LogOut className="mr-1 inline-block h-3.5 w-3.5 align-middle" />
            {signingOut ? "Signing out..." : "Sign out"}
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saving || uploading}
            disabled={!hasProfileChanges || signingOut || uploading}
          >
            <Save className="mr-1 inline-block h-3.5 w-3.5 align-middle" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </motion.form>
    </motion.div>
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

      const scale = Math.max(size / img.width, size / img.height);
      const width = img.width * scale;
      const height = img.height * scale;
      ctx.drawImage(
        img,
        (size - width) / 2,
        (size - height) / 2,
        width,
        height,
      );
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
