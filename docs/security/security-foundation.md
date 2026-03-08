# Money to Memories — Security Foundation

## Purpose

This document defines the security baseline for the product and aligns with SOC 2 readiness.

## Core principle

Use consumer-grade UX with enterprise-grade controls.

## Design assumptions

This product handles:
- receipts
- financial behavior data
- household relationships
- warranties and insurance records
- future trust-sensitive family records

## Non-negotiables

- least privilege
- tenant isolation
- household-scoped authorization
- row-level security
- encrypted transit
- encrypted storage
- private document handling
- no public document URLs
- short-lived signed document access
- audit logs for sensitive writes
- no sensitive payload leakage into general logs
- secure secrets handling
- environment separation
- agent tool calls must respect real permissions

## Tenancy rules

### Shared lower tiers
Free, Personal Pro, and Family Pro are multi-tenant.

### Family Trust
Family Trust is dedicated single-tenant.

All sensitive business records must carry `tenant_id`.

## Document handling rules

- private buckets only
- signed URL access
- no raw document content in logs
- validate MIME and upload type
- support future malware scanning path

## AI and agent rules

- minimize data sent to external providers
- use tool-based access for sensitive workflows
- do not allow the agent to bypass authorization
- store agent sessions and messages for auditability where appropriate

## Operational expectations

- audit sensitive writes
- protect secrets
- separate dev/staging/prod
- maintain vendor inventory
- prepare for formal SOC 2 process later without requiring architectural rework