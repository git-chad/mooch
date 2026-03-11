"use client";

import { Badge, Button, Container, Text } from "@mooch/ui";
import { useEffect, useState } from "react";
import { TitleReveal } from "../common/TitleReveal";

export const Hero = () => {
  const [introCanPlay, setIntroCanPlay] = useState(false);

  useEffect(() => {
    let started = false;

    const startIntro = () => {
      if (started) {
        return;
      }
      started = true;
      requestAnimationFrame(() => {
        setIntroCanPlay(true);
      });
    };

    if (
      (
        window as Window & {
          __halftoneReady?: boolean;
        }
      ).__halftoneReady
    ) {
      startIntro();
      return;
    }

    window.addEventListener("halftone:ready", startIntro, { once: true });

    const fallbackId = window.setTimeout(startIntro, 1400);
    return () => {
      window.removeEventListener("halftone:ready", startIntro);
      window.clearTimeout(fallbackId);
    };
  }, []);

  const introPlayState = introCanPlay ? "running" : "paused";

  return (
    <Container variant="site" className="pt-32">
      <div className="z-20 col-span-6 col-start-2 flex flex-col items-center gap-6">
        <div
          className="hero-reveal hero-reveal-badge"
          style={{ animationPlayState: introPlayState }}
        >
          <Badge className="w-fit" label="Coming pretty soon" color="#6F859B" />
        </div>
        <TitleReveal
          as="h1"
          variant="web-hero"
          color="web-title-hero"
          className="text-center"
          delay={0.14}
          trigger="mount"
          play={introCanPlay}
        >
          mooch or get mooched
        </TitleReveal>
        <Text
          as="h2"
          variant="web-lead"
          className="text-center md:px-20 hero-reveal hero-reveal-description"
          color="web-description"
          style={{ animationPlayState: introPlayState }}
        >
          mooch's your everyday tool for micro-managing your friends. Fret not,
          it's free to get started.
        </Text>

        <div
          className="flex justify-center items-center gap-2 hero-reveal hero-reveal-buttons"
          style={{ animationPlayState: introPlayState }}
        >
          <div
            className="hero-reveal-btn hero-reveal-btn-a"
            style={{ animationPlayState: introPlayState }}
          >
            <Button variant="secondary" size="md">
              Login
            </Button>
          </div>
          <div
            className="hero-reveal-btn hero-reveal-btn-b"
            style={{ animationPlayState: introPlayState }}
          >
            <Button variant="primary" size="md">
              Sign up for Free
            </Button>
          </div>
        </div>

        <div
          className="hero-reveal mt-3 w-full max-w-[514px]"
          style={{
            animationPlayState: introPlayState,
            animationDelay: "560ms",
          }}
        />
      </div>
    </Container>
  );
};
