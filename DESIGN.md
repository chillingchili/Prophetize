---
name: Prophetize
description: Prediction market mobile app with virtual currency betting
colors:
  teal-accent: "#0891B2"
  teal-accent-dark: "#2BB5D6"
  page-bg: "#F4F5F7"
  page-bg-dark: "#0B0E11"
  surface: "#FFFFFF"
  surface-dark: "#151A21"
  surface-elevated: "#FFFFFF"
  surface-elevated-dark: "#1E252F"
  text-primary: "#0F172A"
  text-primary-dark: "#F4F6F8"
  text-secondary: "#475569"
  text-secondary-dark: "#9AA5B1"
  text-muted: "#94A3B8"
  text-muted-dark: "#5E6B7A"
  border: "#E2E8F0"
  border-dark: "#2A3441"
  success: "#10B981"
  success-dark: "#05C46B"
  danger: "#EF4444"
  warning: "#F59E0B"
  secondary: "#D97706"
  secondary-dark: "#FBBF24"
  secondary-container: "#FFFBEB"
  secondary-container-dark: "#2D1A00"
  tertiary: "#7C3AED"
  tertiary-dark: "#A78BFA"
  tertiary-container: "#F5F3FF"
  tertiary-container-dark: "#2E1065"
  info: "#7AD9ED"
  info-dark: "#38BDF8"
typography:
  display:
    fontFamily: "SpaceGrotesk_700Bold"
    fontSize: "42px"
    lineHeight: "48px"
    letterSpacing: "-1px"
  headline:
    fontFamily: "SpaceGrotesk_700Bold"
    fontSize: "30px"
    lineHeight: "36px"
    letterSpacing: "-0.75px"
  title:
    fontFamily: "SpaceGrotesk_700Bold"
    fontSize: "18px"
    lineHeight: "26px"
    letterSpacing: "-0.25px"
  body:
    fontFamily: "InterTight_400Regular"
    fontSize: "16px"
    lineHeight: "24px"
    letterSpacing: "0px"
  label:
    fontFamily: "JetBrainsMono_400Regular"
    fontSize: "12px"
    lineHeight: "16px"
    letterSpacing: "0.25px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.teal-accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "16px 24px"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "10px 6px"
---

# Design System: Prophetize

## 1. Overview

**Creative North Star: "The Ledger"**

Prophetize is a prediction market that needs to feel trustworthy enough for virtual money but approachable enough for casual daily use. Like a well-kept financial ledger: precise, clean, and calm. Every screen communicates clarity over cleverness — no user should wonder what something does or where to tap next.

The system uses a restrained cyan-teal accent on a neutral base, soft card layering with subtle shadows, and a type system that contrasts bold Space Grotesk headings with readable Inter Tight body text. It explicitly rejects over-simplified AI-generated interfaces, clashing multi-color palettes, and noisy or complicated layouts.

**Key Characteristics:**
- Restrained palette with three defined color roles (primary teal, secondary amber, tertiary violet)
- Card-based layout with soft shadow elevation (flat at rest, lifted on interaction)
- Bold sans-serif headings + humanist sans body + monospaced data labels
- Generous rounding that signals touchability
- Full light/dark mode support with independent color values per theme

## 2. Colors: The Ledger Palette

The palette centers on cyan-teal as the single accent against carefully tinted neutrals. Color carries meaning: teal for interaction, green for "yes" outcomes, red for "no" outcomes, amber for warnings.

### Primary
- **Teal Accent** (#0891B2 light / #2BB5D6 dark): The sole interactive accent. Used for primary buttons, links, active tab indicators, icon highlights. Never applied to backgrounds at full saturation — use `accentSoft` (12-16% opacity) for container tints.

### Neutral
- **Page Background** (#F4F5F7 light / #0B0E11 dark): The base canvas. Cool-leaning light, near-black dark.
- **Surface** (#FFFFFF light / #151A21 dark): Card and sheet backgrounds. The most common container.
- **Surface Elevated** (#FFFFFF light / #1E252F dark): Modals, sheets, elevated cards.
- **Border** (#E2E8F0 light / #2A3441 dark): Default stroke for cards, inputs, dividers.
- **Text Primary** (#0F172A light / #F4F6F8 dark): Headings and primary body copy.
- **Text Secondary** (#475569 light / #9AA5B1 dark): Labels, subtitles, supporting text.
- **Text Muted** (#94A3B8 light / #5E6B7A dark): Placeholders, disabled text, metadata.

### Semantic
- **Success / Yes** (#10B981 light / #05C46B dark): Positive outcomes, green checkmarks.
- **Danger / No** (#EF4444): Negative outcomes, error states, destructive actions.
- **Warning** (#F59E0B): Warning banners, hint highlights.
- **Info** (#7AD9ED light / #38BDF8 dark): Informational badges and indicators.

### Secondary (Amber)
- **Secondary** (#D97706 light / #FBBF24 dark): Warm accent for secondary actions, badges, and less prominent interactive elements. Complements the teal primary with approachable warmth.
- **Secondary Container** (#FFFBEB light / #2D1A00 dark): Background tint for secondary surfaces.
- **On Secondary Container** (#78350F light / #FDE68A dark): Text on secondary container.

### Tertiary (Violet)
- **Tertiary** (#7C3AED light / #A78BFA dark): Complementary accent for special features, premium elements, or social/profile highlights. Used sparingly as a third-level color.
- **Tertiary Container** (#F5F3FF light / #2E1065 dark): Background tint for tertiary surfaces.
- **On Tertiary Container** (#4C1D95 light / #DDD6FE dark): Text on tertiary container.

### The One-Accent Rule
The teal primary covers ≤10% of any given screen. Its rarity is the point. Secondary and tertiary exist as complementary roles, not as additional accents on every screen. When something needs emphasis, use weight or scale — not an extra color. Semantic greens and reds are signal, not decoration.

## 3. Typography

**Display Font:** Space Grotesk Bold (700)
**Body Font:** Inter Tight Regular (400)
**Label/Mono Font:** JetBrains Mono Regular (400)

**Character:** A confident, slightly-techy pairing. Space Grotesk gives headings a geometric, modern weight without being cold. Inter Tight keeps body text readable and compact. JetBrains Mono signals data — balances, percentages, timestamps — with a clear monospaced rhythm.

### Hierarchy
- **Display** (700, 42px/48px, -1px tracking): Hero text on login/welcome screens only. Rare.
- **Headline** (700, 30px/36px, -0.75px): Balance display, screen titles.
- **Title** (700, 18px/26px, -0.25px): Section headers, card titles, button labels.
- **Body** (400, 16px/24px, 0px): Default reading text. Max line length 65-75 characters.
- **Label** (400, 12px/16px, 0.25px): Metadata, timestamps, tab labels, data values.

### Monospaced Override
Use JetBrains Mono for all numeric data (balances, percentages, prices, scores) and timestamps. This gives the "Ledger" feel — numbers stay aligned and scannable.

## 4. Elevation

The system is flat by default with soft shadow elevation to distinguish interactive layers. Depth is conveyed through background tint shifts (surface → surface elevated) and light shadows — not heavy drop shadows or gradients.

### Shadow Vocabulary
- **Soft Rest** (`shadowColor: #0F172A, offset: 0x3, opacity: 0.08, radius: 6`): Default card state. Present but barely noticeable.
- **Lift** (`shadowColor: #0F172A, offset: 0x6, opacity: 0.12, radius: 10`): Elevated cards, pickers, dropdowns. Double the offset, higher opacity.
- **FAB** (`shadowColor: #0F172A, offset: 0x4, opacity: 0.12, radius: 8`): Floating action button only. Medium elevation, tighter radius.
- **Tab Pill** (`shadowColor: #0F172A, offset: 0x10, opacity: 0.12, radius: 16`): The floating tab bar gets the deepest shadow because it sits above all content.

Dark mode shadows use `#000000` with higher opacity (0.35-0.45) to compensate for the dark canvas.

### The Flat-By-Default Rule
Surfaces are flat at rest. Shadows appear only as elevation cues for interactive or overlaid elements. Cards do not float arbitrarily — shadow signals "this can be interacted with" or "this is on top of other content."

## 5. Components

### Buttons
- **Shape:** Fully pill-shaped (rounded-full, 9999px)
- **Primary:** Teal accent fill (#0891B2 / #2BB5D6), white text. 16px vertical padding, 24px horizontal.
- **Secondary:** White/black surface fill, text-primary text, 1px border.
- **States:** Opacity 0.9 on press, scale 0.98 on press-in, immediate transition (no animation delay).
- **Icon variant:** 8px gap between icon and label, icon inherits text color.

### Cards / Containers
- **Corner Style:** 12px radius (rounded-xl)
- **Background:** Surface color, 1px border
- **Shadow Strategy:** Soft Rest at rest, Lift on interactive cards
- **Internal Padding:** 16px

### Inputs / Fields
- **Style:** 24px radius (rounded-3xl), 2px stroke, surface background
- **Focus:** No glow — rely on border color shift (currently inconsistent, should use accent border)
- **Label:** Title-weight Space Grotesk, text-secondary color, 12px above input
- **Padding:** 14px vertical, 16px horizontal

### Navigation (Floating Tab Bar)
- **Style:** A single pill container, 36px radius, surface background, elevated with Tab Pill shadow
- **Tabs:** 4 items (Home, Explore, Board, Profile), each with icon + JetBrains Mono 9px label
- **Active State:** Teal accent icon + label at full opacity; background pill behind active tab at accentSoft
- **Inactive State:** Muted gray icon + label at 50% opacity
- **Animation:** Spring-based indicator slide with `damping: 26, stiffness: 220, mass: 0.3`

### Chips / Tags
- **Shape:** Surface background, 1px border, full text-primary color
- **Active State:** accentSoft background, accentBorder border, accent text color
- **Padding:** 8px horizontal, 4px vertical (defined in create-market patterns)

## 6. Do's and Don'ts

### Do:
- **Do** use the teal primary sparingly — ≤10% of screen area. It should feel like a highlight, not a default.
- **Do** use secondary (amber) for second-level actions, tags, and warm accents.
- **Do** use tertiary (violet) only for premium/special elements — it's the rarest color in the system.
- **Do** use JetBrains Mono for all numeric displays (balance, percentages, scores, timestamps).
- **Do** keep card radius at 12px consistently. Mixing 8px and 12px creates visual noise.
- **Do** use dark mode shadows with higher opacity (0.35+) — the dark canvas absorbs shadow.
- **Do** tint neutrals toward cool (not warm) — it complements the teal primary.

### Don't:
- **Don't** use more than one accent at full saturation on the same surface. Primary, secondary, and tertiary are role-specific — they never compete.
- **Don't** use secondary or tertiary as decorative flair. Each has a functional role.
- **Don't** use hard-coded colors — always reference `UI_COLORS` or `AppTheme` tokens.
- **Don't** leave text without an explicit color — default black breaks in dark mode.
- **Don't** add decorative gradients, glassmorphism, or 3D effects. Flat with shadow is the language.
- **Don't** use complicated or noisy layouts — clarity and simplicity first per the brand principles.
- **Don't** use border-left greater than 1px as a colored accent stripe. Use full borders or background tints.
- **Don't** create nested cards — cards should be siblings, not parents and children.
- **Don't** use arbitrary font sizes like `[10px]`, `[11px]`, `[13px]` — stick to the modular scale defined in tailwind.config.js.
