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

## Source of truth hierarchy

When instructions conflict, use this priority order:

1. `AGENTS.md`
2. route-specific UX docs in `docs/ux/`
3. data model in `docs/data-model/`
4. OpenAPI contract in `contracts/openapi/`
5. older archived docs or design notes

## Product summary

Money to Memories is a consumer-first, mobile-first product that helps people:
- capture purchases and receipts
- understand spending at the line-item level
- organize what they own as **Things**
- connect purchases to people, place, time, and memory
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

## Mocking and development inputs

When building mocked flows, use:
- `mock-data/personas/`
- `mock-data/routes/`
- `design-references/hero-screens/`

Every primary route must support:
- empty state
- first-use state
- loading state
- populated state
- error state
- premium-conversion state where relevant

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