import { stripe } from './stripe';
import type Stripe from 'stripe';

export async function createOrRetrieveCustomer(
  email: string,
  userId: string
): Promise<Stripe.Customer> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];

  return stripe.customers.create({
    email,
    metadata: { userId }, // used to look up the user in webhooks
  });
}
