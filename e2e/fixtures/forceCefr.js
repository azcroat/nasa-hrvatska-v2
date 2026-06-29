// e2e/fixtures/forceCefr.js
// SP10: forces the user's computed CEFR level by stamping uP_<email>.st
// with values that produce the desired band, and removes nh_daily_session
// so the session rebuilds with the forced state.

export const CEFR_XP_TABLE = {
  A1: 0,
  A2: 500,
  B1: 2000,
  B2: 5000,
  C1: 12000,
  C2: 20000,
};

export async function forceCefr(page, cefr, opts = {}) {
  const xp = CEFR_XP_TABLE[cefr];
  if (xp === undefined) {
    throw new Error(`forceCefr: unknown CEFR ${cefr}`);
  }
  await page.addInitScript(
    ({ xp, cefr, clearSession }) => {
      try {
        const uS = localStorage.getItem('uS');
        if (!uS) return;
        const parsed = JSON.parse(uS);
        const email = parsed && parsed.u;
        if (!email) return;
        const profileKey = 'uP_' + email;
        const raw = localStorage.getItem(profileKey);
        if (!raw) return;
        const profile = JSON.parse(raw);
        profile.st = { ...(profile.st || {}), xp, lc: 0, gc: 0 };
        localStorage.setItem(profileKey, JSON.stringify(profile));
        // Rec #4: the grammar-mastery gate would otherwise cap a forced B2+ level
        // back to B1 (these fixtures set gc:0). Seed the never-demote floor to the
        // forced level so the gate is transparent for tests that force a CEFR band.
        localStorage.setItem('nh_cefr_floor', cefr);
        if (clearSession) localStorage.removeItem('nh_daily_session');
      } catch {
        // localStorage absent — silent no-op
      }
    },
    { xp, cefr, clearSession: opts.clearSession !== false },
  );
}
