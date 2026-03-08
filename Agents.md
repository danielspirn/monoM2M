# AGENTS.md — Money to Memories

## 1. Mission

Money to Memories is a consumer-first, mobile-first product that helps people:

- capture purchases and receipts
- understand spending at the **line-item** level
- organize what they **own**
- connect purchases to **people, place, time, and memories**
- use an agent to ask questions and improve spending decisions

This is **not** a generic budgeting app.
The differentiated value is:

- line-item intelligence
- Things ownership and warranty support
- memory creation from real purchase activity
- people-linked spending context
- inflation-aware household understanding
- long-term headroom toward Family Pro and Family Trust

---

## 2. Product ladder

### Free
- first 100 receipts
- core Home, Things, People, Memories
- basic agent questions
- no advanced warranty / insurance flows
- no family collaboration

### Personal Pro
- unlimited receipts
- warranties and manuals
- better search and agent help
- better ownership support

### Family Pro
- shared household collaboration
- shared Things and Memories
- household-oriented people and context

### Family Trust
- dedicated tenant
- family network / multi-household coordination
- policies, property, trust-ready records
- future secure family-specific agent runtime

---

## 3. Core UX principles

Always optimize for **consumer clarity** and **mobile usefulness**.

### UX priorities
1. fast capture
2. immediate understanding
3. trustworthy item review
4. natural transition from purchases to Things
5. lightweight, meaningful Memories
6. grounded People context
7. agent access that feels useful, not gimmicky

### Do not drift into:
- enterprise admin UX
- bank-first architecture in the UI
- generic finance app patterns
- overcomplicated forms
- cluttered dashboards

---

## 4. Canonical UI labels

Use these UI labels consistently:

- **Home**
- **Things**
- **People**
- **Memories**

### Important naming rule
- User-facing label: **Things**
- Internal data-model term: **assets**

Do not expose “Assets” in the consumer UX unless explicitly required in a premium or admin-like context.

---

## 5. Mobile shell rules

The v1 shell is locked.

### Bottom navigation
Use exactly:

- Home
- Things
- center FAB
- People
- Memories

### FAB
The center FAB is the global action hub and sits in a **dimple/notch** in the bottom bar.

The FAB menu must include:

- Add Purchase
- Scan Receipt
- Upload Document
- Record Experience
- Ask Agent — Chat
- Ask Agent — Voice

### Drawer
Use a standard drawer for secondary/system surfaces:

- Account
- Settings
- Plan
- Upgrade
- Privacy & Security
- Help
- Sign Out

Do not place Settings, Account, or Plan in the bottom bar.

### Context action strip
A compact action strip sits above the bottom nav and changes by active tab.

Examples:
- Home: Recent, Review, Insights
- Things: Returns, Warranty, Insurance
- People: Household, Gifts, Shared
- Memories: Timeline, Map, People

---

## 6. Core route intent

### `/home`
Landing screen for search, capture, recent receipts, and lightweight value summary.

### `/things`
Consumer view of what the user bought and owns.
Should support overview, categories, drilldowns, returns, warranty, and insurance entry points.

### `/people`
Relationship-centered view tied to purchases, gifts, events, and household context.

### `/memories`
Timeline-first view of auto-created memory candidates and confirmed memories.

### `/settings`
App preferences.

### `/account`
Profile, login, sessions, household membership, billing summary.

### `/plans`
Plan comparison and upgrade surfaces.

---

## 7. Memory model rules

Memories are **system-assisted**, not purely manual.

The system should create **memory candidates** from:
- receipt timing
- merchant type
- location patterns
- clustered purchases
- signals like dining, events, movies, travel, gifts

The user can then:
- confirm
- rename
- add people
- add notes
- merge related receipts

### Memory states
Use:
- `candidate`
- `confirmed`
- `dismissed`

Timeline is the default lens in Memories.

---

## 8. Data model principles

The product is built on a **fact-first** model.

Canonical flow:

`source_document -> extraction_run -> purchase_event -> purchase_line_item -> product -> asset/thing -> memory`

### Key rules
- raw facts come before interpretation
- all extracted fields should be traceable to evidence where possible
- line items are first-class
- merchant normalization and product matching are core workflows
- multiple classification systems may apply to the same object

### Core model objects
- tenants
- households
- people
- source_documents
- extraction_runs
- evidence_spans
- merchants
- purchase_events
- purchase_line_items
- products
- assets
- memories
- tags
- document_links
- purchase_participants
- subscriptions
- entitlements
- agent_sessions
- agent_messages

---

## 9. Classification rules

Do not force one taxonomy.

Use parallel classification systems:

### Structured entities
- merchant
- brand
- product
- person
- location
- property
- policy

### Tag frameworks
- tax
- household
- lem
- ownership
- location_context
- vendor_context

### LEM rule
LEM is a **meaning layer**, not the primary system of record.
Do not make the app depend on LEM to function.

---

## 10. Tenancy rules

### Lower tiers
Free, Personal Pro, and Family Pro are **multi-tenant**.

### Family Trust
Family Trust is **single-tenant / dedicated**.

### Top-level architecture
Use:

`tenant -> family_network (optional) -> household -> records`

Household is the daily-life unit.
Family Network is the extended-family / Trust-tier coordination layer.

Do not assume household is the only grouping concept.

---

## 11. Security and compliance rules

Design for **SOC 2 readiness from day 1**.

### Non-negotiables
- least privilege
- tenant isolation
- household-scoped authorization
- private-by-default document handling
- no public document URLs
- short-lived signed access
- audit logging for sensitive writes
- secure secrets handling
- no sensitive data leakage in logs
- all agent tool calls must respect real user permissions

### Important
This product handles:
- receipts
- financial behavior
- household relationships
- warranties and insurance records
- future trust-sensitive records

Treat all sensitive records accordingly.

---

## 12. Agent rules

The agent is a core product surface.
It must be **grounded** and **tool-based**.

### The agent must:
- answer from user data and linked records
- cite internal sources where possible
- ask for clarification when needed
- never bypass authorization
- never invent ownership, warranty, policy, or product facts

### Agent modes
- Chat
- Voice

### Agent persistence
Store sessions and messages so user interactions can be resumed and audited.

---

## 13. Build philosophy

Bias toward **front-to-back UX-first implementation**.

### Required sequence
1. mocked shell and routes
2. mocked persona-driven states
3. route-level UX review
4. contract refinement against OpenAPI
5. full-stack vertical slices

Do **not** build backend-first and “attach UI later.”

### Initial build slices
1. shell and navigation
2. Home
3. Things
4. People
5. Memories
6. Settings + Account
7. Plan + Upgrade
8. Agent entry flows
9. then backend integration

---

## 14. Mocking and development rules

Use mocked data first.

### Context sources
- persona pack
- route-state pack
- hero screens
- route-by-route screen spec
- OpenAPI v1.1
- schema pack v1.1

### Every major route must include
- empty state
- first-use state
- loading state
- populated state
- error state
- premium-conversion state where relevant

### Persona switcher
In dev mode, support persona switching across the main scenarios so UX can be tested against different life contexts.

---

## 15. Component and frontend rules

Current direction:
- mobile-first
- universal app approach
- high reuse across mobile and web
- strong charting and exploratory views where useful

### Preferred direction
- React Native / Expo + web-compatible structure
- shared route logic and component contracts
- ECharts for visualizations where they truly add value

### Important
Do not over-import desktop web component patterns into the mobile consumer shell.

---

## 16. Conversion and premium rules

Upgrade prompts must be **contextual**, not generic.

### Good conversion moments
- receipt limit reached
- user taps Warranty
- user taps Insurance
- user tries to add more docs / advanced ownership data
- user tries to add family collaboration
- user tries to export premium records

### Avoid
- random upgrade spam
- upgrade prompts detached from user intent

---

## 17. Source-of-truth files

When starting work, read these first if present:

- `AGENTS.md`
- `docs-index.md`
- `docs/master-spec/`
- `docs/data-model/`
- `docs/ux/`
- `contracts/openapi/`
- `mock-data/personas/`
- `mock-data/routes/`
- `design-references/`

If instructions conflict:
1. `AGENTS.md`
2. route-specific docs
3. OpenAPI contracts
4. older specs

---

## 18. Code change rules

When implementing, prefer:
- small, reviewable PRs
- route-by-route progress
- explicit typing
- no unnecessary abstractions
- no speculative architecture beyond current slice
- clear TODOs when future Family Trust hooks are intentionally deferred

### Preserve headroom for:
- family networks
- properties
- policies
- advisor roles
- dedicated Family Trust tenant mode

But do not force those workflows into the consumer MVP UI unless required.

---

## 19. PR acceptance checklist

Before opening a PR, verify:

- Does this preserve the v1 shell rules?
- Does it use the correct consumer labels?
- Does it support mobile ergonomics?
- Does it respect plan gating?
- Does it avoid exposing internal jargon?
- Does it preserve security constraints?
- Does it align with the current OpenAPI / schema artifacts?
- Does it include relevant empty/loading/error states?
- Does it avoid generic-finance-app UX drift?

---

## 20. Immediate priority

The immediate goal is to ship a mocked, high-quality v1 consumer experience for:

- Home
- Things
- People
- Memories
- FAB / Agent entry
- Settings / Account / Plan

Only after that UX checkpoint passes should deeper backend implementation proceed.