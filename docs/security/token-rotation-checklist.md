# Token Rotation Checklist

Rotate any secret that has been:

- Exposed in CI logs visible to people no longer on the project
- Used by a third-party action pinned to a moving ref (`@master`, `@main`, `@v1`)
- Present in a machine that may have been compromised
- Older than 12 months without rotation (annual hygiene)

This is hygiene, not incident response. The 2026-05-13 supply-chain scan found no Shai-Hulud indicators — but rotation is cheap insurance after any time of elevated supply-chain noise.

## Tokens in use

Each row: where to read it, how to rotate it, what breaks if you don't update consumers.

| # | Secret | Stored in | Rotate at | What breaks until consumer is updated |
|---|---|---|---|---|
| 1 | `CLOUDFLARE_API_TOKEN` | GitHub Actions secrets, possibly local shell | dash.cloudflare.com → My Profile → API Tokens → Create Token (scope: Pages:Edit + Workers KV:Edit on this account only) | Cloudflare Pages deploy step in `ci.yml` (`Deploy to Cloudflare Pages`) and `setup-cf-resources.mjs` |
| 2 | `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions secrets | not a secret per se — this is an identifier, doesn't need rotation unless leaked | — |
| 3 | `VITE_FIREBASE_API_KEY` (+ the rest of `VITE_FIREBASE_*`) | GitHub Actions secrets, Cloudflare Pages env vars | Firebase Console → Project Settings → General → "Restart" Web app, or generate new Web app credentials and migrate; **also restrict via App Check + API key restrictions** | Web app authentication and Firestore reads until new key propagates |
| 4 | Firebase Admin service account JSON | wherever `firebase-admin` is initialized (Functions, scripts) | Firebase Console → Project Settings → Service accounts → Generate new private key. **Then revoke the old one.** | Any backend script/function using firebase-admin |
| 5 | `VITE_SENTRY_DSN` | GitHub Actions secrets, Cloudflare Pages env vars | Sentry → Settings → Projects → javascript-react → Client Keys (DSN) → "+New Client Key", then deactivate old | Error reporting (silently — no app crash) |
| 6 | PostHog project API key | embedded in client bundle | PostHog → Project Settings → Project API Key → Rotate (new key is appended; old keeps working until you remove it) | Analytics ingestion for users on old build until they reload |
| 7 | Azure TTS subscription key | Cloudflare KV / env var (`AZURE_TTS_KEY` in functions/) | Azure Portal → Cognitive Services → keys page → "Regenerate Key 1" (key 2 stays valid — rotate without downtime) | TTS audio for everyone until env var is updated and CF Pages redeploys |
| 8 | ElevenLabs API key | Cloudflare KV / env var | elevenlabs.io → Profile → API Key → "+New API Key", revoke old | TTS audio fallback path |
| 9 | Anthropic API key | Cloudflare KV / env var (`ANTHROPIC_API_KEY`) | console.anthropic.com → Settings → API Keys → Create, then disable old | AI Story, Dialogue Sim, Daily Culture endpoints |
| 10 | `VAPID_PRIVATE_KEY` (Web Push) | Cloudflare env var | `npx web-push generate-vapid-keys` locally → set new pair in Cloudflare env → users must re-subscribe to push (no automatic migration) | Existing push subscriptions become invalid; new subscriptions work immediately |
| 11 | `SONAR_TOKEN` | GitHub Actions secrets | sonarcloud.io → My Account → Security → Generate Tokens | SonarCloud scan in `ci.yml` (non-blocking — has `continue-on-error: true`) |
| 12 | `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` | GitHub Actions secrets | browserstack.com → Account → Settings → "Regenerate access key" | `browserstack.yml` workflow (manual dispatch only) |
| 13 | Android signing: `KEYSTORE_PASS`, `KEY_PASS`, `KEYSTORE_BASE64` | GitHub Actions secrets, `Dropbox/Master Folder - Schreiner/Croatian Learning Application/nasa-hrvatska-release.jks` | **DO NOT ROTATE.** A Play Store app is tied to its signing keystore — losing or changing it means you cannot publish updates under the same listing. If compromised, you must publish a new listing and ask users to migrate. Keep the `.jks` in your password manager / Dropbox encrypted folder only. | — |
| 14 | `PLAY_SERVICE_ACCOUNT_JSON` | GitHub Actions secrets | Google Cloud Console → IAM → Service Accounts → keys → Add Key → Create new, then delete the old key | Auto-upload to Play Console (manual upload still works) |
| 15 | `TEST_EMAIL` / `TEST_PASSWORD` | GitHub Actions secrets | Firebase Auth → reset the test account password, update secret | BrowserStack auth tests |

## How to rotate a GitHub Actions secret

```text
GitHub repo → Settings → Secrets and variables → Actions → click the secret name → "Update secret"
```

The next workflow run uses the new value automatically. **No deploy is needed for the secret itself**, but if the secret is also used to build the client (e.g. `VITE_*` baked into bundle), you need a fresh CI run to ship it.

## How to rotate a Cloudflare Pages env var

```text
dash.cloudflare.com → Pages → nasa-hrvatska-v2 → Settings → Environment variables → edit → "Save and deploy"
```

The "Save and deploy" button triggers a fresh deploy automatically.

## Post-rotation verification (10 minutes)

After rotating, verify quickly:

1. Push a trivial commit to master (e.g. a comment-only change) → watch CI green, Cloudflare deploy green
2. Open https://nasahrvatska.com → sign in → check no Firebase auth errors in DevTools console
3. Trigger one TTS playback → audio still works (Azure or ElevenLabs key)
4. Check Sentry dashboard 5 minutes later → new errors still flowing in (DSN still valid)

If any of those fail, the rotation didn't propagate fully — check the secret name spelling and whether all the consumers (GitHub Actions + Cloudflare Pages) were updated.

## What NOT to do

- **Don't rotate the Android signing keystore.** Once published to Play Store, that key is permanent. Losing it means re-listing the app.
- **Don't commit the new value to git.** Even `.env.example` should only have placeholders.
- **Don't share rotation values over email/Slack.** Use your password manager's secure note feature, or update the secret directly in the GitHub/Cloudflare UI.
- **Don't rotate everything at once.** Rotate one secret, verify it works, then move to the next. If something breaks, you know which rotation caused it.
