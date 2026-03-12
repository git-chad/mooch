"use client";

import { cn, Text } from "@mooch/ui";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

export type FeaturesFeatureVariant = "featured" | "compact";
export type FeaturesFeatureMediaKind = "image" | "video";
export type FeaturesFeatureBadgeTone = "orange" | "green" | "purple" | "blue";

export type FeaturesFeatureData = {
  slug: string;
  variant: FeaturesFeatureVariant;
  title: string;
  description: string;
  badge?: string;
  badgeTone?: FeaturesFeatureBadgeTone;
  showDivider?: boolean;
  mediaSrc?: string;
  mediaAlt?: string;
  mediaKind?: FeaturesFeatureMediaKind;
  mediaPoster?: string;
};

type FeaturesFeatureProps = Omit<FeaturesFeatureData, "slug"> & {
  className?: string;
  mediaClassName?: string;
  delay?: number;
};

export function FeaturesFeature({
  variant,
  title,
  description,
  badge,
  badgeTone,
  showDivider,
  mediaSrc,
  mediaAlt,
  mediaKind = "image",
  mediaPoster,
  className,
  mediaClassName,
  delay = 0,
}: FeaturesFeatureProps) {
  const isFeatured = variant === "featured";
  const label = badge ?? title;
  const resolvedBadgeTone = badgeTone ?? (isFeatured ? "green" : "purple");
  const shouldShowDivider = isFeatured && (showDivider ?? true);
  const reduceMotion = useReducedMotion();

  const cardVariants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            type: "spring" as const,
            stiffness: 260,
            damping: 34,
            mass: 1,
            delay,
          },
        },
      }
    : {
        hidden: {
          opacity: 0,
          y: 28,
          scale: 0.85,
          filter: "blur(2px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            type: "spring" as const,
            stiffness: 250,
            damping: 16,
            mass: 0.72,
            delay,
          },
        },
      };

  const badgeClasses = {
    orange: "bg-[#FFF0E5] border-[#E7BEA0] text-[#8F5732] px-[12px] py-[8px]",
    green: "bg-[#F1F9E8] border-[#C7DEB0] text-[#4F7330] px-[11px] py-[7px]",
    purple: "bg-[#F5EFFB] border-[#D4C8E3] text-[#6E5A88] px-[9px] py-[5px]",
    blue: "bg-[#EEF5FE] border-[#CCDDF0] text-[#5B7188] px-[9px] py-[5px]",
  }[resolvedBadgeTone];

  return (
    <motion.article
      className={cn("flex flex-col items-start gap-4", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={cardVariants}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-[14px] bg-[#EEF3F8]",
          isFeatured ? "h-[360px]" : "h-[182px]",
          mediaClassName,
        )}
      >
        {mediaSrc ? (
          mediaKind === "video" ? (
            <video
              className="h-full w-full object-cover"
              src={mediaSrc}
              poster={mediaPoster}
              muted
              playsInline
              autoPlay
              loop
            />
          ) : (
            <Image
              className="h-full w-full object-cover"
              src={mediaSrc}
              alt={mediaAlt ?? `${title} preview`}
              fill
              sizes={isFeatured ? "(min-width: 904px) 676px, 100vw" : "334px"}
            />
          )
        ) : null}
      </div>

      {isFeatured ? (
        <div className="flex w-full items-center gap-4">
          <span
            className={cn(
              "inline-flex items-center rounded-full border",
              badgeClasses,
            )}
          >
            <Text as="span" className="text-[12px] leading-[16px]">
              {label}
            </Text>
          </span>
          {shouldShowDivider ? (
            <span className="h-[15px] w-px shrink-0 bg-[#C7D4E1]" />
          ) : null}
          <Text
            as="p"
            className="shrink-0 text-[15px] leading-[20px] text-[#6F859B]"
          >
            {description}
          </Text>
        </div>
      ) : (
        <>
          <span
            className={cn(
              "inline-flex items-center rounded-full border",
              badgeClasses,
            )}
          >
            <Text as="span" className="text-[12px] leading-[16px]">
              {label}
            </Text>
          </span>
          <Text
            as="p"
            className="w-full text-[15px] leading-[20px] text-[#6F859B]"
          >
            {description}
          </Text>
        </>
      )}
    </motion.article>
  );
}
