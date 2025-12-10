# Storybook Plan (Design System)

Goal: expose the refreshed Fantasy Football Ladder tokens and UI primitives for visual QA and cross-platform parity.

## Scope
- Consume `ui/tokens.ts` for colors, spacing, radii, shadows, typography.
- Add stories for Button, Input, Card, Badge, Tabs, SectionTitle, Navigation Bar, Footer.
- Include theme-aware backgrounds (brand surface, brand nav).

## Setup Steps
1) `cd web && npx storybook@latest init --builder @storybook/builder-vite --type react`
2) Configure `storybook/main.ts`:
   - Add `../components/**/*.tsx`, `../app/**/*.tsx` to stories globs.
   - Add Tailwind/PostCSS support (import `../app/globals.css` in preview).
3) In `storybook/preview.ts`:
   - Wrap with a simple layout that applies `bg-brand-surface text-brand-nav`.
   - Provide font-family Inter via CSS import.
4) Create stories in `stories/ui/`:
   - `Button.stories.tsx`, `Input.stories.tsx`, `Card.stories.tsx`, `Badge.stories.tsx`, `Tabs.stories.tsx`, `SectionTitle.stories.tsx`.
   - Showcase variants/sizes and stateful examples (focus/disabled/error).
5) Assets:
   - Reference `/assets/brand/ffl-icon.svg` in Nav/Footer stories.
6) CI (optional):
   - Add `npm run storybook:build` script and cache `.storybook` + `.turbo` if used.

## Commands to add
- Scripts (web/package.json):
  - `"storybook": "storybook dev -p 6006"`
  - `"storybook:build": "storybook build"`

## Verification
- Run `npm run storybook` locally; confirm token colors match `ui/tokens.ts`.
- Add Chromatic/Playwright visual tests later if desired.
