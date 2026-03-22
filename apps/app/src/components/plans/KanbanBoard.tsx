"use client";

import { usePlansBoardStore } from "@mooch/stores";
import type { PlanWithDetails } from "@mooch/stores";
import type { PlanStatus } from "@mooch/types";
import { Button, Container, Text } from "@mooch/ui";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { LayoutList } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import { movePlan as movePlanAction, reorderPlans } from "@/app/actions/plans";
import { TransitionSlot } from "@/components/TransitionSlot";
import { motionDuration, motionEase } from "@/lib/motion";
import { CreatePlanSheet } from "./CreatePlanSheet";
import { KanbanColumn } from "./KanbanColumn";
import { PLAN_STATUS_CONFIG } from "./plan-status";
import { PlanDetailPanel } from "./PlanDetailPanel";

type Props = {
  groupId: string;
  currentUserId: string;
};

export function KanbanBoard({ groupId, currentUserId }: Props) {
  const plans = usePlansBoardStore((s) => s.plans);
  const storeMovePlan = usePlansBoardStore((s) => s.movePlan);
  const setPlans = usePlansBoardStore((s) => s.setPlans);
  const [createOpen, setCreateOpen] = useState(false);
  const [createColumn, setCreateColumn] = useState<PlanStatus>("ideas");
  const [selectedPlan, setSelectedPlan] = useState<PlanWithDetails | null>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const columnPlans = {
    ideas: [] as PlanWithDetails[],
    to_plan: [] as PlanWithDetails[],
    upcoming: [] as PlanWithDetails[],
    done: [] as PlanWithDetails[],
  };

  for (const plan of plans) {
    columnPlans[plan.status]?.push(plan);
  }

  for (const key of Object.keys(columnPlans) as PlanStatus[]) {
    columnPlans[key].sort((a, b) => a.sort_order - b.sort_order);
  }

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
      <TransitionSlot
        className="col-span-6 sm:col-span-12 mx-auto w-full max-w-6xl space-y-5"
        variant="context"
      >
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
              className="flex flex-col items-center justify-center py-20 text-center"
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
              <div className="mb-4 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)] p-4 text-[var(--color-text-muted)]">
                <LayoutList className="h-7 w-7" />
              </div>
              <Text variant="heading" className="mb-1">
                No plans yet
              </Text>
              <Text variant="body" color="subtle" className="mb-4 max-w-md">
                Start mapping ideas, move them across states, and keep the squad
                aligned without leaving the board.
              </Text>
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
            </motion.div>
          )}
        </AnimatePresence>

        {plans.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {PLAN_STATUS_CONFIG.map((column) => (
                <div key={column.id}>
                  <KanbanColumn
                    status={column.id}
                    title={column.title}
                    plans={columnPlans[column.id]}
                    onAddClick={() => handleAddClick(column.id)}
                    onPlanClick={setSelectedPlan}
                  />
                </div>
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
      </TransitionSlot>
    </Container>
  );
}
