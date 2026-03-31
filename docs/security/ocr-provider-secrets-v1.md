# OCR Provider Secrets v1

Date: 2026-03-31

This document answers a practical sequencing question:

When do we need provider accounts, secrets, and token management for receipt OCR?

## Short answer

Not for the current mocked receipt flow.

We need secrets in our backend at the first moment the app makes a real OCR call on a user document.

That means:

- not during fixture-only receipt development
- not during UI review
- yes before the first real Gemini or OpenAI extraction request
- yes before any direct browser-to-storage upload flow that relies on signed tokens

## The triggering slice

Secrets become mandatory when we ship this backend path:

`client upload -> private storage -> backend OCR adapter -> vendor model -> normalized extraction result`

The current repo does not yet have that backend adapter. Until it exists, adding production secrets would be premature.

## What we need first

### Local development spike

At the first real adapter implementation, the minimum viable backend secret set is:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`

These belong in the backend runtime only.

They must not be placed in:

- Vite client env
- browser code
- mobile client code
- checked-in files

### Staging and production

For staging and production, the preferred shape is:

- Gemini on a server-side backend
- ideally through Vertex AI auth with Application Default Credentials or service identity
- OpenAI through a backend-held API key stored in a secret manager
- private receipt storage with short-lived signed access

## Token management timing

### Provider credentials

Needed before the first real OCR request.

This is the immediate next backend-facing slice if we implement a live Gemini adapter.

### Signed upload or download tokens

Needed when the client stops proxying files through the app server and starts uploading directly to private object storage.

If the first backend version simply receives the upload and forwards it server-side, this can wait one slice.

### Webhook secrets

Needed only when we move to asynchronous processing with callbacks, batch completion notifications, or provider webhooks.

Not needed for the first synchronous OCR adapter.

## Recommended sequence

1. Build the server-side OCR adapter interface.
2. Add Gemini as the first real provider.
3. Keep file transfer server-side for the first live slice.
4. Add `GEMINI_API_KEY` and `OPENAI_API_KEY` to backend-only secret storage.
5. Add provider logging, redaction, and rotation rules.
6. Later, add signed document upload tokens.
7. Later, add webhook verification if batch orchestration needs it.

## Practical recommendation for this repo

Because this repo is still UX-first and mock-heavy, we do not need to gather production secrets today.

We should gather them right before:

- implementing the first real backend OCR adapter
- connecting the upload flow to private document storage
- testing live extraction against our receipt fixture library

That is the next major integration milestone, not a distant one.

## Provider guidance

### Gemini

Google’s Gemini docs say the most secure approach is to call the Gemini API from a server-side application where the key can be kept confidential, and they explicitly warn not to expose API keys on the client side.

For early development, a backend-held `GEMINI_API_KEY` is acceptable.

For stronger staging and production posture, prefer Google Cloud / Vertex AI-style server authentication and IAM-based access control.

Sources:

- [Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Authenticate to Vertex AI](https://docs.cloud.google.com/vertex-ai/docs/authentication)

### OpenAI

OpenAI’s docs say to create an API key, export `OPENAI_API_KEY` as an environment variable, and use the official SDK in server-side JavaScript environments.

That means our fallback provider key belongs in the backend environment or secret manager, not in the frontend app.

Source:

- [OpenAI libraries and API key setup](https://developers.openai.com/api/docs/libraries)

## Non-negotiables

- never expose provider secrets to the client
- never commit provider secrets to git
- rotate and audit keys regularly
- separate local, staging, and production credentials
- keep receipt documents private and minimize vendor data exposure
