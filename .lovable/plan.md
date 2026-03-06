

# Fix 2000 Credit Pack Price: $120 → $98

Three files need the price updated from `"$120"` to `"$98"`:

1. **`src/components/wallet/QuickTopupModal.tsx`** (line 43): Change `price: "$120"` to `price: "$98"`
2. **`src/components/wallet/InsufficientCreditsModal.tsx`** (line 30): Change `price: "$120"` to `price: "$98"`
3. **`src/pages/Wallet.tsx`** — already shows `$98` (confirmed from provided code), no change needed

Simple string replacement in two files.

