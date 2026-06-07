/**
 * Build-freshness check for seamless auto-update.
 *
 * `__BUILD_ID__` is baked into the running bundle at build time; `/version.json`
 * (fetched no-store) holds the currently-deployed build id. If they differ, the
 * code running in this tab is STALE and must be refreshed.
 *
 * The bug this guards: the previous check compared the deployed version against a
 * sessionStorage snapshot taken on this session's first load — so a returning user
 * who booted a stale cached bundle just recorded the new version and kept running
 * old code. Comparing against the RUNNING build is what actually detects staleness.
 */
export function isStaleBuild(
  deployedVersion: string | number | null | undefined,
  runningBuild: string | number | null | undefined,
): boolean {
  // If either side is unknown, we can't safely conclude staleness — never reload.
  if (deployedVersion == null || deployedVersion === '') return false;
  if (runningBuild == null || runningBuild === '') return false;
  return String(deployedVersion) !== String(runningBuild);
}
