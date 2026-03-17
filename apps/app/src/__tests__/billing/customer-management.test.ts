/**
 * Customer Management Tests
 * Tests for: apps/app/src/lib/stripe-customers.ts
 *
 * Maps to PLAN.md items: 3B-T12
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockStripe, type MockStripe } from '../mocks/stripe.mock';

let mockStripeInstance: MockStripe;

vi.mock('@/lib/stripe', () => ({
    get stripe() {
        return mockStripeInstance;
    },
}));

import { createOrRetrieveCustomer } from '@/lib/stripe-customers';

describe('createOrRetrieveCustomer', () => {
    beforeEach(() => {
        mockStripeInstance = createMockStripe();
        vi.clearAllMocks();
    });

    // ===== 3B-T12: Duplicate customer guard =====
    it('returns existing customer when email already exists — no new customer created', async () => {
        const existingCustomer = {
            id: 'cus_existing_123',
            email: 'test@test.com',
            metadata: { userId: 'user-uuid-1' },
        };

        mockStripeInstance.customers.list.mockResolvedValue({
            data: [existingCustomer],
        });

        const result = await createOrRetrieveCustomer('test@test.com', 'user-uuid-1');

        expect(result).toEqual(existingCustomer);
        expect(mockStripeInstance.customers.list).toHaveBeenCalledWith({
            email: 'test@test.com',
            limit: 1,
        });
        expect(mockStripeInstance.customers.create).not.toHaveBeenCalled();
    });

    it('creates new customer when no existing customer found', async () => {
        const newCustomer = {
            id: 'cus_new_456',
            email: 'new@test.com',
            metadata: { userId: 'user-uuid-2' },
        };

        mockStripeInstance.customers.list.mockResolvedValue({
            data: [],
        });
        mockStripeInstance.customers.create.mockResolvedValue(newCustomer);

        const result = await createOrRetrieveCustomer('new@test.com', 'user-uuid-2');

        expect(result).toEqual(newCustomer);
        expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
            email: 'new@test.com',
            metadata: { userId: 'user-uuid-2' },
        });
    });

    it('calling twice with the same email returns the same customer', async () => {
        const existingCustomer = {
            id: 'cus_existing_789',
            email: 'same@test.com',
            metadata: { userId: 'user-uuid-3' },
        };

        mockStripeInstance.customers.list.mockResolvedValue({
            data: [existingCustomer],
        });

        const result1 = await createOrRetrieveCustomer('same@test.com', 'user-uuid-3');
        const result2 = await createOrRetrieveCustomer('same@test.com', 'user-uuid-3');

        expect(result1.id).toBe(result2.id);
        expect(mockStripeInstance.customers.create).not.toHaveBeenCalled();
    });
});
