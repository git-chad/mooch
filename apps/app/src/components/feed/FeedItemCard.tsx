"use client";

import { Avatar, Text } from "@mooch/ui";
import {
  ArrowUpRight,
  BarChart3,
  ImageOff,
  Loader2,
  Pencil,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { relativeTime } from "@/lib/expenses";
import { getSurfaceTransition, motionDuration } from "@/lib/motion";
import { EditCaption } from "./EditCaption";
import { ReactionBar } from "./ReactionBar";
import { TextPostBody } from "./TextPostBody";
import type { FeedItemUI } from "./types";
import { VoicePlayer } from "./VoicePlayer";

const TEXT_MAX = 500;
const CAPTION_MAX = 200;

type Props = {
  groupId: string;
  item: FeedItemUI;
  currentUserId: string;
  deleting?: boolean;
  reacting?: boolean;
  onToggleReaction: (itemId: string, emoji: string) => void;
  onDelete: (itemId: string) => void;
  onEdit: (itemId: string, caption: string) => Promise<boolean>;
};

export function FeedItemCard({
  groupId,
  item,
  currentUserId,
  deleting = false,
  reacting = false,
  onToggleReaction,
  onDelete,
  onEdit,
}: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const isOwner = item.created_by === currentUserId;
  const transition = useMemo(
    () => getSurfaceTransition(reducedMotion, motionDuration.fast),
    [reducedMotion],
  );
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const maxChars = item.type === "text" ? TEXT_MAX : CAPTION_MAX;

  function startEditing() {
    setEditText(item.caption ?? "");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditText("");
  }

  async function saveEdit() {
    const trimmed = editText.trim();
    if (item.type === "text" && !trimmed) return;
    if (trimmed === (item.caption ?? "")) {
      cancelEditing();
      return;
    }
    setSaving(true);
    const success = await onEdit(item.id, trimmed);
    setSaving(false);
    if (success) setEditing(false);
  }

  const contextBadge = item.linked_poll_id
    ? {
        icon: BarChart3,
        label: "Linked poll",
        href: `/${groupId}/polls#${item.linked_poll_id}`,
      }
    : item.linked_expense_id
      ? {
          icon: ReceiptText,
          label: "Linked expense",
          href: `/${groupId}/expenses`,
        }
      : null;

  return (
    <motion.article
      layout="position"
      className="rounded-2xl border p-4"
      style={{
        background:
          "linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)",
        borderColor: "#DCCBC0",
        boxShadow: "var(--shadow-elevated)",
      }}
      transition={transition}
    >
      <div className="space-y-3">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar
              size="sm"
              src={item.created_by_profile.photo_url ?? undefined}
              name={item.created_by_profile.display_name || "Unknown"}
            />
            <div className="min-w-0">
              <Text variant="label" className="block truncate">
                {item.created_by_profile.display_name || "Unknown"}
              </Text>
              <Text variant="caption" color="subtle" className="block">
                {item.optimistic ? "Sending..." : relativeTime(item.created_at)}
                {item.edited_at && !item.optimistic && (
                  <span className="text-ink-dim"> (edited)</span>
                )}
              </Text>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1">
              {!editing && (
                <button
                  type="button"
                  onClick={startEditing}
                  disabled={deleting || saving}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-60"
                  style={{ background: "#F7F2ED", color: "#8C7463" }}
                  aria-label="Edit post"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                disabled={deleting || editing}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-60"
                style={{ background: "#F7F2ED", color: "#8C7463" }}
                aria-label="Delete post"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </header>

        {item.type === "text" &&
          (editing ? (
            <EditCaption
              value={editText}
              onChange={setEditText}
              maxChars={maxChars}
              saving={saving}
              onSave={saveEdit}
              onCancel={cancelEditing}
              required
            />
          ) : (
            item.caption && <TextPostBody text={item.caption} />
          ))}

        {item.type === "photo" && item.media_url && (
          <div
            className="group/photo block w-full overflow-hidden rounded-xl border text-left transition-shadow duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            style={{ borderColor: "#E7D8CC" }}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F5F0EA]">
              {/* Blurred placeholder — visible until image loads */}
              {!photoLoaded && !photoError && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #EDE5DC 0%, #F5EEE7 40%, #EDE5DC 100%)",
                    filter: "blur(20px)",
                    transform: "scale(1.1)",
                  }}
                />
              )}

              {photoError ? (
                <div className="absolute inset-0 grid place-items-center gap-1 text-center">
                  <ImageOff className="h-6 w-6 text-[#9C8778]" />
                  <Text variant="caption" color="subtle">
                    Couldn&apos;t load image
                  </Text>
                </div>
              ) : (
                // biome-ignore lint/performance/noImgElement: user-uploaded/feed-media URLs vary by environment and rely on signed URLs.
                <img
                  src={item.media_url}
                  alt={item.caption || "Feed photo"}
                  onLoad={() => setPhotoLoaded(true)}
                  onError={() => {
                    setPhotoLoaded(false);
                    setPhotoError(true);
                  }}
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover/photo:scale-[1.005]"
                  style={{ opacity: photoLoaded ? 1 : 0 }}
                />
              )}
            </div>
          </div>
        )}

        {item.type === "voice" && item.media_url && (
          <VoicePlayer
            src={item.media_url}
            durationHint={item.duration_seconds ?? undefined}
          />
        )}

        {item.type !== "text" &&
          (editing ? (
            <EditCaption
              value={editText}
              onChange={setEditText}
              maxChars={maxChars}
              saving={saving}
              onSave={saveEdit}
              onCancel={cancelEditing}
            />
          ) : (
            item.caption && (
              <Text variant="body" color="label" className="leading-relaxed">
                {item.caption}
              </Text>
            )
          ))}

        {contextBadge && (
          <Link
            href={contextBadge.href}
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors hover:bg-[#F5EFE8]"
            style={{ borderColor: "#DCCBC0" }}
          >
            <contextBadge.icon className="h-3.5 w-3.5 text-[#6B7E90]" />
            <Text variant="caption" color="info">
              {contextBadge.label}
            </Text>
            <ArrowUpRight className="h-3 w-3 text-[#6B7E90]" />
          </Link>
        )}

        <ReactionBar
          reactionCounts={item.reaction_counts}
          currentUserReaction={item.current_user_reaction}
          disabled={reacting || deleting}
          onToggle={(emoji) => onToggleReaction(item.id, emoji)}
        />
      </div>
    </motion.article>
  );
}
