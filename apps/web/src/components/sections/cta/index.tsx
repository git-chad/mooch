import Image from "next/image";
import { TitleReveal } from "../common/TitleReveal";
import { WaitlistForm } from "./WaitlistForm";

const CTA_ARTWORK_SRC = "/images/cta-section-illustration.webp";

export const CTA = () => {
  return (
    <div id="waitlist" className="bg-[#FCFCFB] pt-24 sm:pt-32">
      <div className="mx-auto grid w-full max-w-[904px] grid-cols-6 gap-2 px-4 sm:grid-cols-8 sm:px-8">
        <div className="col-span-6 col-start-1 flex flex-col items-center gap-8 sm:col-span-6 sm:col-start-2 sm:gap-12">
          <TitleReveal
            as="h2"
            variant="web-section"
            className="text-center"
            wrapperClassName="w-full md:max-w-[676px]"
            trigger="inView"
            delay={0.14}
          >
            If you're interested, sign up to our waiting list to be notified
            when this shit is up and running.
          </TitleReveal>

          <WaitlistForm />
        </div>

        <div className="col-span-6 mt-6 sm:col-span-8 sm:mt-[27px]">
          <Image
            src={CTA_ARTWORK_SRC}
            alt=""
            width={904}
            height={325}
            className="h-auto w-full select-none opacity-30 mix-blend-multiply"
            priority={false}
          />
        </div>
      </div>
    </div>
  );
};
