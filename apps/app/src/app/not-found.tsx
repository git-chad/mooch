import { Button, Text } from "@mooch/ui";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="mb-8 dither rounded-sm overflow-hidden">
        <Image
          src="/images/bibi-found.webp"
          alt="Lost"
          width={420}
          height={420}
          priority
        />
      </div>
      <Text as="h1" variant="display" className="mb-3">
        404 - Page not found.
      </Text>
      <Text variant="body" color="subtle" className="mb-8 max-w-xs leading-tight text-balance">
        Page not found. You, however, have been found by Bibi. Run, nigga.
      </Text>
      {/* <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-[14px] bg-accent-strong px-4 py-2.5 text-sm font-medium text-btn-primary-fg font-sans shadow-[var(--shadow-btn-primary)] transition-opacity hover:opacity-90"
      >
        Back to home
      </Link> */}
      <Link href="/">
        <Button variant="primary" size="sm">
          Back to home
        </Button>
      </Link>
    </div>
  );
}
