import { vi } from 'vitest';

// --- Stripe mock factory ---

export function createMockStripe() {
    return {
        webhooks: {
            constructEvent: vi.fn(),
        },
        checkout: {
            sessions: {
                create: vi.fn(),
            },
        },
        subscriptions: {
            retrieve: vi.fn(),
        },
        customers: {
            list: vi.fn(),
            create: vi.fn(),
            retrieve: vi.fn(),
        },
        billingPortal: {
            sessions: {
                create: vi.fn(),
            },
        },
    };
}

export type MockStripe = ReturnType<typeof createMockStripe>;

// --- Mock Stripe event factories ---

export function mockStripeEvent(type: string, dataObject: Record<string, unknown>) {
    return {
        type,
        data: { object: dataObject },
    };
}

export function mockCheckoutSession(overrides: Record<string, unknown> = {}) {
    return {
        id: 'cs_test_123',
        mode: 'subscription',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        metadata: { userId: 'user-uuid-1' },
        ...overrides,
    };
}

export function mockSubscription(overrides: Record<string, unknown> = {}) {
    return {
        id: 'sub_test_123',
        metadata: { userId: 'user-uuid-1' },
        status: 'active',
        items: {
            data: [
                {
                    price: {
                        id: 'price_pro_monthly',
                        recurring: { interval: 'month' },
                    },
                    current_period_start: Math.floor(Date.now() / 1000),
                    current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
                },
            ],
        },
        ...overrides,
    };
}

export function mockPaymentIntent(overrides: Record<string, unknown> = {}) {
    return {
        id: 'pi_test_123',
        metadata: { userId: 'user-uuid-1', pack: 'popular' },
        ...overrides,
    };
}

export function mockInvoice(overrides: Record<string, unknown> = {}) {
    return {
        id: 'in_test_123',
        parent: {
            subscription_details: {
                subscription: 'sub_test_123',
            },
        },
        ...overrides,
    };
}
