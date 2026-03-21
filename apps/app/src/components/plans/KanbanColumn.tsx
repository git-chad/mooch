"use client";

import type { PlanStatus } from "@mooch/types";
import type { PlanWithDetails } from "@mooch/stores";
import { Text } from "@mooch/ui";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { PlanCard } from "./PlanCard";

type Props = {
    status: PlanStatus;
    emoji: string;
    title: string;
    plans: PlanWithDetails[];
    onAddClick: () => void;
    onPlanClick: (plan: PlanWithDetails) => void;
};

export function KanbanColumn({
    status,
    emoji,
    title,
    plans,
    onAddClick,
    onPlanClick,
}: Props) {
    return (
        <div className="flex flex-col min-w-[260px] w-[260px] md:w-auto md:flex-1 snap-center shrink-0">
            {/* Column header */}
            <div className="flex items-center justify-between gap-2 mb-3 px-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-base">{emoji}</span>
                    <Text variant="label" className="uppercase tracking-wide text-xs">
                        {title}
                    </Text>
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-stone-200/60 text-xs font-medium text-stone-500">
                        {plans.length}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onAddClick}
                    className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-stone-200/50 transition-colors text-stone-400 hover:text-stone-600"
                    aria-label={`Add plan to ${title}`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Droppable area */}
            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
              flex-1 rounded-xl p-2 space-y-2 min-h-[120px] overflow-y-auto transition-colors duration-150
              ${snapshot.isDraggingOver
                                ? "bg-amber-50/60 ring-2 ring-amber-200/60 ring-inset"
                                : "bg-stone-100/40"
                            }
            `}
                    >
                        {plans.map((plan, index) => (
                            <Draggable key={plan.id} draggableId={plan.id} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                    <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        style={dragProvided.draggableProps.style}
                                        className={`transition-shadow duration-150 ${dragSnapshot.isDragging
                                                ? "shadow-lg shadow-stone-300/50 scale-[1.02] rotate-[1deg]"
                                                : ""
                                            }`}
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

                        {/* Empty column hint */}
                        {plans.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                                <Text variant="caption" color="subtle">
                                    Drop plans here
                                </Text>
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
