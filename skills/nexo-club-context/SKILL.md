---
name: nexo-club-context
description: Load the project context and conventions needed to continue developing the NEXO CLUB Laravel/Inertia/React sports-club management platform. Use when another agent joins this repository or needs to make changes consistent with its architecture, UI, security, seed data, and current phase.
---

# NEXO CLUB Context

Use this skill when taking over NEXO CLUB work. First read [the shared agent context](../../docs/agent-context.md) from the repository root; it is the canonical handoff document and contains the current implementation state.

## Working rules

- Preserve the monolithic Laravel + Inertia + React architecture; do not introduce microservices for MVP work.
- Treat Laravel as the source of truth for authorization, validation, club isolation, and financial rules.
- Keep monetary values exact and never use floating point for billing.
- Billing is already implemented: activating a current enrollment creates its current-period charge immediately; the daily scheduler creates later periods idempotently.
- Each club can configure multiple active payment methods (`bank_account`, `nequi`, `payment_key`) from Club Configuration; admins can manage them and the billing page displays active methods.
- Email infrastructure exists for enrollment welcome, due-date reminders, and daily outstanding-charge CSV reports, but it is disabled by default with `NEXO_NOTIFICATIONS_ENABLED=false`. Do not enable it without SMTP configuration and product approval.
- Enrollment due days default to the start-date day, can be overridden from 1 to 31, and clamp to the last available day in shorter months.
- Use `formatAppDate`/`formatAppDateTime` from `@/lib/dates` for user-facing dates and times; the platform timezone is `America/Bogota`.
- Keep the NEXO visual language: lime `#B8F34B`, ink `#0B1220`, surface `#151E2E`, Inter typography, dark responsive SaaS UI.
- Reuse `PhoneInputField` from `@/Components/ui/phone-input` for every phone field. It wraps `react-phone-input-2`, defaults to Colombia, supports country search, and applies the NEXO theme. Do not create native `tel` inputs in new modules.
- For future INSERT operations only, use the global `OperationProgressModal` with a dedicated operation type, module-specific Spanish stages, and a registered final action label. Keep the Toast after `nexo:operation-complete`. UPDATE, DELETE, status changes, and `router.patch`/`router.delete` actions use `react-hot-toast`/confirmation without the INSERT loader.
- Do not add fake operational data to production pages. Use empty states until real domain models exist.
- Create new migrations for schema changes; do not rewrite migrations that may already have run in production.
- Verify changes with `npm run build`, `php artisan test`, and `vendor/bin/pint --test` when applicable.

## Current phase

The repository has the multi-club foundation plus the first operational modules: clubs, disciplines, athletes, enrollments, monthly charges, payments, private athlete photos, audit logs, and role-based access. Advanced sports tracking, notifications, reports, and training planning remain future phases. Continue from the existing code instead of recreating the scaffold.
