"use client";

import dynamic from "next/dynamic";
import { CTA } from "@/components/sections/cta";
import { Features } from "@/components/sections/features/Features";
import { Hero } from "@/components/sections/hero";

const HalftoneHero = dynamic(() => import("@/components/HalftoneHero"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <section id="hero" className="relative h-screen overflow-hidden">
        <HalftoneHero />
        <Hero />
      </section>
      <section id="features" className="bg-[#FCFCFB] min-h-screen">
        <Features />
      </section>
      <section id="cta" className="bg-[#FCFCFB]">
        <CTA />
      </section>
    </main>
  );
}
