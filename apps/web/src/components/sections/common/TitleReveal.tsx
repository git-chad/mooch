"use client";

import { Text, type TextColor, type TextVariant } from "@mooch/ui";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useMemo } from "react";

type RevealTrigger = "mount" | "inView";

type TitleRevealProps = {
  children: ReactNode;
  as?: ComponentPropsWithoutRef<typeof Text>["as"];
  variant: TextVariant;
  color?: TextColor;
  className?: string;
  wrapperClassName?: string;
  delay?: number;
  trigger?: RevealTrigger;
  play?: boolean;
};

type WordToken =
  | { type: "word"; id: string; value: string }
  | { type: "space"; id: string; value: string };

const REDUCED_REVEAL_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 34,
  mass: 1,
};

const REVEAL_SPRING = {
  type: "spring" as const,
  stiffness: 250,
  damping: 16,
  mass: 0.72,
};

function toPlainText(node: ReactNode): string | null {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    const parts: string[] = [];
    for (const child of node) {
      const value = toPlainText(child);
      if (value === null) {
        return null;
      }
      parts.push(value);
    }
    return parts.join("");
  }

  return null;
}

function splitWords(value: string): WordToken[] {
  const parts = value.match(/\S+|\s+/g) ?? [];
  return parts.map((part, index) =>
    /\s+/.test(part)
      ? { type: "space", id: `space-${index}`, value: part }
      : { type: "word", id: `word-${index}-${part}`, value: part },
  );
}

export function TitleReveal({
  children,
  as = "h2",
  variant,
  color,
  className,
  wrapperClassName,
  delay = 0,
  trigger = "mount",
  play = true,
}: TitleRevealProps) {
  const reduceMotion = useReducedMotion();
  const plainText = useMemo(() => toPlainText(children), [children]);
  const wordTokens = useMemo<WordToken[]>(
    () => (plainText === null ? [] : splitWords(plainText)),
    [plainText],
  );
  const hasSplitText = plainText !== null && wordTokens.length > 0;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: reduceMotion
        ? { delayChildren: delay, staggerChildren: 0.02 }
        : { delayChildren: delay, staggerChildren: 0.04 },
    },
  };

  const wordVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            ...REDUCED_REVEAL_SPRING,
          },
        },
      }
    : {
        hidden: {
          opacity: 0,
          y: "0.24em",
          scale: 0.96,
          rotate: 0.25,
          filter: "blur(2px) saturate(0.94)",
        },
        visible: {
          opacity: 1,
          y: "0em",
          scale: 1,
          rotate: 0,
          filter: "blur(0px) saturate(1)",
          transition: {
            ...REVEAL_SPRING,
          },
        },
      };

  const inViewProps =
    trigger === "mount"
      ? { animate: play ? "visible" : "hidden" }
      : {
          whileInView: play ? "visible" : "hidden",
          viewport: { once: true, amount: 0.7 },
        };

  return (
    <motion.span
      className={["relative inline-block", wrapperClassName]
        .filter(Boolean)
        .join(" ")}
      initial="hidden"
      variants={containerVariants}
      {...inViewProps}
    >
      <Text
        as={as}
        variant={variant}
        color={color}
        className={className}
        aria-label={plainText ?? undefined}
      >
        {hasSplitText ? (
          <span aria-hidden>
            {wordTokens.map((token) => {
              if (token.type === "space") {
                return (
                  <span key={token.id} className="whitespace-pre">
                    {token.value}
                  </span>
                );
              }

              return (
                <motion.span
                  key={token.id}
                  className="inline-block whitespace-nowrap align-baseline"
                  variants={wordVariants}
                >
                  {token.value}
                </motion.span>
              );
            })}
          </span>
        ) : (
          children
        )}
      </Text>
    </motion.span>
  );
}
