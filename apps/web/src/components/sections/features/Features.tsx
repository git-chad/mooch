import { Container, Text } from "@mooch/ui";

export const Features = () => {
  return (
    <Container variant="site" className="pt-32">
      <div className="z-20 col-span-6 col-start-2 flex flex-col items-center gap-6">
        <Text
          as="h2"
          variant="web-section"
          className="text-center"
          color="web-title-hero"
        >
          All the tools you need in one place.
        </Text>
        <Text
          as="h3"
          variant="web-lead"
          className="text-center px-10"
          color="web-description"
        >
          Tired of your friends being lazy pieces of shit? Be that HR person
          they need and bring order to the squad.
        </Text>
      </div>
    </Container>
  );
};
