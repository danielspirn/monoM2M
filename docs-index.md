# docs-index.md — Money to Memories

This file is the entry point for all project documentation in `monoM2M`.

If you are an engineer, AI coding agent, or reviewer, read documents in this order:

1. `AGENTS.md`
2. `docs/master-spec/overview.md`
3. `docs/data-model/core-data-model-v1.1.md`
4. `docs/ux/mobile-shell-v1.md`
5. `docs/ux/route-spec.md`
6. `docs/personas/overview.md`
7. `docs/build/codex-build-v1.md`
8. `docs/security/security-foundation.md`
9. `contracts/openapi/money_to_memories_openapi_v1_1.yaml`
10. `contracts/schema/README.md`

## Source of truth hierarchy

When instructions conflict, use this priority order:

1. `AGENTS.md`
2. route-specific UX docs in `docs/ux/`
3. data model in `docs/data-model/`
4. OpenAPI contract in `contracts/openapi/`
5. schema guidance in `contracts/schema/`
6. older archived docs or design notes

## Product summary

Money to Memories is a consumer-first, mobile-first product that helps people:
- capture purchases and receipts
- understand spending at the line-item level
- organize what they own as **Things**
- connect purchases to people, place, time, and memories
- use an agent to ask questions and make better decisions

This is not a generic budgeting app.

Its differentiation is:
- line-item intelligence
- Things ownership and warranty support
- memory creation from purchases
- people-linked spending context
- inflation-aware household understanding
- long-term headroom for Family Pro and Family Trust

## Canonical UI labels

Use these user-facing labels consistently:
- Home
- Things
- People
- Memories

Internal model note:
- user-facing **Things** map to internal `assets`

## Current build phase

Current phase: **UX-first mocked implementation**

The immediate goal is to build and review:
- shell and navigation
- Home
- Things
- People
- Memories
- Settings / Account / Plan
- FAB / Agent entry

using mocked data and persona switching before full backend integration.

## Primary artifacts by category

### Product and strategy
- `docs/master-spec/overview.md`

### Data model
- `docs/data-model/core-data-model-v1.1.md`

### UX and navigation
- `docs/ux/mobile-shell-v1.md`
- `docs/ux/route-spec.md`

### Personas and use cases
- `docs/personas/overview.md`

### Build execution
- `docs/build/codex-build-v1.md`

### Security and compliance
- `docs/security/security-foundation.md`

### API contract
- `contracts/openapi/money_to_memories_openapi_v1_1.yaml`

### Schema guidance
- `contracts/schema/README.md`

## Mocking and development inputs

### Persona files
- `mock-data/personas/personas.json`
- `mock-data/personas/persona-to-route-defaults.json`

### Route-state registry
- `mock-data/routes/route_states.json`
- `mock-data/routes/mock-api-responses.json`

### Route payloads
- `mock-data/routes/home.payloads.json`
- `mock-data/routes/things.payloads.json`
- `mock-data/routes/people.payloads.json`
- `mock-data/routes/memories.payloads.json`
- `mock-data/routes/thing-detail.payloads.json`
- `mock-data/routes/person-detail.payloads.json`
- `mock-data/routes/memory-detail.payloads.json`
- `mock-data/routes/receipt-studio.payloads.json`
- `mock-data/routes/fab-menu.payloads.json`
- `mock-data/routes/agent-chat.payloads.json`
- `mock-data/routes/agent-voice.payloads.json`
- `mock-data/routes/upgrade-modal.payloads.json`
- `mock-data/routes/settings.payloads.json`
- `mock-data/routes/account.payloads.json`
- `mock-data/routes/plans.payloads.json`

### Mock infrastructure
- `mocks/mockProvider.ts`
- `mocks/useMockRoute.ts`
- `mocks/mockSessionStore.ts`
- `mocks/handlers/routes.ts`
- `mocks/handlers/agent.ts`

### Dev-only review controls
- `components/dev/mockDevConfig.ts`
- `components/dev/PersonaSwitcher.tsx`
- `components/dev/RouteStateSwitcher.tsx`
- `components/dev/MockControlPanel.tsx`

### Design references
- `design-references/hero-screens/README.md`
- `design-references/hero-screens/`

## Hero screen usage rule

Hero screen images are visual anchors, not standalone specs.

When implementing UI:
1. read `AGENTS.md`
2. read the relevant UX docs
3. review the matching hero screen(s)
4. use the mock payloads and persona defaults
5. build all route states, not only the best-looking populated state

## Current implementation target

The immediate Codex target is:

1. shell and navigation
2. Home
3. Things
4. People
5. Memories
6. Settings / Account
7. Plans / Upgrade
8. FAB / Agent entry
9. mocked data integration only

Backend integration should happen only after the mocked UX passes review.

## Required mocked states

Every major route must support:
- empty
- first-use
- loading
- populated
- error
- premium-conversion where relevant

## Tier summary

### Free
- first 100 receipts
- basic core experience

### Personal Pro
- unlimited receipts
- warranty/manual support
- stronger Things management

### Family Pro
- shared household context
- shared Things and Memories

### Family Trust
- dedicated tenant
- family network
- policies, property, trust-ready records
- future secure family-specific agent runtime

## Build rule

Do not drift into backend-first implementation.

The required sequence is:

1. mocked shell and routes
2. persona-driven UX review
3. route-level refinement
4. contract refinement against OpenAPI
5. full-stack vertical slices

## Notes for AI coding agents

Before writing code:
- read `AGENTS.md`
- read this file
- read route and shell docs
- use consumer UX labels
- respect security and tenancy assumptions
- preserve Family Trust headroom without forcing trust complexity into the initial consumer app

## Repo readiness checkpoint

This repo is considered ready for a Codex planning pass when:
- the docs above are committed
- the mock payload files are present
- the design reference PNGs are present
- `AGENTS.md` and this file are up to date

## Recommended Codex workflow

1. Read `AGENTS.md`
2. Read `docs-index.md`
3. Read the UX and data-model docs
4. Review mock payloads and hero screens
5. Produce a plan first
6. Execute in small PR-sized route slices

## Near-term implementation rule

Use mocked data first.
Do not connect real APIs until:
- shell and navigation are stable
- route states are reviewed
- UX wording and hierarchy are approved
- route data needs are validated against OpenAPI