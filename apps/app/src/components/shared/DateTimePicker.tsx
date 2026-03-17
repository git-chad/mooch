"use client";

import { Popover } from "@base-ui-components/react";
import { Text } from "@mooch/ui";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";
import { DayPicker } from "react-day-picker";
import { motionDuration, motionEase } from "@/lib/motion";

type Props = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
};

export function DateTimePicker({
  label,
  value,
  onChange,
  placeholder = "Pick a date & time",
  minDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(value ? format(value, "HH") : "18");
  const [minutes, setMinutes] = useState(value ? format(value, "mm") : "00");
  const [month, setMonth] = useState(value ?? new Date());
  const [direction, setDirection] = useState<1 | -1>(1);
  const reducedMotion = useReducedMotion() ?? false;

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const h = Number.parseInt(hours, 10) || 0;
    const m = Number.parseInt(minutes, 10) || 0;
    const combined = new Date(day);
    combined.setHours(h, m, 0, 0);
    onChange(combined);
  }

  function handleTimeChange(newHours: string, newMinutes: string) {
    setHours(newHours);
    setMinutes(newMinutes);
    if (value) {
      const updated = new Date(value);
      updated.setHours(
        Number.parseInt(newHours, 10) || 0,
        Number.parseInt(newMinutes, 10) || 0,
        0,
        0,
      );
      onChange(updated);
    }
  }

  function handleClear() {
    onChange(null);
    setOpen(false);
  }

  const handleMonthChange = useCallback(
    (newMonth: Date) => {
      setDirection(newMonth > month ? 1 : -1);
      setMonth(newMonth);
    },
    [month],
  );

  // Month key for AnimatePresence
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Text as="label" variant="label" className="select-none">
          {label}
        </Text>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-1.5">
          <Popover.Trigger
            render={
              <button
                type="button"
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer hover:bg-[#F7F4F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-edge)",
                  color: value ? "var(--color-ink)" : "#A09488",
                }}
                aria-label={
                  value
                    ? `Selected date: ${format(value, "MMM d, yyyy h:mm a")}`
                    : placeholder
                }
              />
            }
          >
            <Calendar className="w-4 h-4 shrink-0 opacity-50" />
            <span className="flex-1 truncate">
              {value ? format(value, "MMM d, yyyy · h:mm a") : placeholder}
            </span>
          </Popover.Trigger>

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-[#F7F2ED]"
              style={{ color: "#8c7463" }}
              aria-label="Clear date and time"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Popover.Portal>
          <Popover.Positioner sideOffset={8} align="start" className="z-[100]">
            <Popover.Popup
              className="rounded-xl shadow-xl outline-none overflow-hidden"
              style={{
                background: "#fdfcfb",
                border: "1px solid var(--color-edge)",
              }}
            >
              {/* Calendar header — custom nav */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(month);
                    prev.setMonth(prev.getMonth() - 1);
                    handleMonthChange(prev);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7F2ED] transition-colors text-[#8c7463]"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={monthKey}
                    className="text-sm font-semibold text-[#3D2E22]"
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, x: direction * 20 }
                    }
                    animate={{ opacity: 1, x: 0 }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, x: direction * -20 }
                    }
                    transition={{
                      duration: motionDuration.fast,
                      ease: motionEase.out,
                    }}
                  >
                    {format(month, "MMMM yyyy")}
                  </motion.span>
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(month);
                    next.setMonth(next.getMonth() + 1);
                    handleMonthChange(next);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F7F2ED] transition-colors text-[#8c7463]"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar grid */}
              <div className="px-3 pb-3">
                <DayPicker
                  mode="single"
                  month={month}
                  onMonthChange={handleMonthChange}
                  selected={value ?? undefined}
                  onSelect={handleDaySelect}
                  disabled={minDate ? { before: minDate } : undefined}
                  fixedWeeks
                  showOutsideDays
                  hideNavigation
                  classNames={{
                    root: "rdp-mooch",
                    months: "flex flex-col",
                    month: "",
                    month_caption: "hidden",
                    nav: "hidden",
                    weekdays: "grid grid-cols-7 mb-1",
                    weekday:
                      "text-[10px] font-medium text-[#A09488] text-center uppercase tracking-wider h-8 flex items-center justify-center",
                    weeks: "",
                    week: "grid grid-cols-7",
                    day: "text-center p-0",
                    day_button:
                      "w-9 h-9 rounded-lg text-[13px] font-medium transition-colors hover:bg-[#F7F2ED] text-[#3D2E22] flex items-center justify-center mx-auto",
                    selected:
                      "!bg-[var(--color-accent)] !text-white rounded-lg",
                    today: "font-bold text-[var(--color-accent)]",
                    outside: "text-[#C4B8AE]",
                    disabled: "opacity-20 pointer-events-none",
                  }}
                />
              </div>

              {/* Time picker */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderTop: "1px solid var(--color-edge)" }}
              >
                <Clock className="w-4 h-4 text-[#8c7463] shrink-0" />
                <Text variant="label" color="subtle" className="shrink-0">
                  Time
                </Text>
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => handleTimeChange(e.target.value, minutes)}
                    className="w-10 text-center text-sm font-medium rounded-md py-1 tabular-nums outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    inputMode="numeric"
                    aria-label="Hours"
                    style={{
                      background: "#F7F2ED",
                      border: "1px solid #DCCBC0",
                      color: "#3D2E22",
                    }}
                  />
                  <span className="text-sm font-bold text-[#8c7463]">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={minutes}
                    onChange={(e) => handleTimeChange(hours, e.target.value)}
                    className="w-10 text-center text-sm font-medium rounded-md py-1 tabular-nums outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    inputMode="numeric"
                    aria-label="Minutes"
                    style={{
                      background: "#F7F2ED",
                      border: "1px solid #DCCBC0",
                      color: "#3D2E22",
                    }}
                  />
                </div>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
