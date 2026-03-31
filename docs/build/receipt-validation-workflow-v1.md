# Money to Memories — Receipt Validation Workflow v1

## Purpose

This document defines how we should validate the receipt-capture system with real fixture files before we harden deeper ingestion and extraction contracts.

## Recommendation

Start with repo-local fixtures you upload.

That should be the default path because it validates the real product workflow rather than a synthetic benchmark.

Then supplement with:
- public sample receipts for variety
- synthetic fixtures for specific edge cases

If your raw files already live in `receipt_images/`, index them first with:

`npm run receipts:index-fixtures`

That gives us:
- a generated file catalog
- duplicate-file groups
- curated starter scenarios tied to your real uploads

Run the focused receipt fixture harness with:

`npm run test:receipts`

That exercises real uploaded files through the current mock intake model for:
- quiet single-receipt processing
- non-retail receipt handling
- duplicate alerting
- batch capture lineage

## Preferred validation order

1. your own clear single-receipt examples
2. your own multi-receipt photos
3. your own durable-goods and grocery mixes
4. public or synthetic duplicate and low-confidence edge cases

## What to validate in each run

Every fixture should be checked against these steps:

1. raw document preserved correctly
2. source document split into the right number of receipts
3. duplicate risk surfaced only when appropriate
4. merchant enrichment applied where available
5. line items extracted and categorized reasonably
6. tax, lifestyle, and product tags applied sensibly
7. warranty and returnability hints surfaced only when justified
8. no unnecessary confirmation or setup shown to the user

## UX acceptance rule

The happy path should feel like:

`upload -> process quietly -> review only if needed`

If a test fixture requires repeated confirmation without a real issue, we should treat that as a product problem to fix.

## Immediate next action

Put 3 to 6 representative files into [test/fixtures/receipts/README.md](/Users/danielspirn/Documents/dev/monoM2M/monoM2M/test/fixtures/receipts/README.md) under the scenario folders described there.

Best first set:
- one clear grocery receipt
- one clear durable-goods receipt
- one multi-receipt photo with at least 3 receipts
- one duplicate pair
- one low-confidence photo
