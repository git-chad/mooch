/**
 * Token Spending Tests
 * Tests for: packages/db/src/queries/tokens.ts
 *
 * Maps to PLAN.md items: 3B-T7, 3B-T8, 3B.4.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, type MockSupabase } from '../mocks/supabase.mock';

// We test spendTokens and ACTION_COSTS by importing them directly
// Since they depend on SupabaseClient, we pass our mock
import { spendTokens, ACTION_COSTS, type CorruptionAction } from '../../../../../packages/db/src/queries/tokens';

describe('Token System', () => {
    let mockSupabase: MockSupabase;

    // ===== 3B.4.2: Action costs match spec =====
    describe('ACTION_COSTS', () => {
        it('double_down costs 1 token', () => {
            expect(ACTION_COSTS.double_down).toBe(1);
        });

        it('the_leak costs 1 token', () => {
            expect(ACTION_COSTS.the_leak).toBe(1);
        });

        it('the_coup costs 1 token', () => {
            expect(ACTION_COSTS.the_coup).toBe(1);
        });

        it('ghost_vote costs 1 token', () => {
            expect(ACTION_COSTS.ghost_vote).toBe(1);
        });

        it('the_veto costs 2 tokens', () => {
            expect(ACTION_COSTS.the_veto).toBe(2);
        });

        it('hail_mary costs 3 tokens', () => {
            expect(ACTION_COSTS.hail_mary).toBe(3);
        });

        it('covers all 6 corruption actions', () => {
            const actions: CorruptionAction[] = [
                'double_down', 'the_leak', 'the_coup',
                'ghost_vote', 'the_veto', 'hail_mary',
            ];
            expect(Object.keys(ACTION_COSTS)).toHaveLength(6);
            for (const action of actions) {
                expect(ACTION_COSTS[action]).toBeGreaterThan(0);
            }
        });
    });

    // ===== 3B-T7: Insufficient balance → throw, no mutation =====
    describe('spendTokens — insufficient balance', () => {
        it('throws INSUFFICIENT_TOKENS when balance < cost', async () => {
            mockSupabase = createMockSupabase({
                selectResult: { data: { balance: 1 }, error: null },
            });

            await expect(
                spendTokens(mockSupabase as any, 'user-uuid-1', 'the_veto', 2),
            ).rejects.toThrow('INSUFFICIENT_TOKENS');
        });

        it('throws INSUFFICIENT_TOKENS when balance is 0', async () => {
            mockSupabase = createMockSupabase({
                selectResult: { data: { balance: 0 }, error: null },
            });

            await expect(
                spendTokens(mockSupabase as any, 'user-uuid-1', 'double_down', 1),
            ).rejects.toThrow('INSUFFICIENT_TOKENS');
        });

        it('throws INSUFFICIENT_TOKENS when user has no token_balances row', async () => {
            mockSupabase = createMockSupabase({
                selectResult: { data: null, error: { message: 'not found' } },
            });

            await expect(
                spendTokens(mockSupabase as any, 'user-uuid-1', 'double_down', 1),
            ).rejects.toThrow('INSUFFICIENT_TOKENS');
        });
    });

    // ===== 3B-T8: Sufficient balance → atomic decrement =====
    describe('spendTokens — sufficient balance', () => {
        it('calls RPC spend_tokens with correct params and returns remaining balance', async () => {
            mockSupabase = createMockSupabase({
                selectResult: { data: { balance: 10 }, error: null },
                rpcResult: { data: 9, error: null },
            });

            const result = await spendTokens(mockSupabase as any, 'user-uuid-1', 'double_down', 1);

            expect(result).toEqual({ ok: true, remainingBalance: 9 });
            expect(mockSupabase.rpc).toHaveBeenCalledWith('spend_tokens', {
                p_user_id: 'user-uuid-1',
                p_cost: 1,
                p_action: 'double_down',
            });
        });

        it('works for 2-cost actions (the_veto)', async () => {
            mockSupabase = createMockSupabase({
                selectResult: { data: { balance: 5 }, error: null },
                rpcResult: { data: 3, error: null },
            });

            const result = await spendTokens(mockSupabase as any, 'user-uuid-1', 'the_veto', 2);

            expect(result).toEqual({ ok: true, remainingBalance: 3 });
            expect(mockSupabase.rpc).toHaveBeenCalledWith('spend_tokens', {
                p_user_id: 'user-uuid-1',
                p_cost: 2,
                p_action: 'the_veto',
            });
        });

        it('works for 3-cost actions (hail_mary)', async () => {
            mockSupabase = createMockSupabase({
                selectResult: { data: { balance: 3 }, error: null },
                rpcResult: { data: 0, error: null },
            });

            const result = await spendTokens(mockSupabase as any, 'user-uuid-1', 'hail_mary', 3);

            expect(result).toEqual({ ok: true, remainingBalance: 0 });
        });

        it('throws INSUFFICIENT_TOKENS when RPC fails (race condition guard)', async () => {
            mockSupabase = createMockSupabase({
                selectResult: { data: { balance: 1 }, error: null },
                rpcResult: { data: null, error: { message: 'balance check failed' } },
            });

            await expect(
                spendTokens(mockSupabase as any, 'user-uuid-1', 'double_down', 1),
            ).rejects.toThrow('INSUFFICIENT_TOKENS');
        });
    });
});
