// ═══════════════════════════════════════════════════════════
// Firebase — config, auth, storage, Firestore sync
// Extracted from data.jsx as part of Sprint 1 architectural split
// ═══════════════════════════════════════════════════════════
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification, deleteUser } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, doc as fsDoc, getDoc, setDoc, updateDoc, deleteField, deleteDoc, collection, runTransaction, onSnapshot, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
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
    // initializeAuth with full persistence fallback chain — declared before first use, never chained.
    // IndexedDB → localStorage → sessionStorage → in-memory (handles all browser modes including private).
    _fbAuth=initializeAuth(app,{persistence:[indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence,inMemoryPersistence]});
    // persistentLocalCache enables Firestore offline write buffering — writes queue in IndexedDB
    // while offline and flush automatically when the connection is restored.
    _fbDb=initializeFirestore(app,{localCache:persistentLocalCache()});
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
  // Support both current ("stats") and legacy ("st") key formats when extracting XP.
  const _st=data.stats||data.st||{};
  // Extract streak count — stored in data.streak.count (the full streak object)
  const _strk = (data.streak && typeof data.streak.count === 'number')
    ? data.streak.count
    : (typeof _st.str === 'number' ? _st.str : 0);
  // Extract CEFR level — prefer data field, fall back to localStorage
  const _lvl = data.level
    || (typeof localStorage !== 'undefined' ? (localStorage.getItem('nh_level') || 'A1') : 'A1');
  const incoming = {
    progress:         JSON.stringify(data),
    updated:          serverTimestamp(),
    xp:               _st.xp || 0,
    // ── Hoisted fields — queryable top-level copies of key progress metrics ───
    // Kept in sync on every save. Enables Firestore queries without parsing the blob.
    level:            _lvl,
    streak:           _strk,
    lessonsCompleted: _st.lc || 0,
    lastActive:       serverTimestamp(),
  };
  // Write public leaderboard projection + public profile alongside the private progress doc
  const _nowMs=Date.now();
  const lbEntry={name:data.name||"",xp:_st.xp||0,lc:_st.lc||0,updated:_nowMs};
  // Public profile — readable by friends; used for friend leaderboard
  const profileEntry={name:data.name||"",xp:_st.xp||0,lc:_st.lc||0,streak:_strk,level:_lvl,lastActive:_nowMs};
  try{setDoc(fsDoc(_fbDb,"leaderboard",id),lbEntry,{merge:true}).catch(function(e){console.warn("Leaderboard write failed:",e)});}catch(e){console.warn("Leaderboard write error:",e);}
  try{setDoc(fsDoc(_fbDb,"profiles",id),profileEntry,{merge:true}).catch(function(e){console.warn("Profile write failed:",e)});}catch(e){console.warn("Profile write error:",e);}
  // Denormalize XP into the family doc so family leaderboard always shows live data
  // without depending on the /leaderboard collection being up-to-date for each member.
  const localFam=getLocalFamily();
  if(localFam&&localFam.code){
    try{
      const famRef=fsDoc(_fbDb,"families",localFam.code);
      const _famWeekXP=typeof data.weekXP==='number'?data.weekXP:0;
      updateDoc(famRef,{["memberXP."+id]:{xp:lbEntry.xp,lc:lbEntry.lc,name:lbEntry.name,weekXP:_famWeekXP,updated:_nowMs}}).catch(function(e){console.warn("Family XP sync failed:",e);});
    }catch(e){console.warn("Family XP sync error:",e);}
  } else if(lbEntry.xp>0){
    // Family code not cached locally yet — read from the user's OWN doc to find it.
    // isOwner passes: every user can always read their own /users/{id} doc.
    // Fire-and-forget so it doesn't block the progress save.
    getDoc(fsDoc(_fbDb,"users",id)).then(function(uSnap){
      const fc=uSnap.exists()?uSnap.data().familyCode:null;
      const _fbWeekXP2=typeof data.weekXP==='number'?data.weekXP:0;
      if(fc){updateDoc(fsDoc(_fbDb,"families",fc),{["memberXP."+id]:{xp:lbEntry.xp,lc:lbEntry.lc,name:lbEntry.name,weekXP:_fbWeekXP2,updated:incoming.updated}}).catch(function(){});}
    }).catch(function(){});
  }
  // Direct write — no transaction read needed.
  // Previously used runTransaction to skip writes when remote XP was >100 ahead, but that
  // required two Firestore round-trips (~400-800ms total). If the user closed the browser
  // during that window after completing a lesson, the write never finished — causing the
  // "1-2 lessons behind" cross-device gap. Multi-device conflicts are now handled entirely
  // client-side via MAX/union merging in the fbWatchProgress real-time listener.
  try{
    await setDoc(fsDoc(_fbDb,"users",id),incoming,{merge:true});
    return{ok:true};
  }catch(e){
    console.warn("FB save error:",e);
    return{ok:false,err:"Progress could not be saved. Check your connection."};
  }
}
export async function fbLoadProgress(uid){
  if(!_fbReady||!_fbDb)return null;
  const id=uid.replace(/[.#$/\[\]]/g,"_");
  for(let attempt=0;attempt<3;attempt++){
    try{
      const snap=await getDoc(fsDoc(_fbDb,"users",id));
      if(snap.exists()){const _sd=snap.data({serverTimestamps:'estimate'});if(_sd.progress){const p=JSON.parse(_sd.progress);const _upd=_sd.updated;if(_upd)p._fbUpdated=_upd.toMillis?_upd.toMillis():Number(_upd);return p}}
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
export async function fbJoinFamily(code,uid,email,name){
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
          updateDoc(fsDoc(_fbDb,"families",jcode),{["memberXP."+jid]:{xp:lbd.xp||0,lc:lbd.lc||0,name:lbd.name||name,updated:Date.now()}}).catch(function(){});
        } else {
          // Also try /users/{id} in case leaderboard doc is missing
          getDoc(fsDoc(_fbDb,"users",jid)).then(function(us){
            const ud=us.exists()?us.data():null;
            if(ud&&(ud.xp||0)>0){
              updateDoc(fsDoc(_fbDb,"families",jcode),{["memberXP."+jid]:{xp:ud.xp||0,lc:0,name:name||uid,updated:Date.now()}}).catch(function(){});
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
    // Never reads /leaderboard for other users; that collection is now owner-only.
    return members.map(function(m){
      const id=(m.email||m.uid||"").replace(/[.#$/\[\]]/g,"_");
      const xpData=(id&&memberXP[id])||{};
      return{name:xpData.name||m.name,email:m.email||"",role:m.role,xp:xpData.xp||0,lc:xpData.lc||0,joined:m.joined};
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
        const id=(m.email||m.uid||"").replace(/[.#$/\[\]]/g,"_");
        const xpData=(id&&memberXP[id])||{};
        return{name:xpData.name||m.name,email:m.email||"",role:m.role,xp:xpData.xp||0,lc:xpData.lc||0,weekXP:xpData.weekXP||0,joined:m.joined};
      });
      callback(results.sort(function(a,b){return b.xp-a.xp;}));
    },
    function(err){console.warn("fbWatchFamilyMembers error:",err);}
  );
}
export async function fbLeaveFamily(code,email){
  if(!_fbReady||!_fbDb)return{ok:false};
  try{const leaveSnap=await getDoc(fsDoc(_fbDb,"families",code));
  if(!leaveSnap.exists())return{ok:false};
  const data=leaveSnap.data();const members=(data.members||[]).filter(function(m){return m.email!==email});
  const memberEmails=(data.memberEmails||[]).filter(function(e){return e!==email});
  const id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"families",code),{members:members,memberEmails:memberEmails},{merge:true});
  // Delete memberXP entry so ghost data doesn't accumulate in the family doc
  updateDoc(fsDoc(_fbDb,"families",code),{["memberXP."+id]:deleteField()}).catch(function(){});
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:null},{merge:true});
  localStorage.removeItem("uFamily");
  return{ok:true}}catch(e){return{ok:false}}
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
      try{const p=JSON.parse(_wd.progress);const _wu=_wd.updated;p._fbUpdated=_wu?(_wu.toMillis?_wu.toMillis():Number(_wu)):0;if(_wd.favs_live){try{const _lf=JSON.parse(_wd.favs_live);const _lts=_wd.favs_live_ts?(_wd.favs_live_ts.toMillis?_wd.favs_live_ts.toMillis():Number(_wd.favs_live_ts)):0;const _bts=p._fbUpdated||0;const _bk=new Set((p.favs||[]).map(function(f){return f.hr||f.name;}));for(const _f of _lf){if(!_bk.has(_f.hr||_f.name)){(p.favs=p.favs||[]).push(_f);_bk.add(_f.hr||_f.name);}}if(_lts>_bts){const _lk=new Set(_lf.map(function(f){return f.hr||f.name;}));p.favs=(p.favs||[]).filter(function(f){return _lk.has(f.hr||f.name);});}}catch(_){}}callback(p,p._fbUpdated);}
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
