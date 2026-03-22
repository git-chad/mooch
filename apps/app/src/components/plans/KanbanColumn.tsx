"use client";

import type { PlanStatus } from "@mooch/types";
import type { PlanWithDetails } from "@mooch/stores";
import { Badge, Text } from "@mooch/ui";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { PLAN_STATUS_MAP } from "./plan-status";
import { PlanCard } from "./PlanCard";

type Props = {
  status: PlanStatus;
  title: string;
  plans: PlanWithDetails[];
  onAddClick: () => void;
  onPlanClick: (plan: PlanWithDetails) => void;
};

export function KanbanColumn({
  status,
  title,
  plans,
  onAddClick,
  onPlanClick,
}: Props) {
  const config = PLAN_STATUS_MAP[status];
  const Icon = config.icon;

  return (
    <div
      className="flex min-h-[420px] flex-col rounded-2xl border p-3"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-edge)",
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-[var(--color-edge)] bg-[var(--color-surface-secondary)] p-2 text-[var(--color-text-muted)]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <Text variant="label" className="block uppercase tracking-wide">
              {title}
            </Text>
            <Text variant="caption" color="subtle">
              {plans.length} {plans.length === 1 ? "card" : "cards"}
            </Text>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-edge)] bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text)]"
          aria-label={`Add plan to ${title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-1 flex-col gap-2 rounded-2xl border p-2 transition-colors duration-150"
            style={{
              background: snapshot.isDraggingOver
                ? "rgba(249, 236, 213, 0.72)"
                : "var(--color-surface-secondary)",
              borderColor: snapshot.isDraggingOver
                ? "rgba(214, 170, 105, 0.48)"
                : "var(--color-edge)",
            }}
          >
            {plans.map((plan, index) => (
              <Draggable key={plan.id} draggableId={plan.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={dragProvided.draggableProps.style}
                    className={
                      dragSnapshot.isDragging
                        ? "rotate-[1deg] scale-[1.01] transition-transform"
                        : "transition-transform"
                    }
                  >
                    <PlanCard
                      plan={plan}
                      onClick={() => onPlanClick(plan)}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {plans.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--color-edge)] px-4 py-8 text-center">
                <div className="space-y-2">
                  <Badge label="Drop zone" size="sm" />
                  <Text variant="caption" color="subtle">
                    Drag a plan here or create one directly in this column.
                  </Text>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
