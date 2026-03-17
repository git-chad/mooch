/**
 * Plan Constants Tests
 * Tests for: packages/types/src/plans.ts
 *
 * Maps to PLAN.md items: 3B.1.2
 */
import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, type PlanId } from '../../../../../packages/types/src/plans';

describe('PLAN_LIMITS Constants', () => {
    // ===== 3B.1.2: Plan seed values match spec =====
    describe('Free plan', () => {
        it('maxGroups = 1', () => {
            expect(PLAN_LIMITS.free.maxGroups).toBe(1);
        });

        it('maxMembersPerGroup = 8', () => {
            expect(PLAN_LIMITS.free.maxMembersPerGroup).toBe(8);
        });

        it('expenseHistoryMonths = 3', () => {
            expect(PLAN_LIMITS.free.expenseHistoryMonths).toBe(3);
        });

        it('tokensMonthlyGrant = 2', () => {
            expect(PLAN_LIMITS.free.tokensMonthlyGrant).toBe(2);
        });
    });

    describe('Pro plan', () => {
        it('maxGroups = null (unlimited)', () => {
            expect(PLAN_LIMITS.pro.maxGroups).toBeNull();
        });

        it('maxMembersPerGroup = 20', () => {
            expect(PLAN_LIMITS.pro.maxMembersPerGroup).toBe(20);
        });

        it('expenseHistoryMonths = null (unlimited)', () => {
            expect(PLAN_LIMITS.pro.expenseHistoryMonths).toBeNull();
        });

        it('tokensMonthlyGrant = 10', () => {
            expect(PLAN_LIMITS.pro.tokensMonthlyGrant).toBe(10);
        });
    });

    describe('Club plan', () => {
        it('maxGroups = null (unlimited)', () => {
            expect(PLAN_LIMITS.club.maxGroups).toBeNull();
        });

        it('maxMembersPerGroup = 50', () => {
            expect(PLAN_LIMITS.club.maxMembersPerGroup).toBe(50);
        });

        it('expenseHistoryMonths = null (unlimited)', () => {
            expect(PLAN_LIMITS.club.expenseHistoryMonths).toBeNull();
        });

        it('tokensMonthlyGrant = 30', () => {
            expect(PLAN_LIMITS.club.tokensMonthlyGrant).toBe(30);
        });
    });

    describe('Completeness', () => {
        it('PLAN_LIMITS has entries for all 3 plan IDs', () => {
            const planIds: PlanId[] = ['free', 'pro', 'club'];
            for (const id of planIds) {
                expect(PLAN_LIMITS[id]).toBeDefined();
                expect(PLAN_LIMITS[id].maxMembersPerGroup).toBeGreaterThan(0);
                expect(PLAN_LIMITS[id].tokensMonthlyGrant).toBeGreaterThan(0);
            }
        });

        it('all plans have all required fields', () => {
            for (const plan of Object.values(PLAN_LIMITS)) {
                expect(plan).toHaveProperty('maxGroups');
                expect(plan).toHaveProperty('maxMembersPerGroup');
                expect(plan).toHaveProperty('expenseHistoryMonths');
                expect(plan).toHaveProperty('tokensMonthlyGrant');
            }
        });

        it('higher plans have more members per group', () => {
            expect(PLAN_LIMITS.pro.maxMembersPerGroup).toBeGreaterThan(
                PLAN_LIMITS.free.maxMembersPerGroup,
            );
            expect(PLAN_LIMITS.club.maxMembersPerGroup).toBeGreaterThan(
                PLAN_LIMITS.pro.maxMembersPerGroup,
            );
        });

        it('higher plans have more monthly tokens', () => {
            expect(PLAN_LIMITS.pro.tokensMonthlyGrant).toBeGreaterThan(
                PLAN_LIMITS.free.tokensMonthlyGrant,
            );
            expect(PLAN_LIMITS.club.tokensMonthlyGrant).toBeGreaterThan(
                PLAN_LIMITS.pro.tokensMonthlyGrant,
            );
        });
    });
});
