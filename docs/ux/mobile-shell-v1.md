# Money to Memories — Mobile Shell v1

## Purpose

This document locks the v1 mobile shell, bottom navigation, drawer structure, FAB behavior, and tab-specific action strips.

## Shell rule

The app shell has four layers:
1. top app bar
2. context action strip
3. primary route body
4. bottom navigation with center dimple FAB

## Bottom navigation

Use exactly:
- Home
- Things
- center FAB
- People
- Memories

### Bottom bar behavior
- stable across the app
- labels under icons
- active-state emphasis
- safe-area aware
- center dimple/notch for FAB

## FAB

The FAB is the global action and ask hub.

### FAB menu
- Add Purchase
- Scan Receipt
- Upload Document
- Record Experience
- Ask Agent — Chat
- Ask Agent — Voice

### FAB rule
It never acts as a tab.
It opens a bottom sheet.

## Drawer

Use a standard drawer for:
- Account
- Settings
- Plan
- Upgrade
- Privacy & Security
- Help
- Sign Out

Do not place these in the bottom bar.

## Context action strip by tab

### Home
- Recent
- Review
- Insights

### Things
- Returns
- Warranty
- Insurance

### People
- Household
- Gifts
- Shared

### Memories
- Timeline
- Map
- People

## UX rules

- mobile-first always
- simple, consumer-friendly language
- things should feel like a natural consumer concept
- memories should feel system-assisted, not overauthored
- agent access should be visible and fast