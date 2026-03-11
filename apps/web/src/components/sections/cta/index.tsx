import { Text } from "@mooch/ui";

export const CTA = () => {
  return (
    <div className="pt-32 bg-[#FCFCFB]">
      <div className="w-full grid grid-cols-6 sm:grid-cols-8 gap-2 px-4 sm:px-8 max-w-[904px] mx-auto">
        <div className="col-span-6 col-start-1 sm:col-span-6 sm:col-start-2 flex flex-col items-center gap-12">
          <Text
            as="h2"
            variant="web-section"
            className="text-center max-w-[676px]"
          >
            If you're interested, sign up to our waiting list to be notified
            when this shit is up and running.
          </Text>

          <form
            action="#"
            className="flex w-full sm:w-auto flex-col sm:flex-row items-center justify-center gap-3 sm:gap-[19px]"
          >
            <label htmlFor="waitlist-email" className="sr-only">
              Email
            </label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              placeholder="Your email..."
              className="h-[36px] w-full sm:w-[240px] rounded-[14px] border border-[#DCCABF] bg-[linear-gradient(in_oklab_180deg,oklab(100%_0_.0001_/_92%)_0%,oklab(94.7%_.005_.009_/_72%)_100%)] px-3 text-[13px] leading-[16px] text-[#68809A] outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-[38px] items-center rounded-[14px] border border-[#5A9629] bg-[linear-gradient(in_oklab_180deg,oklab(87.7%_-0.085_0.109)_0%,oklab(73.4%_-0.113_0.123)_100%)] px-4 py-[10px] text-[13px] leading-[16px] font-medium text-[#F4FBFF] shadow-[#E2FBC2C7_0px_1px_0px_inset,#587B3357_0px_6px_14px,#527F2B_0px_2px_0px] transition-[filter,transform] duration-100 hover:brightness-[1.03] active:translate-y-px"
            >
              Sign up to Waitlist
            </button>
          </form>
        </div>

        <div className="col-span-6 sm:col-span-8 h-[325px] mt-[27px] bg-center bg-cover mix-blend-multiply opacity-30 bg-[url('https://workers.paper.design/file-assets/01KJD4AXP5DNA4SPWTWYF2W2AC/01KKABWE6RTMTD7GKC8HGAW33D.png')]" />
      </div>
    </div>
  );
};
