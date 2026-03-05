import { Button, Container, Avatar } from "@mooch/ui";
import {
  ButtonTextMorphDemo,
  StatusTextMorphDemo,
  BalanceTextMorphDemo,
} from "./TextMorphDemo";
import { ModalDemo } from "./ModalDemo";
import { SheetDemo } from "./SheetDemo";
import { BadgeDemo } from "./BadgeDemo";
import { QRDemo } from "./QRDemo";
import { SelectDemo } from "./SelectDemo";

// Design system preview — dev only
// All components are showcased here as they're built

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#F5F3F0] py-16 font-[family-name:var(--font-geist-sans)]">

      {/* Page header */}
      <div className="px-8 mb-16">
        <p className="text-xs font-mono text-[#8C7463] uppercase tracking-widest mb-2">
          mooch / design system
        </p>
        <h1 className="geist-pixel text-4xl text-[#1F2A23]">Components</h1>
        <p className="mt-2 text-sm text-[#556B82]">
          Live preview of every component as it's built.
        </p>
      </div>

      {/* ── Buttons ─────────────────────────────────────────────────────── */}
      <Divider label="Primitives · Button" />

      <section className="mb-12 px-8 space-y-8">

        {/* Variants */}
        <div>
          <SectionLabel name="Button" variant="variants" note="primary · secondary · ghost" />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button variant="primary">Create Squad</Button>
            <Button variant="secondary">Finances</Button>
            <Button variant="ghost">Learn more</Button>
          </div>
        </div>

        {/* Sizes */}
        <div>
          <SectionLabel name="Button" variant="sizes" note="sm · md · lg" />
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <Button variant="secondary" size="sm">Small</Button>
            <Button variant="secondary" size="md">Medium</Button>
            <Button variant="secondary" size="lg">Large</Button>
          </div>
        </div>

        {/* Disabled */}
        <div>
          <SectionLabel name="Button" variant="disabled" note="all variants · disabled state" />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button variant="primary" disabled>Create Squad</Button>
            <Button variant="secondary" disabled>Finances</Button>
            <Button variant="ghost" disabled>Learn more</Button>
          </div>
        </div>

        {/* Press hint */}
        <p className="text-xs font-mono text-[#8C7463]">
          ↑ click and hold to see press states
        </p>
      </section>

      {/* ── Container ───────────────────────────────────────────────────── */}
      <Divider label="Layout · Container" />

      <section className="mb-12 px-8">
        <SectionLabel
          name="Container"
          variant="site"
          note="max-w-[1280px] · mx-auto · 12 cols · gap-2 · px-8"
        />
        <div className="mt-4 rounded-xl border border-[#D8C8BC] overflow-hidden">
          <Container variant="site" className="py-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: preview grid
                key={i}
                className="col-span-1 h-10 rounded-md bg-[#BEE28B]/60 border border-[#A8C97A] flex items-center justify-center"
              >
                <span className="text-[10px] font-mono text-[#3C5331]">{i + 1}</span>
              </div>
            ))}
          </Container>
          <Container variant="site" className="py-3 border-t border-[#D8C8BC]">
            <div className="col-span-8 h-10 rounded-md bg-[#D9EEB9] border border-[#C0D99A] flex items-center px-3">
              <span className="text-xs font-mono text-[#3C5331]">col-span-8</span>
            </div>
            <div className="col-span-4 h-10 rounded-md bg-[#ECF7DF] border border-[#D2E5B6] flex items-center px-3">
              <span className="text-xs font-mono text-[#48603D]">col-span-4</span>
            </div>
          </Container>
          <Container variant="site" className="py-3 border-t border-[#D8C8BC]">
            {[0, 1, 2].map((i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: preview grid
                key={i}
                className="col-span-4 h-10 rounded-md bg-[#D9EEB9] border border-[#C0D99A] flex items-center px-3"
              >
                <span className="text-xs font-mono text-[#3C5331]">col-span-4</span>
              </div>
            ))}
          </Container>
        </div>
      </section>

      <section className="mb-12 px-8">
        <SectionLabel
          name="Container"
          variant="app"
          note="full-width · 12 cols · gap-2 · px-8"
        />
        <div className="mt-4 rounded-xl border border-[#D8C8BC] overflow-hidden">
          <Container variant="app" className="py-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: preview grid
                key={i}
                className="col-span-1 h-10 rounded-md bg-[#CCDDF0]/80 border border-[#94B8D5] flex items-center justify-center"
              >
                <span className="text-[10px] font-mono text-[#3A536B]">{i + 1}</span>
              </div>
            ))}
          </Container>
          <Container variant="app" className="py-3 border-t border-[#D8C8BC]">
            <div className="col-span-3 h-10 rounded-md bg-[#EEF3F8] border border-[#CED9E3] flex items-center px-3">
              <span className="text-xs font-mono text-[#3A536B]">col-span-3 · sidebar</span>
            </div>
            <div className="col-span-9 h-10 rounded-md bg-[#DDE6EF] border border-[#B8C6D4] flex items-center px-3">
              <span className="text-xs font-mono text-[#3A536B]">col-span-9 · main</span>
            </div>
          </Container>
        </div>
      </section>

      {/* ── Avatar ───────────────────────────────────────────────────────── */}
      <Divider label="Primitives · Avatar" />

      <section className="mb-12 px-8 space-y-8">

        {/* Sizes */}
        <div>
          <SectionLabel name="Avatar" variant="sizes" note="sm · md · lg" />
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <Avatar name="Tobias Moccagatta" size="sm" />
            <Avatar name="Tobias Moccagatta" size="md" />
            <Avatar name="Tobias Moccagatta" size="lg" />
          </div>
        </div>

        {/* Initials palette */}
        <div>
          <SectionLabel name="Avatar" variant="initials" note="deterministic color per name" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {[
              "Tobias Moccagatta",
              "Ana García",
              "Marcus Webb",
              "Priya Sharma",
              "Leo Nakamura",
              "Sofia Rossi",
              "Carlos Mendez",
              "Nina Johansson",
            ].map((name) => (
              <Avatar key={name} name={name} size="md" />
            ))}
          </div>
        </div>

        {/* Photo */}
        <div>
          <SectionLabel name="Avatar" variant="photo" note="with src · broken src falls back to initials" />
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <Avatar
              name="Tobias Moccagatta"
              src="https://avatars.githubusercontent.com/u/9919"
              size="sm"
            />
            <Avatar
              name="Tobias Moccagatta"
              src="https://avatars.githubusercontent.com/u/9919"
              size="md"
            />
            <Avatar
              name="Tobias Moccagatta"
              src="https://avatars.githubusercontent.com/u/9919"
              size="lg"
            />
            {/* Broken src → initials fallback (404 fires onError immediately) */}
            <Avatar name="Tobias Moccagatta" src="/nonexistent-avatar.jpg" size="md" />
          </div>
        </div>

      </section>

      {/* ── Sheet ────────────────────────────────────────────────────────── */}
      <Divider label="Overlay · Sheet" />

      <section className="mb-12 px-8">
        <SectionLabel name="Sheet" variant="bottom-sheet" note="slide-up · drag handle · swipe or flick to dismiss" />
        <div className="mt-5">
          <SheetDemo />
        </div>
      </section>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      <Divider label="Overlay · Modal" />

      <section className="mb-12 px-8">
        <SectionLabel name="Modal · ConfirmDialog" variant="sizes" note="sm · md · lg · confirm shakes on dismiss attempt" />
        <div className="mt-5">
          <ModalDemo />
        </div>
      </section>

      {/* ── TextMorph ────────────────────────────────────────────────────── */}
      <Divider label="Animation · TextMorph" />

      <section className="mb-12 px-8 space-y-8">

        {/* Button label transition */}
        <div>
          <SectionLabel name="TextMorph" variant="button label" note="click to trigger Save → Saving… → Saved!" />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <ButtonTextMorphDemo />
          </div>
        </div>

        {/* Status label cycling */}
        <div>
          <SectionLabel name="TextMorph" variant="status label" note="auto-cycles every 1.6s" />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <StatusTextMorphDemo />
          </div>
        </div>

        {/* Balance amount */}
        <div>
          <SectionLabel name="TextMorph" variant="balance amount" note="auto-cycles every 1.8s" />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <BalanceTextMorphDemo />
          </div>
        </div>

      </section>

      {/* ── Select ──────────────────────────────────────────────────── */}
      <Divider label="Primitives · Select" />

      <section className="mb-12 px-8">
        <SectionLabel name="Select" variant="all modes" note="single · grouped · multi · icons · descriptions · disabled" />
        <div className="mt-5">
          <SelectDemo />
        </div>
      </section>

      {/* ── Badge + Input ─────────────────────────────────────────────── */}
      <Divider label="Primitives · Badge + Input" />

      <section className="mb-12 px-8">
        <SectionLabel name="Badge + Input" variant="interactive" note="preset variants · custom color · live customizer · input states" />
        <div className="mt-5">
          <BadgeDemo />
        </div>
      </section>

      {/* ── QR Code Display ──────────────────────────────────────────── */}
      <Divider label="QR / Invite · QRCodeDisplay" />

      <section className="mb-12 px-8">
        <SectionLabel name="QRCodeDisplay" variant="invite" note="functional QR · default sheet · receipt sheet" />
        <div className="mt-5">
          <QRDemo />
        </div>
      </section>

      {/* ── Coming soon ─────────────────────────────────────────────────── */}
      <Divider label="Coming soon" />

      {[
        "Toast",
        "Chip", "Toggle", "NavTabs",
      ].map((name) => (
        <section key={name} className="mb-2 px-8">
          <div className="rounded-xl border border-dashed border-[#D8C8BC] px-6 py-4 flex items-center gap-3">
            <span className="text-xs font-mono text-[#8C7463]">—</span>
            <span className="text-sm text-[#6F859B]">{name}</span>
          </div>
        </section>
      ))}

      <div className="h-24" />
    </div>
  );
}

// ─── local helpers ────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="px-8 mb-6 mt-10 flex items-center gap-4">
      <span className="text-[11px] font-mono text-[#8C7463] uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#D8C8BC]" />
    </div>
  );
}

function SectionLabel({
  name,
  variant,
  note,
}: {
  name: string;
  variant: string;
  note: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-sm font-medium text-[#2B3D51]">{name}</span>
      <span className="text-xs font-mono text-[#7FBE44] bg-[#F1F9E8] border border-[#C7DEB0] rounded-full px-2 py-0.5">
        {variant}
      </span>
      <span className="text-xs text-[#6F859B] font-mono">{note}</span>
    </div>
  );
}
