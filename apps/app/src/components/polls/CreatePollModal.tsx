"use client";

import type { PollWithOptions } from "@mooch/stores";
import { usePollStore } from "@mooch/stores";
import { Button, Input, Modal, Text } from "@mooch/ui";
import { CheckSquare, EyeOff, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
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

  // Stable keys for option list animation
  const [optionKeys, setOptionKeys] = useState(() => [
    crypto.randomUUID(),
    crypto.randomUUID(),
  ]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
    if (trimmedOptions.length < 2) {
      setError("At least 2 options required");
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
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Question */}
        <Input
          label="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What should we do?"
          required
        />

        {/* Options */}
        <div className="space-y-2">
          <Text variant="label">Options</Text>
          <AnimatePresence initial={false}>
            {options.map((opt, i) => (
              <motion.div
                key={optionKeys[i]}
                layout="position"
                {...itemAnim}
                transition={{
                  duration: motionDuration.fast,
                  ease: motionEase.out,
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
                {options.length > 2 && (
                  <motion.button
                    type="button"
                    onClick={() => removeOption(i)}
                    whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-[#F7F2ED]"
                    style={{ color: "#8c7463" }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {options.length < 8 && (
            <motion.button
              type="button"
              onClick={addOption}
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-[#F7F2ED]"
              style={{ color: "#8c7463" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add option
            </motion.button>
          )}
        </div>

        {/* Toggles */}
        <div className="flex gap-3">
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
        </div>

        {/* Auto-close */}
        <DateTimePicker
          label="Auto-close (optional)"
          value={closesAt}
          onChange={setClosesAt}
          placeholder="No deadline"
          minDate={new Date()}
        />

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
            >
              <Text variant="caption" color="danger">
                {error}
              </Text>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end gap-2 pt-1">
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
      </form>
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
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer select-none transition-colors"
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
      {icon}
      {label}
    </motion.label>
  );
}
