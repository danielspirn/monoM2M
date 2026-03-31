# PLANS.md

## Current milestone
Milestone 2.0 — Core Experience Buildout

## Goal
Turn the mocked shell into a believable, interactive prototype centered on the relationship between receipts, Things, People, and Memories.

## Included
- upgraded Home dashboard with recent activity, reminders, relationship summaries, and add prompts
- second-level detail routes for Thing, Person, and Memory
- richer Things, People, and Memories overview screens
- shared mock universe reused across routes so linked entities stay coherent
- Add Actions bottom sheet and lightweight mocked creation flows
- improved Ask Agent Chat and Ask Agent Voice mocked experiences
- treemap, bubble chart, and selective micro-visual summaries where they improve comprehension
- reusable internal patterns for headers, sections, summary cards, detail headers, related sections, empty states, action sheets, and metadata rows

## Excluded
- backend integration
- live API wiring
- production auth
- billing
- persistence
- production-grade upload or camera handling
- real receipt extraction
- production agent implementation
- full visual polish pass

## Acceptance criteria
- Home feels like a real dashboard rather than a shell placeholder
- Things, People, and Memories each support overview and detail states
- Add Actions launches useful mocked create flows
- entity relationships are visible across Home, Things, People, Memories, and agent surfaces
- mock data is coherent and reused across the app
- charts and visual summaries support product understanding without overwhelming the mobile shell
- no backend dependency is required to review the UX

## Validation
- typecheck passes
- lint passes
- tests pass
- production build passes
