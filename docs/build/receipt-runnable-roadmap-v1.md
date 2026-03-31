# Receipt Runnable Roadmap v1

Date: 2026-03-31

This document converts the receipt-core plan into an executable roadmap that can be worked slice by slice without needing constant user intervention.

## Roadmap shape

Macro plan:

1. receipt intake foundation
2. extraction and evidence grounding
3. Receipt Studio vertical slice
4. structured purchase graph
5. ownership support
6. semantic retrieval and agent grounding

Execution plan:

12 reviewable implementation slices

## Slice board

### Done

#### Slice 1: Mocked receipt intake foundation

Status:
- complete

Shipped:
- capture flow
- multi-receipt batch support
- quiet issue-only alerts
- source document lineage in mock state

#### Slice 2: Mocked structured purchase projection

Status:
- complete

Shipped:
- projected `purchase_events`
- projected `purchase_line_items`
- projected Thing candidates
- Home and Things fed from reviewed receipts

#### Slice 3: Fixture-driven receipt validation

Status:
- complete

Shipped:
- indexed receipt image library
- curated fixture scenarios
- duplicate validation
- batch lineage validation

#### Slice 4: OCR vendor seam and eval policy

Status:
- complete

Shipped:
- provider-neutral OCR routing layer
- Gemini primary route
- OpenAI fallback policy
- eval thresholds and fallback gates

#### Slice 5: Backend OCR adapter scaffold

Status:
- complete

Shipped:
- backend-only provider config
- secret readiness checks
- request envelope preparation
- live-call boundary separated from client code

#### Slice 6: Live Gemini smoke and curated eval

Status:
- complete

Shipped:
- real Gemini image OCR smoke command
- curated live eval command
- merchant/date normalization
- service-invoice line-item prompt improvement

### In progress

#### Slice 7: Live OCR into receipt workflow

Status:
- complete

Goal:
- use live Gemini OCR for unknown uploaded images while keeping known fixtures deterministic

Deliver:
- stored Gemini OCR snapshots for real uploaded files
- parser support for OCR-derived item candidates on uncurated files
- merchant directory foundation
- object directory foundation
- live backend OCR result shape mapped into receipt parser output
- feature-flagged path for unknown uploads
- fallback to manual seed only on hard OCR failure
- keep nonstandard docs review-first

Success signal:
- unknown uploaded images enter Receipt Studio with real OCR-derived candidates instead of generic seed text

#### Slice 8: Persist parsed extraction runs

Status:
- complete

Shipped:
- durable parsed-layer records stored alongside each live receipt
- stored field candidates and line-item candidates
- stored provider metadata and request provenance
- Receipt Studio now shows parser provenance for reopened receipts

Success signal:
- a receipt can be reopened and show the same parsed candidates without rerunning OCR

### Next

#### Slice 9: Evidence grounding

Goal:
- make important fields traceable back to evidence

Deliver:
- evidence span model for merchant, date, total, and line items
- UI evidence trail backed by stored evidence
- retry and rerun support

Success signal:
- every important reviewed field in Receipt Studio has evidence linkage

#### Slice 10: Live Receipt Studio persistence

Goal:
- let reviewed edits become durable structured truth

Deliver:
- save reviewed merchant/date/total/line items
- retry and error states for live data
- trusted review submission backed by stored parsed-layer records

Success signal:
- live OCR receipts can be corrected and trusted without dropping back to mock-only behavior

#### Slice 11: Real structured purchase graph

Goal:
- persist trusted output into actual structured records

Deliver:
- durable `purchase_events`
- durable `purchase_line_items`
- merchant resolution hooks
- product match placeholders

Success signal:
- reviewed live receipts begin feeding Home, Things, People, and Memories from real records

### Later

#### Slice 12: Thing promotion and ownership support

Goal:
- turn durable purchases into ownership intelligence

Deliver:
- convert line item to Thing
- returnability facts
- warranty stub creation
- document linking

Success signal:
- durable-goods receipts feel more valuable than archive-only storage

#### Slice 13: PDF and multi-receipt live OCR

Goal:
- expand beyond single-image live OCR

Deliver:
- Gemini Files API or equivalent PDF path
- live multi-receipt splitting
- long receipt handling

Success signal:
- grouped uploads and PDFs use real OCR instead of fixture shortcuts or mock fallback

#### Slice 14: OpenAI live fallback

Goal:
- make vendor switching real, not only planned

Deliver:
- live OpenAI adapter
- shadow comparison
- cost and quality reporting

Success signal:
- fallback vendor can be activated intentionally for approved cases

#### Slice 15: Semantic retrieval

Goal:
- make receipt history meaningfully searchable

Deliver:
- embedding pipeline
- hybrid search
- receipt retrieval hooks

Success signal:
- users can find purchases without exact wording matches

#### Slice 16: Agent grounding

Goal:
- answer receipt questions from evidence-backed records

Deliver:
- agent retrieval over receipt and evidence IDs
- source citation hooks
- permission-aware query path

Success signal:
- the agent can answer receipt questions without inventing facts

## Remaining estimate

As of 2026-03-31:

- 6 macro slices
- 16 executable slices
- 6 complete
- 1 active
- about 9 still ahead after the current active slice

## Autonomy rules

The default execution rule should be:

`keep moving unless blocked by credentials, destructive consequences, or a user-facing product decision with non-obvious tradeoffs`

### Safe to continue without asking

- parser and OCR quality improvements
- eval harness expansion
- contract refinement
- backend adapter work
- persistence wiring
- tests, docs, and verification

### Pause and ask only if blocked by

- new external accounts or credentials
- production infrastructure choices
- data migration or destructive schema resets
- ambiguous product behavior with materially different user outcomes

## Practical expectation

This roadmap is runnable with long autonomous stretches, but not literally infinite unattended execution inside one chat response.

What is realistic:

- work through multiple slices in sequence with minimal intervention
- continue until a real blocker appears
- use automation to re-open work on a schedule

What is not realistic:

- guarantee uninterrupted all-night completion with zero pauses if external APIs, infrastructure, or ambiguous edge cases appear

## Next active slice

Start with:

1. live OCR into receipt workflow for unknown uploads
2. persist parsed extraction runs
3. evidence grounding for key receipt fields

That is the shortest path from today’s live Gemini progress to a real end-user receipt workflow.
