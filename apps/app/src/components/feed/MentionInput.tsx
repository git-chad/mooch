"use client";

import type { Profile } from "@mooch/types";
import { Avatar, Text } from "@mooch/ui";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

export type MentionMember = {
  userId: string;
  displayName: string;
  photoUrl: string | null;
};

// Stored/wire format: @[Display Name](userId)
const ENCODED_PATTERN = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;

type InsertedMention = {
  displayName: string;
  userId: string;
};

type UseMentionInputReturn = {
  /** Current query string after @ (null if not in mention mode) */
  mentionQuery: string | null;
  /** Filtered members matching the query */
  suggestions: MentionMember[];
  /** Call when user selects a suggestion */
  selectMention: (member: MentionMember) => void;
  /** Call when user dismisses suggestions (e.g. Escape) */
  dismissMentions: () => void;
  /** Wraps onChange — call this instead of raw setState */
  handleChange: (value: string) => void;
  /** Handle keydown for navigation */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Index of highlighted suggestion */
  highlightIndex: number;
  /** Encode the display text to wire format for submission */
  encode: (displayText: string) => string;
  /** Reset tracked mentions (call when form resets) */
  reset: () => void;
};

export function useMentionInput(
  value: string,
  setValue: (v: string) => void,
  members: MentionMember[],
): UseMentionInputReturn {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const cursorRef = useRef(0);
  // Track mentions inserted during this editing session
  const insertedRef = useRef<InsertedMention[]>([]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => m.displayName.toLowerCase().includes(q));
  }, [mentionQuery, members]);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      // Find the last @ that could be an active mention trigger
      const lastAt = newValue.lastIndexOf("@");
      if (lastAt === -1) {
        setMentionQuery(null);
        return;
      }

      const beforeAt = newValue.slice(0, lastAt);
      const afterAt = newValue.slice(lastAt + 1);

      // @ must be at start or preceded by whitespace
      if (lastAt > 0 && !/\s/.test(beforeAt[beforeAt.length - 1])) {
        setMentionQuery(null);
        return;
      }

      // Extract query: text after @ until next space or end
      const spaceAfter = afterAt.indexOf(" ");
      if (spaceAfter !== -1) {
        // Check if this matches an already-inserted mention name
        const word = afterAt.slice(0, spaceAfter);
        const isKnown = insertedRef.current.some(
          (m) => m.displayName === word,
        );
        if (isKnown) {
          setMentionQuery(null);
          return;
        }
      }

      const query = spaceAfter === -1 ? afterAt : afterAt.slice(0, spaceAfter);

      // If there's a space and it's not a partial match, dismiss
      if (spaceAfter !== -1) {
        setMentionQuery(null);
        return;
      }

      cursorRef.current = lastAt;
      setMentionQuery(query);
      setHighlightIndex(0);
    },
    [setValue],
  );

  const selectMention = useCallback(
    (member: MentionMember) => {
      const atPos = cursorRef.current;
      const before = value.slice(0, atPos);
      const afterAt = value.slice(atPos + 1);
      const spaceAfter = afterAt.indexOf(" ");
      const after = spaceAfter === -1 ? "" : afterAt.slice(spaceAfter);

      // Insert human-readable @Name in the input
      const display = `@${member.displayName}`;
      const newValue = `${before}${display}${after.startsWith(" ") ? after : ` ${after}`}`;
      setValue(newValue);

      // Track for encoding on submit
      insertedRef.current = insertedRef.current.filter(
        (m) => m.userId !== member.userId,
      );
      insertedRef.current.push({
        displayName: member.displayName,
        userId: member.userId,
      });

      setMentionQuery(null);
      setHighlightIndex(0);
    },
    [value, setValue],
  );

  const dismissMentions = useCallback(() => {
    setMentionQuery(null);
    setHighlightIndex(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (mentionQuery === null || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (suggestions[highlightIndex]) {
          e.preventDefault();
          selectMention(suggestions[highlightIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        dismissMentions();
      }
    },
    [mentionQuery, suggestions, highlightIndex, selectMention, dismissMentions],
  );

  // Convert display text (@Name) to wire format (@[Name](userId))
  const encode = useCallback(
    (displayText: string): string => {
      let result = displayText;
      // Replace each known @Name with encoded format
      // Process longest names first to avoid partial matches
      const sorted = [...insertedRef.current].sort(
        (a, b) => b.displayName.length - a.displayName.length,
      );
      for (const m of sorted) {
        const displayMention = `@${m.displayName}`;
        const encoded = `@[${m.displayName}](${m.userId})`;
        // Replace all occurrences
        while (result.includes(displayMention)) {
          result = result.replace(displayMention, encoded);
        }
      }
      return result;
    },
    [],
  );

  const reset = useCallback(() => {
    insertedRef.current = [];
    setMentionQuery(null);
    setHighlightIndex(0);
  }, []);

  return {
    mentionQuery,
    suggestions,
    selectMention,
    dismissMentions,
    handleChange,
    handleKeyDown,
    highlightIndex,
    encode,
    reset,
  };
}

/**
 * Dropdown overlay for mention suggestions.
 * Position this relative to the input container.
 */
export function MentionSuggestions({
  suggestions,
  highlightIndex,
  onSelect,
}: {
  suggestions: MentionMember[];
  highlightIndex: number;
  onSelect: (member: MentionMember) => void;
}) {
  return (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-40 overflow-y-auto rounded-xl border bg-white shadow-lg"
          style={{ borderColor: "#DCCBC0" }}
        >
          {suggestions.map((member, idx) => (
            <button
              key={member.userId}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                onSelect(member);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors first:rounded-t-xl last:rounded-b-xl"
              style={{
                background: idx === highlightIndex ? "#F5EFE8" : "transparent",
              }}
            >
              <Avatar
                size="sm"
                src={member.photoUrl ?? undefined}
                name={member.displayName}
              />
              <Text variant="caption" className="font-medium">
                {member.displayName}
              </Text>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Converts mention-encoded text to display format.
 * @[Display Name](userId) → styled pills (as React nodes)
 */
export function renderMentionText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const pattern = new RegExp(ENCODED_PATTERN.source, "g");

  for (const match of text.matchAll(pattern)) {
    const start = match.index;
    // Plain text before the mention
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    // Mention pill
    parts.push(
      <span
        key={`mention-${start}`}
        className="inline-flex items-baseline rounded-md px-1 py-0.5 font-semibold"
        style={{ background: "#E8F5D6", color: "#3D6B14" }}
      >
        @{match[1]}
      </span>,
    );
    lastIndex = start + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Helper to build MentionMember[] from group members data.
 */
export function toMentionMembers(
  members: Array<{
    user_id: string;
    profile: Pick<Profile, "display_name" | "photo_url">;
  }>,
): MentionMember[] {
  return members.map((m) => ({
    userId: m.user_id,
    displayName: m.profile.display_name || "Unknown",
    photoUrl: m.profile.photo_url,
  }));
}
