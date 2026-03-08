# Money to Memories — Core Data Model v1.1

## Purpose

This document defines the build-ready v1.1 data model foundation for Money to Memories.

It supports:
- Free / Personal Pro / Family Pro in multi-tenant SaaS
- Family Trust in dedicated single-tenant mode
- a consumer-first MVP
- long-term Family Trust headroom

## Core modeling principles

### Fact first
Canonical order of truth:
1. source_document
2. extraction_run
3. purchase_event
4. purchase_line_item
5. product
6. asset (user-facing Thing)
7. memory
8. tag_assignment

### Multi-axis classification
Do not force one taxonomy.
Each object may carry:
- structured entity links
- household tags
- tax tags
- LEM tags
- ownership tags
- location/context tags

### Top-level containment
Use:
`tenant -> family_network (optional) -> household -> records`

## Core domains

### 1. Tenancy and access
- tenants
- family_networks
- households
- users
- profiles
- household_members
- entities
- entity_roles

### 2. People
- people
- professional_contacts

### 3. Source and evidence
- source_documents
- document_pages
- extraction_runs
- evidence_spans
- document_links

### 4. Spend and purchases
- merchants
- merchant_aliases
- merchant_locations
- purchase_events
- purchase_line_items
- purchase_participants
- payments
- price_observations

### 5. Product and Things
- brands
- products
- assets
- asset_ownerships
- warranties
- asset_lifecycle_events

### 6. Place, property, policy
- locations
- properties
- property_ownerships
- policies

### 7. Memories
- memories
- memory_links
- person_links

### 8. Classification and intelligence
- tag_frameworks
- tags
- tag_assignments
- tag_rules
- tax_profiles
- insight_snapshots

### 9. Commercial and gating
- subscriptions
- entitlements

### 10. Agent and operations
- agent_sessions
- agent_messages
- notifications
- reminders
- audit_logs
- cost_ledger
- jobs

## Important v1.1 refinements

### Things vs assets
User-facing label: **Things**
Internal model object: `assets`

### Memory states
Memories support:
- candidate
- confirmed
- dismissed

This supports system-assisted memory creation without requiring a separate table initially.

### Product resolution
Purchase line items should support:
- product_match_status
- product_match_confidence

### Merchant resolution
Purchase events should support:
- merchant_match_status
- merchant_match_confidence

### Documents
Use generalized `document_links` instead of only asset-specific document joins.

### People involvement
Use `purchase_participants` for spend and gift logic, not only generic person links.

## Current build scope

The immediate build should focus on:
- source_documents
- extraction_runs
- evidence_spans
- merchants
- purchase_events
- purchase_line_items
- products
- assets
- warranties
- people
- memories
- subscriptions / entitlements
- agent_sessions / agent_messages
- tags and assignments
- audit_logs and jobs

## Deferred but modeled
These stay in the schema but are not first-wave UX priorities:
- family_network depth
- trust-specific entity workflows
- policy and property depth
- advisor collaboration
- advanced notification orchestration