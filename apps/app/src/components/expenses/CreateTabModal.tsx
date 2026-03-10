"use client";

import { useExpenseStore } from "@mooch/stores";
import type { Tab } from "@mooch/types";
import { Button, ConfirmDialog, IconPicker, Input, Modal, Text } from "@mooch/ui";
import { useEffect, useState } from "react";
import { TextMorph } from "torph/react";
import { createTab, updateTab } from "@/app/actions/tabs";
import {
  decodeGroupIcon,
  encodeGroupIcon,
} from "@/components/groups/group-icon";

const SUPPORTED_CURRENCIES = ["ARS", "USD", "EUR", "BRL", "GBP"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupCurrency?: string;
  mode?: "create" | "edit";
  tab?: Tab;
  isAdmin?: boolean;
  hasExpenses?: boolean;
  statusLoading?: boolean;
  onToggleStatus?: () => void;
  onDelete?: () => void;
};

export function CreateTabModal({
  open,
  onOpenChange,
  groupId,
  groupCurrency = "ARS",
  mode = "create",
  tab,
  isAdmin,
  hasExpenses,
  statusLoading,
  onToggleStatus,
  onDelete,
}: Props) {
  const upsertTab = useExpenseStore((s) => s.upsertTab);
  const isEdit = mode === "edit";

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Receipt");
  const [currency, setCurrency] = useState(groupCurrency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  function resetState() {
    if (isEdit && tab) {
      setName(tab.name);
      setIcon(decodeGroupIcon(tab.emoji).value);
      setCurrency(tab.currency);
    } else {
      setName("");
      setIcon("Receipt");
      setCurrency(groupCurrency);
    }
    setLoading(false);
    setError(null);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when modal opens or tab changes
  useEffect(() => {
    if (open) resetState();
  }, [open, tab, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Tab name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    if (isEdit && tab) {
      const result = await updateTab(tab.id, {
        name: name.trim(),
        emoji: encodeGroupIcon(icon),
        currency,
      });

      setLoading(false);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      upsertTab(result.tab);
      onOpenChange(false);
    } else {
      const result = await createTab(groupId, {
        name: name.trim(),
        emoji: encodeGroupIcon(icon),
        currency,
      });

      setLoading(false);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      upsertTab(result.tab);
      onOpenChange(false);
      resetState();
    }
  }

  return (
    <>
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
      title={isEdit ? "Edit tab" : "New tab"}
      description={
        isEdit
          ? "Update the tab name, icon, or currency."
          : "Create a tab to group related expenses together."
      }
      size="sm"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[auto,minmax(0,1fr)] items-end gap-3">
          <div className="space-y-2">
            <Text variant="label">Icon</Text>
            <IconPicker
              label={undefined}
              value={icon}
              onValueChange={(v) => {
                if (v) setIcon(v);
              }}
              size="md"
            />
          </div>

          <Input
            label="Tab name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            required
            placeholder="e.g. BBQ Saturday"
          />
        </div>

        {/* Currency selector */}
        <div>
          <Text variant="label" className="mb-1.5 block">
            Currency
          </Text>
          <div className="flex gap-1">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className="text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-all"
                style={
                  currency === c
                    ? {
                        background: "var(--action-gradient)",
                        border: "1px solid var(--color-accent-strong)",
                        color: "var(--color-btn-primary-fg)",
                      }
                    : {
                        background: "#F7F2ED",
                        border: "1px solid #DCCBC0",
                        color: "#8c7463",
                      }
                }
              >
                {c}
              </button>
            ))}
          </div>
          {currency !== groupCurrency && (
            <Text variant="caption" color="subtle" className="mt-1 block">
              Different from squad default ({groupCurrency}). Exchange rate can
              be applied later.
            </Text>
          )}
        </div>

        {/* Management actions (edit mode only) */}
        {isEdit && tab && (
          <div
            className="space-y-4 border-t pt-4 mt-2"
            style={{ borderColor: "#DCCBC0" }}
          >
            <Text variant="label" color="subtle">
              Manage tab
            </Text>

            <div className="flex items-center justify-between">
              <div>
                <Text variant="body">
                  {tab.status === "closed" ? "Tab is closed" : "Tab is open"}
                </Text>
                <Text variant="caption" color="subtle">
                  {tab.status === "closed"
                    ? "Reopen to allow new expenses"
                    : "Close to prevent new expenses"}
                </Text>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={statusLoading}
                onClick={() => {
                  onToggleStatus?.();
                  onOpenChange(false);
                }}
              >
                {tab.status === "closed" ? "Reopen" : "Close"}
              </Button>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="body">Delete tab</Text>
                  <Text variant="caption" color={hasExpenses ? "subtle" : "danger"}>
                    {hasExpenses
                      ? "Remove all expenses first"
                      : "This action is permanent"}
                  </Text>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={hasExpenses}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            <TextMorph>
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create tab"}
            </TextMorph>
          </Button>
        </div>
      </form>
    </Modal>
    <ConfirmDialog
      open={deleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      title="Delete tab"
      description="This will permanently delete this tab. Only empty tabs (with no expenses) can be deleted."
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={() => {
        onDelete?.();
        setDeleteConfirmOpen(false);
      }}
      onCancel={() => setDeleteConfirmOpen(false)}
    />
    </>
  );
}
