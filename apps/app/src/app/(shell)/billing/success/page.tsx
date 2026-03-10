import { Container, Text, Button } from "@mooch/ui";
import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-4">🎉</p>
        <Text variant="heading" className="mb-2">
          You&apos;re all set!
        </Text>
        <Text variant="body" color="subtle" className="mb-6 max-w-md">
          Your payment was successful. Your plan and tokens will be updated
          shortly — this usually takes just a few seconds.
        </Text>
        <Link href="/billing">
          <Button variant="primary" size="md">
            Go to Billing
          </Button>
        </Link>
      </div>
    </Container>
  );
}
