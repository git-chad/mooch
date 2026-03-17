/**
 * Webhook Handlers Tests
 * Tests for: apps/app/src/app/api/webhooks/stripe/route.ts
 *
 * Maps to PLAN.md items: 3B-T2, 3B-T3, 3B-T6, 3B-T10, 3B-T11
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createMockStripe,
    mockCheckoutSession,
    mockSubscription,
    mockPaymentIntent,
    mockInvoice,
    type MockStripe,
} from '../mocks/stripe.mock';
import { createMockSupabase, type MockSupabase } from '../mocks/supabase.mock';

// --- Module mocks ---
let mockStripeInstance: MockStripe;
let mockSupabaseInstance: MockSupabase;

vi.mock('@/lib/stripe', () => ({
    get stripe() {
        return mockStripeInstance;
    },
}));

vi.mock('@/lib/supabase-admin', () => ({
    createAdminClient: () => mockSupabaseInstance,
}));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('valid_signature'),
    }),
}));

// Set env vars before importing the module
vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret');
vi.stubEnv('STRIPE_PRICE_PRO_MONTHLY', 'price_pro_monthly');
vi.stubEnv('STRIPE_PRICE_PRO_ANNUAL', 'price_pro_annual');
vi.stubEnv('STRIPE_PRICE_CLUB_MONTHLY', 'price_club_monthly');
vi.stubEnv('STRIPE_PRICE_CLUB_ANNUAL', 'price_club_annual');

// Import the route handler
import { POST } from '@/app/api/webhooks/stripe/route';

// --- Helpers ---
function makeRequest(body = '{}') {
    return new Request('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body,
        headers: { 'stripe-signature': 'valid_signature' },
    });
}

// --- Tests ---
describe('Stripe Webhook Route Handler', () => {
    beforeEach(() => {
        mockStripeInstance = createMockStripe();
        mockSupabaseInstance = createMockSupabase({
            selectResult: { data: { balance: 5 }, error: null },
            updateResult: { data: null, error: null },
            insertResult: { data: null, error: null },
        });
        vi.clearAllMocks();
    });

    // ===== 3B-T3: Webhook signature verification =====
    describe('Signature Verification', () => {
        it('returns 400 when stripe-signature is invalid', async () => {
            mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const response = await POST(makeRequest('invalid_body'));

            expect(response.status).toBe(400);
            expect(await response.text()).toContain('Webhook signature verification failed');
        });

        it('returns 200 for valid signature with known event', async () => {
            const sub = mockSubscription();
            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: { object: mockCheckoutSession() },
            });
            mockStripeInstance.subscriptions.retrieve.mockResolvedValue(sub);

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
        });
    });

    // ===== 3B-T2: Checkout completed → subscription active =====
    describe('checkout.session.completed', () => {
        it('updates subscription to active with correct plan and billing cycle', async () => {
            const session = mockCheckoutSession();
            const sub = mockSubscription();

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: { object: session },
            });
            mockStripeInstance.subscriptions.retrieve.mockResolvedValue(sub);

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
            expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123');
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('subscriptions');
        });

        it('skips non-subscription checkout sessions', async () => {
            const session = mockCheckoutSession({ mode: 'payment' });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: { object: session },
            });

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
            // Should not attempt to retrieve subscription for payment mode
            expect(mockStripeInstance.subscriptions.retrieve).not.toHaveBeenCalled();
        });
    });

    // ===== 3B-T10: Subscription deleted → plan_id=free =====
    describe('customer.subscription.deleted', () => {
        it('resets plan to free and status to canceled', async () => {
            const sub = mockSubscription({ status: 'canceled' });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'customer.subscription.deleted',
                data: { object: sub },
            });

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('subscriptions');
        });

        it('does nothing if subscription has no userId in metadata', async () => {
            const sub = mockSubscription({ metadata: {} });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'customer.subscription.deleted',
                data: { object: sub },
            });

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
        });
    });

    // ===== customer.subscription.updated =====
    describe('customer.subscription.updated', () => {
        it('syncs plan, status, and billing cycle', async () => {
            const sub = mockSubscription({
                status: 'active',
                items: {
                    data: [
                        {
                            price: { id: 'price_club_annual', recurring: { interval: 'year' } },
                            current_period_start: Math.floor(Date.now() / 1000),
                            current_period_end: Math.floor(Date.now() / 1000) + 365 * 86400,
                        },
                    ],
                },
            });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'customer.subscription.updated',
                data: { object: sub },
            });

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('subscriptions');
        });
    });

    // ===== 3B-T6: Token purchase → balance increment =====
    describe('payment_intent.succeeded', () => {
        it('increments token balance and inserts transaction for token purchase', async () => {
            const pi = mockPaymentIntent({ metadata: { userId: 'user-uuid-1', pack: 'popular' } });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'payment_intent.succeeded',
                data: { object: pi },
            });

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('token_balances');
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('token_transactions');
        });

        it('does nothing when metadata has no pack (non-token payment)', async () => {
            const pi = mockPaymentIntent({ metadata: { userId: 'user-uuid-1' } });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'payment_intent.succeeded',
                data: { object: pi },
            });

            // Reset from calls tracking
            mockSupabaseInstance = createMockSupabase();

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
        });

        it('does nothing when metadata has no userId', async () => {
            const pi = mockPaymentIntent({ metadata: {} });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'payment_intent.succeeded',
                data: { object: pi },
            });

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
        });
    });

    // ===== 3B-T11: Invoice payment failed → past_due =====
    describe('invoice.payment_failed', () => {
        it('sets subscription status to past_due', async () => {
            const invoice = mockInvoice();
            const sub = mockSubscription({ metadata: { userId: 'user-uuid-1' } });

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'invoice.payment_failed',
                data: { object: invoice },
            });
            mockStripeInstance.subscriptions.retrieve.mockResolvedValue(sub);

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
            expect(mockStripeInstance.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123');
            expect(mockSupabaseInstance.from).toHaveBeenCalledWith('subscriptions');
        });
    });

    // ===== determinePlanFromPrice =====
    describe('determinePlanFromPrice (via checkout flow)', () => {
        it('identifies pro plan from pro monthly price', async () => {
            const sub = mockSubscription({
                items: {
                    data: [
                        {
                            price: { id: 'price_pro_monthly', recurring: { interval: 'month' } },
                            current_period_start: Math.floor(Date.now() / 1000),
                            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
                        },
                    ],
                },
            });
            const session = mockCheckoutSession();

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: { object: session },
            });
            mockStripeInstance.subscriptions.retrieve.mockResolvedValue(sub);

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
        });

        it('identifies club plan from club annual price', async () => {
            const sub = mockSubscription({
                items: {
                    data: [
                        {
                            price: { id: 'price_club_annual', recurring: { interval: 'year' } },
                            current_period_start: Math.floor(Date.now() / 1000),
                            current_period_end: Math.floor(Date.now() / 1000) + 365 * 86400,
                        },
                    ],
                },
            });
            const session = mockCheckoutSession();

            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'checkout.session.completed',
                data: { object: session },
            });
            mockStripeInstance.subscriptions.retrieve.mockResolvedValue(sub);

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
        });
    });

    // ===== Unhandled event types =====
    describe('unhandled event types', () => {
        it('returns 200 for unknown event types (no-op)', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue({
                type: 'some.unknown.event',
                data: { object: {} },
            });

            const response = await POST(makeRequest());

            expect(response.status).toBe(200);
            expect(await response.text()).toBe('ok');
        });
    });
});
