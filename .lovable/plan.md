

## Replace Terms Page with Termly Iframe

### Change

**File: `src/pages/Terms.tsx`**

Replace the entire file with a simple Layout wrapper containing a full-viewport iframe pointing to the Termly policy URL.

```tsx
import { Layout } from "@/components/layout/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="w-full bg-background" style={{ minHeight: "100vh" }}>
        <iframe
          src="https://app.termly.io/policy-viewer/policy.html?policyUUID=7ab0d082-f2d6-4d35-a392-28736c10547f"
          title="Terms and Conditions"
          style={{
            width: "100%",
            height: "100vh",
            border: "none",
            display: "block",
          }}
          allowFullScreen
        />
      </div>
    </Layout>
  );
}
```

- Keeps existing Layout (header + footer)
- Full-width iframe, 100vh height, no border
- `display: block` prevents inline-element gap
- Dark background behind iframe while loading
- No horizontal scroll, smooth vertical scroll handled by Termly's own viewer
- Removes all 640 lines of hardcoded legal text

### Files Changed

| File | Change |
|---|---|
| `src/pages/Terms.tsx` | Replace content with Termly iframe |

