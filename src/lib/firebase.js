// ═══════════════════════════════════════════════════════════
// Firebase — config, auth, storage, Firestore sync
// Extracted from data.jsx as part of Sprint 1 architectural split
// ═══════════════════════════════════════════════════════════
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, browserSessionPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification, deleteUser } from 'firebase/auth';
import { getFirestore, doc as fsDoc, getDoc, setDoc, updateDoc, deleteField, deleteDoc, collection, getDocs, query, limit, orderBy, runTransaction, onSnapshot } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
export let _fbReady = false;
let _fbAuth = null, _fbDb = null;
export function initFirebase(){
  if(_fbReady)return false;
  try{
    const app=getApps().length?getApps()[0]:initializeApp(FIREBASE_CONFIG);
    _fbAuth=getAuth(app);_fbDb=getFirestore(app);_fbReady=true;
    // Persistence fallback chain: local (IndexedDB) → session (sessionStorage) → silent fail (in-memory).
    // Privacy browsers (DuckDuckGo, Firefox strict, Safari ITP, Chrome incognito) block IndexedDB.
    // browserSessionPersistence uses sessionStorage which is always available.
    setPersistence(_fbAuth,browserLocalPersistence).catch(()=>setPersistence(_fbAuth,browserSessionPersistence)).catch(()=>{});return true
  }catch(e){console.error("Firebase init failed:",e);return false}
}
// Auto-init on module load
initFirebase();

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
  const incoming={progress:JSON.stringify(data),updated:Date.now(),xp:_st.xp||0};
  // Write public leaderboard projection alongside the private progress doc
  const lbEntry={name:data.name||"",xp:_st.xp||0,lc:_st.lc||0,updated:incoming.updated};
  try{setDoc(fsDoc(_fbDb,"leaderboard",id),lbEntry,{merge:true}).catch(function(e){console.warn("Leaderboard write failed:",e)});}catch(e){console.warn("Leaderboard write error:",e);}
  // Denormalize XP into the family doc so family leaderboard always shows live data
  // without depending on the /leaderboard collection being up-to-date for each member.
  const localFam=getLocalFamily();
  if(localFam&&localFam.code){
    try{
      const famRef=fsDoc(_fbDb,"families",localFam.code);
      const _famWeekXP=typeof data.weekXP==='number'?data.weekXP:0;
      updateDoc(famRef,{["memberXP."+id]:{xp:lbEntry.xp,lc:lbEntry.lc,name:lbEntry.name,weekXP:_famWeekXP,updated:incoming.updated}}).catch(function(e){console.warn("Family XP sync failed:",e);});
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
      if(snap.exists()&&snap.data().progress){const p=JSON.parse(snap.data().progress);if(snap.data().updated)p._fbUpdated=snap.data().updated;return p}
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
  return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbLogin(email,password){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{const cred=await signInWithEmailAndPassword(_fbAuth,email,password);return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbLogout(){if(_fbReady&&_fbAuth)try{await fbSignOut(_fbAuth)}catch(e){}}
export async function fbLoginGoogle(){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{
    const provider=new GoogleAuthProvider();
    // Always show account chooser so users with multiple Google accounts can pick
    provider.setCustomParameters({prompt:"select_account"});
    const cred=await signInWithPopup(_fbAuth,provider);
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
    ]);
    if(_fbAuth&&_fbAuth.currentUser)await deleteUser(_fbAuth.currentUser);
    return{ok:true};
  }catch(e){return{ok:false,err:friendlyError(e.message)}}
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
      if(!snap.exists()||!snap.data().progress)return;
      try{const p=JSON.parse(snap.data().progress);p._fbUpdated=snap.data().updated||0;callback(p,p._fbUpdated);}
      catch(e){console.warn("fbWatchProgress parse error:",e);}
    },
    function(err){console.warn("fbWatchProgress error:",err);}
  );
}

// Save a reaction emoji for a family achievement to Firestore
// achievementKey: "{email}_{type}_{date}" — uniquely identifies a milestone
// emoji: the reaction string (e.g. "🔥")
// reactorName: display name of the person reacting
export async function fbSaveReaction(familyCode, achievementKey, emoji, reactorName) {
  if (!_fbReady || !_fbDb || !familyCode) return { ok: false };
  try {
    const safeKey = achievementKey.replace(/[.#$/\[\]]/g, '_');
    const ref = fsDoc(_fbDb, 'families', familyCode, 'reactions', safeKey);
    await setDoc(ref, { emoji, reactorName, updatedAt: Date.now() }, { merge: true });
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
