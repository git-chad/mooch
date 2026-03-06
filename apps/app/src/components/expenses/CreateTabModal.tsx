"use client";

import { useExpenseStore } from "@mooch/stores";
import { Button, IconPicker, Input, Modal, Text } from "@mooch/ui";
import { useState } from "react";
import { TextMorph } from "torph/react";
import { createTab } from "@/app/actions/tabs";
import { encodeGroupIcon } from "@/components/groups/group-icon";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
};

export function CreateTabModal({ open, onOpenChange, groupId }: Props) {
  const upsertTab = useExpenseStore((s) => s.upsertTab);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Receipt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetState() {
    setName("");
    setIcon("Receipt");
    setLoading(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Tab name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createTab(groupId, {
      name: name.trim(),
      emoji: encodeGroupIcon(icon),
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

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
      title="New tab"
      description="Create a tab to group related expenses together."
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
            <TextMorph>{loading ? "Creating..." : "Create tab"}</TextMorph>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
