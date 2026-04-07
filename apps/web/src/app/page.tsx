import HalftoneHero from "@/components/HalftoneHero";
import { CTA } from "@/components/sections/cta";
import { FAQ } from "@/components/sections/faq";
import { Features } from "@/components/sections/features/Features";
import { Hero } from "@/components/sections/hero";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <section id="hero" className="sticky top-0 z-0 h-screen overflow-hidden">
        <HalftoneHero />
        <Hero />
      </section>
      <section
        id="features"
        className="relative z-10 min-h-screen scroll-mt-24 bg-[#FCFCFB]"
      >
        <Features />
      </section>
      <section id="faq" className="relative z-10 scroll-mt-24 bg-[#FCFCFB]">
        <Suspense>
          <FAQ />
        </Suspense>
      </section>
      <section
        id="cta"
        className="relative z-10 scroll-mt-24 bg-[#FCFCFB]"
      >
        <CTA />
      </section>
    </main>
  );
}
