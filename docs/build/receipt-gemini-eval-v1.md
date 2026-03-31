# Receipt Gemini Eval v1

Date: 2026-03-31

This slice adds a real Gemini evaluation command against curated receipt fixtures.

## Goal

Do not trust a successful API call as proof that receipt OCR is production-ready.

Measure:

- merchant extraction quality
- purchase date extraction quality
- line-item presence on real fixtures

## Current command

Run:

```bash
npm run ocr:eval:gemini
```

Current cases:

- Safeway grocery receipt
- nonstandard cleaning invoice

## Why this matters

This lets us fill gaps as they appear.

Example:

- if the model returns good raw OCR text but misses merchant normalization, we fix the normalizer before wiring that output into the receipt UX
- if nonstandard invoices underperform, we can keep them routed to review-first treatment rather than trusting automation too early

Current eval rule for nonstandard invoices:

- use acceptable merchant candidates instead of forcing one invented canonical merchant when the source document does not clearly provide a business name
- canonicalize dates before scoring so `03/28/23` and `2023-03-28` count as the same fact
- prompt service invoices to emit billed tasks as `lineItems` so we can measure whether non-retail purchase evidence is still structurally useful
