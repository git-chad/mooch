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
import { Copy, RefreshCw, Settings2, ShieldAlert, Users2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
import { motionDuration, motionEase } from "@/lib/motion";
import { decodeGroupIcon, encodeGroupIcon } from "./group-icon";
import { MemberList } from "./MemberList";
import type { GroupWithMembers } from "./types";

const CURRENCIES = ["ARS", "USD", "EUR", "BRL"];
const LOCALES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
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
  const reducedMotion = useReducedMotion() ?? false;
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
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    name: group.name,
    emoji: group.emoji,
    currency: group.currency,
    locale: group.locale,
    coverPhotoUrl: (group.cover_photo_url ?? "").trim(),
  }));

  const normalizedName = name.trim();
  const normalizedCoverPhotoUrl = coverPhotoUrl.trim();
  const hasSettingsChanges =
    normalizedName !== savedSnapshot.name ||
    emoji !== savedSnapshot.emoji ||
    currency !== savedSnapshot.currency ||
    locale !== savedSnapshot.locale ||
    normalizedCoverPhotoUrl !== savedSnapshot.coverPhotoUrl ||
    Boolean(coverPhotoFile);

  const currencyOptions = useMemo(
    () => CURRENCIES.map((value) => ({ value, label: value })),
    [],
  );
  const localeOptions = useMemo(() => LOCALES, []);
  const decodedIcon = decodeGroupIcon(emoji);

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
        hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
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

  function markDirty() {
    setSaved(false);
    setInviteNotice(null);
  }

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

    if (!isAdmin || !hasSettingsChanges) return;

    setBusyAction("save");
    setError(null);
    setSaved(false);
    setInviteNotice(null);

    try {
      let resolvedCoverPhotoUrl: string | null =
        normalizedCoverPhotoUrl || null;

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
        name: normalizedName,
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
      setCoverPhotoUrl(resolvedCoverPhotoUrl ?? "");
      setSavedSnapshot({
        name: normalizedName,
        emoji,
        currency,
        locale,
        coverPhotoUrl: resolvedCoverPhotoUrl ?? "",
      });
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

  async function handleCopyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedInvite(true);
      setInviteNotice("Invite code copied.");
      setTimeout(() => setCopiedInvite(false), 1200);
    } catch {
      setError("Could not copy invite code.");
    }
  }

  async function handleRegenerateCode() {
    if (!isAdmin) return;

    setBusyAction("regenerate");
    setError(null);
    setInviteNotice(null);

    const result = await regenerateInviteCode(group.id);

    if ("error" in result) {
      setError(result.error);
      setBusyAction(null);
      return;
    }

    setInviteCode(result.invite_code);
    setInviteNotice("Invite code updated.");
    setBusyAction(null);
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
    router.push("/groups");
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
    router.push("/groups");
    router.refresh();
  }

  return (
    <Container as="section" className="py-4 sm:py-6">
      <motion.div
        className="col-span-6 sm:col-span-12 mx-auto w-full max-w-2xl space-y-5"
        variants={containerVariants}
        initial={reducedMotion ? undefined : "hidden"}
        animate={reducedMotion ? undefined : "visible"}
      >
        <motion.header
          variants={itemVariants}
          className="rounded-2xl border border-[#E7D8CC] bg-[linear-gradient(180deg,#FDFCFB_0%,#F7F1EA_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_12px_24px_rgba(92,63,42,0.08)] sm:px-6"
        >
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#DCCBC0] bg-[#F7EFE7] px-3 py-1">
            <Settings2 className="h-3.5 w-3.5 text-[#806D5E]" />
            <Text variant="caption" className="font-medium text-[#806D5E]">
              Squad settings
            </Text>
          </div>
          <Text variant="title">Group settings</Text>
          <Text variant="body" color="subtle" className="mt-1">
            Manage squad details, members, and invites.
          </Text>
        </motion.header>

        <motion.form
          variants={itemVariants}
          onSubmit={handleSave}
          className="space-y-5 rounded-2xl border border-[#E7D8CC] bg-[#FDFCFB] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_20px_rgba(92,63,42,0.07)]"
        >
          <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
            <IconPicker
              value={
                decodedIcon.kind === "lucide" ? decodedIcon.value : "Users"
              }
              onValueChange={(value) => {
                if (!value || !isAdmin) return;
                setEmoji(encodeGroupIcon(value));
                markDirty();
              }}
              size="lg"
              disabled={!isAdmin}
              className="w-fit"
            />
            <Input
              label="Group name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                markDirty();
              }}
              minLength={2}
              disabled={!isAdmin}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Currency"
              value={currency}
              onValueChange={(value) => {
                setCurrency(value);
                markDirty();
              }}
              options={currencyOptions}
              disabled={!isAdmin}
            />

            <Select
              label="Language"
              value={locale}
              onValueChange={(value) => {
                setLocale(value);
                markDirty();
              }}
              options={localeOptions}
              disabled={!isAdmin}
            />
          </div>

          {isAdmin && (
            <div className="space-y-2 rounded-xl border border-[#EDE3DA] bg-[#FAF6F2] p-3">
              <AssetUpload
                label="Cover photo"
                value={coverPhotoFile}
                onValueChange={(file) => {
                  setCoverPhotoFile(file);
                  setSaved(false);
                }}
                accept={COVER_ACCEPT}
                maxSizeBytes={COVER_MAX_SIZE_BYTES}
                helperText="PNG, JPG, WEBP up to 1 MB."
                previewUrl={
                  coverPhotoUrl.trim() || group.cover_photo_url || null
                }
                previewAlt="Current group cover preview"
              />
              <Input
                label="Cover photo URL (optional)"
                value={coverPhotoUrl}
                onChange={(event) => {
                  setCoverPhotoUrl(event.target.value);
                  markDirty();
                }}
                placeholder="https://…"
                type="url"
                disabled={!isAdmin}
              />
            </div>
          )}

          <div className="rounded-xl border border-[#EDE3DA] bg-[#F8F6F1] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8C7463] font-mono">
                  Invite code
                </p>
                <p className="mt-1 font-mono text-2xl tracking-[0.2em] text-[#1F2A23]">
                  {inviteCode}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleCopyInviteCode()}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedInvite ? "Copied" : "Copy code"}
                </Button>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={busyAction === "regenerate"}
                    onClick={() => void handleRegenerateCode()}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div aria-live="polite" className="min-h-5">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="settings-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{
                    duration: motionDuration.fast,
                    ease: motionEase.out,
                  }}
                  className="text-xs text-danger"
                >
                  {error}
                </motion.p>
              ) : saved ? (
                <motion.p
                  key="settings-saved"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{
                    duration: motionDuration.fast,
                    ease: motionEase.out,
                  }}
                  className="text-xs text-[#3D6B1A]"
                >
                  Changes saved.
                </motion.p>
              ) : inviteNotice ? (
                <motion.p
                  key="invite-notice"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{
                    duration: motionDuration.fast,
                    ease: motionEase.out,
                  }}
                  className="text-xs text-[#607790]"
                >
                  {inviteNotice}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          {isAdmin && (
            <div className="flex justify-end border-t border-[#EDE2D8] pt-4">
              <Button
                type="submit"
                variant="primary"
                loading={busyAction === "save"}
                disabled={!hasSettingsChanges}
              >
                Save changes
              </Button>
            </div>
          )}
        </motion.form>

        <motion.section
          variants={itemVariants}
          className="space-y-4 rounded-2xl border border-[#E7D8CC] bg-[#FDFCFB] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_20px_rgba(92,63,42,0.07)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <Users2 className="h-4 w-4 text-[#5F7868]" />
              <Text variant="heading">Members</Text>
            </div>
            <Text
              variant="caption"
              className="rounded-full border border-[#DCCBC0] bg-[#F6EFE8] px-2.5 py-1 text-[#846F60]"
            >
              {members.length} member{members.length === 1 ? "" : "s"}
            </Text>
          </div>
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
        </motion.section>

        <motion.section
          variants={itemVariants}
          className="space-y-4 rounded-2xl border border-[#E7CACA] bg-[linear-gradient(180deg,#FFFDFD_0%,#FFF7F7_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_20px_rgba(146,61,61,0.08)]"
        >
          <div className="inline-flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#A4453A]" />
            <Text variant="heading" className="text-[#7E2F25]">
              Danger zone
            </Text>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EACFC9] bg-[#FFF4F2] p-3">
            <div>
              <Text variant="body" className="font-medium text-[#6B3128]">
                Leave group
              </Text>
              <Text variant="caption" className="text-[#9D6A60]">
                You can rejoin later with a valid invite code.
              </Text>
            </div>
            <Button
              type="button"
              variant="secondary"
              loading={busyAction === "leave"}
              onClick={() => setShowLeaveConfirm(true)}
            >
              Leave
            </Button>
          </div>

          {isAdmin && (
            <div className="space-y-3 rounded-xl border border-[#E7CACA] bg-[#FFF2F2] p-3">
              <Text variant="body" className="font-medium text-[#7E2F25]">
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
        </motion.section>

        <ConfirmDialog
          open={showLeaveConfirm}
          onOpenChange={setShowLeaveConfirm}
          title="Leave this squad?"
          description="You will lose access to this squad until you join again with a valid invite code."
          confirmLabel="Leave squad"
          cancelLabel="Stay"
          onConfirm={() => {
            setShowLeaveConfirm(false);
            void handleLeaveGroup();
          }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      </motion.div>
    </Container>
  );
}
