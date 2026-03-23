

## Update JumBot & Help Center with Latest Platform Info

Patch-only changes to content/copy. No new features, no structural changes.

---

### 1. JumBot System Prompt Updates

**File**: `supabase/functions/jumbot-chat/index.ts`

Fix outdated info in `SYSTEM_PROMPT`:

| Current (Wrong) | Updated (Correct) |
|---|---|
| AI Release Builder = 60 credits | 10 credits (per `aiPricing.ts`) |
| Music videos = 20-100 credits | 130-400 credits (10s-HD) |
| Artist Autopilot = 150 credits | Remove — Autopilot references replaced by AI Artist Drop (40 credits) at `/ai-drop` |
| No mention of AI Artist Drop | Add: AI Artist Drop at `/ai-drop` (40 credits) — generates identity + cover art + release in one flow |
| No mention of AI Viral Generator | Add: AI Viral Generator at `/ai-viral` (500-850 credits) — creates 3-5 promo clips |
| No mention of Avatar Editor | Add: Avatar Editor (10-25 credits) for editing existing identity |
| No mention of auto-reload | Add: Auto-reload available in wallet settings |
| AI Tools nav = `/ai-tools` | Rename to "Grow My Music" in nav reference |
| Subscriptions listed as generic | Update: Creator $10/300cr, Creator Pro $25/800cr, Label/Studio $79/2000cr |
| No mention of "Grow Today" | Add: Homepage shows "Grow Today" quick actions for artists |

Also add Identity Builder details: `/ai-identity` (15-40 credits), generates artist avatar and visual identity.

---

### 2. Help Center Updates

**File**: `src/pages/HelpCenter.tsx`

**Subscriptions section** (lines 91-94):
- Change "Fan, Artist, and Label plans" → "Creator ($10/mo), Creator Pro ($25/mo), and Label/Studio ($79/mo)"
- Update credits answer: mention AI credits for AI tools (not just purchasing tracks), mention auto-reload

**Add new FAQ category**: "AI Tools & Credits" (between Subscriptions and For Artists):
- "What AI tools are available?" → List: Video Studio, Viral Generator, Cover Art, Identity Builder, Artist Drop, Playlist Builder, Release Builder
- "How much do AI tools cost?" → Credit costs from aiPricing.ts
- "What is AI Artist Drop?" → One-click release package for 40 credits
- "What is auto-reload?" → Automatic credit top-up when balance is low
- "What happens if I run out of credits?" → Purchase packs or enable auto-reload

**For Artists section**: Add FAQ about AI Artist Drop and Grow My Music hub.

---

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/jumbot-chat/index.ts` | Update system prompt with correct credit costs, new tools, renamed nav |
| `src/pages/HelpCenter.tsx` | Update subscription pricing, add AI Tools FAQ category |

### Not Touched
- JumBot component UI, streaming logic, hook
- Any backend systems, pricing logic, credit deduction
- Navigation, homepage, or tool pages

