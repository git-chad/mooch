"use client";

import { Popover } from "@base-ui-components/react";
import type { LucideIcon } from "lucide-react";
import {
  Anvil,
  Apple,
  Award,
  Baby,
  Balloon,
  Banana,
  Banknote,
  BarChart2,
  Beef,
  Beer,
  Bell,
  BellRing,
  Bike,
  Bird,
  Bomb,
  Bookmark,
  BottleWine,
  BowArrow,
  Bug,
  Building2,
  Bus,
  CableCar,
  Cake,
  CakeSlice,
  Camera,
  Candy,
  // ── Transport ────────────────────────────────────────────────────────────────
  Car,
  CarFront,
  Carrot,
  Castle,
  // ── Animals & Nature ─────────────────────────────────────────────────────────
  Cat,
  Cherry,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clover,
  // ── Drinks ───────────────────────────────────────────────────────────────────
  Coffee,
  Coins,
  Cookie,
  CreditCard,
  Croissant,
  Crown,
  CupSoda,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Dices,
  Dog,
  DollarSign,
  Donut,
  Drama,
  Drum,
  Dumbbell,
  Egg,
  EggFried,
  Eye,
  Feather,
  Film,
  FireExtinguisher,
  Fish,
  FishingRod,
  Flag,
  Flame,
  FlaskConical,
  FlaskRound,
  Flower,
  Footprints,
  Gamepad2,
  Gem,
  // ── Fun & Silly ───────────────────────────────────────────────────────────────
  Ghost,
  Gift,
  GlassWater,
  Globe,
  GraduationCap,
  Grape,
  Guitar,
  Ham,
  Hamburger,
  Hammer,
  HandCoins,
  Handshake,
  Hash,
  Heart,
  Helicopter,
  // ── Places ───────────────────────────────────────────────────────────────────
  Home,
  IceCream,
  IceCreamCone,
  Landmark,
  Leaf,
  Lock,
  Lollipop,
  Mail,
  MapPin,
  Martini,
  Medal,
  MessageCircle,
  Milk,
  Motorbike,
  Mountain,
  MountainSnow,
  // ── Activities ───────────────────────────────────────────────────────────────
  Music,
  Palette,
  Panda,
  PartyPopper,
  PawPrint,
  Phone,
  Piano,
  Pickaxe,
  PiggyBank,
  Pin,
  Pizza,
  Plane,
  Popcorn,
  Rabbit,
  Rat,
  Receipt,
  Ribbon,
  Rocket,
  Rose,
  Sailboat,
  Salad,
  Sandwich,
  Scale,
  Scissors,
  Ship,
  ShoppingBag,
  ShoppingCart,
  Shovel,
  Shrimp,
  Skull,
  Smile,
  Snail,
  Soup,
  Sparkle,
  Sparkles,
  Sprout,
  Squirrel,
  // ── General ──────────────────────────────────────────────────────────────────
  Star,
  Stethoscope,
  Sun,
  Tag,
  Telescope,
  Tent,
  Ticket,
  Train,
  TreeDeciduous,
  TreePalm,
  TreePine,
  TrendingDown,
  TrendingUp,
  Trophy,
  Truck,
  Turtle,
  User,
  UserCheck,
  UserPlus,
  // ── People & Social ──────────────────────────────────────────────────────────
  Users,
  // ── Food ─────────────────────────────────────────────────────────────────────
  UtensilsCrossed,
  Van,
  VenetianMask,
  Volleyball,
  // ── Finance ──────────────────────────────────────────────────────────────────
  Wallet,
  Wand,
  Wheat,
  Wine,
  Worm,
  Wrench,
  Zap,
  // ── Zodiac ───────────────────────────────────────────────────────────────────
  ZodiacAquarius,
  ZodiacAries,
  ZodiacCancer,
  ZodiacCapricorn,
  ZodiacGemini,
  ZodiacLeo,
  ZodiacLibra,
  ZodiacOphiuchus,
  ZodiacPisces,
  ZodiacSagittarius,
  ZodiacScorpio,
  ZodiacTaurus,
  ZodiacVirgo,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { cn } from "../lib/cn";

// ── Icon registry ──────────────────────────────────────────────────────────────

type IconEntry = { name: string; Icon: LucideIcon };
type CategoryDef = { label: string; icons: IconEntry[] };

const CATEGORIES: CategoryDef[] = [
  {
    label: "General",
    icons: [
      { name: "Star", Icon: Star },
      { name: "Heart", Icon: Heart },
      { name: "Flame", Icon: Flame },
      { name: "Zap", Icon: Zap },
      { name: "Sparkles", Icon: Sparkles },
      { name: "Sparkle", Icon: Sparkle },
      { name: "Gift", Icon: Gift },
      { name: "Tag", Icon: Tag },
      { name: "Bookmark", Icon: Bookmark },
      { name: "Flag", Icon: Flag },
      { name: "Pin", Icon: Pin },
      { name: "Hash", Icon: Hash },
      { name: "Bell", Icon: Bell },
      { name: "BellRing", Icon: BellRing },
      { name: "Lock", Icon: Lock },
      { name: "Eye", Icon: Eye },
      { name: "Crown", Icon: Crown },
      { name: "Trophy", Icon: Trophy },
      { name: "Award", Icon: Award },
      { name: "Medal", Icon: Medal },
      { name: "Ribbon", Icon: Ribbon },
      { name: "Gem", Icon: Gem },
      { name: "CircleCheck", Icon: CircleCheck },
      { name: "CircleAlert", Icon: CircleAlert },
      { name: "CircleX", Icon: CircleX },
    ],
  },
  {
    label: "Finance",
    icons: [
      { name: "Wallet", Icon: Wallet },
      { name: "CreditCard", Icon: CreditCard },
      { name: "Receipt", Icon: Receipt },
      { name: "Coins", Icon: Coins },
      { name: "TrendingUp", Icon: TrendingUp },
      { name: "TrendingDown", Icon: TrendingDown },
      { name: "PiggyBank", Icon: PiggyBank },
      { name: "DollarSign", Icon: DollarSign },
      { name: "Banknote", Icon: Banknote },
      { name: "BarChart2", Icon: BarChart2 },
      { name: "Scale", Icon: Scale },
      { name: "HandCoins", Icon: HandCoins },
    ],
  },
  {
    label: "Food",
    icons: [
      { name: "UtensilsCrossed", Icon: UtensilsCrossed },
      { name: "Pizza", Icon: Pizza },
      { name: "Hamburger", Icon: Hamburger },
      { name: "Sandwich", Icon: Sandwich },
      { name: "Croissant", Icon: Croissant },
      { name: "Cake", Icon: Cake },
      { name: "CakeSlice", Icon: CakeSlice },
      { name: "IceCream", Icon: IceCream },
      { name: "IceCreamCone", Icon: IceCreamCone },
      { name: "Donut", Icon: Donut },
      { name: "Lollipop", Icon: Lollipop },
      { name: "Candy", Icon: Candy },
      { name: "Popcorn", Icon: Popcorn },
      { name: "Soup", Icon: Soup },
      { name: "Salad", Icon: Salad },
      { name: "Beef", Icon: Beef },
      { name: "Shrimp", Icon: Shrimp },
      { name: "Ham", Icon: Ham },
      { name: "Egg", Icon: Egg },
      { name: "EggFried", Icon: EggFried },
      { name: "Apple", Icon: Apple },
      { name: "Banana", Icon: Banana },
      { name: "Carrot", Icon: Carrot },
      { name: "Cherry", Icon: Cherry },
      { name: "Grape", Icon: Grape },
      { name: "Cookie", Icon: Cookie },
      { name: "Milk", Icon: Milk },
      { name: "Wheat", Icon: Wheat },
    ],
  },
  {
    label: "Drinks",
    icons: [
      { name: "Coffee", Icon: Coffee },
      { name: "Beer", Icon: Beer },
      { name: "Wine", Icon: Wine },
      { name: "BottleWine", Icon: BottleWine },
      { name: "Martini", Icon: Martini },
      { name: "GlassWater", Icon: GlassWater },
      { name: "CupSoda", Icon: CupSoda },
      { name: "FlaskConical", Icon: FlaskConical },
      { name: "FlaskRound", Icon: FlaskRound },
    ],
  },
  {
    label: "Transport",
    icons: [
      { name: "Car", Icon: Car },
      { name: "CarFront", Icon: CarFront },
      { name: "Motorbike", Icon: Motorbike },
      { name: "Truck", Icon: Truck },
      { name: "Van", Icon: Van },
      { name: "Bus", Icon: Bus },
      { name: "Plane", Icon: Plane },
      { name: "Train", Icon: Train },
      { name: "Bike", Icon: Bike },
      { name: "Ship", Icon: Ship },
      { name: "Sailboat", Icon: Sailboat },
      { name: "CableCar", Icon: CableCar },
      { name: "Helicopter", Icon: Helicopter },
      { name: "Rocket", Icon: Rocket },
    ],
  },
  {
    label: "Places",
    icons: [
      { name: "Home", Icon: Home },
      { name: "MapPin", Icon: MapPin },
      { name: "Building2", Icon: Building2 },
      { name: "Castle", Icon: Castle },
      { name: "Landmark", Icon: Landmark },
      { name: "Globe", Icon: Globe },
      { name: "Mountain", Icon: Mountain },
      { name: "MountainSnow", Icon: MountainSnow },
      { name: "TreePine", Icon: TreePine },
      { name: "TreePalm", Icon: TreePalm },
      { name: "TreeDeciduous", Icon: TreeDeciduous },
      { name: "Tent", Icon: Tent },
    ],
  },
  {
    label: "Activities",
    icons: [
      { name: "Music", Icon: Music },
      { name: "Guitar", Icon: Guitar },
      { name: "Drum", Icon: Drum },
      { name: "Piano", Icon: Piano },
      { name: "Gamepad2", Icon: Gamepad2 },
      { name: "Film", Icon: Film },
      { name: "Camera", Icon: Camera },
      { name: "Ticket", Icon: Ticket },
      { name: "Dumbbell", Icon: Dumbbell },
      { name: "Volleyball", Icon: Volleyball },
      { name: "FishingRod", Icon: FishingRod },
      { name: "BowArrow", Icon: BowArrow },
      { name: "Telescope", Icon: Telescope },
      { name: "Palette", Icon: Palette },
      { name: "ShoppingCart", Icon: ShoppingCart },
      { name: "ShoppingBag", Icon: ShoppingBag },
      { name: "Hammer", Icon: Hammer },
      { name: "Pickaxe", Icon: Pickaxe },
      { name: "Shovel", Icon: Shovel },
      { name: "Wrench", Icon: Wrench },
      { name: "Scissors", Icon: Scissors },
      { name: "Anvil", Icon: Anvil },
      { name: "FireExtinguisher", Icon: FireExtinguisher },
    ],
  },
  {
    label: "Animals",
    icons: [
      { name: "Cat", Icon: Cat },
      { name: "Dog", Icon: Dog },
      { name: "Bird", Icon: Bird },
      { name: "Fish", Icon: Fish },
      { name: "Rabbit", Icon: Rabbit },
      { name: "Panda", Icon: Panda },
      { name: "Rat", Icon: Rat },
      { name: "Turtle", Icon: Turtle },
      { name: "Snail", Icon: Snail },
      { name: "Bug", Icon: Bug },
      { name: "Worm", Icon: Worm },
      { name: "Squirrel", Icon: Squirrel },
      { name: "PawPrint", Icon: PawPrint },
      { name: "Feather", Icon: Feather },
    ],
  },
  {
    label: "Nature",
    icons: [
      { name: "Leaf", Icon: Leaf },
      { name: "Flower", Icon: Flower },
      { name: "Rose", Icon: Rose },
      { name: "Sprout", Icon: Sprout },
      { name: "Clover", Icon: Clover },
      { name: "Footprints", Icon: Footprints },
      { name: "Sun", Icon: Sun },
    ],
  },
  {
    label: "Fun",
    icons: [
      { name: "Ghost", Icon: Ghost },
      { name: "Skull", Icon: Skull },
      { name: "Bomb", Icon: Bomb },
      { name: "PartyPopper", Icon: PartyPopper },
      { name: "Balloon", Icon: Balloon },
      { name: "Drama", Icon: Drama },
      { name: "VenetianMask", Icon: VenetianMask },
      { name: "Wand", Icon: Wand },
      { name: "Dice1", Icon: Dice1 },
      { name: "Dice2", Icon: Dice2 },
      { name: "Dice3", Icon: Dice3 },
      { name: "Dice4", Icon: Dice4 },
      { name: "Dice5", Icon: Dice5 },
      { name: "Dice6", Icon: Dice6 },
      { name: "Dices", Icon: Dices },
    ],
  },
  {
    label: "People",
    icons: [
      { name: "Users", Icon: Users },
      { name: "User", Icon: User },
      { name: "Smile", Icon: Smile },
      { name: "MessageCircle", Icon: MessageCircle },
      { name: "Phone", Icon: Phone },
      { name: "Mail", Icon: Mail },
      { name: "Handshake", Icon: Handshake },
      { name: "UserCheck", Icon: UserCheck },
      { name: "UserPlus", Icon: UserPlus },
      { name: "Baby", Icon: Baby },
      { name: "Stethoscope", Icon: Stethoscope },
      { name: "GraduationCap", Icon: GraduationCap },
    ],
  },
  {
    label: "Zodiac",
    icons: [
      { name: "ZodiacAries", Icon: ZodiacAries },
      { name: "ZodiacTaurus", Icon: ZodiacTaurus },
      { name: "ZodiacGemini", Icon: ZodiacGemini },
      { name: "ZodiacCancer", Icon: ZodiacCancer },
      { name: "ZodiacLeo", Icon: ZodiacLeo },
      { name: "ZodiacVirgo", Icon: ZodiacVirgo },
      { name: "ZodiacLibra", Icon: ZodiacLibra },
      { name: "ZodiacScorpio", Icon: ZodiacScorpio },
      { name: "ZodiacSagittarius", Icon: ZodiacSagittarius },
      { name: "ZodiacCapricorn", Icon: ZodiacCapricorn },
      { name: "ZodiacAquarius", Icon: ZodiacAquarius },
      { name: "ZodiacPisces", Icon: ZodiacPisces },
      { name: "ZodiacOphiuchus", Icon: ZodiacOphiuchus },
    ],
  },
];

const ALL_ICONS: IconEntry[] = CATEGORIES.flatMap((c) => c.icons);

// ── Component ──────────────────────────────────────────────────────────────────

export type IconPickerProps = {
  value: string | null;
  onValueChange: (name: string) => void;
  /** Lucide stroke color for the trigger icon */
  color?: string;
  label?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
};

export function IconPicker({
  value,
  onValueChange,
  color,
  label,
  placeholder = "Choose icon",
  size = "md",
  disabled,
  className,
}: IconPickerProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const haptic = useWebHaptics();

  const SelectedIcon = value
    ? ALL_ICONS.find((e) => e.name === value)?.Icon
    : null;

  const visibleIcons = useMemo(() => {
    const pool =
      activeCategory === "All"
        ? ALL_ICONS
        : (CATEGORIES.find((c) => c.label === activeCategory)?.icons ??
          ALL_ICONS);
    if (!query.trim()) return pool;
    const q = query.toLowerCase();
    return pool.filter((e) => e.name.toLowerCase().includes(q));
  }, [activeCategory, query]);

  function handleSelect(name: string) {
    haptic.trigger("selection");
    onValueChange(name);
    setOpen(false);
    setQuery("");
  }

  const triggerSize =
    size === "sm"
      ? "h-9 w-9"
      : size === "lg"
        ? "h-[42px] w-[42px]"
        : "h-10 w-10";
  const triggerRadius = size === "lg" ? "rounded-[14px]" : "rounded-lg";
  const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-[#4A3728] font-sans select-none"
        >
          {label}
        </label>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          id={id}
          disabled={disabled}
          onClick={() => !open && haptic.trigger("light")}
          className={cn(
            "relative inline-flex items-center justify-center border",
            "bg-[#FDFCFB] text-[#4A3728]",
            "border-[#D8C8BC] hover:border-[#B8A898]",
            "shadow-[0_1px_2px_rgba(132,100,79,0.08)]",
            "transition-[border-color,box-shadow] duration-120",
            "outline-none focus-visible:ring-2 focus-visible:ring-[#7FBE44]/40",
            "data-[popup-open]:border-[#7FBE44] data-[popup-open]:ring-2 data-[popup-open]:ring-[#7FBE44]/15",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            triggerSize,
            triggerRadius,
          )}
          aria-label={value ? `Change icon: ${value}` : placeholder}
        >
          {SelectedIcon ? (
            <SelectedIcon
              size={iconSize}
              strokeWidth={1.75}
              style={color ? { color } : undefined}
            />
          ) : (
            <PlaceholderIcon size={iconSize} />
          )}
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner sideOffset={8} align="start" className="z-50">
            <Popover.Popup className="icon-picker-popup bg-[#FDFCFB] border border-[#EDE3DA] rounded-2xl shadow-[var(--shadow-elevated)] outline-none w-[312px] overflow-hidden flex flex-col">
              {/* Search */}
              <div className="px-3 pt-3 pb-2 border-b border-[#EDE3DA]">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B8A898] pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (e.target.value) setActiveCategory("All");
                    }}
                    placeholder="Search icons…"
                    className="w-full pl-8 pr-3 py-2 text-sm font-sans bg-[#F5F3F0] border border-[#EDE3DA] rounded-lg text-[#1F2A23] placeholder:text-[#B8A898] outline-none focus:border-[#7FBE44] focus:ring-2 focus:ring-[#7FBE44]/15 transition-[border-color,box-shadow] duration-120"
                  />
                </div>
              </div>

              {/* Category tabs */}
              {!query.trim() && (
                <div className="flex gap-0.5 px-2 py-2 overflow-x-auto border-b border-[#EDE3DA] [scrollbar-width:none]">
                  {["All", ...CATEGORIES.map((c) => c.label)].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium font-sans transition-colors duration-100 whitespace-nowrap outline-none",
                        activeCategory === cat
                          ? "bg-[#EBF7D8] text-[#3D6B1A] border border-[#C7DEB0]"
                          : "text-[#6F5B4E] hover:bg-[#F5F3F0]",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Icon grid */}
              <div className="overflow-y-auto max-h-[232px] p-2">
                {visibleIcons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[#B8A898]">
                    <PlaceholderIcon size={24} />
                    <p className="mt-2 text-xs font-sans">
                      No icons match "{query}"
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-0.5">
                    {visibleIcons.map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => handleSelect(name)}
                        className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-75 outline-none",
                          "focus-visible:ring-2 focus-visible:ring-[#7FBE44]/40",
                          value === name
                            ? "bg-[#EBF7D8] text-[#3D6B1A] ring-1 ring-[#C7DEB0]"
                            : "text-[#4A3728] hover:bg-[#F0EAE4] hover:text-[#1F2A23]",
                        )}
                      >
                        <Icon size={16} strokeWidth={1.75} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: current name + clear */}
              {value && (
                <div className="border-t border-[#EDE3DA] px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#8C7463]">
                    {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.trigger("light");
                      onValueChange("");
                      setOpen(false);
                    }}
                    className="text-[11px] font-sans text-[#8C7463] hover:text-[#C0392B] transition-colors outline-none"
                  >
                    Clear
                  </button>
                </div>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

// ── Render helper ──────────────────────────────────────────────────────────────

export function LucideIconByName({
  name,
  size = 16,
  strokeWidth = 1.75,
  className,
  style,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const entry = ALL_ICONS.find((e) => e.name === name);
  if (!entry) return null;
  const { Icon } = entry;
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}

// ── Internal icons ─────────────────────────────────────────────────────────────

function PlaceholderIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="12"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 9.5L12.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
