# Money to Memories — Master Overview

## Mission

Money to Memories helps consumers capture what they spend, understand what they buy, track what they own, and use those insights to make better decisions in everyday life.

Over time, it becomes the system families use to organize, protect, and pass on what matters.

## Why this product exists

Consumers live in an inflationary market and struggle to answer:
- What am I really spending money on?
- What did I actually buy?
- What do I already own?
- Where are my costs drifting upward?
- Which choices are habits, which are waste, and which are meaningful?
- How do purchases connect to people, events, and memories?

Most finance apps model transactions.
Money to Memories models:
- purchases
- line items
- Things
- people
- place
- time
- memory
- future family stewardship

## Product ladder

### Free
A strong try-before-upgrade experience.
- up to 100 receipts
- core Home, Things, People, Memories
- basic agent questions
- no advanced warranty / insurance workflows
- no household collaboration

### Personal Pro
For serious personal ownership and optimization.
- unlimited receipts
- warranty/manual support
- stronger search and Things depth
- better agent help and insights

### Family Pro
For shared household life.
- shared household
- shared Things
- shared Memories
- people and household context

### Family Trust
For dedicated, trust-ready family systems.
- dedicated tenant
- family networks
- shared properties and policies
- long-term headroom for advisor workflows and family-specific secure AI

## Core surfaces

- Home
- Things
- People
- Memories
- FAB / Agent entry
- Settings
- Account
- Plan / Upgrade

## Primary UX principle

The product must feel useful within minutes.

That means:
- fast capture
- fast recall
- clear item review
- low-friction Things creation
- contextual people and memory enrichment
- grounded agent experience

## Strategic architectural stance

Use:
- multi-tenant SaaS for Free / Personal Pro / Family Pro
- dedicated tenant for Family Trust

Use a fact-first model:
`source_document -> extraction_run -> purchase_event -> purchase_line_item -> product -> asset/thing -> memory`

Use multiple classification systems:
- tax
- household
- LEM
- ownership
- location/context

## Build bias

This project is built **front to back**.
The first success metric is UX quality, not backend completeness.

The required sequence is:
1. mock the experience
2. validate the route flows
3. refine contracts
4. then implement the stack