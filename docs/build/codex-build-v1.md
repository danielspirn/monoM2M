# Money to Memories — Codex Build v1

## Purpose

This document defines the first implementation wave for Codex.

## Build philosophy

Bias toward:
- UX-first
- mocked data first
- route-level quality
- small PRs
- contract alignment after UI direction is proven

Do not build backend-first.

## Build order

### Wave 1 — Shell and navigation
Build:
- top app bar
- standard drawer
- bottom navigation with center dimple FAB
- tab-specific action strips
- mobile-safe layout

### Wave 2 — Primary route mocks
Build:
- Home
- Things
- People
- Memories

### Wave 3 — Secondary route mocks
Build:
- Settings
- Account
- Plan / Upgrade

### Wave 4 — Agent entry flows
Build:
- Ask Agent — Chat
- Ask Agent — Voice
- route-aware prompt suggestions

### Wave 5 — Contract refinement
Review route needs against OpenAPI and update contracts if necessary.

### Wave 6 — Full-stack vertical slices
Start wiring:
1. ingest and receipt review
2. Things and warranties
3. People and Memories
4. Plan gating
5. agent persistence

## Required mocked states

Every major route must include:
- empty
- first-use
- loading
- populated
- error
- premium-conversion

## Required context inputs

Codex should read:
- AGENTS.md
- docs-index.md
- data model v1.1
- mobile shell spec
- route spec
- personas overview
- OpenAPI v1.1
- mock persona data
- design reference hero screens

## PR rules

- small and reviewable
- route-by-route
- no backend coupling too early
- preserve Family Trust headroom
- do not expose internal jargon in UX
- respect security constraints