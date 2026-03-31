# Hero Screens — Design References

This directory contains visual reference screens for Money to Memories.

These images are not final UI specs by themselves. They are visual anchors that support the route-by-route spec, mobile shell rules, and mocked UX build.

If live Figma nodes are available, pair these hero screens with the route registry in `design-references/figma/route-node-registry.json` so implementation can inspect the actual design structure, variables, and states through MCP.

## Purpose

Use these hero screens to:
- preserve product identity
- align on layout hierarchy
- guide route-specific mocks
- support Codex and frontend implementation decisions
- compare mocked output against intended UI quality

## Current reference themes

### Home
- search-forward landing surface
- strong CTA for adding purchases
- recent saved receipts
- lightweight spend/value summary

### Things
- consumer-friendly label for internal assets
- grouped visual overview
- treemap / visualization support
- quick actions: Returns, Warranty, Insurance

### People
- relationship-centered view
- circles/network concept
- household, gifts, and shared-spend relevance

### Memories
- timeline-first
- auto-created memory candidates
- confirmation and enrichment by the user
- linkage to receipt, place, time, and people

### Shell / Navigation
- bottom navigation with 4 destinations plus center dimple FAB
- standard drawer for account/system surfaces
- contextual action strip above the bottom bar

## Rules for implementers

1. Do not treat the hero screens as pixel-perfect final specs.
2. Do treat them as the desired visual and emotional direction.
3. Always combine these with:
   - `AGENTS.md`
   - `docs/ux/mobile-shell-v1.md`
   - `docs/ux/route-spec.md`
4. Preserve the consumer tone:
   - simple
   - distinct
   - not overly fintech-like
   - not enterprise/admin-like

## Notes for Codex / frontend work

When implementing a route:
- review the relevant hero screen(s)
- match the hierarchy and feel
- keep user-facing language aligned
- build all route states, not only the prettiest populated state

## Suggested contents

Recommended filenames:
- `home-hero.png`
- `things-hero.png`
- `people-hero.png`
- `memories-hero.png`
- `bottom-nav-reference.png`

If alternate concepts exist, keep them clearly named:
- `home-hero-v2.png`
- `things-alt-overview.png`

Avoid ambiguous file names.
