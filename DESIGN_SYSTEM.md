# Fantasy Football Ladder Design System

## Visual Identity (Updated)

This design system implements a premium, modern fantasy football app with:

- **Ladder Green (#10B981)** - Primary emerald green for actions, success states, and primary CTAs
- **Dark Navy (#0F172A)** - Secondary color for backgrounds, cards, and elevated surfaces
- **Trophy Gold (#FACC15)** - Accent color for highlights, badges, and special achievements
- **Inter Typography** - Clean, modern sans-serif font family for all text
- **Consistent spacing and radii** - Unified border radius (xl, 2xl, 3xl) and spacing scale
- **Subtle shadows** - Card shadows for depth without harsh edges

This design system prioritizes clarity, consistency, and premium feel across all components.

## Color Palette

### Primary Colors (Ladder Green)
- `ladder-primary` (#10B981) - Primary emerald green (was kellyGreenBase #00FF66)
- Full scale: 50-900 available via Tailwind `bg-ladder-primary-50` through `bg-ladder-primary-900`

### Secondary Colors (Dark Navy)
- `ladder-secondary` (#0F172A) - Primary dark navy (was turfDark #020812)
- Full scale: 50-900 available via Tailwind `bg-ladder-secondary-50` through `bg-ladder-secondary-900`

### Accent Colors (Trophy Gold)
- `ladder-accent` (#FACC15) - Trophy gold for highlights (was kellyGreenNeon)
- Full scale: 50-900 available via Tailwind `bg-ladder-accent-50` through `bg-ladder-accent-900`

### Semantic Colors
- `success`: #10B981 (matches primary)
- `warning`: #F59E0B
- `error`: #EF4444

### Neutral Colors
- Full neutral ramp using Tailwind's `slate` scale (50-900) for text, borders, and backgrounds

## Design Tokens

### Typography
- **Display Font**: `font-display` - Inter, system-ui, sans-serif (for headings)
- **Body Font**: `font-sans` - Inter, system-ui, sans-serif (for body text)
- **Font Sizes**: Use Tailwind's responsive text utilities (text-sm md:text-base for body)

### Radii
- `rounded-xl`: 1rem (16px) - Standard card/panel corner radius
- `rounded-2xl`: 1.25rem (20px) - Larger cards, badges
- `rounded-3xl`: 1.75rem (28px) - Hero sections, major containers

### Shadows
- `shadow-subtle`: `0 1px 2px rgba(0,0,0,0.12)` - Subtle elevation
- `shadow-card`: `0 8px 30px rgba(0,0,0,0.16)` - Card elevation

### Spacing
- Use Tailwind's spacing scale consistently: p-4, p-6, etc.
- Avoid ad-hoc values like p-5, p-7

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

### Shared UI Primitives

All UI primitives use the design tokens defined above. Located in `components/ui/`.

#### Button
Button component with primary, secondary, and ghost variants.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>
```

Props:
- `variant`: "primary" | "secondary" | "ghost"
- Standard HTML button props supported

#### Card
Standard card component with consistent radius, padding, and shadow.

```tsx
import { Card } from '@/components/ui';

<Card>
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

#### Badge
Badge component for "Tier 1", "Promoted", "Commissioner" labels.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="tier1">Tier 1</Badge>
<Badge variant="promoted">Promoted</Badge>
<Badge variant="commissioner">Commissioner</Badge>
```

#### SectionTitle
Standard typography component for h2/h3 section headers.

```tsx
import { SectionTitle } from '@/components/ui';

<SectionTitle as="h2">Section Title</SectionTitle>
<SectionTitle as="h3">Subsection Title</SectionTitle>
```

#### Input
Labeled input component with error state support.

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  error="Invalid email"
  {...props}
/>
```

#### Tabs
League navigation tabs component for consistent navigation.

```tsx
import { Tabs } from '@/components/ui';

<Tabs>
  <Tabs.Tab href="/leagues/1">Standings</Tabs.Tab>
  <Tabs.Tab href="/leagues/1/matchup">Matchups</Tabs.Tab>
</Tabs>
```

### Legacy UI Components

#### NeonCard (Deprecated - Use Card)
A card/panel with turf gradient background and neon green glow. **Deprecated** - migrate to `Card` component.

#### TierBadge (Legacy)
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

### Colors
- **Primary**: `bg-ladder-primary`, `text-ladder-primary`, `border-ladder-primary`
- **Secondary**: `bg-ladder-secondary`, `text-ladder-secondary`
- **Accent**: `bg-ladder-accent`, `text-ladder-accent`
- **Full scales**: Use `bg-ladder-primary-50` through `bg-ladder-primary-900` for all color scales
- **Neutrals**: Use Tailwind's `slate` scale: `text-slate-200`, `bg-slate-800`, etc.

### Typography
- **Display**: `font-display font-semibold` for headings
- **Body**: `font-sans text-sm md:text-base text-slate-200/90`

### Radii
- `rounded-xl` - Standard cards
- `rounded-2xl` - Larger cards, badges
- `rounded-3xl` - Hero sections

### Shadows
- `shadow-subtle` - Subtle elevation
- `shadow-card` - Card elevation

### Spacing
- Use consistent increments: `p-4`, `p-6`, `px-4`, `py-2`, etc.
- Avoid: `p-5`, `p-7`, `p-9` - use standard scale only

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

