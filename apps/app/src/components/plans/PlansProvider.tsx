"use client";

import { createBrowserClient, getPlans } from "@mooch/db";
import type { PlanWithDetails } from "@mooch/stores";
import { usePlansBoardStore } from "@mooch/stores";
import { useEffect } from "react";

type PlansProviderProps = {
    groupId: string;
    initialPlans: PlanWithDetails[];
    children: React.ReactNode;
};

export function PlansProvider({
    groupId,
    initialPlans,
    children,
}: PlansProviderProps) {
    const setPlans = usePlansBoardStore((s) => s.setPlans);
    const clear = usePlansBoardStore((s) => s.clear);

    useEffect(() => {
        setPlans(initialPlans);
        return () => clear();
    }, [initialPlans, setPlans, clear]);

    useEffect(() => {
        const supabase = createBrowserClient();

        const channel = supabase
            .channel(`plans-${groupId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "plans",
                    filter: `group_id=eq.${groupId}`,
                },
                async () => {
                    const fresh = await getPlans(supabase, groupId);
                    setPlans(fresh as PlanWithDetails[]);
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "plan_attachments",
                },
                async () => {
                    const fresh = await getPlans(supabase, groupId);
                    setPlans(fresh as PlanWithDetails[]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, setPlans]);

    return <>{children}</>;
}
