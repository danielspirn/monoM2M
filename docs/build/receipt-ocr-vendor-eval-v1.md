# Receipt OCR Vendor Eval v1

Date: 2026-03-31

This document defines the first defensive OCR vendor framework for receipt ingestion.

The goal is not to hard-wire one model directly into the receipt flow. The goal is to preserve a safe seam so that:

- one upload flow can handle images, PDFs, and later video-derived frames
- receipt quality stays measurable before rollout decisions are automated
- vendor switching can happen for cost reasons without rewriting the receipt core
- raw source documents remain the evidence root of the system

## Decision

Current primary OCR route:
- Google Gemini 2.5 Flash

Current fallback OCR route:
- OpenAI GPT-4o mini

Current policy:
- Gemini stays primary by default
- fallback switching is limited to `single_receipt_image`
- fallback switching is blocked until shared receipt evals pass

## Why this shape

Receipt OCR is not just text extraction.

The provider must support:

- merchant, date, total, tax, and tender extraction
- line-item extraction with enough accuracy to promote durable goods into Things
- grouped upload splitting when a single image contains multiple receipts
- evidence-friendly output that can later map to spans and reviewed structured fields
- cost control without changing the end-user capture UX

That means we should not treat the OCR choice as a UI-level concern or a one-time SDK choice.

## Evaluation-first posture

Vendor switching is intentionally gated.

The current eval policy requires:

- overall receipt OCR score >= `0.92`
- line-item accuracy >= `0.90`
- duplicate precision >= `0.98`
- split accuracy >= `0.90`
- fallback cost savings ratio >= `0.35`

Until those gates pass, Gemini remains the default OCR route and OpenAI stays configured but inactive for production routing.

## Provider assumptions

These are implementation assumptions, not permanent truths. Re-verify before real rollout.

### Google Gemini 2.5 Flash

Use as the default route for:

- single receipt images
- grouped receipt images
- PDFs
- video-frame based receipt capture

Pricing reference as of 2026-03-31:

- standard input: `$0.30 / 1M` for text/image/video
- standard output: `$2.50 / 1M`
- batch input: `$0.15 / 1M`
- batch output: `$1.25 / 1M`

Source:
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini Files API](https://ai.google.dev/gemini-api/docs/files)

### OpenAI GPT-4o mini

Use as the cost-oriented fallback candidate for:

- single receipt images only

Pricing reference as of 2026-03-31:

- input: `$0.15 / 1M`
- output: `$0.60 / 1M`

Current limits in our routing policy:

- not approved for PDFs
- not approved for grouped receipt splitting
- not approved for video-derived receipt capture

Source:
- [GPT-4o mini model page](https://developers.openai.com/api/docs/models/gpt-4o-mini)

## Required contract for every OCR provider

Every provider adapter must produce the same fact-first shape:

`source_document -> extraction_run -> purchase_event candidate -> purchase_line_item candidates`

Minimum adapter output:

- raw OCR text
- provider/model/version metadata
- structured field candidates
- line-item candidates
- confidence data
- timing and cost metadata
- vendor request id or trace id where available

## Security constraints

All OCR integrations must preserve the project security rules:

- private-by-default document handling
- no public document URLs
- short-lived signed access only
- minimize data sent to external providers
- no sensitive document contents in logs
- auditable provider choice per extraction run

## Rollout stages

1. Provider-neutral contracts and router
2. Offline fixture eval harness using real uploaded receipts
3. Shadow OCR comparisons on the same receipt set
4. Threshold review and policy approval
5. Real backend adapter integration
6. Controlled production rollout

## Near-term implementation target

Next backend-facing slice:

- create a server-side OCR adapter interface
- implement the Gemini adapter first
- persist provider and eval provenance on `extraction_runs`
- store normalized adapter outputs separately from user-reviewed structured data
- add a receipt eval command that scores vendors against the real fixture library
