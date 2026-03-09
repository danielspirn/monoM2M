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