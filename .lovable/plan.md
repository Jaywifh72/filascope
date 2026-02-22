

## Intelligent Search Infrastructure — Database Migration Plan

This plan creates 6 new tables and seeds the `trait_taxonomy` table with 15 rows. No existing tables are modified.

### Tables to Create

1. **filament_properties** — Structured material properties (temps, scores, booleans, enums) linked 1:1 to filaments
2. **filament_trait_tags** — Freeform trait labels with category and confidence, many-per-filament
3. **filament_use_cases** — Use case suitability ratings per filament
4. **trait_taxonomy** — Reference/lookup table of canonical traits with search keywords
5. **filament_search_embeddings** — Text blobs and JSON-encoded vectors for future semantic search
6. **intelligent_search_logs** — Query analytics for search quality monitoring

### RLS Policies

| Table | Public Read | Admin Write | Insert (anon) |
|---|---|---|---|
| trait_taxonomy | Yes | No (read-only reference) | No |
| filament_properties | Yes | Yes | No |
| filament_trait_tags | Yes | Yes | No |
| filament_use_cases | Yes | Yes | No |
| filament_search_embeddings | Yes | Yes | No |
| intelligent_search_logs | No | Yes (read) | Yes (insert for logging) |

For `intelligent_search_logs`, anonymous/authenticated users can INSERT (for search telemetry), but only admins can SELECT.

### Seed Data

15 rows into `trait_taxonomy` covering strengths, weaknesses, and use cases with related traits and search keywords arrays.

### Technical Details

Single migration SQL covering:
- 6 `CREATE TABLE` statements with all columns, defaults, CHECK constraints for score ranges (1-10, 1-5) and text enums
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 6 tables
- RLS policies using `public.has_role(auth.uid(), 'admin'::app_role)` for admin access (matching existing project patterns)
- `INSERT INTO trait_taxonomy` for seed data
- Indexes on `filament_id` foreign keys and `trait_taxonomy.trait`
- `updated_at` auto-update trigger on `filament_properties` (reusing existing trigger function pattern)

No code changes are needed — this is a schema-only migration.

