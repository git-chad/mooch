"use client";

import { usePlansBoardStore } from "@mooch/stores";
import type { PlanWithDetails } from "@mooch/stores";
import type { PlanStatus } from "@mooch/types";
import { Button, Text } from "@mooch/ui";
import { useState, useCallback, useMemo } from "react";
import {
    DragDropContext,
    type DropResult,
} from "@hello-pangea/dnd";
import { movePlan as movePlanAction, reorderPlans } from "@/app/actions/plans";
import { KanbanColumn } from "./KanbanColumn";
import { CreatePlanSheet } from "./CreatePlanSheet";
import { PlanDetailPanel } from "./PlanDetailPanel";

const COLUMNS: { id: PlanStatus; emoji: string; title: string }[] = [
    { id: "ideas", emoji: "💡", title: "Ideas" },
    { id: "to_plan", emoji: "📋", title: "To Plan" },
    { id: "upcoming", emoji: "📅", title: "Upcoming" },
    { id: "done", emoji: "✅", title: "Done" },
];

type Props = {
    groupId: string;
    currentUserId: string;
};

export function KanbanBoard({ groupId, currentUserId }: Props) {
    const plans = usePlansBoardStore((s) => s.plans);
    const storeMoveplan = usePlansBoardStore((s) => s.movePlan);
    const setPlans = usePlansBoardStore((s) => s.setPlans);
    const [createOpen, setCreateOpen] = useState(false);
    const [createColumn, setCreateColumn] = useState<PlanStatus>("ideas");
    const [selectedPlan, setSelectedPlan] = useState<PlanWithDetails | null>(null);

    // Group plans by status
    const columnPlans = useMemo(() => {
        const grouped: Record<PlanStatus, PlanWithDetails[]> = {
            ideas: [],
            to_plan: [],
            upcoming: [],
            done: [],
        };
        for (const plan of plans) {
            grouped[plan.status]?.push(plan);
        }
        // Sort each column by sort_order
        for (const key of Object.keys(grouped) as PlanStatus[]) {
            grouped[key].sort((a, b) => a.sort_order - b.sort_order);
        }
        return grouped;
    }, [plans]);

    const handleDragEnd = useCallback(
        async (result: DropResult) => {
            const { source, destination, draggableId } = result;
            if (!destination) return;

            const srcStatus = source.droppableId as PlanStatus;
            const destStatus = destination.droppableId as PlanStatus;
            const srcIndex = source.index;
            const destIndex = destination.index;

            // No movement
            if (srcStatus === destStatus && srcIndex === destIndex) return;

            // Snapshot for rollback
            const prevPlans = [...plans];

            if (srcStatus === destStatus) {
                // Reorder within the same column
                const colItems = [...columnPlans[srcStatus]];
                const [moved] = colItems.splice(srcIndex, 1);
                colItems.splice(destIndex, 0, moved);

                // Optimistic: update sort_orders
                const updates = colItems.map((item, index) => ({
                    ...item,
                    sort_order: index,
                }));

                setPlans(
                    plans.map((p) => {
                        const updated = updates.find((u) => u.id === p.id);
                        return updated ?? p;
                    }),
                );

                // Server call
                const result = await reorderPlans(
                    groupId,
                    updates.map((u) => ({ id: u.id, sort_order: u.sort_order })),
                );
                if ("error" in result) {
                    setPlans(prevPlans);
                }
            } else {
                // Cross-column move
                const destItems = [...columnPlans[destStatus]];
                const plan = plans.find((p) => p.id === draggableId);
                if (!plan) return;

                // Insert at destination index
                destItems.splice(destIndex, 0, plan);
                const newSortOrder = destIndex;

                // Optimistic update
                storeMoveplan(draggableId, destStatus, newSortOrder);

                // Server call
                const result = await movePlanAction(draggableId, destStatus, newSortOrder);
                if ("error" in result) {
                    setPlans(prevPlans);
                }
            }
        },
        [plans, columnPlans, groupId, storeMoveplan, setPlans],
    );

    const handleAddClick = useCallback((status: PlanStatus) => {
        setCreateColumn(status);
        setCreateOpen(true);
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
                <Text variant="title">Plans</Text>
                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                        setCreateColumn("ideas");
                        setCreateOpen(true);
                    }}
                >
                    + New plan
                </Button>
            </header>

            {/* Empty state */}
            {plans.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <p className="text-5xl mb-4">📋</p>
                    <Text variant="heading" className="mb-1">
                        No plans yet
                    </Text>
                    <Text variant="body" color="subtle">
                        Start planning — turn ideas into events!
                    </Text>
                </div>
            )}

            {/* Kanban board */}
            {plans.length > 0 && (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex-1 flex gap-3 overflow-x-auto px-4 sm:px-6 pb-4 snap-x snap-mandatory md:snap-none">
                        {COLUMNS.map((col) => (
                            <KanbanColumn
                                key={col.id}
                                status={col.id}
                                emoji={col.emoji}
                                title={col.title}
                                plans={columnPlans[col.id]}
                                onAddClick={() => handleAddClick(col.id)}
                                onPlanClick={setSelectedPlan}
                            />
                        ))}
                    </div>
                </DragDropContext>
            )}

            {/* Create plan sheet */}
            <CreatePlanSheet
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                groupId={groupId}
                initialStatus={createColumn}
            />

            {/* Plan detail panel */}
            <PlanDetailPanel
                plan={selectedPlan}
                onClose={() => setSelectedPlan(null)}
                groupId={groupId}
                currentUserId={currentUserId}
            />
        </div>
    );
}
