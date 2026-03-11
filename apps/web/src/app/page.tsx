"use client";

import { Hero } from "@/components/sections/hero";
import dynamic from "next/dynamic";

const HalftoneHero = dynamic(() => import("@/components/HalftoneHero"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <section className="relative h-screen overflow-hidden">
        <HalftoneHero />
        <Hero />
      </section>
    </main>
  );
}
