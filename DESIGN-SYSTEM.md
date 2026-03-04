# Style #4 · Lime Aero Design System

Source frame:
- File: `Friends,` (Paper)
- Artboard: `Style #4 · Lime Aero Design System`
- Artboard ID: `1UG-0`
- Root frame ID: `1UH-0`
- Canvas size: `1728 x 1500`

## 1) System Intent

This design system is a neutral aero-glass surface language with a lime-forward action model.
It combines:
- Soft frosted container shells with subtle blur/saturation.
- Warm-neutral borders and highlights for tactile depth.
- A vivid lime gradient for primary interactive emphasis.
- Semantic support ramps (success, error, neutral slate, utility tags).
- Pixel-display typography accents (`Geist Pixel`) on top of a highly legible UI body (`Geist`).

The resulting UI is soft, layered, and slightly physical (not flat), especially in active controls.

---

## 2) Canvas Structure And Layout

### Root Frame (`1UH-0`)
- Size: `1728 x 1500`
- Layout: vertical flex
- Padding: `30px` all sides
- Inter-section gap: `16px`
- Radius: `20px`
- Overflow: `clip`
- Background:
  - `linear-gradient(in oklab 155deg, oklab(95.1% -0.005 0.007) 0%, oklab(91.4% -0.007 0.005) 40%, oklab(93.9% -0.006 0.004) 100%)`

### Ambient Atmosphere Layer (`217-0`)
- Full-frame absolute layer (`1728 x 1500`)
- Decorative glow orb A (`219-0`):
  - Size: `460 x 460`
  - Position: `left 90`, `top 90`
  - Radial gradient:
    - `radial-gradient(circle farthest-corner at 30% 30%, oklab(78.8% -0.105 0.126 / 34%) 0%, oklab(78.8% -0.105 0.126 / 12%) 48%, oklab(78.8% -0.105 0.126 / 0%) 78%)`
- Decorative glow orb B (`218-0`):
  - Size: `390 x 390`
  - Position: `right 110`, `top 110`
  - Radial gradient:
    - `radial-gradient(circle farthest-corner at 34% 34%, oklab(78.8% -0.105 0.126 / 33%) 0%, oklab(78.8% -0.105 0.126 / 11%) 52%, oklab(78.8% -0.105 0.126 / 0%) 80%)`

### Top-Level Section Blocks
- Header Card (`211-0`): `1668 x 134`
- Typography Section (`20K-0`): `1668 x 172`
- Color Section (`1X0-0`): `1668 x 412`
- Components Section (`1UI-0`): `1668 x 650`

---

## 3) Foundation Tokens

### 3.1 Surface / Shell Token

Used by major section cards (`211-0`, `20K-0`, `1X0-0`, `1UI-0`) with small variations in radius/gap.

- Surface gradient:
  - `linear-gradient(in oklab 160deg, oklab(100% 0 .0001 / 74%) 0%, oklab(95.5% 0.004 0.008 / 50%) 100%)`
- Border:
  - `1px solid #FFFFFFC2`
- Backdrop:
  - Header: `blur(14px) saturate(120%)`
  - Other major sections: `blur(12px) saturate(118%)`
- Shadow stack:
  - `#FFFFFFDE 0px 1px 0px inset, #84664F2E 0px 9px 22px, #CFAF97A6 0px 2px 0px`
- Radius:
  - Header: `18px`
  - Main sections: `16px`

### Inner Module Card Token

Used by component demo blocks (`237-0`, `23G-0`, `23R-0`, `240-0`, `24H-0`):
- Fill: `#FFFFFFC4`
- Border: `1px solid #D8C8BC`
- Radius: `12px`
- Padding: `12px`
- Internal gap: `10px`

### Elevated Panel Token

Used by Card Shell + Line Graph shell (`250-0`, `256-0`):
- Gradient:
  - `linear-gradient(in oklab 160deg, oklab(100% .0001 .0001 / 72%) 0%, oklab(95.1% 0.006 0.009 / 52%) 100%)`
- Border: `1px solid #D8C8BC`
- Radius: `16px`
- Shadow:
  - `#FFFFFFD9 0px 1px 0px inset, #84664F2B 0px 8px 16px`

### Secondary Fill Panel Token

Used inside card content (`253-0`, `258-0`) and nav rail:
- Fill: `#F7F2ED`
- Border: `1px solid #DCCBC0`
- Radius: `12px`

---

### 3.2 Radii

- `20px`: full artboard root shell
- `18px`: primary top header
- `16px`: major section cards, elevated content panels
- `12px`: medium panels, toast, mini cards, graph container
- `10px`: color swatches
- `999px`: pills, chips, avatars, progress tracks/fills

---

### 3.3 Border Palette

Primary border values repeatedly used:
- `#FFFFFFC2` (major glass shell border)
- `#D8C8BC` (inner module border)
- `#DCCBC0` (soft neutral panel border)
- `#DCCABF` (search field border)
- `#D6C7BC` (inactive nav pill border)
- `#5A9629` (active lime borders)
- `#C7DEB0` / `#BFD99F` (soft lime semantic borders)

---

### 3.4 Shadow Recipes

### Main glass section shadow
- `#FFFFFFDE 0px 1px 0px inset, #84664F2E 0px 9px 22px, #CFAF97A6 0px 2px 0px`

### Primary tactile button shadow (higher elevation)
- `#E2FBC2C7 0px 1px 0px inset, #587B3357 0px 6px 14px, #527F2B 0px 3px 0px`

### Active nav pill shadow (compressed press)
- `#E2FBC2C7 0px 1px 0px inset, #527F2B 0px 2px 0px`

### Toast shadow
- `#FFFFFFCC 0px 1px 0px inset, #5A8B3633 0px 8px 16px`

### Elevated panel shadow
- `#FFFFFFD9 0px 1px 0px inset, #84664F2B 0px 8px 16px`

---

### 3.5 Spacing Scale (Observed)

The frame uses a compact spacing set, mostly 2px increments:
- `2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 30`

Most common:
- `6/8/10/12` for local component rhythm
- `18` for section padding
- `30` for frame gutters

---

## 4) Typography System

Font families:
- Display: `"GeistPixel-Circle", "Geist Pixel", system-ui, sans-serif`
- UI/Body: `"Geist", system-ui, sans-serif`

### Type Tokens

| Token | Font | Size / Line | Weight | Tracking | Color (example) |
|---|---|---|---|---|---|
| Display XL | Geist Pixel | `42 / 44` | 400 | `-0.04em` | `#1F2A23` / `#1E2A35` |
| Section Title | Geist Pixel | `28 / 30` | 400 | `0` | `#2A3F56` |
| Card Title M | Geist Pixel | `20 / 22` | 400 | `0` | `#2D455E` |
| Card Title S | Geist Pixel | `18 / 20` | 400 | `0` | `#2D455E` |
| Emphasis Metric | Geist Pixel | `34 / 36` | 400 | `0` | `#22384C` |
| UI Body | Geist | `15 / 20` | 400 | `0` | `#556B82` |
| UI Label | Geist | `13 / 16` | 400 | `0` | varies by state |
| UI Meta | Geist | `12 / 16` | 400 | `0` | `#5B7087` family |
| Micro Label | Geist | `11 / 14` | 400 | `0` | `#7087A0` family |

Typography usage pattern:
- Pixel font is not only for hero; it is consistently used for section anchors and high-value numeric emphasis.
- Geist handles all operational text (inputs, chips, secondary descriptions, breadcrumbs, percentages).

---

## 5) Color System

### 5.1 Primary Lime Ramp

Base: `#7FBE44`

| Step | Hex | Swatch Border | On-Swatch Text |
|---|---|---|---|
| 50 | `#F5FBEF` | `#DDECC8` | `#4E6242` |
| 100 | `#ECF7DF` | `#D2E5B6` | `#48603D` |
| 200 | `#D9EEB9` | `#C0D99A` | `#425A37` |
| 300 | `#BEE28B` | `#A8C97A` | `#3C5331` |
| 400 | `#97CE53` | `#83B54A` | `#2F4625` |
| 500 | `#7FBE44` | `#5A9629` | `#F4FBFF` |
| 600 | `#6AA435` | `#578930` | `#EEF9E6` |
| 700 | `#5A9629` | `#4B7A23` | `#E8F5DD` |
| 800 | `#46781F` | `#3D6818` | `#E2F0D4` |
| 900 | `#355917` | `#2D4F13` | `#D7E8C5` |

Gradient action pair:
- From `oklab(87.7% -0.085 0.109)` to `oklab(73.4% -0.113 0.123)`
- Border anchor: `#5A9629`

---

### 5.2 Success Green Ramp

Base: `#00682E`

| Step | Hex | Swatch Border | On-Swatch Text |
|---|---|---|---|
| 50 | `#E5F4EA` | `#D0E8D8` | `#43604F` |
| 100 | `#CBE9D5` | `#B6DBC3` | `#3B5847` |
| 200 | `#9DD4B2` | `#8AC39F` | `#334F3E` |
| 300 | `#6DBF8E` | `#5DAC7B` | `#2A4635` |
| 400 | `#3C9B66` | `#338355` | `#E8F7EE` |
| 500 | `#00682E` | `#005B28` | `#E5F4EA` |
| 600 | `#005B28` | `#004E22` | `#DFF2E7` |
| 700 | `#004B21` | `#003F1C` | `#D7EEDF` |
| 800 | `#003A19` | `#002F14` | `#CCE9D7` |
| 900 | `#002910` | `#00210D` | `#C0E1CC` |

---

### 5.3 Error Red Ramp

Base: `#B24A3A`

| Step | Hex | Swatch Border | On-Swatch Text |
|---|---|---|---|
| 50 | `#F9ECEA` | `#ECD9D5` | `#6D5350` |
| 100 | `#F3D8D4` | `#E2C4BE` | `#664B46` |
| 200 | `#E8B4AD` | `#D4A39A` | `#5E413C` |
| 300 | `#DB8E84` | `#C87D73` | `#553934` |
| 400 | `#CD695D` | `#B85B50` | `#FAEFED` |
| 500 | `#B24A3A` | `#973F32` | `#FDF2F0` |
| 600 | `#973F32` | `#7A332A` | `#F7EAE8` |
| 700 | `#7A332A` | `#612821` | `#F2E2DF` |
| 800 | `#5D261F` | `#4A1F1A` | `#ECD8D4` |
| 900 | `#401A15` | `#33150F` | `#E6CBC5` |

---

### 5.4 Neutral Slate Ramp

| Step | Hex | Swatch Border | On-Swatch Text |
|---|---|---|---|
| 50 | `#F7FAFD` | `#E8EEF4` | `#516C85` |
| 100 | `#EEF3F8` | `#E0E7EE` | `#4A647E` |
| 200 | `#DDE6EF` | `#CED9E3` | `#425B74` |
| 300 | `#C7D4E1` | `#B8C6D4` | `#3A536B` |
| 400 | `#A8BACB` | `#99ABBD` | `#324A61` |
| 500 | `#6F859B` | `#62798F` | `#F3F7FB` |
| 600 | `#556B82` | `#4B5F73` | `#EBF2F8` |
| 700 | `#3E5268` | `#364759` | `#E4ECF4` |
| 800 | `#2B3D51` | `#243343` | `#DCE8F3` |
| 900 | `#1B2A3B` | `#162230` | `#D1E1EF` |

---

### 5.5 Utility / Tag Palette

| Tag | Fill | Border | Text |
|---|---|---|---|
| Needs Review | `#FFF0E5` | `#E7BEA0` | `#8F5732` |
| Design Ops | `#EEF5FE` | `#CCDDF0` | `#5B7188` |
| Ready | `#F1F8F2` | `#C9DECF` | `#4E6B58` |
| Client View | `#F5EFFB` | `#D4C8E3` | `#6E5A88` |
| Action | `#F1F9E8` | `#C7DEB0` | `#4F7330` |
| Success Soft | `#ECF7DF` | `#BFD99F` | `#4F7330` |

---

## 6) Components

### 6.1 Buttons (Tactile / 3D-Feeling)

Demo group: `239-0` (`gap: 8px`)

### Primary Button (`23A-0`)
- Instance size in board: `77 x 38`
- Shape: pill (`999px`)
- Padding: `10px 14px`
- Fill: lime vertical gradient (bright top, darker bottom)
- Border: `1px solid #5A9629`
- Shadow:
  - Inset top highlight
  - Deep outer diffuse shadow
  - Hard lower edge (`0 3px 0 #527F2B`)
- Text: `13/16`, `#F4FBFF`

Interpretation:
- This is an intentionally extruded control style.
- The hard bottom shadow line is the key to the “physical button” appearance.

### Secondary Button (`23C-0`)
- Instance size in board: `94 x 38`
- Shape: pill
- Padding: `10px 14px`
- Fill: `#FFFFFFC2`
- Border: `#D8C8BC`
- Text: `13/16`, `#4D6480`
- No dramatic elevation shadow.

### Ghost Button (`23E-0`)
- Instance size in board: `66 x 38`
- Shape: pill
- Padding: `10px 14px`
- Fill: `#F1F9E8`
- Border: `#C7DEB0`
- Text: `13/16`, `#4F7330`
- Gentle semantic action styling without heavy elevation.

---

### 6.2 Navigation Pills

Container (`23I-0`):
- Instance size in board: `404 x 46`
- Fill: `#F7F2ED`
- Border: `#DCCBC0`
- Radius: pill
- Padding: `6px`
- Gap between pills: `6px`

Active pill (`23J-0`):
- Instance size in board: `86 x 32`
- Same lime gradient language as Primary Button
- Border: `#5A9629`
- Shadow includes short hard bottom (`0 2px 0 #527F2B`)
- Padding: `7px 12px`
- Text: `12/16`, `#F4FBFF`

Inactive pills (`23L-0`, `23N-0`, `23P-0`):
- Instance sizes in board:
  - `Analytics`: `77 x 32`
  - `Inbox`: `57 x 32`
  - `Exports`: `68 x 32`
- Transparent/neutral fill treatment
- Border: `#D6C7BC`
- Padding: `7px 12px`
- Text: `12/16`, `#5B6F87`

---

### 6.3 Input / Search + Breadcrumb

Search field (`23T-0`):
- Instance size in board: `784 x 36`
- Shape: pill
- Padding: `9px 12px`
- Border: `#DCCABF`
- Fill: soft white-to-cream gradient
  - `linear-gradient(in oklab 180deg, oklab(100% 0 .0001 / 92%) 0%, oklab(94.7% 0.005 0.009 / 72%) 100%)`
- Left text: `Search squads` (`13/16`, `#68809A`)
- Right key hint: `/` in Geist Pixel (`12/14`, `#8C7463`)

Breadcrumb text below:
- Frame width in board: `784`
- `v Weekend Crew` (`12/16`, `#6E859E`)
- `> House Expenses` (`12/16`, `#7E93AB`)

---

### 6.4 Tags And Avatar Stack

Tag chips:
- Instance sizes in board:
  - `Design Ops`: `84 x 28`
  - `Needs Review`: `99 x 28`
  - `Ready`: `55 x 28`
  - `Client View`: `82 x 28`
- All use pill shape, `1px` border, `5px 9px` padding, `12/16` text.
- Color semantics match Tag Palette table exactly.

Avatar circles (`24C-0`, `24D-0`, `24E-0`):
- Size: `30 x 30`
- Radius: full
- Each uses a radial gradient + unique border tint:
  - A border `#8EBC63` (lime family)
  - B border `#94B8D5` (blue family)
  - C border `#9AC2A7` (mint family)

Online counter chip (`24F-0`):
- Instance size in board: `75 x 32`
- Fill: `#F1F9E8`
- Border: `#C7DEB0`
- Padding: `7px 11px`
- Text: `+5 online` (`12/16`, `#4F7330`)

---

### 6.5 Toast + Progress Cluster

Toast (`24J-0`):
- Instance size in board: `1124 x 52`
- Container:
  - Radius: `12px`
  - Padding: `10px 12px`
  - Gap: `10px`
  - Border: `#BFD99F`
  - Background gradient:
    - `linear-gradient(in oklab 180deg, oklab(97.7% -0.015 0.021) 0%, oklab(94.5% -0.031 0.039) 100%)`
  - Shadow: `#FFFFFFCC 0px 1px 0px inset, #5A8B3633 0px 8px 16px`
- Dot indicator:
  - `10 x 10`
  - Fill: `#97CE53`
- Text stack:
  - Title `Sync complete`: Geist Pixel `13/14`, `#4F7330`
  - Meta `All squads refreshed 2 min ago`: Geist `11/14`, `#6C8198`

Progress pattern:
- Label row frames (`24P-0`, `24U-0`) are each `1124 x 16`.
- Track rows (`24S-0`, second track) are each `1124 x 8`.
- Label row text:
  - Left: neutral UI text (`#4A6079`, `12/16`)
  - Right: lime success text (`#4F7330`, `12/16`)
- Track (`24S-0`):
  - Height: `8px`
  - Radius: pill
  - Fill: `#E9EEF6`
- Fill 1 (`24T-0`): width `78%`, lime gradient
- Fill 2 (`24Y-0`): width `89%`, lime gradient

---

### 6.6 Card Shell

Outer panel (`250-0`):
- Instance size in board: `390 x 222`
- Radius: `16px`
- Padding: `14px`
- Gap: `8px`
- Elevated panel token (gradient + subtle inset + drop shadow)

Inner metric panel (`253-0`):
- Instance size in board: `360 x 74`
- Fill: `#F7F2ED`
- Border: `#DCCBC0`
- Radius: `12px`
- Padding: `10px`

Text:
- Label `Metric`: Geist `12/16`, `#6A819A`
- Value `94%`: Geist Pixel `34/36`, `#22384C`

---

### 6.7 Line Graph Component

Shell (`256-0`):
- Instance size in board: `1230 x 222`
- Same elevated panel token as Card Shell.

Plot container (`258-0`):
- Instance size in board: `1200 x 162`
- Neutral inset panel token.

SVG chart spec:
- Viewbox: `0 0 880 140`
- Horizontal grid lines at Y: `20`, `58`, `96`
- Grid stroke: `#D8E4F1`
- Primary line:
  - Stroke: `#7FBE44`
  - Width: `4`
  - Cap: `round`
  - Curve path:
    - `M12 108 C 82 98, 144 102, 216 88 C 292 74, 352 38, 430 54 C 504 69, 569 24, 644 34 C 718 44, 790 80, 868 58`
- Highlight marker:
  - Circle at `cx 644`, `cy 34`, `r 6`
  - Fill: `#97CE53`

---

## 7) Dimensional Map (Exact Frame Sizes)

### Top-level cards
- Header: `1668 x 134`
- Typography: `1668 x 172`
- Colors: `1668 x 412`
- Components: `1668 x 650`

### Component demo blocks
- Buttons block: `370 x 138`
- Nav pills block: `430 x 138`
- Input/search block: `810 x 138`
- Tags/avatar block: `470 x 190`
- Toast/progress block: `1150 x 190`
- Card shell block: `390 x 222`
- Line graph block: `1230 x 222`

---

## 8) Inferred Interaction And State Guidance

The frame is a static system board, so interaction states are inferred from visual language.

### Recommended state model (inferred)

Primary controls:
- Default: existing lime gradient + full tactile shadow stack.
- Hover: increase top highlight opacity slightly and lift diffuse shadow by ~10-15%.
- Active/Pressed: reduce bottom hard edge from `3px` to `1-2px`, slightly darken lower gradient stop.
- Focus-visible: add high-contrast outer ring (neutral-light or lime-100/200 edge) that does not collide with shadow.
- Disabled: remove hard bottom edge, reduce saturation, lower text contrast.

Secondary/ghost controls:
- Keep flatter than primary to preserve hierarchy.
- Hover should increase border contrast before adding elevation.

Nav pills:
- Active only should retain lime gradient + hard edge.
- Inactive pills should avoid shadow to preserve selected-state clarity.

---

## 9) Suggested Tokenization For Code

```css
:root {
  --font-display: "GeistPixel-Circle", "Geist Pixel", system-ui, sans-serif;
  --font-ui: "Geist", system-ui, sans-serif;

  --surface-glass-grad: linear-gradient(in oklab 160deg, oklab(100% 0 .0001 / 74%) 0%, oklab(95.5% 0.004 0.008 / 50%) 100%);
  --surface-glass-border: #ffffffc2;
  --surface-glass-shadow: #ffffffde 0 1px 0 inset, #84664f2e 0 9px 22px, #cfaf97a6 0 2px 0;

  --lime-500: #7fbe44;
  --lime-700: #5a9629;
  --action-grad: linear-gradient(in oklab 180deg, oklab(87.7% -0.085 0.109) 0%, oklab(73.4% -0.113 0.123) 100%);
  --action-shadow: #e2fbc2c7 0 1px 0 inset, #587b3357 0 6px 14px, #527f2b 0 3px 0;
}
```

---

## 10) Accessibility Notes (Needs Validation In App)

Likely good:
- Most primary/action states use strong color contrast against light backgrounds.
- Body text is generally on light neutral surfaces with medium-dark tones.

Needs explicit measurement before production:
- `11px` and `12px` text in chips/meta labels can be risky depending on final rendering and opacity.
- Frosted/glass backgrounds may reduce contrast if underlying content becomes dynamic.
- Ensure minimum `44 x 44` touch target for interactive pills if used on mobile.

---

## 11) What Is Not Explicitly Defined In The Frame

These are not represented directly in this board and should be added before full implementation:
- Disabled states for all interactive components.
- Focus-visible ring standards.
- Error state for input/search field.
- Loading skeleton/shimmer patterns.
- Empty states and zero-data chart states.
- Icon library spec and stroke weights.
- Motion timings/easing for tactile transitions.

---

## 12) Quick Implementation Checklist

- Use `Geist Pixel` only for hierarchy and high-emphasis metrics.
- Keep lime gradient reserved for primary/selected actions.
- Preserve hard-bottom shadow edge in tactile controls (critical to the 3D look).
- Keep neutral cards flat/soft so primary controls retain visual priority.
- Use semantic tag fills exactly as palette-defined values.
- Use rounded-pill geometry consistently for chips, nav, progress, and small controls.
