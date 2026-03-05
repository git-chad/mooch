"use client";

import { useState } from "react";
import { Modal, ConfirmDialog, Button } from "@mooch/ui";

export function ModalDemo() {
  const [smOpen, setSmOpen] = useState(false);
  const [mdOpen, setMdOpen] = useState(false);
  const [lgOpen, setLgOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [destructiveOpen, setDestructiveOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" onClick={() => setSmOpen(true)}>
        Small
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setMdOpen(true)}>
        Medium
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setLgOpen(true)}>
        Large
      </Button>

      <Modal
        open={smOpen}
        onOpenChange={setSmOpen}
        title="Confirm action"
        description="This is a small modal — good for confirmations."
        size="sm"
      >
        <p className="text-sm text-[#556B82]">
          Are you sure you want to leave this group? This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setSmOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => setSmOpen(false)}>
            Confirm
          </Button>
        </div>
      </Modal>

      <Modal
        open={mdOpen}
        onOpenChange={setMdOpen}
        title="Create a squad"
        description="Set up your group name and preferences."
        size="md"
      >
        <div className="space-y-3">
          <div className="h-9 rounded-lg bg-[#F0EAE3] animate-pulse" />
          <div className="h-9 rounded-lg bg-[#F0EAE3] animate-pulse" />
          <div className="h-9 rounded-lg bg-[#F0EAE3] animate-pulse w-2/3" />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMdOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => setMdOpen(false)}>
            Create
          </Button>
        </div>
      </Modal>

      <Modal
        open={lgOpen}
        onOpenChange={setLgOpen}
        title="Add an expense"
        size="lg"
      >
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: preview
            <div key={i} className="h-9 rounded-lg bg-[#F0EAE3] animate-pulse" style={{ width: `${70 + i * 5}%` }} />
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setLgOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => setLgOpen(false)}>
            Save
          </Button>
        </div>
      </Modal>

      {/* ── ConfirmDialog ── */}
      <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
        Confirm (default)
      </Button>
      <Button variant="danger" size="sm" onClick={() => setDestructiveOpen(true)}>
        Confirm (destructive)
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Leave this squad?"
        description="You'll lose access to all shared expenses, polls, and plans. You can rejoin with an invite code."
        confirmLabel="Leave squad"
        cancelLabel="Stay"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={destructiveOpen}
        onOpenChange={setDestructiveOpen}
        title="Delete this group?"
        description="This will permanently delete the group, all expenses, polls, plans, and media. There's no going back."
        confirmLabel="Delete forever"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => setDestructiveOpen(false)}
        onCancel={() => setDestructiveOpen(false)}
      />
    </div>
  );
}
