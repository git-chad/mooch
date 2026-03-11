import { Button, Container, Text, Badge } from "@mooch/ui";

export const Hero = () => {
  return (
    <Container variant="site" className="pt-32">
      <div className="z-20 col-span-6 col-start-2 flex flex-col items-center gap-6">
        <Badge className="w-fit" label="Coming pretty soon" />
        <Text
          as="h1"
          variant="web-hero"
          color="web-title-hero"
          className="text-center"
        >
          mooch or get mooched
        </Text>
        <Text
          as="h2"
          variant="web-lead"
          className="text-center md:px-20"
          color="web-description"
        >
          mooch's your everyday tool for micro-managing your friends. Fret not,
          it's free to get started.
        </Text>

        <div className="flex justify-center items-center gap-2">
          <Button variant="secondary" size="md">
            Login
          </Button>
          <Button variant="primary" size="md">
            Sign up for Free
          </Button>
        </div>
      </div>
    </Container>
  );
};
