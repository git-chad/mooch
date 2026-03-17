/**
 * Plan Gating Tests
 * Tests for: packages/db/src/queries/subscriptions.ts
 *
 * Maps to PLAN.md items: 3B-T5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the react cache — it's used by getUserPlan
vi.mock('react', () => ({
    cache: (fn: Function) => fn,
}));

import {
    getUserPlan,
    getUserTokenBalance,
    canPerformAction,
} from '../../../../../packages/db/src/queries/subscriptions';
import { PLAN_LIMITS } from '../../../../../packages/types/src/plans';

// --- Helpers to create chainable mocks ---
function createChainableSelect(data: unknown, error: unknown = null, count: number | null = null) {
    const chain: Record<string, any> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockReturnValue({ data, error });
    // For count queries
    if (count !== null) {
        chain.select = vi.fn().mockReturnValue({ ...chain, count, data: null, error: null });
    }
    return chain;
}

function createSupabase(tables: Record<string, any>) {
    return {
        from: vi.fn((table: string) => {
            if (tables[table]) return tables[table];
            return createChainableSelect(null, null);
        }),
    } as any;
}

describe('Plan Gating', () => {
    // ===== getUserPlan =====
    describe('getUserPlan', () => {
        it('returns free plan defaults when no subscription row exists', async () => {
            const supabase = createSupabase({
                subscriptions: createChainableSelect(null, { message: 'not found' }),
            });

            const plan = await getUserPlan(supabase, 'user-uuid-1');

            expect(plan.planId).toBe('free');
            expect(plan.limits).toEqual(PLAN_LIMITS.free);
            expect(plan.status).toBe('active');
            expect(plan.billingCycle).toBeNull();
            expect(plan.stripeCustomerId).toBeNull();
        });

        it('returns correct plan when subscription exists', async () => {
            const supabase = createSupabase({
                subscriptions: createChainableSelect({
                    plan_id: 'pro',
                    status: 'active',
                    billing_cycle: 'monthly',
                    stripe_customer_id: 'cus_123',
                }),
            });

            const plan = await getUserPlan(supabase, 'user-uuid-1');

            expect(plan.planId).toBe('pro');
            expect(plan.limits).toEqual(PLAN_LIMITS.pro);
            expect(plan.status).toBe('active');
            expect(plan.billingCycle).toBe('monthly');
            expect(plan.stripeCustomerId).toBe('cus_123');
        });

        it('returns club plan with correct limits', async () => {
            const supabase = createSupabase({
                subscriptions: createChainableSelect({
                    plan_id: 'club',
                    status: 'active',
                    billing_cycle: 'annual',
                    stripe_customer_id: 'cus_456',
                }),
            });

            const plan = await getUserPlan(supabase, 'user-uuid-1');

            expect(plan.planId).toBe('club');
            expect(plan.limits.maxGroups).toBeNull(); // unlimited
            expect(plan.limits.maxMembersPerGroup).toBe(50);
            expect(plan.limits.tokensMonthlyGrant).toBe(30);
        });

        it('defaults to free when plan_id is null/empty', async () => {
            const supabase = createSupabase({
                subscriptions: createChainableSelect({
                    plan_id: null,
                    status: 'active',
                    billing_cycle: null,
                    stripe_customer_id: null,
                }),
            });

            const plan = await getUserPlan(supabase, 'user-uuid-1');

            expect(plan.planId).toBe('free');
            expect(plan.limits).toEqual(PLAN_LIMITS.free);
        });
    });

    // ===== getUserTokenBalance =====
    describe('getUserTokenBalance', () => {
        it('returns balance from token_balances row', async () => {
            const supabase = createSupabase({
                token_balances: createChainableSelect({ balance: 15 }),
            });

            const balance = await getUserTokenBalance(supabase, 'user-uuid-1');
            expect(balance).toBe(15);
        });

        it('returns 0 when no token_balances row exists', async () => {
            const supabase = createSupabase({
                token_balances: createChainableSelect(null, { message: 'not found' }),
            });

            const balance = await getUserTokenBalance(supabase, 'user-uuid-1');
            expect(balance).toBe(0);
        });

        it('returns 0 when balance query errors', async () => {
            const supabase = createSupabase({
                token_balances: createChainableSelect(null, { message: 'db error' }),
            });

            const balance = await getUserTokenBalance(supabase, 'user-uuid-1');
            expect(balance).toBe(0);
        });
    });

    // ===== 3B-T5: canPerformAction =====
    describe('canPerformAction', () => {
        // --- create_group ---
        it('free user with 1 group → create_group blocked (3B-T5)', async () => {
            const subscriptionsChain = createChainableSelect({
                plan_id: 'free',
                status: 'active',
                billing_cycle: null,
                stripe_customer_id: null,
            });

            // For group_members count query — need special handling
            const groupMembersChain: Record<string, any> = {};
            groupMembersChain.select = vi.fn().mockReturnValue({ count: 1, data: null, error: null });
            groupMembersChain.eq = vi.fn().mockReturnValue(groupMembersChain);

            // Make the select return a chain with count embedded
            const countChain: Record<string, any> = {};
            countChain.eq = vi.fn().mockReturnValue({ count: 1, data: null, error: null });
            groupMembersChain.select = vi.fn().mockReturnValue(countChain);

            const supabase = createSupabase({
                subscriptions: subscriptionsChain,
                group_members: groupMembersChain,
            });

            const result = await canPerformAction(supabase, 'user-uuid-1', 'create_group');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Free plan');
        });

        it('free user with 0 groups → create_group allowed', async () => {
            const subscriptionsChain = createChainableSelect({
                plan_id: 'free',
                status: 'active',
                billing_cycle: null,
                stripe_customer_id: null,
            });

            const groupMembersChain: Record<string, any> = {};
            const countChain: Record<string, any> = {};
            countChain.eq = vi.fn().mockReturnValue({ count: 0, data: null, error: null });
            groupMembersChain.select = vi.fn().mockReturnValue(countChain);
            groupMembersChain.eq = vi.fn().mockReturnValue(groupMembersChain);

            const supabase = createSupabase({
                subscriptions: subscriptionsChain,
                group_members: groupMembersChain,
            });

            const result = await canPerformAction(supabase, 'user-uuid-1', 'create_group');

            expect(result.allowed).toBe(true);
        });

        it('pro user → create_group always allowed (unlimited)', async () => {
            const subscriptionsChain = createChainableSelect({
                plan_id: 'pro',
                status: 'active',
                billing_cycle: 'monthly',
                stripe_customer_id: 'cus_123',
            });

            const supabase = createSupabase({
                subscriptions: subscriptionsChain,
            });

            const result = await canPerformAction(supabase, 'user-uuid-1', 'create_group');

            expect(result.allowed).toBe(true);
        });

        // --- add_member ---
        it('add_member without groupId → blocked', async () => {
            const subscriptionsChain = createChainableSelect({
                plan_id: 'free',
                status: 'active',
                billing_cycle: null,
                stripe_customer_id: null,
            });

            const supabase = createSupabase({
                subscriptions: subscriptionsChain,
            });

            const result = await canPerformAction(supabase, 'user-uuid-1', 'add_member');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Missing group context');
        });

        it('add_member at limit → blocked', async () => {
            const subscriptionsChain = createChainableSelect({
                plan_id: 'free',
                status: 'active',
                billing_cycle: null,
                stripe_customer_id: null,
            });

            const groupMembersChain: Record<string, any> = {};
            const countChain: Record<string, any> = {};
            countChain.eq = vi.fn().mockReturnValue({ count: 8, data: null, error: null });
            groupMembersChain.select = vi.fn().mockReturnValue(countChain);
            groupMembersChain.eq = vi.fn().mockReturnValue(groupMembersChain);

            const supabase = createSupabase({
                subscriptions: subscriptionsChain,
                group_members: groupMembersChain,
            });

            const result = await canPerformAction(
                supabase, 'user-uuid-1', 'add_member', { groupId: 'group-1' },
            );

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('members per group');
        });

        // --- view_expense_history ---
        it('view_expense_history → always allowed', async () => {
            const subscriptionsChain = createChainableSelect({
                plan_id: 'free',
                status: 'active',
                billing_cycle: null,
                stripe_customer_id: null,
            });

            const supabase = createSupabase({
                subscriptions: subscriptionsChain,
            });

            const result = await canPerformAction(supabase, 'user-uuid-1', 'view_expense_history');

            expect(result.allowed).toBe(true);
        });
    });
});
