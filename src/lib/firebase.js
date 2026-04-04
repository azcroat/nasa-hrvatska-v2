// ═══════════════════════════════════════════════════════════
// Firebase — config, auth, storage, Firestore sync
// Extracted from data.jsx as part of Sprint 1 architectural split
// ═══════════════════════════════════════════════════════════
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification, deleteUser } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, getFirestore, doc as fsDoc, getDoc, setDoc, updateDoc, deleteField, deleteDoc, collection, runTransaction, onSnapshot, serverTimestamp, arrayUnion, arrayRemove, writeBatch, increment } from 'firebase/firestore';
import { getAnalytics, logEvent as _fbLogEvent, isSupported as analyticsIsSupported } from 'firebase/analytics';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // optional — Analytics only
};
export let _fbReady = false;
let _fbAuth = null, _fbDb = null, _fbAnalytics = null;
export function initFirebase(){
  if(_fbReady)return false;
  try{
    const app=getApps().length?getApps()[0]:initializeApp(FIREBASE_CONFIG);
    // initializeAuth with persistent fallback chain — IndexedDB → localStorage → sessionStorage.
    // inMemoryPersistence intentionally excluded: it loses auth on page refresh, which would
    // cause logged-in users to appear signed out and lose progress sync on next load.
    _fbAuth=initializeAuth(app,{persistence:[indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence]});
    // Firestore cache init — three-tier fallback so a cache failure never blocks auth or sign-in.
    // Tier 1: multi-tab persistent (requires BroadcastChannel + IndexedDB — fixes b815 error).
    // Tier 2: single-tab persistent (IndexedDB only — for browsers without BroadcastChannel).
    // Tier 3: memory cache (always works — no offline sync, but sign-in still functions).
    try{_fbDb=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});}
    catch(_e1){try{_fbDb=initializeFirestore(app,{localCache:persistentLocalCache()});}
    catch(_e2){try{_fbDb=initializeFirestore(app,{localCache:memoryLocalCache()});}
    catch(_e3){_fbDb=getFirestore(app);}}}
    _fbReady=true;
    // Analytics — async, fire-and-forget. Only enabled in production (requires measurementId).
    // analyticsIsSupported() checks for cookies + iframes blocked by ad blockers gracefully.
    if(FIREBASE_CONFIG.measurementId){
      analyticsIsSupported().then(function(ok){
        if(ok)_fbAnalytics=getAnalytics(app);
      }).catch(function(){});
    }
    return true;
  }catch(e){console.error("Firebase init failed:",e);return false}
}
// Auto-init on module load
initFirebase();

/**
 * Log a Firebase Analytics event. No-op if analytics is not available.
 * @param {string} eventName
 * @param {object} [params]
 */
export function fbLogEvent(eventName, params){
  try{if(_fbAnalytics)_fbLogEvent(_fbAnalytics,eventName,params||{});}catch{}
}
export function getDb(){ return _fbDb; }

// ═══ LOCAL PROGRESS & SESSION STORAGE ═══
export function gP(u){try{return JSON.parse(localStorage.getItem("uP_"+u))}catch{return null}}
export function sP(u,p){localStorage.setItem("uP_"+u,JSON.stringify(p));fbSaveProgress(u,p)}
// lP — local-only cache, no Firestore write. Use when hydrating from Firebase to avoid
// a circular write (read → sP → write back → onSnapshot → read again).
export function lP(u,p){localStorage.setItem("uP_"+u,JSON.stringify(p))}
export function gS(){try{return JSON.parse(localStorage.getItem("uS"))}catch{return null}}
export function sS(s){localStorage.setItem("uS",JSON.stringify({...s,lastActive:Date.now()}))}
export function cS(){localStorage.removeItem("uS")}
export function touchSession(){const s=gS();if(s)localStorage.setItem("uS",JSON.stringify({...s,lastActive:Date.now()}))}
export function isSessionExpired(){const s=gS();if(!s||!s.lastActive)return true;return(Date.now()-s.lastActive)>30*60*1000}
export function isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}

// ═══ FIREBASE SYNC ═══
export async function fbSaveProgress(uid,data){
  if(!_fbReady||!_fbDb)return{ok:true};
  const id=uid.replace(/[.#$/\[\]]/g,"_");
  const _st=data.stats||data.st||{};
  const _strk = (data.streak && typeof data.streak.count === 'number')
    ? data.streak.count
    : (typeof _st.str === 'number' ? _st.str : 0);
  // _lvl must be a number >= 1 for the Firestore profiles rule (level >= 1).
  // localStorage stores CEFR strings like 'A1','B2'; map to 1-6 so the rule passes.
  const _lvlRaw = data.level || (typeof localStorage !== 'undefined' ? (localStorage.getItem('nh_level') || 'A1') : 'A1');
  const _CEFR_NUM = { A1:1, A2:2, B1:3, B2:4, C1:5, C2:6 };
  const _lvl = (typeof _lvlRaw === 'number' && _lvlRaw >= 1) ? _lvlRaw : (_CEFR_NUM[_lvlRaw] || 1);
  const _nowMs=Date.now();
  // Cross-device race guard: fbApplyDelta may have committed higher xp/lc via atomic increment
  // (e.g. from another device) before this periodic save runs. Always take the max of:
  //   1. data being written (current local React state)
  //   2. local cache (updated by _processSnapshot which already does Math.max with Firestore)
  // This prevents validXpUpdate / validLbXpUpdate Firestore rules from rejecting writes where
  // the server-side xp is already higher than what we're about to write.
  const _cachedP = gP(id);
  const _cachedSt = (_cachedP && (_cachedP.stats || _cachedP.st)) || {};
  const _bestXP = Math.max(_st.xp || 0, _cachedSt.xp || 0);
  const _bestLC = Math.max(_st.lc || 0, _cachedSt.lc || 0);
  // Also protect streak and level — another device's higher values must not regress.
  // Streak: take max count; stale cached count can only be lower, never higher.
  const _cachedStrk = (_cachedP && typeof _cachedP.streak?.count === 'number')
    ? _cachedP.streak.count
    : (_cachedSt.str || 0);
  const _bestStrk = Math.max(_strk, _cachedStrk);
  // Level: CEFR maps A1→1…C2→6; a higher number = higher proficiency — never regress.
  const _cachedLvlRaw = _cachedP && _cachedP.level;
  const _cachedLvl = typeof _cachedLvlRaw === 'number' ? _cachedLvlRaw : (_CEFR_NUM[_cachedLvlRaw] || 1);
  const _bestLvl = Math.max(_lvl, _cachedLvl);
  // Size guard: Firestore validProgressSize() rejects blobs > 200KB (204800 bytes).
  // Each FSRS card is ~110 bytes; 1800+ cards can exceed the limit and silently block
  // all sync writes. Prune by sorting cards soonest-due first and dropping the most
  // distant/stable (already mastered) cards until the blob fits.
  const _PROGRESS_LIMIT = 180000; // 180KB — safe margin under the 200KB Firestore rule
  let _progressJson = JSON.stringify(data);
  if (_progressJson.length > _PROGRESS_LIMIT && data.sr && typeof data.sr === 'object') {
    const _srEntries = Object.entries(data.sr).sort(([,a],[,b]) => (a.due||0) - (b.due||0));
    let _kept = _srEntries.length;
    while (_kept > 50) {
      _kept = Math.floor(_kept * 0.75);
      _progressJson = JSON.stringify({ ...data, sr: Object.fromEntries(_srEntries.slice(0, _kept)) });
      if (_progressJson.length <= _PROGRESS_LIMIT) break;
    }
    console.warn('[sync] SRS pruned to', _kept, 'cards to fit 200KB Firestore limit');
  }
  const lbEntry={name:data.name||"",xp:_bestXP,lc:_bestLC,updated:_nowMs};
  const profileEntry={name:data.name||"",xp:_bestXP,lc:_bestLC,streak:_bestStrk,level:_bestLvl,lastActive:_nowMs};
  const userEntry = {
    progress:         _progressJson,
    updated:          serverTimestamp(),
    xp:               _bestXP,
    level:            _bestLvl,
    streak:           _bestStrk,
    lessonsCompleted: _bestLC,
    lastActive:       serverTimestamp(),
  };
  // Family XP: fire-and-forget (different collection, can tolerate eventual consistency)
  const localFam=getLocalFamily();
  if(localFam&&localFam.code){
    try{
      const famRef=fsDoc(_fbDb,"families",localFam.code);
      const _famWeekXP=typeof data.weekXP==='number'?data.weekXP:0;
      updateDoc(famRef,{["memberXP."+id]:{xp:lbEntry.xp,lc:lbEntry.lc,name:lbEntry.name,weekXP:_famWeekXP,updated:_nowMs}}).catch(function(e){console.warn("Family XP sync failed:",e);});
    }catch(e){console.warn("Family XP sync error:",e);}
  } else if(lbEntry.xp>0){
    getDoc(fsDoc(_fbDb,"users",id)).then(function(uSnap){
      const fc=uSnap.exists()?uSnap.data().familyCode:null;
      const _fbWeekXP2=typeof data.weekXP==='number'?data.weekXP:0;
      if(fc){updateDoc(fsDoc(_fbDb,"families",fc),{["memberXP."+id]:{xp:lbEntry.xp,lc:lbEntry.lc,name:lbEntry.name,weekXP:_fbWeekXP2,updated:_nowMs}}).catch(function(){});}
    }).catch(function(){});
  }
  // Atomic batch: users + leaderboard + profiles written together or not at all
  try{
    const batch = writeBatch(_fbDb);
    batch.set(fsDoc(_fbDb,"users",id), userEntry, {merge:true});
    batch.set(fsDoc(_fbDb,"leaderboard",id), lbEntry, {merge:true});
    batch.set(fsDoc(_fbDb,"profiles",id), profileEntry, {merge:true});
    await batch.commit();
    return{ok:true};
  }catch(e){
    // Log full error to console.error (NOT suppressed in production) so we can diagnose
    console.error("FB save error:",e?.code,e?.message,e);
    return{ok:false,err:e?.message||"Progress could not be saved. Check your connection.",code:e?.code};
  }
}
/**
 * fbApplyDelta — atomic, conflict-free stat update using Firestore primitives.
 *
 * Uses FieldValue.increment() for numeric counters and arrayUnion() for arrays.
 * Two devices calling fbApplyDelta simultaneously will BOTH succeed: no last-write-wins,
 * no snapshot overwrite, no XP lost. This is the core mechanism that prevents multi-device
 * progress divergence for user-initiated stat changes.
 *
 * @param {string} uid
 * @param {{ xp?:number, lc?:number, gc?:number, sp?:number, de?:number,
 *           rc?:number, pf?:number, mv?:number, hi?:number,
 *           ct?:string[], vs?:string[], badges?:string[] }} delta
 */
export async function fbApplyDelta(uid, delta){
  if(!_fbReady||!_fbDb||!uid||!delta)return;
  const _NUMERIC=['xp','lc','gc','sp','de','rc','pf','mv','hi'];
  const _ARRAYS=['ct','vs','badges'];
  const id=uid.replace(/[.#$/\[\]]/g,"_");
  const update={};
  let hasUpdate=false;
  for(const k of _NUMERIC){
    const v=delta[k];
    if(typeof v==='number'&&v>0){
      update['stats.'+k]=increment(v);
      if(k==='xp')update.xp=increment(v);            // keep top-level in sync for leaderboard queries
      if(k==='lc')update.lessonsCompleted=increment(v);
      hasUpdate=true;
    }
  }
  for(const k of _ARRAYS){
    const arr=delta[k];
    if(Array.isArray(arr)&&arr.length>0){
      update['stats.'+k]=arrayUnion(...arr);
      hasUpdate=true;
    }
  }
  if(!hasUpdate)return;
  try{
    await updateDoc(fsDoc(_fbDb,'users',id),update);
  }catch(e){
    // If doc doesn't exist yet (brand-new user before first snapshot save), create it
    if(e?.code==='not-found'){
      try{
        const seed={};
        for(const k of _NUMERIC){if(typeof delta[k]==='number'&&delta[k]>0)seed[k]=delta[k];}
        for(const k of _ARRAYS){if(Array.isArray(delta[k])&&delta[k].length>0)seed[k]=delta[k];}
        await setDoc(fsDoc(_fbDb,'users',id),{stats:seed},{merge:true});
      }catch(e2){console.warn('[sync] fbApplyDelta setDoc fallback failed:',e2?.code);}
    }else{
      console.warn('[sync] fbApplyDelta failed:',e?.code,e?.message);
    }
  }
}

export async function fbLoadProgress(uid){
  if(!_fbReady||!_fbDb)return null;
  const id=uid.replace(/[.#$/\[\]]/g,"_");
  for(let attempt=0;attempt<3;attempt++){
    try{
      const snap=await getDoc(fsDoc(_fbDb,"users",id));
      if(snap.exists()){
        const _sd=snap.data({serverTimestamps:'estimate'});
        if(_sd.progress){
          let p;
          try { p=JSON.parse(_sd.progress); } catch(pe){ console.warn('fbLoadProgress: corrupted progress JSON',pe); return null; }
          const _upd=_sd.updated;
          if(_upd)p._fbUpdated=_upd.toMillis?_upd.toMillis():Number(_upd);
          // Overlay atomic stats map — these are always at least as current as the snapshot blob
          // because fbApplyDelta writes them on every user action, not just on periodic saves.
          if(_sd.stats){
            const _as=_sd.stats; const _bs=p.stats||p.st||{};
            p.stats={
              ..._bs,..._as,
              xp:    Math.max(_bs.xp    ||0,_as.xp    ||0),
              lc:    Math.max(_bs.lc    ||0,_as.lc    ||0),
              gc:    Math.max(_bs.gc    ||0,_as.gc    ||0),
              sp:    Math.max(_bs.sp    ||0,_as.sp    ||0),
              de:    Math.max(_bs.de    ||0,_as.de    ||0),
              rc:    Math.max(_bs.rc    ||0,_as.rc    ||0),
              pf:    Math.max(_bs.pf    ||0,_as.pf    ||0),
              mv:    Math.max(_bs.mv    ||0,_as.mv    ||0),
              hi:    Math.max(_bs.hi    ||0,_as.hi    ||0),
              ct:    [...new Set([...(_bs.ct    ||[]),...(_as.ct    ||[])])],
              vs:    [...new Set([...(_bs.vs    ||[]),...(_as.vs    ||[])])],
              badges:[...new Set([...(_bs.badges||[]),...(_as.badges||[])])],
            };
          }
          return p;
        }
      }
      return null; // doc exists but no progress field, or doc missing — no retry needed
    }catch(e){
      console.warn(`fbLoadProgress attempt ${attempt+1}/3 failed:`,e);
      if(attempt<2)await new Promise(r=>setTimeout(r,2000));
    }
  }
  return null;
}
export async function fbRegister(email,password,displayName){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured. Account created locally only."};
  try{const cred=await createUserWithEmailAndPassword(_fbAuth,email,password);
  try{await updateProfile(cred.user,{displayName:displayName})}catch(pe){console.warn("Profile update failed:",pe)}
  try{await sendEmailVerification(cred.user)}catch(ve){console.warn("Email verification send failed:",ve)}
  try{const id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{displayName:displayName,email:email,created:Date.now()},{merge:true})}catch(fe){console.warn("Firestore profile write failed:",fe)}
  fbLogEvent('sign_up',{method:'email'});
  return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbLogin(email,password){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{const cred=await signInWithEmailAndPassword(_fbAuth,email,password);fbLogEvent('login',{method:'email'});return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbLogout(){if(_fbReady&&_fbAuth)try{await fbSignOut(_fbAuth)}catch(e){}}
export async function fbLoginGoogle(){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{
    const provider=new GoogleAuthProvider();
    // Always show account chooser so users with multiple Google accounts can pick
    provider.setCustomParameters({prompt:"select_account"});
    const cred=await signInWithPopup(_fbAuth,provider);
    fbLogEvent('login',{method:'google'});
    return{ok:true,user:cred.user};
  }catch(e){
    // Popup blocked or user closed it — not an error worth showing
    if(e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request")return{ok:false,err:""};
    return{ok:false,err:friendlyError(e.message)};
  }
}
export async function fbResetPassword(email){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{await sendPasswordResetEmail(_fbAuth,email);return{ok:true}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export function friendlyError(msg){
  if(!msg)return"Something went wrong. Please try again.";
  if(msg.includes("email-already-in-use"))return"This email already has an account. Try signing in instead!";
  if(msg.includes("weak-password"))return"Password must be at least 6 characters.";
  if(msg.includes("invalid-email"))return"Please enter a valid email address.";
  if(msg.includes("user-not-found")||msg.includes("wrong-password")||msg.includes("invalid-credential"))return"Invalid email or password.";
  if(msg.includes("too-many-requests"))return"Too many attempts. Please wait a few minutes.";
  if(msg.includes("network-request-failed"))return"No internet connection. Check your WiFi.";
  if(msg.includes("unauthorized-domain"))return"Authentication blocked. Please try again or contact support.";
  if(msg.includes("permission-denied")||msg.includes("permission"))return"Permission error — please try again or contact support.";
  if(msg.includes("user-disabled"))return"This account has been disabled. Contact support.";
  if(msg.includes("account-exists-with-different-credential"))return"An account already exists with this email using a different sign-in method.";
  if(msg.includes("requires-recent-login"))return"Please sign out and sign in again to complete this action.";
  if(msg.includes("popup-closed-by-user"))return"Sign-in was cancelled. Please try again.";
  if(msg.includes("internal-error"))return"A server error occurred. Please try again.";
  if(msg.includes("quota-exceeded"))return"Service temporarily unavailable. Please try again later.";
  if(msg.includes("app-not-authorized"))return"App not authorized. Please contact support.";
  if(msg.includes("expired-action-code"))return"This link has expired. Please request a new one.";
  if(msg.includes("invalid-action-code"))return"This link is invalid or has already been used.";
  if(msg.includes("missing-email"))return"Please enter your email address.";
  return msg.replace(/Firebase:\s*/i,"").replace(/\([^)]+\)\.?/,"").trim()||"Something went wrong."
}

// ═══ FAMILY GROUP SYSTEM ═══
export function generateFamilyCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";const arr=new Uint8Array(6);crypto.getRandomValues(arr);return Array.from(arr).map(function(b){return chars[b%chars.length]}).join("")}
export function getLocalFamily(){try{return JSON.parse(localStorage.getItem("uFamily")||"null")}catch{return null}}
export function saveLocalFamily(f){localStorage.setItem("uFamily",JSON.stringify(f))}
export async function fbCreateFamily(familyName,creatorUid,creatorEmail,creatorName){
  if(!_fbReady||!_fbDb)return{ok:false,err:"Firebase not configured."};
  try{let code=generateFamilyCode();
  try{const existing=await getDoc(fsDoc(_fbDb,"families",code));
  if(existing.exists())code=generateFamilyCode()}catch(e){}
  try{await setDoc(fsDoc(_fbDb,"families",code),{name:familyName,code:code,created:Date.now(),members:[{uid:creatorUid,email:creatorEmail,name:creatorName,role:"admin",joined:Date.now()}],memberEmails:[creatorEmail]})}catch(fe){console.warn("Family write failed:",fe);return{ok:false,err:"Could not create family. Check Firebase permissions."}}
  try{const id=creatorUid.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code},{merge:true})}catch(ue){console.warn("User family link failed:",ue)}
  const fam={name:familyName,code:code,role:"admin"};saveLocalFamily(fam);
  return{ok:true,code:code,family:fam}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbJoinFamily(code,uid,email,name,weekXP){
  if(!_fbReady||!_fbDb)return{ok:false,err:"Firebase not configured."};
  let resultFam=/** @type {any} */ (null);let alreadyIn=false;
  try{
    await runTransaction(_fbDb,async function(tx){
      const famRef=fsDoc(_fbDb,"families",code.toUpperCase());
      const snap=await tx.get(famRef);
      if(!snap.exists())throw new Error("NOTFOUND:Family code not found. Check and try again.");
      const data=snap.data();const members=data.members||[];const memberEmails=data.memberEmails||[];
      if(members.some(function(m){return m.email===email||m.uid===uid})){
        // Already a member — restore local state, skip write
        const existing=members.find(function(m){return m.email===email||m.uid===uid});
        resultFam={name:data.name,code:code.toUpperCase(),role:existing?existing.role:"member"};
        alreadyIn=true;return;
      }
      const updatedMembers=[...members,{uid:uid,email:email,name:name,role:"member",joined:Date.now()}];
      const updatedEmails=[...new Set([...memberEmails,email])];
      tx.set(famRef,{members:updatedMembers,memberEmails:updatedEmails},{merge:true});
      resultFam={name:data.name,code:code.toUpperCase(),role:"member"};
    });
    if(!resultFam)return{ok:false,err:"Could not join family. Please try again."};
    saveLocalFamily(resultFam);
    if(!alreadyIn){
      const id=uid.replace(/[.#$/\[\]]/g,"_");
      await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code.toUpperCase()},{merge:true});
    }
    // Fire-and-forget: write joiner's existing XP into memberXP immediately so they
    // appear on the leaderboard without needing to complete another lesson first.
    (function(){
      const jid=uid.replace(/[.#$/\[\]]/g,"_");
      const jcode=resultFam.code;
      getDoc(fsDoc(_fbDb,"leaderboard",jid)).then(function(lbs){
        const lbd=lbs.exists()?lbs.data():null;
        if(lbd&&(lbd.xp||0)>0){
          updateDoc(fsDoc(_fbDb,"families",jcode),{["memberXP."+jid]:{xp:lbd.xp||0,lc:lbd.lc||0,weekXP:weekXP||0,name:lbd.name||name,updated:Date.now()}}).catch(function(){});
        } else {
          // Also try /users/{id} in case leaderboard doc is missing
          getDoc(fsDoc(_fbDb,"users",jid)).then(function(us){
            const ud=us.exists()?us.data():null;
            if(ud&&(ud.xp||0)>0){
              updateDoc(fsDoc(_fbDb,"families",jcode),{["memberXP."+jid]:{xp:ud.xp||0,lc:0,weekXP:weekXP||0,name:name||uid,updated:Date.now()}}).catch(function(){});
            }
          }).catch(function(){});
        }
      }).catch(function(){});
    })();
    return{ok:true,family:resultFam};
  }catch(e){
    const msg=e.message||"";
    if(msg.startsWith("NOTFOUND:"))return{ok:false,err:msg.slice(9)};
    return{ok:false,err:friendlyError(msg)};
  }
}
export async function fbGetFamilyMembers(code){
  if(!_fbReady||!_fbDb)return[];
  try{
    const famSnap2=await getDoc(fsDoc(_fbDb,"families",code));
    if(!famSnap2.exists())return[];
    const data=famSnap2.data();const members=data.members||[];
    const memberXP=data.memberXP||{};
    // Read XP from the family doc's memberXP map — written by fbSaveProgress on every save.
    // memberXP keys are Firebase Auth UIDs (written by fbSaveProgress). Try uid first,
    // then fall back to sanitized email for legacy entries written before this fix.
    // Never reads /leaderboard for other users; that collection is now owner-only.
    return members.map(function(m){
      const uidId=(m.uid||"").replace(/[.#$/\[\]]/g,"_");
      const emailId=(m.email||"").replace(/[.#$/\[\]]/g,"_");
      const xpData=(uidId&&memberXP[uidId])||(emailId&&memberXP[emailId])||{};
      return{name:xpData.name||m.name,email:m.email||"",role:m.role,xp:xpData.xp||0,lc:xpData.lc||0,weekXP:xpData.weekXP||0,joined:m.joined};
    }).sort(function(a,b){return b.xp-a.xp});
  }catch(e){return[]}
}
// Real-time listener on the /families/{code} doc.
// Fires immediately with current data, then on every remote change (e.g. a child saves progress).
// Returns an unsubscribe function. XP is read from the family doc's memberXP map — written by
// fbSaveProgress on every save. Never reads /leaderboard for other users.
export function fbWatchFamilyMembers(code,callback){
  if(!_fbReady||!_fbDb)return function(){};
  return onSnapshot(
    fsDoc(_fbDb,"families",code),
    function(snap){
      if(!snap.exists()){callback([]);return;}
      const data=snap.data();const members=data.members||[];
      const memberXP=data.memberXP||{};
      const results=members.map(function(m){
        const uidId=(m.uid||"").replace(/[.#$/\[\]]/g,"_");
        const emailId=(m.email||"").replace(/[.#$/\[\]]/g,"_");
        const xpData=(uidId&&memberXP[uidId])||(emailId&&memberXP[emailId])||{};
        return{name:xpData.name||m.name,email:m.email||"",role:m.role,xp:xpData.xp||0,lc:xpData.lc||0,weekXP:xpData.weekXP||0,joined:m.joined};
      });
      callback(results.sort(function(a,b){return b.xp-a.xp;}));
    },
    function(err){console.warn("fbWatchFamilyMembers error:",err);}
  );
}
export async function fbLeaveFamily(code,email){
  if(!_fbReady||!_fbDb)return{ok:false,err:'Firebase not ready'};
  const id=email.replace(/[.#$/\[\]]/g,"_");
  // Helper: remove user from a specific family document
  async function _removeMember(familyCode){
    const snap=await getDoc(fsDoc(_fbDb,"families",familyCode));
    if(!snap.exists())return false;
    const data=snap.data();
    const members=(data.members||[]).filter(function(m){return m.email!==email});
    const memberEmails=(data.memberEmails||[]).filter(function(e){return e!==email});
    await setDoc(fsDoc(_fbDb,"families",familyCode),{members:members,memberEmails:memberEmails},{merge:true});
    updateDoc(fsDoc(_fbDb,"families",familyCode),{["memberXP."+id]:deleteField()}).catch(function(){});
    return true;
  }
  try{
    // First try the supplied code; if it fails or doesn't exist, fall back to
    // whatever familyCode is stored on the user's Firestore document.
    let leftCode=code;
    let removed=false;
    if(code){
      try{ removed=await _removeMember(code); }catch(e){console.warn('[family] leave attempt with supplied code failed:',e?.code,e?.message);}
    }
    if(!removed){
      // Fall back: read the actual familyCode from the user doc
      const userSnap=await getDoc(fsDoc(_fbDb,"users",id));
      const actualCode=userSnap.exists()?userSnap.data().familyCode:null;
      if(actualCode&&actualCode!==code){
        leftCode=actualCode;
        try{ removed=await _removeMember(actualCode); }catch(e){console.warn('[family] leave fallback also failed:',e?.code,e?.message);}
      }
    }
    // Always clear the familyCode on the user doc and local state, regardless of
    // whether the family document update succeeded — this prevents being stuck.
    await setDoc(fsDoc(_fbDb,"users",id),{familyCode:null},{merge:true});
    localStorage.removeItem("uFamily");
    if(!removed)console.warn('[family] fbLeaveFamily: could not remove from family doc for code',leftCode,'— user doc and local state cleared anyway');
    return{ok:true};
  }catch(e){
    console.error('[family] fbLeaveFamily critical error:',e?.code,e?.message);
    // Last resort: clear local state so the user is not stuck
    localStorage.removeItem("uFamily");
    return{ok:false,err:e?.message||'Could not leave family'};
  }
}
export async function fbLoadUserFamily(email){
  if(!_fbReady||!_fbDb)return null;
  try{const id=email.replace(/[.#$/\[\]]/g,"_");
  const userSnap2=await getDoc(fsDoc(_fbDb,"users",id));
  if(!userSnap2.exists()||!userSnap2.data().familyCode)return null;
  const code=userSnap2.data().familyCode;
  const famDoc2=await getDoc(fsDoc(_fbDb,"families",code));
  if(!famDoc2.exists())return null;
  const data=famDoc2.data();const member=data.members.find(function(m){return m.email===email});
  const fam={name:data.name,code:code,role:member?member.role:"member"};saveLocalFamily(fam);
  return fam}catch(e){return null}
}
export function fbOnAuthStateChanged(cb){if(!_fbReady||!_fbAuth)return()=>{};return onAuthStateChanged(_fbAuth,cb)}
export async function fbDeleteAccount(userId){
  if(!_fbReady)return{ok:false,err:"Firebase not ready."};
  try{
    const id=userId.replace(/[.#$/\[\]]/g,"_");
    await Promise.allSettled([
      deleteDoc(fsDoc(_fbDb,"users",id)),
      deleteDoc(fsDoc(_fbDb,"leaderboard",id)),
      deleteDoc(fsDoc(_fbDb,"profiles",id)),
    ]);
    if(_fbAuth&&_fbAuth.currentUser)await deleteUser(_fbAuth.currentUser);
    return{ok:true};
  }catch(e){return{ok:false,err:friendlyError(e.message)}}
}

/**
 * GDPR Article 20 — right to data portability.
 * Reads all three Firestore docs owned by the user plus the full set of
 * app-owned localStorage keys and returns a structured JSON-serialisable object.
 * Strips any field named "password" as a safety precaution before returning.
 */
export async function fbExportUserData(uid) {
  try {
    const id = uid.replace(/[.#$/\[\]]/g, '_');
    const [userDoc, lbDoc, profileDoc] = await Promise.all([
      getDoc(fsDoc(_fbDb, 'users', id)),
      getDoc(fsDoc(_fbDb, 'leaderboard', id)),
      getDoc(fsDoc(_fbDb, 'profiles', id)),
    ]);

    // Gather all app-owned localStorage keys
    const localData = {};
    const keysToExport = [
      'nh_sr', 'xpCooldown', 'uStreak', 'nh_streak_repair',
      'nh_placement_done', 'nh_level', 'nh_goal', 'nh_onboarded',
      'nh_favorites', 'nh_dark', 'nh_sound', 'topic_accuracy',
      'nh_journey', 'nh_install_date', 'nh_letter_to_self',
      'nh_font_size', 'nh_reduce_motion', 'nh_prestige',
      'cookie_consent_v1', 'cookieConsent',
      'uFamily', 'uS',
    ];
    keysToExport.forEach(function(key) {
      const raw = localStorage.getItem(key);
      if (raw === null) return;
      try { localData[key] = JSON.parse(raw); } catch { localData[key] = raw; }
    });
    // Also include the progress blob stored under the user's own key
    const progressRaw = localStorage.getItem('uP_' + id);
    if (progressRaw) {
      try { localData['uP_' + id] = JSON.parse(progressRaw); } catch { localData['uP_' + id] = progressRaw; }
    }

    const fsProgress = userDoc.exists() ? userDoc.data({serverTimestamps:'estimate'}) : null;
    const fsLeaderboard = lbDoc.exists() ? lbDoc.data() : null;
    const fsProfile = profileDoc.exists() ? profileDoc.data() : null;

    // Safety: strip any field named "password" that should never be stored here
    if (fsProgress) delete fsProgress.password;

    const exportData = {
      exportDate: new Date().toISOString(),
      account: { uid: id },
      firestore: {
        progress: fsProgress,
        leaderboard: fsLeaderboard,
        profile: fsProfile,
      },
      localStorage: localData,
    };

    return exportData;
  } catch(err) {
    console.error('fbExportUserData failed:', err);
    throw err;
  }
}
// Real-time listener — fires immediately with current data, then on every remote change.
// Returns an unsubscribe function. Use lP() inside the callback to cache locally
// without triggering a circular Firestore write.
export function fbWatchProgress(uid,callback){
  if(!_fbReady||!_fbDb)return()=>{};
  const id=uid.replace(/[.#$/\[\]]/g,"_");
  return onSnapshot(
    fsDoc(_fbDb,"users",id),
    function(snap){
      if(!snap.exists())return;const _wd=snap.data({serverTimestamps:'estimate'});if(!_wd.progress)return;
      try{
        const p=JSON.parse(_wd.progress);
        const _wu=_wd.updated;
        p._fbUpdated=_wu?(_wu.toMillis?_wu.toMillis():Number(_wu)):0;
        // Overlay atomic stats map — same logic as fbLoadProgress
        if(_wd.stats){
          const _as=_wd.stats; const _bs=p.stats||p.st||{};
          p.stats={
            ..._bs,..._as,
            xp:    Math.max(_bs.xp    ||0,_as.xp    ||0),
            lc:    Math.max(_bs.lc    ||0,_as.lc    ||0),
            gc:    Math.max(_bs.gc    ||0,_as.gc    ||0),
            sp:    Math.max(_bs.sp    ||0,_as.sp    ||0),
            de:    Math.max(_bs.de    ||0,_as.de    ||0),
            rc:    Math.max(_bs.rc    ||0,_as.rc    ||0),
            pf:    Math.max(_bs.pf    ||0,_as.pf    ||0),
            mv:    Math.max(_bs.mv    ||0,_as.mv    ||0),
            hi:    Math.max(_bs.hi    ||0,_as.hi    ||0),
            ct:    [...new Set([...(_bs.ct    ||[]),...(_as.ct    ||[])])],
            vs:    [...new Set([...(_bs.vs    ||[]),...(_as.vs    ||[])])],
            badges:[...new Set([...(_bs.badges||[]),...(_as.badges||[])])],
          };
        }
        if(_wd.favs_live){try{const _lf=JSON.parse(_wd.favs_live);const _lts=_wd.favs_live_ts?(_wd.favs_live_ts.toMillis?_wd.favs_live_ts.toMillis():Number(_wd.favs_live_ts)):0;const _bts=p._fbUpdated||0;const _bk=new Set((p.favs||[]).map(function(f){return f.hr||f.name;}));for(const _f of _lf){if(!_bk.has(_f.hr||_f.name)){(p.favs=p.favs||[]).push(_f);_bk.add(_f.hr||_f.name);}}if(_lts>_bts){const _lk=new Set(_lf.map(function(f){return f.hr||f.name;}));p.favs=(p.favs||[]).filter(function(f){return _lk.has(f.hr||f.name);});}}catch(_){}}
        callback(p,p._fbUpdated);
      }
      catch(e){console.warn("fbWatchProgress parse error:",e);}
    },
    function(err){console.warn("fbWatchProgress error:",err);}
  );
}

// Immediate atomic Firestore write for favorite toggles — bypasses the debounced autosave
// so a favorite added just before app close is never lost on the next device.
// Writes a `favs_live` field alongside the progress doc; fbWatchProgress union-merges it in.
export async function fbToggleFavorite(uid,favsList){
  if(!_fbReady||!_fbDb||!uid)return;
  const id=uid.replace(/[.#$/\[\]]/g,"_");
  try{await setDoc(fsDoc(_fbDb,"users",id),{favs_live:JSON.stringify(favsList),favs_live_ts:serverTimestamp()},{merge:true});}
  catch(e){console.warn("fbToggleFavorite error:",e);}
}
// Returns the cached Firebase ID token for navigator.sendBeacon authentication.
// Passes false to avoid a network round-trip in the unload path — uses cached token.
export async function fbGetIdToken(){
  if(!_fbAuth||!_fbAuth.currentUser)return'';
  try{return await _fbAuth.currentUser.getIdToken(false);}catch{return'';}
}

// Save a reaction emoji for a family achievement to Firestore
// achievementKey: "{email}_{type}_{date}" — uniquely identifies a milestone
// emoji: the reaction string (e.g. "🔥")
// reactorName: display name of the person reacting
// reactorEmail: email of the person reacting (used as the unique reactor key)
export async function fbSaveReaction(familyCode, achievementKey, emoji, reactorName, reactorEmail) {
  if (!_fbReady || !_fbDb || !familyCode || !achievementKey || !emoji) return { ok: false };
  try {
    const safeKey = achievementKey.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeReactor = (reactorEmail || reactorName || 'anon').replace(/[^a-zA-Z0-9_@.]/g, '_').slice(0, 40);
    const ref = fsDoc(_fbDb, 'families', familyCode, 'reactions', safeKey);
    try {
      await updateDoc(ref, { [`reactors.${safeReactor}`]: { emoji, name: reactorName, updatedAt: Date.now() } });
    } catch (e) {
      // Document doesn't exist yet — create it
      await setDoc(ref, { reactors: { [safeReactor]: { emoji, name: reactorName, updatedAt: Date.now() } } });
    }
    return { ok: true };
  } catch (e) {
    console.warn('fbSaveReaction error:', e);
    return { ok: false };
  }
}

// Watch all reactions in a family — fires on every change
// Returns an unsubscribe function
export function fbWatchReactions(familyCode, callback) {
  if (!_fbReady || !_fbDb || !familyCode) return function () {};
  try {
    const colRef = collection(_fbDb, 'families', familyCode, 'reactions');
    return onSnapshot(colRef, function (snap) {
      const reactions = {};
      snap.forEach(function (doc) {
        reactions[doc.id] = doc.data();
      });
      callback(reactions);
    }, function (err) { console.warn('fbWatchReactions error:', err); });
  } catch (e) {
    console.warn('fbWatchReactions setup error:', e);
    return function () {};
  }
}

// ═══ FRIEND SYSTEM ═══
// Friend codes: 6-char alphanumeric derived from the safe UID.
// /friendCodes/{code} → {uid, name} — public lookup index (any auth user can read)
// /profiles/{uid} → {name, xp, level, streak, lc, lastActive} — public stats for friends
// /users/{uid}.friendUids → string[] — list of friend UIDs (owner-only)

/** Derives a deterministic 6-char friend code from a safe UID. */
export function getFriendCode(uid) {
  return uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
}

/**
 * Register (or refresh) this user's code in the public lookup index.
 * Call once after sign-in to ensure the index entry is current.
 */
export async function fbRegisterFriendCode(uid, displayName) {
  if (!_fbReady || !_fbDb || !uid) return;
  const safeUid = uid.replace(/[.#$/\[\]]/g, '_');
  const code = getFriendCode(safeUid);
  try {
    await setDoc(
      fsDoc(_fbDb, 'friendCodes', code),
      { uid: safeUid, name: displayName || 'Learner', updated: Date.now() },
      { merge: true }
    );
  } catch (e) { console.warn('fbRegisterFriendCode error:', e); }
}

/**
 * Add a friend by their 6-char code.
 * Looks up their UID in /friendCodes, then writes bidirectional friend link
 * using arrayUnion so concurrent adds never clobber each other.
 */
export async function fbAddFriend(myUid, myName, theirCode) {
  if (!_fbReady || !_fbDb) return { ok: false, err: 'Not connected.' };
  const safeMyUid = myUid.replace(/[.#$/\[\]]/g, '_');
  const cleanCode = (theirCode || '').toUpperCase().trim();
  if (!cleanCode) return { ok: false, err: 'Enter a friend code.' };
  try {
    const codeSnap = await getDoc(fsDoc(_fbDb, 'friendCodes', cleanCode));
    if (!codeSnap.exists()) return { ok: false, err: 'No user found with that code.' };
    const theirUid = codeSnap.data().uid;
    if (theirUid === safeMyUid) return { ok: false, err: "That's your own code!" };
    // Bidirectional add — both users see each other
    await setDoc(fsDoc(_fbDb, 'users', safeMyUid), { friendUids: arrayUnion(theirUid) }, { merge: true });
    await setDoc(fsDoc(_fbDb, 'users', theirUid), { friendUids: arrayUnion(safeMyUid) }, { merge: true });
    // Read their public profile for the optimistic UI return
    const profileSnap = await getDoc(fsDoc(_fbDb, 'profiles', theirUid));
    const profile = profileSnap.exists() ? profileSnap.data() : { name: codeSnap.data().name };
    return { ok: true, friend: { uid: theirUid, ...profile } };
  } catch (e) {
    console.warn('fbAddFriend error:', e);
    return { ok: false, err: 'Could not add friend. Try again.' };
  }
}

/**
 * Load all friends' public profiles.
 * Reads /users/{myUid}.friendUids then batch-reads /profiles/{uid}.
 */
export async function fbGetFriends(myUid) {
  if (!_fbReady || !_fbDb || !myUid) return [];
  const safeMyUid = myUid.replace(/[.#$/\[\]]/g, '_');
  try {
    const snap = await getDoc(fsDoc(_fbDb, 'users', safeMyUid));
    if (!snap.exists()) return [];
    const friendUids = snap.data().friendUids || [];
    if (!friendUids.length) return [];
    const profiles = await Promise.all(
      friendUids.map(uid => getDoc(fsDoc(_fbDb, 'profiles', uid)))
    );
    return profiles
      .filter(s => s.exists())
      .map(s => ({ uid: s.id, ...s.data() }))
      .sort((a, b) => (b.xp || 0) - (a.xp || 0));
  } catch (e) { console.warn('fbGetFriends error:', e); return []; }
}

/**
 * Remove a friend — removes from both users' friendUids arrays.
 */
export async function fbRemoveFriend(myUid, theirUid) {
  if (!_fbReady || !_fbDb || !myUid || !theirUid) return;
  const safeMyUid = myUid.replace(/[.#$/\[\]]/g, '_');
  try {
    await updateDoc(fsDoc(_fbDb, 'users', safeMyUid), { friendUids: arrayRemove(theirUid) });
    await updateDoc(fsDoc(_fbDb, 'users', theirUid), { friendUids: arrayRemove(safeMyUid) });
  } catch (e) { console.warn('fbRemoveFriend error:', e); }
}
