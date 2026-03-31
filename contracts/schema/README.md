# Contracts Schema — Source of Truth

This directory contains the canonical schema definitions for Money to Memories.

## Purpose

This folder exists to separate:
- transport contracts
- object structure contracts
- validation contracts

from higher-level UX and product docs.

## Recommended usage

### OpenAPI
Use `contracts/openapi/` for:
- HTTP routes
- request/response shapes
- auth rules
- endpoint-level documentation

### Schema directory
Use `contracts/schema/` for:
- canonical object models
- JSON Schema definitions
- TypeScript/Zod generation targets
- shared validation structures
- mock data validation

## Why this matters

OpenAPI is the correct contract for APIs, but it should not be the only source of truth for object structures used across:
- frontend mocks
- backend validation
- persona fixtures
- route-state packs
- agent tool payloads

This directory should become the canonical home for:
- shared schemas
- enums
- polymorphic object rules
- event and message payloads

## Recommended future structure

```text
contracts/schema/
├─ README.md
├─ common/
│  ├─ ids.schema.json
│  ├─ enums.schema.json
│  └─ money.schema.json
├─ commerce/
│  ├─ purchase-event.schema.json
│  ├─ purchase-line-item.schema.json
│  ├─ merchant.schema.json
│  └─ price-observation.schema.json
├─ things/
│  ├─ product.schema.json
│  ├─ asset.schema.json
│  ├─ warranty.schema.json
│  └─ document-link.schema.json
├─ people/
│  ├─ person.schema.json
│  └─ purchase-participant.schema.json
├─ memories/
│  ├─ memory.schema.json
│  └─ memory-link.schema.json
├─ subscriptions/
│  ├─ subscription.schema.json
│  └─ entitlement.schema.json
├─ integrations/
│  └─ receipt-ocr-adapter.contract.ts
└─ agent/
   ├─ agent-session.schema.json
   └─ agent-message.schema.json
