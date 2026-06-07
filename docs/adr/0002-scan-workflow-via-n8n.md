# Wine label scanning delegated to n8n

When a user adds a new vino, the app captures the label photo and sends it to an n8n webhook (the Scan workflow). n8n is responsible for: identifying the wine via vision + external search, populating all Vino fields, formatting the label image for display, writing the Vino record to Supabase, and returning the result to the app. The frontend only renders what n8n returns.

## Considered Options

- **Client-side OpenAI vision call** — already partially implemented (`src/lib/openai.ts`, `ScanPage`). Leaks the API key, cannot call external wine databases, and couples logic to the frontend.
- **Dedicated backend API** — more portable than n8n but requires building and hosting custom server code.
- **n8n webhook (chosen)** — no custom backend; logic lives in an n8n workflow that can be iterated visually. Handles vision, search, image transformation, and Supabase writes in one place.

## Consequences

The `src/lib/openai.ts` direct client call on `ScanPage` will be replaced by a single `fetch` to the n8n webhook URL. The `dangerouslyAllowBrowser: true` OpenAI client can be removed once all AI calls are routed through n8n.

n8n receives the user's Supabase JWT alongside the image and uses it (as the `Authorization: Bearer` header) when writing to Supabase. This preserves RLS — each user can only write to their own Bodega. The Service Role key is never used for user-initiated writes.

Image strategy: for the front label, the Scan workflow first searches for a high-quality product image from an external source (e.g. Vivino, producer website); if found, that image is used, otherwise the user's captured photo is cropped, straightened, and normalised as fallback. The back label (if captured) is only normalised — no external image search, as back labels are batch-specific and have no canonical external representation.
