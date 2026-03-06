"use client";

import { useGroupStore } from "@mooch/stores";
import { cn, Sheet } from "@mooch/ui";
import {
  BarChart2,
  Calendar,
  Camera,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Receipt,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { TransitionLink } from "@/components/TransitionLink";
import { getLayoutTransition } from "@/lib/motion";

type TabItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
};

const PRIMARY_TABS: TabItem[] = [
  { label: "Overview", icon: Home, path: "" },
  { label: "Feed", icon: Camera, path: "/feed" },
  { label: "Expenses", icon: Receipt, path: "/expenses" },
  { label: "Plans", icon: LayoutGrid, path: "/plans" },
];

const MORE_TABS: TabItem[] = [
  { label: "Polls", icon: BarChart2, path: "/polls" },
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "Insights", icon: Sparkles, path: "/insights" },
];

type BottomTabBarProps = {
  className?: string;
};

export function BottomTabBar({ className }: BottomTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeGroupId = useGroupStore((state) => state.activeGroupId);
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;
  const isMoreRouteActive = activeGroupId
    ? MORE_TABS.some(({ path }) =>
        pathname.startsWith(`/${activeGroupId}${path}`),
      )
    : false;

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-[#EDE3DA] bg-[#FDFCFB]/95 backdrop-blur-sm",
          className,
        )}
      >
        <div className="flex items-stretch justify-around px-1 pb-4 pt-1">
          {PRIMARY_TABS.map(({ label, icon: Icon, path }) => {
            const href = activeGroupId ? `/${activeGroupId}${path}` : null;
            const isActive = href
              ? path === ""
                ? pathname === href
                : pathname.startsWith(href)
              : false;

            if (!href) {
              return (
                <span
                  key={label}
                  className="flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[#C8BAB0] pointer-events-none select-none"
                >
                  <Icon size={22} />
                  <span className="text-[9px] font-medium font-sans">
                    {label}
                  </span>
                </span>
              );
            }

            return (
              <div key={label} className="relative flex flex-1">
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-x-1 inset-y-0 rounded-[18px] bg-[#EFF8E3]"
                    style={{
                      border: "1px solid #C7DEB0",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.75), 0 2px 6px rgba(90,150,41,0.12)",
                    }}
                    transition={getLayoutTransition(reducedMotion)}
                  />
                )}
                <TransitionLink
                  href={href}
                  className={cn(
                    "relative z-10 flex flex-1 flex-col items-center gap-0.5 px-1 py-2 transition-colors",
                    isActive ? "text-[#5A9629]" : "text-[#8C7463]",
                  )}
                >
                  <Icon size={22} />
                  <span className="text-[9px] font-medium font-sans">
                    {label}
                  </span>
                </TransitionLink>
              </div>
            );
          })}

          <div className="relative flex flex-1">
            {(moreOpen || isMoreRouteActive) && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-x-1 inset-y-0 rounded-[18px] bg-[#EFF8E3]"
                style={{
                  border: "1px solid #C7DEB0",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.75), 0 2px 6px rgba(90,150,41,0.12)",
                }}
                transition={getLayoutTransition(reducedMotion)}
              />
            )}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "relative z-10 flex flex-1 flex-col items-center gap-0.5 px-1 py-2 transition-colors",
                moreOpen || isMoreRouteActive
                  ? "text-[#5A9629]"
                  : "text-[#8C7463]",
              )}
            >
              <MoreHorizontal size={22} />
              <span className="text-[9px] font-medium font-sans">More</span>
            </button>
          </div>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="More">
        <div className="space-y-1">
          {MORE_TABS.map(({ label, icon: Icon, path }) => {
            const href = activeGroupId ? `/${activeGroupId}${path}` : null;
            const isActive = href ? pathname.startsWith(href) : false;

            if (!href) {
              return (
                <span
                  key={label}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-[#C8BAB0] pointer-events-none select-none"
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium font-sans">{label}</span>
                </span>
              );
            }

            return (
              <TransitionLink
                key={label}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
                  isActive
                    ? "bg-[#F1F9E8] text-[#2D5A0E]"
                    : "text-[#4A3728] hover:bg-[#F8F4EF]",
                )}
              >
                <Icon size={20} />
                <span className="text-sm font-medium font-sans">{label}</span>
              </TransitionLink>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
