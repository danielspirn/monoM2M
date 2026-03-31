# IMPLEMENT.md

Follow `PLANS.md` as the source of truth.

## Rules
- stay within the current milestone
- do not broaden scope
- keep code modular and reviewable
- prefer mocked data over stubbed backend calls
- preserve future Family Trust headroom without surfacing trust complexity in the consumer UI
- follow AGENTS.md at all times

## Required validation
After each meaningful step:
- run typecheck
- run lint
- fix failures immediately

Before finishing:
- confirm route coverage
- confirm mocked states
- confirm persona-switching still works
- summarize deferred items

## Frozen patterns for Milestone 2
- keep the secondary action strip above the primary bottom navigation inside the shell bottom chrome
- keep the branded top-toolbar pattern for Things, People, and Memories, with reusable support copy and selected-view treatment
- keep primary route canvases as single-column stacked sections with full-width content cards
- keep reusable section blocks, summary metric bands, entity rows, detail headers, related-item sections, and label/value metadata rows as the baseline internal UI grammar
- keep Add Actions as a bottom-sheet action model that branches into lightweight mocked create sheets instead of route-specific one-offs
- keep the shared mock universe as the source for receipts, things, people, memories, and their links so route depth stays coherent
- keep Things and People visualizations mock-driven at the route layer until Milestone 2 contracts are finalized
- keep agent result cards structured and linkable into entity routes rather than freeform chat-only responses
