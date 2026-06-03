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
| `sync-filaments.yml` | Daily 02:00/03:00 UTC, Sun full discovery | SpoolmanDB + brand scraping + enrichment | ✅ `HEALTHCHECK_SYNC_URL` |
| `refresh-sitemaps.yml` | Sun 05:00 UTC | Regenerate + commit sitemaps, trigger IndexNow | ✅ `HEALTHCHECK_SITEMAPS_URL` |
| `indexnow.yml` | On sitemap/page change + Mon 06:00 UTC | Submit URLs to IndexNow/Bing | ☐ TODO |
| `deploy-pages.yml` | On push to `main` | Build + deploy to Cloudflare Pages | n/a (smoke test exists) |
| `daily-price-orchestrator` (Supabase) | Daily | Tiered brand price sync (T1 daily / T2 3d / T3 weekly) | ☐ TODO |
| `enrich-prices-post-sync` (Supabase) | Daily | MSRP backfill, regional pricing, anomaly flags | ☐ TODO |
| `check-price-alerts` (Supabase) | Daily | Trigger user price-drop alerts | ☐ TODO |
| `aggregate-news` + `curate-news` | Weekly | Refresh news feed (Claude-curated) | ☐ TODO |

## Alerting setup (operator handoff)

The detection already existed; it just wasn't wired to anyone. Two layers now route
signal to a channel a human + Hermes actually watch. **Both no-op safely until the
secrets below are set**, so deploying the code can't break anything.

1. **Supabase health functions → `ALERT_WEBHOOK_URL`.** `weekly-health-check` and
   `generate-daily-ops-log` now call `_shared/notify.ts`, firing on `critical_issues`,
   failed brand syncs, `brands_synced == 0`, or high-priority opportunities. Set
   `ALERT_WEBHOOK_URL` to a Slack/Discord/Hermes incoming webhook (accepts `{text}`).
2. **GitHub Actions → external dead-man switch.** `sync-filaments` and
   `refresh-sitemaps` ping a healthchecks.io-style monitor on success (`/fail` on
   failure). The monitor alerts when the *expected ping never arrives* — the one
   failure mode in-workflow alerts can't catch (see auto-disable risk below).
   Create two checks and set `HEALTHCHECK_SYNC_URL` (daily) and
   `HEALTHCHECK_SITEMAPS_URL` (weekly).

**To do:** repoint the legacy `OPENCLAW_HOOK_URL` notifications (still present in
the workflows) from the dead Gunther/OpenClaw agent to the Hermes channel, or retire
them once `ALERT_WEBHOOK_URL` is proven. Remaining Layer-0 jobs (`indexnow`,
`daily-price-orchestrator`, etc.) still need dead-man pings — Sprint 2 follow-up.

## Cadence / beats

- **Daily (Hermes):** health sweep — read `brand_sync_logs`, data-integrity,
  link-health. Healthy → log. Anomaly past threshold → escalate.
- **Weekly (Layer 0 + Hermes):** sitemap refresh + IndexNow; `dateModified` and
  `llms.txt` count refresh; news curation.
- **Monthly (Claude Code):** strategic review — rankings vs. baseline audit,
  GA4 traffic, affiliate revenue, monetization compliance, build backlog.

## Known fragility

- **GitHub auto-disables scheduled workflows after 60 days of repo inactivity.**
  This is a prime suspect for the *total* freeze: if `sync-filaments.yml` /
  `refresh-sitemaps.yml` were auto-disabled, they stop running and emit **no alert**
  (the summary/notify steps never execute). **Check the Actions tab for a "This
  workflow was disabled" banner and re-enable.** The external dead-man switches are
  the defense — they alert on the *absence* of a run.
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
- **Sprint 2 (keystone):** `_shared/notify.ts` + alert wiring for `weekly-health-check`
  and `generate-daily-ops-log` ✅; dead-man pings on `sync-filaments` + `refresh-sitemaps` ✅.
  Follow-up: set the secrets, repoint OpenClaw→Hermes, extend pings to remaining jobs.
- **Sprint 3:** self-healing scrapers; monetization sweep (`rel="sponsored"`,
  Amazon Associates 180-day compliance, dead affiliate-link audit).
</content>
