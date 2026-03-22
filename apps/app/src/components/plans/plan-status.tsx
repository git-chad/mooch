import type { LucideIcon } from "lucide-react";
import { CheckCheck, ClipboardList, Lightbulb, TimerReset } from "lucide-react";
import type { PlanStatus } from "@mooch/types";

export type PlanStatusConfig = {
  id: PlanStatus;
  title: string;
  shortTitle: string;
  icon: LucideIcon;
};

export const PLAN_STATUS_CONFIG: PlanStatusConfig[] = [
  {
    id: "ideas",
    title: "Ideas",
    shortTitle: "Ideas",
    icon: Lightbulb,
  },
  {
    id: "to_plan",
    title: "To Plan",
    shortTitle: "To Plan",
    icon: ClipboardList,
  },
  {
    id: "upcoming",
    title: "Upcoming",
    shortTitle: "Upcoming",
    icon: TimerReset,
  },
  {
    id: "done",
    title: "Done",
    shortTitle: "Done",
    icon: CheckCheck,
  },
];

export const PLAN_STATUS_MAP = Object.fromEntries(
  PLAN_STATUS_CONFIG.map((status) => [status.id, status]),
) as Record<PlanStatus, PlanStatusConfig>;
