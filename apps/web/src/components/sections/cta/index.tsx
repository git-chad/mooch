import Image from "next/image";
import { TitleReveal } from "../common/TitleReveal";
import { WaitlistForm } from "./WaitlistForm";

const CTA_ARTWORK_SRC = "/images/cta-section-illustration.webp";

export const CTA = () => {
  return (
    <div className="pt-32 bg-[#FCFCFB]">
      <div className="w-full grid grid-cols-6 sm:grid-cols-8 gap-2 px-4 sm:px-8 max-w-[904px] mx-auto">
        <div className="col-span-6 col-start-1 sm:col-span-6 sm:col-start-2 flex flex-col items-center gap-12">
          <TitleReveal
            as="h2"
            variant="web-section"
            className="text-center"
            wrapperClassName="w-full max-w-[676px]"
            trigger="inView"
            delay={0.14}
          >
            If you're interested, sign up to our waiting list to be notified
            when this shit is up and running.
          </TitleReveal>

          <WaitlistForm />
        </div>

        <div className="col-span-6 sm:col-span-8 mt-[27px]">
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
