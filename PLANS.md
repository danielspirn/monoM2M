# PLANS.md

## Current milestone
Milestone 1 — UX Shell and Mocked Primary Routes

## Goal
Build the first reviewable consumer UX for Money to Memories using mocked data only.

## Included
- mobile shell
- drawer
- bottom navigation with center dimple FAB
- context action strips
- Home
- Things
- People
- Memories
- Settings
- Account
- Plans
- persona switcher
- route-state switcher
- mock provider integration
- FAB actions for add / ask

## Excluded
- backend integration
- live API wiring
- auth
- billing
- persistence
- document upload implementation
- real receipt extraction
- production agent implementation

## Acceptance criteria
- routes render with mocked data
- shell matches v1 mobile-shell spec
- consumer labels are correct
- all major route states exist
- premium conversion surfaces are contextual
- no backend dependency is required to review UX

## Validation
- typecheck passes
- lint passes
- basic route smoke tests pass