import { vi } from 'vitest';

// --- Chainable Supabase mock ---

export interface MockSupabaseData {
    selectResult?: { data: unknown; error: unknown; count?: number | null };
    updateResult?: { data: unknown; error: unknown };
    insertResult?: { data: unknown; error: unknown };
    rpcResult?: { data: unknown; error: unknown };
}

export function createMockSupabase(config: MockSupabaseData = {}) {
    const selectResult = config.selectResult ?? { data: null, error: null };
    const updateResult = config.updateResult ?? { data: null, error: null };
    const insertResult = config.insertResult ?? { data: null, error: null };
    const rpcResult = config.rpcResult ?? { data: null, error: null };

    const chainable = () => {
        const chain: Record<string, unknown> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.insert = vi.fn().mockReturnValue(insertResult);
        chain.update = vi.fn().mockReturnValue(chain);
        chain.delete = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.single = vi.fn().mockReturnValue(selectResult);
        chain.maybeSingle = vi.fn().mockReturnValue(selectResult);

        // Allow the last `.eq()` before `.single()` to still resolve
        // by making each `.eq()` return a fresh chain that includes `.single()` resolving properly
        return chain;
    };

    const fromCalls: Record<string, ReturnType<typeof chainable>> = {};

    const supabase = {
        from: vi.fn((table: string) => {
            if (!fromCalls[table]) {
                fromCalls[table] = chainable();
            }
            return fromCalls[table];
        }),
        rpc: vi.fn().mockReturnValue(rpcResult),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'user-uuid-1', email: 'test@test.com' } },
                error: null,
            }),
        },
        // Expose internals for assertions
        _fromCalls: fromCalls,
    };

    return supabase;
}

export type MockSupabase = ReturnType<typeof createMockSupabase>;

// --- Preconfigured mock data helpers ---

export function mockSubscriptionRow(overrides: Record<string, unknown> = {}) {
    return {
        plan_id: 'free',
        status: 'active',
        billing_cycle: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        ...overrides,
    };
}

export function mockTokenBalanceRow(balance = 2) {
    return { balance };
}
