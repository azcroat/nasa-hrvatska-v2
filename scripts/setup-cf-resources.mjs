#!/usr/bin/env node
/**
 * scripts/setup-cf-resources.mjs
 *
 * Idempotent Cloudflare infrastructure setup for Naša Hrvatska.
 * Creates any missing KV namespaces and binds them to the Pages project.
 *
 * Usage (local):
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=xxx node scripts/setup-cf-resources.mjs
 *
 * Usage (CI — GitHub Actions):
 *   Requires secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
 *
 * What it does:
 *   1. Creates NH_CLANS KV namespace if it does not exist
 *   2. Binds it to the nasa-hrvatska-v2 Pages project (production + preview)
 *   3. Verifies FIREBASE_PROJECT_ID env var is set on the Pages project (warns if not)
 *   4. Prints a summary of all bindings
 *
 * Design principles:
 *   - Fully idempotent — safe to run on every deploy (no duplicate resources)
 *   - Read-before-write — fetches current state before patching
 *   - Non-destructive — never removes existing bindings
 *   - Exits 0 on success, 1 on fatal error (CI-safe)
 */

const API = 'https://api.cloudflare.com/client/v4';
const PAGES_PROJECT = 'nasa-hrvatska-v2';

// KV namespaces required by Pages Functions
// binding: the name used in env.BINDING_NAME inside the function
// title:   the human-readable name in the Cloudflare dashboard
const REQUIRED_KV = [
  { binding: 'NH_CLANS', title: 'nasa-hrvatska-clans' },
  { binding: 'XP_VELOCITY', title: 'nasa-hrvatska-xp-velocity' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function requireEnv(name) {
  const val = process.env[name];
  if (!val) { console.error(`\x1b[31mFATAL\x1b[0m: $${name} is not set`); process.exit(1); }
  return val;
}

async function cfFetch(path, options = {}) {
  const token = requireEnv('CLOUDFLARE_API_TOKEN');
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!json.success) {
    const errs = (json.errors || []).map(e => `${e.code}: ${e.message}`).join('; ');
    throw new Error(`CF API ${options.method || 'GET'} ${path} failed — ${errs || `HTTP ${res.status}`}`);
  }
  return json;
}

// ── Step 1: List existing KV namespaces ──────────────────────────────────────

async function listKVNamespaces(accountId) {
  let page = 1;
  const all = [];
  while (true) {
    const data = await cfFetch(`/accounts/${accountId}/storage/kv/namespaces?page=${page}&per_page=100`);
    all.push(...(data.result || []));
    const info = data.result_info || {};
    if (!info.total_count || all.length >= info.total_count) break;
    page++;
  }
  return all; // [{id, title, supports_url_encoding}]
}

// ── Step 2: Create KV namespace if missing ───────────────────────────────────

async function ensureKVNamespace(accountId, title) {
  const namespaces = await listKVNamespaces(accountId);
  const existing = namespaces.find(ns => ns.title === title);
  if (existing) {
    console.log(`  ✓ KV namespace already exists: "${title}" (${existing.id})`);
    return existing.id;
  }
  console.log(`  ↗ Creating KV namespace: "${title}"...`);
  const data = await cfFetch(`/accounts/${accountId}/storage/kv/namespaces`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  const id = data.result.id;
  console.log(`  ✓ Created KV namespace: "${title}" (${id})`);
  return id;
}

// ── Step 3: Get Pages project ────────────────────────────────────────────────

async function getPagesProject(accountId, projectName) {
  const data = await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`);
  return data.result;
}

// ── Step 4: Bind KV namespace to Pages project ───────────────────────────────

async function ensurePageKVBinding(accountId, projectName, project, binding, namespaceId) {
  const envs = ['production', 'preview'];
  let needsPatch = false;

  for (const env of envs) {
    const envConfig = project.deployment_configs?.[env] || {};
    const existing = envConfig.kv_namespaces || {};
    if (existing[binding]?.namespace_id === namespaceId) {
      console.log(`  ✓ "${binding}" already bound in ${env} (${namespaceId})`);
    } else {
      console.log(`  ↗ Will bind "${binding}" → ${namespaceId} in ${env}`);
      needsPatch = true;
    }
  }

  if (!needsPatch) return;

  // Build the PATCH payload — merge new binding with all existing bindings
  const patch = { deployment_configs: {} };
  for (const env of envs) {
    const current = project.deployment_configs?.[env] || {};
    patch.deployment_configs[env] = {
      kv_namespaces: {
        ...(current.kv_namespaces || {}),
        [binding]: { namespace_id: namespaceId },
      },
    };
  }

  await cfFetch(`/accounts/${accountId}/pages/projects/${projectName}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  console.log(`  ✓ Bound "${binding}" to Pages project in production + preview`);
}

// ── Step 5: Verify required env vars are set on the Pages project ─────────────

function checkPageEnvVars(project) {
  const REQUIRED_ENV_VARS = ['FIREBASE_PROJECT_ID'];
  const envs = ['production', 'preview'];
  const missing = [];

  for (const envName of REQUIRED_ENV_VARS) {
    for (const env of envs) {
      const envVars = project.deployment_configs?.[env]?.env_vars || {};
      if (!envVars[envName]) {
        missing.push(`${env}/${envName}`);
      }
    }
  }

  if (missing.length) {
    console.warn('\n\x1b[33mWARN\x1b[0m: The following environment variables are not set on the Pages project:');
    for (const m of missing) {
      console.warn(`  ✗ ${m}`);
    }
    console.warn('\nSet them in: Cloudflare Dashboard → Pages → nasa-hrvatska-v2 → Settings → Environment Variables');
    console.warn('Required for clan auth: FIREBASE_PROJECT_ID = your Firebase project ID\n');
  } else {
    console.log('  ✓ All required Pages env vars are set');
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const accountId = requireEnv('CLOUDFLARE_ACCOUNT_ID');

  console.log('\n\x1b[36m═══ Naša Hrvatska — Cloudflare resource setup ═══\x1b[0m\n');
  console.log(`  Project: ${PAGES_PROJECT}`);
  console.log(`  Account: ${accountId.slice(0, 8)}…\n`);

  // Step 1+2: Ensure all required KV namespaces exist
  console.log('\x1b[1mStep 1/3 — KV Namespaces\x1b[0m');
  const namespaceIds = {};
  for (const { binding, title } of REQUIRED_KV) {
    namespaceIds[binding] = await ensureKVNamespace(accountId, title);
  }

  // Step 3: Load current Pages project config
  console.log('\n\x1b[1mStep 2/3 — Pages Bindings\x1b[0m');
  let project;
  try {
    project = await getPagesProject(accountId, PAGES_PROJECT);
  } catch (e) {
    console.error(`\x1b[31mFATAL\x1b[0m: Could not load Pages project "${PAGES_PROJECT}": ${e.message}`);
    process.exit(1);
  }

  // Step 4: Bind each KV namespace if not already bound
  for (const { binding } of REQUIRED_KV) {
    await ensurePageKVBinding(accountId, PAGES_PROJECT, project, binding, namespaceIds[binding]);
  }

  // Reload project after patching so env var check sees the latest state
  project = await getPagesProject(accountId, PAGES_PROJECT);

  // Step 5: Verify required env vars
  console.log('\n\x1b[1mStep 3/3 — Environment Variables\x1b[0m');
  checkPageEnvVars(project);

  // Summary
  console.log('\n\x1b[32m✓ Cloudflare resource setup complete\x1b[0m\n');
  console.log('KV namespace IDs (for reference):');
  for (const [binding, id] of Object.entries(namespaceIds)) {
    console.log(`  ${binding}: ${id}`);
  }
  console.log();
}

main().catch(e => {
  console.error('\n\x1b[31mFATAL\x1b[0m:', e.message);
  process.exit(1);
});
