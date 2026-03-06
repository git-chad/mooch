"use client";

import { useGroupStore } from "@mooch/stores";
import {
  AssetUpload,
  Button,
  IconPicker,
  Input,
  Modal,
  Select,
  Text,
} from "@mooch/ui";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TextMorph } from "torph/react";
import { createGroup, uploadGroupCover } from "@/app/actions/groups";
import { decodeGroupIcon, encodeGroupIcon } from "./group-icon";

const CURRENCIES = ["ARS", "USD", "EUR", "BRL"];

const LOCALES = [
  { value: "en", label: "English", icon: "🇺🇸" },
  { value: "es", label: "Español", icon: "🇪🇸" },
];
const COVER_ACCEPT = "image/png,image/jpeg,image/webp";
const COVER_MAX_SIZE_BYTES = 1 * 1024 * 1024;

type CreateGroupModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DEFAULT_ICON = encodeGroupIcon("Users");

export function CreateGroupModal({
  open,
  onOpenChange,
}: CreateGroupModalProps) {
  const router = useRouter();
  const addGroup = useGroupStore((state) => state.addGroup);
  const setActiveGroup = useGroupStore((state) => state.setActiveGroup);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_ICON);
  const [currency, setCurrency] = useState("ARS");
  const [locale, setLocale] = useState("en");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const localeOptions = useMemo(() => LOCALES, []);
  const currencyOptions = useMemo(
    () => CURRENCIES.map((value) => ({ value, label: value })),
    [],
  );

  const decodedIcon = decodeGroupIcon(emoji);

  function getFriendlyUploadError(message: string): string {
    const normalized = message.toLowerCase();

    if (
      normalized.includes("body exceeded") ||
      normalized.includes("body size limit") ||
      normalized.includes("payload too large")
    ) {
      return "That file is too large to upload. Use PNG, JPG, or WEBP up to 1 MB.";
    }

    return message;
  }

  function resetState() {
    setName("");
    setEmoji(DEFAULT_ICON);
    setCurrency("ARS");
    setLocale("en");
    setCoverPhotoUrl("");
    setCoverPhotoFile(null);
    setError(null);
    setLoading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Group name must be at least 2 characters.");
      return;
    }

    setLoading(true);

    try {
      let resolvedCoverPhotoUrl: string | undefined;

      if (coverPhotoFile) {
        const uploadFormData = new FormData();
        uploadFormData.set("cover", coverPhotoFile);

        const uploadResult = await uploadGroupCover(uploadFormData);
        if ("error" in uploadResult) {
          setError(getFriendlyUploadError(uploadResult.error));
          setLoading(false);
          return;
        }

        resolvedCoverPhotoUrl = uploadResult.publicUrl;
      } else if (coverPhotoUrl.trim()) {
        resolvedCoverPhotoUrl = coverPhotoUrl.trim();
      }

      const result = await createGroup({
        name: name.trim(),
        emoji,
        currency,
        locale,
        cover_photo_url: resolvedCoverPhotoUrl,
      });

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      addGroup(result.group);
      setActiveGroup(result.group.id);
      onOpenChange(false);
      resetState();
      router.push(`/${result.groupId}`);
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? getFriendlyUploadError(caughtError.message)
          : "Failed to create group.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
      title="Create a squad"
      description="Set your squad basics and share an invite in seconds."
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[auto,minmax(0,1fr)] items-end gap-3">
          <div className="space-y-2">
            <Text variant="label">Group icon</Text>
            <IconPicker
              label={undefined}
              value={
                decodedIcon.kind === "lucide" ? decodedIcon.value : "Users"
              }
              onValueChange={(value) => {
                if (!value) return;
                setEmoji(encodeGroupIcon(value));
              }}
              size="md"
            />
          </div>

          <Input
            label="Group name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            required
            placeholder="Friday Crew"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Currency"
            value={currency}
            onValueChange={setCurrency}
            options={currencyOptions}
          />

          <Select
            label="Language"
            value={locale}
            onValueChange={setLocale}
            options={localeOptions}
          />
        </div>

        <AssetUpload
          label="Cover photo (recommended)"
          value={coverPhotoFile}
          onValueChange={setCoverPhotoFile}
          accept={COVER_ACCEPT}
          maxSizeBytes={COVER_MAX_SIZE_BYTES}
          helperText="Upload is preferred. You can still paste an image URL below."
          infoText="Recommended format: PNG, JPG, WEBP. Maximum size: 1 MB."
          previewAlt="Selected group cover preview"
        />

        <Input
          label="Or paste cover photo URL (optional)"
          value={coverPhotoUrl}
          onChange={(event) => setCoverPhotoUrl(event.target.value)}
          placeholder="https://..."
          type="url"
        />

        {error && <Text variant="caption" color="danger">{error}</Text>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            <TextMorph>{loading ? "Creating..." : "Create squad"}</TextMorph>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
