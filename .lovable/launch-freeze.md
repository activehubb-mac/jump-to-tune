# 🔒 LAUNCH FREEZE — ACTIVE

**Effective:** 2026-03-23
**Status:** FROZEN — patches only

---

## Allowed Changes

- ✅ Bug fixes
- ✅ Payment fixes
- ✅ Credit fixes
- ✅ AI generation fixes
- ✅ Security fixes
- ✅ Performance fixes
- ✅ Mobile responsiveness fixes
- ✅ UX clarity fixes (copy, spacing, contrast)

## Blocked Changes

- ❌ New features
- ❌ New pages or routes
- ❌ Pricing restructuring
- ❌ Core user flow changes
- ❌ New edge functions (unless fixing existing)
- ❌ New database tables
- ❌ Navigation restructuring

## Frozen Systems

| System | Status |
|---|---|
| Onboarding | 🔒 Frozen |
| Artist Identity Builder | 🔒 Frozen |
| Avatar Editing | 🔒 Frozen |
| Upload & Publish | 🔒 Frozen |
| Direct Fan Purchase | 🔒 Frozen |
| Subscription & Trial | 🔒 Frozen |
| Credit Purchases | 🔒 Frozen |
| Auto-Reload | 🔒 Frozen |
| AI Video Studio | 🔒 Frozen |
| AI Viral Generator | 🔒 Frozen |
| Cover Art Generator | 🔒 Frozen |
| Grow My Music Homepage | 🔒 Frozen |
| Stripe Webhook | 🔒 Frozen |
| Grow Today Block | 🔒 Frozen |

---

## Launch QA Checklist

### 1. Payments
- [ ] Credit pack checkout completes (100/500/2000 packs)
- [ ] Stripe checkout session creates with correct metadata (user_id, type, ai_credits)
- [ ] checkout.session.completed webhook delivers credits to credit_wallets
- [ ] Duplicate webhook events are idempotent (no double credits)
- [ ] Abandoned checkout does not add credits
- [ ] Store product checkout works (guest + authenticated)
- [ ] Store order records created with correct amounts

### 2. Subscriptions
- [ ] Creator ($10), Creator Pro ($25), Label/Studio ($79) checkout works
- [ ] 30-day free trial activates (card required upfront)
- [ ] Trial expiry transitions to active billing
- [ ] invoice.paid webhook refreshes monthly credits (300/800/2000)
- [ ] customer.subscription.deleted downgrades role to fan
- [ ] Pause/resume subscription works
- [ ] UI prices match Stripe prices ($10/$25/$79)
- [ ] SubscriptionRequiredModal shows correct pricing
- [ ] Onboarding shows correct pricing

### 3. Credits
- [ ] New users receive 15 AI credits on signup
- [ ] deduct_ai_credits blocks negative balance
- [ ] add_ai_credits creates wallet if missing
- [ ] AI tool costs match aiPricing.ts values
- [ ] Credit balance chip updates after usage
- [ ] Wallet page shows correct balance
- [ ] Auto-reload triggers when below threshold
- [ ] Auto-reload debounce prevents rapid charges
- [ ] charge.refunded claws back AI credits
- [ ] Insufficient-balance flagged for admin if credits already spent

### 4. Uploads
- [ ] Single track upload works (audio + cover art)
- [ ] Album upload works (multiple tracks)
- [ ] Price field defaults to $1
- [ ] Track publishes and appears on artist profile
- [ ] Cover art uploads to storage bucket
- [ ] Audio uploads to tracks bucket
- [ ] Draft/publish toggle works

### 5. Identity Persistence
- [ ] Identity Builder saves to artist_identities table
- [ ] default_identity_id set on profiles after save
- [ ] useDefaultIdentity returns avatar_url, artist_name, bio, visual_theme
- [ ] Avatar appears across Video Studio, Viral Generator, Cover Art
- [ ] "Set as Profile" button still works independently
- [ ] Avatar upload to storage succeeds

### 6. AI Generation
- [ ] Cover Art: generates image, deducts 10 credits
- [ ] Identity Builder: generates avatar, deducts 15/25/40 credits
- [ ] Avatar Edit: applies edits, deducts 10/15/25 credits
- [ ] Video Studio: creates job, polls completion, deducts 130-400 credits
- [ ] Video Studio: refunds credits on generation failure
- [ ] Viral Generator: creates assets, deducts 500-850 credits
- [ ] Artist Drop: orchestrates full flow, deducts 40 credits
- [ ] Playlist Builder: generates playlist, deducts 5 credits
- [ ] Release Builder: generates release, deducts 10 credits
- [ ] All tools show correct credit cost before action

### 7. Refunds
- [ ] Store order refund reverses inventory (restore_inventory_atomic)
- [ ] Store refund triggers refund-store-order edge function
- [ ] AI credit pack refund claws back credits via charge.refunded
- [ ] Insufficient-balance refund creates admin notification
- [ ] Refund does not double-process

### 8. Mobile Web Behavior
- [ ] Homepage renders correctly on 375px width
- [ ] Grow Today block: 3 buttons fit on mobile
- [ ] Action cards (Upload/My Music/Grow) stack properly
- [ ] Audio player doesn't overlap content
- [ ] Navigation hamburger menu works
- [ ] Upload flow works on mobile
- [ ] Wallet page is scrollable
- [ ] AI tool pages are touch-friendly
- [ ] Modals don't overflow viewport
- [ ] PWA install banner appears on supported browsers
