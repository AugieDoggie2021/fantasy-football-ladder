# Fantasy Football Ladder Design System

## Visual Principles

This design system implements a premium "Apple Sports" style fantasy football app with:

- **Neon Kelly green on deep turf-dark backgrounds** - Electric green (#00FF66) as the primary accent on almost-black turf (#020812)
- **Soft gradients and glow, not harsh shadows** - Subtle drop-shadows and glows create depth without harsh edges
- **Simple geometry** - Stadium ovals for badges, rounded rectangles for cards, clean monoline arrows
- **Athletic, modern typography** - Condensed fonts where appropriate, forward energy
- **Clean, UI-first iconography** - Monoline outlines with slight motion, stick-figure players for positions

This is **not retro arcade**. It's premium, OS-native, sports data driven.

## Color Palette

### Primary Colors
- `kellyGreenBase` (#00FF66) - Primary electric Kelly green
- `kellyGreenNeon` (#6BFFB3) - Lighter edge/highlight green
- `kellyGreenSoft` (#00CC55) - Midtone for gradients

### Background Colors
- `turfDark` (#020812) - Almost-black turf background
- `turfMid` (#04191A) - Slightly lighter turf

### Text Colors
- `whitePure` (#FFFFFF) - Pure white
- `textOffWhite` (#E6F7EE) - Soft off-white for typography

### Status Colors
- `relegationRed` (#FF1744) - Primary neon red for relegation
- `relegationRedNeon` (#FF4F7B) - Lighter red edge/highlight
- `neutralGrey` (#4C5A60) - Subtle UI borders, dividers

## Design Tokens

### Radii
- `card`: 16px - Standard card/panel corner radius
- `badge`: 20px - Tier badge corner radius (stadium oval)
- `pill`: 999px - Fully rounded pill shape

### Spacing
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px

### Glow Recipes
- `softGreen`: `0 0 12px #00CC55` - Tier 2-3, positions
- `strongGreen`: `0 0 20px #00FF66` - Tier 1, promotion
- `softRed`: `0 0 12px #FF1744` - Subtle relegation
- `strongRed`: `0 0 20px #FF4F7B` - Strong relegation

## Components

### Icon Components

#### PositionIcon
Displays position icons (QB, RB, WR, TE, K, DEF) with medium green glow.

```tsx
import { PositionIcon } from '@/components/icons';

<PositionIcon type="QB" size={32} />
<PositionIcon type="RB" size={24} className="mr-2" />
```

#### TierBadgeIcon
Displays tier badges (1-4) with tier-appropriate glow strength.

```tsx
import { TierBadgeIcon } from '@/components/icons';

<TierBadgeIcon tier={1} size={40} />
<TierBadgeIcon tier={4} size={32} />
```

#### Movement Arrows
Promotion (green up) and relegation (red down) arrows.

```tsx
import { PromotionArrowIcon, RelegationArrowIcon } from '@/components/icons';

<PromotionArrowIcon size={24} />
<RelegationArrowIcon size={24} />
```

### UI Components

#### NeonCard
A card/panel with turf gradient background and neon green glow.

```tsx
import { NeonCard } from '@/components/ui';

<NeonCard elevation="medium">
  <h2>Standings</h2>
  {/* content */}
</NeonCard>
```

Props:
- `elevation`: "soft" | "medium" | "strong" - Controls glow intensity

#### TierBadge
Wraps TierBadgeIcon with optional label.

```tsx
import { TierBadge } from '@/components/ui';

<TierBadge tier={1} label="Tier 1" />
<TierBadge tier={2} />
```

#### PositionIcon (UI wrapper)
UI wrapper for PositionIcon with sensible defaults (size 32).

```tsx
import { PositionIcon } from '@/components/ui';

<PositionIcon type="QB" />
```

#### MovementArrow
Unified component for promotion/relegation arrows with optional magnitude scaling.

```tsx
import { MovementArrow } from '@/components/ui';

<MovementArrow direction="up" magnitude={2} />
<MovementArrow direction="down" />
```

Props:
- `direction`: "up" | "down"
- `magnitude`: Optional number to scale arrow for big jumps (default: 1)

## Usage Examples

### Standings Row with Tier Badge and Movement

```tsx
import { NeonCard, TierBadge, MovementArrow } from '@/components/ui';

<NeonCard>
  <div className="flex items-center gap-4">
    <TierBadge tier={1} label="Tier 1" />
    <span className="ff-neon-text">Team Name</span>
    <MovementArrow direction="up" magnitude={2} />
  </div>
</NeonCard>
```

### Roster Display with Position Icons

```tsx
import { PositionIcon } from '@/components/ui';

<div className="flex items-center gap-2">
  <PositionIcon type="QB" />
  <span className="ff-neon-text">Player Name</span>
</div>
```

### Promotion History Row

```tsx
import { TierBadge, MovementArrow } from '@/components/ui';

<div className="flex items-center gap-3">
  <TierBadge tier={2} />
  <MovementArrow direction="up" />
  <TierBadge tier={1} />
</div>
```

## Tailwind Classes

The design system provides Tailwind utility classes:

- Colors: `bg-kelly-base`, `text-kelly-neon`, `bg-turf-dark`, `text-text-offwhite`
- Shadows: `shadow-neon-green-soft`, `shadow-neon-green-strong`
- Spacing: Use `xs`, `sm`, `md`, `lg`, `xl` from spacing tokens

## CSS Utility Classes

Global utility classes in `globals.css`:

- `.ff-neon-panel` - Applies neon panel styling
- `.ff-neon-text` - Applies neon text color and rendering
- `.ff-neon-green-glow` - Medium green glow filter
- `.ff-neon-green-glow-strong` - Strong green glow filter
- `.ff-neon-green-glow-soft` - Soft green glow filter
- `.ff-neon-red-glow` - Red glow filter
- `.ff-neon-red-glow-strong` - Strong red glow filter

## Design Token Usage

Import design tokens directly:

```tsx
import { colors, radii, spacing, glow } from '@/lib/design/design-tokens';
import { neonPanelStyle, getTierGlow } from '@/lib/design/neon-theme';

// Use in inline styles
<div style={neonPanelStyle}>
  <img style={{ filter: getTierGlow(1) }} src="..." />
</div>
```

## Color Semantics

- **Green = Good**: Promotion, positive movement, Tier 1, success
- **Red = Bad**: Relegation, negative movement, warnings
- **Grey = Neutral**: Dividers, subtle UI elements

## Glow Strength Guidelines

- **Strongest glow**: Tier 1 badge, promotion arrow, app icon
- **Medium glow**: Tier 2-3 badges, position icons
- **Softest glow**: Tier 4 badge, subtle UI accents

