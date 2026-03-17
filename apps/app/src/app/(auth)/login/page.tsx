"use client";

import { Button, Input, Text } from "@mooch/ui";
import { ArrowRight, CircleDotDashed, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion() ?? false;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get("next");
  const safeNextPath = nextPath?.startsWith("/") ? nextPath : "/groups";

  const containerVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.06,
            delayChildren: 0.04,
          },
        },
      };

  const itemVariants = reducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(safeNextPath);
  }

  async function handleGoogle() {
    const encodedNext = encodeURIComponent(safeNextPath);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodedNext}`,
      },
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8F2EA] px-4 py-10">
      <div className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-[#E7F2D6] blur-3xl" />
      <motion.div
        className="pointer-events-none absolute top-24 -right-20 h-80 w-80 rounded-full bg-[#F0DDD0] blur-3xl"
        animate={reducedMotion ? undefined : { y: [0, -10, 0], x: [0, 8, 0] }}
        transition={
          reducedMotion
            ? undefined
            : {
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <motion.section
          className="w-full max-w-md rounded-[24px] border border-[#DCCBC0] bg-[#FDFCFB]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_20px_50px_rgba(92,63,42,0.15)] backdrop-blur-sm sm:p-7"
          variants={containerVariants}
          initial={reducedMotion ? undefined : "hidden"}
          animate={reducedMotion ? undefined : "visible"}
        >
          <motion.div
            variants={itemVariants}
            className="mb-4 flex items-center gap-2"
          >
            <span className="inline-flex items-center gap-1 rounded-full border border-[#DCCBC0] bg-[#F7F1EA] px-2.5 py-1 text-[11px] font-medium text-[#7C6858]">
              <Sparkles className="h-3 w-3" />
              Welcome back
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-5 space-y-1.5">
            <Text variant="display">Sign in to mooch</Text>
            <Text variant="body" color="subtle">
              Track the chaos, keep the vibes.
            </Text>
          </motion.div>

          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-3.5"
          >
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@domain.com"
            />
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{
                    duration: motionDuration.fast,
                    ease: motionEase.out,
                  }}
                  className="rounded-[10px] border border-[#E2A39B] bg-[#FCEDEB] px-3 py-2 text-xs text-danger"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </motion.form>

          <motion.div
            variants={itemVariants}
            className="my-4 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-[#E8DDD4]" />
            <Text variant="caption" color="subtle">
              or continue with
            </Text>
            <div className="h-px flex-1 bg-[#E8DDD4]" />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogle}
              className="w-full"
            >
              <span className="inline-flex items-center gap-1.5">
                <CircleDotDashed className="h-3.5 w-3.5" />
                Sign in with Google
              </span>
            </Button>

            <div className="flex items-center justify-between gap-3">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#7B6656] transition-colors hover:text-[#5A4B3F]"
              >
                Forgot password?
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#3E6E18] transition-colors hover:text-[#2B4F0F]"
              >
                Create account
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
