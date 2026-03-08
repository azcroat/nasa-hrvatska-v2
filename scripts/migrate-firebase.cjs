const fs = require('fs');
let src = fs.readFileSync('src/data.jsx', 'utf8');

// ─── 1. Replace imports ───────────────────────────────────────────────────
src = src.replace(
`import React from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';`,
`import React from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, doc as fsDoc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';`
);

// ─── 2. Replace state variables and initFirebase ─────────────────────────
src = src.replace(
`let _fb=null,_fbAuth=null,_fbDb=null,_fbReady=false;
function initFirebase(){
  if(_fbReady)return false;
  try{if(!firebase.apps.length)firebase.initializeApp(FIREBASE_CONFIG);
  _fb=firebase;_fbAuth=firebase.auth();_fbDb=firebase.firestore();_fbReady=true;
  _fbAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});return true}catch(e){console.warn("Firebase init failed:",e);return false}
}`,
`let _fbAuth=null,_fbDb=null,_fbReady=false;
function initFirebase(){
  if(_fbReady)return false;
  try{
    const app=getApps().length?getApps()[0]:initializeApp(FIREBASE_CONFIG);
    _fbAuth=getAuth(app);_fbDb=getFirestore(app);_fbReady=true;
    setPersistence(_fbAuth,browserLocalPersistence).catch(()=>{});return true
  }catch(e){console.warn("Firebase init failed:",e);return false}
}`
);

// ─── 3. fbSaveProgress ───────────────────────────────────────────────────
src = src.replace(
  `try{var id=uid.replace(/[.#$/\\[\\]]/g,"_");await _fbDb.collection("users").doc(id).set({progress:JSON.stringify(data),updated:Date.now()},{merge:true})}catch(e){console.warn("FB save error:",e)}`,
  `try{var id=uid.replace(/[.#$/\\[\\]]/g,"_");await setDoc(fsDoc(_fbDb,"users",id),{progress:JSON.stringify(data),updated:Date.now()},{merge:true})}catch(e){console.warn("FB save error:",e)}`
);

// ─── 4. fbLoadProgress ──────────────────────────────────────────────────
src = src.replace(
  `try{var id=uid.replace(/[.#$/\\[\\]]/g,"_");var doc=await _fbDb.collection("users").doc(id).get();
  if(doc.exists&&doc.data().progress){return JSON.parse(doc.data().progress)}return null}catch(e){console.warn("FB load error:",e);return null}`,
  `try{var id=uid.replace(/[.#$/\\[\\]]/g,"_");var snap=await getDoc(fsDoc(_fbDb,"users",id));
  if(snap.exists()&&snap.data().progress){return JSON.parse(snap.data().progress)}return null}catch(e){console.warn("FB load error:",e);return null}`
);

// ─── 5. fbRegister ──────────────────────────────────────────────────────
src = src.replace(
  `try{var cred=await _fbAuth.createUserWithEmailAndPassword(email,password);
  try{await cred.user.updateProfile({displayName:displayName})}catch(pe){console.warn("Profile update failed:",pe)}
  try{var id=email.replace(/[.#$/\\[\\]]/g,"_");
  await _fbDb.collection("users").doc(id).set({displayName:displayName,email:email,created:Date.now()},{merge:true})}catch(fe){console.warn("Firestore profile write failed:",fe)}
  return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}`,
  `try{var cred=await createUserWithEmailAndPassword(_fbAuth,email,password);
  try{await updateProfile(cred.user,{displayName:displayName})}catch(pe){console.warn("Profile update failed:",pe)}
  try{var id=email.replace(/[.#$/\\[\\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{displayName:displayName,email:email,created:Date.now()},{merge:true})}catch(fe){console.warn("Firestore profile write failed:",fe)}
  return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}`
);

// ─── 6. fbLogin ─────────────────────────────────────────────────────────
src = src.replace(
  `try{var cred=await _fbAuth.signInWithEmailAndPassword(email,password);return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}`,
  `try{var cred=await signInWithEmailAndPassword(_fbAuth,email,password);return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}`
);

// ─── 7. fbLogout ────────────────────────────────────────────────────────
src = src.replace(
  `async function fbLogout(){if(_fbReady&&_fbAuth)try{await _fbAuth.signOut()}catch(e){}}`,
  `async function fbLogout(){if(_fbReady&&_fbAuth)try{await fbSignOut(_fbAuth)}catch(e){}}`
);

// ─── 8. fbResetPassword ─────────────────────────────────────────────────
src = src.replace(
  `try{await _fbAuth.sendPasswordResetEmail(email);return{ok:true}}catch(e){return{ok:false,err:friendlyError(e.message)}}`,
  `try{await sendPasswordResetEmail(_fbAuth,email);return{ok:true}}catch(e){return{ok:false,err:friendlyError(e.message)}}`
);

// ─── 9. fbCreateFamily (three Firestore calls) ───────────────────────────
src = src.replace(
  `try{var existing=await _fbDb.collection("families").doc(code).get();
  if(existing.exists)code=generateFamilyCode()}catch(e){}
  try{await _fbDb.collection("families").doc(code).set({name:familyName,code:code,created:Date.now(),members:[{email:creatorEmail,name:creatorName,role:"admin",joined:Date.now()}]})}catch(fe){console.warn("Family write failed:",fe);return{ok:false,err:"Could not create family. Check Firebase permissions."}}
  try{var id=creatorEmail.replace(/[.#$/\\[\\]]/g,"_");
  await _fbDb.collection("users").doc(id).set({familyCode:code},{merge:true})}catch(ue){console.warn("User family link failed:",ue)}`,
  `try{var existing=await getDoc(fsDoc(_fbDb,"families",code));
  if(existing.exists())code=generateFamilyCode()}catch(e){}
  try{await setDoc(fsDoc(_fbDb,"families",code),{name:familyName,code:code,created:Date.now(),members:[{email:creatorEmail,name:creatorName,role:"admin",joined:Date.now()}]})}catch(fe){console.warn("Family write failed:",fe);return{ok:false,err:"Could not create family. Check Firebase permissions."}}
  try{var id=creatorEmail.replace(/[.#$/\\[\\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code},{merge:true})}catch(ue){console.warn("User family link failed:",ue)}`
);

// ─── 10. fbJoinFamily ────────────────────────────────────────────────────
src = src.replace(
  `try{var doc=await _fbDb.collection("families").doc(code.toUpperCase()).get();
  if(!doc.exists)return{ok:false,err:"Family code not found. Check and try again."};
  var data=doc.data();var members=data.members||[];
  if(members.some(function(m){return m.email===email}))return{ok:false,err:"You are already in this family!"};
  members.push({email:email,name:name,role:"member",joined:Date.now()});
  await _fbDb.collection("families").doc(code.toUpperCase()).set({members:members},{merge:true});
  var id=email.replace(/[.#$/\\[\\]]/g,"_");
  await _fbDb.collection("users").doc(id).set({familyCode:code.toUpperCase()},{merge:true});`,
  `try{var famSnap=await getDoc(fsDoc(_fbDb,"families",code.toUpperCase()));
  if(!famSnap.exists())return{ok:false,err:"Family code not found. Check and try again."};
  var data=famSnap.data();var members=data.members||[];
  if(members.some(function(m){return m.email===email}))return{ok:false,err:"You are already in this family!"};
  members.push({email:email,name:name,role:"member",joined:Date.now()});
  await setDoc(fsDoc(_fbDb,"families",code.toUpperCase()),{members:members},{merge:true});
  var id=email.replace(/[.#$/\\[\\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:code.toUpperCase()},{merge:true});`
);

// ─── 11. fbGetFamilyMembers ───────────────────────────────────────────────
src = src.replace(
  `try{var doc=await _fbDb.collection("families").doc(code).get();
  if(!doc.exists)return[];
  var data=doc.data();var members=data.members||[];
  var results=[];
  for(var i=0;i<members.length;i++){var m=members[i];
    var id=m.email.replace(/[.#$/\\[\\]]/g,"_");
    try{var userDoc=await _fbDb.collection("users").doc(id).get();
    var p=userDoc.exists&&userDoc.data().progress?JSON.parse(userDoc.data().progress):null;`,
  `try{var famSnap2=await getDoc(fsDoc(_fbDb,"families",code));
  if(!famSnap2.exists())return[];
  var data=famSnap2.data();var members=data.members||[];
  var results=[];
  for(var i=0;i<members.length;i++){var m=members[i];
    var id=m.email.replace(/[.#$/\\[\\]]/g,"_");
    try{var userSnap=await getDoc(fsDoc(_fbDb,"users",id));
    var p=userSnap.exists()&&userSnap.data().progress?JSON.parse(userSnap.data().progress):null;`
);

// ─── 12. fbLeaveFamily ───────────────────────────────────────────────────
src = src.replace(
  `try{var doc=await _fbDb.collection("families").doc(code).get();
  if(!doc.exists)return{ok:false};
  var data=doc.data();var members=(data.members||[]).filter(function(m){return m.email!==email});
  await _fbDb.collection("families").doc(code).set({members:members},{merge:true});
  var id=email.replace(/[.#$/\\[\\]]/g,"_");
  await _fbDb.collection("users").doc(id).set({familyCode:null},{merge:true});`,
  `try{var leaveSnap=await getDoc(fsDoc(_fbDb,"families",code));
  if(!leaveSnap.exists())return{ok:false};
  var data=leaveSnap.data();var members=(data.members||[]).filter(function(m){return m.email!==email});
  await setDoc(fsDoc(_fbDb,"families",code),{members:members},{merge:true});
  var id=email.replace(/[.#$/\\[\\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{familyCode:null},{merge:true});`
);

// ─── 13. fbLoadUserFamily ─────────────────────────────────────────────────
src = src.replace(
  `try{var id=email.replace(/[.#$/\\[\\]]/g,"_");
  var doc=await _fbDb.collection("users").doc(id).get();
  if(!doc.exists||!doc.data().familyCode)return null;
  var code=doc.data().familyCode;
  var famDoc=await _fbDb.collection("families").doc(code).get();
  if(!famDoc.exists)return null;
  var data=famDoc.data();var member=data.members.find(function(m){return m.email===email});`,
  `try{var id=email.replace(/[.#$/\\[\\]]/g,"_");
  var userSnap2=await getDoc(fsDoc(_fbDb,"users",id));
  if(!userSnap2.exists()||!userSnap2.data().familyCode)return null;
  var code=userSnap2.data().familyCode;
  var famDoc2=await getDoc(fsDoc(_fbDb,"families",code));
  if(!famDoc2.exists())return null;
  var data=famDoc2.data();var member=data.members.find(function(m){return m.email===email});`
);

// ─── 14. fbGetLeaderboard ─────────────────────────────────────────────────
src = src.replace(
  `try{var snap=await _fbDb.collection("users").get();var users=[];
  snap.forEach(function(doc){var d=doc.data();var p=d.progress?JSON.parse(d.progress):null;
  users.push({name:d.displayName||doc.id,xp:p&&p.st?p.st.xp:0,lc:p&&p.st?p.st.lc:0})});`,
  `try{var snap=await getDocs(collection(_fbDb,"users"));var users=[];
  snap.forEach(function(docSnap){var d=docSnap.data();var p=d.progress?JSON.parse(d.progress):null;
  users.push({name:d.displayName||docSnap.id,xp:p&&p.st?p.st.xp:0,lc:p&&p.st?p.st.lc:0})});`
);

// ─── 15. Add new wrapper functions after fbGetLeaderboard ─────────────────
src = src.replace(
  `async function fbGetLeaderboard(){`,
  `// Wrapper: auth state changes — used by App.jsx instead of onAuthStateChanged directly
function fbOnAuthStateChanged(cb){if(!_fbReady||!_fbAuth)return()=>{};return onAuthStateChanged(_fbAuth,cb)}
// Wrapper: save security Q&A to Firestore (used during registration)
async function fbSetUserSecurity(email,sq,sa){if(!_fbReady||!_fbDb)return;try{var id=email.replace(/[.#$/\\[\\]]/g,"_");await setDoc(fsDoc(_fbDb,"users",id),{sq,sa},{merge:true})}catch(e){}}
// Wrapper: load security Q from Firestore (used during password reset)
async function fbGetUserSecurity(email){if(!_fbReady||!_fbDb)return null;try{var id=email.replace(/[.#$/\\[\\]]/g,"_");var snap=await getDoc(fsDoc(_fbDb,"users",id));if(!snap.exists())return null;var d=snap.data();return d.sq?{sq:d.sq,sa:d.sa}:null}catch(e){return null}}
// Wrapper: create Firebase account without display name (used during password reset)
async function fbCreateAccount(email,password){if(!_fbReady||!_fbAuth)return{ok:false};try{await createUserWithEmailAndPassword(_fbAuth,email,password);return{ok:true}}catch(e){return{ok:false}}}
async function fbGetLeaderboard(){`
);

// ─── 16. Update exports ───────────────────────────────────────────────────
// Remove _fb and _fbDb and _fbAuth from the export, add new wrappers
src = src.replace(
  `export { _fbReady, _fbAuth, _fbDb };`,
  `export { _fbReady };`
);

src = src.replace(
  `export { initFirebase, hp, gA, sA, gP, sP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, loadVoices, getBestVoice, stopAudio, speakAzure, speakGoogle, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getProverbOfDay, getDailyChallenge, getHistFact, shMemo, shuffleArr, buildSearchIndex };`,
  `export { initFirebase, hp, gA, sA, gP, sP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, fbOnAuthStateChanged, fbSetUserSecurity, fbGetUserSecurity, fbCreateAccount, loadVoices, getBestVoice, stopAudio, speakAzure, speakGoogle, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getProverbOfDay, getDailyChallenge, getHistFact, shMemo, shuffleArr, buildSearchIndex };`
);

fs.writeFileSync('src/data.jsx', src);
console.log('data.jsx migrated. Lines:', src.split('\n').length);

// ─── 17. Update App.jsx ───────────────────────────────────────────────────
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Update import line: remove _fbAuth, _fbDb; add new wrappers
app = app.replace(
  `import { _fbReady, _fbAuth, _fbDb,`,
  `import { _fbReady,`
);
app = app.replace(
  `, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard,`,
  `, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, fbOnAuthStateChanged, fbSetUserSecurity, fbGetUserSecurity, fbCreateAccount,`
);

// Replace onAuthStateChanged call in session resume
app = app.replace(
  `_fbAuth.onAuthStateChanged(function(user){`,
  `fbOnAuthStateChanged(function(user){`
);

// Replace inline Firestore write in doReg (security Q&A save)
app = app.replace(
  `if(fb.ok){try{var id=k.replace(/[.#$/\\[\\]]/g,"_");await _fbDb.collection("users").doc(id).set({sq:sq.trim(),sa:(await hp(sa.trim().toLowerCase()))},{merge:true})}catch(e){}}`,
  `if(fb.ok){try{await fbSetUserSecurity(k,sq.trim(),await hp(sa.trim().toLowerCase()))}catch(e){}}`
);

// Replace inline Firestore read in doReset (security Q lookup)
app = app.replace(
  `if(!sqFound&&_fbReady&&_fbDb){
        try{var id=k.replace(/[.#$/\\[\\]]/g,"_");var doc=await _fbDb.collection("users").doc(id).get();
        if(doc.exists&&doc.data().sq){sqFound=doc.data().sq;saFound=doc.data().sa}
        else if(doc.exists&&!doc.data().sq){`,
  `if(!sqFound&&_fbReady){
        try{var sec=await fbGetUserSecurity(k);
        if(sec&&sec.sq){sqFound=sec.sq;saFound=sec.sa}
        else if(sec&&!sec.sq){`
);

// Replace createUserWithEmailAndPassword in doReset
app = app.replace(
  `      if(_fbReady&&_fbAuth){
        try{
          // Try to create Firebase account for users who only had local accounts
          await _fbAuth.createUserWithEmailAndPassword(k,rpPw);
        }catch(e){
          // Account already exists in Firebase — send password reset email instead
          try{await _fbAuth.sendPasswordResetEmail(k)}catch(e2){}
        }}`,
  `      if(_fbReady){
        const acct=await fbCreateAccount(k,rpPw);
        if(!acct.ok){try{await fbResetPassword(k)}catch(e2){}}
      }`
);

// Remove _fbReady&&_fbAuth checks that no longer need _fbAuth
app = app.replace(/if\(_fbReady&&_fbAuth\)/g, 'if(_fbReady)');

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx updated. Lines:', app.split('\n').length);
