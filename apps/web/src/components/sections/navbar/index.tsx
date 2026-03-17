"use client";

import { Button, Container, Text } from "@mooch/ui";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#cta" },
  { label: "FAQ", href: "#faq" },
] as const;

export const Navbar = () => {
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    const delta = current - previous;

    if (current < 20) {
      if (!visibleRef.current) {
        visibleRef.current = true;
        setVisible(true);
      }
      return;
    }

    if (delta > 1.5 && visibleRef.current) {
      visibleRef.current = false;
      setVisible(false);
      return;
    }

    if (delta < -1.5 && !visibleRef.current) {
      visibleRef.current = true;
      setVisible(true);
    }
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-3 sm:pt-5">
      <Container variant="site">
        <motion.nav
          className="pointer-events-auto col-span-6 col-start-1 sm:col-span-6 sm:col-start-2 rounded-[20px] border border-[#D5E2EC]/70 bg-[linear-gradient(120deg,rgba(255,255,255,0.72)_0%,rgba(245,251,255,0.53)_55%,rgba(236,248,255,0.42)_100%)] py-[6px] pr-[6px] pl-3 shadow-[0_10px_30px_rgba(96,124,148,0.16),0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-[10px]"
          initial={false}
          animate={{
            y: visible ? 0 : -96,
            opacity: visible ? 1 : 0,
          }}
          transition={
            reduceMotion
              ? { duration: 0.2, ease: "easeOut" }
              : {
                  type: "spring",
                  stiffness: 320,
                  damping: 32,
                  mass: 0.7,
                }
          }
        >
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="min-w-0">
              <Text
                as="p"
                variant="web-lead"
                className="truncate text-black geist-pixel"
              >
                mooch
              </Text>
            </Link>

            <ul className="hidden items-center gap-5 sm:flex">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] leading-[16px] text-[#5F7892] transition-colors duration-150 hover:text-[#3F5B74]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <Link
                href="#cta"
                className="hidden text-[13px] leading-[16px] text-[#5F7892] transition-colors duration-150 hover:text-[#3F5B74] sm:inline"
              >
                Login
              </Link>
              <Button
                size="md"
                variant="primary"
                className="h-[30px] px-3 py-1.5"
              >
                Join Waitlist
              </Button>
            </div>
          </div>
        </motion.nav>
      </Container>
    </div>
  );
};
