import { Container, Text } from "@mooch/ui";
import { FeaturesFeature, type FeaturesFeatureData } from "./Feature";

const featuredTools: FeaturesFeatureData[] = [
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
];

const moreFeatures: FeaturesFeatureData[] = [
  {
    slug: "plans",
    variant: "compact",
    title: "Plans",
    badgeTone: "purple",
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
  {
    slug: "feed",
    variant: "compact",
    title: "Feed",
    badgeTone: "blue",
    description:
      "Lorem ipsum dolor sit et amet, some placeholder text, whatever.",
  },
];

export const Features = () => {
  return (
    <Container variant="site" className="pt-32 pb-24">
      <div className="z-20 col-span-6 col-start-1 sm:col-start-2 flex flex-col items-center">
        <Text
          as="h2"
          variant="web-section"
          className="text-center max-w-[904px]"
        >
          All the tools you need in one place.
        </Text>
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
          {featuredTools.map(({ slug, ...item }) => (
            <FeaturesFeature key={slug} {...item} />
          ))}
        </div>

        <div className="mt-16 flex w-full flex-col items-center gap-6">
          <Text as="h3" variant="web-section" className="text-center">
            There's more.
          </Text>
          <div className="h-px w-full bg-[#C7D4E1]" />
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-2">
          {moreFeatures.map(({ slug, ...item }) => (
            <FeaturesFeature key={slug} {...item} />
          ))}
        </div>
      </div>
    </Container>
  );
};
