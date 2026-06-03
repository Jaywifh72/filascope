// Shared alert dispatch for FilaScope edge functions.
//
// The health functions (weekly-health-check, generate-daily-ops-log) already
// DETECT problems but historically only wrote them to a table — so nobody was
// alerted, and the 2026-04 freeze went unnoticed for weeks. This routes those
// signals to a single channel both Hermes and the operator watch.
//
// Configure via the ALERT_WEBHOOK_URL secret (Slack/Discord/Hermes-compatible
// incoming webhook that accepts a JSON body with a `text` field). If the secret
// is unset the call is a safe no-op, so deploying this can never break a function.

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertInput {
  /** Short headline, e.g. "Weekly health check failed". */
  title: string;
  severity: AlertSeverity;
  /** Human-readable body / details. */
  body: string;
  /** Optional structured fields appended as `key: value` lines. */
  fields?: Record<string, string | number>;
  /** Optional link back to a dashboard / run / admin page. */
  url?: string;
}

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

/**
 * Best-effort alert dispatch. Never throws — alerting must not take down the
 * function that called it. Returns true if a webhook was actually invoked.
 */
export async function sendAlert(input: AlertInput): Promise<boolean> {
  const webhookUrl = Deno.env.get("ALERT_WEBHOOK_URL");
  if (!webhookUrl) {
    // No channel configured yet — log so it's visible in function logs.
    console.log(`[alert:${input.severity}] ${input.title} — ${input.body}`);
    return false;
  }

  const lines = [`${SEVERITY_EMOJI[input.severity]} *${input.title}*`, input.body];
  if (input.fields) {
    for (const [k, v] of Object.entries(input.fields)) lines.push(`• ${k}: ${v}`);
  }
  if (input.url) lines.push(input.url);
  const text = lines.join("\n");

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, severity: input.severity, ...input }),
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) {
      console.error(`[alert] webhook returned ${resp.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[alert] dispatch failed (non-blocking):", err);
    return false;
  }
}
