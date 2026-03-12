import { Text } from "@mooch/ui";

const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Pricing", href: "#" },
  { label: "Back to top", href: "#hero" },
] as const;

export const Footer = () => {
  return (
    <footer id="footer" className="relative isolate bg-[#FCFCFB] pb-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 z-20 h-40 bg-[linear-gradient(to_bottom,#FCFCFB_0%,rgba(252,252,251,0.88)_42%,rgba(252,252,251,0)_100%)]"
      />
      <div className="mx-auto w-full max-w-[1132px] px-4 sm:px-8">
        <div className="relative flex h-[430px] w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_18.992932862190813%_50%_at_50%_50%_in_oklab,oklab(93.8%_-0.057_0.073)_0%,37.96%,oklab(99.1%_-0.0004_0.001)_100%)]">
          <Text
            as="p"
            variant="web-section"
            color="web-title"
            className="w-full text-center"
          >
            mooch.me
          </Text>

          <nav
            className="absolute bottom-8 left-4 right-4 sm:left-[10.07%] sm:right-auto"
            aria-label="Footer"
          >
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[15px] leading-[20px] text-[#6F859B] transition-colors duration-150 hover:text-[#5B7188]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};
