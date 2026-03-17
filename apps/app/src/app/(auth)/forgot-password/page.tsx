"use client";

import { Button, Input, Text } from "@mooch/ui";
import { ArrowLeft, BadgeCheck, Mail, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion() ?? false;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-callback`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
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
              Password recovery
            </span>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-5 space-y-1.5">
            <Text variant="display">Reset your password</Text>
            <Text variant="body" color="subtle">
              We&apos;ll send you a secure reset link.
            </Text>
          </motion.div>

          {submitted ? (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="rounded-[14px] border border-[#BBDCA0] bg-[#EDF8DE] px-3.5 py-3">
                <Text
                  variant="body"
                  className="inline-flex items-center gap-1.5 text-[#3D6B1A]"
                >
                  <BadgeCheck className="h-4 w-4" />
                  Check your email
                </Text>
                <Text variant="caption" className="mt-1 block text-[#4E6A39]">
                  If an account exists for{" "}
                  <span className="font-medium">{email}</span>, you&apos;ll
                  receive a reset link.
                </Text>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#3E6E18] transition-colors hover:text-[#2B4F0F]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.form
                variants={itemVariants}
                onSubmit={handleSubmit}
                className="space-y-3.5"
              >
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@domain.com"
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
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {loading ? "Sending..." : "Send reset link"}
                  </span>
                </Button>
              </motion.form>

              <motion.div variants={itemVariants} className="mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#7B6656] transition-colors hover:text-[#5A4B3F]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </motion.div>
            </>
          )}
        </motion.section>
      </div>
    </main>
  );
}
