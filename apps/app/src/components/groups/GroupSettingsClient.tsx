"use client";

import { useGroupStore } from "@mooch/stores";
import {
  AssetUpload,
  Button,
  ConfirmDialog,
  Container,
  IconPicker,
  Input,
  Select,
  Text,
} from "@mooch/ui";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  deleteGroup,
  leaveGroup,
  regenerateInviteCode,
  removeMember,
  updateGroup,
  updateMemberRole,
  uploadGroupCover,
} from "@/app/actions/groups";
import { decodeGroupIcon, encodeGroupIcon, GroupIcon } from "./group-icon";
import { MemberList } from "./MemberList";
import type { GroupWithMembers } from "./types";

const CURRENCIES = ["ARS", "USD", "EUR", "BRL"];

const LOCALES = [
  { value: "en", label: "English", icon: "🇺🇸" },
  { value: "es", label: "Español", icon: "🇪🇸" },
];
const COVER_ACCEPT = "image/png,image/jpeg,image/webp";
const COVER_MAX_SIZE_BYTES = 1 * 1024 * 1024;

type GroupSettingsClientProps = {
  group: GroupWithMembers;
  currentUserId: string;
  currentUserRole: "admin" | "member" | null;
};

export function GroupSettingsClient({
  group,
  currentUserId,
  currentUserRole,
}: GroupSettingsClientProps) {
  const router = useRouter();
  const removeGroup = useGroupStore((state) => state.removeGroup);
  const isAdmin = currentUserRole === "admin";

  const [name, setName] = useState(group.name);
  const [emoji, setEmoji] = useState(group.emoji);
  const [currency, setCurrency] = useState(group.currency);
  const [locale, setLocale] = useState(group.locale);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(
    group.cover_photo_url ?? "",
  );
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [inviteCode, setInviteCode] = useState(group.invite_code);
  const [members, setMembers] = useState(group.members);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const currencyOptions = useMemo(
    () => CURRENCIES.map((value) => ({ value, label: value })),
    [],
  );
  const localeOptions = useMemo(() => LOCALES, []);
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

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin) return;

    setBusyAction("save");
    setError(null);
    setSaved(false);

    try {
      let resolvedCoverPhotoUrl: string | null = coverPhotoUrl.trim()
        ? coverPhotoUrl.trim()
        : null;

      if (coverPhotoFile) {
        const uploadFormData = new FormData();
        uploadFormData.set("cover", coverPhotoFile);

        const uploadResult = await uploadGroupCover(uploadFormData);
        if ("error" in uploadResult) {
          setError(getFriendlyUploadError(uploadResult.error));
          setBusyAction(null);
          return;
        }

        resolvedCoverPhotoUrl = uploadResult.publicUrl;
      }

      const result = await updateGroup(group.id, {
        name: name.trim(),
        emoji,
        currency,
        locale,
        cover_photo_url: resolvedCoverPhotoUrl,
      });

      if (result && "error" in result) {
        setError(result.error);
        setBusyAction(null);
        return;
      }

      setSaved(true);
      setCoverPhotoFile(null);
      setBusyAction(null);
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? getFriendlyUploadError(caughtError.message)
          : "Failed to save.";
      setError(message);
      setBusyAction(null);
    }
  }

  async function handleRegenerateCode() {
    if (!isAdmin) return;

    setBusyAction("regenerate");
    setError(null);

    const result = await regenerateInviteCode(group.id);

    if ("error" in result) {
      setError(result.error);
      setBusyAction(null);
      return;
    }

    setInviteCode(result.invite_code);
    setBusyAction(null);
    setSaved(true);
    router.refresh();
  }

  async function handleToggleRole(
    memberId: string,
    nextRole: "admin" | "member",
  ) {
    if (!isAdmin) return;

    setBusyAction(`role-${memberId}`);
    setError(null);

    const result = await updateMemberRole(group.id, memberId, nextRole);

    if (result && "error" in result) {
      setError(result.error);
      setBusyAction(null);
      return;
    }

    setMembers((previous) =>
      previous.map((member) =>
        member.user_id === memberId ? { ...member, role: nextRole } : member,
      ),
    );

    setBusyAction(null);
    router.refresh();
  }

  async function handleRemoveMember(memberId: string) {
    if (!isAdmin) return;

    setBusyAction(`remove-${memberId}`);
    setError(null);

    const result = await removeMember(group.id, memberId);

    if (result && "error" in result) {
      setError(result.error);
      setBusyAction(null);
      return;
    }

    setMembers((previous) =>
      previous.filter((member) => member.user_id !== memberId),
    );

    setBusyAction(null);
    router.refresh();
  }

  async function handleLeaveGroup() {
    setBusyAction("leave");
    setError(null);

    const result = await leaveGroup(group.id);

    if (result && "error" in result) {
      setError(result.error);
      setBusyAction(null);
      return;
    }

    removeGroup(group.id);
    router.push("/");
    router.refresh();
  }

  async function handleDeleteGroup() {
    if (!isAdmin || deleteConfirmText !== group.name) return;

    setBusyAction("delete");
    setError(null);

    const result = await deleteGroup(group.id);

    if (result && "error" in result) {
      setError(result.error);
      setBusyAction(null);
      return;
    }

    removeGroup(group.id);
    router.push("/");
    router.refresh();
  }

  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <Text variant="title">Group settings</Text>
          <Text variant="body" color="info">
            Manage squad details, members, and invites.
          </Text>
        </header>

        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 shadow-[var(--shadow-elevated)]"
        >
          <Input
            label="Group name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            disabled={!isAdmin}
            required
          />

          <div className="space-y-2">
            <Text variant="label">Group icon</Text>
            <div className="flex items-end gap-3 rounded-xl border border-[#EDE3DA] bg-[#F8F6F1] p-3">
              <IconPicker
                label=""
                value={
                  decodedIcon.kind === "lucide" ? decodedIcon.value : "Users"
                }
                onValueChange={(value) => {
                  if (!value || !isAdmin) return;
                  setEmoji(encodeGroupIcon(value));
                }}
                size="md"
                disabled={!isAdmin}
              />
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#D8C8BC] bg-[#FDFCFB] text-[#4A3728]">
                  <GroupIcon value={emoji} size={20} />
                </span>
                <p className="truncate text-xs text-[#7A6E65] font-mono">
                  {decodedIcon.kind === "lucide" ? decodedIcon.value : emoji}
                </p>
              </div>
            </div>
          </div>

          <Select
            label="Currency"
            value={currency}
            onValueChange={setCurrency}
            options={currencyOptions}
            disabled={!isAdmin}
          />

          <Select
            label="Language"
            value={locale}
            onValueChange={setLocale}
            options={localeOptions}
            disabled={!isAdmin}
          />

          <Input
            label="Cover photo URL (optional)"
            value={coverPhotoUrl}
            onChange={(event) => setCoverPhotoUrl(event.target.value)}
            placeholder="https://..."
            type="url"
            disabled={!isAdmin}
          />

          {isAdmin && (
            <AssetUpload
              label="Cover photo upload (recommended)"
              value={coverPhotoFile}
              onValueChange={setCoverPhotoFile}
              accept={COVER_ACCEPT}
              maxSizeBytes={COVER_MAX_SIZE_BYTES}
              helperText="Upload takes priority over URL when both are set."
              infoText="Supported: PNG, JPG, WEBP. Maximum size: 1 MB."
              previewUrl={coverPhotoUrl.trim() || group.cover_photo_url || null}
              previewAlt="Current group cover preview"
            />
          )}

          <div className="rounded-xl border border-[#EDE3DA] bg-[#F8F6F1] p-3">
            <p className="text-[10px] uppercase tracking-widest text-[#8C7463] font-mono">
              Invite code
            </p>
            <p className="mt-1 font-mono text-2xl tracking-[0.2em] text-[#1F2A23]">
              {inviteCode}
            </p>
            {isAdmin && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                loading={busyAction === "regenerate"}
                onClick={() => void handleRegenerateCode()}
              >
                Regenerate invite code
              </Button>
            )}
          </div>

          {error && (
            <Text variant="caption" color="danger">
              {error}
            </Text>
          )}
          {saved && !error && (
            <Text variant="caption" className="text-[#3D6B1A]">
              Changes saved.
            </Text>
          )}

          {isAdmin && (
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={busyAction === "save"}
              >
                Save changes
              </Button>
            </div>
          )}
        </form>

        <div className="space-y-3 rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 shadow-[var(--shadow-elevated)]">
          <Text variant="heading">Members</Text>
          <MemberList
            members={members}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onToggleRole={(member) => {
              const nextRole = member.role === "admin" ? "member" : "admin";
              void handleToggleRole(member.user_id, nextRole);
            }}
            onRemove={(member) => void handleRemoveMember(member.user_id)}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-[#EDE3DA] bg-[#FDFCFB] p-5 shadow-[var(--shadow-elevated)]">
          <Text variant="heading">Danger zone</Text>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EDE3DA] bg-[#F8F6F1] p-3">
            <div>
              <Text variant="body" className="font-medium">
                Leave group
              </Text>
              <Text variant="caption" color="muted">
                You can rejoin later with an invite code.
              </Text>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowLeaveConfirm(true)}
            >
              Leave
            </Button>
          </div>

          {isAdmin && (
            <div className="space-y-3 rounded-xl border border-[#E7CACA] bg-[#FFF8F8] p-3">
              <Text variant="body" color="danger" className="font-medium">
                Delete group
              </Text>
              <Text variant="caption" className="text-[#9D4D4D]">
                Type <strong>{group.name}</strong> to permanently delete this
                group.
              </Text>
              <Input
                label="Confirm group name"
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                placeholder={group.name}
              />
              <Button
                type="button"
                variant="danger"
                loading={busyAction === "delete"}
                disabled={deleteConfirmText !== group.name}
                onClick={() => void handleDeleteGroup()}
              >
                Delete group
              </Button>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showLeaveConfirm}
          onOpenChange={setShowLeaveConfirm}
          title="Leave this squad?"
          description="You will lose access to this squad until you join again with a valid invite."
          confirmLabel="Leave squad"
          cancelLabel="Stay"
          onConfirm={() => {
            setShowLeaveConfirm(false);
            void handleLeaveGroup();
          }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      </div>
    </Container>
  );
}
