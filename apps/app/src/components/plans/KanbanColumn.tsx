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

/** Convert "#RRGGBB" to an rgba() string at the given alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  const color = config.color;

  return (
    <section className="flex min-h-[460px] flex-col gap-4">
      <div
        className="flex items-center justify-between gap-3 pb-3"
        style={{ borderBottom: `1px solid ${hexToRgba(color, 0.2)}` }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="rounded-[10px] border p-1.5"
            style={{
              color,
              background: `linear-gradient(165deg, ${hexToRgba(color, 0.08)} 0%, ${hexToRgba(color, 0.15)} 100%)`,
              borderColor: hexToRgba(color, 0.2),
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.62), inset 0 -1px 2px rgba(0,0,0,0.04), 0 1px 0 ${hexToRgba(color, 0.12)}`,
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
          {plans.length > 0 && (
            <Text variant="caption" color="muted">
              {plans.length}
            </Text>
          )}
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
                ? `linear-gradient(180deg, ${hexToRgba(color, 0.12)} 0%, ${hexToRgba(color, 0.03)} 100%)`
                : "transparent",
              boxShadow: snapshot.isDraggingOver
                ? `inset 0 0 0 1px ${hexToRgba(color, 0.22)}`
                : "none",
            }}
          >
            {plans.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center py-12">
                <Text variant="caption" color="muted">
                  {config.emptyLabel}
                </Text>
              </div>
            )}

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
