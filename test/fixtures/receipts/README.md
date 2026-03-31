# Receipt Test Fixtures

This directory is the shared fixture lane for validating the receipt-capture workflow with real images and documents.

## Why this exists

The product is moving beyond mocked receipt summaries.

Before backend contracts and extraction flows harden, we need a repeatable way to validate:
- one upload with one receipt
- one upload with multiple receipts
- duplicate detection
- low-friction happy path
- issue-only alerts
- retailer enrichment
- line-item extraction quality
- returnability and warranty hints
- tax, lifestyle, and product-category tagging

## Recommended first step

Use real fixtures you upload into this repo first.

That is the best starting point because:
- it matches the actual end-user capture flow we care about
- it lets us test the merchants and layouts you expect in practice
- it avoids us overfitting to internet samples that may not match your target users

After that, we can supplement with public or synthetic fixtures for edge cases.

## Where to put files

Put images or PDFs here, grouped by scenario:

- `test/fixtures/receipts/single/`
- `test/fixtures/receipts/multi/`
- `test/fixtures/receipts/pdf/`
- `test/fixtures/receipts/duplicates/`
- `test/fixtures/receipts/low-confidence/`
- `test/fixtures/receipts/durable-goods/`

Use clear names such as:

- `single/trader-joes-grocery-01.jpg`
- `multi/floor-photo-3-receipts-01.jpg`
- `pdf/apple-store-email-receipt-01.pdf`
- `duplicates/target-air-fryer-01.jpg`
- `duplicates/target-air-fryer-02.jpg`
- `low-confidence/crumpled-cvs-01.jpg`
- `durable-goods/ikea-storage-bench-01.jpg`

## How to annotate scenarios

Use `test/fixtures/receipts/manifest.json` as the source of truth for what each fixture should prove.

Each scenario should describe:
- what the upload contains
- how many receipts should be detected
- whether quiet processing is expected
- which issues, if any, should alert the user
- what enrichment or tagging should appear

If you already have a large raw corpus in `receipt_images/`, generate the indexed receipt library with:

`npm run receipts:index-fixtures`

That writes a searchable catalog to `test/fixtures/receipts/library/catalog.json` and preserves the originals in place.

## Validation rule

The UX should remain simple:
- upload once
- split receipts automatically when needed
- process quietly by default
- interrupt the user only for real issues

If the fixture requires repeated confirmation or extra setup for the happy path, that is a workflow bug, not just an extraction limitation.
