"use client";

import { createBrowserClient, getSignedPlanAttachmentUrl } from "@mooch/db";
import type { PlanWithDetails } from "@mooch/stores";
import { usePlansBoardStore } from "@mooch/stores";
import type { PlanStatus } from "@mooch/types";
import { Avatar, Button, ConfirmDialog, Input, Select, Sheet, Text } from "@mooch/ui";
import type { SelectOption } from "@mooch/ui";
import {
  Calendar,
  Camera,
  ExternalLink,
  Mic,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import {
  deletePlan,
  removePlanAttachment,
  updatePlan,
} from "@/app/actions/plans";
import { PLAN_STATUS_CONFIG } from "./plan-status";

type Props = {
  plan: PlanWithDetails | null;
  onClose: () => void;
  groupId: string;
  currentUserId: string;
};

export function PlanDetailPanel({
  plan,
  onClose,
  groupId,
  currentUserId,
}: Props) {
  const upsertPlan = usePlansBoardStore((s) => s.upsertPlan);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const statusOptions: SelectOption[] = PLAN_STATUS_CONFIG.map((s) => ({
    value: s.id,
    label: s.title,
  }));

  useEffect(() => {
    if (!plan) {
      setSignedUrls({});
      return;
    }

    let isMounted = true;

    const fetchUrls = async () => {
      const supabase = createBrowserClient();
      const urls: Record<string, string> = {};

      for (const attachment of plan.attachments) {
        if (signedUrls[attachment.id]) continue;

        const url = await getSignedPlanAttachmentUrl(supabase, attachment.url);
        if (url && isMounted) {
          urls[attachment.id] = url;
        }
      }

      if (isMounted && Object.keys(urls).length > 0) {
        setSignedUrls((previous) => ({ ...previous, ...urls }));
      }
    };

    fetchUrls();

    return () => {
      isMounted = false;
    };
  }, [plan]);

  if (!plan) return null;

  const canEdit = true;
  const canDelete = plan.created_by === currentUserId;

  const formattedDate = plan.date
    ? new Date(plan.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const photoAttachments = plan.attachments.filter(
    (attachment) => attachment.type === "photo",
  );
  const voiceAttachments = plan.attachments.filter(
    (attachment) => attachment.type === "voice",
  );

  const handleEdit = () => {
    setEditTitle(plan.title);
    setEditDescription(plan.description ?? "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;

    startTransition(async () => {
      const result = await updatePlan(plan.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });

      if ("error" in result) {
        console.error("Failed to update plan:", result.error);
        return;
      }

      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePlan(plan.id);

      if ("error" in result) {
        console.error("Failed to delete plan:", result.error);
        return;
      }

      setConfirmDelete(false);
      onClose();
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    startTransition(async () => {
      const result = await removePlanAttachment(attachmentId);

      if ("error" in result) {
        console.error("Failed to delete attachment:", result.error);
        return;
      }

      setSignedUrls((previous) => {
        const next = { ...previous };
        delete next[attachmentId];
        return next;
      });
    });
  };

  const handleStatusChange = (newStatus: PlanStatus) => {
    // Optimistically update the store
    upsertPlan({ ...plan, status: newStatus });

    startTransition(async () => {
      const result = await updatePlan(plan.id, { status: newStatus });
      if ("error" in result) {
        // Revert on failure
        upsertPlan(plan);
        console.error("Failed to update plan status:", result.error);
      }
    });
  };

  return (
    <>
      <Sheet
        open={!!plan}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIsEditing(false);
            onClose();
          }
        }}
        title={isEditing ? "Edit Plan" : plan.title}
      >
        <div className="flex flex-col gap-5">
          {isEditing ? (
            <>
              <div>
                <label htmlFor="edit-title" className="mb-1 block">
                  <Text variant="label">Title</Text>
                </label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="edit-description" className="mb-1 block">
                  <Text variant="label">Description</Text>
                </label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-[14px] border border-edge bg-surface px-3.5 py-2.5 text-sm font-sans text-ink placeholder:text-ink-placeholder outline-none shadow-[inset_0_2px_0_rgba(132,100,79,0.07)] focus:border-accent focus:ring-2 focus:ring-accent/15 focus:ring-offset-0 focus:-translate-y-px transition-[border-color,box-shadow,transform] duration-120"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim() || isPending}
                >
                  {isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {plan.description && (
                <Text variant="body" color="subtle">
                  {plan.description}
                </Text>
              )}

              <Select
                label="Status"
                options={statusOptions}
                value={plan.status}
                onValueChange={(v) => handleStatusChange(v as PlanStatus)}
                disabled={isPending}
              />

              {formattedDate && (
                <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                  <Calendar className="h-4 w-4" />
                  <Text variant="caption">{formattedDate}</Text>
                </div>
              )}

              {plan.organizer && (
                <div
                  className="rounded-[14px] border p-3"
                  style={{
                    background: "var(--color-surface-secondary)",
                    borderColor: "var(--color-edge)",
                  }}
                >
                  <Text variant="caption" color="subtle" className="mb-2 block">
                    Organizer
                  </Text>
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={plan.organizer.photo_url}
                      name={plan.organizer.display_name}
                      size="sm"
                    />
                    <Text variant="body">{plan.organizer.display_name}</Text>
                  </div>
                </div>
              )}

              {(photoAttachments.length > 0 || voiceAttachments.length > 0) && (
                <div>
                  <Text variant="label" className="mb-2 block">
                    Attachments
                  </Text>
                  <div className="space-y-3">
                    {photoAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="group relative overflow-hidden rounded-[14px] border"
                        style={{
                          background: "var(--color-surface-secondary)",
                          borderColor: "var(--color-edge)",
                        }}
                      >
                        {signedUrls[attachment.id] ? (
                          <img
                            src={signedUrls[attachment.id]}
                            alt="Plan attachment"
                            className="max-h-56 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-32 items-center justify-center text-[var(--color-text-muted)]">
                            <Camera className="h-5 w-5 animate-pulse" />
                          </div>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="absolute right-2 top-2 rounded-full bg-black/55 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Remove photo attachment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    {voiceAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="relative rounded-[14px] border p-3"
                        style={{
                          background: "var(--color-surface-secondary)",
                          borderColor: "var(--color-edge)",
                        }}
                      >
                        {signedUrls[attachment.id] ? (
                          <audio
                            src={signedUrls[attachment.id]}
                            controls
                            className="w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                            <Mic className="h-4 w-4 animate-pulse" />
                            Loading voice note...
                          </div>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="absolute right-3 top-3 text-[var(--color-text-muted)] transition-colors hover:text-red-500"
                            aria-label="Remove voice attachment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-[var(--color-edge)] pt-3">
                <Avatar
                  src={plan.created_by_profile.photo_url}
                  name={plan.created_by_profile.display_name}
                  size="sm"
                />
                <Text variant="caption" color="subtle">
                  Created by {plan.created_by_profile.display_name}
                </Text>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                  >
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Edit
                  </Button>
                )}

                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                )}

                <a
                  href={`/${groupId}/events/new?from_plan=${plan.id}`}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--color-edge)] bg-[var(--color-surface-secondary)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-tertiary)]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Create event
                </a>
              </div>
            </>
          )}
        </div>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Plan"
        description={`Are you sure you want to delete "${plan.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
