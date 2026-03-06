"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { useAppTransition } from "@/components/AppTransitionProvider";
import { navigateWithViewTransition } from "@/lib/view-transition";

type Props = LinkProps &
  Omit<React.ComponentProps<typeof Link>, "href"> & {
    transition?: "view" | "none";
    replace?: boolean;
  };

export function TransitionLink({
  href,
  onClick,
  transition = "view",
  replace,
  children,
  ...props
}: Props) {
  const router = useRouter();
  const appTransition = useAppTransition();
  const nextTransition =
    transition === "view" ? appTransition.defaultLinkTransition : transition;

  if (typeof href !== "string" || nextTransition === "none") {
    return (
      <Link href={href} onClick={onClick} replace={replace} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      replace={replace}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return;
        }

        event.preventDefault();
        navigateWithViewTransition(router, href, {
          reducedMotion: appTransition.reducedMotion,
          replace,
        });
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
