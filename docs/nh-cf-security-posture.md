# Cloudflare Security Posture & Edge-Block Runbook — nasahrvatska.com

Single source of truth for the Cloudflare zone security configuration and the
runbook for diagnosing/remediating edge blocks. Referenced by
`.github/workflows/cf-security-audit.yml` and `cf-incident-diagnose.yml`.

Zone: `nasahrvatska.com` (zone id `9f2ba0e8d16ebd53bd23d989fd03bd90`)
CF account: jschreiner75@gmail.com

---

## Documented intended posture

| Surface | Expected value | Set by |
|---|---|---|
| `browser_check` | `on` | cf-security-tighten (2026-05-16) |
| `challenge_ttl` | `1800` | cf-security-tighten |
| `security_level` | `medium` | cf-security-tighten |
| SBFM (Super Bot Fight Mode) | `Allow` (definitely + likely automated) | TTS fix 2026-05-15 — required for `fetch()` to reach `/api/*` |
| Bot Fight Mode | off | cf-skip-bot-on-api |
| WAF custom rules (`http_request_firewall_custom`) | none / clean | cf-security-tighten deleted the broad `/api/*` skip rule |
| WAF Managed + OWASP Core | active on all paths | left enforcing after skip-rule removal |
| IP Access Rules | only intentional, narrowly-scoped entries | — |

Defense-in-depth means a transient challenge on `/api/*` still hits the Firebase
auth gate + per-user quota + rate-limit middleware, so app-layer abuse is covered
even if an edge rule is loosened.

---

## Edge-block incident — 2026-06-27

**Symptom.** Existing macOS users (Safari, on iCloud Private Relay / VPN IPs) were
served Cloudflare's hard block page: bookmark hover showed `Attention Required! |
Cloudflare`; opening it showed **"Sorry, you have been blocked — You are unable to
access nasahrvatska.com."** Existing users are *not* gated by the signup Turnstile,
so this was an edge block, not an app problem.

**Why every monitor stayed green.**
- `cf-security-audit` only inspected the `http_request_firewall_custom` ruleset
  (reported "clean state") — it never enumerated IP Access Rules, WAF Managed
  Rules, or Security Events, which is where an IP/threat-score block lives.
- `production-smoke` runs from GitHub's Azure datacenter IPs (clean reputation),
  including the WebKit/Safari and Mobile Safari projects — so a *Safari* request
  passed. The block was **client-IP / threat-score scoped** (Private Relay / VPN /
  ASN reputation), which CI cannot reproduce from a clean IP.

**Root-cause class.** Either (a) an **IP Access Rule** blocking an ASN/country/
category that catches iCloud Private Relay & VPN egress, (b) a **WAF Managed/OWASP
rule** in block mode false-positiving after the 2026-05-15 removal of the `/api/*`
skip rule widened enforcement to all paths/clients, or (c) **SBFM** set to block
"likely automated" (Private Relay is frequently classed as such). Confirm which via
`cf-incident-diagnose` (Security Events name the exact rule + client ASN).

**Not a compromise.** The block page is Cloudflare's own, served from our zone; DNS
unchanged; `/.well-known/security.txt` and `/api/tts` returned correct app
responses throughout. A hijack would have broken those. To fully close the
compromise question: Manage Account → Audit Log (confirm only expected actors made
changes) + verify account MFA.

---

## Edge-block incident runbook

### 1. Diagnose (read-only, no risk)
Run **Actions → cf-incident-diagnose**. It enumerates IP Access Rules, WAF Managed
Rules, custom + rate-limit rules, zone settings, SBFM, and the **Security Events**
that name the exact `source/ruleId` and the blocked client `ASN / country / path`.

Faster path during a live incident: ask a blocked user for the **Ray ID** printed
on their block page, then dashboard → **Security → Events** and search that Ray ID —
it points straight at the rule.

### 2. Remediate — matched to what the diagnostic names

| Diagnostic finds… | Remediation (least-blast-radius first) |
|---|---|
| **IP Access Rule** block on an ASN / country / category catching real users | Delete or change that rule's mode to `whitelist`/off via `DELETE /zones/{z}/firewall/access_rules/rules/{id}` or the dashboard (Security → Tools). Country/ASN blocks are the most common false-positive source for Private Relay. |
| **WAF Managed / OWASP rule** false-positive (`source: managed`) | Override the **specific rule id** to action `log` (not block) via the managed ruleset override — do **not** disable the whole ruleset. Dashboard: Security → WAF → Managed rules → edit rule → action = Log. |
| **SBFM** blocking likely/definitely automated | Set the offending SBFM tier to `allow` (matches documented posture). Dashboard: Security → Bots. |
| **Zone setting** (`security_level=high/under_attack`, `browser_check=on`) challenging Private-Relay/VPN IPs | Lower `security_level` to `medium`/`low`, or set `browser_check=off`. The existing **cf-skip-bot-on-api** workflow performs the browser_check/bot levers; revert later with **cf-security-tighten**. |

After any change, re-run `cf-incident-diagnose` and confirm Security-Events block
volume drops. Restore the documented posture (table at top) once the false positive
is scoped out, and record the deviation here.

### 3. Verify
- `cf-incident-diagnose` step 7 (Safari UA probe) returns 200 with no `cf-mitigated`.
- `production-smoke` "homepage is not a Cloudflare block / challenge page" passes.
- Confirm with an affected user on iCloud Private Relay.

---

## Related app-layer fix (separate issue, same incident window)

New-user **signup** was independently broken: the CSP in `public/_headers` did not
whitelist `challenges.cloudflare.com`, so the Turnstile widget
(`src/components/auth/TurnstileWidget.tsx`) could not load and the Sign-Up screen
showed *"Could not load verification challenge…"* with "Create Account" disabled.
Fixed 2026-06-27 by adding `https://challenges.cloudflare.com` to `script-src`,
`connect-src`, and `frame-src`. Keep those entries as long as Turnstile is in the
auth flow.
