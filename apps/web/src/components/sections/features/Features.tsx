import { Container, Text } from "@mooch/ui";
import { TitleReveal } from "../common/TitleReveal";
import { FeaturesFeature, type FeaturesFeatureData } from "./Feature";

const getScreenshotPath = (slug: string) => `/screenshots/${slug}.webp`;

const withScreenshot = (feature: FeaturesFeatureData): FeaturesFeatureData => ({
  ...feature,
  mediaSrc: getScreenshotPath(feature.slug),
  mediaAlt: `${feature.title} app screenshot`,
});

const featuredTools = [
  {
    slug: "expense-tracking",
    variant: "featured",
    title: "Expense Tracking",
    badge: "Expense Tracking",
    badgeTone: "orange",
    description: "Don't let them mooch you!",
  },
  {
    slug: "polls",
    variant: "featured",
    title: "Polls",
    badge: "Polls",
    badgeTone: "green",
    description: "Democracy 101, corruption and all.",
  },
] satisfies FeaturesFeatureData[];

const moreFeatures = [
  {
    slug: "plans",
    variant: "compact",
    title: "Plans",
    badgeTone: "purple",
    description:
      "Lorem ipsum dolor sit et amet, some placeholder text, whatever.",
  },
  {
    slug: "feed",
    variant: "compact",
    title: "Feed",
    badgeTone: "blue",
    description:
      "Lorem ipsum dolor sit et amet, some placeholder text, whatever.",
  },
  {
    slug: "events",
    variant: "compact",
    title: "Events",
    badgeTone: "blue",
    description:
      "Lorem ipsum dolor sit et amet, some placeholder text, whatever.",
  },
  {
    slug: "insights",
    variant: "compact",
    title: "Insights",
    badgeTone: "purple",
    description:
      "Lorem ipsum dolor sit et amet, some placeholder text, whatever.",
  },
] satisfies FeaturesFeatureData[];

export const Features = () => {
  return (
    <Container variant="site" className="pt-32 pb-24">
      <div className="z-20 col-span-6 col-start-1 sm:col-start-2 flex flex-col items-center">
        <TitleReveal
          as="h2"
          variant="web-section"
          className="text-center text-pretty"
          wrapperClassName="w-full max-w-[904px]"
          trigger="inView"
          delay={0.12}
        >
          All the tools you need in one place.
        </TitleReveal>
        <Text
          as="h3"
          variant="web-lead"
          className="mt-6 text-center max-w-[513px]"
          color="web-description"
        >
          Tired of your friends being lazy pieces of shit? Be that HR person
          they need and bring order to the squad.
        </Text>

        <div className="mt-14 flex w-full flex-col gap-6">
          {featuredTools.map(withScreenshot).map(({ slug, ...item }, index) => (
            <FeaturesFeature key={slug} delay={0.08 + index * 0.08} {...item} />
          ))}
        </div>

        <div className="mt-16 flex w-full flex-col items-center gap-6">
          <TitleReveal
            as="h3"
            variant="web-section"
            className="text-center"
            trigger="inView"
            delay={0.12}
          >
            There's more.
          </TitleReveal>
          <div className="h-px w-full bg-[#C7D4E1]" />
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-2">
          {moreFeatures.map(withScreenshot).map(({ slug, ...item }, index) => (
            <FeaturesFeature key={slug} delay={0.06 + index * 0.06} {...item} />
          ))}
        </div>
      </div>
    </Container>
  );
};
