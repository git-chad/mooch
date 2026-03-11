import { Button, Input } from "@mooch/ui";
import Image from "next/image";
import { TitleReveal } from "../common/TitleReveal";

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

          <form
            action="#"
            className="flex w-full sm:w-auto flex-col sm:flex-row items-center justify-center gap-3 sm:gap-[19px]"
          >
            <div className="w-full sm:w-[240px]">
              <Input
                aria-label="Email"
                className="h-[36px] border-[#DCCABF] bg-[linear-gradient(in_oklab_180deg,oklab(100%_0_.0001_/_92%)_0%,oklab(94.7%_.005_.009_/_72%)_100%)] px-3 text-[13px] leading-[16px] text-[#68809A] shadow-none"
                id="waitlist-email"
                name="email"
                type="email"
                placeholder="Your email..."
              />
            </div>
            <Button
              type="submit"
              size="md"
              variant="primary"
              className="h-[38px] px-4 py-[10px]"
            >
              Sign up to Waitlist
            </Button>
          </form>
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
