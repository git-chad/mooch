"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { PlanWithDetails } from "@mooch/stores";
import { usePlansBoardStore } from "@mooch/stores";
import type { PlanStatus } from "@mooch/types";
import { Button, Container, Text } from "@mooch/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { movePlan as movePlanAction, reorderPlans } from "@/app/actions/plans";
import { EmptyState } from "@/components/EmptyState";
import { motionDuration, motionEase } from "@/lib/motion";
import { CreatePlanSheet } from "./CreatePlanSheet";
import { KanbanColumn } from "./KanbanColumn";
import { PlanDetailPanel } from "./PlanDetailPanel";
import { PLAN_STATUS_CONFIG } from "./plan-status";

type Props = {
  groupId: string;
  currentUserId: string;
};

const revealedGroups = new Set<string>();

export function KanbanBoard({ groupId, currentUserId }: Props) {
  const plans = usePlansBoardStore((s) => s.plans);
  const storeMovePlan = usePlansBoardStore((s) => s.movePlan);
  const setPlans = usePlansBoardStore((s) => s.setPlans);
  const [createOpen, setCreateOpen] = useState(false);
  const [createColumn, setCreateColumn] = useState<PlanStatus>("ideas");
  const [selectedPlan, setSelectedPlan] = useState<PlanWithDetails | null>(
    null,
  );
  const reducedMotion = useReducedMotion() ?? false;
  const shouldAnimateIn = !revealedGroups.has(groupId);

  useEffect(() => {
    revealedGroups.add(groupId);
  }, [groupId]);

  const columnPlans = useMemo(() => {
    const nextColumns = {
      ideas: [] as PlanWithDetails[],
      to_plan: [] as PlanWithDetails[],
      upcoming: [] as PlanWithDetails[],
      done: [] as PlanWithDetails[],
    };

    for (const plan of plans) {
      nextColumns[plan.status]?.push(plan);
    }

    for (const key of Object.keys(nextColumns) as PlanStatus[]) {
      nextColumns[key].sort((a, b) => a.sort_order - b.sort_order);
    }

    return nextColumns;
  }, [plans]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;

      const sourceStatus = source.droppableId as PlanStatus;
      const destinationStatus = destination.droppableId as PlanStatus;
      const sourceIndex = source.index;
      const destinationIndex = destination.index;

      if (
        sourceStatus === destinationStatus &&
        sourceIndex === destinationIndex
      ) {
        return;
      }

      const previousPlans = [...plans];

      if (sourceStatus === destinationStatus) {
        const reorderedColumn = [...columnPlans[sourceStatus]];
        const [movedPlan] = reorderedColumn.splice(sourceIndex, 1);
        if (!movedPlan) return;
        reorderedColumn.splice(destinationIndex, 0, movedPlan);

        const normalizedColumn = reorderedColumn.map((plan, index) => ({
          ...plan,
          sort_order: index,
        }));

        setPlans(
          plans.map(
            (plan) =>
              normalizedColumn.find((candidate) => candidate.id === plan.id) ??
              plan,
          ),
        );

        const response = await reorderPlans(
          groupId,
          normalizedColumn.map((plan) => ({
            id: plan.id,
            sort_order: plan.sort_order,
          })),
        );

        if ("error" in response) {
          setPlans(previousPlans);
        }

        return;
      }

      const sourceColumn = [...columnPlans[sourceStatus]];
      const destinationColumn = [...columnPlans[destinationStatus]];
      const [movedPlan] = sourceColumn.splice(sourceIndex, 1);

      if (!movedPlan) return;

      destinationColumn.splice(destinationIndex, 0, movedPlan);

      const normalizedSource = sourceColumn.map((plan, index) => ({
        ...plan,
        sort_order: index,
      }));
      const normalizedDestination = destinationColumn.map((plan, index) => ({
        ...plan,
        status: destinationStatus,
        sort_order: index,
      }));

      storeMovePlan(draggableId, destinationStatus, destinationIndex);

      const moveResponse = await movePlanAction(
        draggableId,
        destinationStatus,
        destinationIndex,
      );

      if ("error" in moveResponse) {
        setPlans(previousPlans);
        return;
      }

      const reorderPayload = [
        ...normalizedSource,
        ...normalizedDestination.filter((plan) => plan.id !== draggableId),
      ].map((plan) => ({
        id: plan.id,
        sort_order: plan.sort_order,
      }));

      const reorderResponse = await reorderPlans(groupId, reorderPayload);

      if ("error" in reorderResponse) {
        setPlans(previousPlans);
      }
    },
    [columnPlans, groupId, plans, setPlans, storeMovePlan],
  );

  const handleAddClick = useCallback((status: PlanStatus) => {
    setCreateColumn(status);
    setCreateOpen(true);
  }, []);

  return (
    <Container as="section" className="py-4 sm:py-6">
      <div className="col-span-6 sm:col-span-12 mx-auto w-full max-w-6xl space-y-5">
        <header className="flex items-center justify-between gap-3">
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

        <AnimatePresence>
          {plans.length === 0 && (
            <motion.div
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: motionDuration.standard,
                ease: motionEase.out,
              }}
            >
              <EmptyState
                emoji="📋"
                title="No plans yet"
                description="Start mapping ideas, move them across columns, and keep the squad aligned."
              >
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setCreateColumn("ideas");
                    setCreateOpen(true);
                  }}
                >
                  + New plan
                </Button>
              </EmptyState>
            </motion.div>
          )}
        </AnimatePresence>

        {plans.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {PLAN_STATUS_CONFIG.map((column) => (
                <KanbanColumn
                  key={column.id}
                  groupId={groupId}
                  status={column.id}
                  title={column.title}
                  plans={columnPlans[column.id]}
                  onAddClick={() => handleAddClick(column.id)}
                  onPlanClick={setSelectedPlan}
                />
              ))}
            </div>
          </DragDropContext>
        )}

        <CreatePlanSheet
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          groupId={groupId}
          initialStatus={createColumn}
        />

        <PlanDetailPanel
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          groupId={groupId}
          currentUserId={currentUserId}
        />
      </div>
    </Container>
  );
}
