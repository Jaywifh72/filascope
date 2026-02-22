

## Create "generate-filament-embedding" Edge Function

### Blocker: Missing API Key

This function requires `OPENAI_API_KEY` for calling OpenAI's `text-embedding-3-small` embedding model. That secret is not currently configured. Before the function can work, you'll need to provide your OpenAI API key so it can be stored securely as a backend secret.

**Note:** The Lovable AI gateway does not support embedding endpoints — only chat completions — so a direct OpenAI API key is required for this specific function.

### What Will Be Created

**File:** `supabase/functions/generate-filament-embedding/index.ts`

A single edge function that:

1. Receives `{ filament_id }` via POST
2. Fetches the filament row (using `product_title`, `vendor`, `material` from the `filaments` table — there are no `name`/`description` columns or separate `brands`/`material_types` join tables)
3. Fetches `filament_properties`, `filament_trait_tags`, and `filament_use_cases` for that filament
4. Builds a natural-language embedding text blob from all the data (skipping null fields)
5. Calls OpenAI `text-embedding-3-small` to generate the embedding vector
6. Upserts the result into `filament_search_embeddings` (text + JSON-stringified vector)
7. Returns `{ success, filament_id, characters }` or error with status 500
8. Includes full CORS headers and OPTIONS handling

**Config:** `verify_jwt = true` (admin-only operation) added to `supabase/config.toml`.

### Data Mapping Notes

Since the `filaments` table uses `product_title` (not `name`), `vendor` (not a `brands` join), and `material` (not a `material_types` join), the embedding text will use:
- Brand Name = `filaments.vendor`
- Filament Name = `filaments.product_title`
- Material Type = `filaments.material`
- Description = not available (no description column exists)

### Implementation Sequence

1. Request the `OPENAI_API_KEY` secret from you
2. Create the edge function file
3. Update `config.toml` with the new function entry

