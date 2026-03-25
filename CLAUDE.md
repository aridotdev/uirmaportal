# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Run ESLint with auto-fix
pnpm typecheck    # Run TypeScript type checking via nuxt typecheck
```

Package manager is **pnpm** (v10.30.3). No test suite is configured yet.

## Project Overview

**uirmaportal** is an internal RMA (Return Merchandise Authorization) claim management system. It handles electronics warranty claims from CS staff input through QRCC review, to vendor claim batching.

**Tech stack:** Nuxt 4, Nuxt UI v4, TailwindCSS v4, TanStack Vue Table, Lucide Vue Next, Zod, TypeScript.
Planned but not yet implemented: Better-Auth, Drizzle ORM + SQLite (API layer doesn't exist yet — pages use mock data).

## Architecture

### Directory Structure
```
app/
  app.vue          # Root component with UApp + NuxtLayout + NuxtPage
  app.config.ts    # Nuxt UI theme: primary=green, neutral=slate
  assets/css/      # Global CSS
  layouts/         # cs.vue, dashboard.vue — two distinct workspace shells
  components/      # Auto-imported Vue components (PascalCase)
  pages/           # File-based routing
```

### Two Workspace Areas

**CS Area** (`/cs/*`, layout: `cs`):
- Simpler sidebar for CS staff (claim entry, revision, tracking own claims)
- Pages: `/cs`, `/cs/claims`, `/cs/claims/create`, `/cs/claims/[id]`, `/cs/claims/[id]/edit`

**Dashboard Area** (`/dashboard/*`, layout: `dashboard`):
- Full sidebar + topbar shell for QRCC, Management, Admin roles
- Pages: `/dashboard`, `/dashboard/claims`, `/dashboard/vendor-claims/*`, etc.
- Planned but not built yet: master data, reports, audit trail, users, settings pages

### Layout Assignment
Pages must use `definePageMeta({ layout: 'dashboard' })` or `definePageMeta({ layout: 'cs' })` to opt into a layout. Without this, no layout wraps the page.

### Design System
- **Dark theme only**: base background `#050505`, surface `#0a0a0a`, no light mode
- **Accent color**: `#B6F500` (yellow-green) for active states, CTAs, highlights
- **Status color semantics**:
  - blue → SUBMITTED / CREATED
  - indigo → IN_REVIEW
  - amber → NEED_REVISION / PROCESSING
  - emerald → APPROVED / COMPLETED / VERIFIED
  - white/muted → ARCHIVED / DRAFT
  - red → REJECTED / destructive actions
- Tailwind classes are written inline in templates (no separate CSS modules)
- `rounded-4xl` and large `blur-[150px]` radial gradients are used heavily for the aesthetic

### Data Tables Pattern
Complex list pages use **TanStack Vue Table** (`@tanstack/vue-table`):
- `createColumnHelper` + typed interfaces
- `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel`
- Column cells use `h()` render functions for custom cell content
- Client-side filtering/search with debounce (250ms) done via computed properties before passing to table

Simpler list pages (e.g., vendor-claims index) implement manual pagination with `computed` slice instead of TanStack.

### Current State
All pages use **mock data** (`ref([...])` with hardcoded arrays). No API routes exist yet. The project is a UI prototype/design reference for a Nuxt 4 admin app.

## Development Standards (from PRD)

- **Formatting**: 2-space indent, LF endings (`.editorconfig` enforces this)
- **ESLint**: Configured via `@nuxt/eslint` with stylistic rules — `commaDangle: 'never'`, `braceStyle: '1tbs'`
- **Component naming**: PascalCase files in `app/components/` (auto-imported by Nuxt)
- **Soft delete**: Use `isActive` flag for master data; `ARCHIVED` status for claims
- **Git branches**: `feature/feature-name`, `bugfix/bug-name`
- **Commit format**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:` prefixes

## Key Domain Entities

- **Claim** statuses: `DRAFT` → `SUBMITTED` → `IN_REVIEW` → `NEED_REVISION` or `APPROVED` → `ARCHIVED`
- **ClaimPhoto** statuses: `PENDING` → `VERIFIED` or `REJECT`
- **VendorClaim** statuses: `DRAFT` → `CREATED` → `PROCESSING` → `COMPLETED`
- **Roles**: CS, QRCC, MANAGEMENT, ADMIN (each has different landing page and nav)

Reference `prd.md` and `pages.md` at the repo root for full feature specifications and planned screen designs.
