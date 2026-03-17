// ═══════════════════════════════════════════════════════════
// Firebase — config, auth, storage, Firestore sync
// Extracted from data.jsx as part of Sprint 1 architectural split
// ═══════════════════════════════════════════════════════════
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, doc as fsDoc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCD4ul4KCILkufNMk5qCr-C5JiN9D7ogn0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ucimohrvatski-488f9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ucimohrvatski-488f9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ucimohrvatski-488f9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "675614569794",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:675614569794:web:d19f7defeac55b0b4b04db"
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
export function gA(){try{var accts=JSON.parse(localStorage.getItem("uA")||"{}");Object.keys(accts).forEach(function(k){var h=sessionStorage.getItem("uAp_"+k);if(h)accts[k].p=h;});return accts}catch{return{}}}
export function sA(a){var safe={};Object.keys(a).forEach(function(k){var copy=Object.assign({},a[k]);if(copy.p){sessionStorage.setItem("uAp_"+k,copy.p);delete copy.p;}safe[k]=copy;});localStorage.setItem("uA",JSON.stringify(safe));}
export function gP(u){try{return JSON.parse(localStorage.getItem("uP_"+u))}catch{return null}}
export function sP(u,p){localStorage.setItem("uP_"+u,JSON.stringify(p));fbSaveProgress(u,p)}
export function gS(){try{return JSON.parse(localStorage.getItem("uS"))}catch{return null}}
export function sS(s){localStorage.setItem("uS",JSON.stringify({...s,lastActive:Date.now()}))}
export function cS(){localStorage.removeItem("uS")}
export function touchSession(){const s=gS();if(s)localStorage.setItem("uS",JSON.stringify({...s,lastActive:Date.now()}))}
export function isSessionExpired(){const s=gS();if(!s||!s.lastActive)return true;return(Date.now()-s.lastActive)>7*24*60*60*1000}
export function isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}

// ═══ FIREBASE SYNC ═══
export async function fbSaveProgress(uid,data){
  if(!_fbReady||!_fbDb)return;
  var id=uid.replace(/[.#$/\[\]]/g,"_");var payload={progress:JSON.stringify(data),updated:Date.now()};
  try{await setDoc(fsDoc(_fbDb,"users",id),payload,{merge:true})}catch(e){
    console.warn("FB save error (retrying in 3s):",e);
    setTimeout(async function(){try{await setDoc(fsDoc(_fbDb,"users",id),payload,{merge:true})}catch(e2){console.warn("FB save retry failed:",e2)}},3000);
  }
}
export async function fbLoadProgress(uid){
  if(!_fbReady||!_fbDb)return null;
  try{var id=uid.replace(/[.#$/\[\]]/g,"_");var snap=await getDoc(fsDoc(_fbDb,"users",id));
  if(snap.exists()&&snap.data().progress){var p=JSON.parse(snap.data().progress);if(snap.data().updated)p._fbUpdated=snap.data().updated;return p}return null}catch(e){console.warn("FB load error:",e);return null}
}
export async function fbRegister(email,password,displayName){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured. Account created locally only."};
  try{var cred=await createUserWithEmailAndPassword(_fbAuth,email,password);
  try{await updateProfile(cred.user,{displayName:displayName})}catch(pe){console.warn("Profile update failed:",pe)}
  try{var id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{displayName:displayName,email:email,created:Date.now()},{merge:true})}catch(fe){console.warn("Firestore profile write failed:",fe)}
  return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbLogin(email,password){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{var cred=await signInWithEmailAndPassword(_fbAuth,email,password);return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
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
  return msg.replace(/Firebase:\s*/i,"").replace(/\([^)]+\)\.?/,"").trim()||"Something went wrong."
}

// ═══ FAMILY GROUP SYSTEM ═══
export function generateFamilyCode(){var c="";var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";for(var i=0;i<6;i++)c+=chars[Math.floor(Math.random()*chars.length)];return c}
export function getLocalFamily(){try{return JSON.parse(localStorage.getItem("uFamily")||"null")}catch{return null}}
export function saveLocalFamily(f){localStorage.setItem("uFamily",JSON.stringify(f))}
export async function fbCreateFamily(familyName,creatorEmail,creatorName){
  if(!_fbReady||!_fbDb)return{ok:false,err:"Firebase not configured."};
  try{var code=generateFamilyCode();
  try{var existing=await getDoc(fsDoc(_fbDb,"families",code));
  if(existing.exists())code=generateFamilyCode()}catch(e){}
  try{await setDoc(fsDoc(_fbDb,"families",code),{name:familyName,code:code,created:Date.now(),members:[{email:creatorEmail,name:creatorName,role:"admin",joined:Date.now()}]})}catch(fe){console.warn("Family write failed:",fe);return{ok:false,err:"Could not create family. Check Firebase permissions."}}
  try{var id=creatorEmail.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code},{merge:true})}catch(ue){console.warn("User family link failed:",ue)}
  var fam={name:familyName,code:code,role:"admin"};saveLocalFamily(fam);
  return{ok:true,code:code,family:fam}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbJoinFamily(code,email,name){
  if(!_fbReady||!_fbDb)return{ok:false,err:"Firebase not configured."};
  try{var famSnap=await getDoc(fsDoc(_fbDb,"families",code.toUpperCase()));
  if(!famSnap.exists())return{ok:false,err:"Family code not found. Check and try again."};
  var data=famSnap.data();var members=data.members||[];
  if(members.some(function(m){return m.email===email}))return{ok:false,err:"You are already in this family!"};
  members.push({email:email,name:name,role:"member",joined:Date.now()});
  await setDoc(fsDoc(_fbDb,"families",code.toUpperCase()),{members:members},{merge:true});
  var id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code.toUpperCase()},{merge:true});
  var fam={name:data.name,code:code.toUpperCase(),role:"member"};saveLocalFamily(fam);
  return{ok:true,family:fam}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
export async function fbGetFamilyMembers(code){
  if(!_fbReady||!_fbDb)return[];
  try{var famSnap2=await getDoc(fsDoc(_fbDb,"families",code));
  if(!famSnap2.exists())return[];
  var data=famSnap2.data();var members=data.members||[];
  var results=[];
  for(var i=0;i<members.length;i++){var m=members[i];
    var id=m.email.replace(/[.#$/\[\]]/g,"_");
    try{var userSnap=await getDoc(fsDoc(_fbDb,"users",id));
    var p=userSnap.exists()&&userSnap.data().progress?JSON.parse(userSnap.data().progress):null;
    results.push({name:m.name,email:m.email,role:m.role,xp:p&&p.st?p.st.xp:0,lc:p&&p.st?p.st.lc:0,joined:m.joined})}catch(e){results.push({name:m.name,email:m.email,role:m.role,xp:0,lc:0,joined:m.joined})}}
  return results.sort(function(a,b){return b.xp-a.xp})}catch(e){return[]}
}
export async function fbLeaveFamily(code,email){
  if(!_fbReady||!_fbDb)return{ok:false};
  try{var leaveSnap=await getDoc(fsDoc(_fbDb,"families",code));
  if(!leaveSnap.exists())return{ok:false};
  var data=leaveSnap.data();var members=(data.members||[]).filter(function(m){return m.email!==email});
  await setDoc(fsDoc(_fbDb,"families",code),{members:members},{merge:true});
  var id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:null},{merge:true});
  localStorage.removeItem("uFamily");
  return{ok:true}}catch(e){return{ok:false}}
}
export async function fbLoadUserFamily(email){
  if(!_fbReady||!_fbDb)return null;
  try{var id=email.replace(/[.#$/\[\]]/g,"_");
  var userSnap2=await getDoc(fsDoc(_fbDb,"users",id));
  if(!userSnap2.exists()||!userSnap2.data().familyCode)return null;
  var code=userSnap2.data().familyCode;
  var famDoc2=await getDoc(fsDoc(_fbDb,"families",code));
  if(!famDoc2.exists())return null;
  var data=famDoc2.data();var member=data.members.find(function(m){return m.email===email});
  var fam={name:data.name,code:code,role:member?member.role:"member"};saveLocalFamily(fam);
  return fam}catch(e){return null}
}
export function fbOnAuthStateChanged(cb){if(!_fbReady||!_fbAuth)return()=>{};return onAuthStateChanged(_fbAuth,cb)}
export async function fbSetUserSecurity(email,sq,sa){if(!_fbReady||!_fbDb)return;try{var id=email.replace(/[.#$/\[\]]/g,"_");await setDoc(fsDoc(_fbDb,"users",id),{sq,sa},{merge:true})}catch(e){}}
export async function fbGetUserSecurity(email){if(!_fbReady||!_fbDb)return null;try{var id=email.replace(/[.#$/\[\]]/g,"_");var snap=await getDoc(fsDoc(_fbDb,"users",id));if(!snap.exists())return null;var d=snap.data();return d.sq?{sq:d.sq,sa:d.sa}:null}catch(e){return null}}
export async function fbCreateAccount(email,password){if(!_fbReady||!_fbAuth)return{ok:false};try{await createUserWithEmailAndPassword(_fbAuth,email,password);return{ok:true}}catch(e){return{ok:false}}}
export async function fbGetLeaderboard(){
  if(!_fbReady||!_fbDb)return[];
  try{var snap=await getDocs(collection(_fbDb,"users"));var users=[];
  snap.forEach(function(docSnap){var d=docSnap.data();var p=d.progress?JSON.parse(d.progress):null;
  users.push({name:d.displayName||docSnap.id,xp:p&&p.st?p.st.xp:0,lc:p&&p.st?p.st.lc:0})});
  return users.sort(function(a,b){return b.xp-a.xp})}catch(e){return[]}
}
