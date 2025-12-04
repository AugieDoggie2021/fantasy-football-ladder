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

---

## Platform Usage (iOS vs Web)

### Shared Source of Truth

All master design files and exported PNGs live under `Assets/` at the repository root. This is the single source of truth for all visual assets.

**Designer Workflow:**
- Designers update assets in `Assets/Source/...` and re-export PNGs into the appropriate `Assets/...` folders.
- All platform-specific usage pulls from these centralized `Assets/` folders.

### iOS Usage

**Asset Location:**
- iOS uses Xcode's `Assets.xcassets` catalog inside the Xcode project (e.g., `ios/FantasyFootballLadder/Assets.xcassets`).
- Developers should import PNGs from the root `Assets/` folders into image sets in the catalog.

**Import Process:**
1. Open the Xcode project
2. Navigate to `Assets.xcassets` in the project navigator
3. Create or update image sets (e.g., `pos-qb`, `badge-tier-1`, `brand-logo-primary`)
4. Import PNGs from:
   - `Assets/AppIcon/` for app icons
   - `Assets/Brand/` for logos and wordmarks
   - `Assets/Positions/` for position icons
   - `Assets/Badges/` for tier/promotion/relegation badges
   - `Assets/UI/` for generic UI icons

**Resolution Variants:**
- iOS uses the `@1x/@2x/@3x` convention natively
- Place `@1x` variants in the 1x slot, `@2x` in the 2x slot, and `@3x` in the 3x slot of each image set in Xcode

**Code Usage:**
```swift
Image("pos-qb")
  .resizable()
  .frame(width: 32, height: 32)
```

### Web Usage

**Asset Location:**
- The web client serves images from `web/public/assets/...`
- The folder structure under `public/assets` mirrors the top-level `Assets` structure:
  - `web/public/assets/brand/` for logos and wordmarks
  - `web/public/assets/positions/` for position icons (e.g., `pos-qb@2x.png`)
  - `web/public/assets/badges/` for tier/promotion/relegation badges
  - `web/public/assets/ui/` for generic UI icons (fantasy points, settings, leaderboard, notifications, etc.)

**Resolution Strategy:**
- We typically use the `@2x` variants on web for standard UI elements
- Can opt into `@3x` for high-density displays or large-display use cases
- Next.js Image component handles responsive sizing and optimization automatically

**Code Usage:**
```tsx
import Image from "next/image";

export function PositionIconQB() {
  return (
    <Image
      src="/assets/positions/pos-qb@2x.png"
      alt="QB"
      width={32}
      height={32}
    />
  );
}
```

### Syncing Assets

**Important:** When designers update PNGs under `Assets/`, those changes must be manually (or via a future sync script) copied to:

1. **Web:** The corresponding `web/public/assets/...` folders
2. **iOS:** The Xcode `Assets.xcassets` catalog

**Key Rules:**
- **Filenames must remain identical** across `Assets/` and `web/public/assets/`
- Keep folder structure consistent between platforms
- Ensure all resolution variants (`@1x`, `@2x`, `@3x`) are synced as needed

**Future Automation:**
- A sync script may be created to automate copying from `Assets/` to `web/public/assets/`
- Xcode asset catalog imports typically remain manual to allow for proper image set configuration