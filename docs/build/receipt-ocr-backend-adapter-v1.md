# Receipt OCR Backend Adapter v1

Date: 2026-03-31

This slice creates the first server-side OCR integration boundary for Money to Memories.

It does not yet send live OCR requests.

It does:

- define backend-only provider configuration
- resolve which provider is selected for a receipt extraction run
- determine whether the backend is actually ready for a live call
- prepare a provider-neutral request envelope

## Why this slice exists

The client capture flow should not know:

- provider API keys
- provider auth modes
- provider rotation policy
- provider routing decisions

Those belong in the backend OCR gateway.

## Current behavior

The backend gateway now supports:

- Gemini as the default live OCR target
- OpenAI as an explicitly requested fallback target
- backend-only secret readiness checks
- future migration from Gemini API key auth to Vertex-style auth

## What is still missing

- actual Gemini SDK or HTTP integration
- actual OpenAI SDK or HTTP integration
- provider response normalization into stored extraction results
- persistence of backend execution metadata
- audit logging and redaction middleware

## Integration sequence

1. Upload receipt into private document storage.
2. Create `source_document`.
3. Create `extraction_run`.
4. Backend gateway selects provider and validates secret readiness.
5. Backend provider adapter sends OCR request.
6. Normalize raw OCR text, field candidates, and line-item candidates.
7. Persist extraction outputs and provider metadata.
8. Return reviewed receipt candidates to the existing receipt UX.

## Secret boundary

Secrets are required at this slice, not earlier.

For the first live backend run, the minimum secret set is:

- `GEMINI_API_KEY`
- optionally `OPENAI_API_KEY`

For stronger staging and production posture:

- use Vertex-style auth for Gemini
- keep OpenAI credentials in secret manager
- add signed storage access only when client uploads stop proxying through the server
