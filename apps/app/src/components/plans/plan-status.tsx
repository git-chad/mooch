import type { LucideIcon } from "lucide-react";
import { CheckCheck, ClipboardList, Lightbulb, TimerReset } from "lucide-react";
import type { PlanStatus } from "@mooch/types";

export type PlanStatusConfig = {
  id: PlanStatus;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
  /** Hex accent color for subtle column tinting */
  color: string;
  /** Placeholder text when column is empty */
  emptyLabel: string;
};

export const PLAN_STATUS_CONFIG: PlanStatusConfig[] = [
  {
    id: "ideas",
    title: "Ideas",
    shortTitle: "Ideas",
    icon: Lightbulb,
    color: "#D4A853",
    emptyLabel: "No ideas yet",
  },
  {
    id: "to_plan",
    title: "To Plan",
    shortTitle: "To Plan",
    icon: ClipboardList,
    color: "#8B7355",
    emptyLabel: "Nothing to plan",
  },
  {
    id: "upcoming",
    title: "Upcoming",
    shortTitle: "Upcoming",
    icon: TimerReset,
    color: "#5B8C5A",
    emptyLabel: "All clear",
  },
  {
    id: "done",
    title: "Completed",
    shortTitle: "Completed",
    icon: CheckCheck,
    color: "#9A8F85",
    emptyLabel: "No plans done",
  },
];

export const PLAN_STATUS_MAP = Object.fromEntries(
  PLAN_STATUS_CONFIG.map((status) => [status.id, status]),
) as Record<PlanStatus, PlanStatusConfig>;
