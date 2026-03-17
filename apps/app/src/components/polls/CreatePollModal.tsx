"use client";

import type { PollWithOptions } from "@mooch/stores";
import { usePollStore } from "@mooch/stores";
import { Button, Input, Modal, Text } from "@mooch/ui";
import { format } from "date-fns";
import { CheckSquare, EyeOff, GripVertical, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { createPoll } from "@/app/actions/polls";
import { DateTimePicker } from "@/components/shared/DateTimePicker";
import { motionDuration, motionEase } from "@/lib/motion";

type Props = {
  open: boolean;
  onClose: () => void;
  groupId: string;
};

export function CreatePollModal({ open, onClose, groupId }: Props) {
  const upsertPoll = usePollStore((s) => s.upsertPoll);
  const reducedMotion = useReducedMotion() ?? false;
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isMultiChoice, setIsMultiChoice] = useState(false);
  const [closesAt, setClosesAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Stable keys for option list animation
  const [optionKeys, setOptionKeys] = useState(() => [
    crypto.randomUUID(),
    crypto.randomUUID(),
  ]);
  const normalizedOptions = useMemo(
    () =>
      options.map((opt) => opt.trim().replace(/\s+/g, " ").toLocaleLowerCase()),
    [options],
  );
  const duplicateValues = useMemo(() => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const value of normalizedOptions) {
      if (!value) continue;
      if (seen.has(value)) {
        duplicates.add(value);
      } else {
        seen.add(value);
      }
    }
    return duplicates;
  }, [normalizedOptions]);
  const hasDuplicateOptions = duplicateValues.size > 0;
  const optionCount = options.map((o) => o.trim()).filter(Boolean).length;

  const pollSummary = [
    isMultiChoice ? "Multi-choice" : "Single choice",
    isAnonymous ? "Anonymous votes" : "Named votes",
    `${optionCount} option${optionCount === 1 ? "" : "s"}`,
    closesAt
      ? `Closes ${format(closesAt, "EEE, MMM d · h:mm a")}`
      : "No deadline",
  ].join(" · ");

  const revealContainer = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0.01 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02,
          },
        },
      };

  const revealItem = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 8, filter: "blur(2px)" },
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

  function reset() {
    setQuestion("");
    setOptions(["", ""]);
    setOptionKeys([crypto.randomUUID(), crypto.randomUUID()]);
    setIsAnonymous(false);
    setIsMultiChoice(false);
    setClosesAt(null);
    setLoading(false);
    setError(null);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, ""]);
    setOptionKeys((prev) => [...prev, crypto.randomUUID()]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setOptionKeys((prev) => prev.filter((_, i) => i !== index));
  }

  function moveOption(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= options.length || toIndex >= options.length) return;
    setOptions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setOptionKeys((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleOptionDragStart(
    e: React.DragEvent<HTMLLIElement>,
    index: number,
  ) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
    setDropIndex(index);
  }

  function handleOptionDragOver(
    e: React.DragEvent<HTMLLIElement>,
    index: number,
  ) {
    e.preventDefault();
    setDropIndex(index);
  }

  function handleOptionDrop(index: number) {
    if (dragIndex !== null) {
      moveOption(dragIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  }

  function handleOptionDragEnd() {
    setDragIndex(null);
    setDropIndex(null);
  }

  function applyDeadlinePreset(kind: "oneHour" | "threeHours" | "nextNinePm") {
    const now = new Date();
    const next = new Date(now);

    if (kind === "oneHour") {
      next.setTime(now.getTime() + 60 * 60 * 1000);
    } else if (kind === "threeHours") {
      next.setTime(now.getTime() + 3 * 60 * 60 * 1000);
    } else {
      next.setHours(21, 0, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    }

    setClosesAt(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (trimmedOptions.length < 2) {
      setError("At least 2 options required");
      return;
    }
    if (hasDuplicateOptions) {
      setError("Options must be unique");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createPoll(groupId, {
      question: question.trim(),
      is_anonymous: isAnonymous,
      is_multi_choice: isMultiChoice,
      closes_at: closesAt?.toISOString() ?? null,
      options: trimmedOptions,
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    upsertPoll({
      ...result.poll,
      options: result.options.map((o) => ({
        ...o,
        vote_count: 0,
        weighted_count: 0,
        voters: [],
      })),
      token_actions: [],
      created_by_profile: {} as PollWithOptions["created_by_profile"],
      total_votes: 0,
    });

    reset();
    onClose();
  }

  const itemAnim = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, height: 0, y: -4 },
        animate: { opacity: 1, height: "auto", y: 0 },
        exit: { opacity: 0, height: 0, y: -4 },
      };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
      title="New poll"
      description="Ask the squad — single or multi-choice, anonymous or open."
      size="md"
    >
      <motion.form
        key={open ? "poll-open" : "poll-closed"}
        className="space-y-5"
        onSubmit={handleSubmit}
        variants={revealContainer}
        initial={reducedMotion ? undefined : "hidden"}
        animate={reducedMotion ? undefined : "visible"}
      >
        {/* Question */}
        <motion.div variants={revealItem}>
          <Input
            label="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What should we do?"
            required
          />
        </motion.div>

        {/* Options */}
        <motion.div variants={revealItem} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Text variant="label">Options</Text>
            <Text variant="caption" color="subtle">
              {optionCount}/8 filled
            </Text>
          </div>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {options.map((opt, i) => {
                const isDuplicateOption = duplicateValues.has(
                  normalizedOptions[i],
                );
                const shouldDimOption =
                  hasDuplicateOptions && !isDuplicateOption && dragIndex !== i;

                return (
                  <motion.li
                    key={optionKeys[i]}
                    layout
                    {...itemAnim}
                    transition={{
                      duration: motionDuration.standard,
                      ease: motionEase.out,
                    }}
                    className="list-none space-y-1"
                    draggable
                    onDragStartCapture={(e) => handleOptionDragStart(e, i)}
                    onDragOver={(e) => handleOptionDragOver(e, i)}
                    onDrop={() => handleOptionDrop(i)}
                    onDragEndCapture={handleOptionDragEnd}
                  >
                    <div
                      className="flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-[opacity,background-color,border-color]"
                      style={{
                        background: dragIndex === i ? "#F3ECE5" : "#FAF7F3",
                        borderColor: isDuplicateOption
                          ? "#DA6D62"
                          : dropIndex === i && dragIndex !== null
                            ? "#B99884"
                            : "#DCCBC0",
                        opacity: shouldDimOption ? 0.42 : 1,
                      }}
                    >
                      <div
                        className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold"
                        style={{
                          color: "#8c7463",
                          background: "#F1E6DE",
                        }}
                        aria-hidden
                      >
                        {i + 1}
                      </div>
                      <span
                        className="shrink-0 p-1 text-[#B19D8E] cursor-grab active:cursor-grabbing"
                        aria-hidden
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <input
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        aria-label={`Option ${i + 1}`}
                        aria-invalid={isDuplicateOption || undefined}
                        className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-[#A09488] text-[#3D2E22]"
                      />
                      {options.length > 2 && (
                        <motion.button
                          type="button"
                          onClick={() => removeOption(i)}
                          whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                          className="p-1.5 rounded-md transition-colors hover:bg-[#F9E7E6]"
                          style={{ color: "#B05A53" }}
                          aria-label={`Remove option ${i + 1}`}
                          title="Remove option"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden />
                        </motion.button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {hasDuplicateOptions && (
            <Text variant="caption" color="danger">
              Duplicate options detected. Each option must be unique.
            </Text>
          )}

          {options.length < 8 && (
            <motion.button
              type="button"
              onClick={addOption}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-[#F7F2ED]"
              style={{ color: "#8c7463" }}
              aria-label="Add option"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              Add option
            </motion.button>
          )}
        </motion.div>

        {/* Toggles */}
        <motion.div variants={revealItem} className="flex flex-wrap gap-3">
          <TogglePill
            checked={isAnonymous}
            onChange={setIsAnonymous}
            icon={<EyeOff className="w-3.5 h-3.5" />}
            label="Anonymous"
            reducedMotion={reducedMotion}
          />
          <TogglePill
            checked={isMultiChoice}
            onChange={setIsMultiChoice}
            icon={<CheckSquare className="w-3.5 h-3.5" />}
            label="Multi-choice"
            reducedMotion={reducedMotion}
          />
        </motion.div>

        {/* Auto-close */}
        <motion.div variants={revealItem} className="space-y-2.5">
          <DateTimePicker
            label="Auto-close (optional)"
            value={closesAt}
            onChange={setClosesAt}
            placeholder="No deadline"
            minDate={new Date()}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyDeadlinePreset("oneHour")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-[#F7F2ED]"
              style={{ borderColor: "#DCCBC0", color: "#8c7463" }}
            >
              In 1 hour
            </button>
            <button
              type="button"
              onClick={() => applyDeadlinePreset("threeHours")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-[#F7F2ED]"
              style={{ borderColor: "#DCCBC0", color: "#8c7463" }}
            >
              In 3 hours
            </button>
            <button
              type="button"
              onClick={() => applyDeadlinePreset("nextNinePm")}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-[#F7F2ED]"
              style={{ borderColor: "#DCCBC0", color: "#8c7463" }}
            >
              Next 9:00 PM
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: motionDuration.fast,
                ease: motionEase.out,
              }}
              aria-live="polite"
            >
              <Text variant="caption" color="danger">
                {error}
              </Text>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={revealItem} className="space-y-2 pt-1">
          <Text variant="caption" color="subtle" className="block">
            {pollSummary}
          </Text>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {loading ? "Creating..." : "Create poll"}
            </Button>
          </div>
        </motion.div>
      </motion.form>
    </Modal>
  );
}

/* ── Toggle pill ─────────────────────────────── */

function TogglePill({
  checked,
  onChange,
  icon,
  label,
  reducedMotion,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
  reducedMotion: boolean;
}) {
  const id = useId();
  return (
    <motion.label
      htmlFor={id}
      whileTap={reducedMotion ? undefined : { scale: 0.96 }}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer select-none transition-colors focus-within:ring-2 focus-within:ring-accent/45"
      style={{
        background: checked ? "var(--color-accent-bg)" : "#F7F2ED",
        border: checked
          ? "1px solid var(--color-accent-edge)"
          : "1px solid #DCCBC0",
        color: checked ? "var(--color-accent-fg)" : "#8c7463",
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span aria-hidden>{icon}</span>
      {label}
    </motion.label>
  );
}
