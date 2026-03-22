"use client";

import type { PlanWithDetails } from "@mooch/stores";
import type { PlanStatus } from "@mooch/types";
import { Avatar, Button, ConfirmDialog, Sheet, Text } from "@mooch/ui";
import { Calendar, Camera, Mic, Trash2, Edit3, ExternalLink } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { updatePlan, deletePlan, removePlanAttachment } from "@/app/actions/plans";
import { createBrowserClient, getSignedPlanAttachmentUrl } from "@mooch/db";

type Props = {
    plan: PlanWithDetails | null;
    onClose: () => void;
    groupId: string;
    currentUserId: string;
};

const STATUS_OPTIONS: { value: PlanStatus; label: string; emoji: string }[] = [
    { value: "ideas", label: "Ideas", emoji: "💡" },
    { value: "to_plan", label: "To Plan", emoji: "📋" },
    { value: "upcoming", label: "Upcoming", emoji: "📅" },
    { value: "done", label: "Done", emoji: "✅" },
];

export function PlanDetailPanel({ plan, onClose, groupId, currentUserId }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!plan) {
            setSignedUrls({});
            return;
        }
        let isMounted = true;
        const fetchUrls = async () => {
            const supabase = createBrowserClient();
            const urls: Record<string, string> = {};
            for (const att of plan.attachments) {
                if (signedUrls[att.id]) continue; // Skip already loaded
                const url = await getSignedPlanAttachmentUrl(supabase, att.url);
                if (url && isMounted) urls[att.id] = url;
            }
            if (isMounted && Object.keys(urls).length > 0) {
                setSignedUrls(prev => ({ ...prev, ...urls }));
            }
        };
        fetchUrls();
        return () => { isMounted = false; };
    }, [plan]);

    if (!plan) return null;

    const canEdit = true; // All group members can edit plans
    const canDelete = plan.created_by === currentUserId; // Only creator can delete

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
        if (!confirm("Remove this attachment?")) return;
        startTransition(async () => {
            const result = await removePlanAttachment(attachmentId);
            if ("error" in result) {
                console.error("Failed to delete attachment:", result.error);
            } else {
                setSignedUrls(prev => {
                    const next = { ...prev };
                    delete next[attachmentId];
                    return next;
                });
            }
        });
    };

    const handleStatusChange = (newStatus: PlanStatus) => {
        startTransition(async () => {
            await updatePlan(plan.id, { status: newStatus });
        });
    };

    const formattedDate = plan.date
        ? new Date(plan.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
        : null;

    const photoAttachments = plan.attachments.filter((a) => a.type === "photo");
    const voiceAttachments = plan.attachments.filter((a) => a.type === "voice");

    return (
        <>
            <Sheet
                open={!!plan}
                onOpenChange={(val) => {
                    if (!val) {
                        setIsEditing(false);
                        onClose();
                    }
                }}
                title={isEditing ? "Edit Plan" : plan.title}
            >
                <div className="flex flex-col gap-4">
                    {isEditing ? (
                        /* Edit mode */
                        <>
                            <div>
                                <label htmlFor="edit-title" className="block mb-1">
                                    <Text variant="label">Title</Text>
                                </label>
                                <input
                                    id="edit-title"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                                />
                            </div>
                            <div>
                                <label htmlFor="edit-desc" className="block mb-1">
                                    <Text variant="label">Description</Text>
                                </label>
                                <textarea
                                    id="edit-desc"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 resize-none"
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
                        /* View mode */
                        <>
                            {/* Description */}
                            {plan.description && (
                                <Text variant="body" color="subtle">
                                    {plan.description}
                                </Text>
                            )}

                            {/* Status selector */}
                            <div>
                                <Text variant="label" className="block mb-2">
                                    Status
                                </Text>
                                <div className="flex gap-2 flex-wrap">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleStatusChange(opt.value)}
                                            disabled={isPending}
                                            className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${plan.status === opt.value
                                                    ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300/60"
                                                    : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                                                }
                      `}
                                        >
                                            <span>{opt.emoji}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date */}
                            {formattedDate && (
                                <div className="flex items-center gap-2 text-stone-500">
                                    <Calendar className="w-4 h-4" />
                                    <Text variant="caption">{formattedDate}</Text>
                                </div>
                            )}

                            {/* Organizer */}
                            {plan.organizer && (
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        src={plan.organizer.photo_url}
                                        name={plan.organizer.display_name}
                                        size="sm"
                                    />
                                    <div>
                                        <Text variant="caption" color="subtle">
                                            Organizer
                                        </Text>
                                        <Text variant="body">{plan.organizer.display_name}</Text>
                                    </div>
                                </div>
                            )}

                            {/* Attachments */}
                            {(photoAttachments.length > 0 || voiceAttachments.length > 0) && (
                                <div>
                                    <Text variant="label" className="block mb-2">
                                        Attachments
                                    </Text>
                                    <div className="space-y-3">
                                        {photoAttachments.map((att) => (
                                            <div key={att.id} className="relative group rounded-lg overflow-hidden border border-stone-200">
                                                {signedUrls[att.id] ? (
                                                    <img src={signedUrls[att.id]} alt="Attachment" className="w-full h-auto object-cover max-h-48" />
                                                ) : (
                                                    <div className="h-24 bg-stone-100 flex items-center justify-center animate-pulse"><Camera className="w-5 h-5 text-stone-400" /></div>
                                                )}
                                                {canEdit && (
                                                    <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {voiceAttachments.map((att) => (
                                            <div key={att.id} className="relative bg-stone-100 rounded-lg p-3 pr-10 flex items-center">
                                                {signedUrls[att.id] ? (
                                                    <audio src={signedUrls[att.id]} controls className="w-full h-8" />
                                                ) : (
                                                    <div className="flex items-center gap-2 text-stone-400 text-sm"><Mic className="w-4 h-4 animate-pulse" /> Loading voice note...</div>
                                                )}
                                                {canEdit && (
                                                    <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="absolute right-3 p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Created by */}
                            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                                <Avatar
                                    src={plan.created_by_profile.photo_url}
                                    name={plan.created_by_profile.display_name}
                                    size="sm"
                                />
                                <Text variant="caption" color="subtle">
                                    Created by {plan.created_by_profile.display_name}
                                </Text>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                {canEdit && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEdit}
                                    >
                                        <Edit3 className="w-4 h-4 mr-1.5" />
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
                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                        Delete
                                    </Button>
                                )}
                                {/* Create Event from Plan — navigates to the events creation page (Phase 7) */}
                                <a
                                    href={`/${groupId}/events/new?from_plan=${plan.id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200/80 transition-all ml-auto"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Create Event
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
