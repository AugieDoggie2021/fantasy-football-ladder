# Landing Page and Auth Flow

This document describes the public landing page implementation and authentication flow for Fantasy Football Ladder.

## Overview

The application now features a proper public marketing homepage at `/` with a clean flow into authentication at `/login` and then to the protected dashboard at `/dashboard`.

## Route Structure

### Public Routes

These routes are accessible to all users (authenticated and unauthenticated):

- **`/`** - Public landing page with marketing content
- **`/login`** - Authentication page (email/password and Google OAuth)
- **`/auth/callback`** - OAuth callback handler

### Protected Routes

These routes require authentication and redirect to `/login` if the user is not authenticated:

- **`/dashboard`** - Main dashboard for authenticated users
- **`/leagues/*`** - League-related pages
- **`/seasons/*`** - Season management pages
- **`/promotion-groups/*`** - Promotion group pages

## User Flow

1. **Landing Page (`/`)** - Public marketing homepage
   - Hero section with value proposition
   - Feature highlights
   - "How It Works" explanation
   - Call-to-action buttons
   - No authentication required

2. **Login Page (`/login`)** - Dedicated authentication screen
   - Email/password sign-in and sign-up
   - Google OAuth login
   - Link back to landing page
   - Clear copy about what users are signing into

3. **Dashboard (`/dashboard`)** - Protected application area
   - Requires authentication
   - Redirects to `/login` if not authenticated
   - Stores original URL for redirect after login

## Implementation Details

### Middleware Configuration

The middleware (`web/middleware.ts`) handles route protection:

- **Public routes** are defined in the `publicRoutes` array
- **Protected routes** are checked via pattern matching
- Authenticated users are redirected away from `/login` to `/dashboard` (or a stored redirect URL)
- Unauthenticated users accessing protected routes are redirected to `/login` with a `redirect` query parameter

### Landing Page Components

Located in `web/components/landing/`:

- **`hero-section.tsx`** - Main hero with title, subtitle, and primary CTAs
- **`feature-grid.tsx`** - Grid of 4 key features
- **`how-it-works.tsx`** - 3-step explanation of the platform
- **`call-to-action.tsx`** - Final CTA section at the bottom

### Landing Layout Components

Located in `web/components/layout/`:

- **`landing-layout.tsx`** - Wrapper component providing common structure
- **`site-header.tsx`** - Top navigation bar with logo and links
- **`site-footer.tsx`** - Footer with links and copyright

### Design System

The landing page uses the existing design system:

- **Colors**: Kelly green accents (`kelly-base`, `kelly-neon`, `kelly-soft`)
- **Background**: Gradient from `slate-950` via `slate-900` to `slate-950`
- **Cards**: Translucent glass effect with `backdrop-blur-sm` and subtle borders
- **Typography**: Clean, high-legibility fonts with proper hierarchy

## Visual Assets (Placeholders)

The landing page currently uses:

- **Icons**: Inline SVG placeholders for features
- **App Preview**: Gradient card placeholder on the right side of hero
- **Logo**: Text-based wordmark "Fantasy Football Ladder"

Future visual assets to be integrated:

- App preview screenshots/images
- Feature illustrations
- Custom icons
- Logo/branding assets

See `VISUAL_ASSETS.md` for the full checklist of visual assets to be created.

## Styling Notes

### Apple Sports App Style

The design direction follows an "Apple Sports App Style":

- Vibrant depth with soft gradients
- High legibility typography
- Subtle glassy/translucent surfaces (`backdrop-blur`)
- Clean geometry and spacing
- Smooth transitions and hover effects

### Responsive Design

All components are fully responsive:

- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`
- Stack layout on mobile, side-by-side on desktop
- Touch-friendly button sizes

## Login Page Updates

The login page has been updated to:

- Match the landing page aesthetic (dark background, glassy cards)
- Use consistent color scheme (Kelly green for primary actions)
- Include improved copy:
  - Title: "Sign in to Fantasy Football Ladder"
  - Subtitle: "Access your leagues, manage your team, and climb the ladder."
- Add link back to homepage: "Learn more about Fantasy Football Ladder"

## Testing Checklist

- [ ] Visiting `/` renders the landing page without redirect
- [ ] Clicking "Start Playing" navigates to `/login`
- [ ] Clicking "How Ladder Leagues Work" scrolls to the "How It Works" section
- [ ] Login page is accessible without authentication
- [ ] Authenticated users accessing `/login` are redirected to `/dashboard`
- [ ] Unauthenticated users accessing `/dashboard` are redirected to `/login`
- [ ] After login, users are redirected to their original destination (if applicable)
- [ ] Header navigation links work correctly
- [ ] Footer links are in place (placeholder URLs)

## Future Enhancements

1. **Visual Assets Integration**
   - Replace placeholder icons with custom illustrations
   - Add app preview images to hero section
   - Integrate logo/branding assets

2. **Additional Landing Sections**
   - FAQ section
   - Testimonials/social proof
   - Pricing information (if applicable)
   - More detailed feature explanations

3. **SEO Optimization**
   - Meta tags and Open Graph images
   - Structured data markup
   - Sitemap generation

4. **Analytics**
   - Track landing page visits
   - Monitor CTA click-through rates
   - A/B test different messaging

## Related Files

- `web/app/page.tsx` - Landing page entry point
- `web/app/login/page.tsx` - Authentication page
- `web/middleware.ts` - Route protection logic
- `web/components/layout/` - Landing layout components
- `web/components/landing/` - Landing page sections

