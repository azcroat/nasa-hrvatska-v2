// ═══════════════════════════════════════════════════════════
// Firebase — config, auth, storage, Firestore sync
// Extracted from data.jsx as part of Sprint 1 architectural split
// ═══════════════════════════════════════════════════════════
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, doc as fsDoc, getDoc, setDoc, collection, getDocs, query, limit, orderBy, runTransaction } from 'firebase/firestore';

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
    setPersistence(_fbAuth,browserLocalPersistence).catch(()=>{});return true
  }catch(e){console.warn("Firebase init failed:",e);return false}
}
// Auto-init on module load
initFirebase();

// ═══ LOCAL AUTH & STORAGE ═══
export async function hp(p){const e=new TextEncoder();const d=e.encode(p+"ucimo2024");const h=await crypto.subtle.digest("SHA-256",d);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,"0")).join("")}
export function gA(){try{const accts=JSON.parse(localStorage.getItem("uA")||"{}");Object.keys(accts).forEach(function(k){const h=sessionStorage.getItem("uAp_"+k);if(h)accts[k].p=h;});return accts}catch{return{}}}
export function sA(a){const safe={};Object.keys(a).forEach(function(k){const copy=Object.assign({},a[k]);if(copy.p){sessionStorage.setItem("uAp_"+k,copy.p);delete copy.p;}safe[k]=copy;});localStorage.setItem("uA",JSON.stringify(safe));}
export function gP(u){try{return JSON.parse(localStorage.getItem("uP_"+u))}catch{return null}}
export function sP(u,p){localStorage.setItem("uP_"+u,JSON.stringify(p));fbSaveProgress(u,p)}
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
  const incoming={progress:JSON.stringify(data),updated:Date.now(),xp:(data.stats&&data.stats.xp)||0};
  // Write public leaderboard projection alongside the private progress doc
  const lbEntry={name:data.name||"",xp:(data.stats&&data.stats.xp)||0,lc:(data.stats&&data.stats.lc)||0,updated:incoming.updated};
  try{setDoc(fsDoc(_fbDb,"leaderboard",id),lbEntry,{merge:true}).catch(function(){});}catch(e){}
  try{
    await runTransaction(_fbDb,async function(tx){
      const ref=fsDoc(_fbDb,"users",id);
      const snap=await tx.get(ref);
      // Conflict resolution: only overwrite if our data is fresher or remote has no timestamp
      if(snap.exists()){
        const remote=snap.data();
        const remoteTs=remote.updated||0;
        if(remoteTs>incoming.updated){
          // Remote is newer — skip this write to avoid stomping concurrent update
          return;
        }
      }
      tx.set(ref,incoming,{merge:true});
    });
    return{ok:true};
  }catch(e){
    console.warn("FB save error:",e);
    // Graceful fallback: try a simple setDoc if transaction fails
    // Re-check timestamp before writing to avoid overwriting newer remote data
    try{
      const fallbackSnap=await getDoc(fsDoc(_fbDb,"users",id)).catch(()=>null);
      if(fallbackSnap&&fallbackSnap.exists()){
        const fbRemoteTs=(fallbackSnap.data().updated)||0;
        if(fbRemoteTs>incoming.updated){return{ok:true};} // remote is newer — skip
      }
      await setDoc(fsDoc(_fbDb,"users",id),incoming,{merge:true});
      return{ok:true};
    }catch(e2){
      console.warn("FB save fallback failed:",e2);
      return{ok:false,err:"Progress could not be saved. Check your connection."};
    }
  }
}
export async function fbLoadProgress(uid){
  if(!_fbReady||!_fbDb)return null;
  try{const id=uid.replace(/[.#$/\[\]]/g,"_");const snap=await getDoc(fsDoc(_fbDb,"users",id));
  if(snap.exists()&&snap.data().progress){const p=JSON.parse(snap.data().progress);if(snap.data().updated)p._fbUpdated=snap.data().updated;return p}return null}catch(e){console.warn("FB load error:",e);return null}
}
export async function fbRegister(email,password,displayName){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured. Account created locally only."};
  try{const cred=await createUserWithEmailAndPassword(_fbAuth,email,password);
  try{await updateProfile(cred.user,{displayName:displayName})}catch(pe){console.warn("Profile update failed:",pe)}
  try{const id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{displayName:displayName,email:email,created:Date.now()},{merge:true})}catch(fe){console.warn("Firestore profile write failed:",fe)}
  return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbLogin(email,password){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{const cred=await signInWithEmailAndPassword(_fbAuth,email,password);return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbLogout(){if(_fbReady&&_fbAuth)try{await fbSignOut(_fbAuth)}catch(e){}}
export async function fbResetPassword(email){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{await sendPasswordResetEmail(_fbAuth,email);return{ok:true}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export function friendlyError(msg){
  if(!msg)return"Something went wrong. Please try again.";
  if(msg.includes("email-already-in-use"))return"This email already has an account. Try signing in instead!";
  if(msg.includes("weak-password"))return"Password must be at least 6 characters.";
  if(msg.includes("invalid-email"))return"Please enter a valid email address.";
  if(msg.includes("user-not-found"))return"No account found with this email. Try creating one!";
  if(msg.includes("wrong-password")||msg.includes("invalid-credential"))return"Incorrect password. Try again or reset it.";
  if(msg.includes("too-many-requests"))return"Too many attempts. Please wait a few minutes.";
  if(msg.includes("network-request-failed"))return"No internet connection. Check your WiFi.";
  if(msg.includes("unauthorized-domain"))return"Authentication blocked. Please try again or contact support.";
  if(msg.includes("permission-denied")||msg.includes("permission"))return"Connection issue. Your account was created — try signing in!";
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
export async function fbCreateFamily(familyName,creatorEmail,creatorName){
  if(!_fbReady||!_fbDb)return{ok:false,err:"Firebase not configured."};
  try{let code=generateFamilyCode();
  try{const existing=await getDoc(fsDoc(_fbDb,"families",code));
  if(existing.exists())code=generateFamilyCode()}catch(e){}
  try{await setDoc(fsDoc(_fbDb,"families",code),{name:familyName,code:code,created:Date.now(),members:[{email:creatorEmail,name:creatorName,role:"admin",joined:Date.now()}],memberEmails:[creatorEmail]})}catch(fe){console.warn("Family write failed:",fe);return{ok:false,err:"Could not create family. Check Firebase permissions."}}
  try{const id=creatorEmail.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code},{merge:true})}catch(ue){console.warn("User family link failed:",ue)}
  const fam={name:familyName,code:code,role:"admin"};saveLocalFamily(fam);
  return{ok:true,code:code,family:fam}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbJoinFamily(code,email,name){
  if(!_fbReady||!_fbDb)return{ok:false,err:"Firebase not configured."};
  try{const famSnap=await getDoc(fsDoc(_fbDb,"families",code.toUpperCase()));
  if(!famSnap.exists())return{ok:false,err:"Family code not found. Check and try again."};
  const data=famSnap.data();const members=data.members||[];const memberEmails=data.memberEmails||[];
  if(members.some(function(m){return m.email===email}))return{ok:false,err:"You are already in this family!"};
  const updatedMembers=[...members,{email:email,name:name,role:"member",joined:Date.now()}];
  const updatedEmails=[...new Set([...memberEmails,email])];
  await setDoc(fsDoc(_fbDb,"families",code.toUpperCase()),{members:updatedMembers,memberEmails:updatedEmails},{merge:true});
  const id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code.toUpperCase()},{merge:true});
  const fam={name:data.name,code:code.toUpperCase(),role:"member"};saveLocalFamily(fam);
  return{ok:true,family:fam}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbGetFamilyMembers(code){
  if(!_fbReady||!_fbDb)return[];
  try{
    const famSnap2=await getDoc(fsDoc(_fbDb,"families",code));
    if(!famSnap2.exists())return[];
    const data=famSnap2.data();const members=data.members||[];
    // Parallel reads — read from /leaderboard (public) not /users (private)
    const results=await Promise.all(members.map(async function(m){
      try{
        const id=m.email.replace(/[.#$/\[\]]/g,"_");
        const lbSnap=await getDoc(fsDoc(_fbDb,"leaderboard",id));
        const lb=lbSnap.exists()?lbSnap.data():null;
        return{name:m.name,email:m.email,role:m.role,xp:lb?lb.xp:0,lc:lb?lb.lc:0,joined:m.joined};
      }catch(e){return{name:m.name,email:m.email,role:m.role,xp:0,lc:0,joined:m.joined}}
    }));
    return results.sort(function(a,b){return b.xp-a.xp});
  }catch(e){return[]}
}
export async function fbLeaveFamily(code,email){
  if(!_fbReady||!_fbDb)return{ok:false};
  try{const leaveSnap=await getDoc(fsDoc(_fbDb,"families",code));
  if(!leaveSnap.exists())return{ok:false};
  const data=leaveSnap.data();const members=(data.members||[]).filter(function(m){return m.email!==email});
  const memberEmails=(data.memberEmails||[]).filter(function(e){return e!==email});
  await setDoc(fsDoc(_fbDb,"families",code),{members:members,memberEmails:memberEmails},{merge:true});
  const id=email.replace(/[.#$/\[\]]/g,"_");
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
export async function fbSetUserSecurity(email,sq,sa){if(!_fbReady||!_fbDb)return;try{const id=email.replace(/[.#$/\[\]]/g,"_");await setDoc(fsDoc(_fbDb,"users",id),{sq,sa},{merge:true})}catch(e){}}
export async function fbGetUserSecurity(email){if(!_fbReady||!_fbDb)return null;try{const id=email.replace(/[.#$/\[\]]/g,"_");const snap=await getDoc(fsDoc(_fbDb,"users",id));if(!snap.exists())return null;const d=snap.data();return d.sq?{sq:d.sq,sa:d.sa}:null}catch(e){return null}}
export async function fbCreateAccount(email,password){if(!_fbReady||!_fbAuth)return{ok:false};try{await createUserWithEmailAndPassword(_fbAuth,email,password);return{ok:true}}catch(e){return{ok:false}}}
export async function fbGetLeaderboard(){
  if(!_fbReady||!_fbDb)return[];
  try{
    // Read from /leaderboard (public projection) — never from /users (private)
    const q=query(collection(_fbDb,"leaderboard"),orderBy("xp","desc"),limit(50));
    const snap=await getDocs(q);const users=[];
    snap.forEach(function(docSnap){const d=docSnap.data();
    users.push({name:d.name||docSnap.id,xp:d.xp||0,lc:d.lc||0})});
    return users.sort(function(a,b){return b.xp-a.xp})
  }catch(e){return[]}
}
