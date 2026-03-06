"use client";

import { useExpenseStore } from "@mooch/stores";
import type {
  Expense,
  ExpenseCategory,
  GroupMember,
  Profile,
  SplitType,
} from "@mooch/types";
import { Avatar, Button, IconPicker, Modal, Text } from "@mooch/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { TextMorph } from "torph/react";
import {
  addExpense,
  updateExpense,
  uploadReceiptPhoto,
} from "@/app/actions/expenses";
import { CATEGORY_CONFIG, formatCurrency } from "@/lib/expenses";

type Member = GroupMember & { profile: Profile };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  tabId: string;
  members: Member[];
  currentUserId: string;
  groupCurrency: string;
  locale: string;
  mode?: "create" | "edit";
  expenseId?: string;
  initialExpense?: ExpenseEditorInitialData;
  onSaved?: () => void;
};

type Participant = {
  user_id: string;
  included: boolean;
  percentage: number;
  exact: number;
};

export type ExpenseEditorInitialData = Pick<
  Expense,
  | "amount"
  | "currency"
  | "description"
  | "notes"
  | "category"
  | "custom_category"
  | "paid_by"
  | "split_type"
  | "photo_url"
> & {
  participants: { user_id: string; share_amount: number }[];
};

type FormState = {
  amount: string;
  currency: string;
  description: string;
  notes: string;
  category: ExpenseCategory;
  customCategory: string;
  paidBy: string;
  splitType: SplitType;
  participants: Participant[];
};

const SUPPORTED_CURRENCIES = ["ARS", "USD", "EUR", "BRL", "GBP"];

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [
  ExpenseCategory,
  { emoji: string; label: string },
][];

function buildDefaultParticipants(members: Member[]): Participant[] {
  const percentage =
    members.length > 0 ? Math.round((100 / members.length) * 10) / 10 : 0;

  return members.map((member) => ({
    user_id: member.user_id,
    included: true,
    percentage,
    exact: 0,
  }));
}

function buildParticipantsFromExisting(
  members: Member[],
  splitType: SplitType,
  totalAmount: number,
  participants: { user_id: string; share_amount: number }[],
): Participant[] {
  const sharesByUser = new Map(
    participants.map((participant) => [
      participant.user_id,
      Number(participant.share_amount),
    ]),
  );

  return members.map((member) => {
    const share = sharesByUser.get(member.user_id) ?? 0;

    return {
      user_id: member.user_id,
      included: share > 0,
      percentage:
        splitType === "percentage" && totalAmount > 0
          ? Math.round((share / totalAmount) * 100 * 10) / 10
          : 0,
      exact: splitType === "exact" ? share : 0,
    };
  });
}

function buildInitialFormState({
  members,
  currentUserId,
  groupCurrency,
  mode,
  initialExpense,
}: {
  members: Member[];
  currentUserId: string;
  groupCurrency: string;
  mode: "create" | "edit";
  initialExpense?: ExpenseEditorInitialData;
}): FormState {
  if (mode === "edit" && initialExpense) {
    return {
      amount: String(initialExpense.amount),
      currency: initialExpense.currency,
      description: initialExpense.description,
      notes: initialExpense.notes ?? "",
      category: initialExpense.category,
      customCategory: initialExpense.custom_category ?? "",
      paidBy: initialExpense.paid_by,
      splitType: initialExpense.split_type,
      participants: buildParticipantsFromExisting(
        members,
        initialExpense.split_type,
        Number(initialExpense.amount),
        initialExpense.participants,
      ),
    };
  }

  return {
    amount: "",
    currency: groupCurrency,
    description: "",
    notes: "",
    category: "bar",
    customCategory: "",
    paidBy: currentUserId,
    splitType: "equal",
    participants: buildDefaultParticipants(members),
  };
}

export function AddExpenseModal({
  open,
  onOpenChange,
  groupId,
  tabId,
  members,
  currentUserId,
  groupCurrency,
  locale,
  mode = "create",
  expenseId,
  initialExpense,
  onSaved,
}: Props) {
  const isEditMode = mode === "edit";
  const upsertExpense = useExpenseStore((s) => s.upsertExpense);
  const initialFormState = buildInitialFormState({
    members,
    currentUserId,
    groupCurrency,
    mode,
    initialExpense,
  });

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [amount, setAmount] = useState(initialFormState.amount);
  const [currency, setCurrency] = useState(initialFormState.currency);
  const [description, setDescription] = useState(initialFormState.description);
  const [notes, setNotes] = useState(initialFormState.notes);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Step 2
  const [category, setCategory] = useState<ExpenseCategory>(
    initialFormState.category,
  );
  const [customCategory, setCustomCategory] = useState<string>(
    initialFormState.customCategory,
  );

  // Step 3
  const [paidBy, setPaidBy] = useState(initialFormState.paidBy);
  const [splitType, setSplitType] = useState<SplitType>(
    initialFormState.splitType,
  );
  const [participants, setParticipants] = useState<Participant[]>(
    initialFormState.participants,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const receiptInputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    const next = buildInitialFormState({
      members,
      currentUserId,
      groupCurrency,
      mode,
      initialExpense,
    });

    setStep(1);
    setDirection(1);
    setAmount(next.amount);
    setCurrency(next.currency);
    setDescription(next.description);
    setNotes(next.notes);
    setReceiptFile(null);
    setCategory(next.category);
    setCustomCategory(next.customCategory);
    setPaidBy(next.paidBy);
    setSplitType(next.splitType);
    setParticipants(next.participants);
    setLoading(false);
    setError(null);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: resetting from incoming props is intentional here
  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, mode, initialExpense, members, currentUserId, groupCurrency]);

  function goNext() {
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function canProceedStep1() {
    const n = Number.parseFloat(amount);
    return !Number.isNaN(n) && n > 0 && description.trim().length > 0;
  }

  function buildParticipants() {
    const total = Number.parseFloat(amount);
    if (splitType === "equal") {
      const included = participants.filter((p) => p.included);
      if (included.length === 0) return null;
      const share = Math.round((total / included.length) * 100) / 100;
      return included.map((p, i) => ({
        user_id: p.user_id,
        share_amount:
          i === included.length - 1
            ? Math.round((total - share * (included.length - 1)) * 100) / 100
            : share,
      }));
    }
    if (splitType === "percentage") {
      const sum = participants.reduce((s, p) => s + (p.percentage || 0), 0);
      if (Math.abs(sum - 100) > 0.1) return null;
      return participants
        .filter((p) => p.percentage > 0)
        .map((p) => ({
          user_id: p.user_id,
          share_amount: Math.round(((total * p.percentage) / 100) * 100) / 100,
        }));
    }
    // exact
    const sum = participants.reduce((s, p) => s + (p.exact || 0), 0);
    if (Math.abs(sum - total) > 0.01) return null;
    return participants
      .filter((p) => p.exact > 0)
      .map((p) => ({ user_id: p.user_id, share_amount: p.exact }));
  }

  function getStep3Error() {
    const total = Number.parseFloat(amount);
    if (splitType === "equal") {
      if (!participants.some((p) => p.included))
        return "Select at least one person.";
    }
    if (splitType === "percentage") {
      const sum = participants.reduce((s, p) => s + (p.percentage || 0), 0);
      if (Math.abs(sum - 100) > 0.1)
        return `Percentages sum to ${sum.toFixed(1)}% — must be 100%.`;
    }
    if (splitType === "exact") {
      const sum = participants.reduce((s, p) => s + (p.exact || 0), 0);
      if (Math.abs(sum - total) > 0.01)
        return `Amounts sum to ${formatCurrency(sum, currency, locale)} — must equal ${formatCurrency(total, currency, locale)}.`;
    }
    return null;
  }

  async function handleSubmit() {
    if (isEditMode && !expenseId) {
      setError("Expense id is required.");
      return;
    }

    const builtParticipants = buildParticipants();
    if (!builtParticipants) {
      setError(getStep3Error() ?? "Invalid split.");
      return;
    }
    setLoading(true);
    setError(null);

    // Upload receipt if present
    let photoUrl: string | undefined;
    if (receiptFile) {
      const fd = new FormData();
      fd.set("receipt", receiptFile);
      const uploadResult = await uploadReceiptPhoto(fd);
      if ("error" in uploadResult) {
        setError(uploadResult.error);
        setLoading(false);
        return;
      }
      photoUrl = uploadResult.path;
    }

    if (isEditMode) {
      const currentExpenseId = expenseId;
      if (!currentExpenseId) {
        setLoading(false);
        setError("Expense id is required.");
        return;
      }

      const result = await updateExpense(currentExpenseId, {
        description: description.trim(),
        notes: notes.trim() ? notes.trim() : null,
        amount: Number.parseFloat(amount),
        currency,
        category,
        custom_category:
          category === "other" && customCategory ? customCategory : null,
        paid_by: paidBy,
        split_type: splitType,
        participants: builtParticipants,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      });

      setLoading(false);

      if (result && "error" in result) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      resetState();
      onSaved?.();
      return;
    }

    const result = await addExpense(groupId, tabId, {
      description: description.trim(),
      notes: notes.trim() || undefined,
      amount: Number.parseFloat(amount),
      currency,
      category,
      custom_category:
        category === "other" && customCategory ? customCategory : undefined,
      paid_by: paidBy,
      split_type: splitType,
      photo_url: photoUrl,
      participants: builtParticipants,
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    upsertExpense(result.expense);
    onOpenChange(false);
    resetState();
    onSaved?.();
  }

  const stepTitles = ["Amount", "Category", "Split"];

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
      title={isEditMode ? "Edit expense" : "Add expense"}
      description={`Step ${step} of 3 — ${stepTitles[step - 1]}`}
      size="md"
    >
      {/* Step progress bar */}
      <div className="flex items-center gap-1.5 mb-5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{
              background: s <= step ? "var(--action-gradient)" : "#E8E0D8",
            }}
          />
        ))}
      </div>

      {/* Animated step content */}
      <div className="overflow-hidden" style={{ minHeight: 240 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ x: direction * 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -24, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            {step === 1 && (
              <Step1
                amount={amount}
                setAmount={setAmount}
                currency={currency}
                setCurrency={setCurrency}
                description={description}
                setDescription={setDescription}
                notes={notes}
                setNotes={setNotes}
                receiptFile={receiptFile}
                setReceiptFile={setReceiptFile}
                receiptInputRef={receiptInputRef}
                existingReceipt={Boolean(initialExpense?.photo_url)}
                groupCurrency={groupCurrency}
                isEditMode={isEditMode}
              />
            )}
            {step === 2 && (
              <Step2
                category={category}
                setCategory={setCategory}
                customCategory={customCategory}
                setCustomCategory={setCustomCategory}
              />
            )}
            {step === 3 && (
              <Step3
                amount={Number.parseFloat(amount) || 0}
                members={members}
                currentUserId={currentUserId}
                paidBy={paidBy}
                setPaidBy={setPaidBy}
                splitType={splitType}
                setSplitType={setSplitType}
                participants={participants}
                setParticipants={setParticipants}
                currency={currency}
                locale={locale}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {error && (
        <Text variant="caption" color="danger" className="mt-3 block">
          {error}
        </Text>
      )}

      {/* Footer navigation */}
      <div className="flex justify-between items-center mt-5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={step === 1 ? () => onOpenChange(false) : goBack}
        >
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={step === 1 && !canProceedStep1()}
            onClick={goNext}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={loading}
            onClick={handleSubmit}
          >
            <TextMorph>
              {loading
                ? isEditMode
                  ? "Saving..."
                  : "Adding..."
                : isEditMode
                  ? "Save changes"
                  : "Add expense"}
            </TextMorph>
          </Button>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Amount + Currency + Description + Notes + Receipt
// ─────────────────────────────────────────────────────────────────────────────

function Step1({
  amount,
  setAmount,
  currency,
  setCurrency,
  description,
  setDescription,
  notes,
  setNotes,
  receiptFile,
  setReceiptFile,
  receiptInputRef,
  existingReceipt,
  groupCurrency,
  isEditMode,
}: {
  amount: string;
  setAmount: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  receiptFile: File | null;
  setReceiptFile: (f: File | null) => void;
  receiptInputRef: React.RefObject<HTMLInputElement | null>;
  existingReceipt: boolean;
  groupCurrency: string;
  isEditMode: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Amount row: large input + currency pill */}
      <div>
        <Text variant="overline" color="subtle" className="mb-1.5 block">
          Amount
        </Text>
        <div className="flex items-end gap-3">
          <input
            id="expense-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex text-[36px] w-full flex-1 font-normal text-ink bg-transparent outline-none border-b-2 border-edge pb-2 placeholder:text-ink-placeholder focus:border-accent-strong transition-colors"
            style={{ fontFamily: "var(--font-display)" }}
          />
          {/* Currency selector — inline pills */}
          <div className="flex flex-1 gap-1 pb-2 flex-col max-w-fit">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className="text-[11px] font-medium px-2 py-1 rounded-full transition-all"
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
        </div>
        {currency !== groupCurrency && (
          <Text variant="caption" color="subtle" className="mt-1 block">
            Exchange rate can be applied after saving.
          </Text>
        )}
      </div>

      <div>
        <Text variant="overline" color="subtle" className="mb-1.5 block">
          What was it for?
        </Text>
        <input
          id="expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner at La Parrilla"
          className="w-full text-[15px] text-ink bg-transparent outline-none border border-edge rounded-xl px-3 py-2.5 placeholder:text-ink-placeholder focus:border-accent-strong transition-colors"
          style={{ background: "#FDFCFB" }}
        />
      </div>

      <div>
        <Text variant="overline" color="subtle" className="mb-1.5 block">
          Notes (optional)
        </Text>
        <textarea
          id="expense-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any extra details..."
          rows={2}
          className="w-full text-[14px] text-ink bg-transparent outline-none border border-edge rounded-xl px-3 py-2.5 placeholder:text-ink-placeholder focus:border-accent-strong transition-colors resize-none"
          style={{ background: "#FDFCFB" }}
        />
      </div>

      {/* Receipt photo */}
      <div>
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic"
          className="sr-only"
          onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          aria-label="Attach receipt photo"
        />
        {receiptFile ? (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-ink-sub"
              style={{ background: "#F1F9E8", border: "1px solid #C7DEB0" }}
            >
              <span>📎</span>
              <span className="truncate">{receiptFile.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setReceiptFile(null)}
              className="text-[12px] text-ink-sub hover:text-ink px-2 py-1"
            >
              Remove
            </button>
          </div>
        ) : existingReceipt ? (
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-ink-sub"
              style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
            >
              <span>📎</span>
              <span className="truncate">
                {isEditMode ? "Current receipt attached" : "Receipt attached"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => receiptInputRef.current?.click()}
              className="text-[12px] text-ink-sub hover:text-ink px-2 py-1"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => receiptInputRef.current?.click()}
            className="text-[13px] font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            style={{
              background: "#F7F2ED",
              border: "1px solid #DCCBC0",
              color: "#8c7463",
            }}
          >
            <span>📎</span>
            Attach receipt (optional)
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Category + Custom icon for "other"
// ─────────────────────────────────────────────────────────────────────────────

function Step2({
  category,
  setCategory,
  customCategory,
  setCustomCategory,
}: {
  category: ExpenseCategory;
  setCategory: (c: ExpenseCategory) => void;
  customCategory: string;
  setCustomCategory: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Text variant="overline" color="subtle" className="block">
        Category
      </Text>
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map(([key, config]) => {
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
              style={
                active
                  ? {
                      background: "var(--color-accent-bg)",
                      border: "1.5px solid var(--color-accent-edge)",
                      boxShadow: "0 1px 3px rgba(90,150,40,0.15)",
                    }
                  : {
                      background: "#F7F2ED",
                      border: "1px solid #DCCBC0",
                    }
              }
            >
              <span className="text-[24px] leading-none">{config.emoji}</span>
              <Text
                variant="caption"
                color={active ? "accent" : "subtle"}
                className="font-medium"
              >
                {config.label}
              </Text>
            </button>
          );
        })}
      </div>

      {/* Icon picker for custom category */}
      {category === "other" && (
        <div className="space-y-1.5">
          <Text variant="overline" color="subtle" className="block">
            Custom icon
          </Text>
          <IconPicker
            label={undefined}
            value={customCategory || "Package"}
            onValueChange={(v) => setCustomCategory(v ?? "")}
            size="md"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Paid by + Split type + Participant inputs
// ─────────────────────────────────────────────────────────────────────────────

const SPLIT_TYPES: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "percentage", label: "%" },
  { value: "exact", label: "Exact" },
];

function Step3({
  amount,
  members,
  currentUserId,
  paidBy,
  setPaidBy,
  splitType,
  setSplitType,
  participants,
  setParticipants,
  currency,
  locale,
}: {
  amount: number;
  members: Member[];
  currentUserId: string;
  paidBy: string;
  setPaidBy: (id: string) => void;
  splitType: SplitType;
  setSplitType: (s: SplitType) => void;
  participants: Participant[];
  setParticipants: (p: Participant[]) => void;
  currency: string;
  locale: string;
}) {
  function updateParticipant(userId: string, patch: Partial<Participant>) {
    setParticipants(
      participants.map((p) => (p.user_id === userId ? { ...p, ...patch } : p)),
    );
  }

  const includedCount = participants.filter((p) => p.included).length;
  const equalShare =
    includedCount > 0 ? Math.round((amount / includedCount) * 100) / 100 : 0;

  return (
    <div className="space-y-4">
      {/* Paid by */}
      <div>
        <Text variant="overline" color="subtle" className="mb-2 block">
          Paid by
        </Text>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const active = paidBy === m.user_id;
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setPaidBy(m.user_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                style={
                  active
                    ? {
                        background: "var(--action-gradient)",
                        border: "1px solid var(--color-accent-strong)",
                        color: "var(--color-btn-primary-fg)",
                        boxShadow: "var(--shadow-btn-primary)",
                      }
                    : {
                        background: "#F7F2ED",
                        border: "1px solid #DCCBC0",
                        color: "#4a3728",
                      }
                }
              >
                <Avatar
                  src={m.profile.photo_url ?? undefined}
                  name={m.profile.display_name}
                  size="sm"
                />
                {m.user_id === currentUserId ? "You" : m.profile.display_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Split type */}
      <div>
        <Text variant="overline" color="subtle" className="mb-2 block">
          Split
        </Text>
        <div
          className="inline-flex rounded-full p-1 gap-1"
          style={{ background: "#F7F2ED", border: "1px solid #DCCBC0" }}
        >
          {SPLIT_TYPES.map((s) => {
            const active = splitType === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSplitType(s.value)}
                className="px-3 py-1.5 rounded-full text-[12px] leading-4 font-medium transition-all"
                style={
                  active
                    ? {
                        background: "var(--action-gradient)",
                        border: "1px solid var(--color-accent-strong)",
                        boxShadow:
                          "#E2FBC2C7 0px 1px 0px inset, #527F2B 0px 2px 0px",
                        color: "var(--color-btn-primary-fg)",
                      }
                    : {
                        border: "1px solid transparent",
                        color: "#5B6F87",
                      }
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Participant rows */}
      <div className="space-y-2">
        {members.map((m) => {
          const p = participants.find((x) => x.user_id === m.user_id);
          if (!p) return null;

          return (
            <div key={m.user_id} className="flex items-center gap-3">
              <Avatar
                src={m.profile.photo_url ?? undefined}
                name={m.profile.display_name}
                size="sm"
              />
              <Text
                variant="caption"
                color="default"
                className="flex-1 truncate"
              >
                {m.user_id === currentUserId ? "You" : m.profile.display_name}
              </Text>

              {splitType === "equal" && (
                <>
                  <Text variant="caption" color="subtle">
                    {p.included
                      ? formatCurrency(equalShare, currency, locale)
                      : "—"}
                  </Text>
                  <button
                    type="button"
                    onClick={() =>
                      updateParticipant(m.user_id, { included: !p.included })
                    }
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                    style={
                      p.included
                        ? {
                            background: "var(--color-accent)",
                            border: "1px solid var(--color-accent-strong)",
                          }
                        : { background: "#F7F2ED", border: "1px solid #DCCBC0" }
                    }
                    aria-label={
                      p.included ? "Remove from split" : "Add to split"
                    }
                  >
                    {p.included && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="#fff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </>
              )}

              {splitType === "percentage" && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={p.percentage || ""}
                    onChange={(e) =>
                      updateParticipant(m.user_id, {
                        percentage: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-16 text-[13px] text-ink text-right border border-edge rounded-lg px-2 py-1 outline-none focus:border-accent-strong"
                    style={{ background: "#FDFCFB" }}
                  />
                  <Text variant="caption" color="subtle">
                    %
                  </Text>
                </div>
              )}

              {splitType === "exact" && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={p.exact || ""}
                  onChange={(e) =>
                    updateParticipant(m.user_id, {
                      exact: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 text-[13px] text-ink text-right border border-edge rounded-lg px-2 py-1 outline-none focus:border-accent-strong"
                  style={{ background: "#FDFCFB" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Running total for percentage/exact */}
      {splitType !== "equal" && (
        <div className="text-right">
          {splitType === "percentage" &&
            (() => {
              const sum = participants.reduce(
                (s, p) => s + (p.percentage || 0),
                0,
              );
              const ok = Math.abs(sum - 100) < 0.1;
              return (
                <Text variant="caption" color="subtle">
                  Total:{" "}
                  <span
                    style={{
                      color: ok ? "#2d5a10" : "#b24a3a",
                      fontWeight: 600,
                    }}
                  >
                    {sum.toFixed(1)}%
                  </span>
                </Text>
              );
            })()}
          {splitType === "exact" &&
            (() => {
              const sum = participants.reduce((s, p) => s + (p.exact || 0), 0);
              const ok = Math.abs(sum - amount) < 0.01;
              return (
                <Text variant="caption" color="subtle">
                  Total:{" "}
                  <span
                    style={{
                      color: ok ? "#2d5a10" : "#b24a3a",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(sum, currency, locale)}
                  </span>
                  {" of "}
                  {formatCurrency(amount, currency, locale)}
                </Text>
              );
            })()}
        </div>
      )}
    </div>
  );
}
