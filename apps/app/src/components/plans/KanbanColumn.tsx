"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { PlanWithDetails } from "@mooch/stores";
import type { PlanStatus } from "@mooch/types";
import { Text } from "@mooch/ui";
import { Plus } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { PLAN_STATUS_MAP } from "./plan-status";

type Props = {
  groupId: string;
  status: PlanStatus;
  title: string;
  plans: PlanWithDetails[];
  onAddClick: () => void;
  onPlanClick: (plan: PlanWithDetails) => void;
};

export function KanbanColumn({
  groupId,
  status,
  title,
  plans,
  onAddClick,
  onPlanClick,
}: Props) {
  const config = PLAN_STATUS_MAP[status];
  const Icon = config.icon;

  return (
    <section className="flex min-h-[460px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-edge-subtle)] pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="rounded-[10px] border p-1.5 text-[var(--color-ink-sub)]"
            style={{
              background:
                "linear-gradient(165deg, rgba(255,255,255,0.9) 0%, rgba(247,242,237,0.8) 100%)",
              borderColor: "var(--color-edge)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -1px 2px rgba(0,0,0,0.04), 0 1px 0 rgba(200,180,160,0.15)",
            }}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
          <Text
            variant="overline"
            color="muted"
            className="tracking-[0.2em]"
          >
            {title}
          </Text>
        </div>

        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-transparent text-[var(--color-ink-sub)] transition-all hover:border-[var(--color-edge)] hover:bg-[rgba(255,255,255,0.82)] hover:text-[var(--color-ink)]"
          aria-label={`Add plan to ${title}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-1 flex-col rounded-[14px] p-1 transition-[background-color,box-shadow] duration-150"
            style={{
              background: snapshot.isDraggingOver
                ? "linear-gradient(180deg, rgba(249, 236, 213, 0.25) 0%, rgba(249, 236, 213, 0.06) 100%)"
                : "transparent",
              boxShadow: snapshot.isDraggingOver
                ? "inset 0 0 0 1px rgba(216, 200, 188, 0.4)"
                : "none",
            }}
          >
            {plans.map((plan, index) => (
              <Draggable
                key={plan.id}
                draggableId={plan.id}
                index={index}
                disableInteractiveElementBlocking
              >
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    style={dragProvided.draggableProps.style}
                    className="mb-3 last:mb-0 select-none"
                  >
                    <PlanCard
                      groupId={groupId}
                      plan={plan}
                      onClick={() => onPlanClick(plan)}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
}
