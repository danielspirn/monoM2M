# Money to Memories — Receipt Core Plan v1

## Purpose

This document defines the next development focus after the mocked shell and route foundation: make receipt capture and receipt understanding the core operational slice of the product.

The receipt is the evidence anchor for:
- what was purchased
- when it was purchased
- where it was purchased
- who it may involve
- which line items matter
- which Things can be created
- which return, warranty, and later insurance flows become possible

This should not be treated as a generic OCR feature. It is the root of the purchase graph.

## Product stance

The canonical receipt flow remains:

`source_document -> extraction_run -> purchase_event -> purchase_line_item -> product -> asset/thing -> memory`

For the next wave, we should explicitly treat each receipt as having four useful representations:

1. raw data
2. parsed data
3. structured data
4. embedded data

Each layer serves a different product need and should be preserved separately.

## Workflow validation guardrails

Before backend contracts harden, we should validate the real end-user capture flow so we do not accidentally model the system around internal processing convenience.

### Expected capture experience
- one upload may contain one receipt or many receipts
- the system should split a multi-receipt image, email bundle, or video capture into independent receipts
- each detected receipt should still retain its shared source-document lineage
- the user should not be forced through repeated confirmation for each receipt unless a real issue is detected

### Data-shape implication

Do not assume:

`one source_document = one receipt`

Instead, preserve headroom for:

`one source_document -> many detected receipts -> many purchase_events`

That fan-out is important for:
- multi-receipt photos
- long receipt rolls
- email-forwarded bundles
- video or scanning capture of piles of receipts

### UX implication

Capture should feel:
- point, click, done
- quiet by default
- interruptive only for duplicate risk, low-confidence extraction, or genuinely ambiguous review cases

This means our model should support batch context and issue-only alerts without forcing the user into a receipt-by-receipt setup wizard.

## The four receipt layers

### 1. Raw data

Raw data is the preserved evidence layer.

It includes:
- original uploaded image or PDF
- file metadata
- capture metadata
- page images or page references
- checksums and content fingerprints
- source type such as camera scan, upload, email-forwarded document, or manual import

Core objects:
- `source_documents`
- `document_pages`
- `document_links`

Rules:
- never discard the original receipt file after extraction
- preserve page-level traceability
- use private-by-default storage and short-lived signed access
- retain enough metadata to re-run extraction later

### 2. Parsed data

Parsed data is the extraction layer before we claim normalized truth.

It includes:
- OCR text
- text blocks and reading order
- merchant candidates
- purchase date candidates
- subtotal, tax, tip, total candidates
- line item candidates
- payment hints
- return policy text candidates
- warranty-related text candidates
- confidence and parser provenance

Core objects:
- `extraction_runs`
- `evidence_spans`

Rules:
- preserve extraction provenance by run
- keep multiple candidate interpretations when confidence is low
- separate parser output from user-confirmed structured fields
- make all user-visible corrections traceable back to evidence

### 3. Structured data

Structured data is the consumer-facing operational truth that powers Home, Things, People, Memories, and the agent.

It includes:
- normalized merchant
- purchase event header
- purchase line items
- product matches
- Thing candidates and created Things
- purchase participants
- return-window facts when confidently available
- warranty facts when confidently available

Core objects:
- `merchants`
- `merchant_locations`
- `purchase_events`
- `purchase_line_items`
- `products`
- `assets`
- `warranties`
- `purchase_participants`

Rules:
- the receipt remains the root evidence, but structured fields are the app operating layer
- line items are first-class and reviewable
- merchant normalization and product matching are explicit workflows
- uncertain return and warranty data should remain suggested until reviewed or confirmed

### 4. Embedded data

Embedded data is the semantic retrieval layer for search and agent grounding.

It includes embeddings over:
- full OCR text
- merchant plus header summary
- line item descriptions
- policy snippets
- warranty snippets
- user review notes

Primary uses:
- semantic search across receipts and purchases
- agent grounding and citation retrieval
- clustering similar purchases or merchants
- future duplicate detection and product resolution support

Rules:
- embeddings should be derived from the raw and parsed layers, not replace them
- every retrieved semantic result should still point back to a real receipt or evidence span
- embeddings must respect tenant and household authorization boundaries

## User-facing development goals

The next product wave should make these flows feel real:

### Capture
- scan a receipt from the FAB
- upload a receipt image or PDF
- upload one image with multiple receipts and let the system split them automatically
- support email-forwarded receipt bundles and video capture without changing the downstream receipt model
- create the receipt record immediately
- show upload and processing status quickly

### Review
- open Receipt Studio while extraction is running or once it completes
- review merchant, purchase date, total, and line items
- inspect evidence for any doubtful field
- correct misread line items without friction

### Structure
- normalize the merchant
- confirm or edit line items
- tag people where useful
- suggest memory linkage where useful
- convert meaningful line items into Things

### Ownership and support
- identify likely durable-goods purchases
- surface possible return windows
- create warranty stubs from supported purchases
- keep supporting documents tied to the Thing when the user upgrades

### Search and agent
- search receipts by merchant, item, date, amount, and meaning
- let the agent answer grounded receipt questions
- cite receipts or evidence when answering

## Proposed development slices

### Slice 1: Receipt intake foundation

Goal:
Create a real receipt record and preserve the original document.

Deliver:
- intake contract for `source_document`
- upload flow for image and PDF
- persisted capture metadata
- processing job creation
- receipt status lifecycle such as `uploading`, `processing`, `needs_review`, `trusted`, `failed`

Success signal:
The user can capture a receipt and reliably return to it later.

### Slice 2: Extraction and evidence grounding

Goal:
Produce parsed output without prematurely flattening it into final truth.

Deliver:
- OCR or parser integration point
- `extraction_runs`
- field candidates with confidence
- line item candidates
- evidence spans for header fields and line items
- re-run capability

Success signal:
Every important extracted field shown in UI can be traced back to document evidence.

### Slice 3: Receipt Studio vertical slice

Goal:
Turn extraction into a trustworthy mobile review workflow.

Deliver:
- real `/receipts/{receiptId}` review surface
- merchant, date, amount, and line-item editing
- selected line evidence preview
- save and submit review
- error and retry states

Success signal:
A user can fix extraction errors on-device without admin-style complexity.

### Slice 4: Structured purchase graph

Goal:
Persist reviewed output into the core consumer model.

Deliver:
- `purchase_events`
- `purchase_line_items`
- merchant resolution hooks
- product match fields
- Thing candidate flags
- people and memory suggestion hooks

Success signal:
Reviewed receipts begin feeding Home, Things, People, and Memories coherently.

### Slice 5: Ownership support

Goal:
Make durable purchases more valuable than a simple receipt archive.

Deliver:
- convert line item to Thing
- warranty stub creation
- document linking for manuals, warranty docs, and receipt images
- return-policy extraction capture as suggested data

Success signal:
The product starts feeling like ownership intelligence, not just receipt storage.

### Slice 6: Semantic retrieval

Goal:
Make receipt history searchable in a way normal finance apps are not.

Deliver:
- embedding pipeline for receipt-derived searchable text
- hybrid search over merchant, line item, and semantic meaning
- agent retrieval hooks tied to receipt and evidence IDs

Success signal:
Users and the agent can find purchases even when exact words differ from the receipt text.

## Suggested schema and contract refinements

The current OpenAPI already supports a good first wave, but the receipt core will likely need the following additions or refinements:

- explicit `source_document` and `extraction_run` read models
- richer receipt processing statuses and job metadata
- receipt-level document metadata including checksum, page count, and storage state
- evidence collections rather than a single evidence object on the review screen
- structured return-policy and warranty candidate models with confidence and evidence links
- search endpoints that distinguish keyword filters from semantic retrieval

These should be refined after the first live receipt vertical slice proves the UX.

## UX rules for this milestone

- keep receipt review mobile-first and thumb-friendly
- show confidence and evidence only where it builds trust
- avoid finance-dashboard jargon
- never expose internal terms like `assets` in the receipt flow
- keep manual correction lighter than the pain of living with a bad extraction
- do not over-gate basic receipt trust-building actions behind premium

## Plan gating

### Free
- receipt capture
- receipt storage
- basic review and line-item correction
- basic search

### Personal Pro
- advanced warranty and manual support
- deeper ownership workflows
- stronger semantic search and agent help

### Family Pro
- shared household visibility where authorization allows

Warranty and advanced document support are good upgrade moments, but core receipt trust should stay in the free experience.

## Recommended execution order

1. Real receipt intake plus raw document storage
2. Extraction runs plus evidence spans
3. Real Receipt Studio backed by live data
4. Purchase event and line item persistence
5. Convert-to-Thing plus warranty stub flow
6. Search and embedding pipeline
7. Agent grounding over receipt evidence

## Immediate implementation target

The next concrete build target should be:

1. real `source_document` creation
2. upload and processing lifecycle
3. real receipt review route backed by `extraction_runs`
4. structured persistence into `purchase_events` and `purchase_line_items`

Search, warranty enrichment, and richer agent flows should land immediately after that foundation is stable.
