import { cn, Text } from "@mooch/ui";
import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  emoji?: string;
  iconSrc?: string;
  iconClassName?: string;
  className?: string;
  descriptionClassName?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  emoji,
  iconSrc,
  iconClassName,
  className,
  descriptionClassName,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className,
      )}
    >
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt=""
          width={192}
          height={192}
          className={cn("mb-4 size-48 select-none object-cover rounded-[14px]", iconClassName)}
          draggable={false}
          aria-hidden
        />
      ) : emoji ? (
        <p className="mb-4 text-5xl leading-none" aria-hidden>
          {emoji}
        </p>
      ) : null}

      <Text variant="heading" className="mb-1">
        {title}
      </Text>
      <Text variant="body" color="subtle" className={descriptionClassName}>
        {description}
      </Text>

      {children}
    </div>
  );
}
