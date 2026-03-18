/**
 * fix_hydration.cjs — Fix 2
 * Replaces 3 copy-pasted remote-progress hydration blocks in App.jsx
 * with applyRemoteProgress(fp/p).
 */
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
let src = fs.readFileSync(appPath, 'utf8');

function replaceExact(source, startStr, endStr, replacement, label) {
  // Verify exactly one occurrence of the startStr in the file
  let count = 0, pos = -1, p = 0;
  while ((p = source.indexOf(startStr, p)) !== -1) { count++; pos = p; p++; }
  if (count !== 1) {
    console.error(`ABORT [${label}]: found ${count} occurrences of startStr (expected 1)`);
    process.exit(1);
  }
  const endIdx = source.indexOf(endStr, pos);
  if (endIdx === -1) {
    console.error(`ABORT [${label}]: endStr not found after startStr`);
    process.exit(1);
  }
  const blockEnd = endIdx + endStr.length;
  console.log(`✓ ${label}: ${blockEnd - pos} chars replaced`);
  return source.slice(0, pos) + replacement + source.slice(blockEnd);
}

const PREFIX_FP = 'if(fp.onboarded){localStorage.setItem("onboarded","true");setOnboarded(true);}if(fp.sr)saveSR(fp.sr);if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}';
const PREFIX_P  = 'if(p.onboarded){localStorage.setItem("onboarded","true");setOnboarded(true);}if(p.sr)saveSR(p.sr);if(p.streak)localStorage.setItem("uStreak",JSON.stringify(p.streak));if(p.favs){localStorage.setItem("uFavs",JSON.stringify(p.favs));setFavs(p.favs);}if(p.journal){localStorage.setItem("uJournal",JSON.stringify(p.journal));setJWords(p.journal);}';

// Block 1 — session restore: unique start = PREFIX_FP + 'var _n1='
src = replaceExact(src,
  PREFIX_FP + 'var _n1=',
  'localStorage.setItem("xpCooldown",JSON.stringify(_cd));}}',
  'applyRemoteProgress(fp);',
  'block1 session-restore'
);

// Block 2 — firebase auth: unique start = PREFIX_P + 'var _n2='
src = replaceExact(src,
  PREFIX_P + 'var _n2=',
  'localStorage.setItem("xpCooldown",JSON.stringify(_cd2));}',
  'applyRemoteProgress(p);',
  'block2 firebase-auth'
);

// Block 3 — visibility: unique start = PREFIX_FP + 'var _vnd='
src = replaceExact(src,
  PREFIX_FP + 'var _vnd=',
  'localStorage.setItem("xpCooldown",JSON.stringify(_vcd));}}',
  'applyRemoteProgress(fp);',
  'block3 visibility'
);

// Safety
if (src.includes('applyRemoteProgress(applyRemoteProgress')) {
  console.error('ABORT: Double-replacement!'); process.exit(1);
}
const finalFp = (src.match(/applyRemoteProgress\(fp\)/g)||[]).length;
const finalP  = (src.match(/applyRemoteProgress\(p\)/g)||[]).length;
console.log(`\nResult: ${finalFp} applyRemoteProgress(fp), ${finalP} applyRemoteProgress(p)`);

fs.writeFileSync(appPath, src, 'utf8');
console.log('✅ Done. App.jsx updated.');
