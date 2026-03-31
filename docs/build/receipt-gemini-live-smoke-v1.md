# Receipt Gemini Live Smoke v1

Date: 2026-03-31

This slice adds the first live Gemini OCR call path for local development.

Current scope:

- single receipt image only
- backend-side API key usage only
- inline image bytes for files under the Gemini inline payload size limit
- JSON-structured extraction output

It does not yet cover:

- PDF upload via Files API
- multi-receipt splitting in the live adapter
- OpenAI live fallback execution
- persistence into `extraction_runs`

## Local smoke command

Run:

```bash
npm run ocr:smoke:gemini -- receipt_images/IMG_7573.jpeg
```

Expected result:

- a real Gemini API call using `GEMINI_API_KEY`
- JSON summary with merchant, purchase date, line-item count, and a raw-text preview

## Why this matters

This gives us a real integration proof without changing the client capture UX yet.

We can now:

- verify local key setup
- inspect Gemini extraction quality on real receipts
- compare live OCR behavior with our fixture-derived expectations
