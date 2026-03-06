import { Container, Text } from "@mooch/ui";

export default function PollsPage() {
  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">🗳️</p>
        <Text variant="heading" className="mb-1">Polls</Text>
        <Text variant="body" color="subtle">Coming soon</Text>
      </div>
    </Container>
  );
}
