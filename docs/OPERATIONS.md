# FilaScope Operations & Maintenance Runbook

> Source of truth for how the site is maintained. Owners: **Hermes** (always-on
> orchestrator) and **Claude Code** (on-call engineer). Established 2026-06-02
> after a multi-week drift incident (see "Drift incident" below).

## Operating model

Three layers, each with a different failure tolerance:

| Layer | Nature | Owns | Writes to repo |
|-------|--------|------|----------------|
| **0 — Deterministic** | Cron / GitHub Actions / Supabase pg_cron. No LLM. Must be self-healing. | Brand scrapes, sitemap refresh, IndexNow, FX rates, price-alert checks, deploys | Bots commit via Actions |
| **Hermes — Orchestrator** | Always-on, scheduled. Runs routine beats, **escalates** judgment work. | Daily health sweep, `llms.txt`/`dateModified` hygiene, news curation, routine SEO | Commits routine work to `main` |
| **Claude Code — Engineer** | On-call judgment + build. | Triage escalations, fix scrapers, features/content, monetization integrity, monthly strategy | **Branches → PR** |

### Guardrails (non-negotiable)

1. **Money & deletes require human sign-off.** Anything touching affiliate tags,
   payout config, or bulk deletes is proposed, never shipped autonomously.
   Everything else (code, content, SEO, infra fixes) is autonomous.
2. **Single writer to `main`.** Hermes commits routine work directly. Claude Code
   works on branches and opens PRs. This prevents two agents racing on `main`
   — which also auto-deploys to Cloudflare on every push.
3. **Silence is an alert.** Every scheduled job must ping a dead-man switch.
   A *missed* run pages us; we do not rely on anyone noticing the absence of work.

### Escalation path

Layer 0 job fails → dead-man switch fires → Hermes triages → if it needs judgment
(broken scraper, schema drift, new brand), Hermes opens a GitHub issue tagged for
Claude Code. Claude Code fixes on a branch → PR → human or Hermes merges.

## Scheduled jobs (Layer 0)

| Workflow / function | Schedule | Purpose | Dead-man switch |
|---------------------|----------|---------|-----------------|
| `sync-filaments.yml` | Daily 02:00/03:00 UTC, Sun full discovery | SpoolmanDB + brand scraping + enrichment | ☐ TODO |
| `refresh-sitemaps.yml` | Sun 05:00 UTC | Regenerate + commit sitemaps, trigger IndexNow | ☐ TODO |
| `indexnow.yml` | On sitemap/page change + Mon 06:00 UTC | Submit URLs to IndexNow/Bing | ☐ TODO |
| `deploy-pages.yml` | On push to `main` | Build + deploy to Cloudflare Pages | n/a (smoke test exists) |
| `daily-price-orchestrator` (Supabase) | Daily | Tiered brand price sync (T1 daily / T2 3d / T3 weekly) | ☐ TODO |
| `enrich-prices-post-sync` (Supabase) | Daily | MSRP backfill, regional pricing, anomaly flags | ☐ TODO |
| `check-price-alerts` (Supabase) | Daily | Trigger user price-drop alerts | ☐ TODO |
| `aggregate-news` + `curate-news` | Weekly | Refresh news feed (Claude-curated) | ☐ TODO |

## Cadence / beats

- **Daily (Hermes):** health sweep — read `brand_sync_logs`, data-integrity,
  link-health. Healthy → log. Anomaly past threshold → escalate.
- **Weekly (Layer 0 + Hermes):** sitemap refresh + IndexNow; `dateModified` and
  `llms.txt` count refresh; news curation.
- **Monthly (Claude Code):** strategic review — rankings vs. baseline audit,
  GA4 traffic, affiliate revenue, monetization compliance, build backlog.

## Known fragility

- **Brand scrapers crash on constraint/upsert collisions.** April 2026 was
  dominated by break-fixes to `esun`, `duramic`, `3dxtech`, `recreus`, `anycubic`.
  Hardening these to be self-healing is Sprint 3.
- **Prerender is a single point of failure.** Crawlers get an empty `<div id="root">`
  if Supabase `/functions/v1/prerender` is unreachable. SSR/static hardening is backlog.
- **`llms.txt` drifts from real counts.** Must be regenerated from the DB, not hand-edited.

## Drift incident (2026-03 → 2026-05)

Lovable feature dev stopped 2026-03-18. April was reactive scraper firefighting.
Sitemaps froze at lastmod **2026-04-28** because `refresh-sitemaps.yml` lacked a
`permissions: contents: write` block — every weekly `git push` 403'd silently and
`github-actions[bot]` never once committed. `llms.txt` went stale (2026-03-31,
claiming 16,107 filaments vs. the live 22,000). The single maintaining agent
(Gunther/OpenClaw) tapered through May and went silent ~2026-05-25. **Nothing
alerted**, because there was no dead-man switch. Root lesson: declared automation
must be *verified* automation, and missed runs must page someone.

## Sprint backlog

- **Sprint 0 (repo-only):** fix `refresh-sitemaps.yml` permissions ✅; this runbook ✅;
  regenerate sitemaps + correct `llms.txt` counts (needs DB read for exact numbers).
- **Sprint 1 (needs Supabase read):** confirm daily scrapes alive; diagnose fragile
  brand syncs; verify last deploy reached Cloudflare.
- **Sprint 2 (keystone):** dead-man switches on every Layer-0 job; wire Sentry +
  `weekly-health-check` + `generate-daily-ops-log` into one alert channel.
- **Sprint 3:** self-healing scrapers; monetization sweep (`rel="sponsored"`,
  Amazon Associates 180-day compliance, dead affiliate-link audit).
</content>
