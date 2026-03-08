# Money to Memories — Route-by-Route Spec

## Primary routes

### /home
Purpose:
- search
- capture
- review recent activity
- see lightweight insights

Must support:
- empty state
- first-use onboarding state
- loading state
- saved receipts state
- recent spend summary
- quick action CTA

### /things
Purpose:
- understand what was bought and what is owned
- drill into categories and Things
- surface returns / warranty / insurance entry points

Must support:
- overview state
- grouped visualization state
- category drilldown
- owned Things state
- free-tier upgrade prompts for premium actions

### /people
Purpose:
- show relationship context around purchases and memories

Must support:
- network or circles view
- list view
- household-related views
- person detail route
- linked purchases and memories

### /memories
Purpose:
- show memory candidates and confirmed memories in timeline form

Must support:
- candidate state
- confirmed state
- empty state
- enrichment actions:
  - add people
  - add note
  - rename
  - merge receipts

### /settings
Purpose:
- app preferences
- privacy controls
- notifications

### /account
Purpose:
- identity
- sessions
- household membership
- subscription summary

### /plans
Purpose:
- compare Free / Personal Pro / Family Pro
- support contextual upgrades

## Secondary route intent

### /things/:thingId
Thing detail showing:
- purchase origin
- docs
- warranty
- linked memories and people where relevant

### /people/:personId
Person detail showing:
- recent linked purchases
- gifts
- linked memories

### /memories/:memoryId
Memory detail showing:
- title
- time/place
- linked receipts
- linked Things
- linked people
- notes

## Route rules

- every route must have mobile-safe spacing
- every route must support empty/loading/error/populated states
- every primary route should have premium-conversion states where relevant
- use user-facing label “Things” throughout