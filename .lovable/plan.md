
# Fix Preview Ended Modal Incorrect Price Display

## Problem
The "Preview Ended" modal shows track prices incorrectly. For example, a track priced at $0.25 displays as "$0.00".

## Root Cause
The `PreviewEndedModal.tsx` component has incorrect price formatting logic:

```tsx
const priceInDollars = (track.price / 100).toFixed(2);
```

This code assumes the price is stored in **cents** and divides by 100. However, the database stores prices in **dollars** (e.g., `0.25` means $0.25, not 25 cents).

This causes:
- `$0.25 / 100 = $0.0025` → displayed as `$0.00`
- `$1.99 / 100 = $0.0199` → displayed as `$0.02`

## Solution
Use the existing `formatPrice` utility from `src/lib/formatters.ts`, which correctly formats dollar amounts:

```tsx
import { formatPrice } from "@/lib/formatters";
// ...
<p className="text-lg font-bold text-primary mt-1">{formatPrice(track.price)}</p>
```

This matches how `InstantPurchaseModal` (which opens after clicking "Purchase Full Track") handles prices using `track.price.toFixed(2)` without dividing by 100.

## Technical Changes

**File: `src/components/audio/PreviewEndedModal.tsx`**

1. Add import for `formatPrice`:
   ```tsx
   import { formatPrice } from "@/lib/formatters";
   ```

2. Remove the incorrect calculation on line 35:
   ```tsx
   // Remove this line
   const priceInDollars = (track.price / 100).toFixed(2);
   ```

3. Update the price display on line 84:
   ```tsx
   // Change from
   <p className="text-lg font-bold text-primary mt-1">${priceInDollars}</p>
   
   // To
   <p className="text-lg font-bold text-primary mt-1">{formatPrice(track.price)}</p>
   ```

## Result
- Track at $0.25 will display as **$0.25** (correct)
- Track at $1.99 will display as **$1.99** (correct)
- Consistent formatting with the rest of the application
