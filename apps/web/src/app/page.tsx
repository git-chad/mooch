import HalftoneHero from "@/components/HalftoneHero";
import { CTA } from "@/components/sections/cta";
import { FAQ } from "@/components/sections/faq";
import { Features } from "@/components/sections/features/Features";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <section id="hero" className="sticky top-0 z-0 h-screen overflow-hidden">
        <HalftoneHero />
        <Hero />
      </section>
      <section
        id="features"
        className="relative z-10 min-h-screen bg-[#FCFCFB]"
      >
        <Features />
      </section>
      <section id="faq" className="relative z-10 bg-[#FCFCFB]">
        <FAQ />
      </section>
      <section id="cta" className="relative z-10 bg-[#FCFCFB]">
        <CTA />
      </section>
    </main>
  );
}
