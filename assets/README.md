# Assets Directory

This directory serves as the **single source of truth** for all visual assets used across the Fantasy Football Ladder application, including both the iOS app and web interface. All exported PNGs, SVGs, and other visual files should be organized here to ensure consistency and maintainability.

## Directory Structure

### `AppIcon/`
Source files and exports for the iOS app icon (master 1024px, any intermediate PNGs, etc.). The final `AppIcon.appiconset` will live in `Assets.xcassets` inside the Xcode project but is generated from here.

### `Brand/`
Brand logos and wordmarks (primary logo, light/dark variants, monochrome). Exported PNGs intended for use in app UI, marketing pages, and docs.

### `Positions/`
Position-specific icons (QB, RB, WR, TE, K, DEF) following the neon Kelly green line-art style used in the app.

### `Badges/`
Tier badges (Tier 1–4), promotion and relegation badges, and any future achievement-style visuals.

### `UI/`
Generic UI icons (fantasy points icon, settings, leaderboard, notifications, etc.) not specific to a single football position or tier.

### `Source/`
Design master files (.svg, .psd, .afdesign, etc.) organized in subfolders that mirror the main structure. All exported PNGs should be derived from these source files.

## File Naming Convention

### General Rules

- Use lowercase kebab-case for names: `brand-logo-primary-dark.png`
- Prefix with a category where helpful (`brand-`, `pos-`, `badge-`, `icon-`).
- For raster images, use `@1x`, `@2x`, `@3x` suffixes where we have multiple scale variants: `pos-qb@2x.png`, `badge-tier-1@3x.png`.
- Prefer `.png` for shipped assets and `.svg` (or other vector formats) in `Assets/Source`.

### Brand Examples

- `brand-logo-primary-dark.png`
- `brand-logo-primary-light.png`
- `brand-logo-monochrome.png`
- `brand-logo-wordmark-horizontal.png`
- Vector masters in `Assets/Source/Brand/`, e.g. `brand-logo-primary.svg`.

### App Icon Examples

- `app-icon-master-1024.png`
- (optional individual exports) `app-icon-180@3x.png`, etc.

**Note**: The Xcode asset catalog will ultimately contain `AppIcon.appiconset`, but this folder is the source of truth.

### Position Icon Examples

- `pos-qb.png`, `pos-qb@2x.png`, `pos-qb@3x.png`
- `pos-rb.png`, `pos-rb@2x.png`, `pos-rb@3x.png`
- `pos-wr.png`, `pos-wr@2x.png`, `pos-wr@3x.png`
- `pos-te.png`, `pos-te@2x.png`, `pos-te@3x.png`
- `pos-k.png`, `pos-k@2x.png`, `pos-k@3x.png`
- `pos-def.png`, `pos-def@2x.png`, `pos-def@3x.png`
- Vector masters in `Assets/Source/Positions/`, e.g. `pos-qb.svg`.

### Badge Examples

- `badge-tier-1.png`, `badge-tier-1@2x.png`, `badge-tier-1@3x.png`
- `badge-tier-2.png`, `badge-tier-2@2x.png`, `badge-tier-2@3x.png`
- `badge-tier-3.png`, `badge-tier-3@2x.png`, `badge-tier-3@3x.png`
- `badge-tier-4.png`, `badge-tier-4@2x.png`, `badge-tier-4@3x.png`
- `badge-promotion.png`, `badge-promotion@2x.png`, `badge-promotion@3x.png`
- `badge-relegation.png`, `badge-relegation@2x.png`, `badge-relegation@3x.png`

### UI Icon Examples

- `icon-fantasy-points.png`, `icon-fantasy-points@2x.png`
- `icon-settings.png`
- `icon-leaderboard.png`
- `icon-notification.png`

## Usage

### For Designers

1. **Place master files** (`.svg`, `.psd`, `.afdesign`, etc.) in the appropriate `Assets/Source/...` subfolder.
2. **Export PNGs** from source files to the corresponding main folder (e.g., `Assets/Source/Brand/logo.svg` → export to `Assets/Brand/brand-logo-primary.png`).
3. **Follow naming conventions** strictly to ensure consistency across the codebase.

### For Developers

1. **Pull PNGs** from `Assets/...` folders into:
   - **iOS**: Xcode `Assets.xcassets` catalog (organize into appropriate asset sets)
   - **Web**: `/public/assets` folder (or equivalent public asset directory)
2. **Use exported assets** from the main folders, not from `Source/` (source files are for design tooling only).
3. **Maintain structure**: When adding new icons or badges, follow the same naming convention and folder structure.

### Adding New Assets

Any new icons or badges must:
- Follow the same naming convention (lowercase kebab-case with appropriate prefix)
- Be placed in the correct folder (`Positions/`, `Badges/`, `UI/`, etc.)
- Include source files in the corresponding `Source/...` subfolder
- Include appropriate scale variants (`@1x`, `@2x`, `@3x`) where needed
