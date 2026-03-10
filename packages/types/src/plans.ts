export type PlanId = 'free' | 'pro' | 'club';

export interface PlanLimits {
  maxGroups: number | null;       // null = unlimited
  maxMembersPerGroup: number;
  expenseHistoryMonths: number | null;
  tokensMonthlyGrant: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free:  { maxGroups: 1,    maxMembersPerGroup: 8,  expenseHistoryMonths: 3,    tokensMonthlyGrant: 2  },
  pro:   { maxGroups: null, maxMembersPerGroup: 20, expenseHistoryMonths: null, tokensMonthlyGrant: 10 },
  club:  { maxGroups: null, maxMembersPerGroup: 50, expenseHistoryMonths: null, tokensMonthlyGrant: 30 },
};
