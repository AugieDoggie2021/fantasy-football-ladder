# Build Performance Optimization

This document describes build-time optimizations configured for faster Vercel deployments.

## Build Configuration

### Skipped Build-Time Checks

To speed up Vercel builds for iterative development workflows:

- **ESLint**: Skipped during builds (`eslint.ignoreDuringBuilds: true`)
- **TypeScript**: Errors ignored during builds (`typescript.ignoreBuildErrors: true`)

**Why?** For fast "push and redeploy" workflows, we rely on:
- Local development tools (Cursor, TypeScript in IDE)
- Local lint/type-check before pushing
- GitHub for code review

**Important:** Run lint and type-check locally before committing:
```bash
npm run lint
npx tsc --noEmit
```

Or set up CI workflows to run these checks in GitHub Actions (not blocking Vercel builds).

## Dependency Caching

Vercel can cache `node_modules` installations if a lockfile is committed to the repository.

### Status

✅ **`package-lock.json` is already committed** to the repository, so Vercel dependency caching is enabled.

### Keeping the Lockfile Up to Date

When you add, remove, or update dependencies:

1. **Install dependencies**:
   ```bash
   cd web
   npm install
   ```

2. **Commit the updated lockfile**:
   ```bash
   git add package-lock.json
   git commit -m "Update package-lock.json"
   git push
   ```

3. **Verify** that `package-lock.json` remains in the repository (NOT in `.gitignore`)

After the first build with a lockfile, Vercel caches the dependency installation step, dramatically speeding up subsequent builds. Since the lockfile is already committed, caching should already be active.

### Lockfile Guidelines

- ✅ **DO commit** `package-lock.json` (or `pnpm-lock.yaml` if using pnpm)
- ✅ **DO NOT** commit `node_modules/` directory
- ✅ Keep lockfile up to date when dependencies change

## Build Scripts

The build script is intentionally minimal:

```json
"build": "next build"
```

- No lint hooks
- No test hooks
- No pre/post install scripts
- Just the Next.js build

Lint and tests are separate scripts run locally or in CI:
- `npm run lint` - Run ESLint
- `npm test` - Run Vitest tests

## Build-Time Imports

Entry files are kept lean:

- No test utilities imported in production code
- No heavy Node-only modules bundled for client
- Server-only code properly separated

Monitor bundle size and import patterns to prevent accidental inclusion of dev-only dependencies.

