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

Status:
- complete

Shipped:
- parsed field candidates now carry evidence links
- parsed line-item candidates now carry evidence links
- Receipt Studio shows evidence-backed parsed output and supports rerun
- rerun timing now tracks the extraction run instead of original receipt creation

Success signal:
- every important reviewed field in Receipt Studio has evidence linkage

### Next

#### Slice 10: Live Receipt Studio persistence

Status:
- complete

Shipped:
- reviewed merchant, date, total, and line-item edits now save quietly in Receipt Studio
- saved edits update parsed, evidence, structured, and search layers together
- trusted review now rides on top of stored reviewed values instead of display-only state

Success signal:
- live OCR receipts can be corrected and trusted without dropping back to mock-only behavior

#### Slice 11: Real structured purchase graph

Status:
- complete

Shipped:
- trusted receipts now store durable purchase-event records
- trusted receipts now store durable purchase-line-item records
- durable graph records refresh after reviewed edits
- merchant resolution hooks and product candidate placeholders now live on stored records

Success signal:
- reviewed live receipts begin feeding Home, Things, People, and Memories from real records

### Later

#### Slice 12: Thing promotion and ownership support

Status:
- complete

Shipped:
- promoted Things now carry receipt-linked ownership support fields
- returnability and warranty stubs now flow through promoted Thing records
- Things detail now surfaces receipt-linked ownership support and document linkage

Success signal:
- durable-goods receipts feel more valuable than archive-only storage

#### Slice 13: PDF and multi-receipt live OCR

Status:
- complete

Shipped:
- backend OCR contract now supports document mode and grouped receipt candidates
- Gemini adapter now preserves multi-receipt candidates and PDF-aware mode
- smoke and helper scripts now summarize grouped candidate counts

Success signal:
- grouped uploads and PDFs use a backend shape that no longer assumes one receipt per document

#### Slice 14: OpenAI live fallback

Status:
- complete

Shipped:
- live OpenAI Responses API adapter added as a real OCR sibling to Gemini
- backend and smoke paths now share the same structured OCR contract
- live request shape validated against the current OpenAI strict schema rules

Notes:
- the local live smoke request reached OpenAI and then failed on `insufficient_quota`, so code path is working but the current API account needs billable quota for full runtime validation

Success signal:
- fallback vendor can be activated intentionally for approved cases

#### Slice 15: Semantic retrieval

Status:
- complete

Shipped:
- receipt search documents now carry deterministic embedding terms
- hybrid search hook added over trusted receipts
- synonym expansion now finds receipts without exact wording matches

Success signal:
- users can find purchases without exact wording matches

#### Slice 16: Agent grounding

Status:
- complete

Goal:
- answer receipt questions from evidence-backed records

Deliver:
- agent retrieval over receipt and evidence IDs
- source citation hooks
- permission-aware query path

Shipped:
- grounded receipt-answer helper now retrieves only from trusted receipt records
- default chat and voice agent payloads now cite receipts, Things, people, and evidence-backed review surfaces
- trusted receipt questions now fall back to grounded summaries instead of static mock copy when live data exists

Success signal:
- the agent can answer receipt questions without inventing facts

## Remaining estimate

As of 2026-03-31:

- 6 macro slices
- 16 executable slices
- 16 complete
- 0 active
- 0 still ahead in this roadmap

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

This roadmap is complete.

That is the shortest path from today’s live Gemini progress to a real end-user receipt workflow.

## Post-roadmap expansion

#### Slice 17: Structured purchase participants

Status:
- complete

Shipped:
- projected `purchase_participants` records now sit alongside `purchase_events`
- People summaries can read structured purchase involvement instead of only reverse-inferring from receipts
- Person detail now shows purchase participation role, line-item count, linked Things, linked memories, and spend share

Success signal:
- person context is grounded in explicit purchase participation facts instead of only loose relationship links

#### Slice 18: Structured document links

Status:
- complete

Shipped:
- projected `document_links` now connect raw source documents to purchase events, Things, warranties, and memory candidates
- Thing detail exposes the document-link graph alongside the narrower linked-documents list
- document lineage is now represented as a first-class fact layer instead of only embedded IDs

Success signal:
- ownership and memory surfaces can explain how a raw uploaded document grounds downstream records

#### Slice 19: Structured tag graph

Status:
- complete

Shipped:
- projected tag records now exist for tax, lifestyle, product category, household, LEM, and vendor context
- Thing detail exposes those tags as a first-class graph instead of only inheriting scattered arrays
- downstream slices now have a stable tag layer for search, grouping, and future agent grounding

Success signal:
- trusted purchase records can be grouped and queried through a real tag graph rather than only ad hoc field arrays

#### Slice 20: Structured semantic records

Status:
- complete

Shipped:
- projected semantic records now represent the embedded retrieval layer for trusted receipts
- semantic search now resolves through explicit projected retrieval records instead of reading only receipt-local fields
- Thing detail now shows a retrieval profile with embedding version, keyword count, term count, and preview text

Success signal:
- the embedded/search layer is a first-class record type that future retrieval and agent slices can reuse directly

#### Slice 21: Structured provenance records

Status:
- complete

Shipped:
- projected source-document records now expose raw capture provenance for trusted purchases
- projected extraction-run records now expose OCR/provider/parser lineage as first-class records
- Thing detail now shows capture provenance alongside retrieval, tags, and document links

Success signal:
- ownership surfaces can explain both what was bought and how the trusted record was captured and extracted

#### Slice 22: Structured return support records

Status:
- complete

Shipped:
- projected return-support records now represent returnability as a first-class ownership-support layer
- Thing detail now shows return support next to warranty and linked documents
- downstream return workflows can now depend on explicit records instead of only inferred labels

Success signal:
- return windows are represented as stable support records rather than only a field or badge on the Thing

#### Slice 23: Structured evidence records

Status:
- complete

Shipped:
- projected evidence records now expose receipt grounding as first-class graph records
- Thing detail now shows evidence links for promoted items
- future agent and review flows can reuse the same evidence layer instead of reading only receipt-local spans

Success signal:
- ownership surfaces can point back to concrete evidence records that grounded the promoted Thing

#### Slice 24: Structured policy records

Status:
- complete

Shipped:
- projected policy records now connect return and warranty support into a first-class policy layer
- Thing detail now shows unified policy records alongside the narrower return and warranty cards
- future property, insurance, and family-trust flows can attach to explicit policy records instead of only support stubs

Success signal:
- return and warranty support are available through a single structured policy layer tied to the promoted Thing
