# Generated Receipt Library

This directory contains generated indexes derived from the raw receipt corpus in `receipt_images/`.

## Source of truth

- Raw uploaded corpus: `receipt_images/`
- Generated catalog: `test/fixtures/receipts/library/catalog.json`

Do not manually edit `catalog.json`.

Regenerate it with:

`npm run receipts:index-fixtures`

## What the catalog includes

- every discovered file in `receipt_images/`
- file size and md5 fingerprint
- duplicate groups for exact duplicates
- starter curated scenarios referencing real uploaded files

This gives us a stable development artifact without moving or renaming your original images.
