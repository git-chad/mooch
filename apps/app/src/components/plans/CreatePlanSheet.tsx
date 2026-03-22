"use client";

import type { PlanStatus } from "@mooch/types";
import { Button, Input, Sheet, Text } from "@mooch/ui";
import { useState, useTransition } from "react";
import { createPlan, addPlanAttachment } from "@/app/actions/plans";
import { Camera, Mic, X } from "lucide-react";
import { createBrowserClient } from "@mooch/db";
import { uploadPlanAttachment } from "@mooch/db";

type Props = {
    open: boolean;
    onClose: () => void;
    groupId: string;
    initialStatus: PlanStatus;
};

const STATUS_OPTIONS: { value: PlanStatus; label: string; emoji: string }[] = [
    { value: "ideas", label: "Ideas", emoji: "💡" },
    { value: "to_plan", label: "To Plan", emoji: "📋" },
    { value: "upcoming", label: "Upcoming", emoji: "📅" },
    { value: "done", label: "Done", emoji: "✅" },
];

export function CreatePlanSheet({ open, onClose, groupId, initialStatus }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [status, setStatus] = useState<PlanStatus>(initialStatus);
    const [isPending, startTransition] = useTransition();

    const [photo, setPhoto] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) setAudioBlob(e.data);
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
        }
    };

    // Reset when initialStatus changes
    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDate("");
        setStatus(initialStatus);
        setPhoto(null);
        setAudioBlob(null);
        if (isRecording) stopRecording();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        startTransition(async () => {
            const result = await createPlan(groupId, {
                title: title.trim(),
                description: description.trim() || undefined,
                date: date || null,
                status,
            });

            if ("error" in result) {
                console.error("Failed to create plan:", result.error);
                return;
            }

            // Upload attachments
            const supabase = createBrowserClient();
            if (photo) {
                try {
                    const path = await uploadPlanAttachment(supabase, groupId, result.plan.id, photo, photo.name);
                    await addPlanAttachment(result.plan.id, "photo", path);
                } catch (e) {
                    console.error("Photo upload failed", e);
                }
            }
            if (audioBlob) {
                try {
                    const path = await uploadPlanAttachment(supabase, groupId, result.plan.id, audioBlob, "voice.webm");
                    await addPlanAttachment(result.plan.id, "voice", path);
                } catch (e) {
                    console.error("Voice upload failed", e);
                }
            }

            resetForm();
            onClose();
        });
    };

    return (
        <Sheet
            open={open}
            onOpenChange={(val) => {
                if (!val) {
                    resetForm();
                    onClose();
                }
            }}
            title="New Plan"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Title */}
                <div>
                    <label htmlFor="plan-title" className="block mb-1">
                        <Text variant="label">Title *</Text>
                    </label>
                    <Input
                        id="plan-title"
                        placeholder="What's the plan?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="plan-description" className="block mb-1">
                        <Text variant="label">Description</Text>
                    </label>
                    <textarea
                        id="plan-description"
                        placeholder="Add some details..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 resize-none"
                    />
                </div>

                {/* Date */}
                <div>
                    <label htmlFor="plan-date" className="block mb-1">
                        <Text variant="label">Date (optional)</Text>
                    </label>
                    <input
                        id="plan-date"
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                </div>

                {/* Column selector */}
                <div>
                    <Text variant="label" className="block mb-2">
                        Column
                    </Text>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStatus(opt.value)}
                                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${status === opt.value
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

                {/* Attachments */}
                <div className="flex gap-6 mt-1 mb-2">
                    <div>
                        <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-stone-600 hover:text-stone-900">
                            <Camera className="w-4 h-4" /> Photo
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
                            }} />
                        </label>
                        {photo && (
                            <div className="text-xs text-stone-500 mt-1 flex items-center justify-between gap-2 bg-stone-100 p-1.5 rounded">
                                <span className="truncate max-w-[120px]">{photo.name}</span>
                                <button type="button" onClick={() => setPhoto(null)} className="hover:text-stone-800">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={isRecording ? stopRecording : (audioBlob ? () => setAudioBlob(null) : startRecording)}
                            className={`flex items-center gap-1.5 text-sm font-medium ${isRecording ? 'text-red-500' : 'text-stone-600 hover:text-stone-900'}`}
                        >
                            <Mic className="w-4 h-4" />
                            {isRecording ? "Stop Recording" : (audioBlob ? "Remove Audio" : "Voice Note")}
                        </button>
                        {audioBlob && !isRecording && (
                            <div className="text-xs text-stone-500 mt-1 bg-stone-100 p-1.5 rounded">
                                Audio captured
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    variant="primary"
                    disabled={!title.trim() || isPending}
                    className="mt-2"
                >
                    {isPending ? "Creating..." : "Create Plan"}
                </Button>
            </form>
        </Sheet>
    );
}
