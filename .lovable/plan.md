

# Remove Legacy USD Credit System

## Problem
The old USD wallet top-up modal (`QuickTopupModal`) is still active and accessible from the navbar's credit chip. It shows dollar amounts ($5/$10/$25/$50/$100) with a 1% processing fee — this is the legacy system. The platform has moved to AI credit packs.

## Changes

### 1. Replace QuickTopupModal with redirect to Wallet page
In `src/components/layout/Navbar.tsx`:
- Remove `QuickTopupModal` import and rendering
- Change the `CreditBalanceChip` `onClick` to navigate to `/wallet` instead of opening the old modal

### 2. Rewrite QuickTopupModal as AI Credit Pack selector
Replace the entire `QuickTopupModal` content with the 3 AI credit packs (100/$10, 500/$40, 2000/$120) using the same purchase flow from `Wallet.tsx`. Remove dollar-based amounts, custom amounts, and the 1% fee breakdown.

### 3. Update InsufficientCreditsModal
Replace the USD-based "quick add" amounts with AI credit pack options and redirect to `/wallet` for purchasing, removing the old `purchaseCredits(amountCents)` flow.

### 4. Update CreditBalanceChip display
It already shows AI credits from `useAICredits` — no change needed there.

## Summary
- 3 files modified: `Navbar.tsx`, `QuickTopupModal.tsx`, `InsufficientCreditsModal.tsx`
- Remove all USD wallet top-up flows from quick-access modals
- Replace with AI credit pack purchasing or navigation to `/wallet`

