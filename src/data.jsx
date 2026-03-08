// Naša Hrvatska — Data & Utility Functions
import React from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, doc as fsDoc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

const{useState,useEffect,useCallback,useRef}=React;
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// ═══ FIREBASE CONFIG ═══
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCD4ul4KCILkufNMk5qCr-C5JiN9D7ogn0",
  authDomain: "ucimohrvatski-488f9.firebaseapp.com",
  projectId: "ucimohrvatski-488f9",
  storageBucket: "ucimohrvatski-488f9.firebasestorage.app",
  messagingSenderId: "675614569794",
  appId: "1:675614569794:web:d19f7defeac55b0b4b04db"
};
let _fbAuth=null,_fbDb=null,_fbReady=false;
function initFirebase(){
  if(_fbReady)return false;
  try{
    const app=getApps().length?getApps()[0]:initializeApp(FIREBASE_CONFIG);
    _fbAuth=getAuth(app);_fbDb=getFirestore(app);_fbReady=true;
    setPersistence(_fbAuth,browserLocalPersistence).catch(()=>{});return true
  }catch(e){console.warn("Firebase init failed:",e);return false}
}
// Auto-init — Firebase is bundled from npm, always available immediately
initFirebase();
// ═══ AUTH & STORAGE — Firebase + localStorage fallback ═══
async function hp(p){const e=new TextEncoder();const d=e.encode(p+"ucimo2024");const h=await crypto.subtle.digest("SHA-256",d);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function gA(){try{return JSON.parse(localStorage.getItem("uA")||"{}")}catch{return{}}}
function sA(a){localStorage.setItem("uA",JSON.stringify(a))}
function gP(u){try{return JSON.parse(localStorage.getItem("uP_"+u))}catch{return null}}
function sP(u,p){localStorage.setItem("uP_"+u,JSON.stringify(p));fbSaveProgress(u,p)}
function gS(){try{return JSON.parse(localStorage.getItem("uS"))}catch{return null}}
function sS(s){localStorage.setItem("uS",JSON.stringify({...s,lastActive:Date.now()}))}
function cS(){localStorage.removeItem("uS")}
function touchSession(){const s=gS();if(s)localStorage.setItem("uS",JSON.stringify({...s,lastActive:Date.now()}))}
function isSessionExpired(){const s=gS();if(!s||!s.lastActive)return true;return(Date.now()-s.lastActive)>7*24*60*60*1000}
function isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
// ═══ FIREBASE SYNC FUNCTIONS ═══
async function fbSaveProgress(uid,data){
  if(!_fbReady||!_fbDb)return;
  try{var id=uid.replace(/[.#$/\[\]]/g,"_");await setDoc(fsDoc(_fbDb,"users",id),{progress:JSON.stringify(data),updated:Date.now()},{merge:true})}catch(e){console.warn("FB save error:",e)}
}
async function fbLoadProgress(uid){
  if(!_fbReady||!_fbDb)return null;
  try{var id=uid.replace(/[.#$/\[\]]/g,"_");var snap=await getDoc(fsDoc(_fbDb,"users",id));
  if(snap.exists()&&snap.data().progress){return JSON.parse(snap.data().progress)}return null}catch(e){console.warn("FB load error:",e);return null}
}
async function fbRegister(email,password,displayName){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured. Account created locally only."};
  try{var cred=await createUserWithEmailAndPassword(_fbAuth,email,password);
  try{await updateProfile(cred.user,{displayName:displayName})}catch(pe){console.warn("Profile update failed:",pe)}
  try{var id=email.replace(/[.#$/\[\]]/g,"_");
  await setDoc(fsDoc(_fbDb,"users",id),{displayName:displayName,email:email,created:Date.now()},{merge:true})}catch(fe){console.warn("Firestore profile write failed:",fe)}
  return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
async function fbLogin(email,password){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{var cred=await signInWithEmailAndPassword(_fbAuth,email,password);return{ok:true,user:cred.user}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
async function fbLogout(){if(_fbReady&&_fbAuth)try{await fbSignOut(_fbAuth)}catch(e){}}
async function fbResetPassword(email){
  if(!_fbReady||!_fbAuth)return{ok:false,err:"Firebase not configured."};
  try{await sendPasswordResetEmail(_fbAuth,email);return{ok:true}}catch(e){return{ok:false,err:friendlyError(e.message)}}
}
function friendlyError(msg){
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
function generateFamilyCode(){var c="";var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";for(var i=0;i<6;i++)c+=chars[Math.floor(Math.random()*chars.length)];return c}
function getLocalFamily(){try{return JSON.parse(localStorage.getItem("uFamily")||"null")}catch{return null}}
function saveLocalFamily(f){localStorage.setItem("uFamily",JSON.stringify(f))}
async function fbCreateFamily(familyName,creatorEmail,creatorName){
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
async function fbJoinFamily(code,email,name){
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
async function fbGetFamilyMembers(code){
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
async function fbLeaveFamily(code,email){
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
async function fbLoadUserFamily(email){
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
// Wrapper: auth state changes — used by App.jsx instead of onAuthStateChanged directly
function fbOnAuthStateChanged(cb){if(!_fbReady||!_fbAuth)return()=>{};return onAuthStateChanged(_fbAuth,cb)}
// Wrapper: save security Q&A to Firestore (used during registration)
async function fbSetUserSecurity(email,sq,sa){if(!_fbReady||!_fbDb)return;try{var id=email.replace(/[.#$/\[\]]/g,"_");await setDoc(fsDoc(_fbDb,"users",id),{sq,sa},{merge:true})}catch(e){}}
// Wrapper: load security Q from Firestore (used during password reset)
async function fbGetUserSecurity(email){if(!_fbReady||!_fbDb)return null;try{var id=email.replace(/[.#$/\[\]]/g,"_");var snap=await getDoc(fsDoc(_fbDb,"users",id));if(!snap.exists())return null;var d=snap.data();return d.sq?{sq:d.sq,sa:d.sa}:null}catch(e){return null}}
// Wrapper: create Firebase account without display name (used during password reset)
async function fbCreateAccount(email,password){if(!_fbReady||!_fbAuth)return{ok:false};try{await createUserWithEmailAndPassword(_fbAuth,email,password);return{ok:true}}catch(e){return{ok:false}}}
async function fbGetLeaderboard(){
  if(!_fbReady||!_fbDb)return[];
  try{var snap=await getDocs(collection(_fbDb,"users"));var users=[];
  snap.forEach(function(docSnap){var d=docSnap.data();var p=d.progress?JSON.parse(d.progress):null;
  users.push({name:d.displayName||docSnap.id,xp:p&&p.st?p.st.xp:0,lc:p&&p.st?p.st.lc:0})});
  return users.sort(function(a,b){return b.xp-a.xp})}catch(e){return[]}
}
// ═══ Audio Engine — Native Croatian Pronunciation ═══
let _au=false;let _voices=[];let _voicesLoaded=false;let _audioCache={};let _currentAudio=null;
const _iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function uA(){if(_au)return;_au=true;try{const c=new(window.AudioContext||window.webkitAudioContext)();const b=c.createBuffer(1,1,22050);const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);c.resume()}catch(e){}}
["touchstart","click"].forEach(e=>{document.addEventListener(e,function h(){uA();document.removeEventListener(e,h)},{passive:true,once:true})});
function loadVoices(){if(window.speechSynthesis){_voices=window.speechSynthesis.getVoices();_voicesLoaded=_voices.length>0}}
if(window.speechSynthesis){loadVoices();window.speechSynthesis.onvoiceschanged=loadVoices}
function getBestVoice(){if(!_voicesLoaded)loadVoices();const v=_voices;const hr=v.filter(x=>x.lang.startsWith("hr"));if(hr.length>0)return hr.find(x=>!x.localService)||hr[0];const bs=v.filter(x=>x.lang.startsWith("bs"));if(bs.length>0)return bs[0];const sr=v.filter(x=>x.lang.startsWith("sr"));if(sr.length>0)return sr[0];return null}
function stopAudio(){if(_currentAudio){try{_currentAudio.pause();_currentAudio.currentTime=0}catch(e){}_currentAudio=null}if(window.speechSynthesis)window.speechSynthesis.cancel()}
async function speakAzure(text,slow){
  try{
    const r=await fetch("/.netlify/functions/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text,slow:!!slow})});
    if(!r.ok)return false;
    const blob=await r.blob();const url=URL.createObjectURL(blob);
    stopAudio();const a=new Audio(url);a.volume=1.0;_currentAudio=a;
    await a.play();return true;
  }catch(e){return false}
}
function speakGoogle(text,onFail){
  const cacheKey=text.substring(0,80);
  stopAudio();
  if(text.length>200){const sentences=text.match(/[^.!?]+[.!?]+/g)||[text];let i=0;function playNext(){if(i>=sentences.length)return;const s=sentences[i].trim();if(!s){i++;playNext();return}const url="https://translate.google.com/translate_tts?ie=UTF-8&tl=hr&client=tw-ob&q="+encodeURIComponent(s);const a=new Audio(url);a.volume=1.0;_currentAudio=a;a.onended=()=>{i++;playNext()};a.onerror=()=>{if(onFail)onFail(text)};a.play().catch(()=>{if(onFail)onFail(text)})}playNext();return}
  const url="https://translate.google.com/translate_tts?ie=UTF-8&tl=hr&client=tw-ob&q="+encodeURIComponent(text);
  const a=new Audio(url);a.volume=1.0;_currentAudio=a;
  const p=a.play();if(p)p.catch(()=>{if(onFail)onFail(text)})
}
function speakSynth(text,rate){
  if(!window.speechSynthesis)return;
  stopAudio();
  const u=new SpeechSynthesisUtterance(text);u.lang="hr-HR";u.rate=rate;u.pitch=1.0;u.volume=1.0;
  const best=getBestVoice();if(best)u.voice=best;
  window.speechSynthesis.speak(u);
}
function speak(text){
  if(!text)return;
  speakAzure(text,false).then(ok=>{if(!ok)speakGoogle(text,t=>speakSynth(t,0.9))});
}
function speakSlow(text){
  if(!text)return;
  speakAzure(text,true).then(ok=>{if(!ok)speakSynth(text,0.6)});
}
function speakEN(text){if(!text||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=0.9;window.speechSynthesis.speak(u)}
function sh(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function lvl(x){const t=[0,50,150,300,500,800,1200,1800,2500,3500];for(let i=t.length-1;i>=0;i--)if(x>=t[i])return i+1;return 1}
function lXP(l){return[0,0,50,150,300,500,800,1200,1800,2500,3500][l]||3500}
function nXP(l){return[0,50,150,300,500,800,1200,1800,2500,3500,5000][l]||5000}
// ═══════════════════════════════════════
// ═══════════════════════════════════════
const V = {
  "greetings":[["Bok","Hello/Hi"],["Dobar dan","Good day"],["Dobro jutro","Good morning"],["Dobra večer","Good evening"],["Laku noć","Good night"],["Doviđenja","Goodbye"],["Hvala","Thank you"],["Molim","Please/Welcome"],["Da","Yes"],["Ne","No"],["Oprosti","Sorry"],["Kako si?","How are you?"],["Kako ste?","How are you? (formal)"],["Dobro sam","I am fine"],["Tako-tako","So-so"],["Drago mi je","Nice to meet you"],["Nema na čemu","You're welcome"],["Vidimo se","See you"],["Zovem se...","My name is..."],["Živjeli!","Cheers!"],["Sretan rođendan","Happy birthday"],["Čestitam","Congratulations"],["Naravno","Of course"],["Izvoli","Here you go"],["Idemo","Let's go"]],
  "numbers":[["Jedan","One"],["Dva","Two"],["Tri","Three"],["Četiri","Four"],["Pet","Five"],["Šest","Six"],["Sedam","Seven"],["Osam","Eight"],["Devet","Nine"],["Deset","Ten"],["Jedanaest","Eleven"],["Dvanaest","Twelve"],["Trinaest","Thirteen"],["Dvadeset","Twenty"],["Trideset","Thirty"],["Četrdeset","Forty"],["Pedeset","Fifty"],["Sto","One hundred"],["Dvjesto","Two hundred"],["Tisuću","One thousand"],["Milijun","Million"],["Prvi","First"],["Drugi","Second"],["Treći","Third"]],
  "family":[["Mama","Mom"],["Tata","Dad"],["Brat","Brother"],["Sestra","Sister"],["Baka","Grandmother"],["Djed","Grandfather"],["Obitelj","Family"],["Dijete","Child"],["Sin","Son"],["Kći","Daughter"],["Muž","Husband"],["Žena","Wife/Woman"],["Ujak","Uncle"],["Teta","Aunt"],["Rođak","Cousin"],["Djeca","Children"],["Roditelji","Parents"],["Svekrva","Mother-in-law"],["Unuk","Grandson"],["Unuka","Granddaughter"]],
  "colors":[["Crvena","Red"],["Plava","Blue"],["Zelena","Green"],["Žuta","Yellow"],["Bijela","White"],["Crna","Black"],["Narančasta","Orange"],["Ružičasta","Pink"],["Smeđa","Brown"],["Siva","Gray"],["Ljubičasta","Purple"],["Zlatna","Golden"],["Srebrna","Silver"]],
  "months":[["Siječanj","January"],["Veljača","February"],["Ožujak","March"],["Travanj","April"],["Svibanj","May"],["Lipanj","June"],["Srpanj","July"],["Kolovoz","August"],["Rujan","September"],["Listopad","October"],["Studeni","November"],["Prosinac","December"]],
  "directions":[["Lijevo","Left"],["Desno","Right"],["Ravno","Straight"],["Gore","Up"],["Dolje","Down"],["Blizu","Near"],["Daleko","Far"],["Ovdje","Here"],["Tamo","There"],["Sjever","North"],["Jug","South"],["Istok","East"],["Zapad","West"],["Ispred","In front"],["Iza","Behind"]],
  "shopping":[["Kupiti","To buy"],["Prodati","To sell"],["Cijena","Price"],["Popust","Discount"],["Novac","Money"],["Euro","Euro"],["Veličina","Size"],["Blagajna","Cashier"],["Vrećica","Bag"],["Kartica","Card"],["Gotovina","Cash"],["Preskupo","Too expensive"]],
  "conjunctions":[["I","And"],["Ali","But"],["Ili","Or"],["Jer","Because"],["Dok","While"],["Kada","When"],["Ako","If"],["Nego","Than"],["Dakle","Therefore"],["Međutim","However"],["Također","Also"]],
  "culture":[["Domovina","Homeland"],["Sloboda","Freedom"],["Zastava","Flag"],["Himna","Anthem"],["Grb","Coat of arms"],["Šahovnica","Checkerboard (symbol)"],["Narod","People/Nation"],["Običaj","Custom"],["Tradicija","Tradition"],["Praznik","Holiday"],["Kravata","Necktie (Croatian invention)"],["Klapa","Traditional singing"],["Tamburica","String instrument"],["Ganga","Hercegovinian singing"],["Kolo","Circle dance"],["Licitar","Decorated gingerbread"],["Pršut","Prosciutto"],["Lavanda","Lavender"],["Kulen","Spicy sausage"]],
  "daily routine":[["probuditi se","to wake up"],["ustati","to get up"],["otuširati se","to shower"],["obrijati se","to shave"],["oprati zube","to brush teeth"],["počešljati se","to comb hair"],["obući se","to get dressed"],["obuti se","to put on shoes"],["doručkovati","to have breakfast"],["krenuti","to leave/head out"],["stići","to arrive"],["raditi","to work"],["ručati","to have lunch"],["vratiti se","to return"],["odmoriti se","to rest"],["večerati","to have dinner"],["skinuti se","to undress"],["leći","to lie down"],["zaspati","to fall asleep"],["kasniti","to be late"],["požuriti se","to hurry up"],["spremiti se","to get ready"]],
  "in the classroom":[["Razumiješ li?","Do you understand?"],["Razumijem.","I understand."],["Ne razumijem.","I don't understand."],["Kako se kaže...?","How do you say...?"],["Samo trenutak!","Just a moment!"],["Možeš li ponoviti?","Can you repeat?"],["Sjećam se.","I remember."],["Ne sjećam se.","I don't remember."],["Zaboravio sam.","I forgot. (m)"],["Zaboravila sam.","I forgot. (f)"],["To je preteško!","That's too hard!"],["To je lagano!","That's easy!"],["Vidim te.","I see you."],["Čujem te.","I hear you."],["Može!","OK! / Sure!"],["Idemo dalje!","Let's continue!"],["Molim te, ponovi!","Please repeat!"],["Imam pitanje.","I have a question."],["Što to znači?","What does that mean?"],["Kako se piše?","How do you spell it?"]],
  "commands at home":[["Operi zube!","Brush your teeth!"],["Pospremi sobu!","Tidy the room!"],["Napravi krevet!","Make the bed!"],["Obuci se!","Get dressed!"],["Obuj se!","Put your shoes on!"],["Počešljaj se!","Comb your hair!"],["Zaključaj kuću!","Lock the house!"],["Popij kakao!","Drink the cocoa!"],["Zatvori prozore!","Close the windows!"],["Isključi klimu!","Turn off the AC!"],["Uključi grijanje!","Turn on the heating!"],["Požuri!","Hurry up!"],["Pazi!","Be careful!"],["Nemoj zaboraviti ključ!","Don't forget the key!"],["Pospremi knjige!","Put your books away!"],["Sjedni za stol!","Sit at the table!"],["Isključi TV!","Turn off the TV!"],["Otključaj vrata!","Unlock the door!"]],
  "fairy tales":[["bajka","fairy tale"],["princeza","princess"],["princ","prince"],["kraljica","queen"],["kralj","king"],["dvorac","castle"],["zmaj","dragon"],["dobra vila","good fairy"],["šuma","forest"],["vještica","witch"],["zalutati","to get lost"],["spasiti","to save/rescue"],["čarobni","magical"],["začarati","to enchant"],["živjeli su sretno","they lived happily"],["Bila jednom jedna...","Once upon a time..."],["spisateljica","female writer"],["roman","novel"],["priča","story"],["pričati","to tell a story"]],
  "hobbies":[["čitati","to read"],["plivati","to swim"],["trčati","to run"],["igrati nogomet","to play football"],["igrati košarku","to play basketball"],["igrati odbojku","to play volleyball"],["svirati gitaru","to play guitar"],["svirati violinu","to play violin"],["pjevati","to sing"],["crtati","to draw"],["slikati","to paint"],["fotografirati","to photograph"],["vježbati","to exercise"],["pecati","to fish"],["kuhati","to cook"],["putovati","to travel"],["gledati filmove","to watch movies"],["šetati","to walk"],["voziti bicikl","to ride a bike"],["učiti jezike","to learn languages"]],
  "health":[["Boli me glava","I have a headache"],["Boli me grlo","My throat hurts"],["Imam temperaturu","I have a fever"],["Kašljem","I'm coughing"],["Kišem","I'm sneezing"],["Lijek","Medicine"],["Recept","Prescription"],["Tablete","Pills"],["Alergičan sam","I'm allergic"],["Hitna pomoć","Emergency"],["Zubobolja","Toothache"],["Pregled","Check-up"],["Bolnica","Hospital"],["Liječnik","Doctor"],["Medicinska sestra","Nurse"],["Operacija","Operation"],["Krv","Blood"],["Rana","Wound"],["Zavoj","Bandage"],["Injekcija","Injection"],["Krvni tlak","Blood pressure"],["Srčani udar","Heart attack"],["Slomljena ruka","Broken arm"],["Mučnina","Nausea"],["Vrtoglavica","Dizziness"],["Bol","Pain"],["Analgezik","Painkiller"],["Vitamin","Vitamin"],["Apoteka","Pharmacy (coll.)"],["Osiguranje","Insurance"]],
  "zagreb":[["trg","square/plaza"],["spomenik","monument"],["zgrada","building"],["kiosk","kiosk"],["izlog","shop window"],["vojnik","soldier"],["uniforma","uniform"],["klupa","bench"],["ulica","street"],["park","park"],["crkva","church"],["muzej","museum"],["uspinjača","funicular"],["tržnica","market"],["katedrala","cathedral"],["most","bridge"]],
  "animals":[["Pas","Dog"],["Mačka","Cat"],["Ptica","Bird"],["Konj","Horse"],["Krava","Cow"],["Zec","Rabbit"],["Medvjed","Bear"],["Žaba","Frog"],["Ovca","Sheep"],["Svinja","Pig"],["Tigar","Tiger"],["Slon","Elephant"],["Lav","Lion"],["Miš","Mouse"],["Zmija","Snake"],["Vuk","Wolf"],["Lisica","Fox"],["Jelen","Deer"],["Orao","Eagle"],["Galeb","Seagull"],["Labud","Swan"],["Delfin","Dolphin"],["Kornjača","Turtle"],["Leptir","Butterfly"],["Pčela","Bee"],["dupin","dolphin"],["šišmiš","bat"],["kit","whale"],["klokan","kangaroo"],["pauk","spider"],["kokoš","chicken/hen"],["patka","duck"],["jež","hedgehog"],["srna","deer"]],
  "body & face":[["Glava","Head"],["Ruka","Hand/Arm"],["Noga","Leg/Foot"],["Oko","Eye"],["Nos","Nose"],["Uho","Ear"],["Usta","Mouth"],["Srce","Heart"],["Prst","Finger"],["Zub","Tooth"],["Kosa","Hair"],["Lice","Face"],["Vrat","Neck"],["Rame","Shoulder"],["Leđa","Back"],["Trbuh","Stomach"],["Koljeno","Knee"],["Stopalo","Foot"],["Lakat","Elbow"],["Brada","Chin"],["Čelo","Forehead"],["Obrva","Eyebrow"],["oči","eyes"],["uši","ears"],["obrazi","cheeks"],["obrve","eyebrows"],["zubi","teeth"],["jezik","tongue"],["trepavice","eyelashes"],["prsti","fingers"],["struk","waist"]],
  "home & rooms":[["Kuća","House"],["Stan","Apartment"],["Soba","Room"],["Kuhinja","Kitchen"],["Kupaonica","Bathroom"],["Spavaća soba","Bedroom"],["Dnevni boravak","Living room"],["Vrt","Garden"],["Prozor","Window"],["Vrata","Door"],["Stol","Table"],["Stolica","Chair"],["Krevet","Bed"],["Ormar","Closet"],["Ogledalo","Mirror"],["Stepenice","Stairs"],["Krov","Roof"],["Pod","Floor"],["Zid","Wall"],["Strop","Ceiling"],["Lampa","Lamp"],["Tepih","Carpet"],["fotelja","armchair"],["ormarić","cabinet"],["polica za knjige","bookshelf"],["zavjesa","curtain"],["perilica rublja","washing machine"],["frižider","fridge"],["pečnica","oven"],["sudoper","sink"],["slavina","faucet"],["šalica","cup"],["lonac","pot"],["ručnik","towel"],["tavan","attic"],["podrum","basement"],["garaža","garage"],["prizemlje","ground floor"],["prvi kat","first floor"],["travnjak","lawn"],["dvorište","yard"],["dnevna soba","living room"],["kauč","sofa"],["jastuk","pillow"],["stolić","coffee table"],["slika","painting"],["deka","blanket"],["hladnjak","fridge"],["štednjak","stove"],["pećnica","oven"],["tava","pan"],["kada","bathtub"],["tuš","shower"],["sapun","soap"],["noćna lampa","night lamp"],["klima","air conditioner"],["ladica","drawer"],["rolete","blinds"]],
  "clothing":[["Košulja","Shirt"],["Hlače","Pants"],["Haljina","Dress"],["Cipele","Shoes"],["Čarape","Socks"],["Jakna","Jacket"],["Kaput","Coat"],["Šal","Scarf"],["Kapa","Hat"],["Rukavice","Gloves"],["Suknja","Skirt"],["Majica","T-shirt"],["Odijelo","Suit"],["Kravata","Tie"],["Naočale","Glasses"],["Torba","Bag"],["šešir","hat"],["grudnjak","bra"],["gaće","underpants"],["pojas","belt"],["pidžama","pajamas"],["kupaći","swimsuit"],["tenisice","sneakers"]],
  "weather & seasons":[["Sunce","Sun"],["Kiša","Rain"],["Snijeg","Snow"],["Vjetar","Wind"],["Oblak","Cloud"],["Oluja","Storm"],["Toplo","Warm"],["Hladno","Cold"],["Vruće","Hot"],["Magla","Fog"],["Led","Ice"],["Duga","Rainbow"],["Nebo","Sky"],["More","Sea"],["Rijeka","River"],["Jezero","Lake"],["Planina","Mountain"],["Polje","Field"],["Otok","Island"],["Plaža","Beach"],["Cvijet","Flower"],["Drvo","Tree"],["Trava","Grass"],["Kamen","Stone"],["Zvijezda","Star"],["proljeće","spring"],["ljeto","summer"],["jesen","autumn"],["zima","winter"],["pada kiša","it's raining"],["pada snijeg","it's snowing"],["puše vjetar","the wind blows"],["sunčano","sunny"],["oblačno","cloudy"],["lišće","leaves"],["godišnje doba","season"],["praznici","holidays"],["godišnji odmor","annual vacation"]],
  "time & calendar":[["Ponedjeljak","Monday"],["Utorak","Tuesday"],["Srijeda","Wednesday"],["Četvrtak","Thursday"],["Petak","Friday"],["Subota","Saturday"],["Nedjelja","Sunday"],["Danas","Today"],["Sutra","Tomorrow"],["Jučer","Yesterday"],["Jutro","Morning"],["Podne","Noon"],["Poslijepodne","Afternoon"],["Večer","Evening"],["Noć","Night"],["Sat","Hour"],["Minuta","Minute"],["Tjedan","Week"],["Mjesec","Month"],["Godina","Year"],["Koliko je sati?","What time is it?"],["jedan sat","one o'clock"],["dva sata","two o'clock"],["tri sata","three o'clock"],["pola dva","half past one (1:30)"],["pola tri","half past two (2:30)"],["pet do tri","five to three (2:55)"],["deset do pet","ten to five (4:50)"],["petnaest do devet","quarter to nine (8:45)"],["pet i deset","five ten (5:10)"],["šest i petnaest","six fifteen (6:15)"],["sedam i trideset","seven thirty (7:30)"],["ujutro","in the morning"],["popodne","in the afternoon"],["navečer","in the evening"],["u podne","at noon"],["u ponoć","at midnight"],["sekunda","second"],["uvijek","always"],["ponekad","sometimes"],["često","often"],["rijetko","rarely"],["nikad","never"],["svaki dan","every day"],["obično","usually"],["noću","at night"],["prošli tjedan","last week"],["sljedeći tjedan","next week"],["sada","now"],["kasnije","later"],["rano","early"],["kasno","late"],["vikend","weekend"],["preksutra","day after tomorrow"],["prekjučer","day before yesterday"],["radni dan","workday"],["blagdan","holiday"],["Koji je danas dan?","What day is it today?"],["Sviđa mi se...","I like..."],["Ne sviđa mi se...","I don't like..."]],
  "transport":[["Auto","Car"],["Autobus","Bus"],["Vlak","Train"],["Tramvaj","Tram"],["Avion","Airplane"],["Brod","Ship"],["Bicikl","Bicycle"],["Taksi","Taxi"],["Trajekt","Ferry"],["Motor","Motorcycle"],["Cesta","Road"],["Autocesta","Highway"],["Putovnica","Passport"],["Karta","Ticket/Map"],["Vozačka","Driver's license"],["automobil","car"],["kamion","truck"],["motocikl","motorcycle"],["helikopter","helicopter"],["skuter","scooter"],["jedrilica","sailboat"],["balon","balloon"],["metro","subway"],["kombi","van"],["vatrogasno vozilo","fire truck"]],
  "questions":[["Tko?","Who?"],["Što?","What?"],["Gdje?","Where?"],["Kad?","When?"],["Zašto?","Why?"],["Kako?","How?"],["Koliko?","How many/much?"],["Koji?","Which?"],["Čiji?","Whose?"],["Zato što...","Because..."],["Kakav?","What kind of? (m)"],["Kakva?","What kind of? (f)"],["Kakvo?","What kind of? (n)"],["Kamo?","Where to?"],["Odakle?","Where from?"],["Kuda?","Which way?"]],
  "restaurant":[["Konobar","Waiter"],["Jelovnik","Menu"],["Račun","Bill"],["Naručiti","To order"],["Predjelo","Appetizer"],["Glavno jelo","Main course"],["Desert","Dessert"],["Piće","Drink"],["Dobar tek!","Bon appétit!"],["Koliko košta?","How much?"],["Napojnica","Tip"],["Rezervacija","Reservation"],["Stol za dvoje","Table for two"],["Želio bih...","I would like..."],["Gemišt","Wine spritzer"],["čaša","glass"],["žlica","spoon"],["vilica","fork"],["nož","knife"],["tanjur","plate"],["plitki tanjur","flat plate"],["duboki tanjur","deep plate/bowl"],["žličica","teaspoon"],["Imate li slobodan stol?","Do you have a free table?"],["Stol za dvoje!","Table for two!"],["Što možete preporučiti?","What can you recommend?"],["Molim Vas račun!","The bill please!"],["Karticom.","By card."],["Gotovinom.","By cash."],["Molim vas jelovnik!","The menu please!"],["Uzet ću to!","I'll take that!"],["Je li sve u redu?","Is everything OK?"]],
  "places":[["Grad","City"],["Selo","Village"],["Bolnica","Hospital"],["Ljekarna","Pharmacy"],["Škola","School"],["Kazalište","Theater"],["Knjižnica","Library"],["Pošta","Post office"],["Banka","Bank"],["Restoran","Restaurant"],["Hotel","Hotel"],["Aerodrom","Airport"],["Kolodvor","Train station"],["Autobusni kolodvor","Bus station"],["Policija","Police"],["Vatrogasci","Fire department"],["Stadion","Stadium"],["Kino","Cinema"],["Luka","Harbor/Port"]],
  "adjectives":[["Nov","New"],["Star","Old"],["Velik","Big"],["Mali","Small"],["Dug","Long"],["Kratak","Short"],["Dobar","Good"],["Loš","Bad"],["Lijep","Beautiful"],["Ružan","Ugly"],["Brz","Fast"],["Spor","Slow"],["Skup","Expensive"],["Jeftin","Cheap"],["Čist","Clean"],["Prljav","Dirty"],["Lak","Easy"],["Težak","Difficult"],["Zdrav","Healthy"],["Bolestan","Sick"],["Bogat","Rich"],["Siromašan","Poor"],["Topao","Warm"],["Hladan","Cold"],["Vruć","Hot"],["Glasan","Loud"],["Tih","Quiet"],["Otvoren","Open"],["Zatvoren","Closed"],["Pun","Full"],["Prazan","Empty"],["Suh","Dry"],["Mokar","Wet"],["Sretan","Happy"],["Tužan","Sad"],["Jak","Strong"],["Slab","Weak"],["Mlad","Young"],["Zanimljiv","Interesting"],["Dosadan","Boring"]],
  "emotions":[["sretan","happy (m)"],["sretna","happy (f)"],["tužan","sad (m)"],["tužna","sad (f)"],["ljut","angry (m)"],["ljuta","angry (f)"],["veseo","cheerful (m)"],["vesela","cheerful (f)"],["zabrinut","worried (m)"],["zabrinuta","worried (f)"],["uplašen","scared (m)"],["uplašena","scared (f)"],["umoran","tired (m)"],["umorna","tired (f)"],["gladan","hungry (m)"],["gladna","hungry (f)"],["žedan","thirsty (m)"],["žedna","thirsty (f)"],["bolestan","sick (m)"],["bolesna","sick (f)"]],
  "opposites":[["hrabar","brave"],["plašljiv","timid"],["opasan","dangerous"],["bezopasan","harmless"],["vrijedan","hardworking"],["lijen","lazy"],["ozbiljan","serious"],["neozbiljan","not serious"],["zanimljiv","interesting"],["dosadan","boring"],["pametan","smart"],["glup","stupid"],["jak","strong"],["slab","weak"],["mlad","young"],["star","old"]],
  "comparatives":[["lijep","beautiful"],["ljepši","more beautiful"],["najljepši","most beautiful"],["velik","big"],["veći","bigger"],["najveći","biggest"],["malen","small"],["manji","smaller"],["najmanji","smallest"],["dobar","good"],["bolji","better"],["najbolji","best"],["brz","fast"],["brži","faster"],["najbrži","fastest"],["spor","slow"],["sporiji","slower"],["najsporiji","slowest"]],
  "professions":[["policajac","policeman"],["liječnik","doctor"],["medicinska sestra","nurse"],["kuhar","cook"],["frizer","hairdresser"],["učiteljica","teacher"],["vatrogasac","fireman"],["zubar","dentist"],["vozač","driver"],["novinar","journalist"],["pilot","pilot"],["odvjetnik","lawyer"],["inženjer","engineer"],["prodavač","salesperson"],["programer","programmer"],["farmer","farmer"],["glazbenik","musician"]],
  "travel":[["Putovanje","Journey"],["Odmor","Vacation"],["Prtljaga","Luggage"],["Ključ","Key"],["Karta","Ticket"],["Polazak","Departure"],["Dolazak","Arrival"],["Povratna karta","Return ticket"],["Jednosmjerna","One-way"],["Informacije","Information"],["Razgledavanje","Sightseeing"],["Fotografija","Photo"],["Suvenir","Souvenir"]],
  "food":[["Kruh","Bread"],["Voda","Water"],["Mlijeko","Milk"],["Jabuka","Apple"],["Sir","Cheese"],["Riba","Fish"],["Meso","Meat"],["Juha","Soup"],["Kava","Coffee"],["Čaj","Tea"],["Sladoled","Ice cream"],["Jaje","Egg"],["Riža","Rice"],["Pizza","Pizza"],["Čokolada","Chocolate"],["Med","Honey"],["Povrće","Vegetables"],["Voće","Fruit"],["Sol","Salt"],["Papar","Pepper"],["Šećer","Sugar"],["Ulje","Oil"],["Maslac","Butter"],["Jogurt","Yoghurt"],["Banana","Banana"],["Naranča","Orange"],["Limun","Lemon"],["Grožđe","Grapes"],["Rajčica","Tomato"],["Krastavac","Cucumber"],["Luk","Onion"],["Krumpir","Potato"],["Piletina","Chicken"],["Svinjetina","Pork"],["Govedina","Beef"],["Janjetina","Lamb"],["Pivo","Beer"],["Vino","Wine"],["Sok","Juice"],["Ćevapi","Grilled meat rolls"],["Štrukli","Cheese pastry"],["Sarma","Stuffed cabbage"],["Palačinke","Crepes"],["Burek","Meat/cheese pie"],["Fritule","Fried dough balls"],["Ajvar","Pepper relish"]],
  "verbs":[["Biti","To be"],["Imati","To have"],["Ići","To go"],["Jesti","To eat"],["Piti","To drink"],["Spavati","To sleep"],["Pisati","To write"],["Govoriti","To speak"],["Učiti","To learn"],["Živjeti","To live"],["Voljeti","To love"],["Htjeti","To want"],["Moći","To be able"],["Morati","To must"],["Trebati","To need"],["Željeti","To wish"],["Smjeti","To be allowed"],["Znati","To know"],["Misliti","To think"],["Vidjeti","To see"],["Čuti","To hear"],["Platiti","To pay"],["Dati","To give"],["Uzeti","To take"],["Doći","To come"],["Otići","To leave"],["Hodati","To walk"],["Letjeti","To fly"],["Plesati","To dance"],["Sjesti","To sit"],["Otvoriti","To open"],["Zatvoriti","To close"],["Početi","To begin"],["Završiti","To finish"],["Pomoći","To help"],["Pitati","To ask"],["Odgovoriti","To answer"],["Naučiti","To learn/master"],["Razumjeti","To understand"],["Zaboraviti","To forget"],["Sjećati se","To remember"]],
  "fruits":[["jabuka","apple"],["kruška","pear"],["banana","banana"],["naranča","orange"],["limun","lemon"],["jagoda","strawberry"],["malina","raspberry"],["borovnica","blueberry"],["trešnja","cherry"],["višnja","sour cherry"],["breskva","peach"],["marelica","apricot"],["grožđe","grapes"],["lubenica","watermelon"],["dinja","melon"],["šljiva","plum"],["smokva","fig"],["nar","pomegranate"],["ananas","pineapple"],["kivi","kiwi"],["grejp","grapefruit"],["mango","mango"],["papaja","papaya"],["kokos","coconut"],["avokado","avocado"]],
  "vegetables":[["mrkva","carrot"],["krumpir","potato"],["rajčica","tomato"],["krastavac","cucumber"],["luk","onion"],["češnjak","garlic"],["paprika","bell pepper"],["tikvica","zucchini"],["brokula","broccoli"],["cvjetača","cauliflower"],["špinat","spinach"],["salata","lettuce"],["gljiva","mushroom"],["grah","beans"],["grašak","peas"],["kukuruz","corn"],["bundeva","pumpkin"],["kupus","cabbage"],["celer","celery"],["repa","beet"],["artičoka","artichoke"],["patlidžan","eggplant"],["poriluk","leek"],["šparoga","asparagus"],["baškotin","chard / Swiss chard"]],
  "sports":[["nogomet","football / soccer"],["košarka","basketball"],["odbojka","volleyball"],["tenis","tennis"],["plivanje","swimming"],["atletika","athletics / track and field"],["rukomet","handball"],["biciklizam","cycling"],["trčanje","running"],["veslanje","rowing"],["jedrenje","sailing"],["ronjenje","diving"],["gimnastika","gymnastics"],["vaterpolo","water polo"],["stolni tenis","table tennis"],["badminton","badminton"],["skijanje","skiing"],["golf","golf"],["boks","boxing"],["ragbi","rugby"],["hokej","hockey"],["borilačke vještine","martial arts"],["jahanje","horseback riding"],["streličarstvo","archery"],["dizanje utega","weightlifting"]],
  "holidays":[["Božić","Christmas"],["Uskrs","Easter"],["Nova godina","New Year"],["Badnjak","Christmas Eve"],["Silvestar","New Year's Eve"],["Valentinovo","Valentine's Day"],["Majčin dan","Mother's Day"],["Očev dan","Father's Day"],["Dan neovisnosti","Independence Day (June 25)"],["Dan domovine","Homeland Thanksgiving Day"],["Martinje","St. Martin's Day"],["Poklade","Carnival / Mardi Gras"],["uskrsna jaja","Easter eggs"],["jaslice","nativity scene"],["adventski vijenac","Advent wreath"],["jelka","Christmas tree"],["vjenčanje","wedding"],["krštenje","baptism"],["krizma","confirmation"],["proslava","celebration"],["blagdan","public holiday"],["godišnjica","anniversary"],["imendan","name day"],["Sv. Nikola","St. Nicholas (Dec 6)"],["Tijelovo","Corpus Christi"]],
  "personality":[["ljubazan","kind / friendly (m)"],["ljubazna","kind / friendly (f)"],["hrabar","brave (m)"],["hrabra","brave (f)"],["sramežljiv","shy (m)"],["sramežljiva","shy (f)"],["smiješan","funny (m)"],["smiješna","funny (f)"],["pošten","honest (m)"],["poštena","honest (f)"],["strpljiv","patient (m)"],["strpljiva","patient (f)"],["tvrdoglav","stubborn (m)"],["tvrdoglava","stubborn (f)"],["velikodušan","generous (m)"],["marljiv","hardworking (m)"],["lijen","lazy (m)"],["znatiželjан","curious (m)"],["opušten","relaxed (m)"],["siguran u sebe","self-confident"],["skroman","humble (m)"],["otvoren","open / outgoing (m)"],["intuitivan","intuitive (m)"],["odlučan","decisive (m)"],["nesebičan","unselfish (m)"]]
};
// ═══ TOP 100 WORDS BY SITUATION ═══
const TOP100 = {
  "At the Airport": [["Aerodrom","Airport"],["Putovnica","Passport"],["Karta","Ticket"],["Let","Flight"],["Polazak","Departure"],["Dolazak","Arrival"],["Vrata","Gate"],["Prtljaga","Luggage"],["Prijava","Check-in"],["Kašnjenje","Delay"],["Sjedalo","Seat"],["Prozor","Window seat"],["Prolaz","Aisle seat"],["Ukrcavanje","Boarding"],["Izlaz","Exit"],["Carinska kontrola","Customs"],["Sigurnost","Security"],["Povratna karta","Return ticket"],["Jednosmjerna","One-way"],["Terminal","Terminal"]],
  "At the Restaurant": [["Jelovnik","Menu"],["Naručiti","To order"],["Konobar","Waiter"],["Račun","Bill"],["Predjelo","Appetizer"],["Glavno jelo","Main course"],["Desert","Dessert"],["Piće","Drink"],["Kava","Coffee"],["Voda","Water"],["Pivo","Beer"],["Vino","Wine"],["Kruh","Bread"],["Juha","Soup"],["Salata","Salad"],["Meso","Meat"],["Riba","Fish"],["Napojnica","Tip"],["Stol","Table"],["Dobar tek!","Bon appétit!"]],
  "At the Doctor": [["Liječnik","Doctor"],["Bolnica","Hospital"],["Ljekarna","Pharmacy"],["Lijek","Medicine"],["Boli me","It hurts"],["Temperatura","Fever"],["Kašalj","Cough"],["Prehlada","Cold"],["Gripa","Flu"],["Alergija","Allergy"],["Recept","Prescription"],["Tablete","Pills"],["Pregled","Examination"],["Krv","Blood"],["Krvni tlak","Blood pressure"],["Hitna pomoć","Emergency"],["Ozljeda","Injury"],["Bol","Pain"],["Zdravlje","Health"],["Osjećam se loše","I feel bad"]],
  "At the Beach": [["Plaža","Beach"],["More","Sea"],["Pijesak","Sand"],["Val","Wave"],["Sunce","Sun"],["Krema za sunčanje","Sunscreen"],["Ručnik","Towel"],["Kupaći kostim","Swimsuit"],["Plivati","To swim"],["Roniti","To dive"],["Suncobran","Umbrella"],["Ležaljka","Beach chair"],["Brodić","Boat"],["Školjka","Shell"],["Meduza","Jellyfish"],["Sol","Salt"],["Vruće je","It\'s hot"],["Hlad","Shade"],["Morska zvijezda","Starfish"],["Zalazak sunca","Sunset"]],
  "At the Market": [["Tržnica","Market"],["Kupiti","To buy"],["Cijena","Price"],["Koliko košta?","How much?"],["Svježe","Fresh"],["Voće","Fruit"],["Povrće","Vegetables"],["Kilogram","Kilogram"],["Jeftinije","Cheaper"],["Skupo","Expensive"],["Vrećica","Bag"],["Rajčica","Tomato"],["Jabuka","Apple"],["Kruška","Pear"],["Šljiva","Plum"],["Luk","Onion"],["Sir","Cheese"],["Jaja","Eggs"],["Med","Honey"],["Domaće","Homemade"]],
  "Meeting People": [["Bok","Hello"],["Kako se zoveš?","What\'s your name?"],["Zovem se...","My name is..."],["Drago mi je","Nice to meet you"],["Odakle si?","Where are you from?"],["Iz Hrvatske sam","I\'m from Croatia"],["Govorite li engleski?","Do you speak English?"],["Učim hrvatski","I\'m learning Croatian"],["Koliko imaš godina?","How old are you?"],["Što radiš?","What do you do?"],["Oženjen/Udana","Married"],["Slobodan","Single"],["Imaš li djecu?","Do you have kids?"],["Gdje živiš?","Where do you live?"],["Sviđaš mi se","I like you"],["Možemo li se naći?","Can we meet?"],["Telefon","Phone"],["Broj","Number"],["Prijatelj","Friend"],["Obitelj","Family"]],
  "Emergency": [["Pomoć!","Help!"],["Hitna pomoć","Emergency"],["Policija","Police"],["Vatrogasci","Fire dept"],["Požar","Fire"],["Nesreća","Accident"],["Bolestan sam","I\'m sick"],["Izgubio sam se","I\'m lost"],["Ukrali su mi","I\'ve been robbed"],["Zovite policiju","Call police"],["Trebam liječnika","I need a doctor"],["Gdje je bolnica?","Where\'s the hospital?"],["Opasno","Dangerous"],["Bol","Pain"],["Krv","Blood"],["Slomljen","Broken"],["Alergija","Allergy"],["Zadnji čas","Last minute"],["Ne mogu disati","I can\'t breathe"],["Vrtoglavica","Dizziness"]]
};
// ═══ CROATIAN HISTORY — DOMOVINSKI RAT ═══
const HISTORY = {
  title: "Domovinski Rat — Homeland War",
  subtitle: "The Croatian War of Independence (1991–1995)",
  intro: "The Homeland War represents the birth of modern Croatia as a free and sovereign nation. After centuries under foreign rule — from the Habsburg Empire to the Kingdom of Yugoslavia and communist Yugoslavia — Croatians finally achieved what generations had dreamed of: an independent homeland. This is the story of how a small nation stood up against overwhelming military force and won its freedom.",
  timeline: [
    { year: "1989", title: "Winds of Change", text: "As communism collapses across Eastern Europe, Croatia begins its journey toward democracy. Political parties are allowed for the first time in decades. The Croatian Democratic Union (HDZ) is founded, giving voice to the Croatian people\'s desire for self-determination.", emoji: "🌅" },
    { year: "1990", title: "First Free Elections", text: "In the first democratic elections since World War II, Croatians overwhelmingly choose independence. Dr. Franjo Tuđman becomes the first democratically elected President. A new constitution is drafted, establishing Croatia as a sovereign nation of the Croatian people. The Croatian šahovnica (checkerboard) proudly returns as the national symbol.", emoji: "🗳️" },
    { year: "1991", title: "Independence Declared", text: "On June 25, 1991, Croatia formally declares independence from Yugoslavia. The decision reflects the will of 94% of Croatian citizens who voted for sovereignty in the May referendum. However, the Yugoslav People\'s Army (JNA) and Serbian paramilitaries refuse to accept Croatian independence and launch armed aggression.", emoji: "🇭🇷" },
    { year: "1991", title: "The Battle of Vukovar", text: "For 87 devastating days, the defenders of Vukovar — outnumbered and outgunned — hold their ground against a massive assault by the JNA and Serbian forces. The city is reduced to rubble, but its heroic resistance becomes the symbol of Croatian courage and sacrifice. Vukovar\'s defenders bought precious time for Croatia to organize its defense. The city\'s sacrifice will never be forgotten. Vukovar — grad heroj (city hero).", emoji: "🕯️" },
    { year: "1991", title: "International Recognition", text: "On January 15, 1992, Croatia is recognized as an independent state by the European Community and the international community. Germany, under Chancellor Helmut Kohl, leads the push for recognition. The dream of Croatian statehood becomes reality in the eyes of the world.", emoji: "🌍" },
    { year: "1992-94", title: "Under Occupation", text: "Nearly one-third of Croatian territory remains under Serbian occupation. The UN deploys peacekeeping forces, but the occupied areas — the self-proclaimed \'Republic of Serbian Krajina\' — continue to exist. Over 250,000 Croatians are expelled from their homes. The Croatian people endure, building their military and waiting for the right moment to liberate their homeland.", emoji: "⏳" },
    { year: "1995", title: "Operacija Oluja — Operation Storm", text: "On August 4-7, 1995, the Croatian Army launches Operation Storm, the largest European land military operation since World War II. In just 84 hours, Croatian forces liberate the vast majority of occupied territory. The operation is a brilliant military success and restores Croatian sovereignty over nearly all of its internationally recognized borders. Church bells ring across Croatia. People weep with joy. The homeland is finally free.", emoji: "⚡" },
    { year: "1998", title: "Peaceful Reintegration", text: "The last occupied region — eastern Slavonia including Vukovar — is peacefully reintegrated into Croatia through the Erdut Agreement and UN transitional administration. Croatia is whole again. The Croatian flag flies over Vukovar for the first time since 1991.", emoji: "🕊️" }
  ],
  heroes: [
    { name: "Franjo Tuđman", role: "First President of Croatia", desc: "Father of the nation. Led Croatia from communist Yugoslavia to independence. His vision and determination guided the country through its darkest hours to sovereignty." },
    { name: "Gojko Šušak", role: "Minister of Defence", desc: "Organized the Croatian military from virtually nothing into a force capable of defending and liberating the homeland." },
    { name: "Blago Zadro", role: "Commander of Vukovar Defense", desc: "Hero of Vukovar. Led the defense of the city with extraordinary courage. Gave his life defending his hometown." },
    { name: "Branimir Glavaš", role: "Defense of Osijek", desc: "Organized the defense of Osijek in eastern Slavonia when Croatian cities came under attack." },
    { name: "Ante Gotovina", role: "General — Operation Storm", desc: "Commanded the Split Military District. Key architect of the liberation of the Krajina region during Operation Storm." },
    { name: "Janko Bobetko", role: "Army Chief of Staff", desc: "Veteran military leader who helped shape the Croatian Army into an effective fighting force." }
  ],
  keyDates: [
    ["25. lipnja 1991.","Croatian Parliament declares independence","Dan državnosti — Statehood Day"],
    ["18. studenoga 1991.","Fall of Vukovar","Dan sjećanja na žrtve Vukovara — Remembrance Day"],
    ["15. siječnja 1992.","International recognition of Croatia","Međunarodno priznanje"],
    ["1. svibnja 1995.","Operation Flash liberates western Slavonia","Operacija Bljesak"],
    ["4.-7. kolovoza 1995.","Operation Storm liberates the Krajina","Operacija Oluja"],
    ["8. listopada","Croatian Parliament independence vote","Dan neovisnosti"],
    ["5. kolovoza","Victory and Homeland Thanksgiving Day","Dan pobjede i domovinske zahvalnosti"]
  ],
  vocabulary: [
    ["Domovinski rat","Homeland War"],["Sloboda","Freedom"],["Neovisnost","Independence"],
    ["Branitelj","Defender/Veteran"],["Žrtva","Victim/Sacrifice"],["Heroj","Hero"],
    ["Oluja","Storm"],["Sjećanje","Remembrance"],["Zastava","Flag"],
    ["Vojska","Army"],["Obrana","Defense"],["Pobjeda","Victory"],
    ["Mir","Peace"],["Pomirenje","Reconciliation"],["Hrabrost","Courage"],
    ["Domoljublje","Patriotism"],["Žrtve","Victims/Casualties"],["Oslobođenje","Liberation"]
  ],
  quote: "Za Dom Spremni! — For the Homeland, Ready!",
  quote2: "Bog i Hrvati! — God and Croatians!"
};
// ═══ CROATIAN EVENTS CALENDAR ═══
const EVENTS = [
  { month: 1, day: 1, name: "Nova Godina", en: "New Year\'s Day", desc: "Croatians celebrate with fireworks in city squares. Zagreb\'s Ban Jelačić Square is the place to be." },
  { month: 1, day: 6, name: "Sveta tri kralja", en: "Epiphany", desc: "Three Kings Day. Children receive small gifts. Star singers go door to door." },
  { month: 1, day: 22, name: "Vincekovo", en: "St. Vincent\'s Day", desc: "Winemakers cut the first vine of the season. Wine walks through vineyards, mulled wine." },
  { month: 2, day: 0, name: "Karneval", en: "Carnival", desc: "Rijeka Carnival is the biggest in Croatia — over 100,000 spectators. Masked parades, traditional costumes, burning of the Pust effigy." },
  { month: 2, day: 3, name: "Sveti Vlaho", en: "Feast of St. Blaise", desc: "Dubrovnik\'s patron saint. The entire city celebrates with processions and ceremonies." },
  { month: 3, day: 0, name: "Uskrs", en: "Easter", desc: "Most important religious holiday. Decorating Easter eggs (pisanice), blessing of food baskets, lamb for lunch. šunka (ham) and hren (horseradish)." },
  { month: 4, day: 0, name: "Proljeće u Hrvatskoj", en: "Spring in Croatia", desc: "Festival season begins. Outdoor markets flourish. The coast awakens." },
  { month: 5, day: 1, name: "Praznik rada", en: "Labour Day", desc: "Traditional outdoor grilling with family and friends. Parks fill with people." },
  { month: 5, day: 7, name: "Sveti Duje", en: "Saint Domnius Day", desc: "Split\'s patron saint festival. Three days of celebration in Diocletian\'s Palace." },
  { month: 5, day: 30, name: "Dan državnosti", en: "Statehood Day", desc: "Commemorates the 1990 formation of the first democratic Croatian Parliament. Military ceremonies, concerts." },
  { month: 6, day: 22, name: "Dan antifašističke borbe", en: "Anti-Fascist Resistance Day", desc: "Honors the Croatian partisans who fought against fascism in WWII." },
  { month: 6, day: 25, name: "Dan neovisnosti", en: "Independence Day", desc: "Croatia declared independence from Yugoslavia on this day in 1991." },
  { month: 7, day: 0, name: "Dubrovačke ljetne igre", en: "Dubrovnik Summer Festival", desc: "World-famous 45-day festival of theater, music, and dance in historic Dubrovnik locations." },
  { month: 7, day: 0, name: "Ultra Europe", en: "Ultra Europe Festival", desc: "One of Europe\'s biggest electronic music festivals, held in Split." },
  { month: 8, day: 5, name: "Dan pobjede", en: "Victory Day", desc: "Celebrates Operation Storm (1995), the liberation of occupied Croatian territory. Massive celebrations in Knin." },
  { month: 8, day: 15, name: "Velika Gospa", en: "Assumption of Mary", desc: "Major Catholic holiday. Pilgrimages to Sinj for the Sinjska Alka — a medieval knights\' tournament held since 1715." },
  { month: 10, day: 8, name: "Dan Sabora", en: "Croatian Parliament Day", desc: "Commemorates the 1991 Croatian Parliament decision to sever ties with Yugoslavia." },
  { month: 11, day: 1, name: "Svi sveti", en: "All Saints\' Day", desc: "Croatians visit cemeteries and light candles for deceased loved ones. A deeply emotional day." },
  { month: 11, day: 18, name: "Dan sjećanja na Vukovar", en: "Vukovar Remembrance Day", desc: "Solemn procession through Vukovar. Thousands walk holding candles to honor those who gave their lives for Croatian freedom." },
  { month: 12, day: 25, name: "Božić", en: "Christmas", desc: "Croatian Christmas traditions: badnjak (Yule log), midnight mass, bakalar (cod) on Christmas Eve, sarma and turkey on Christmas Day." },
  { month: 12, day: 26, name: "Sveti Stjepan", en: "St. Stephen\'s Day", desc: "Second day of Christmas. Family visits continue." },
  { month: 12, day: 31, name: "Stara Godina", en: "New Year\'s Eve", desc: "Celebrations across Croatia. Zagreb\'s Advent is among the best Christmas markets in Europe." }
];
// ═══ MODAL VERBS ═══
const MODAL = {
  verbs: [
    { inf:"željeti", en:"to wish/want", icon:"💫", forms:["želim","želiš","želi","želimo","želite","žele"], neg:["ne želim","ne želiš","ne želi","ne želimo","ne želite","ne žele"], tip:"Polite way to express wants. Use in restaurants/shops." },
    { inf:"htjeti", en:"to want/will", icon:"🎯", forms:["hoću","hoćeš","hoće","hoćemo","hoćete","hoće"], neg:["neću","nećeš","neće","nećemo","nećete","neće"], tip:"Direct wanting + future tense helper (ću,ćeš,će...)." },
    { inf:"morati", en:"must/have to", icon:"⚡", forms:["moram","moraš","mora","moramo","morate","moraju"], neg:["ne moram","ne moraš","ne mora","ne moramo","ne morate","ne moraju"], tip:"Always + infinitive. Ne moram = don\'t have to." },
    { inf:"trebati", en:"to need/should", icon:"📋", forms:["trebam","trebaš","treba","trebamo","trebate","trebaju"], neg:["ne trebam","ne trebaš","ne treba","ne trebamo","ne trebate","ne trebaju"], tip:"With noun = need. With infinitive = should." },
    { inf:"moći", en:"can/able to", icon:"💪", forms:["mogu","možeš","može","možemo","možete","mogu"], neg:["ne mogu","ne možeš","ne može","ne možemo","ne možete","ne mogu"], tip:"Irregular: ja MOGU. Može! = OK/Sure!" },
    { inf:"smjeti", en:"may/allowed", icon:"🚦", forms:["smijem","smiješ","smije","smijemo","smijete","smiju"], neg:["ne smijem","ne smiješ","ne smije","ne smijemo","ne smijete","ne smiju"], tip:"Permission. Ne smijem = must not/not allowed." }
  ],
  persons: ["ja","ti","on/ona","mi","vi","oni/one"],
  fillBlanks: [
    {q:"Danas _____ (ja) puno raditi.",a:"moram",v:"morati",en:"Today I must work a lot.",al:["želim","mogu","trebam"]},
    {q:"Ja _____ novi mobitel.",a:"trebam",v:"trebati",en:"I need a new phone.",al:["moram","mogu","smijem"]},
    {q:"Ivan _____ biti najbolji student.",a:"želi",v:"željeti",en:"Ivan wants to be the best student.",al:["mora","treba","smije"]},
    {q:"Zato on _____ puno učiti.",a:"mora",v:"morati",en:"That\'s why he must study a lot.",al:["želi","može","smije"]},
    {q:"Mi _____ putovati u Tursku.",a:"želimo",v:"željeti",en:"We want to travel to Turkey.",al:["moramo","možemo","smijemo"]},
    {q:"_____ li ići u kino?",a:"Hoćeš",v:"htjeti",en:"Do you want to go to the cinema?",al:["Moraš","Možeš","Smiješ"]},
    {q:"_____ (mi) li dobiti stol za dvoje?",a:"Možemo",v:"moći",en:"Can we get a table for two?",al:["Moramo","Želimo","Smijemo"]},
    {q:"_____ li ući u sobu?",a:"Smijem",v:"smjeti",en:"May I enter the room?",al:["Mogu","Moram","Želim"]},
    {q:"Ne _____ pušiti u restoranu.",a:"smijete",v:"smjeti",en:"You must not smoke in the restaurant.",al:["možete","morate","trebate"]},
    {q:"Djeca _____ ići u školu.",a:"moraju",v:"morati",en:"Children must go to school.",al:["žele","mogu","smiju"]},
    {q:"_____ kavu, molim.",a:"Želim",v:"željeti",en:"I\'d like coffee, please.",al:["Moram","Mogu","Smijem"]},
    {q:"Ona _____ govoriti tri jezika.",a:"može",v:"moći",en:"She can speak three languages.",al:["mora","smije","želi"]},
    {q:"_____ ti reći nešto važno.",a:"Moram",v:"morati",en:"I must tell you something important.",al:["Želim","Mogu","Smijem"]},
    {q:"Vi _____ biti tihi u knjižnici.",a:"morate",v:"morati",en:"You must be quiet in the library.",al:["želite","možete","trebate"]},
    {q:"_____ li mi pomoći?",a:"Možeš",v:"moći",en:"Can you help me?",al:["Moraš","Smiješ","Trebaš"]}
  ],
  masterQuiz: [
    {q:"Which verb means \'must\'?",a:"morati",al:["željeti","moći","trebati"]},
    {q:"\'Mogu li dobiti račun?\' means:",a:"Can I get the bill?",al:["Must I get the bill?","Do I need the bill?","May I get the bill?"]},
    {q:"Polite way to say \'I would like\' uses:",a:"željeti",al:["morati","moći","trebati"]},
    {q:"\'Ne smiješ\' means:",a:"You are not allowed to",al:["You cannot","You don\'t have to","You don\'t want to"]},
    {q:"Complete: Mi _____ putovati. (want)",a:"želimo",al:["moramo","možemo","smijemo"]},
    {q:"Which is irregular in 1st person?",a:"moći (ja MOGU)",al:["morati (moram)","trebati (trebam)","željeti (želim)"]},
    {q:"\'Treba jesti zdravo\' means:",a:"One should eat healthy",al:["He needs to eat","I want to eat","She must eat"]},
    {q:"For permission requests, use:",a:"smjeti",al:["morati","trebati","željeti"]},
    {q:"Complete: _____ li mi pomoći?",a:"Možeš",al:["Moraš","Smiješ","Trebaš"]},
    {q:"Ne moram = ",a:"I don\'t have to",al:["I must not","I cannot","I don\'t want to"]},
    {q:"\'Može!\' colloquially means:",a:"OK! / Sure!",al:["He can!","Maybe!","It\'s possible!"]},
    {q:"Which verb can be used with nouns AND infinitives?",a:"trebati",al:["morati","smjeti","moći"]}
  ]
};
// ═══ GRAMMAR DATA ═══
const GRAM = {
  beginner: [
    {title:"Noun Genders & Plurals",desc:"3 genders: Feminine (-A: žena, knjiga), Neuter (-O/-E: selo, sunce), Masculine (consonant: grad). Plurals: Fem -A→-E, Neut -O→-A, Masc add -I/-OVI.",exs:[["žena→žene","woman→women"],["selo→sela","village→villages"],["grad→gradovi","city→cities"]],qs:[{q:"Gender of \'kuća\'?",o:["Masculine","Feminine","Neuter"],c:1},{q:"Plural of \'knjiga\'?",o:["knjige","knjiga","knjigi"],c:0}]},
    {title:"Verb \'Biti\' (To Be)",desc:"Ja sam, Ti si, On/Ona je, Mi smo, Vi ste, Oni su. Negative: nisam, nisi, nije, nismo, niste, nisu.",exs:[["Ja sam profesor.","I am a teacher."],["Ja nisam umoran.","I am not tired."]],qs:[{q:"\'I am\' in Croatian?",o:["Ja si","Ja sam","Ja je"],c:1},{q:"Negative of \'Ti si\'?",o:["Ti ne si","Ti nisi","Ti nisam"],c:1}]},
    {title:"Basic Negation",desc:"Add \'ne\' before the verb. For \'biti\': nisam, nisi, nije... For others: ne + verb.",exs:[["Ne govorim","I don\'t speak"],["Nema problema","No problem"]],qs:[{q:"\'I don\'t know\' =",o:["Ne znam","Nisam znam","Ja ne"],c:0}]}
  ],
  intermediate: [
    {title:"Present Tense",desc:"-ati verbs: -am,-aš,-a,-amo,-ate,-aju. -iti verbs: -im,-iš,-i,-imo,-ite,-e.",exs:[["Ja čitam","I read"],["Oni čitaju","They read"]],qs:[{q:"Ja ___ (čitati)",o:["čitaš","čitam","čita"],c:1}]},
    {title:"Accusative Case",desc:"Direct object. Fem: -a→-u. Masc animate: add -a. Inanimate/neuter: no change.",exs:[["Vidim kuću.","I see a house."],["Čitam knjigu.","I read a book."]],qs:[{q:"Accusative of \'sestra\'?",o:["sestru","sestre","sestri"],c:0}]},
    {title:"Past Tense",desc:"Past participle + \'biti\'. Masc: -o, Fem: -la, Neut: -lo.",exs:[["Ja sam čitao","I read (m)"],["Ona je pjevala","She sang"]],qs:[{q:"She ate (jesti)?",o:["Ona je jeo","Ona je jela","Ona je jelo"],c:1}]},
    {title:"Future Tense",desc:"ću/ćeš/će/ćemo/ćete/će + infinitive. Neg: neću/nećeš/neće...",exs:[["Ja ću čitati.","I will read."],["Neću spavati.","I won\'t sleep."]],qs:[{q:"\'I will eat\' = Ja ___ jesti.",o:["ću","ćeš","će"],c:0}]}
  ],
  advanced: [
    {title:"All Seven Cases",desc:"Nominativ (who?), Genitiv (whose?), Dativ (to whom?), Akuzativ (what?), Vokativ (hey!), Lokativ (where?), Instrumental (with what?).",exs:[["žena: žena,žene,ženi,ženu,ženo,ženi,ženom","all 7 cases"]],qs:[{q:"Dativ answers?",o:["Where?","To whom?","What?"],c:1},{q:"How many cases?",o:["5","6","7"],c:2}]},
    {title:"Conditional Mood",desc:"bih/bi/bismo/biste + past participle. Wishes, polite requests.",exs:[["Ja bih jeo.","I would eat."],["Željela bih kavu.","I\'d like coffee."]],qs:[{q:"\'I would go\' = Ja ___ išao.",o:["bi","bih","bismo"],c:1}]}
  ]
};
// ═══ PLACEMENT TEST ═══
const PLACE = [
  {q:"What does 'Bok' mean?",o:["Goodbye","Hello","Thank you"],c:1,d:1},
  {q:"How do you say 'Thank you'?",o:["Molim","Hvala","Da"],c:1,d:1},
  {q:"'Dobar dan' means?",o:["Good night","Good day","Goodbye"],c:1,d:1},
  {q:"What is 'voda'?",o:["Wine","Milk","Water"],c:2,d:1},
  {q:"'Pas' means?",o:["Cat","Dog","Bird"],c:1,d:1},
  {q:"How do you say 'Yes'?",o:["Ne","Da","Ili"],c:1,d:1},
  {q:"What number is 'tri'?",o:["2","3","4"],c:1,d:1},
  {q:"'Mama' means?",o:["Father","Sister","Mom"],c:2,d:1},
  {q:"'Crvena' is which color?",o:["Blue","Red","Green"],c:1,d:1},
  {q:"How do you say 'Goodbye'?",o:["Bok","Doviđenja","Hvala"],c:1,d:1},
  {q:"'Kruh' means?",o:["Bread","Butter","Cheese"],c:0,d:1},
  {q:"What is 'mačka'?",o:["Dog","Fish","Cat"],c:2,d:1},
  {q:"'Jabuka' means?",o:["Orange","Apple","Banana"],c:1,d:1},
  {q:"How do you say 'Please'?",o:["Hvala","Oprosti","Molim"],c:2,d:1},
  {q:"What number is 'pet'?",o:["3","5","7"],c:1,d:1},
  {q:"'Kuća' is which gender?",o:["Masculine","Feminine","Neuter"],c:1,d:2},
  {q:"Ja ___ (biti)",o:["si","sam","je"],c:1,d:2},
  {q:"'Volim te' means?",o:["I see you","I love you","I need you"],c:1,d:2},
  {q:"Plural of 'žena'?",o:["žene","ženi","ženama"],c:0,d:2},
  {q:"'Idem u školu' means?",o:["I like school","I see school","I go to school"],c:2,d:2},
  {q:"Which is a day? 'Srijeda'",o:["Month","Wednesday","Season"],c:1,d:2},
  {q:"'Ne razumijem' means?",o:["I don't know","I don't understand","I don't want"],c:1,d:2},
  {q:"Accusative of 'knjiga'?",o:["knjige","knjigu","knjizi"],c:1,d:2},
  {q:"'Mogu li' means?",o:["I must","May I / Can I","I want"],c:1,d:2},
  {q:"'Koliko košta?' asks about?",o:["Time","Price","Distance"],c:1,d:2},
  {q:"'Želim naručiti' means?",o:["I want to leave","I want to order","I want to pay"],c:1,d:2},
  {q:"'Lijevo' means?",o:["Right","Left","Straight"],c:1,d:2},
  {q:"'Govori li netko engleski?' asks?",o:["Where is English?","Does anyone speak English?","I speak English"],c:1,d:2},
  {q:"'Trebam' expresses?",o:["Ability","Permission","Need"],c:2,d:2},
  {q:"Which is correct: 'Ja sam gladan'?",o:["I am tired","I am hungry","I am happy"],c:1,d:2},
  {q:"Past tense: 'She spoke' =",o:["Ona govori","Ona je govorila","Ona govoriti"],c:1,d:3},
  {q:"How many Croatian cases?",o:["5","6","7"],c:2,d:3},
  {q:"Dative answers which question?",o:["Gdje?","Komu?","Koga?"],c:1,d:3},
  {q:"'Conditional' uses which helper?",o:["sam/si/je","ću/ćeš/će","bih/bi/bismo"],c:2,d:3},
  {q:"Which case always needs a preposition?",o:["Genitiv","Lokativ","Akuzativ"],c:1,d:3},
  {q:"'Sjećam se' means?",o:["I forget","I remember","I think"],c:1,d:3},
  {q:"Instrumental of 'prijatelj'?",o:["prijatelja","prijatelju","prijateljem"],c:2,d:3},
  {q:"'Unatoč' takes which case?",o:["Genitiv","Dativ","Akuzativ"],c:1,d:3},
  {q:"'Da sam znao, ne bih išao' is?",o:["Past tense","Conditional","Future tense"],c:1,d:3},
  {q:"First Croatian king?",o:["Zvonimir","Trpimir","Tomislav"],c:2,d:3}
];
// ═══ BADGES ═══
const BADGES=[
  {id:"first",n:"First Steps",i:"🌱",d:"Complete 1 lesson",r:s=>s.lc>=1},
  {id:"x100",n:"Rising Star",i:"⭐",d:"100 XP",r:s=>s.xp>=100},
  {id:"x500",n:"Scholar",i:"📚",d:"500 XP",r:s=>s.xp>=500},
  {id:"x1k",n:"Master",i:"🏆",d:"1000 XP",r:s=>s.xp>=1000},
  {id:"perf",n:"Perfectionist",i:"💎",d:"100% on a lesson",r:s=>s.pf>=1},
  {id:"gram",n:"Grammar Guru",i:"📝",d:"Grammar done",r:s=>s.gc>=1},
  {id:"spk",n:"Voice of Croatia",i:"🎤",d:"Speaking done",r:s=>s.sp>=1},
  {id:"mod",n:"Modal Master",i:"🔮",d:"Modal verbs done",r:s=>s.mv>=1},
  {id:"hist",n:"Historian",i:"🏛️",d:"Read history",r:s=>s.hi>=1},
  {id:"x2k",n:"Expert",i:"🎓",d:"2000 XP",r:s=>s.xp>=2000},
  {id:"ded",n:"Dedicated",i:"🔥",d:"5 lessons",r:s=>s.lc>=5}
];
// ═══ READING PASSAGES ═══
const READ = {
  beginner: [
    {title:"Moja Obitelj",tEn:"My Family",text:"Ja sam Ana. Imam jedanaest godina. Moja mama se zove Marija. Moj tata se zove Ivan. Imam brata. On se zove Luka. Luka ima \u010detrnaest godina. Mi \u017eivimo u Zagrebu. Volimo Hrvatsku.",vocab:[["imam","I have"],["godina","years"],["\u017eivimo","we live"],["volimo","we love"]],qs:[{q:"How old is Ana?",o:["10","11","14"],c:1},{q:"Where do they live?",o:["Split","Zagreb","Rijeka"],c:1},{q:"How old is Luka?",o:["11","12","14"],c:2}]},
    {title:"Moj Pas Rex",tEn:"My Dog Rex",text:"Imam psa. Moj pas se zove Rex. Rex je veliki i sme\u0111i. On voli tr\u010dati u parku. Svaki dan idemo u \u0161etnju. Rex voli jesti meso i kosti. On je moj najbolji prijatelj.",vocab:[["pas","dog"],["sme\u0111i","brown"],["tr\u010dati","to run"],["najbolji","best"]],qs:[{q:"Dog name?",o:["Max","Rex","Luka"],c:1},{q:"What color?",o:["White","Brown","Black"],c:1},{q:"Rex eats?",o:["Fish","Meat and bones","Bread"],c:1}]},
    {title:"U \u0160koli",tEn:"At School",text:"Danas je ponedjeljak. Idem u \u0161kolu. Moja \u0161kola je velika. Imam puno prijatelja. U\u010diteljica se zove Ivana. Danas u\u010dimo matematiku i hrvatski jezik. Volim \u0161kolu.",vocab:[["danas","today"],["ponedjeljak","Monday"],["velika","big"],["u\u010dimo","we learn"]],qs:[{q:"What day?",o:["Tuesday","Monday","Friday"],c:1},{q:"Teacher?",o:["Ana","Ivana","Marija"],c:1},{q:"Subjects?",o:["English","Math and Croatian","Science"],c:1}]},
    {title:"Moja Ku\u0107a",tEn:"My House",text:"Moja ku\u0107a je nova i velika. Imam malu kuhinju i veliku sobu. Moj stol je bijeli. Prozor je mali ali soba je lijepa. Vani je sun\u010dano. Nebo je plavo. Moj pas pije mlijeko. Ja \u010ditam knjige. Ja sam sretna.",vocab:[["ku\u0107a","house"],["kuhinja","kitchen"],["stol","table"],["nebo","sky"],["\u010ditam","I read"]],qs:[{q:"House new or old?",o:["Old","Small","New"],c:2},{q:"Table color?",o:["Brown","White","Black"],c:1},{q:"Weather?",o:["Rainy","Cloudy","Sunny"],c:2}]}
  ],
  intermediate: [
    {title:"Ljeto u Dalmaciji",tEn:"Summer in Dalmatia",text:"Pro\u0161log ljeta moja obitelj je putovala u Dalmaciju. Bili smo u Splitu tri dana. Split je prekrasan grad. Svaki dan smo i\u0161li na pla\u017eu. More je bilo toplo i plavo. Jeli smo svje\u017eu ribu. Moj brat je nau\u010dio roniti. Bilo je predivno ljeto.",vocab:[["pro\u0161log ljeta","last summer"],["prekrasan","gorgeous"],["svje\u017eu","fresh"],["roniti","to dive"]],qs:[{q:"Where?",o:["Istria","Dalmatia","Slavonia"],c:1},{q:"Days in Split?",o:["2","3","5"],c:1},{q:"Brother learned?",o:["Swim","Dive","Surf"],c:1}]},
    {title:"Na Tr\u017enici",tEn:"At the Market",text:"Svake subote idem na tr\u017enicu s mamom. Tr\u017enica je puna boja i mirisa. Kupujemo svje\u017ee vo\u0107e i povr\u0107e. Prodava\u010dica nam uvijek da malo sira za probati. Mama kupuje raj\u010dice krastavce i papriku. Ja biram jabuke i kru\u0161ke. Volim tr\u017enicu jer je sve svje\u017ee i ljudi su ljubazni.",vocab:[["tr\u017enica","market"],["subota","Saturday"],["svje\u017ee","fresh"],["ljubazni","kind"]],qs:[{q:"When?",o:["Sundays","Saturdays","Fridays"],c:1},{q:"Seller gives?",o:["Bread","Cheese to try","Fruit"],c:1},{q:"Why like it?",o:["Cheap","Fresh and kind people","Close"],c:1}]},
    {title:"U Restoranu",tEn:"At the Restaurant",text:"Ve\u010deras idemo u restoran. Konobar nam donosi jelovnik. Ja naru\u010dujem riblju juhu za predjelo i lignje za glavno jelo. Moj prijatelj naru\u010duje \u0107evape s ajvarom. Za pi\u0107e uzimamo gemi\u0161t. Na kraju tra\u017eimo ra\u010dun. Ukupno je \u010detrdeset eura. Ostavljamo napojnicu jer je hrana bila izvrsna.",vocab:[["konobar","waiter"],["jelovnik","menu"],["naru\u010dujem","I order"],["ra\u010dun","bill"],["napojnicu","tip"]],qs:[{q:"Appetizer?",o:["\u0106evapi","Fish soup","Squid"],c:1},{q:"Gemi\u0161t is?",o:["Beer","Wine spritzer","Juice"],c:1},{q:"Bill?",o:["20 euros","40 euros","50 euros"],c:1}]},
    {title:"Tra\u017eim Put",tEn:"Asking Directions",text:"Izgubio sam se u centru Zagreba. Pitam prolaznika gdje je Trg bana Jela\u010di\u0107a. On ka\u017ee idite ravno ovom ulicom skrenite lijevo kod po\u0161te pa onda desno na semaforu. Trg je odmah tamo. Nakon pet minuta vidim veliki trg s fontanom i kipom.",vocab:[["izgubio sam se","I got lost"],["ravno","straight"],["skrenite","turn"],["lijevo","left"],["desno","right"]],qs:[{q:"Where lost?",o:["Split","Zagreb","Rijeka"],c:1},{q:"Turn at post office?",o:["Right","Left","Straight"],c:1},{q:"On the square?",o:["Church","Fountain and statue","Market"],c:1}]}
  ],
  advanced: [
    {title:"Hrvatska Kultura",tEn:"Croatian Culture",text:"Hrvatska je zemlja bogate kulture i dugih tradicija. Jadransko more planine i ravnice oblikovali su na\u010din \u017eivota razli\u010ditih regija. U Dalmaciji se ljeti odr\u017eavaju festivali klapa. U Slavoniji je tamburica simbol regije. Ova raznolikost \u010dini Hrvatsku posebnom \u2014 mala zemlja s velikim srcem.",vocab:[["bogate","rich"],["oblikovali","shaped"],["raznolikost","diversity"],["posebnom","special"]],qs:[{q:"Slavonia symbol?",o:["Klapa","Tamburica","Kulen"],c:1},{q:"Croatia described as?",o:["Large country","Small with big heart","Island"],c:1}]},
    {title:"Dubrovnik",tEn:"Pearl of the Adriatic",text:"Dubrovnik je jedan od najljep\u0161ih gradova na svijetu. Stare gradske zidine izgra\u0111ene u srednjem vijeku okru\u017euju grad pun kamenih ulica i baroknih crkava. Grad je pre\u017eivio potres 1667 godine i Domovinski rat. Danas je Dubrovnik turisti\u010dka zvijezda poznat po festivalu prekrasnom Stradunu i pogledu na otoke Elafite.",vocab:[["najljep\u0161ih","most beautiful"],["zidine","walls"],["srednjem vijeku","Middle Ages"],["pre\u017eivio","survived"]],qs:[{q:"Walls built?",o:["Roman era","Middle Ages","18th century"],c:1},{q:"1667?",o:["Fire","Earthquake","War"],c:1}]},
    {title:"Kod Lije\u010dnika",tEn:"At the Doctor",text:"Danas se ne osje\u0107am dobro. Imam temperaturu i boli me grlo. Idem kod lije\u010dnika. Lije\u010dnik me pregleda i ka\u017ee da imam anginu. Propisuje mi antibiotik i ka\u017ee da trebam piti puno teku\u0107ine i odmarati se. Idem u ljekarnu po lijekove. Ljekarnica mi obja\u0161njava kako uzimati tablete \u2014 jednu ujutro i jednu nave\u010der nakon jela.",vocab:[["osje\u0107am","I feel"],["temperatura","fever"],["boli me grlo","throat hurts"],["lije\u010dnik","doctor"],["propisuje","prescribes"]],qs:[{q:"Symptoms?",o:["Headache","Fever and sore throat","Stomach"],c:1},{q:"Diagnosis?",o:["Cold","Angina","Flu"],c:1},{q:"Pills how?",o:["Two morning","One morning one evening","Three daily"],c:1}]}
  ]
};
// ═══ ALPHABET ═══
const ALPHA=[
  ["A a","ah","auto","car"],["B b","beh","baka","grandmother"],["C c","tseh","cvijet","flower"],
  ["Č č","cheh (hard)","čokolada","chocolate"],["Ć ć","cheh (soft)","kuća","house"],
  ["D d","deh","dan","day"],["Dž dž","jeh (hard)","džep","pocket"],["Đ đ","jeh (soft)","đak","student"],
  ["E e","eh","Europa","Europe"],["F f","ef","flaša","bottle"],["G g","geh","grad","city"],
  ["H h","hah","hladno","cold"],["I i","ee","ime","name"],["J j","yeh","jabuka","apple"],
  ["K k","kah","knjiga","book"],["L l","el","lijepo","beautiful"],["Lj lj","lyeh","ljubav","love"],
  ["M m","em","mama","mom"],["N n","en","nos","nose"],["Nj nj","nyeh","njuška","snout"],
  ["O o","oh","oko","eye"],["P p","peh","pas","dog"],["R r","err (rolled)","riba","fish"],
  ["S s","ess","sunce","sun"],["Š š","sheh","škola","school"],["T t","teh","tata","dad"],
  ["U u","oo","uho","ear"],["V v","veh","voda","water"],["Z z","zeh","zec","rabbit"],
  ["Ž ž","zheh","žaba","frog"]
];
// ═══ ZNAM - NE ZNAM (Translation Exercises) ═══
const ZNAM = {
  title: "Znam – ne znam!",
  sections: [
    { name: "Basics & Feelings", sentences: [
      {en:"What are you doing?",hr:"Što radiš?",alts:["Što radite?","Kako radiš?","Što radim?"]},
      {en:"How are you?",hr:"Kako si?",alts:["Kako ste?","Što si?","Kako ja?"]},
      {en:"Thank you!",hr:"Hvala!",alts:["Molim!","Oprosti!","Dobar dan!"]},
      {en:"I am sad.",hr:"Ja sam tužna.",alts:["Ja sam sretna.","Ja sam umorna.","Ja sam gladna."]},
      {en:"I am happy.",hr:"Ja sam sretna.",alts:["Ja sam tužna.","Ja sam umorna.","Ja sam gladna."]},
      {en:"I am hungry.",hr:"Ja sam gladna.",alts:["Ja sam žedna.","Ja sam umorna.","Ja sam sretna."]},
      {en:"This is a red apple.",hr:"Ovo je crvena jabuka.",alts:["Ovo je zelena jabuka.","To je crveni ananas.","Ovo je velika jabuka."]},
      {en:"Salad is healthy.",hr:"Salata je zdrava.",alts:["Jogurt je skup.","Jogurt je jeftin.","Jogurt je dobar."]},
      {en:"Banana is cheap.",hr:"Banana je jeftina.",alts:["Banana je skupa.","Banana je zdrava.","Banana je velika."]},
      {en:"I don't drink apple juice.",hr:"Ne pijem sok od jabuke.",alts:["Ja pijem sok od jabuke.","Ne jedem jabuku.","Ne volim sok."]}
    ]},
    { name: "Body, Food & Actions", sentences: [
      {en:"I am thirsty.",hr:"Ja sam žedna.",alts:["Ja sam gladna.","Ja sam umorna.","Ja sam sretna."]},
      {en:"I drink milk.",hr:"Pijem mlijeko.",alts:["Jedem mlijeko.","Volim mlijeko.","Imam mlijeko."]},
      {en:"She eats meat.",hr:"Ona jede meso.",alts:["Ona pije meso.","On jede meso.","Ona voli meso."]},
      {en:"Pizza is not breakfast!",hr:"Pizza nije doručak!",alts:["Pizza je doručak!","Pizza je skupa!","Pizza nije ručak!"]},
      {en:"My eyes are blue.",hr:"Moje oči su plave.",alts:["Moje oči su crne.","Moje oko je plavo.","Moji oči su plavi."]},
      {en:"I like to read.",hr:"Volim čitati.",alts:["Mogu čitati.","Moram čitati.","Čitam knjige."]},
      {en:"They read.",hr:"Oni čitaju.",alts:["Oni pišu.","Mi čitamo.","On čita."]},
      {en:"I don't eat meat.",hr:"Ne jedem meso.",alts:["Ja jedem meso.","Ne volim meso.","Ne pijem meso."]},
      {en:"Fish is swimming.",hr:"Riba pliva.",alts:["Riba leti.","Riba trči.","Riba spava."]},
      {en:"We are running.",hr:"Mi trčimo.",alts:["Mi hodamo.","Oni trče.","Vi trčite."]}
    ]},
    { name: "Animals & Nature", sentences: [
      {en:"Tiger is sleeping.",hr:"Tigar spava.",alts:["Tigar trči.","Tigar jede.","Lav spava."]},
      {en:"Brown bear eats honey.",hr:"Smeđi medvjed jede med.",alts:["Bijeli medvjed jede med.","Smeđi medvjed pije med.","Smeđi medvjed voli med."]},
      {en:"Zebra is black and white.",hr:"Zebra je crna i bijela.",alts:["Zebra je smeđa i bijela.","Zebra je crna i siva.","Zebra je velika i mala."]},
      {en:"Elephant is drinking water.",hr:"Slon pije vodu.",alts:["Slon jede vodu.","Slon pije mlijeko.","Slon voli vodu."]},
      {en:"Cat is not flying.",hr:"Mačka ne leti.",alts:["Mačka leti.","Mačka ne trči.","Ptica ne leti."]},
      {en:"Bird is flying.",hr:"Ptica leti.",alts:["Ptica pliva.","Ptice lete.","Ptica trči."]},
      {en:"Birds are flying.",hr:"Ptice lete.",alts:["Ptica leti.","Ptice pjevaju.","Ptice trče."]},
      {en:"A small mouse is eating cheese.",hr:"Mali miš jede sir.",alts:["Veliki miš jede sir.","Mali miš voli sir.","Mali miš pije sir."]},
      {en:"Sea is blue.",hr:"More je plavo.",alts:["More je zeleno.","More je veliko.","Nebo je plavo."]},
      {en:"Sky is blue.",hr:"Nebo je plavo.",alts:["More je plavo.","Nebo je sivo.","Nebo je bijelo."]}
    ]},
    { name: "Home & Daily Life", sentences: [
      {en:"The house has doors.",hr:"Kuća ima vrata.",alts:["Kuća nema vrata.","Kuća ima prozore.","Kuća je velika."]},
      {en:"My window is small.",hr:"Moj prozor je mali.",alts:["Moj prozor je veliki.","Moja prozor je mala.","Moj prozor je nov."]},
      {en:"I love to sleep.",hr:"Volim spavati.",alts:["Moram spavati.","Mogu spavati.","Trebam spavati."]},
      {en:"My dog is sad.",hr:"Moj pas je tužan.",alts:["Moj pas je sretan.","Moj pas je gladan.","Moja mačka je tužna."]},
      {en:"Birds are singing.",hr:"Ptice pjevaju.",alts:["Ptica pjeva.","Ptice lete.","Ptice trče."]},
      {en:"I am reading.",hr:"Ja čitam.",alts:["Ja pišem.","Ja učim.","Ja pjevam."]},
      {en:"I want ice cream.",hr:"Želim sladoled.",alts:["Trebam sladoled.","Imam sladoled.","Volim sladoled."]},
      {en:"I need coffee.",hr:"Trebam kavu.",alts:["Želim kavu.","Pijem kavu.","Volim kavu."]},
      {en:"I must drink water.",hr:"Moram piti vodu.",alts:["Želim piti vodu.","Trebam piti vodu.","Volim piti vodu."]},
      {en:"My bed is expensive.",hr:"Moj krevet je skup.",alts:["Moj krevet je jeftin.","Moj krevet je nov.","Moj stol je skup."]}
    ]}
  ]
};
// ═══ COLORS & GENDER AGREEMENT ═══
const BOJE = {
  title: "Boje i Rod — Colors & Gender",
  intro: "Croatian color adjectives change endings to match the noun's gender: Feminine (-a), Neuter (-o), Masculine (no ending).",
  colors: [
    {base:"crven",en:"red",hex:"#dc2626",f:"crvena",n:"crveno",m:"crven",fp:"crvene",np:"crvena",mp:"crveni"},
    {base:"žut",en:"yellow",hex:"#eab308",f:"žuta",n:"žuto",m:"žut",fp:"žute",np:"žuta",mp:"žuti"},
    {base:"plav",en:"blue",hex:"#2563eb",f:"plava",n:"plavo",m:"plav",fp:"plave",np:"plava",mp:"plavi"},
    {base:"zelen",en:"green",hex:"#16a34a",f:"zelena",n:"zeleno",m:"zelen",fp:"zelene",np:"zelena",mp:"zeleni"},
    {base:"crn",en:"black",hex:"#1c1917",f:"crna",n:"crno",m:"crn",fp:"crne",np:"crna",mp:"crni"},
    {base:"bijel",en:"white",hex:"#d6d3d1",f:"bijela",n:"bijelo",m:"bijel",fp:"bijele",np:"bijela",mp:"bijeli"},
    {base:"smeđ",en:"brown",hex:"#92400e",f:"smeđa",n:"smeđe",m:"smeđ",fp:"smeđe",np:"smeđa",mp:"smeđi"},
    {base:"siv",en:"grey",hex:"#78716c",f:"siva",n:"sivo",m:"siv",fp:"sive",np:"siva",mp:"sivi"},
    {base:"narančast",en:"orange",hex:"#ea580c",f:"narančasta",n:"narančasto",m:"narančast",fp:"narančaste",np:"narančasta",mp:"narančasti"},
    {base:"ružičast",en:"pink",hex:"#ec4899",f:"ružičasta",n:"ružičasto",m:"ružičast",fp:"ružičaste",np:"ružičasta",mp:"ružičasti"}
  ],
  quiz: [
    {noun:"Ruža",answer:"crvena",g:"f",en:"The rose is red."},
    {noun:"Žaba",answer:"zelena",g:"f",en:"The frog is green."},
    {noun:"Mačka",answer:"crna",g:"f",en:"The cat is black."},
    {noun:"Kava",answer:"smeđa",g:"f",en:"The coffee is brown."},
    {noun:"Sunce",answer:"žuto",g:"n",en:"The sun is yellow."},
    {noun:"More",answer:"plavo",g:"n",en:"The sea is blue."},
    {noun:"Nebo",answer:"plavo",g:"n",en:"The sky is blue."},
    {noun:"Grad",answer:"siv",g:"m",en:"The city is grey."},
    {noun:"Cvijet",answer:"crven",g:"m",en:"The flower is red."},
    {noun:"Sat",answer:"crn",g:"m",en:"The watch is black."},
    {noun:"Knjige",answer:"crvene",g:"fp",en:"The books are red."},
    {noun:"Gradovi",answer:"sivi",g:"mp",en:"The cities are grey."},
    {noun:"Sunca",answer:"žuta",g:"np",en:"The suns are yellow."},
    {noun:"Haljina",answer:"ružičasta",g:"f",en:"The dress is pink."},
    {noun:"Auto",answer:"crn",g:"m",en:"The car is black."}
  ]
};
// ═══ VERB CONJUGATION DRILLS ═══
const CONJ = {
  verbs: [
    {inf:"\u010ditati",en:"to read",tense:"present",forms:["\u010ditam","\u010dita\u0161","\u010dita","\u010ditamo","\u010ditate","\u010ditaju"]},
    {inf:"pisati",en:"to write",tense:"present",forms:["pi\u0161em","pi\u0161e\u0161","pi\u0161e","pi\u0161emo","pi\u0161ete","pi\u0161u"]},
    {inf:"govoriti",en:"to speak",tense:"present",forms:["govorim","govori\u0161","govori","govorimo","govorite","govore"]},
    {inf:"raditi",en:"to work",tense:"present",forms:["radim","radi\u0161","radi","radimo","radite","rade"]},
    {inf:"u\u010diti",en:"to learn",tense:"present",forms:["u\u010dim","u\u010di\u0161","u\u010di","u\u010dimo","u\u010dite","u\u010de"]},
    {inf:"voljeti",en:"to love",tense:"present",forms:["volim","voli\u0161","voli","volimo","volite","vole"]},
    {inf:"kuhati",en:"to cook",tense:"present",forms:["kuham","kuha\u0161","kuha","kuhamo","kuhate","kuhaju"]},
    {inf:"plivati",en:"to swim",tense:"present",forms:["plivam","pliva\u0161","pliva","plivamo","plivate","plivaju"]},
    {inf:"spavati",en:"to sleep",tense:"present",forms:["spavam","spava\u0161","spava","spavamo","spavate","spavaju"]},
    {inf:"i\u0107i",en:"to go",tense:"present",forms:["idem","ide\u0161","ide","idemo","idete","idu"]},
    {inf:"jesti",en:"to eat",tense:"present",forms:["jedem","jede\u0161","jede","jedemo","jedete","jedu"]},
    {inf:"piti",en:"to drink",tense:"present",forms:["pijem","pije\u0161","pije","pijemo","pijete","piju"]},
    {inf:"imati",en:"to have",tense:"present",forms:["imam","ima\u0161","ima","imamo","imate","imaju"]},
    {inf:"znati",en:"to know",tense:"present",forms:["znam","zna\u0161","zna","znamo","znate","znaju"]},
    {inf:"kupiti",en:"to buy",tense:"present",forms:["kupim","kupi\u0161","kupi","kupimo","kupite","kupe"]},
    {inf:"\u010ditati",en:"to read",tense:"past",forms:["\u010ditao sam","\u010ditao si","\u010ditao je","\u010ditali smo","\u010ditali ste","\u010ditali su"]},
    {inf:"govoriti",en:"to speak",tense:"past",forms:["govorio sam","govorio si","govorio je","govorili smo","govorili ste","govorili su"]},
    {inf:"i\u0107i",en:"to go",tense:"past",forms:["i\u0161ao sam","i\u0161ao si","i\u0161ao je","i\u0161li smo","i\u0161li ste","i\u0161li su"]},
    {inf:"\u010ditati",en:"to read",tense:"future",forms:["\u010ditat \u0107u","\u010ditat \u0107e\u0161","\u010ditat \u0107e","\u010ditat \u0107emo","\u010ditat \u0107ete","\u010ditat \u0107e"]},
    {inf:"govoriti",en:"to speak",tense:"future",forms:["govorit \u0107u","govorit \u0107e\u0161","govorit \u0107e","govorit \u0107emo","govorit \u0107ete","govorit \u0107e"]},
    {inf:"i\u0107i",en:"to go",tense:"future",forms:["i\u0107i \u0107u","i\u0107i \u0107e\u0161","i\u0107i \u0107e","i\u0107i \u0107emo","i\u0107i \u0107ete","i\u0107i \u0107e"]}
  ],
  persons: ["ja","ti","on/ona","mi","vi","oni/one"]
};
// ═══ SPACED REPETITION ═══
function getSR(){try{return JSON.parse(localStorage.getItem("uSR")||"{}")}catch{return{}}}
function saveSR(d){localStorage.setItem("uSR",JSON.stringify(d))}
function srMark(word,correct){const d=getSR();if(!d[word])d[word]={r:0,w:0,b:0};if(correct){d[word].r++;d[word].b=Math.min(d[word].b+1,5)}else{d[word].w++;d[word].b=Math.max(d[word].b-2,0)}d[word].t=Date.now();saveSR(d)}
// ═══ HRT & CROATIAN MEDIA ═══
const MEDIA = [
  // ─── TV & NEWS ───────────────────────────────────────────────────────────────
  {name:"HRT 1 — Live TV",desc:"Main national channel • sign in to HRTI to watch • some live content has broadcast restrictions",web:"https://hrti.hrt.hr/home",icon:"📺",color:"#0e7490",cat:"tv",level:"B1",video:true,tip:"Watch the Dnevnik (news at 19:30) daily. Same stories as what you read online — hearing the words cements vocabulary fast."},
  {name:"HRT 2 — Kultura & Sport",desc:"Arts, documentaries, sports coverage • sign in to HRTI to watch",web:"https://hrti.hrt.hr/home",icon:"📺",color:"#0284c7",cat:"tv",level:"B2",video:true,tip:"HRT 2 airs cultural programs and in-depth debates. Great for hearing formal, careful Croatian."},
  {name:"HRT 3 — Documentaries",desc:"Education, nature & travel docs • sign in to HRTI to watch",web:"https://hrti.hrt.hr/home",icon:"🎓",color:"#0369a1",cat:"tv",level:"B1",video:true,tip:"Documentary narration is slow, clear and well-pronounced. Perfect for intermediate learners."},
  {name:"HRT Vijesti — News 24/7",desc:"Rolling news — headlines every hour",web:"https://vijesti.hrt.hr/",icon:"📰",color:"#164e63",cat:"tv",level:"B1",tip:"Bookmark this and read one article every morning. News Croatian is formal and consistent — ideal for building B1→B2 vocabulary."},
  {name:"Dnevnik.hr",desc:"Daily Croatian news portal",web:"https://dnevnik.hr/",icon:"📰",color:"#b91c1c",cat:"tv",level:"A2",tip:"Short, punchy headlines use everyday vocabulary. Great for A2 learners — scan headlines first, then read one full article."},
  {name:"24sata",desc:"Most-read Croatian portal • casual language",web:"https://www.24sata.hr/",icon:"📰",color:"#dc2626",cat:"tv",level:"A2",tip:"24sata uses colloquial, everyday Croatian — very close to how people actually speak. Start here if you feel newspapers are too hard."},
  {name:"Jutarnji list",desc:"Quality morning newspaper",web:"https://www.jutarnji.hr/",icon:"📰",color:"#1e40af",cat:"tv",level:"C1",tip:"Jutarnji opinion pieces use sophisticated sentence structures. Aim for this at C1 level when you want to read native-level journalism."},
  {name:"Večernji list",desc:"Evening newspaper — balanced coverage",web:"https://www.vecernji.hr/",icon:"📰",color:"#7c3aed",cat:"tv",level:"B2",tip:"Večernji has good local and regional stories. Reading it alongside HRT news gives you broader exposure to written Croatian styles."},
  {name:"Index.hr",desc:"Independent news & opinion portal",web:"https://www.index.hr/",icon:"📰",color:"#ea580c",cat:"tv",level:"B2",tip:"Index.hr features debate and commentary — you'll encounter argumentation structures and rhetorical vocabulary here."},
  {name:"Glas Hrvatske",desc:"Voice of Croatia • English-Croatian bilingual",web:"https://glashrvatske.hrt.hr/en/",icon:"🌍",color:"#1d4ed8",cat:"tv",level:"A1",tip:"Perfect for absolute beginners. Read the English version of a story, then the Croatian one side-by-side. Builds confidence fast."},
  // ─── MUSIC & RADIO ───────────────────────────────────────────────────────────
  {name:"HRT Radio 1",desc:"Croatian public radio — news, talk, music",web:"https://radio.hrt.hr",stream:"/radio?s=hrt1",icon:"📻",color:"#0e7490",cat:"music",level:"B1",live:true,tip:"Leave HRT Radio 1 playing in the background while you cook or drive. Passive listening is powerful — your brain absorbs rhythm and pronunciation."},
  {name:"HRT Radio 2 — Classic",desc:"Classical music & cultural programs",web:"https://radio.hrt.hr",stream:"/radio?s=hrt2",icon:"🎵",color:"#6d28d9",cat:"music",level:"B2",live:true,tip:"Cultural programs feature thoughtful, slow speech from educated speakers. Great for training your ear on formal Croatian."},
  {name:"CMC TV",desc:"Croatian Music Channel • pop, folk, turbofolk",web:"https://cmc.com.hr/program/cmc-tv-stream/",icon:"🎶",color:"#7c3aed",cat:"music",level:"A1",live:true,tip:"Music is the best passive learning tool. Even at A1, exposure to Croatian song structures trains your ear for rhythm, stress and melody."},
  {name:"CMC Radio Live",desc:"24/7 Croatian hits • all genres",web:"https://radio.cmc.com.hr",stream:"/radio?s=cmc",icon:"🎧",color:"#9333ea",cat:"music",level:"A1",live:true,tip:"Pop songs repeat the same phrases dozens of times — this is vocabulary acquisition without effort. Pick one song and look up the lyrics."},
  {name:"Thompson",desc:"Patriotic Croatian rock • Marin Čavić",web:"https://www.youtube.com/results?search_query=thompson+croatian+band+lyrics",icon:"🇭🇷",color:"#b91c1c",cat:"music",level:"A2",tip:"Thompson's lyrics tell Croatian stories with deep cultural meaning. Look up 'Geni Jadranskog mora' or 'Lijepa li si' for beautiful vocabulary."},
  {name:"Oliver Dragojević",desc:"Legendary Dalmatian singer • timeless classics",web:"https://www.youtube.com/results?search_query=Oliver+Dragojevic+best+songs+lyrics",icon:"🎤",color:"#0369a1",cat:"music",level:"A2",tip:"Oliver sang in both standard Croatian and Dalmatian dialect. His music is Croatia's soul — the lyrics are poetry-level vocabulary."},
  {name:"Gibonni",desc:"Modern Dalmatian pop & rock",web:"https://www.youtube.com/results?search_query=Gibonni+best+songs+Croatian+lyrics",icon:"🎸",color:"#059669",cat:"music",level:"B1",tip:"Gibonni's lyrics use beautiful metaphors and intermediate vocabulary. Find a song you love and dissect every line."},
  {name:"Hrvatska Glazba Mix",desc:"Wide Croatian music mix on YouTube",web:"https://www.youtube.com/results?search_query=hrvatska+glazba+mix+2024+narodna",icon:"🎵",color:"#db2777",cat:"music",level:"A1",tip:"Expose yourself to a broad range of styles — folk, pop, dalmatian, slavonian. Each region has its own musical vocabulary."},
  // ─── FILM & SERIES ───────────────────────────────────────────────────────────
  {name:"Croatian Films (Free)",desc:"250+ award-winning shorts • English subtitles available",web:"https://www.croatian.film/en/films",icon:"🎬",color:"#b91c1c",cat:"film",level:"B1",tip:"Start with short films (5-15 min). Watch once with English subs for story, then again with Croatian subs for language. Brilliant free resource."},
  {name:"Hrvatski Filmovi",desc:"Full Croatian feature films on YouTube",web:"https://www.youtube.com/results?search_query=hrvatski+film+s+prijevodom+cijeli+film",icon:"🎥",color:"#dc2626",cat:"film",level:"B2",tip:"Feature films expose you to natural conversation, regional dialects and slang. At B2, try watching the first 10 min without subtitles."},
  {name:"Što je Hrvatska?",desc:"Discover Croatia — travel & culture series",web:"https://www.youtube.com/results?search_query=sto+je+hrvatska+dokumentarac+hrt",icon:"🏔️",color:"#0e7490",cat:"film",level:"A2",tip:"Travel documentaries use visual context to help you understand without every word. Ideal bridge from A2 to B1 listening comprehension."},
  {name:"Kvart Priča",desc:"Zagreb neighborhoods — documentary series",web:"https://www.youtube.com/results?search_query=kvart+prica+zagreb+dokumentarac",icon:"🏙️",color:"#7c3aed",cat:"film",level:"B1",tip:"Real people talking about their neighborhoods in natural, unscripted Croatian. This is authentic speech — invaluable at B1+."},
  {name:"Easy Croatian",desc:"Street interviews with subtitles • YouTube",web:"https://www.youtube.com/results?search_query=easy+croatian+street+interviews+subtitles",icon:"🎙️",color:"#16a34a",cat:"film",level:"A2",tip:"Short street interviews (5-10 min) with full Croatian and English subtitles. You hear real people, not actors. Start here for authentic speech."},
  {name:"Croatian Learning — YouTube",desc:"Croatian language tutorials & lessons",web:"https://www.youtube.com/results?search_query=learn+croatian+language+lessons+youtube",icon:"📚",color:"#0284c7",cat:"film",level:"A1",tip:"Structured video lessons reinforce what you learn in the app. Use YouTube to see grammar explained visually when a concept isn't clicking."},
  // ─── SPORT ───────────────────────────────────────────────────────────────────
  {name:"HNL & Vatreni",desc:"Football: standings, clubs, national team vocab",web:"",icon:"⚽",color:"#003da5",cat:"sport",level:"A2",scr:"football",tip:"Sport commentary is fast but repetitive — you'll quickly absorb 'zabiti gol', 'žuti karton', 'napad', 'obrana'. Croatian sports vocabulary is great fun."},
  {name:"HNK Dinamo Zagreb",desc:"Most successful Croatian club",web:"https://www.nk-dinamo.hr/",icon:"💙",color:"#003da5",cat:"sport",level:"B1",tip:"Club websites are written in natural sports Croatian. Follow a club's news section to absorb vocabulary in context you care about."},
  {name:"HNK Hajduk Split",desc:"The people's club of Dalmatia",web:"https://hajduk.hr/",icon:"⚽",color:"#dc2626",cat:"sport",level:"B1",tip:"Hajduk's passionate fan culture uses rich Dalmatian idioms online. Their social media is a window into how Dalmatians actually speak and write."},
  {name:"Croatian Basketball",desc:"HKS, ABA Liga, Premijer Liga",web:"https://www.hks-cbf.hr/",icon:"🏀",color:"#f97316",cat:"sport",level:"B1",tip:"Basketball terms are often international (koš, asistencija, trojka) making them easy entry points. Follow a player you know — Jokić plays against Croatian players regularly."},
  {name:"Basketball Legends",desc:"Dražen, Kukoč, Rađa, Bogdanović",web:"https://www.youtube.com/results?search_query=croatian+basketball+legends+dražen+petrovic+kukoc+highlights",icon:"🏆",color:"#ea580c",cat:"sport",level:"A2",tip:"Watch highlights with Croatian commentary on YouTube. The emotional language around legends like Dražen Petrović teaches you exactly how Croatians express pride and passion."},
  {name:"ABA Liga Highlights",desc:"Official match highlights & video clips",web:"https://www.aba-liga.com/newslist/videos/1/",icon:"🏀",color:"#0e7490",cat:"sport",level:"B1",video:true,tip:"Watch the highlights with Croatian commentary — fast, repetitive basketball language is perfect for absorbing sports vocabulary in context."},
  {name:"Croatians in U.S. College Basketball",desc:"Croatian-born players on NCAA & NAIA rosters right now — D1 through NAIA, with bios & stats",scr:"croatiaathletes",icon:"🇭🇷",color:"#003da5",cat:"sport",level:"A1",tip:"Follow these players to stay connected to Croatian basketball culture while learning — their school websites and ESPN pages are full of Croatian-language content opportunities."},
  // ─── PODCASTS & LEARNING ─────────────────────────────────────────────────────
  {name:"Slow Croatian Podcast",desc:"Slow, clear Croatian speech for learners",web:"https://www.youtube.com/results?search_query=slow+croatian+podcast+for+learners",icon:"🎙️",color:"#16a34a",cat:"podcast",level:"A2",tip:"Podcasts recorded slowly for learners are gold. Even 10 minutes a day builds listening stamina dramatically over weeks."},
  {name:"HRT Podcast Arhiva",desc:"Croatian radio podcasts on demand",web:"https://radio.hrt.hr",icon:"🎧",color:"#0e7490",cat:"podcast",level:"B2",tip:"HRT podcasts cover everything from history to cooking. Find a topic you love and listen to it — motivation sustains learning better than discipline."},
  {name:"Priče Za Laku Noć",desc:"Croatian bedtime stories — YouTube",web:"https://www.youtube.com/results?search_query=price+za+laku+noc+hrvatska",icon:"🌙",color:"#7c3aed",cat:"podcast",level:"A1",tip:"Children's bedtime stories use simple, clear vocabulary read at perfect speed for beginners. Listening before sleep is proven to boost retention."},
  {name:"Croatian History Podcast",desc:"Croatian history in podcast format",web:"https://www.youtube.com/results?search_query=hrvatska+povijest+podcast",icon:"🏛️",color:"#b45309",cat:"podcast",level:"B2",tip:"History podcasts use past tense extensively — the perfect practice ground for Croatian perfective/imperfective past tense in natural context."},
  {name:"Jezik i Komunikacija",desc:"Croatian language tips & explanations",web:"https://www.youtube.com/results?search_query=hrvatska+gramatika+objasnjenje+youtube",icon:"💬",color:"#0369a1",cat:"podcast",level:"B1",tip:"Watch native speakers explain Croatian grammar in Croatian. At B1+ this is incredibly useful — you learn the language through the language itself."},
  // ─── CULTURE ─────────────────────────────────────────────────────────────────
  {name:"Pop Culture & Music",desc:"Croatian pop culture, music scene & trends",web:"",icon:"🎵",color:"#7c3aed",cat:"culture",level:"B1",scr:"popculture",tip:"Understanding pop culture is the gateway to feeling at home in the language. Croatian memes, slang, and celebrity culture all reinforce casual registers."},
  {name:"Gloria.hr",desc:"Croatia's #1 lifestyle & celebrity magazine",web:"https://www.gloria.hr/",icon:"💅",color:"#ec4899",cat:"culture",level:"B1",tip:"Celebrity and lifestyle articles use colloquial vocabulary and informal sentence structures. Reading magazines makes your Croatian sound human, not textbook."},
  {name:"Slobodna Dalmacija",desc:"Dalmatian newspaper since 1943",web:"https://slobodnadalmacija.hr/",icon:"🌊",color:"#0284c7",cat:"culture",level:"B2",tip:"Regional newspapers expose you to Dalmatian vocabulary and concerns. Understanding regional variation is key to C1+ comprehension."},
  {name:"Tportal.hr",desc:"Technology & lifestyle portal",web:"https://www.tportal.hr/",icon:"💻",color:"#0369a1",cat:"culture",level:"B1",tip:"Tech articles introduce international vocabulary that you may already know in English — easier to learn Croatian terms when you already know the concept."},
];
// ═══ CROATIAN CASES (PADE\u017dI) ═══
const PADEZI = {
  title: "Pade\u017ei \u2014 Croatian Cases",
  cases: [
    {name:"Nominativ",q:"Tko? \u0160to?",en:"Nominative (who/what)",use:"Subject of sentence",exs:["Ana radi.","Pas spava.","Ku\u0107a je velika."],tip:"Dictionary form. The \u2018doer\u2019 of the action."},
    {name:"Genitiv",q:"Koga? \u010cega?",en:"Genitive (of whom/what)",use:"Possession, origin, after prepositions (iz, od, do, bez, kod)",exs:["Knjiga je od Ivana.","Dolazim iz Zagreba.","\u010ca\u0161a vode."],tip:"Fem: -a\u2192-e. Masc: add -a. Prepositions: iz, od, do, bez, kod, blizu, ispod, iznad."},
    {name:"Dativ",q:"Komu? \u010cemu?",en:"Dative (to whom/what)",use:"Indirect object, giving/selling to someone",exs:["Dajem knjigu Ani.","Ivan daje kavu prijatelju.","Idem prema trgovini."],tip:"Fem: -a\u2192-i. Masc: add -u. The \u2018receiver\u2019 case. Same endings as lokativ!"},
    {name:"Akuzativ",q:"Koga? \u0160to? (vidim)",en:"Accusative (whom/what)",use:"Direct object of sentence",exs:["Vidim ku\u0107u.","\u010citam knjigu.","Volim Hrvatsku."],tip:"Fem: -a\u2192-u. Masc animate: add -a. Masc inanimate: no change."},
    {name:"Vokativ",q:"Hej!",en:"Vocative (addressing)",use:"Calling someone directly, always with comma",exs:["Ivane, do\u0111i!","Ana, pazi!","Profesore, hvala!"],tip:"Masc: -e/-u. Fem: -o/-a stays. Used less and less in modern Croatian."},
    {name:"Lokativ",q:"Gdje? O \u010demu?",en:"Locative (where/about what)",use:"Location, after prepositions u, na, o, po",exs:["\u017divim u Zagrebu.","Auto je u gara\u017ei.","Pri\u010dam o filmu."],tip:"Same endings as dativ! Always has a preposition before it (u, na, o, po, pri)."},
    {name:"Instrumental",q:"S kim? \u010cime?",en:"Instrumental (with whom/what)",use:"Companionship, tool/means used",exs:["Idem s prijateljem.","Pi\u0161em olovkom.","Jedem vilicom."],tip:"Fem: -om. Masc: -om. Living beings use \u2018s/sa\u2019 preposition, objects don\u2019t."}
  ],
  quiz: [
    {q:"Ana radi. \u2014 Which case is \u2018Ana\u2019?",a:"Nominativ",al:["Genitiv","Akuzativ","Dativ"]},
    {q:"Vidim ku\u0107u. \u2014 \u2018ku\u0107u\u2019 is:",a:"Akuzativ",al:["Nominativ","Genitiv","Lokativ"]},
    {q:"Dajem kavu Ivanu. \u2014 \u2018Ivanu\u2019 is:",a:"Dativ",al:["Akuzativ","Genitiv","Lokativ"]},
    {q:"Dolazim iz Zagreba. \u2014 \u2018Zagreba\u2019 is:",a:"Genitiv",al:["Nominativ","Lokativ","Instrumental"]},
    {q:"\u017divim u Zagrebu. \u2014 \u2018Zagrebu\u2019 is:",a:"Lokativ",al:["Genitiv","Dativ","Nominativ"]},
    {q:"Idem s prijateljem. \u2014 \u2018prijateljem\u2019 is:",a:"Instrumental",al:["Dativ","Lokativ","Akuzativ"]},
    {q:"Ivane, do\u0111i! \u2014 \u2018Ivane\u2019 is:",a:"Vokativ",al:["Nominativ","Dativ","Akuzativ"]},
    {q:"Knjiga je od Ivana. \u2014 \u2018Ivana\u2019 is:",a:"Genitiv",al:["Dativ","Akuzativ","Lokativ"]},
    {q:"Pi\u0161em olovkom. \u2014 \u2018olovkom\u2019 is:",a:"Instrumental",al:["Akuzativ","Genitiv","Lokativ"]},
    {q:"Feminine -a becomes -u in which case?",a:"Akuzativ",al:["Genitiv","Dativ","Instrumental"]},
    {q:"Which two cases share the same endings?",a:"Dativ and Lokativ",al:["Nominativ and Akuzativ","Genitiv and Instrumental","Vokativ and Lokativ"]},
    {q:"Which case always needs a preposition?",a:"Lokativ",al:["Genitiv","Dativ","Akuzativ"]},
    {q:"Pri\u010dam o filmu. \u2014 \u2018filmu\u2019 is:",a:"Lokativ",al:["Dativ","Genitiv","Instrumental"]},
    {q:"\u010citam knjigu. \u2014 \u2018knjigu\u2019 is:",a:"Akuzativ",al:["Nominativ","Genitiv","Dativ"]},
    {q:"Which case is for the \u2018receiver\u2019?",a:"Dativ",al:["Akuzativ","Genitiv","Nominativ"]}
  ]
};
// ═══ WORD ORDER & UNJUMBLE ═══
const UNJUMBLE = [
  {words:["Ja","volim","Hrvatsku"],correct:"Ja volim Hrvatsku.",en:"I love Croatia."},
  {words:["Ana","\u010dita","knjigu"],correct:"Ana \u010dita knjigu.",en:"Ana is reading a book."},
  {words:["Mi","idemo","u","\u0161kolu"],correct:"Mi idemo u \u0161kolu.",en:"We are going to school."},
  {words:["Ivan","daje","kavu","Ani"],correct:"Ivan daje kavu Ani.",en:"Ivan gives coffee to Ana."},
  {words:["Gdje","je","bolnica"],correct:"Gdje je bolnica?",en:"Where is the hospital?"},
  {words:["Oni","su","iz","Hrvatske"],correct:"Oni su iz Hrvatske.",en:"They are from Croatia."},
  {words:["Djeca","se","igraju","u","parku"],correct:"Djeca se igraju u parku.",en:"Children are playing in the park."},
  {words:["Ja","\u0107u","putovati","u","Dubrovnik"],correct:"Ja \u0107u putovati u Dubrovnik.",en:"I will travel to Dubrovnik."},
  {words:["On","je","govorio","s","prijateljem"],correct:"On je govorio s prijateljem.",en:"He was talking with a friend."},
  {words:["Mo\u017ee\u0161","li","mi","pomo\u0107i"],correct:"Mo\u017ee\u0161 li mi pomo\u0107i?",en:"Can you help me?"},
  {words:["Mama","kuha","ru\u010dak","u","kuhinji"],correct:"Mama kuha ru\u010dak u kuhinji.",en:"Mom is cooking lunch in the kitchen."},
  {words:["Kako","se","zove\u0161"],correct:"Kako se zove\u0161?",en:"What is your name?"},
  {words:["Lije\u010dnik","je","propisao","lijek"],correct:"Lije\u010dnik je propisao lijek.",en:"The doctor prescribed medicine."},
  {words:["Sutra","\u0107emo","i\u0107i","na","pla\u017eu"],correct:"Sutra \u0107emo i\u0107i na pla\u017eu.",en:"Tomorrow we will go to the beach."},
  {words:["Hrvatska","je","lijepa","zemlja"],correct:"Hrvatska je lijepa zemlja.",en:"Croatia is a beautiful country."}
];
// ═══ CROATIAN IDIOMS & SLANG ═══
const IDIOMS = [
  {hr:"Nema frke",en:"No worries",lit:"There is no worry",ctx:"Casual reassurance among friends"},
  {hr:"Ful je dobro",en:"It\u0027s really good",lit:"Full is good",ctx:"Youth slang, very common"},
  {hr:"Ba\u0161 me briga",en:"I don\u0027t care",lit:"Exactly me care",ctx:"Common dismissive expression"},
  {hr:"Pada ki\u0161a kao iz kabla",en:"It\u0027s pouring rain",lit:"Rain falls like from a bucket",ctx:"Describing heavy rain"},
  {hr:"Idi mi-do\u0111i mi",en:"So-so / wishy-washy",lit:"Go me-come me",ctx:"Something inconsistent"},
  {hr:"Lagati kao pas",en:"To lie through your teeth",lit:"To lie like a dog",ctx:"Someone who lies a lot"},
  {hr:"Pun kao brod",en:"Stuffed / very full",lit:"Full like a ship",ctx:"After eating too much"},
  {hr:"Hladan kao led",en:"Ice cold / very cold person",lit:"Cold as ice",ctx:"Unfriendly person or cold weather"},
  {hr:"Imati putra na glavi",en:"To have a guilty conscience",lit:"To have butter on your head",ctx:"Someone hiding guilt"},
  {hr:"Biti u banani",en:"To be broke",lit:"To be in banana",ctx:"Having no money, slang"},
  {hr:"Nemoj me zezati",en:"Don\u0027t mess with me / You\u0027re kidding",lit:"Don\u0027t tease me",ctx:"Disbelief or warning"},
  {hr:"Raditi kao konj",en:"To work very hard",lit:"To work like a horse",ctx:"Someone who works hard"},
  {hr:"Imati debelu ko\u017eu",en:"To be thick-skinned",lit:"To have thick skin",ctx:"Not easily offended"},
  {hr:"Daj ne seri",en:"Come on, stop it",lit:"Don\u0027t [expletive]",ctx:"Very informal, disbelief"},
  {hr:"Sve pet",en:"Everything\u0027s fine",lit:"All five",ctx:"Like giving a high five \u2014 all good"}
];
// ═══ PREPOSITIONS WITH CASES ═══
const PREPS = [
  {prep:"u",cases:["Lokativ","Akuzativ"],ex:["\u017divim u Zagrebu. (Lok)","Idem u Zagreb. (Akuz)"],en:"in / into"},
  {prep:"na",cases:["Lokativ","Akuzativ"],ex:["Sjedim na stolici. (Lok)","Idem na pla\u017eu. (Akuz)"],en:"on / onto"},
  {prep:"iz",cases:["Genitiv"],ex:["Dolazim iz Splita."],en:"from / out of"},
  {prep:"od",cases:["Genitiv"],ex:["Knjiga od brata."],en:"from / of"},
  {prep:"do",cases:["Genitiv"],ex:["Idemo do \u0161kole."],en:"to / until"},
  {prep:"bez",cases:["Genitiv"],ex:["Kava bez mlijeka."],en:"without"},
  {prep:"kod",cases:["Genitiv"],ex:["Idem kod lije\u010dnika."],en:"at / to (someone\u0027s place)"},
  {prep:"s / sa",cases:["Instrumental"],ex:["Idem s mamom."],en:"with"},
  {prep:"prema",cases:["Dativ"],ex:["Idem prema centru."],en:"towards"},
  {prep:"o",cases:["Lokativ"],ex:["Pri\u010dam o filmu."],en:"about"},
  {prep:"ispod",cases:["Genitiv"],ex:["Ma\u010dka je ispod stola."],en:"under"},
  {prep:"iznad",cases:["Genitiv"],ex:["Lampa je iznad stola."],en:"above"},
  {prep:"ispred",cases:["Genitiv"],ex:["Auto je ispred ku\u0107e."],en:"in front of"},
  {prep:"iza",cases:["Genitiv"],ex:["Vrt je iza ku\u0107e."],en:"behind"},
  {prep:"oko",cases:["Genitiv"],ex:["Oko ku\u0107e je ograda."],en:"around"}
];
// ═══ CROATIAN KINGS & MEDIEVAL KINGDOM ═══
const KINGS = {
  title: "Hrvatski Kraljevi \u2014 Croatian Kings",
  subtitle: "The Sovereign Kingdom of Croatia (c. 625\u20131102)",
  intro: "Long before foreign powers ruled over Croatian lands, Croatia was a sovereign kingdom \u2014 one of the oldest in Europe. The Croatian people arrived in the Balkans in the early 7th century, established their own duchies, converted to Christianity, and built a powerful medieval state that lasted nearly five centuries. The Trpimirovi\u0107 dynasty produced kings who defended Croatian territory against Bulgarians, Byzantines, Hungarians, and Venetians. This is the story of the Croatian nation before anyone else claimed authority over it.",
  eras: [
    {title:"Arrival of the Croats (c. 625\u2013800)",emoji:"\u2693",text:"The Croats (Hrvati) migrated from their original homeland in White Croatia (around present-day southern Poland and western Ukraine) to the former Roman province of Dalmatia in the early 7th century. They established themselves along the Adriatic coast and inland, organizing into tribal communities led by chieftains. The Croats were among the first Slavic peoples to convert to Christianity, with baptism beginning under Frankish influence in the late 8th century. Their territory stretched from the Adriatic Sea inland through the Dinaric Alps into the Pannonian plain."},
    {title:"The Duchy Period (c. 800\u2013925)",emoji:"\ud83c\udff0",text:"Croatia first appears in written records as a duchy under Frankish overlordship. Duke Borna (c. 810\u2013821) was the first historically documented Croatian ruler, governing the Dalmatian duchy. His successors \u2014 Vladislav, Mislav, and then the great Trpimir I (c. 845\u2013864) \u2014 gradually expanded Croatian power and independence. Trpimir I founded the Trpimirovi\u0107 dynasty and issued the oldest known Croatian state document, the Charter of Duke Trpimir in 852, which first mentions the Croatian name in a royal document. Duke Branimir (879\u2013892) achieved a historic milestone when Pope John VIII formally recognized him as an independent ruler, effectively confirming Croatian sovereignty from both Frankish and Byzantine overlordship. Duke Muncimir continued building the state until his son would take it to its ultimate glory."},
    {title:"The Kingdom Established (925)",emoji:"\ud83d\udc51",text:"In approximately 925, Tomislav of the Trpimirovi\u0107 dynasty became the first King of Croatia. He united Dalmatian Croatia and Pannonian Croatia into a single kingdom. Pope John X addressed him as Rex Chroatorum \u2014 King of the Croats \u2014 making Croatia one of the earliest recognized Christian kingdoms in Europe. Under Tomislav, Croatia became a formidable military power with an army reportedly numbering up to 100,000 infantry, 60,000 cavalry, and a fleet of 180 warships. He defeated the Bulgarian Empire in the Battle of the Bosnian Highlands in 926 and successfully defended Croatia against Hungarian invasions. The kingdom stretched from the Drava River in the north to the Adriatic in the south, covering most of modern Croatia and much of Bosnia."},
    {title:"The Golden Age (1058\u20131089)",emoji:"\u2728",text:"After a period of internal dynastic struggles following Tomislav, the kingdom reached its absolute peak under two extraordinary kings. Petar Kre\u0161imir IV (1058\u20131074) consolidated the kingdom and brought the Dalmatian coastal cities under Croatian control for the first time, earning the title King of Croatia and Dalmatia. He is considered the greatest territorial expander of the Croatian kingdom. His successor, Dmitar Zvonimir (1075\u20131089), was crowned at the Church of St. Peter and Moses in Solin on October 8, 1076, with direct papal blessing from Pope Gregory VII. Zvonimir\u0027s reign was peaceful and prosperous. He strengthened ties with the Catholic Church, modernized Croatian noble titles to match Western European standards, and brought Croatia firmly into the European political mainstream. His reign is recorded on the Ba\u0161ka Tablet \u2014 one of the oldest surviving texts in the Croatian language."},
    {title:"The End of Independence (1089\u20131102)",emoji:"\ud83d\udd6f\ufe0f",text:"King Zvonimir died in 1089 without a male heir. His successor, Stjepan II, was the last king of the main Trpimirovi\u0107 line. Old and frail, Stjepan II died in 1091 after less than two years on the throne. A succession crisis followed. Petar Sva\u010di\u0107, likely a former ban (viceroy) under Zvonimir, was chosen as the last native Croatian king. He fought fiercely against the Hungarian King Koloman (Coloman), who claimed the Croatian throne through Zvonimir\u0027s wife Helena (a Hungarian princess). Petar Sva\u010di\u0107 fell in battle at Gvozd Mountain in 1097 \u2014 the last Croatian king to die defending Croatian independence. By 1102, the Croatian nobles entered into the Pacta Conventa with King Koloman, creating a personal union between Croatia and Hungary. Croatia kept its own parliament (Sabor), its own ban (viceroy), and its own laws, but would not have its own king again until the dream of independence was finally realized in the 20th century."}
  ],
  dukes: [
    {name:"Borna",years:"c. 810\u2013821",title:"Knez (Duke)",desc:"First historically documented Croatian ruler. Governed Dalmatian Croatia under Frankish overlordship. Fought against Ljudevit Posavski of Pannonian Croatia."},
    {name:"Vladislav",years:"c. 821\u2013835",title:"Knez",desc:"Borna\u0027s nephew and successor. Defeated Ljudevit and briefly united the Dalmatian and Pannonian duchies."},
    {name:"Mislav",years:"c. 835\u2013845",title:"Knez",desc:"Signed a peace treaty with Venice in 839, one of the earliest Croatian diplomatic agreements. Expanded the duchy\u0027s power."},
    {name:"Trpimir I",years:"c. 845\u2013864",title:"Knez",desc:"Founder of the Trpimirovi\u0107 dynasty. Issued the Charter of 852 \u2014 the oldest document using the Croatian name. Defeated the Bulgarian army. Built churches and monasteries. Father of the Croatian royal line."},
    {name:"Domagoj",years:"c. 864\u2013876",title:"Knez",desc:"Of the rival Domagojevi\u0107 dynasty. Known as the \u0027Worst Duke of the Slavs\u0027 by Italian chroniclers for his aggressive naval campaigns against Venetian shipping. A fierce defender of Croatian independence."},
    {name:"Branimir",years:"c. 879\u2013892",title:"Knez",desc:"Achieved papal recognition of Croatian independence from Pope John VIII in 879. This letter is considered one of the most important documents in Croatian history \u2014 international recognition of Croatian sovereignty."},
    {name:"Muncimir",years:"c. 892\u2013910",title:"Knez",desc:"Father of Tomislav. Continued building Croatian institutions and military power, preparing the ground for the kingdom."}
  ],
  kings: [
    {name:"Tomislav",years:"c. 910\u2013928",title:"Prvi Hrvatski Kralj \u2014 First Croatian King",desc:"United Dalmatian and Pannonian Croatia. Pope John X called him Rex Chroatorum (King of the Croats) in 925. Defeated the Bulgarians at the Battle of the Bosnian Highlands (926). Built a powerful military with reportedly 100,000 infantry and 180 warships. Defended Croatia against Hungarian invasions. His coronation marks the founding of the Croatian Kingdom.",emoji:"\ud83d\udc51",color:"#b45309"},
    {name:"Trpimir II",years:"c. 928\u2013935",title:"Kralj",desc:"Brother or son of Tomislav. Maintained the kingdom during a period of relative stability after Tomislav\u0027s military victories.",emoji:"\ud83d\udc51",color:"#0e7490"},
    {name:"Kre\u0161imir I",years:"c. 935\u2013945",title:"Kralj",desc:"Continued Trpimirovi\u0107 rule. His reign saw the continuation of Croatian sovereignty and territorial integrity.",emoji:"\ud83d\udc51",color:"#0e7490"},
    {name:"Miroslav",years:"c. 945\u2013949",title:"Kralj",desc:"His short reign ended when he was killed by Ban Pribina during a period of internal power struggles.",emoji:"\ud83d\udc51",color:"#0e7490"},
    {name:"Mihajlo Kre\u0161imir II",years:"c. 949\u2013969",title:"Kralj",desc:"Restored stability after the dynastic crisis. Married Jelena (Helen of Zadar), who became one of the most celebrated queens in Croatian history. Together they built churches and strengthened the kingdom.",emoji:"\ud83d\udc51",color:"#0e7490"},
    {name:"Stjepan Dr\u017eislav",years:"c. 969\u2013997",title:"Kralj",desc:"Received royal insignia from the Byzantine Emperor, confirming Croatian royal authority. First Croatian king to use the title \u0027King of Croatia and Dalmatia.\u0027 Extended Croatian control over the Dalmatian cities.",emoji:"\ud83d\udc51",color:"#7c3aed"},
    {name:"Svetoslav Suronja",years:"c. 997\u20131000",title:"Kralj",desc:"Eldest son of Dr\u017eislav. Overthrown by his brothers with Venetian help. Venice under Doge Pietro II Orseolo used this instability to seize Dalmatian cities.",emoji:"\ud83d\udc51",color:"#0e7490"},
    {name:"Kre\u0161imir III",years:"c. 1000\u20131030",title:"Kralj",desc:"Fought to restore Croatian control over Dalmatia after Venetian expansion. Shared power with his brother Gojslav.",emoji:"\ud83d\udc51",color:"#0e7490"},
    {name:"Stjepan I",years:"c. 1030\u20131058",title:"Kralj",desc:"Long reign during which he maintained the kingdom\u0027s borders and resisted both Byzantine and Venetian pressure on Dalmatia.",emoji:"\ud83d\udc51",color:"#0e7490"},
    {name:"Petar Kre\u0161imir IV",years:"1058\u20131074",title:"Kralj \u2014 The Great",desc:"The greatest territorial expander. Brought all Dalmatian cities under Croatian rule for the first time. Used the title \u0027King of Croatia and Dalmatia.\u0027 Under his reign the kingdom reached its maximum territorial extent. Considered one of the most important Croatian monarchs.",emoji:"\ud83d\udc51",color:"#b45309"},
    {name:"Dmitar Zvonimir",years:"1075\u20131089",title:"Kralj \u2014 The Blessed",desc:"Crowned at Solin by papal legate on October 8, 1076. His oath of loyalty is preserved as a key historical document. Reign was peaceful and prosperous. Strengthened ties with the Catholic Church. Recorded on the Ba\u0161ka Tablet \u2014 one of the oldest Croatian language texts. Married Jelena (Helena), Hungarian princess. Died 1089 without male heir.",emoji:"\ud83d\udc51",color:"#b45309"},
    {name:"Stjepan II",years:"1089\u20131091",title:"Zadnji Trpimirovi\u0107 \u2014 Last of the Line",desc:"Last king from the direct Trpimirovi\u0107 dynasty. Elderly and in poor health, he ruled less than two years. His death without an heir triggered the succession crisis that would end Croatian independence.",emoji:"\ud83d\udc51",color:"#dc2626"},
    {name:"Petar Sva\u010di\u0107",years:"1093\u20131097",title:"Posljednji Hrvatski Kralj \u2014 Last Croatian King",desc:"Elected by Croatian nobles as the last native king. Fought heroically against Hungarian King Koloman who claimed the Croatian throne. Fell in battle at Gvozd Mountain (Petrova Gora) in 1097. His death marks the end of sovereign Croatian rule. The mountain where he fell was later renamed Petrova Gora (\u0027Peter\u0027s Mountain\u0027) in his honor. A true martyr of Croatian independence.",emoji:"\u2694\ufe0f",color:"#dc2626"}
  ],
  keyFacts: [
    ["852","Charter of Duke Trpimir \u2014 first document using the Croatian name"],
    ["879","Pope recognizes Croatian independence under Duke Branimir"],
    ["925","Tomislav crowned first King of Croatia"],
    ["926","Croats defeat Bulgarian Empire at Battle of Bosnian Highlands"],
    ["1076","Zvonimir crowned at Solin with papal blessing"],
    ["1091","Death of Stjepan II \u2014 end of Trpimirovi\u0107 dynasty"],
    ["1097","Petar Sva\u010di\u0107 falls at Gvozd Mountain"],
    ["1102","Pacta Conventa \u2014 Croatia enters union with Hungary"]
  ],
  royalCities: [
    {name:"Nin",desc:"Earliest Croatian royal seat. Bishop Gregory of Nin championed Croatian language in church services."},
    {name:"Biograd na Moru",desc:"Royal city and coronation site. Destroyed by Venice in 1125."},
    {name:"Knin",desc:"Mountain fortress and royal seat. Strategic heart of the Croatian kingdom."},
    {name:"Solin",desc:"Ancient Salona. Site of Zvonimir\u0027s coronation in 1076. Heart of Croatian Christianity."},
    {name:"\u0160ibenik",desc:"First city on the Adriatic founded by Croats (not Romans or Greeks)."}
  ],
  vocabulary: [
    ["kralj","king"],["kraljica","queen"],["kraljevstvo","kingdom"],["kruna","crown"],
    ["knez","duke/prince"],["ban","viceroy"],["pleme","tribe"],["sabor","parliament"],
    ["\u017eupanija","county"],["vojska","army"],["bitka","battle"],["pobjeda","victory"],
    ["mir","peace"],["ugovor","treaty"],["nezavisnost","independence"],["kr\u0161\u0107anstvo","Christianity"],
    ["crkva","church"],["papa","pope"],["vjera","faith"],["narod","people/nation"],
    ["zemlja","land/country"],["granica","border"],["obrana","defense"],["suverenost","sovereignty"]
  ],
  quote: "Hrvatska je imala svoje kraljeve dok su mnogi europski narodi jo\u0161 \u017eivjeli u plemenima.",
  quoteEn: "Croatia had its own kings while many European peoples still lived in tribes."
};
// ═══ DAILY STREAK ═══
function getStreak(){try{return JSON.parse(localStorage.getItem("uStreak")||'{"count":0,"last":""}');} catch{return{count:0,last:""}}}
function updateStreak(){var s=getStreak();var today=new Date().toISOString().slice(0,10);if(s.last===today)return s;var yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);if(s.last===yesterday){s.count++;s.last=today}else if(s.last!==today){s.count=1;s.last=today}localStorage.setItem("uStreak",JSON.stringify(s));return s}
// ═══ CROATIAN PROVERBS ═══
const PROVERBS = [
  {hr:"Tko rano rani, dvije sreće grabi.",en:"The early bird catches two fortunes."},
  {hr:"Bolje spriječiti nego liječiti.",en:"Better to prevent than to cure."},
  {hr:"Bez muke nema nauke.",en:"No pain, no gain."},
  {hr:"Tko pita, ne skita.",en:"He who asks, doesn't wander."},
  {hr:"Vuk dlaku mijenja, ali ćud nikada.",en:"A wolf changes fur, but never character."},
  {hr:"Polako se daleko stigne.",en:"Going slowly, you reach far."},
  {hr:"Svaka ptica svome jatu leti.",en:"Every bird flies to its own flock."},
  {hr:"Kakav otac, takav sin.",en:"Like father, like son."},
  {hr:"Tko drugome jamu kopa, sam u nju upada.",en:"He who digs a pit for others falls in himself."},
  {hr:"Tiha voda breg roni.",en:"Still waters erode mountains."},
  {hr:"Čovjek uči dok je živ.",en:"A person learns as long as they live."},
  {hr:"Tko ne riskira, ne profitira.",en:"Nothing ventured, nothing gained."},
  {hr:"Udarac se zaboravi, a ružna riječ nikada.",en:"A blow is forgotten, but an ugly word never."},
  {hr:"Bolje vrabac u ruci nego golub na grani.",en:"A sparrow in hand beats a pigeon on a branch."},
  {hr:"Svaki početak je težak.",en:"Every beginning is hard."},
  {hr:"Tko čeka, dočeka.",en:"He who waits, gets what he's waiting for."},
  {hr:"Nada umire posljednja.",en:"Hope dies last."},
  {hr:"Oko za oko, zub za zub.",en:"An eye for an eye, a tooth for a tooth."},
  {hr:"Tko pod drugim jamu kopa, sam u nju pada.",en:"He who digs a pit for another falls in it."},
  {hr:"Gdje ima dima, ima i vatre.",en:"Where there's smoke, there's fire."},
  {hr:"Što se Ivica naučio, to Ivan zna.",en:"What little Ivan learns, grown Ivan knows."},
  {hr:"Lako je tuđim kurcem gloginje mlatiti.",en:"Easy to beat bushes with someone else's stick."},
  {hr:"Pametnom dosta.",en:"Enough said to the wise."},
  {hr:"Novac ne raste na drveću.",en:"Money doesn't grow on trees."},
  {hr:"Tko laže, taj i krade.",en:"He who lies also steals."},
  {hr:"Jedna lasta ne čini proljeće.",en:"One swallow doesn't make spring."},
  {hr:"Bolje ikad nego nikad.",en:"Better late than never."},
  {hr:"Tko se zadnji smije, najslađe se smije.",en:"He who laughs last, laughs sweetest."},
  {hr:"Ljubav je slijepa.",en:"Love is blind."},
  {hr:"Glad je najbolji kuhar.",en:"Hunger is the best cook."},
  {hr:"U laži su kratke noge.",en:"Lies have short legs."},
  {hr:"Kako siješ, tako ćeš žeti.",en:"As you sow, so shall you reap."},
  {hr:"Ne govori hop dok ne preskočiš.",en:"Don't say hop until you've jumped."},
  {hr:"Jabuka ne pada daleko od stabla.",en:"The apple doesn't fall far from the tree."},
  {hr:"Pas koji laje, ne grize.",en:"A barking dog doesn't bite."},
  {hr:"Riba od glave smrdi.",en:"Fish rots from the head."},
  {hr:"Novac nije sve.",en:"Money isn't everything."},
  {hr:"Nitko nije prorok u svom selu.",en:"No one is a prophet in their own village."},
  {hr:"Što je previše, nije zdravo.",en:"Too much of anything is unhealthy."},
  {hr:"Svakom loncu poklopac.",en:"Every pot has its lid."},
  {hr:"Tko žuri, griješi.",en:"He who hurries, makes mistakes."},
  {hr:"Vježba čini majstora.",en:"Practice makes perfect."},
  {hr:"Mladost ludost.",en:"Youth is folly."},
  {hr:"Ne daj Bože da se seljak obogati.",en:"God forbid a peasant gets rich. (ironic)"},
  {hr:"Život je lijep.",en:"Life is beautiful."},
  {hr:"Jezik kosti nema, ali kosti lomi.",en:"The tongue has no bones, but breaks bones."},
  {hr:"Na muci se poznaju junaci.",en:"Heroes are known in times of hardship."},
  {hr:"Čista savjest, miran san.",en:"Clean conscience, peaceful sleep."},
  {hr:"Dobro jutro, komšija!",en:"Good morning, neighbor! (BiH expression)"},
  {hr:"Iza kiše dolazi sunce.",en:"After rain comes sunshine."},
  {hr:"Znanje je moć.",en:"Knowledge is power."},
  {hr:"Bolje kasno nego nikad.",en:"Better late than never."},
  {hr:"Kad mačke nema, miševi kolo vode.",en:"When the cat's away, the mice dance."},
  {hr:"Koliko jezika znaš, toliko vrijediš.",en:"You're worth as many people as languages you know."},
  {hr:"Tko se boji, ne ide u šumu.",en:"He who's afraid doesn't go into the forest."},
  {hr:"Kraj psa i štap stoji.",en:"Keep a stick near the dog. (Be prepared)"},
  {hr:"Nije sve zlato što sija.",en:"Not all that glitters is gold."},
  {hr:"U zdravom tijelu, zdrav duh.",en:"A healthy mind in a healthy body."},
  {hr:"Ne budi ovca među vukovima.",en:"Don't be a sheep among wolves."},
  {hr:"Moja kuća, moja pravila.",en:"My house, my rules."},
  {hr:"I sam Bog odmara nedjeljom.",en:"Even God rests on Sunday."},
  {hr:"Teško onom tko nema nikoga.",en:"Woe to those who have no one."},
  {hr:"Svaki put vodi u Rim.",en:"All roads lead to Rome."},
  {hr:"Krv nije voda.",en:"Blood is thicker than water."},
  {hr:"Bolje grob nego rob.",en:"Better the grave than a slave."},
  {hr:"U slozi je snaga.",en:"In unity there is strength."},
  {hr:"Mirna Bosna.",en:"Quiet Bosnia. (sarcastic — when things are chaotic)"},
  {hr:"Dva loša ubiju dobrog.",en:"Two bad ones beat a good one."},
  {hr:"Pravda je spora, ali dostižna.",en:"Justice is slow, but reachable."},
  {hr:"Što Bog daje, to se ne odbija.",en:"What God gives, one doesn't refuse."},
  {hr:"Čuvaj se onoga kome se ne vidi rog.",en:"Beware of those whose horns you can't see."},
  {hr:"Svaka medalja ima dvije strane.",en:"Every medal has two sides."},
  {hr:"Daleko od očiju, daleko od srca.",en:"Far from eyes, far from heart."},
  {hr:"Nema kruha bez motike.",en:"No bread without a hoe. (Hard work needed)"},
  {hr:"Prazna vreća ne stoji uspravno.",en:"An empty sack can't stand upright."},
  {hr:"Riba i gost treći dan smrde.",en:"Fish and guests stink on the third day."},
  {hr:"Ko s đavolom tikve sadi, o glavu mu se razbijaju.",en:"He who plants pumpkins with the devil gets them smashed on his head."},
  {hr:"Vjera čini čuda.",en:"Faith works miracles."},
  {hr:"Tko te ljubi više od majke, taj te laže.",en:"Whoever loves you more than your mother is lying."},
  {hr:"Vrijeme je novac.",en:"Time is money."},
  {hr:"Dvaput mjeri, jednom reži.",en:"Measure twice, cut once."},
  {hr:"Ne vrijedi plakati nad prolivenim mlijekom.",en:"No use crying over spilled milk."},
  {hr:"Svaka priča ima kraj.",en:"Every story has an end."},
  {hr:"Tko visoko leti, nisko pada.",en:"He who flies high, falls low."},
  {hr:"Sreća prati hrabre.",en:"Fortune favors the brave."},
  {hr:"Jači bježi, slabiji trči.",en:"The strong flee, the weak run. (ironic)"},
  {hr:"Za svaku bolest ima lijek.",en:"For every illness there's a cure."},
  {hr:"Tko radi, ne boji se gladi.",en:"He who works doesn't fear hunger."},
  {hr:"Čovjek se ne poznaje dok se ne iskuša.",en:"You don't know a person until they're tested."},
  {hr:"Istina boli.",en:"Truth hurts."},
  {hr:"Tri su stvari u životu važne: zdravlje, obitelj i ljubav.",en:"Three things matter in life: health, family, and love."},
  {hr:"Dobar glas daleko se čuje.",en:"A good reputation carries far."},
  {hr:"Naša snaga je u jedinstvu.",en:"Our strength is in unity."},
  {hr:"Život je borba.",en:"Life is a struggle."},
  {hr:"Dok je živjeti, dotle je i nadati se.",en:"As long as there's life, there's hope."},
  {hr:"Vranino pero ne bude bijelo.",en:"A crow's feather doesn't become white."},
  {hr:"Tko se jednom opeče, drugi put puše.",en:"Once burned, twice shy."},
  {hr:"Ključ od svakih vrata visi o strpljenju.",en:"The key to every door hangs on patience."},
  {hr:"Od viška glava ne boli.",en:"Surplus doesn't cause headache."},
  {hr:"Mršava pogodba bolja od debele parnice.",en:"A thin deal is better than a fat lawsuit."},
  {hr:"Obraz je najljepši dar.",en:"Dignity is the most beautiful gift."},
  {hr:"Ne prodaji medvjedu kožu dok ga nisi ulovio.",en:"Don't sell the bear's skin before catching it."},
  {hr:"Govor je srebro, šutnja je zlato.",en:"Speech is silver, silence is gold."},
  {hr:"Šilo za ognjilo.",en:"A needle for a flintstone. (Tit for tat)"},
  {hr:"Iz tuđe kože širi remen.",en:"Cutting wide straps from someone else's leather."},
  {hr:"Kratka pamet, dugačak jezik.",en:"Short brain, long tongue."},
  {hr:"Kap po kap i kamen probiješ.",en:"Drop by drop, you pierce the stone."},
  {hr:"Ruka ruku pere, a obraz obadvije.",en:"One hand washes the other, both wash the face."},
  {hr:"Svaka čast poštenom čovjeku.",en:"All honor to an honest person."},
  {hr:"Ni u raju nije dobro sam.",en:"Even in paradise it's not good to be alone."},
  {hr:"Kome nije dano, nije mu ni suđeno.",en:"What is not given is not destined."},
  {hr:"Boj se Boga i nikoga.",en:"Fear God and no one else."},
  {hr:"Rodila gora miša.",en:"The mountain gave birth to a mouse."},
  {hr:"Lakše je savjetovati nego pomoći.",en:"Easier to advise than to help."},
  {hr:"I na vrbi raste grožđe.",en:"Even on a willow, grapes can grow. (Anything's possible)"},
  {hr:"Svojta do koljena.",en:"Relatives to the knee. (Family closeness)"},
  {hr:"Stara ljubav ne zarđa.",en:"Old love doesn't rust."},
  {hr:"S kim si, takav si.",en:"You are who you're with."},
  {hr:"Nevolja ne dolazi sama.",en:"Trouble doesn't come alone."},
  {hr:"Lijepa riječ i gvozdena vrata otvara.",en:"A kind word opens even iron gates."},
  {hr:"Ispeci pa reci.",en:"Bake it then say it. (Think before speaking)"},
  {hr:"Ako Bog da.",en:"God willing."},
  {hr:"Dobar dan se poznaje po jutru.",en:"A good day is known by its morning."},
  {hr:"Sjekira ne padne daleko od klade.",en:"The axe doesn't fall far from the stump."},
  {hr:"Istina izlazi na vidjelo.",en:"Truth comes to light."},
  {hr:"Ko drugom jamu kopa, sam u nju pada.",en:"Who digs a pit for another falls in it himself."},
  {hr:"Za dom spremni znači: kuću čistiti!",en:"Ready for home means: clean the house! (joke)"},
  {hr:"Što narod reče, Bog potvrdi.",en:"What the people say, God confirms."},
  {hr:"Učenje je blago koje svog vlasnika prati svuda.",en:"Learning is a treasure that follows its owner everywhere."},
  {hr:"Dva oka više vide nego jedno.",en:"Two eyes see more than one."},
  {hr:"Sto puta mjeri, jednom reži.",en:"Measure a hundred times, cut once."},
  {hr:"Bolje znoj na čelu nego mrlji na obrazu.",en:"Better sweat on the forehead than a stain on one's honor."},
  {hr:"Čega se pametan stidi, budala se ponosi.",en:"What the wise are ashamed of, fools are proud of."},
  {hr:"Čuvaj bijele novce za crne dane.",en:"Save white coins for black days."},
  {hr:"Da zna čovjek gdje će pasti, prostro bi slamu.",en:"If one knew where they'd fall, they'd spread straw."},
  {hr:"Dobro se dobrim vraća.",en:"Good is repaid with good."},
  {hr:"Drago kamenje se u blatu nalazi.",en:"Precious stones are found in mud."},
  {hr:"Gost u kuću, Bog u kuću.",en:"A guest in the house, God in the house."},
  {hr:"Govori istinu i kad te po glavi biju.",en:"Speak the truth even when they beat you over the head."},
  {hr:"Hrabrost nije ne bojati se, nego raditi unatoč strahu.",en:"Courage isn't fearlessness, but acting despite fear."},
  {hr:"I Rim se nije sagradio u jednom danu.",en:"Rome wasn't built in a day either."},
  {hr:"Iz malih žira rastu veliki hrastovi.",en:"From small acorns grow great oaks."},
  {hr:"Jak kao bik.",en:"Strong as a bull."},
  {hr:"Jutarnja kava, najbolja kava.",en:"Morning coffee, best coffee."},
  {hr:"Kaplja koja prelije čašu.",en:"The drop that overflows the glass. (Last straw)"},
  {hr:"Kad te udari po jednom obrazu, okreni drugi.",en:"When struck on one cheek, turn the other."},
  {hr:"Koji vuk odgoji, takva lisica bude.",en:"Whatever wolf raises, such a fox it becomes."},
  {hr:"Lako je biti general poslije bitke.",en:"Easy to be a general after the battle."},
  {hr:"Ljubav prema domovini je sveta dužnost.",en:"Love for the homeland is a sacred duty."},
  {hr:"Mali čovjek, velika duša.",en:"Small person, great soul."},
  {hr:"More je solju bogato, ali se ne može piti.",en:"The sea is rich with salt, but you can't drink it."},
  {hr:"Mudrosti u tisuću godina ima za jedan dan.",en:"A thousand years' wisdom fits in one day."},
  {hr:"Na pametnog se ne treba ljutiti.",en:"There's no need to be angry at the wise."},
  {hr:"Nasmij se svijetu, i svijet će se tebi nasmiješiti.",en:"Smile at the world, and the world smiles back."},
  {hr:"Nemoj se hvalisati tuđim perjem.",en:"Don't boast with someone else's feathers."},
  {hr:"Nije sramota ne znati, sramota je ne učiti.",en:"It's no shame not to know; it's shame not to learn."},
  {hr:"Nikad se ne zna tko ti sutra treba.",en:"You never know who you'll need tomorrow."},
  {hr:"Obećano, ispunjeno.",en:"Promised, fulfilled."},
  {hr:"Otvorena knjiga, otvoreno srce.",en:"Open book, open heart."},
  {hr:"Piti vodu s izvora.",en:"To drink water from the source. (Go to the origin)"},
  {hr:"Potreba je majka izuma.",en:"Necessity is the mother of invention."},
  {hr:"Pravi prijatelj se u nevolji poznaje.",en:"A true friend is known in times of trouble."},
  {hr:"Put od tisuću milja počinje jednim korakom.",en:"A journey of a thousand miles begins with one step."},
  {hr:"Rad je spas.",en:"Work is salvation."},
  {hr:"Samo mrtva riba pliva niz struju.",en:"Only a dead fish swims downstream."},
  {hr:"Tko čuva, taj ima.",en:"He who saves, has."},
  {hr:"Trn ne ulazi u nogu bez razloga.",en:"A thorn doesn't enter the foot without reason."},
  {hr:"Umjesto da kažeš, pokaži.",en:"Instead of telling, show."},
  {hr:"Uz more se ljepše diše.",en:"By the sea one breathes more beautifully."},
  {hr:"Vjerni drugovi u dobru i zlu.",en:"Faithful companions in good and bad."},
  {hr:"Volja čovjekova, snaga Božja.",en:"Man's will, God's strength."},
  {hr:"Za svakog ima mjesta pod suncem.",en:"There's a place under the sun for everyone."},
  {hr:"Zdravlje je najveće bogatstvo.",en:"Health is the greatest wealth."},
  {hr:"Želje su konji sirotinje.",en:"Wishes are the horses of the poor."},
  {hr:"Život bez ljubavi je život bez sunca.",en:"Life without love is life without sun."},
  {hr:"Bolje je malo, ali sigurno.",en:"Better a little, but certain."},
  {hr:"Čovjek je čovjeku lijek.",en:"A person is a person's remedy."},
  {hr:"Dobre stvari dolaze onima koji čekaju.",en:"Good things come to those who wait."},
  {hr:"Gdje se dvoje svađa, treći profitira.",en:"Where two quarrel, the third profits."},
  {hr:"Jedan za sve, svi za jednog.",en:"One for all, all for one."},
  {hr:"Kako kreneš, tako ćeš završiti.",en:"As you start, so you shall finish."},
  {hr:"Ljubav prema jeziku je ljubav prema narodu.",en:"Love for language is love for the people."},
  {hr:"Mudrost je znati koliko ne znaš.",en:"Wisdom is knowing how much you don't know."},
  {hr:"Ne pitaj koliko košta, pitaj koliko vrijedi.",en:"Don't ask what it costs, ask what it's worth."},
  {hr:"Pametan čovjek šuti kad je ljut.",en:"A wise person is silent when angry."},
  {hr:"Svaki novi dan je novi početak.",en:"Every new day is a new beginning."},
  {hr:"Temelj sreće je u obitelji.",en:"The foundation of happiness is in family."},
  {hr:"Vjera premješta planine.",en:"Faith moves mountains."},
  {hr:"Zajedništvo je snaga.",en:"Togetherness is strength."},
  {hr:"Bog pomaže onima koji si sami pomažu.",en:"God helps those who help themselves."},
  {hr:"Čuvaj prijatelja kao oko u glavi.",en:"Guard a friend like the eye in your head."},
  {hr:"Dijete je radost kuće.",en:"A child is the joy of the home."},
  {hr:"Gradi kuću od temelja.",en:"Build a house from the foundation."},
  {hr:"Hrabar čovjek jednom umire, kukavica tisuću puta.",en:"A brave person dies once, a coward a thousand times."},
  {hr:"Istina je gorka, ali ljekovita.",en:"Truth is bitter, but healing."},
  {hr:"Koliko je lijepih dana pred nama!",en:"How many beautiful days lie ahead of us!"},
  {hr:"Lopov misli da svi kradu.",en:"A thief thinks everyone steals."},
  {hr:"More odgaja jake ljude.",en:"The sea raises strong people."},
  {hr:"Naši stari su znali.",en:"Our elders knew."},
  {hr:"Pošten rad nikada ne propada.",en:"Honest work never fails."},
  {hr:"Rok se ne može zaustaviti.",en:"Time cannot be stopped."},
  {hr:"Sunce sija svima jednako.",en:"The sun shines equally on everyone."},
  {hr:"Tko ima vjeru, ima sve.",en:"He who has faith has everything."},
  {hr:"Uči od starih, gradi za mlade.",en:"Learn from the old, build for the young."},
  {hr:"Zemlja je majka.",en:"The earth is a mother."},
  {hr:"Život je dar.",en:"Life is a gift."},
  {hr:"Bez trna nema ruže.",en:"Without thorns, there's no rose."},
  {hr:"Croatia plena est virtutum.",en:"Croatia is full of virtues. (Latin motto)"},
  {hr:"Domovina se ne zaboravlja.",en:"The homeland is never forgotten."},
  {hr:"Gori lampa u srcu hrvatskom.",en:"A lamp burns in the Croatian heart."},
  {hr:"Hrvat zna put kući.",en:"A Croat knows the way home."},
  {hr:"Jako je more, ali je Hrvat jači.",en:"The sea is powerful, but the Croat is stronger."},
  {hr:"Kameni zidovi ne čine zatvor.",en:"Stone walls do not a prison make."},
  {hr:"Ljepota je u oku promatrača.",en:"Beauty is in the eye of the beholder."},
  {hr:"Mala zemlja, veliko srce.",en:"Small country, big heart."},
  {hr:"Ne brini se za sutra.",en:"Don't worry about tomorrow."},
  {hr:"Ostaviti trag na svijetu.",en:"To leave a mark on the world."},
  {hr:"Prošlost je učiteljica budućnosti.",en:"The past is the teacher of the future."},
  {hr:"Radost se dijeli, tuga se pola.",en:"Joy is shared, sorrow halved."},
  {hr:"Snaga je u korijenu.",en:"Strength is in the roots."},
  {hr:"Tisućama kilometara od kuće, ali srce je tamo.",en:"Thousands of kilometers from home, but the heart is there."},
  {hr:"U tuđini se čovjek za dom najviše brine.",en:"Abroad, one worries most about home."},
  {hr:"Vjerna zemlja, vjerni narod.",en:"Faithful land, faithful people."},
  {hr:"Za Boga i Hrvatsku!",en:"For God and Croatia!"},
  {hr:"Duša Hrvata nikada ne umire.",en:"The Croatian soul never dies."},
  {hr:"Gdje god bio, Hrvat ostaje.",en:"Wherever they go, a Croat remains."},
  {hr:"Hrvatski ponos je vječan.",en:"Croatian pride is eternal."},
  {hr:"Jednom Hrvat, uvijek Hrvat.",en:"Once a Croat, always a Croat."},
  {hr:"Kroz borbu do pobjede.",en:"Through struggle to victory."},
  {hr:"Ljubav prema domovini ne pozna granice.",en:"Love for homeland knows no borders."},
  {hr:"Narod koji pamti, narod koji živi.",en:"A people who remember, a people who live."},
  {hr:"Od mora do Dunava, sve je naše.",en:"From the sea to the Danube, all is ours."},
  {hr:"Svako dijete nosi domovinu u srcu.",en:"Every child carries the homeland in their heart."},
  {hr:"Tradicija je most između prošlosti i budućnosti.",en:"Tradition is a bridge between past and future."},
  {hr:"U znaku križa, u sjeni grba.",en:"In the sign of the cross, in the shade of the coat of arms."},
  {hr:"Vrijeme liječi rane, ali sjećanje ostaje.",en:"Time heals wounds, but memory remains."},
  {hr:"Zauvijek zahvalni braniteljima.",en:"Forever grateful to the defenders."},
  {hr:"Budućnost pripada hrabrima.",en:"The future belongs to the brave."},
  {hr:"Čuvaj vjeru i obitelj.",en:"Guard faith and family."},
  {hr:"Dom je tamo gdje je srce.",en:"Home is where the heart is."},
  {hr:"Iz pepela se rađa feniks.",en:"From ashes, the phoenix is born."},
  {hr:"Korak po korak, cilj se dostiže.",en:"Step by step, the goal is reached."},
  {hr:"Ljubav, vjera, nada.",en:"Love, faith, hope."},
  {hr:"Mi smo Hrvati i to je naš ponos.",en:"We are Croats and that is our pride."},
  {hr:"Ništa nas ne može slomiti.",en:"Nothing can break us."},
  {hr:"Ratnici su neuništivi.",en:"Warriors are indestructible."},
  {hr:"Ja sam bio izuzetak.",en:"I was the exception."}
,
  {hr:"Volja i strpljenje pobjeđuju sve.",en:"Will and patience conquer all."},
  {hr:"Malo dijete, mali problemi; veliko dijete, veliki problemi.",en:"Small child, small problems; big child, big problems."},
  {hr:"Bolje je dati nego primiti.",en:"It's better to give than to receive."},
  {hr:"Nije bitno koliko padneš, nego koliko puta ustaneš.",en:"It doesn't matter how many times you fall, but how many times you get up."},
  {hr:"Strpljen — spašen.",en:"Patient — saved."},
  {hr:"Tko ima volju, nađe i put.",en:"Where there's a will, there's a way."},
  {hr:"Ne sudi po izgledu.",en:"Don't judge by appearance."},
  {hr:"Bolje biti sam nego u lošem društvu.",en:"Better alone than in bad company."},
  {hr:"Znanje se ne može ukrasti.",en:"Knowledge cannot be stolen."},
  {hr:"Zora rano, mrak kasno.",en:"Dawn early, dark late. (Long days of work)"},
  {hr:"Tko koga čuva, Bog ga čuva.",en:"Who protects others, God protects."},
  {hr:"Obraz je skuplji od zlata.",en:"Honor is more expensive than gold."},
  {hr:"Dijete je ogledalo roditelja.",en:"A child is a mirror of their parents."},
  {hr:"Pametan šuti kad budala govori.",en:"The wise stay silent when a fool speaks."},
  {hr:"Što bi selo reklo?",en:"What would the village say? (Social pressure)"},
  {hr:"Nema uspjeha bez truda.",en:"No success without effort."},
  {hr:"Ko rano sije, rano žanje.",en:"He who sows early, reaps early."},
  {hr:"U zdravlju je sve.",en:"Health is everything."},
  {hr:"Svaka majka misli da je njeno dijete najljepše.",en:"Every mother thinks her child is the most beautiful."},
  {hr:"Kamen koji se kotrlja ne hvata mahovinu.",en:"A rolling stone gathers no moss."},
  {hr:"Čini drugima ono što želiš da čine tebi.",en:"Do to others as you'd want done to you."},
  {hr:"Ono što ne ubiješ, ojača te.",en:"What doesn't kill you makes you stronger."},
  {hr:"S ponosom nosi svoje ime.",en:"Carry your name with pride."},
  {hr:"Pobijediti sebe je najveća pobjeda.",en:"Conquering yourself is the greatest victory."},
  {hr:"Tko štedi, taj ima.",en:"He who saves, has."},
  {hr:"Sutra je novi dan.",en:"Tomorrow is a new day."},
  {hr:"Prijatelji se broje u nevolji.",en:"Friends are counted in times of trouble."},
  {hr:"Ne pljuj u bunar iz kojeg piješ.",en:"Don't spit in the well you drink from."},
  {hr:"Mladi za rad, stari za savjet.",en:"Youth for work, elders for advice."},
  {hr:"Tko traži, nađe.",en:"He who seeks, finds."},
  {hr:"Uz rijeku do mora.",en:"Along the river to the sea."},
  {hr:"Nitko ne zna što nosi sutra.",en:"No one knows what tomorrow brings."},
  {hr:"Snaga obitelji je snaga naroda.",en:"The strength of family is the strength of a nation."},
  {hr:"Tisuću prijatelja je malo, jedan neprijatelj je previše.",en:"A thousand friends is few, one enemy is too many."},
  {hr:"Poslije oluje dolazi mir.",en:"After the storm comes peace."},
  {hr:"Mudar čovjek uči od svakog.",en:"A wise person learns from everyone."},
  {hr:"Na svoj način, ali na pravi put.",en:"In your own way, but on the right path."},
  {hr:"Koliko glava, toliko ćudi.",en:"As many heads, as many temperaments."},
  {hr:"Gdje nema pravde, nema ni mira.",en:"Where there's no justice, there's no peace."},
  {hr:"U borbi za pravdu nikad ne odustaj.",en:"In the fight for justice, never give up."},
  {hr:"Kada zatvorim oči, vidim Hrvatsku.",en:"When I close my eyes, I see Croatia."},
  {hr:"Riječ je mač, a šutnja štit.",en:"Words are a sword, silence a shield."},
  {hr:"Zlatne ruke stvaraju čuda.",en:"Golden hands create wonders."},
  {hr:"Ne tražiti lakog puta, nego ispravnog.",en:"Don't seek the easy path, but the right one."},
  {hr:"Samo zajedno možemo.",en:"Only together we can."},
  {hr:"Svaki dan je nova prilika.",en:"Every day is a new opportunity."},
  {hr:"Ono što ima korijena, ne boji se vjetra.",en:"What has roots doesn't fear the wind."},
  {hr:"Hrabar je onaj tko se boji, ali ipak ide naprijed.",en:"Brave is the one who's afraid but goes forward anyway."},
  {hr:"Svi putevi kući vode.",en:"All roads lead home."},
  {hr:"Kiša je blagoslov neba.",en:"Rain is heaven's blessing."},
  {hr:"Snaga dolazi iz srca.",en:"Strength comes from the heart."},
  {hr:"Odgoj je najvažniji dar koji roditelj može dati.",en:"Upbringing is the most important gift a parent can give."},
  {hr:"Zahvalnost je znak plemenite duše.",en:"Gratitude is a sign of a noble soul."},
  {hr:"Ljubav prema djeci nema granica.",en:"Love for children knows no limits."},
  {hr:"Gdje god bijaše, dom je u srcu.",en:"Wherever you've been, home is in the heart."},
  {hr:"Reci mi s kim hodaš, pa ću ti reći tko si.",en:"Tell me who you walk with, I'll tell you who you are."},
  {hr:"Mudrost je kruna života.",en:"Wisdom is the crown of life."},
  {hr:"Ponos ne hrani, ali bez njega nema života.",en:"Pride doesn't feed, but without it there's no life."},
  {hr:"Kada govoriš, govori srcem.",en:"When you speak, speak from the heart."},
  {hr:"Što naučiš u mladosti, nosiš u starosti.",en:"What you learn in youth, you carry in old age."},
  {hr:"Narod koji pjeva, narod koji živi.",en:"A people who sing, a people who live."},
  {hr:"Tko čuva čast, čuva i budućnost.",en:"Who preserves honor, preserves the future."},
  {hr:"Jednom se živi.",en:"You only live once."},
  {hr:"Čistom srcu nema prepreka.",en:"For a pure heart, there are no obstacles."},
  {hr:"Ako ne ja, tko? Ako ne sada, kada?",en:"If not me, who? If not now, when?"},
  {hr:"Temelji su najvažniji dio kuće.",en:"The foundations are the most important part of a house."},
  {hr:"Ono što daješ, to ti se vraća.",en:"What you give, comes back to you."},
  {hr:"Sretan je onaj tko ima za koga živjeti.",en:"Happy is the one who has someone to live for."},
  {hr:"Jezik je ključ svijeta.",en:"Language is the key to the world."},
  {hr:"Mudrost bez hrabrosti je beskorisna.",en:"Wisdom without courage is useless."},
  {hr:"Mir je najskuplji dar.",en:"Peace is the most expensive gift."},
  {hr:"Tko pjeva, zlo ne misli.",en:"He who sings thinks no evil."},
  {hr:"Smijeh je lijek za dušu.",en:"Laughter is medicine for the soul."},
  {hr:"U moru problema, budi luka.",en:"In a sea of problems, be a port."},
  {hr:"Budi promjena koju želiš vidjeti.",en:"Be the change you want to see."},
  {hr:"Ljubav pobjeđuje sve.",en:"Love conquers all."},
  {hr:"Vjera bez djela je mrtva.",en:"Faith without works is dead."},
  {hr:"Dobrota je jezik koji gluhi čuju i slijepi vide.",en:"Kindness is a language the deaf hear and the blind see."},
  {hr:"Novi dan, nova nada.",en:"New day, new hope."},
  {hr:"Tko ne plače, ne smije se.",en:"He who doesn't cry, cannot laugh."},
  {hr:"Život piše najljepše priče.",en:"Life writes the most beautiful stories."},
  {hr:"Nije važno odakle dolaziš, nego kamo ideš.",en:"It's not where you're from, but where you're going."},
  {hr:"Sreća je u malim stvarima.",en:"Happiness is in the small things."},
  {hr:"Naša snaga je u raznolikosti.",en:"Our strength is in diversity."},
  {hr:"Hvala Bogu na svakom danu.",en:"Thank God for every day."},
  {hr:"Čovjek je jak koliko je jaka njegova volja.",en:"A person is as strong as their will."},
  {hr:"Budi svjetlo u tami.",en:"Be a light in the darkness."},
  {hr:"Osmijeh ne košta ništa.",en:"A smile costs nothing."},
  {hr:"Život je putovanje, ne odredište.",en:"Life is a journey, not a destination."},
  {hr:"Čuvaj ono što imaš dok ne shvatiš da nemaš.",en:"Appreciate what you have before you realize you don't."},
  {hr:"Stari prijatelji su kao staro vino.",en:"Old friends are like old wine."},
  {hr:"Hrabrost počinje prvim korakom.",en:"Courage begins with the first step."},
  {hr:"Svi smo putnici na istom putu.",en:"We are all travelers on the same road."},
  {hr:"Ljubav je jedini rat koji se isplati voditi.",en:"Love is the only war worth fighting."},
  {hr:"Kada se jedna vrata zatvore, druga se otvore.",en:"When one door closes, another opens."},
  {hr:"Tko nosi križ, nosi i krunu.",en:"He who carries the cross, carries the crown."},
  {hr:"Sretni su oni koji siju, jer će žeti.",en:"Blessed are those who sow, for they shall reap."},
  {hr:"Odrasli smo na moru, vjetru i kamenu.",en:"We grew up on sea, wind, and stone."},
  {hr:"Naš put je dug, ali siguran.",en:"Our path is long, but certain."},
  {hr:"Kad si ponosan na svoje korijene, stabilan si kao hrast.",en:"When proud of your roots, you're steady as an oak."},
  {hr:"Sjeti se odakle dolaziš i znaj kamo ideš.",en:"Remember where you come from and know where you're going."},
  {hr:"Život bez izazova je život bez rasta.",en:"Life without challenges is life without growth."},
  {hr:"Za svaku suzu, deset osmjeha.",en:"For every tear, ten smiles."},
  {hr:"Nebo je granica.",en:"The sky is the limit."},
  {hr:"Budi ponosan, budi Hrvat.",en:"Be proud, be Croatian."},
  {hr:"Zajedno smo jači.",en:"Together we are stronger."},
  {hr:"Naša Hrvatska, naš dom.",en:"Our Croatia, our home."},
  {hr:"Onaj tko vjeruje, taj i može.",en:"Those who believe, can."},
  {hr:"Kolijevka nas uči, grob nas čeka.",en:"The cradle teaches us, the grave awaits."},
  {hr:"Ne daj da ti itko ugasi vatru u srcu.",en:"Don't let anyone extinguish the fire in your heart."},
  {hr:"Život je kratak, čini dobro.",en:"Life is short, do good."},
  {hr:"Ako možeš sanjati, možeš i ostvariti.",en:"If you can dream it, you can achieve it."},
  {hr:"Više vrijedi jedna istina nego tisuću laži.",en:"One truth is worth more than a thousand lies."},
  {hr:"Čovjek bez domovine je kao drvo bez korijena.",en:"A person without a homeland is like a tree without roots."},
  {hr:"Istina je kćerka vremena.",en:"Truth is the daughter of time."},
  {hr:"Sreća dolazi iznutra.",en:"Happiness comes from within."},
  {hr:"Majka je prvi učitelj.",en:"A mother is the first teacher."},
  {hr:"Život nas uči svakim danom.",en:"Life teaches us every day."},
  {hr:"Naša snaga je u vjeri i ljubavi.",en:"Our strength is in faith and love."}];
function getProverbOfDay(){
  var n=new Date();
  var dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  // Seed with date + a salt so proverb and fact never land on the same index
  var h=5381;var s='prov:'+dk;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;h=h>>>0;
  return PROVERBS[h%PROVERBS.length];
}
// ═══ LISTENING COMPREHENSION ═══
const LISTEN = [
  {hr:"Dobar dan, kako ste?",en:"Good day, how are you?",opts:["Good day, how are you?","Good night, where are you?","Hello, who are you?","Good morning, how old are you?"]},
  {hr:"Ja sam iz Hrvatske.",en:"I am from Croatia.",opts:["I am from Croatia.","I am in Croatia.","I love Croatia.","I live in Croatia."]},
  {hr:"Koliko ko\u0161ta kava?",en:"How much is a coffee?",opts:["How much is a coffee?","Where is the coffee?","I want coffee.","Do you have coffee?"]},
  {hr:"\u017delim naru\u010diti riblju juhu.",en:"I want to order fish soup.",opts:["I want to order fish soup.","I like eating fish soup.","The fish soup is cold.","Do you have fish soup?"]},
  {hr:"Gdje je najbli\u017ea ljekarna?",en:"Where is the nearest pharmacy?",opts:["Where is the nearest pharmacy?","Where is the hospital?","I need a doctor.","Where is the nearest market?"]},
  {hr:"Moja djeca u\u010de hrvatski.",en:"My children are learning Croatian.",opts:["My children are learning Croatian.","My children speak Croatian.","My family is Croatian.","My children love Croatia."]},
  {hr:"Mo\u017eete li mi pomo\u0107i?",en:"Can you help me?",opts:["Can you help me?","Can I help you?","Do you need help?","Where can I find help?"]},
  {hr:"Sutra idemo na pla\u017eu.",en:"Tomorrow we go to the beach.",opts:["Tomorrow we go to the beach.","Yesterday we went to the beach.","We like the beach.","The beach is beautiful."]},
  {hr:"Trebam kupiti kruh i mlijeko.",en:"I need to buy bread and milk.",opts:["I need to buy bread and milk.","I like bread and milk.","Bread and milk are expensive.","Where is the bread and milk?"]},
  {hr:"On je govorio s lije\u010dnikom.",en:"He was talking with the doctor.",opts:["He was talking with the doctor.","He is going to the doctor.","He needs a doctor.","The doctor is talking."]},
  {hr:"Hrvatska je lijepa zemlja s dugom povije\u0161\u0107u.",en:"Croatia is a beautiful country with a long history.",opts:["Croatia is a beautiful country with a long history.","Croatia is a small country in Europe.","Croatia has beautiful beaches.","I want to visit Croatia."]},
  {hr:"Ne razumijem, mo\u017eete li ponoviti?",en:"I don\u0027t understand, can you repeat?",opts:["I don\u0027t understand, can you repeat?","I understand everything.","Please speak louder.","I don\u0027t speak Croatian."]}
];
// ═══ MINI STORIES (BRANCHING) ═══
const STORIES = [
  {title:"U Kafi\u0107u",tEn:"At the Caf\u00e9",scenes:[
    {text:"Ulazi\u0161 u kafi\u0107 u centru Zagreba. Konobar ti se smiješi.",en:"You walk into a caf\u00e9 in downtown Zagreb. The waiter smiles at you.",choices:[
      {text:"Naruči kavu",next:1},{text:"Pitaj za jelovnik",next:2}]},
    {text:"Naručuje\u0161 kavu. Konobar pita: \u0027S mlijekom ili bez?\u0027",en:"You order coffee. The waiter asks: \u0027With milk or without?\u0027",choices:[
      {text:"S mlijekom, molim.",next:3},{text:"Bez mlijeka, hvala.",next:3}]},
    {text:"Konobar donosi jelovnik. Vidiš kavu, čaj, kolače i sendviče.",en:"The waiter brings the menu. You see coffee, tea, cakes and sandwiches.",choices:[
      {text:"Želim kavu i kolač.",next:3},{text:"Samo čaj, molim.",next:3}]},
    {text:"Konobar donosi tvoju narud\u017ebu. Ka\u017ee\u0161: \u0027Hvala lijepa!\u0027 On odgovara: \u0027Nema na \u010demu!\u0027 Sjedi\u0161 i u\u017eiva\u0161 u pogledu na trg.",en:"The waiter brings your order. You say: \u0027Thank you!\u0027 He replies: \u0027You\u0027re welcome!\u0027 You sit and enjoy the view of the square.",choices:[]}
  ]},
  {title:"Na Tr\u017enici",tEn:"At the Market",scenes:[
    {text:"Dolazi\u0161 na Dola\u010dku tr\u017enicu u subotu ujutro. Puna je svje\u017eeg vo\u0107a i povr\u0107a.",en:"You arrive at Dolac market on Saturday morning. It\u0027s full of fresh fruit and vegetables.",choices:[
      {text:"Idi do prodavačice voća",next:1},{text:"Idi do standa sa sirom",next:2}]},
    {text:"Prodava\u010dica ka\u017ee: \u0027Dobar dan! Imamo svje\u017ee jagode, tre\u0161nje i lubenice.\u0027",en:"The seller says: \u0027Good day! We have fresh strawberries, cherries and watermelons.\u0027",choices:[
      {text:"Koliko koštaju jagode?",next:3},{text:"Dajte mi kilu trešanja.",next:3}]},
    {text:"Prodava\u010d sira ka\u017ee: \u0027Probajte na\u0161 doma\u0107i sir! Iz Like je.\u0027",en:"The cheese seller says: \u0027Try our homemade cheese! It\u0027s from Lika.\u0027",choices:[
      {text:"Da, molim! Koliko košta?",next:3},{text:"Hvala, samo gledam.",next:3}]},
    {text:"Kupio si sve \u0161to ti treba. Vre\u0107ica je puna. Ka\u017ee\u0161: \u0027Hvala i doviđenja!\u0027 Prodavačica odgovara: \u0027Dovidenja, vidimo se!\u0027",en:"You bought everything you need. Your bag is full. You say: \u0027Thanks and goodbye!\u0027 The seller replies: \u0027Goodbye, see you!\u0027",choices:[]}
  ]},
  {title:"Izgubljen u Splitu",tEn:"Lost in Split",scenes:[
    {text:"Hoda\u0161 Splitom ali ne zna\u0161 gdje si. Vidi\u0161 prolaznika i policajca.",en:"You\u0027re walking through Split but don\u0027t know where you are. You see a passerby and a police officer.",choices:[
      {text:"Pitaj prolaznika",next:1},{text:"Pitaj policajca",next:2}]},
    {text:"Kažeš: \u0027Oprostite, gdje je Dioklecijanova palača?\u0027 Prolaznik odgovara: \u0027Idite ravno pa skrenite lijevo kod crkve.\u0027",en:"You say: \u0027Excuse me, where is Diocletian\u0027s Palace?\u0027 The passerby answers: \u0027Go straight then turn left at the church.\u0027",choices:[
      {text:"Hvala! Idem ravno.",next:3},{text:"Možete li mi pokazati na karti?",next:3}]},
    {text:"Policajac ka\u017ee: \u0027Pala\u010da? Vrlo blizu! Pet minuta pe\u0161ice. Pratite ovu ulicu do mora.\u0027",en:"The officer says: \u0027The Palace? Very close! Five minutes on foot. Follow this street to the sea.\u0027",choices:[
      {text:"Hvala puno!",next:3},{text:"A gdje je dobra konoba?",next:3}]},
    {text:"Na\u0161ao si Dioklecijanovu pala\u010du! Prekrasna je. Sjeda\u0161 na Rivu i naručuje\u0161 gemišt. Život je lijep.",en:"You found Diocletian\u0027s Palace! It\u0027s stunning. You sit on the Riva and order a gemišt. Life is beautiful.",choices:[]}
  ]}
];
// ═══ NUMBER & TIME DRILLS ═══
const NUMTIME = {
  numbers: [
    {q:"How do you say 15?",a:"petnaest",al:["trinaest","dvanaest","šesnaest"]},
    {q:"How do you say 28?",a:"dvadeset osam",al:["dvadeset tri","trideset osam","dvadeset devet"]},
    {q:"How do you say 50?",a:"pedeset",al:["petdeset","petoset","petnaest"]},
    {q:"How do you say 73?",a:"sedamdeset tri",al:["šezdeset tri","sedamdeset sedam","osamdeset tri"]},
    {q:"How do you say 100?",a:"sto",al:["tisuću","deset","dvjesto"]},
    {q:"How do you say 365?",a:"tristo šezdeset pet",al:["tristo pedeset pet","dvjesto šezdeset pet","tristo šezdeset šest"]},
    {q:"How do you say 1000?",a:"tisuću",al:["sto","milijun","deset tisuća"]},
    {q:"Koliko je 12 + 8?",a:"dvadeset",al:["osamnaest","dvadeset dva","devetnaest"]}
  ],
  time: [
    {q:"It\u0027s 3:00 PM =",a:"Petnaest sati",al:["Tri sata","Pet sati","Trinaest sati"]},
    {q:"It\u0027s 7:30 =",a:"Sedam sati i trideset minuta",al:["Sedam i pol","Šest i trideset","Osam i trideset"]},
    {q:"It\u0027s noon =",a:"Podne",al:["Ponoć","Jutro","Večer"]},
    {q:"It\u0027s midnight =",a:"Ponoć",al:["Podne","Noć","Kasno"]},
    {q:"It\u0027s 9:15 AM =",a:"Devet sati i petnaest minuta",al:["Devet i pol","Deset i petnaest","Osam i petnaest"]},
    {q:"\u0027Pola pet\u0027 means?",a:"4:30",al:["5:30","5:00","4:00"]},
    {q:"\u0027Četvrt do šest\u0027 means?",a:"5:45",al:["6:15","6:45","5:15"]},
    {q:"47 euros in Croatian?",a:"Četrdeset sedam eura",al:["Četrdeset pet eura","Trideset sedam eura","Pedeset sedam eura"]}
  ]
};
// ═══ VERB ASPECT (PERFECTIVE/IMPERFECTIVE) ═══
const ASPECT = {
  title:"Glagolski vid \u2014 Verb Aspect",
  intro:"Croatian verbs come in pairs: imperfective (ongoing/repeated action) and perfective (completed/one-time action). This is the most important concept English doesn\u0027t have.",
  pairs:[
    {impf:"pisati",perf:"napisati",en:"write",exImpf:"Pisao sam pismo.",exPerf:"Napisao sam pismo.",enImpf:"I was writing a letter.",enPerf:"I finished writing the letter."},
    {impf:"\u010ditati",perf:"pro\u010ditati",en:"read",exImpf:"\u010citam knjigu.",exPerf:"Pro\u010ditao sam knjigu.",enImpf:"I\u0027m reading a book.",enPerf:"I read (finished) the book."},
    {impf:"piti",perf:"popiti",en:"drink",exImpf:"Pijem kavu.",exPerf:"Popio sam kavu.",enImpf:"I\u0027m drinking coffee.",enPerf:"I drank (all) the coffee."},
    {impf:"jesti",perf:"pojesti",en:"eat",exImpf:"Jedem ru\u010dak.",exPerf:"Pojeo sam ru\u010dak.",enImpf:"I\u0027m eating lunch.",enPerf:"I ate (all of) lunch."},
    {impf:"gledati",perf:"pogledati",en:"watch/look",exImpf:"Gledam film.",exPerf:"Pogledao sam film.",enImpf:"I\u0027m watching a movie.",enPerf:"I watched the movie."},
    {impf:"kupovati",perf:"kupiti",en:"buy",exImpf:"Kupujem hranu.",exPerf:"Kupio sam auto.",enImpf:"I\u0027m buying food.",enPerf:"I bought a car."},
    {impf:"dolaziti",perf:"do\u0107i",en:"come",exImpf:"Dolazim svaki dan.",exPerf:"Do\u0161ao sam ku\u0107i.",enImpf:"I come every day.",enPerf:"I came home."},
    {impf:"odlaziti",perf:"oti\u0107i",en:"leave",exImpf:"Odlazim na posao.",exPerf:"Oti\u0161ao je.",enImpf:"I\u0027m leaving for work.",enPerf:"He left."},
    {impf:"u\u010diti",perf:"nau\u010diti",en:"learn",exImpf:"U\u010dim hrvatski.",exPerf:"Nau\u010dio sam lekciju.",enImpf:"I\u0027m learning Croatian.",enPerf:"I learned the lesson."},
    {impf:"davati",perf:"dati",en:"give",exImpf:"Dajem savjete.",exPerf:"Dao sam mu poklon.",enImpf:"I give advice.",enPerf:"I gave him a gift."}
  ],
  quiz:[
    {q:"Which is imperfective?",a:"pisati",al:["napisati","popiti","kupiti"]},
    {q:"\u0027Pojeo sam ru\u010dak\u0027 \u2014 what aspect?",a:"Perfective (completed)",al:["Imperfective (ongoing)","Neither","Both"]},
    {q:"For \u0027I\u0027m reading now\u0027, use:",a:"\u010citam (\u010ditati)",al:["Pro\u010ditam (pro\u010ditati)","Nau\u010dim (nau\u010diti)","Popijem (popiti)"]},
    {q:"Prefix \u0027na-\u0027 in \u0027napisati\u0027 signals:",a:"Completed action",al:["Ongoing action","Future action","Past habit"]},
    {q:"\u0027Dolazim svaki dan\u0027 uses which aspect?",a:"Imperfective (repeated)",al:["Perfective (one-time)","Neither","Conditional"]},
    {q:"Perfective of \u0027piti\u0027?",a:"popiti",al:["pijem","pijati","napiti"]},
    {q:"In present tense, you normally use:",a:"Imperfective verbs",al:["Perfective verbs","Either one","Neither"]},
    {q:"Imperfective of \u0027kupiti\u0027?",a:"kupovati",al:["kupiti","nakupiti","pokupiti"]}
  ]
};
// ═══ FALSE FRIENDS (LA\u017dNI PRIJATELJI) ═══
const FALSEFR = [
  {hr:"pasta",looks:"pasta (food)",means:"toothpaste",real:"tjestenina = pasta (food)",ex:"Trebam novu pastu za zube. (I need new toothpaste.)"},
  {hr:"simpati\u010dan",looks:"sympathetic",means:"nice, pleasant, likeable",real:"su\u0107utan = sympathetic",ex:"On je jako simpati\u010dan. (He is very nice.)"},
  {hr:"kontrolirati",looks:"to control",means:"to check, inspect",real:"upravljati = to control",ex:"Moram kontrolirati zadatak. (I need to check the assignment.)"},
  {hr:"eventualno",looks:"eventually",means:"possibly, maybe",real:"na kraju = eventually",ex:"Eventualno \u0107u do\u0107i. (I might come.)"},
  {hr:"magazin",looks:"magazine",means:"warehouse, storage",real:"\u010dasopis = magazine",ex:"Roba je u magazinu. (The goods are in the warehouse.)"},
  {hr:"prezervativ",looks:"preservative",means:"condom",real:"konzervans = preservative",ex:"Be careful with this one!"},
  {hr:"direktor",looks:"director (film)",means:"manager, CEO",real:"redatelj = film director",ex:"Direktor tvrtke je u uredu. (The company manager is in the office.)"},
  {hr:"re\u010denica",looks:"recipe",means:"sentence",real:"recept = recipe",ex:"Napi\u0161i re\u010denicu. (Write a sentence.)"},
  {hr:"akademik",looks:"academic (professor)",means:"member of Academy of Sciences",real:"sveu\u010dili\u0161ni profesor = academic",ex:"On je akademik. (He is an academy member.)"},
  {hr:"aktualan",looks:"actual",means:"current, up-to-date",real:"stvaran = actual",ex:"To je aktualna tema. (That is a current topic.)"},
  {hr:"konkretno",looks:"concretely (material)",means:"specifically",real:"betonski = concrete (material)",ex:"Konkretno, \u0161to misli\u0161? (Specifically, what do you think?)"},
  {hr:"prospekt",looks:"prospect",means:"brochure, leaflet",real:"mogu\u0107nost = prospect",ex:"Uzmi prospekt hotela. (Take the hotel brochure.)"},
  {hr:"\u0161ef",looks:"chef (cook)",means:"boss",real:"kuhar = chef/cook",ex:"\u0160ef je u uredu. (The boss is in the office.)"},
  {hr:"marmelada",looks:"marmalade (citrus)",means:"any jam",real:"specifics don\u0027t matter \u2014 all jam is marmelada",ex:"Volim marmeladu od jagoda. (I like strawberry jam.)"},
  {hr:"mobitel",looks:"mobile (moving)",means:"mobile phone",real:"pokretno = mobile (adjective)",ex:"Gdje je moj mobitel? (Where is my phone?)"}
];
// ═══ PREPOSITION DRILLS ═══
const PREPDRILL = [
  {sentence:"Živim ___ Zagrebu.",answer:"u",opts:["u","na","s","iz"],en:"I live in Zagreb."},
  {sentence:"Idem ___ posao.",answer:"na",opts:["na","u","za","iz"],en:"I go to work."},
  {sentence:"Dolazim ___ Hrvatske.",answer:"iz",opts:["iz","od","u","na"],en:"I come from Croatia."},
  {sentence:"Kava ___ mlijeka.",answer:"bez",opts:["bez","od","sa","iz"],en:"Coffee without milk."},
  {sentence:"Idem ___ mamom.",answer:"s",opts:["s","na","u","od"],en:"I go with mom."},
  {sentence:"Knjiga je ___ stolu.",answer:"na",opts:["na","u","po","za"],en:"The book is on the table."},
  {sentence:"Auto je ___ kuće.",answer:"ispred",opts:["ispred","iznad","ispod","iza"],en:"The car is in front of the house."},
  {sentence:"Pričam ___ filmu.",answer:"o",opts:["o","u","na","za"],en:"I\u0027m talking about the movie."},
  {sentence:"Idem ___ liječnika.",answer:"kod",opts:["kod","u","na","za"],en:"I\u0027m going to the doctor."},
  {sentence:"Mačka je ___ stola.",answer:"ispod",opts:["ispod","na","u","iza"],en:"The cat is under the table."},
  {sentence:"Radim ___ fakultetu.",answer:"na",opts:["na","u","za","po"],en:"I work at the university."},
  {sentence:"Šetam ___ parku.",answer:"po",opts:["po","u","na","iz"],en:"I\u0027m walking around the park."},
  {sentence:"Idem ___ plažu.",answer:"na",opts:["na","u","po","za"],en:"I\u0027m going to the beach."},
  {sentence:"Ograde ___ kuće.",answer:"oko",opts:["oko","od","u","na"],en:"Fences around the house."},
  {sentence:"Stigao sam ___ posla.",answer:"s",opts:["s","iz","od","na"],en:"I arrived from work."}
];
// ═══ NOUN DECLENSION TRAINER ═══
const DECL = {
  nouns:[
    {nom:"žena",en:"woman",g:"f",cases:["žena","žene","ženi","ženu","ženo","ženi","ženom"]},
    {nom:"muškarac",en:"man",g:"m",cases:["muškarac","muškarca","muškarcu","muškarca","muškarče","muškarcu","muškarcem"]},
    {nom:"dijete",en:"child",g:"n",cases:["dijete","djeteta","djetetu","dijete","dijete","djetetu","djetetom"]},
    {nom:"kuća",en:"house",g:"f",cases:["kuća","kuće","kući","kuću","kućo","kući","kućom"]},
    {nom:"grad",en:"city",g:"m",cases:["grad","grada","gradu","grad","grade","gradu","gradom"]},
    {nom:"more",en:"sea",g:"n",cases:["more","mora","moru","more","more","moru","morem"]},
    {nom:"knjiga",en:"book",g:"f",cases:["knjiga","knjige","knjizi","knjigu","knjigo","knjizi","knjigom"]},
    {nom:"prijatelj",en:"friend",g:"m",cases:["prijatelj","prijatelja","prijatelju","prijatelja","prijatelju","prijatelju","prijateljem"]}
  ],
  caseNames:["Nominativ","Genitiv","Dativ","Akuzativ","Vokativ","Lokativ","Instrumental"],
  caseQs:["Tko? Što?","Koga? Čega?","Komu? Čemu?","Koga? Što?","Hej!","Gdje? O čemu?","S kim? Čime?"]
};
// ═══ TONGUE TWISTERS (BRZALICE) ═══
const BRZALICE = [
  {hr:"Na vrh brda vrba mrda.",en:"On the hilltop a willow sways.",focus:"r consonant clusters"},
  {hr:"Četiri čavčića na čunčiću čučeći ciujuču.",en:"Four little jackdaws sitting on a little boat chirp.",focus:"č/ć sounds"},
  {hr:"Riba ribi grize rep.",en:"Fish bites fish\u0027s tail.",focus:"r rolling"},
  {hr:"Petar Petru plete petlju.",en:"Petar weaves a loop for Petar.",focus:"p/t clusters"},
  {hr:"Svaka ptica svome jatu leti.",en:"Every bird flies to its own flock.",focus:"s/v flow"},
  {hr:"Tri trice trista trideset i tri.",en:"Three times three hundred thirty-three.",focus:"tr clusters"},
  {hr:"Griže griže griz grize.",en:"Bite bite, a bite bites.",focus:"ž/z sounds"},
  {hr:"Šešir mi se sašio za šest šestina.",en:"My hat was sewn for six sixths.",focus:"š sound"},
  {hr:"Jure juri, juri Jure.",en:"Jure rushes, rushes Jure.",focus:"j/u rhythm"},
  {hr:"Cvrstčić cvrst cvrke cvrk.",en:"A strong little cricket chirps chirp.",focus:"consonant clusters"}
];
// ═══ REGIONAL DIALECTS ═══
const DIALECTS = {
  intro:"Croatian has three main dialects named after how they say \u0027what\u0027:",
  types:[
    {name:"Štokavski",what:"Što?",region:"Standard Croatian, most of Croatia, all of Bosnia",desc:"The basis for standard Croatian. Used in schools, media, and official settings. If you learn standard Croatian, you\u0027re learning Štokavski.",color:"#0e7490"},
    {name:"Kajkavski",what:"Kaj?",region:"Zagreb and northwestern Croatia (Zagorje)",desc:"Spoken in and around Zagreb. Sounds quite different from standard — shorter words, different intonation. Many Zagreb expressions come from Kajkavski.",color:"#7c3aed"},
    {name:"Čakavski",what:"Ča?",region:"Istria, Kvarner, Dalmatian islands",desc:"The coastal dialect. Heard on islands and in Istria. Has Italian influences and archaic Croatian forms. Very different vocabulary from standard.",color:"#b45309"}
  ],
  examples:[
    {en:"What?",std:"Što?",kaj:"Kaj?",cak:"Ča?"},
    {en:"What are you doing?",std:"Što radiš?",kaj:"Kaj delaš?",cak:"Ča činiš?"},
    {en:"Where?",std:"Gdje?",kaj:"Gde? / Kam?",cak:"Di?"},
    {en:"I don\u0027t know",std:"Ne znam",kaj:"Neznam / Nevem",cak:"Ne znan"},
    {en:"House",std:"Kuća",kaj:"Hiža",cak:"Kaša / Kuća"},
    {en:"Boy",std:"Dječak",kaj:"Deček",cak:"Mulac"},
    {en:"Beautiful",std:"Lijep",kaj:"Lep",cak:"Lip"},
    {en:"Bread",std:"Kruh",kaj:"Kruh",cak:"Kru(h)"}
  ]
};
// ═══ DIMINUTIVES & AUGMENTATIVES ═══
const DIMWORDS = [
  {base:"kuća",dim:"kućica",en:"house → little house",rule:"-ica"},
  {base:"pas",dim:"psić",en:"dog → little dog/puppy",rule:"-ić"},
  {base:"mačka",dim:"mačkica",en:"cat → little cat/kitten",rule:"-ica"},
  {base:"brat",dim:"bratić",en:"brother → little brother",rule:"-ić"},
  {base:"sestra",dim:"sestrica",en:"sister → little sister",rule:"-ica"},
  {base:"mama",dim:"mamica",en:"mom → mommy",rule:"-ica"},
  {base:"tata",dim:"tatica",en:"dad → daddy",rule:"-ica"},
  {base:"sunce",dim:"suncašce",en:"sun → little sun",rule:"-ašce"},
  {base:"cvijet",dim:"cvjetić",en:"flower → little flower",rule:"-ić"},
  {base:"ruka",dim:"ručica",en:"hand → little hand",rule:"-čica"},
  {base:"noga",dim:"nožica",en:"leg → little leg",rule:"-žica"},
  {base:"zvijezda",dim:"zvjezdica",en:"star → little star",rule:"-ica"},
  {base:"ptica",dim:"ptičica",en:"bird → little bird",rule:"-čica"},
  {base:"srce",dim:"srcašce",en:"heart → little heart",rule:"-ašce"},
  {base:"knjiga",dim:"knjižica",en:"book → booklet",rule:"-žica"}
];
// ═══ WORD FORMATION (PREFIX PATTERNS) ═══
const WORDFORM = {
  base:"ići (to go)",
  prefixes:[
    {prefix:"do-",verb:"doći",en:"to come (to arrive at)",ex:"Došao sam kući."},
    {prefix:"iza-",verb:"izaći",en:"to go out / exit",ex:"Izašao je van."},
    {prefix:"u-",verb:"ući",en:"to enter",ex:"Ušla je u sobu."},
    {prefix:"oti-",verb:"otići",en:"to leave / go away",ex:"Otišao je na posao."},
    {prefix:"pro-",verb:"proći",en:"to pass by",ex:"Prošao je pored mene."},
    {prefix:"na-",verb:"naći",en:"to find",ex:"Našao sam ključeve."},
    {prefix:"pri-",verb:"prići",en:"to approach",ex:"Prišla mi je."},
    {prefix:"pre-",verb:"prijeći",en:"to cross over",ex:"Prešao je cestu."},
    {prefix:"za-",verb:"zaći",en:"to go behind / set (sun)",ex:"Sunce je zašlo."},
    {prefix:"ob-",verb:"obići",en:"to go around / visit",ex:"Obišli smo grad."},
    {prefix:"si-",verb:"sići",en:"to go down / descend",ex:"Sišao sam niz stepenice."},
    {prefix:"po-",verb:"poći",en:"to set off / start going",ex:"Pošli smo rano."}
  ],
  otherBases:[
    {base:"pisati (write)",pairs:[["napisati","finish writing"],["prepisati","copy/rewrite"],["ispisati","write out"],["dopisati","add in writing"],["potpisati","sign"],["upisati","enroll/register"]]},
    {base:"raditi (work)",pairs:[["napraviti","make/create"],["preraditi","rework"],["izraditi","produce"],["obraditi","process"],["poraditi","work on"],["zaraditi","earn"]]}
  ]
};
// ═══ COLOR QUIRKS ═══
const COLORQUIRK = [
  {hr:"crno vino",en:"red wine",lit:"black wine",note:"Croatians see dark wine as black, not red"},
  {hr:"plava kosa",en:"blonde hair",lit:"blue hair",note:"Plav originally meant light/fair, which became blonde"},
  {hr:"crni humor",en:"dark humor",lit:"black humor",note:"Same as English here"},
  {hr:"zelena salata",en:"lettuce",lit:"green salad",note:"The vegetable itself, not a mixed salad"},
  {hr:"bijeli luk",en:"garlic",lit:"white onion/garlic",note:"Distinguished from regular luk (onion)"},
  {hr:"plavi čovijek",en:"a shy/timid person",lit:"blue person",note:"Describing someone who blushes easily"},
  {hr:"crna kronika",en:"crime news",lit:"black chronicle",note:"The crime/accident section of newspapers"},
  {hr:"zlatna ribica",en:"goldfish",lit:"golden little fish",note:"Uses diminutive ribica"}
];
// ═══ DAILY CHALLENGE ═══
function getDailyChallenge(){
  // Local date key — resets at midnight user's local time
  var now=new Date();
  var dateKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  // Seeded PRNG (LCG) — fully deterministic per date, different every day
  function hashStr(s){var h=5381;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return h>>>0}
  var _seed=hashStr(dateKey);
  function rand(){_seed=(_seed*1664525+1013904223)>>>0;return _seed/4294967296}
  function ri(n){return Math.floor(rand()*n)}
  function shuf(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=ri(i+1);var t=a[i];a[i]=a[j];a[j]=t}return a}
  // Large hardcoded grammar/culture/translation pool (50+ questions)
  var hard=[
    {q:"Translate: 'I want to learn Croatian.'",a:"Želim učiti hrvatski.",opts:["Želim učiti hrvatski.","Moram učiti hrvatski.","Mogu učiti hrvatski.","Učim hrvatski."]},
    {q:"Translate: 'Where is the pharmacy?'",a:"Gdje je ljekarna?",opts:["Gdje je ljekarna?","Gdje je bolnica?","Gdje je pošta?","Što je ljekarna?"]},
    {q:"Translate: 'I like Croatia.'",a:"Sviđa mi se Hrvatska.",opts:["Sviđa mi se Hrvatska.","Volim Hrvatsku.","Idem u Hrvatsku.","Iz Hrvatske sam."]},
    {q:"Translate: 'Can you help me?'",a:"Možete li mi pomoći?",opts:["Možete li mi pomoći?","Trebam pomoć.","Gdje je pomoć?","Moramo pomoći."]},
    {q:"Translate: 'My children speak Croatian.'",a:"Moja djeca govore hrvatski.",opts:["Moja djeca govore hrvatski.","Moja djeca uče hrvatski.","Moji djeca govori hrvatski.","Moja djeca znaju hrvatski."]},
    {q:"Translate: 'Good morning!'",a:"Dobro jutro!",opts:["Dobro jutro!","Dobar dan!","Dobra večer!","Laku noć!"]},
    {q:"Translate: 'How much does this cost?'",a:"Koliko ovo košta?",opts:["Koliko ovo košta?","Gdje to kupiti?","Što ovo znači?","Kada to dolazi?"]},
    {q:"Translate: 'I am from America.'",a:"Ja sam iz Amerike.",opts:["Ja sam iz Amerike.","Ja idem u Ameriku.","Ja živim u Americi.","Ja volim Ameriku."]},
    {q:"Translate: 'Do you speak English?'",a:"Govorite li engleski?",opts:["Govorite li engleski?","Znate li engleski?","Učite li engleski?","Razumijete li engleski?"]},
    {q:"Translate: 'I don't understand.'",a:"Ne razumijem.",opts:["Ne razumijem.","Ne znam.","Ne mogu.","Ne slušam."]},
    {q:"Translate: 'The sea is beautiful.'",a:"More je lijepo.",opts:["More je lijepo.","Nebo je lijepo.","Grad je lijep.","Sunce je lijepo."]},
    {q:"Translate: 'We are going to Dubrovnik.'",a:"Idemo u Dubrovnik.",opts:["Idemo u Dubrovnik.","Smo u Dubrovniku.","Dolazimo iz Dubrovnika.","Volimo Dubrovnik."]},
    {q:"Translate: 'I am hungry.'",a:"Gladan/Gladna sam.",opts:["Gladan/Gladna sam.","Žedan/Žedna sam.","Umoran/Umorna sam.","Sretan/Sretna sam."]},
    {q:"Translate: 'The train leaves at eight.'",a:"Vlak odlazi u osam.",opts:["Vlak odlazi u osam.","Vlak dolazi u osam.","Bus odlazi u osam.","Vlak staje u osam."]},
    {q:"Translate: 'I love you.'",a:"Volim te.",opts:["Volim te.","Sviđaš mi se.","Trebam te.","Poznajem te."]},
    {q:"Translate: 'See you tomorrow!'",a:"Vidimo se sutra!",opts:["Vidimo se sutra!","Do sutra!","Sutra dolazim.","Sutra idemo."]},
    {q:"Translate: 'The coffee is hot.'",a:"Kava je vruća.",opts:["Kava je vruća.","Kava je hladna.","Kava je dobra.","Kava je slatka."]},
    {q:"Translate: 'Happy birthday!'",a:"Sretan rođendan!",opts:["Sretan rođendan!","Sretan Božić!","Sretna Nova godina!","Čestitam!"]},
    {q:"Conjugate: ja + pisati (present)",a:"pišem",opts:["pišem","pisam","pišim","pisem"]},
    {q:"Conjugate: oni + ići (present)",a:"idu",opts:["idu","iću","idem","idaju"]},
    {q:"Conjugate: mi + voljeti (present)",a:"volimo",opts:["volimo","volimu","volemo","voljemo"]},
    {q:"Conjugate: ona + jesti (past)",a:"jela je",opts:["jela je","jeo je","jelo je","jeli je"]},
    {q:"Conjugate: ja + čitati (future)",a:"čitat ću",opts:["čitat ću","čitam ću","čitati ću","čitaću"]},
    {q:"Conjugate: ti + gledati (present)",a:"gledaš",opts:["gledaš","gledate","gleda","gledamo"]},
    {q:"Conjugate: vi + raditi (present)",a:"radite",opts:["radite","radimo","rade","radiste"]},
    {q:"Conjugate: on + htjeti (present)",a:"hoće",opts:["hoće","hoći","hoćem","hoćeš"]},
    {q:"Conjugate: ja + moći (present)",a:"mogu",opts:["mogu","moći","možem","mognjem"]},
    {q:"Conjugate: mi + znati (present)",a:"znamo",opts:["znamo","znademo","znate","znaju"]},
    {q:"Conjugate: ona + doći (past)",a:"došla je",opts:["došla je","došao je","došlo je","dolazi"]},
    {q:"Conjugate: ja + biti (present)",a:"jesam / sam",opts:["jesam / sam","jeste","jest","smo"]},
    {q:"Put 'knjiga' in Accusative:",a:"knjigu",opts:["knjigu","knjige","knjizi","knjigo"]},
    {q:"Put 'grad' in Locative (u ___):",a:"gradu",opts:["gradu","grada","grade","gradom"]},
    {q:"Put 'prijatelj' in Instrumental (s ___):",a:"prijateljem",opts:["prijateljem","prijatelja","prijatelju","prijatelje"]},
    {q:"Put 'žena' in Dative:",a:"ženi",opts:["ženi","ženu","žene","ženom"]},
    {q:"Put 'more' in Genitive:",a:"mora",opts:["mora","moru","morom","more"]},
    {q:"Put 'kuća' in Accusative:",a:"kuću",opts:["kuću","kuće","kući","kućom"]},
    {q:"Put 'auto' in Locative (u ___):",a:"autu",opts:["autu","auta","autom","autima"]},
    {q:"Put 'dijete' in Genitive:",a:"djeteta",opts:["djeteta","djetetu","dijete","djetetom"]},
    {q:"Put 'sin' in Dative:",a:"sinu",opts:["sinu","sina","sinom","sini"]},
    {q:"Put 'ruka' in Instrumental (s ___):",a:"rukom",opts:["rukom","ruku","ruke","ruci"]},
    {q:"'Nemam' means:",a:"I don't have",opts:["I don't have","I'm not","I can't","I don't want"]},
    {q:"'Trebam' means:",a:"I need",opts:["I need","I have","I want","I must"]},
    {q:"'Mogu' means:",a:"I can",opts:["I can","I want","I go","I know"]},
    {q:"'Idem kući' means:",a:"I'm going home",opts:["I'm going home","I'm at home","I came home","My house"]},
    {q:"'Kako si?' means:",a:"How are you? (informal)",opts:["How are you? (informal)","What is your name?","Where are you?","Who are you?"]},
    {q:"'Odakle si?' means:",a:"Where are you from?",opts:["Where are you from?","Where are you going?","Where do you live?","Where were you?"]},
    {q:"What gender is 'more' (sea)?",a:"Neuter",opts:["Neuter","Masculine","Feminine","Both"]},
    {q:"What gender is 'prijatelj' (male friend)?",a:"Masculine",opts:["Masculine","Feminine","Neuter","Variable"]},
    {q:"What gender is 'knjiga' (book)?",a:"Feminine",opts:["Feminine","Masculine","Neuter","Variable"]},
    {q:"What gender is 'selo' (village)?",a:"Neuter",opts:["Neuter","Masculine","Feminine","Variable"]},
    {q:"Croatian has how many grammatical cases?",a:"7",opts:["7","6","5","8"]},
    {q:"Which pronoun means 'we'?",a:"mi",opts:["mi","vi","oni","ono"]},
    {q:"Which pronoun means 'they' (mixed/masc)?",a:"oni",opts:["oni","one","ona","ono"]},
    {q:"'Doviđenja' means:",a:"Goodbye",opts:["Goodbye","Hello","Thank you","Please"]},
    {q:"'Hvala' means:",a:"Thank you",opts:["Thank you","Please","Sorry","Welcome"]},
    {q:"'Molim' means:",a:"Please / You're welcome",opts:["Please / You're welcome","Thank you","Sorry","Excuse me"]},
    {q:"'Oprosti' means:",a:"Sorry (informal)",opts:["Sorry (informal)","Thank you","Please","Goodbye"]},
    {q:"The Croatian word for 'island' is:",a:"otok",opts:["otok","rijeka","jezero","more"]},
    {q:"'Lijepa naša' is the Croatian:",a:"National anthem",opts:["National anthem","National dish","Currency","Flag design"]},
    {q:"Which case follows the preposition 'u' (location)?",a:"Locative",opts:["Locative","Accusative","Genitive","Dative"]},
    {q:"Which case follows the preposition 'u' (movement)?",a:"Accusative",opts:["Accusative","Locative","Genitive","Instrumental"]},
    {q:"The aspect 'svršeni' (perfective) expresses:",a:"Completed action",opts:["Completed action","Ongoing action","Habitual action","Future wish"]},
    {q:"'Što' means:",a:"What",opts:["What","Who","Where","When"]},
    {q:"'Tko' means:",a:"Who",opts:["Who","What","Where","Which"]},
    {q:"'Kada' means:",a:"When",opts:["When","Where","Why","How"]},
    {q:"'Zašto' means:",a:"Why",opts:["Why","When","How","Where"]},
    {q:"'Koliko' means:",a:"How many / How much",opts:["How many / How much","How long","How far","How often"]},
    {q:"The diminutive suffix '-ica' makes a word:",a:"Smaller / more endearing",opts:["Smaller / more endearing","Larger","Plural","Negative"]},
    {q:"'Baka' means:",a:"Grandmother",opts:["Grandmother","Grandfather","Aunt","Mother"]},
    {q:"'Djed' means:",a:"Grandfather",opts:["Grandfather","Grandmother","Uncle","Father"]},
    {q:"Capital city of Croatia:",a:"Zagreb",opts:["Zagreb","Split","Rijeka","Osijek"]},
    {q:"The Adriatic coast of Croatia is in which region?",a:"Dalmatia & Istria",opts:["Dalmatia & Istria","Slavonia","Zagorje","Baranja"]},
    {q:"Croatian currency is:",a:"Euro (EUR)",opts:["Euro (EUR)","Kuna","Dinar","Kruna"]},
  ];
  // Generate vocab questions dynamically from vocabulary data V (seeded per day)
  var allWords=[];
  Object.keys(V).forEach(function(cat){V[cat].forEach(function(w){if(w[0]&&w[1])allWords.push(w)})});
  var vocabQs=[];
  if(allWords.length>10){
    var used=new Set();
    for(var attempt=0;attempt<30&&vocabQs.length<30;attempt++){
      var vi=ri(allWords.length);
      if(used.has(vi))continue;
      used.add(vi);
      var word=allWords[vi];
      var wrongs=[];var wAttempts=0;var wUsed=new Set([vi]);
      while(wrongs.length<3&&wAttempts<120){
        var wi=ri(allWords.length);wAttempts++;
        if(!wUsed.has(wi)&&allWords[wi][1]!==word[1]){wUsed.add(wi);wrongs.push(allWords[wi])}
      }
      if(wrongs.length<3)continue;
      var dir=rand()<0.5;
      if(dir){
        vocabQs.push({q:"What does '"+word[0]+"' mean?",a:word[1],opts:shuf([word[1],wrongs[0][1],wrongs[1][1],wrongs[2][1]])});
      } else {
        vocabQs.push({q:"How do you say '"+word[1]+"' in Croatian?",a:word[0],opts:shuf([word[0],wrongs[0][0],wrongs[1][0],wrongs[2][0]])});
      }
    }
  }
  // Combine pools and pick THREE distinct challenges using the seeded RNG
  var pool=hard.concat(vocabQs);
  var challenges=[];var usedIdx=new Set();
  for(var attempt=0;attempt<pool.length*3&&challenges.length<3;attempt++){
    var idx=ri(pool.length);
    if(!usedIdx.has(idx)){usedIdx.add(idx);challenges.push(pool[idx]);}
  }
  // Fallback: fill if pool too small
  while(challenges.length<3)challenges.push(pool[ri(pool.length)]);
  return{dateKey:dateKey,challenges:challenges};
}
// ═══ PADEŽI JEDNINA & MNOŽINA (SINGULAR & PLURAL CASES) ═══
const PADEZI_FULL = {
  title:"Pade\u017ei \u2014 Jednina i Mno\u017eina",
  subtitle:"Singular & Plural Noun Endings Across All 7 Cases",
  singEndings:{
    f:{label:"\u017denski rod (Feminine -a)",endings:["a","e","i","u","o","i","om"],
      words:[
        {nom:"ku\u0107a",en:"house",forms:["ku\u0107a","ku\u0107e","ku\u0107i","ku\u0107u","ku\u0107o","ku\u0107i","ku\u0107om"]},
        {nom:"voda",en:"water",forms:["voda","vode","vodi","vodu","vodo","vodi","vodom"]},
        {nom:"sestra",en:"sister",forms:["sestra","sestre","sestri","sestru","sestro","sestri","sestrom"]},
        {nom:"rijeka",en:"river",forms:["rijeka","rijeke","rijeci","rijeku","rijeko","rijeci","rijekom"]},
        {nom:"majica",en:"T-shirt",forms:["majica","majice","majici","majicu","majice","majici","majicom"]}
      ],
      exs:["Ovo je ku\u0107a. (Nom)","Nema vode. (Gen)","Idem prema ku\u0107i. (Dat)","Vidim ku\u0107u. (Akuz)","Hej, ku\u0107o! (Vok)","Živim u ku\u0107i. (Lok)","Zadovoljan sam s ku\u0107om. (Instr)"]
    },
    n:{label:"Srednji rod (Neuter -o/-e)",endings:["o/e","a","u","o/e","o/e","u","om/em"],
      words:[
        {nom:"more",en:"sea",forms:["more","mora","moru","more","more","moru","morem"]},
        {nom:"ra\u010dunalo",en:"computer",forms:["ra\u010dunalo","ra\u010dunala","ra\u010dunalu","ra\u010dunalo","ra\u010dunalo","ra\u010dunalu","ra\u010dunalom"]},
        {nom:"mlijeko",en:"milk",forms:["mlijeko","mlijeka","mlijeku","mlijeko","mlijeko","mlijeku","mlijekom"]},
        {nom:"selo",en:"village",forms:["selo","sela","selu","selo","selo","selu","selom"]},
        {nom:"jezero",en:"lake",forms:["jezero","jezera","jezeru","jezero","jezero","jezeru","jezerom"]}
      ],
      exs:["Ovo je more. (Nom)","Nema ra\u010dunala. (Gen)","Idem prema moru. (Dat)","Vidim more. (Akuz)","Hej, more! (Vok)","Pri\u010dam o ra\u010dunalu. (Lok)","Plovim morem. (Instr)"]
    },
    m:{label:"Mu\u0161ki rod (Masculine -consonant)",endings:["\u2205","a","u","a/\u2205","e","u","om"],
      words:[
        {nom:"brat",en:"brother",forms:["brat","brata","bratu","brata","brate","bratu","bratom"]},
        {nom:"susjed",en:"neighbor",forms:["susjed","susjeda","susjedu","susjeda","susjede","susjedu","susjedom"]},
        {nom:"bicikl",en:"bicycle",forms:["bicikl","bicikla","biciklu","bicikl","bicikle","biciklu","biciklom"]},
        {nom:"grad",en:"city",forms:["grad","grada","gradu","grad","grade","gradu","gradom"]},
        {nom:"Zagreb",en:"Zagreb",forms:["Zagreb","Zagreba","Zagrebu","Zagreb","Zagrebe","Zagrebu","Zagrebom"]}
      ],
      exs:["Ovo je moj brat. (Nom)","Nema bicikla. (Gen)","Dao sam klju\u010d susjedu. (Dat)","Imam brata. (Akuz \u2014 animate!)","Hej, brate! (Vok)","Živim u Zagrebu. (Lok)","Idem u grad s bratom. (Instr)"],
      note:"Akuzativ: \u017divo bi\u0107e (animate) = Genitiv form (-a). Ne\u017eivo (inanimate) = Nominativ form (\u2205)."
    }
  },
  plurEndings:{
    f:{label:"\u017denski rod \u2014 Mno\u017eina",endings:["e","a","ama","e","e","ama","ama"],
      adjEnd:["e","ih","im","e","e","im","im"],
      words:[
        {nom:"ku\u0107e",en:"houses",adj:"nove",forms:["nove ku\u0107e","novih ku\u0107a","novim ku\u0107ama","nove ku\u0107e","nove ku\u0107e","novim ku\u0107ama","novim ku\u0107ama"]},
        {nom:"zgrade",en:"buildings",adj:"velike",forms:["velike zgrade","velikih zgrada","velikim zgradama","velike zgrade","velike zgrade","velikim zgradama","velikim zgradama"]},
        {nom:"majice",en:"T-shirts",adj:"moderne",forms:["moderne majice","modernih majica","modernim majicama","moderne majice","moderne majice","modernim majicama","modernim majicama"]}
      ]
    },
    n:{label:"Srednji rod \u2014 Mno\u017eina",endings:["a","a","ima","a","a","ima","ima"],
      adjEnd:["a","ih","im","a","a","im","im"],
      words:[
        {nom:"jezera",en:"lakes",adj:"velika",forms:["velika jezera","velikih jezera","velikim jezerima","velika jezera","velika jezera","velikim jezerima","velikim jezerima"]},
        {nom:"ra\u010dunala",en:"computers",adj:"nova",forms:["nova ra\u010dunala","novih ra\u010dunala","novim ra\u010dunalima","nova ra\u010dunala","nova ra\u010dunala","novim ra\u010dunalima","novim ra\u010dunalima"]}
      ]
    },
    m:{label:"Mu\u0161ki rod \u2014 Mno\u017eina",endings:["i/-ovi","a/-ova","ima","e/-ove","i","ima","ima"],
      adjEnd:["i","ih","im","e","i","im","im"],
      words:[
        {nom:"susjedi",en:"neighbors",adj:"novi",forms:["novi susjedi","novih susjeda","novim susjedima","nove susjede","novi susjedi","novim susjedima","novim susjedima"]},
        {nom:"satovi",en:"watches",adj:"skupi",forms:["skupi satovi","skupih satova","skupim satovima","skupe satove","skupi satovi","skupim satovima","skupim satovima"]},
        {nom:"gradovi",en:"cities",adj:"zanimljivi",forms:["zanimljivi gradovi","zanimljivih gradova","zanimljivim gradovima","zanimljive gradove","zanimljivi gradovi","zanimljivim gradovima","zanimljivim gradovima"]}
      ]
    }
  },
  caseNames:["Nominativ","Genitiv","Dativ","Akuzativ","Vokativ","Lokativ","Instrumental"],
  caseQs:["Tko? \u0160to?","Koga? \u010cega?","Komu? \u010cemu?","Koga? \u0160to?","Hej!","Gdje? O \u010demu?","S kim? \u010cime?"],
  quiz:[
    {sentence:"Nema ___.",base:"voda",answer:"vode",caseName:"Genitiv",en:"There is no water.",opts:["vode","vodi","vodom","vodu"]},
    {sentence:"Idem prema ___.",base:"ku\u0107a",answer:"ku\u0107i",caseName:"Dativ",en:"I\u0027m going towards the house.",opts:["ku\u0107i","ku\u0107u","ku\u0107e","ku\u0107om"]},
    {sentence:"Vidim ___.",base:"brat",answer:"brata",caseName:"Akuzativ",en:"I see my brother.",opts:["brata","bratu","bratom","brate"]},
    {sentence:"\u017divim u ___.",base:"grad",answer:"gradu",caseName:"Lokativ",en:"I live in the city.",opts:["gradu","grada","gradom","grade"]},
    {sentence:"Idem s ___.",base:"sestra",answer:"sestrom",caseName:"Instrumental",en:"I\u0027m going with my sister.",opts:["sestrom","sestru","sestre","sestri"]},
    {sentence:"Hej, ___!",base:"brat",answer:"brate",caseName:"Vokativ",en:"Hey, brother!",opts:["brate","brata","bratu","bratom"]},
    {sentence:"Plovim ___.",base:"more",answer:"morem",caseName:"Instrumental",en:"I\u0027m sailing the sea.",opts:["morem","mora","moru","more"]},
    {sentence:"Nema ___.",base:"mlijeko",answer:"mlijeka",caseName:"Genitiv",en:"There is no milk.",opts:["mlijeka","mlijeku","mlijekom","mlijeko"]},
    {sentence:"Pri\u010dam o ___.",base:"ra\u010dunalo",answer:"ra\u010dunalu",caseName:"Lokativ",en:"I\u0027m talking about the computer.",opts:["ra\u010dunalu","ra\u010dunala","ra\u010dunalom","ra\u010dunalo"]},
    {sentence:"Dao sam klju\u010d ___.",base:"susjed",answer:"susjedu",caseName:"Dativ",en:"I gave the key to the neighbor.",opts:["susjedu","susjeda","susjedom","susjede"]},
    {sentence:"Imam ___.",base:"bicikl",answer:"bicikl",caseName:"Akuzativ",en:"I have a bicycle. (inanimate!)",opts:["bicikl","bicikla","biciklu","biciklom"]},
    {sentence:"Nema novih ___.",base:"ku\u0107e (pl)",answer:"ku\u0107a",caseName:"Genitiv",en:"There are no new houses.",opts:["ku\u0107a","ku\u0107e","ku\u0107ama","ku\u0107i"]},
    {sentence:"Idem prema novim ___.",base:"susjedi (pl)",answer:"susjedima",caseName:"Dativ",en:"I go towards new neighbors.",opts:["susjedima","susjeda","susjede","susjedi"]},
    {sentence:"Vidim nove ___.",base:"susjedi (pl)",answer:"susjede",caseName:"Akuzativ",en:"I see new neighbors.",opts:["susjede","susjedi","susjeda","susjedima"]},
    {sentence:"Pri\u010dam o velikim ___.",base:"jezera (pl)",answer:"jezerima",caseName:"Lokativ",en:"I talk about big lakes.",opts:["jezerima","jezera","jezere","jezerima"]},
    {sentence:"Zadovoljan sam s modernim ___.",base:"majice (pl)",answer:"majicama",caseName:"Instrumental",en:"I\u0027m satisfied with modern T-shirts.",opts:["majicama","majice","majica","majici"]},
    {sentence:"Ljudi kupuju skupe ___.",base:"satovi (pl)",answer:"satove",caseName:"Akuzativ",en:"People buy expensive watches.",opts:["satove","satovi","satova","satovima"]},
    {sentence:"Ovdje nema velikih ___.",base:"jezera (pl)",answer:"jezera",caseName:"Genitiv",en:"There are no big lakes here.",opts:["jezera","jezerima","jezere","jezero"]},
    {sentence:"Razgovaram s novim ___.",base:"susjedi (pl)",answer:"susjedima",caseName:"Instrumental",en:"I\u0027m talking with new neighbors.",opts:["susjedima","susjede","susjedi","susjeda"]},
    {sentence:"Ljudi žive u novim ___.",base:"kuće (pl)",answer:"kućama",caseName:"Lokativ",en:"People live in new houses.",opts:["kućama","kuća","kuće","kući"]}
  ]
};
// ═══ SCHOOL SURVIVAL KIT ═══
const SCHOOL = {
  grading:{title:"Croatian Grading (1-5)",desc:"5=odličan (excellent), 4=vrlo dobar (very good), 3=dobar (good), 2=dovoljan (sufficient), 1=nedovoljan (fail). Opposite of US!"},
  classroom:[["udžbenik","textbook"],["bilježnica","notebook"],["olovka","pencil"],["gumica","eraser"],["ruksak","backpack"],["raspored","schedule"],["ocjena","grade"],["zadatak","assignment"],["domaća zadaća","homework"],["ispit","exam"],["sat","class/period"],["odmor","break/recess"],["učionica","classroom"],["ploča","blackboard"],["računalo","computer"],["učitelj/učiteljica","teacher (m/f)"],["ravnatelj","principal"],["razred","grade/class"],["svjedočba","report card"],["izostanak","absence"]],
  subjects:[["matematika","math"],["hrvatski jezik","Croatian"],["engleski jezik","English"],["biologija","biology"],["kemija","chemistry"],["fizika","physics"],["povijest","history"],["geografija","geography"],["glazbeni","music"],["likovni","art"],["tjelesni","PE/gym"],["informatika","IT"],["vjeronauk","religion"]],
  phrases:[["Mogu li ići na WC?","Can I go to the bathroom?"],["Oprostite, ne razumijem.","Sorry, I don't understand."],["Možete li ponoviti?","Can you repeat?"],["Kako se to kaže na hrvatskom?","How do you say that in Croatian?"],["Imam pitanje.","I have a question."],["Koji sat imamo sljedeći?","What class next?"],["Kada je odmor?","When is break?"],["Možete li mi pomoći?","Can you help me?"]],
  formal:"Always use 'Vi' (formal) with teachers. Say 'Dobar dan' entering, 'Dovidenja' leaving. Stand when teacher enters."
};
const TEXTING = [{slang:"di si?",means:"Where are you?",ctx:"Most common greeting"},{slang:"ej / ej bok",means:"Hey",ctx:"Casual opener"},{slang:"ajde",means:"Come on / Let's go",ctx:"Used constantly"},{slang:"ajmo",means:"Let's go (group)",ctx:"Inviting friends"},{slang:"nmvz",means:"Nema veze = No worries",ctx:"Text abbreviation"},{slang:"nzm",means:"Ne znam = IDK",ctx:"Text abbreviation"},{slang:"ful",means:"Very/Really",ctx:"'Ful je dobro'"},{slang:"kul",means:"Cool",ctx:"Borrowed from English"},{slang:"stv?",means:"Stvarno? = Really?",ctx:"Surprise"},{slang:"ekipa",means:"The crew/squad",ctx:"Friend group"},{slang:"ma daj",means:"Oh come on",ctx:"Disbelief"},{slang:"sve pet",means:"All good",ctx:"Everything's fine"},{slang:"čujemo se",means:"Talk soon",ctx:"Phone/text goodbye"},{slang:"vidimo se",means:"See you",ctx:"In-person goodbye"},{slang:"pošalji lokaciju",means:"Send location",ctx:"Meeting up"}];
const FRIENDS = [{hr:"Ej, ja sam [name]. Ti?",en:"Hey, I'm [name]. You?"},{hr:"Koji razred si?",en:"What grade are you in?"},{hr:"Imaš li Instagram?",en:"Do you have Instagram?"},{hr:"Igrate li basket?",en:"Do you play basketball?"},{hr:"Hoćeš sjesti s nama?",en:"Want to sit with us?"},{hr:"Idemo van na odmoru?",en:"Going outside for break?"},{hr:"Došao sam iz Amerike.",en:"I came from America."},{hr:"Još učim hrvatski, oprosti.",en:"Still learning Croatian, sorry."},{hr:"Možeš li mi pomoći?",en:"Can you help me with this?"},{hr:"Hoćemo na sladoled?",en:"Want ice cream?"},{hr:"Koji ti je najdraži predmet?",en:"Favorite subject?"},{hr:"Ideš li na trening?",en:"Going to practice?"},{hr:"Dodaj me na Insta.",en:"Add me on Insta."}];
const FOODORDER = {
  bakery:{title:"U Pekari",items:[["burek sa sirom","cheese burek"],["burek s mesom","meat burek"],["pizza kriška","pizza slice"],["kroasan","croissant"],["kifla","roll"],["kruh","bread"]],phrases:["Dajte mi jedan burek, molim.","Koliko košta?","To je sve, hvala."]},
  fastfood:{title:"Ćevapdžinica",items:[["ćevapi","grilled sausages"],["pljeskavica","burger patty"],["ražnjići","skewers"],["pomfrit","fries"],["lepinja","flatbread"],["ajvar","pepper spread"]],phrases:["Molim deset ćevapa u lepinji.","S ajvarom i lukom.","Za van.","Za ovdje."]},
  icecream:{title:"Sladoled",items:[["čokolada","chocolate"],["vanilija","vanilla"],["jagoda","strawberry"],["pistacija","pistachio"],["limun","lemon"],["šumsko voće","forest fruit"]],phrases:["Mogu dva kuglice?","U kornetu ili čašici?","Kornet, molim."]},
  restaurant:{phrases:[["Račun, molim.","Bill please."],["Mogu li platiti karticom?","Can I pay by card?"],["Dnevni meni, molim.","Daily menu please."],["Što preporučate?","What do you recommend?"],["Alergican sam na...","I'm allergic to..."]],tip:"Tipping: not mandatory, 10% appreciated. Round up or leave small change."}
};
const TRANSPORT = [{hr:"Gdje je autobusna stanica?",en:"Where is the bus station?"},{hr:"Ide li ovaj bus do centra?",en:"Does this bus go to center?"},{hr:"Jednu kartu, molim.",en:"One ticket please."},{hr:"Koja je sljedeća stanica?",en:"What's the next stop?"},{hr:"Gdje moram sići?",en:"Where do I get off?"},{hr:"Trebam presjedati?",en:"Do I need to transfer?"},{hr:"Možete me odvesti do...?",en:"Can you take me to...? (taxi)"},{hr:"Koliko košta do aerodroma?",en:"How much to the airport?"},{hr:"Tramvaj broj pet.",en:"Tram number five."},{hr:"Zadržite ostatak.",en:"Keep the change."}];
const EMERGENCY = {
  number:"112 — Hitna pomoć (Emergency)",
  phrases:[["Trebam pomoć!","I need help!"],["Zovite hitnu!","Call ambulance!"],["Boli me glava.","Head hurts."],["Boli me stomak.","Stomach hurts."],["Imam temperaturu.","I have fever."],["Slomio sam ruku.","I broke my arm."],["Alergican sam na...","I'm allergic to..."],["Gdje je najbliža bolnica?","Nearest hospital?"],["Gdje je ljekarna?","Where's pharmacy?"],["Ne osjećam se dobro.","I don't feel well."],["Možete li nazvati roditelje?","Call my parents?"]],
  bodyParts:[["glava","head"],["oko","eye"],["uho","ear"],["nos","nose"],["zub","tooth"],["grlo","throat"],["leđa","back"],["ruka","arm"],["noga","leg"],["stomak","stomach"],["prsa","chest"],["koljeno","knee"]],
  phoneNumbers:[["112","Emergency"],["192","Police"],["193","Fire"],["194","Ambulance"]]
};
const FOOTBALL = {
  vocab:[["gol","goal"],["lopta","ball"],["sudac","referee"],["korner","corner"],["jedanaesterac","penalty"],["poluvrijeme","half-time"],["golman","goalkeeper"],["napadač","striker"],["veznjak","midfielder"],["navijači","fans"],["utakmica","match"],["prvenstvo","championship"],["liga","league"],["derbi","derby"]],
  teams:[{name:"Dinamo Zagreb",desc:"Most successful Croatian club. 24+ titles.",color:"#003da5"},{name:"Hajduk Split",desc:"The people's club. Passionate Torcida ultras.",color:"#1e3a5f"},{name:"Vatreni",desc:"National team. 2018 WC finalists, 2022 3rd place!",color:"#dc2626"},{name:"Rijeka",desc:"Strong coastal club.",color:"#1e3a5f"}],
  waterPolo:[["vaterpolo","water polo"],["bazen","pool"],["golman","goalkeeper"],["igrač","player"],["Jug Dubrovnik","Top Croatian WP club"],["Mladost Zagreb","Historic WP powerhouse"]]
};
const POPCULTURE = [{name:"Baby Lasagna",desc:"Eurovision star! Gen-Z favorite",web:"https://m.youtube.com/results?search_query=baby+lasagna+rim+tim+tagi+dim",icon:"⭐"},{name:"Gibonni",desc:"Legendary singer from Split",web:"https://m.youtube.com/results?search_query=gibonni+najbolje+pjesme",icon:"🎵"},{name:"Oliver Dragojević",desc:"The voice of Dalmatia",web:"https://m.youtube.com/results?search_query=oliver+dragojevic+beste",icon:"🎵"},{name:"Severina",desc:"Croatian pop queen",web:"https://m.youtube.com/results?search_query=severina+hitovi",icon:"🎵"},{name:"Prljavo Kazalište",desc:"Iconic Croatian rock",web:"https://m.youtube.com/results?search_query=prljavo+kazaliste",icon:"🎸"},{name:"Magazin",desc:"Popular pop band",web:"https://m.youtube.com/results?search_query=magazin+bend",icon:"🎵"},{name:"Hladno Pivo",desc:"Punk/rock from Zagreb",web:"https://m.youtube.com/results?search_query=hladno+pivo+hitovi",icon:"🎸"},{name:"Daleka Obala",desc:"Split rock legends",web:"https://m.youtube.com/results?search_query=daleka+obala",icon:"🎸"},{name:"Let 3",desc:"Art-rock, Eurovision 2023",web:"https://m.youtube.com/results?search_query=let+3+mama+sc",icon:"🤘"},{name:"Supertalent HR",desc:"Croatian Got Talent",web:"https://m.youtube.com/results?search_query=supertalent+hrvatska",icon:"📺"}];
const PRACTICAL = {
  oib:{title:"OIB — Osobni identifikacijski broj",desc:"Personal ID number (like SSN). 11 digits. Needed for EVERYTHING: bank, school, doctor, phone. Get at police station (MUP)."},
  mbo:{title:"MBO — Matični broj osiguranika",desc:"Health insurance number. Get from HZZO. Required for doctor visits."},
  documents:[["osobna iskaznica","ID card"],["putovnica","passport"],["boravak","residence permit"],["prijava boravišta","address registration"],["zdravstvena iskaznica","health card"],["IBAN","bank account"]],
  customs:[{rule:"Birthday treats",desc:"Birthday PERSON buys treats for everyone — not the other way around!"},{rule:"Name days",desc:"Croatians celebrate saint's name day. 'Sretan imendan!'"},{rule:"Home visits",desc:"Bring wine/cake/flowers. Shoes off. You WILL be fed. Refusing is rude."},{rule:"Greeting",desc:"Kiss both cheeks (friends). Handshake (formal). Say 'Dobar dan' in shops."},{rule:"Sunday",desc:"Most shops CLOSED on Sundays. Grocery shop Saturday."},{rule:"Kava culture",desc:"'Ići na kavu' can last 2 hours. It's socializing, not just caffeine."},{rule:"Bura & Jugo",desc:"Bura=cold north wind. Jugo=warm south wind everyone blames for tiredness."},{rule:"Fjaka",desc:"Dalmatian art of doing nothing. Not laziness — it's a lifestyle."}],
  schoolCalendar:"School: Sept to mid-June. Christmas break (2wks), semester (Feb 1wk), Easter (1wk), summer (late June-early Sept).",
  phoneNumbers:[["112","Emergency"],["192","Police"],["193","Fire"],["194","Ambulance"]]
};
// ═══ REGIONAL HISTORY ═══
const REGIONS = {
  labin:{
    title:"Labin & Rabac",sub:"Your New Home — Istria",color:"#0e7490",icon:"⛵",
    intro:"Labin is a medieval hilltop town in Istria with 3,000 years of continuous habitation, a revolutionary mining heritage, and one of Europe's most distinctive Chakavian dialects. Below it, Rabac is among the Adriatic's most beautiful bays.",
    sections:[
      {h:"Ancient Origins & Liburnians",t:"Before Rome, Labin was a Liburnian settlement — the Liburni were master seafarers who traded across the Adriatic. The name 'Albona' predates Latin, likely from Proto-Indo-European meaning 'hill.' Roman conquest came around 177 BC. Emperor Philip the Arab elevated Albona to full Roman municipality status with elected magistrates, its own treasury, and public baths. Archaeological finds include a 3rd-century BC necropolis and Roman villa foundations still visible beneath the old town."},
      {h:"Under the Republic of Venice (1420–1797)",t:"For 377 years, Labin was a loyal subject of the Serenissima. Venice brought Renaissance architecture — the Loggia, Palazzo Scampicchio, Battiala-Lazzarini Palace — and a thriving merchant economy based on olive oil, wine, and coal. The town walls, the Lion of St. Mark above the city gate, and the ornate wells in the squares are all Venetian legacies. Coal mining began in earnest under Venetian rule, foreshadowing the industrial century to come."},
      {h:"The Labin Republic — Europe's First Anti-Fascist Uprising (1921)",t:"On March 2, 1921, just months after Mussolini's Fascists had begun their violent rise, Labin's coal miners made history. When fascist squads attacked the Workers' Committee, miners of all nationalities — Croats, Italians, Slovenes, Czechs, Hungarians, Poles — united. They seized the mines, organized a workers' council, expelled the mine management, and declared the Labinska Republika. Led by secretary Giovanni Pippan and miner Giusto Massarotto, they ran full coal production democratically for 37 days. Italian army and carabinieri crushed the uprising on April 8. All 52 miners tried in Pula were acquitted. Today Labin proudly calls itself 'the first anti-fascist city in Europe.'"},
      {h:"Coal, WWII & Italian Fascism",t:"Under Italian rule (1918-1943), Istrian Croats faced systematic cultural erasure — Croatian schools closed, Croatian names Italianized, public use of Croatian forbidden. During WWII, Labin's miners were among the most organized resistance fighters in Istria. The Italian and Yugoslav partisan movements cooperated in sabotaging production for the Nazi war effort. After the war, the Istrian Exodus (1943-1960) saw 200,000-350,000 Italians and many Croats leave Istria under Yugoslav pressure — one of Europe's least-discussed post-war tragedies."},
      {h:"Mining Heritage & Museum",t:"Coal mining was Labin's lifeblood for centuries. At peak production four mines operated simultaneously employing thousands. The last mine closed in 1989 after 80 years of continuous operation. Today the Labin City Museum contains a real 150-meter mine tunnel with original equipment, carved through the rock beneath the baroque Battiala-Lazzarini palace. Lonely Planet ranked it among Croatia's 10 most original museums. The Šoht mining tower and the Pijacal workers' complex are protected industrial heritage. The miners' folk memory is alive in local festivals and dialect songs."},
      {h:"Rabac — From Fishing Village to Adriatic Jewel",t:"Rabac was a simple fishing settlement below Labin until 1912, when an Austrian entrepreneur recognized its sheltered bay and crystal-clear water as perfect for a health spa. By the 1930s it had grown to a proper seaside resort. Under Yugoslavia, Rabac became a major tourism destination with modern hotels. Today its 4km of coastline includes several Blue Flag beaches. The bay's visibility reaches 30 meters — a diver's paradise. Views extend to the islands of Cres, Lošinj, and Krk. The Kvarner Gulf's clean Bora wind and mild Mediterranean climate make it extraordinary."},
      {h:"Labin Art Express & Culture Today",t:"Since 1989, Labin has reinvented itself as a center of alternative arts and culture. The Labin Art Express festival transforms the old town every summer into an open-air gallery with 150+ artists. The narrow Renaissance streets fill with installations, performances, and workshops. The town has attracted painters, sculptors, and musicians who have restored old stone houses into studios. It's a rare example of a post-industrial town that chose creativity over decline."}
    ],
    timeline:[
      {year:"~1200 BC",event:"Liburnian tribal settlement on the hilltop, trading pottery and amber across the Adriatic"},
      {year:"177 BC",event:"Roman conquest. Settlement becomes Albona, a Roman municipality with baths, forum, and walls"},
      {year:"539 AD",event:"Byzantine Empire takes Istria after the fall of the Western Roman Empire"},
      {year:"788 AD",event:"Frankish King Charlemagne absorbs Istria into the Carolingian Empire"},
      {year:"1420",event:"Republic of Venice takes Labin. 377 years of Venetian rule begin. Renaissance architecture flourishes"},
      {year:"1520",event:"Matthias Flacius Illyricus born in Labin — becomes Martin Luther's closest intellectual ally"},
      {year:"1797",event:"Napoleon dissolves Venice. Labin passes to Habsburg Austria after the Treaty of Campo Formio"},
      {year:"1888",event:"Josip Belušić, born near Labin, patents the world's first electric speedometer in Vienna"},
      {year:"1918",event:"After WWI, Italy annexes Istria. Croatian schools close. Names forcibly Italianized"},
      {year:"Mar 2, 1921",event:"LABIN REPUBLIC DECLARED — 800 miners seize the mines. Europe's first anti-fascist uprising"},
      {year:"Apr 8, 1921",event:"Italian army suppresses the republic. 52 miners tried and all acquitted"},
      {year:"1943",event:"Italy surrenders. Partisan resistance intensifies. Istrian Exodus begins"},
      {year:"1947",event:"Istria formally incorporated into Yugoslavia. Croatian language restored"},
      {year:"1989",event:"Last coal mine closes. Labin reinvents itself through culture and tourism"},
      {year:"1991",event:"Croatia declares independence. Istria votes overwhelmingly for Croatian sovereignty"},
      {year:"2019",event:"Labinjonska Čakavica dialect declared protected intangible cultural heritage of Croatia"},
    ],
    people:[
      {name:"Matthias Flacius Illyricus",years:"1520–1575",role:"Protestant Reformer & Scholar",story:"Born Matija Vlačić in Labin, he became one of the most important figures of the Protestant Reformation — Martin Luther's closest intellectual collaborator and defender. After Luther's death, Flacius led the orthodox Lutheran movement against attempts to compromise with Catholicism. His monumental work 'Magdeburg Centuries' (13 volumes) is considered the founding document of modern church historiography. He died in exile in Frankfurt, still fighting for his beliefs. He was the most brilliant Istrian who ever lived."},
      {name:"Josip Belušić",years:"1847–1905",role:"Inventor",story:"Born in Sv. Martin (near Labin), this Croatian inventor patented the world's first electric speedometer (velocimeter) in Vienna in 1888 — 40 years before speedometers became standard in automobiles. His patent number 39.492 is documented in Austrian imperial records. Working as a teacher and engineer, he developed instruments for measuring speed in trains and ships. His invention is the direct ancestor of every speedometer in every car today."},
      {name:"Giuseppina Martinuzzi",years:"1844–1925",role:"Pioneer Socialist & Feminist",story:"Born in Labin, Martinuzzi was the first female socialist leader in Istria and one of the first in Europe. She founded Istria's first women's organization in 1896, campaigned for Croatian language rights under Italian rule, supported miners' rights, and wrote extensively on education and social justice. She was arrested multiple times for her activism. The Labin library is named after her today — a fitting honor for a woman who spent her life fighting for those with no voice."},
      {name:"Ema Derossi-Bjelajac",years:"1920–1991",role:"First Female Head of State (Croatia)",story:"Born into a Labin mining family, Ema became a partisan fighter at 22 and rose to become one of Yugoslavia's most respected political figures. In 1953, she became President of the Presidium of the People's Republic of Croatia — making her Croatia's first female head of state, 70 years before Croatia would elect its second female president. She held other senior positions until retirement. Her life story spans the entire arc of 20th-century Croatian history."},
      {name:"Giovanni Pippan",years:"1888–1960",role:"Leader of the Labin Republic",story:"An Istrian Italian by identity but a universal humanist by belief, Pippan was secretary of the Labin Workers' Committee who organized and led the 1921 uprising. He insisted the republic was not about ethnicity — Croatian miners, Italian miners, Slovene miners, Czech miners were all equal citizens. After the uprising's suppression, he was tried but acquitted. He spent the rest of his life as a labor organizer and is buried in Labin's cemetery — honored today by both Croatians and Italians as a symbol of working-class solidarity."},
    ],
    vocab:[
      {hr:"šoht",en:"mining headframe / tower",note:"The iconic steel tower above a mine shaft — Labin's industrial symbol"},
      {hr:"pijacal",en:"the miners' plaza / square",note:"From Italian 'piazza' — the gathering place for miners before and after shifts"},
      {hr:"bura",en:"the Bora wind",note:"The cold northeast wind that sweeps down from the Velebit mountains. Labinjani say: 'Bura je naša kraljica' — the Bora is our queen"},
      {hr:"labinjonski",en:"of/from Labin",note:"The adjective for anything from Labin — 'labinjonski ugljen' (Labin coal)"},
      {hr:"čakavski",en:"Chakavian (dialect)",note:"The ancient Croatian dialect spoken in Istria. 'Ča?' means 'What?' — that's where the name comes from"},
      {hr:"ča",en:"what (Chakavian)",note:"Standard Croatian uses 'što' — in Labin you hear 'ča'. Locals will love you for using it"},
      {hr:"marun",en:"chestnut (Istrian dialect)",note:"The Istrian word for chestnut — a symbol of autumn. October is chestnut season in Labin"},
      {hr:"plavac",en:"blue / Plavac Mali wine grape",note:"The signature red wine grape of the Adriatic coast. Labin area produces Teran and Malvazija wines"},
      {hr:"teran",en:"Teran (Istrian red wine)",note:"The dark, tannic red wine unique to Istria's red soil. A Labin dinner staple"},
      {hr:"malvazija",en:"Malvasia (Istrian white wine)",note:"Istria's signature white wine — light, dry, aromatic. Produced in vineyards around Labin and Rabac"},
      {hr:"feral",en:"lantern / streetlight",note:"Old Istrian word for a street lantern — still used by older Labinjani"},
      {hr:"riva",en:"seafront promenade",note:"The coastal walkway in Rabac. Every Adriatic town has its riva — the heart of evening social life"},
    ],
    facts:[
      "The Labin miners' trial in Pula lasted 2 years. All 52 accused were acquitted — the court found the workers had acted in self-defense against fascist aggression.",
      "Matthias Flacius Illyricus coined the term 'hermeneutics' (the science of interpretation) — a word still used in philosophy and theology today.",
      "Rabac's underwater visibility averages 25-30 meters — cleaner than most Caribbean dive sites.",
      "The Battiala-Lazzarini Palace in Labin was built in 1622 by a Venetian nobleman. It now contains an active mine tunnel open to visitors.",
      "Labin is built on a geological fault — the old town literally rests on top of collapsed mine shafts. Some buildings lean visibly.",
      "The Bora wind can reach 248 km/h on the Velebit coast. Labin is sheltered from the worst, but a real bura will rattle every window.",
      "Labinjonska Čakavica has words from Latin, Venetian Italian, German, and Turkish — a linguistic fossil of 2,000 years of conquest.",
      "Josip Belušić's speedometer patent predates Karl Benz's first automobile by just 2 years — he was inventing for trains and ships.",
    ],
    quiz:[
      {q:"What event made Labin 'the first anti-fascist city in Europe'?",a:"The 1921 miners' uprising (Labinska Republika)",al:["A WWI battle","A 1940s resistance movement","A 19th-century workers' strike"]},
      {q:"How long did the Labin Republic last before being suppressed?",a:"37 days",al:["7 days","87 days","120 days"]},
      {q:"Matthias Flacius Illyricus was a close collaborator of which famous figure?",a:"Martin Luther",al:["John Calvin","Pope Pius IV","Niccolò Machiavelli"]},
      {q:"What did Josip Belušić invent in 1888?",a:"The electric speedometer",al:["The telephone","The electric motor","The railway switch"]},
      {q:"What does 'ča' mean in the Labin Chakavian dialect?",a:"What",al:["Hello","Where","Why"]},
      {q:"What wine is Istria most famous for (white variety)?",a:"Malvazija",al:["Plavac Mali","Grk","Dingač"]},
      {q:"The Labin City Museum is built inside which unusual feature?",a:"A real 150-meter mine tunnel",al:["A medieval dungeon","A Roman aqueduct","A Venetian vault"]},
    ]
  },
  bibinje:{
    title:"Bibinje & Zadar Region",sub:"Gateway to Dalmatia",color:"#0369a1",icon:"🏖️",
    intro:"Bibinje is a small coastal village with 3,000 years of history on the Zadar Riviera. It sits at the gateway to Dalmatia — a region that was Croatia's political and cultural capital for over a millennium.",
    sections:[
      {h:"Roman Roots & the Villa Rustika",t:"The name 'Bibinje' comes from Vibius — a Roman patrician who owned the estate here. The Villa Rustika, a Roman country house, was built on these shores in the 1st century AD, when the Zadar region (then Jadera) was a prosperous Roman colony and the administrative capital of Dalmatia. The coastline was dotted with fish ponds (piscinae), vineyards, and olive groves producing goods traded across the empire. The first written record of 'Bibanum' dates to 1214."},
      {h:"Croatian King's Gift — The Benedictines",t:"In 1066, Croatian King Petar Krešimir IV — at the height of Croatian medieval power — donated the royal estate of Točinja (today's Bibinje) to the Benedictine Order in Zadar. This was no small act: the king was placing this Adriatic village under the protection of the most powerful religious institution in medieval Europe. The Benedictines developed agriculture, built churches, and connected the village to the broader European Christian world. Their influence is still visible in the landscape."},
      {h:"Ottoman Destruction & Resistance",t:"The Ottoman advance into Dalmatia brought catastrophe. In 1570, Ottoman forces razed Bibinje — the village was destroyed and abandoned. Most residents fled to the islands or to Venice. The folk hero Stipan Sorić, a priest from Bibinje, became legendary across Dalmatia for organizing resistance against the Ottomans. The village was slowly rebuilt in the 17th century, but many families never returned. The charred ruins of abandoned hilltop villages are a permanent scar on the Dalmatian landscape."},
      {h:"Klapa — The Music of Dalmatia",t:"Bibinje's greatest living cultural treasure is klapa — the ancient tradition of unaccompanied male (and today also female) choir singing. The 'Raspivano Bibinje' festival has celebrated klapa for decades, drawing choirs from across Dalmatia. The UNESCO recognized klapa multipart singing from Dalmatia as an Intangible Cultural Heritage of Humanity in 2012. A proper klapa performance — voices in tight harmonic blend, often about the sea, love, and homeland — can make a grown Croatian weep."},
      {h:"Zadar — 3,000 Years at the Crossroads",t:"Just 15 km from Bibinje, Zadar has been inhabited continuously since the Liburnian Bronze Age. As the Roman Jadera, it was among the most important cities in the Adriatic. As the Byzantine-era capital, it connected the Adriatic world. As a medieval Croatian and then Venetian city, it was fought over relentlessly — Zadar changed hands dozens of times. The Republic of Venice finally bought it from King Ladislaus of Naples for 100,000 gold ducats in 1409. The old town, built on a peninsula, is one of the best-preserved Roman grid cities in the world."},
      {h:"The Homeland War — Zadar Front",t:"The 1991-1995 war struck the Zadar region brutally. The JNA (Yugoslav People's Army) and Serb forces blockaded Zadar, cut roads, shelled the city and surrounding villages. The Maslenica battle (1993) was a key Croatian operation to reopen the land route to Dalmatia. The nearby village of Škabrnja suffered a massacre on November 18, 1991 — 86 civilians killed in a single day. Above Bibinje, an abandoned JNA military base on hill Križ served as a sniper position. A rusted tank remains on that hill today."},
      {h:"Zadar's Gifts to the World",t:"The Sea Organ (Morske orgulje), designed by architect Nikola Bašić and opened in 2005, is a 70-meter installation of pipes built into the stone steps. The sea's waves push air through the pipes to create unique, never-repeating music. It is one of the world's most extraordinary public artworks. The Sun Salutation (Pozdrav Suncu), also by Bašić, is a 22-meter circle of 300 solar cells that collects energy by day and creates a light show at night. Alfred Hitchcock visited in 1964 and declared it had the world's most beautiful sunset. He wasn't wrong."}
    ],
    timeline:[
      {year:"~1000 BC",event:"Liburnian settlement on the Zadar peninsula. Liburni become renowned Adriatic traders and seafarers"},
      {year:"59 BC",event:"Roman colony Jadera (Zadar) formally established — becomes capital of Dalmatia province"},
      {year:"1st c. AD",event:"Villa Rustika built in what is today Bibinje. Roman fish ponds and olive groves established"},
      {year:"812 AD",event:"Byzantine-Frankish Treaty of Aachen — Zadar remains Byzantine, begins century of prosperity"},
      {year:"1066",event:"Croatian King Petar Krešimir IV donates Bibinje (Točinja) to the Benedictine Order in Zadar"},
      {year:"1214",event:"First written record of 'Bibanum' in medieval documents"},
      {year:"1409",event:"Venice purchases Zadar for 100,000 gold ducats from King Ladislaus of Naples"},
      {year:"1570",event:"Ottoman forces destroy Bibinje — village abandoned and slowly rebuilt over next century"},
      {year:"1797",event:"Napoleon ends the Republic of Venice. Zadar passes to Habsburg Austria"},
      {year:"1813",event:"Brief French interlude ends. Austria retakes Zadar as capital of the Kingdom of Dalmatia"},
      {year:"1944",event:"Allied bombing raids devastate Zadar — 50+ bombing missions destroy the ancient city center"},
      {year:"1991",event:"Zadar blockaded by JNA. Battle of Maslenica. Škabrnja massacre (November 18)"},
      {year:"2005",event:"Sea Organ opens on Zadar waterfront — becomes world-famous public art installation"},
      {year:"2012",event:"UNESCO recognizes Dalmatian klapa singing as Intangible Cultural Heritage of Humanity"},
    ],
    people:[
      {name:"Stipan Sorić",years:"16th c.",role:"Priest & Resistance Hero",story:"Bibinje's most celebrated historical figure — a Catholic priest who refused to flee when the Ottomans arrived, instead organizing armed resistance and helping villagers evacuate safely. His name became legendary across Dalmatia as a symbol of courage. When the Ottomans finally forced him out, he continued organizing Croatian resistance from Venetian-held territory. He represents the countless local heroes of the Ottoman centuries whose stories were never written down."},
      {name:"Petar Krešimir IV",years:"~1050–1074",role:"Croatian King",story:"Under his reign, Croatia reached its greatest medieval power — controlling Dalmatia, much of Pannonia, and having a strong fleet on the Adriatic. His donation of Bibinje to the Benedictines was part of a broader policy of strengthening the Catholic Church as a unifying institution for Croatian identity. He was called 'King of Croats and Dalmatians' and is commemorated on Croatian banknotes."},
      {name:"Nikola Bašić",years:"1946–",role:"Architect & Artist",story:"Born in Zadar, Bašić is the creator of the Sea Organ and Sun Salutation — two of the most celebrated works of public art in the world. The Sea Organ was his response to the ugly concrete steps that had replaced Zadar's old waterfront. He wanted to give the sea back to the city. The result is an instrument that plays music composed entirely by waves, wind, and tide — no two performances alike in 3,000 years."},
      {name:"Alfred Hitchcock",years:"1899–1980",role:"Filmmaker & Zadar's Most Famous Visitor",story:"The 'Master of Suspense' visited Zadar in 1964 and was so overwhelmed by the sunset that he wrote: 'Zadar has the most beautiful sunset in the world, more beautiful than the one in Key West, Florida, which I had always considered the most beautiful.' His quote is now inscribed on a plaque on the Zadar Riva. The Croatian tourist board has used it ever since — a rare piece of free marketing from one of cinema's greatest minds."},
    ],
    vocab:[
      {hr:"klapa",en:"Dalmatian a cappella choir",note:"A group of 4-8 singers performing in close harmony. The soul of Dalmatian culture"},
      {hr:"piva",en:"sings (3rd person)",note:"'Klapa piva' — the choir sings. From 'pjevati', regional form 'pivati'"},
      {hr:"Riva",en:"seafront promenade",note:"Every Dalmatian coastal town has its Riva — the main social gathering place in the evening"},
      {hr:"šjor",en:"mister / sir (Dalmatian)",note:"From Venetian 'signor' — still used respectfully in Dalmatia to address older men"},
      {hr:"fjaka",en:"a state of blissful idleness",note:"The famous Dalmatian concept — a perfect, guilt-free laziness. 'U fjaci sam' = I'm in fjaka. Cannot be translated."},
      {hr:"kogo",en:"Bibinje's signature pasta dish",note:"'Bibinjski kogo' — black pasta with cuttlefish ink sauce. A must-try local specialty"},
      {hr:"maraschino",en:"maraschino liqueur",note:"Made from Marasca cherries grown around Zadar — Croatia's most famous spirit, exported worldwide since the 18th century"},
      {hr:"trinajst",en:"thirteen (Dalmatian dialect)",note:"Standard Croatian: 'trinaest'. Dalmatian: 'trinajst'. Regional variants are everywhere."},
      {hr:"bura",en:"Bora wind",note:"The cold northeast wind. In Dalmatia it brings clear skies and rough seas. 'Puhala je bura' — the bura was blowing"},
      {hr:"jugo",en:"Sirocco wind (south wind)",note:"The hot, humid south wind from Africa. Brings rain, low pressure, and what Dalmatians call 'juga' — the melancholy of bad weather"},
    ],
    facts:[
      "The Zadar Sea Organ was the first instrument in the world built to be played permanently by the sea. No electronic components — purely wave pressure through stone pipes.",
      "Klapa singing uses no written notation — all harmonies are learned by ear and passed from generation to generation. Some melodic lines are hundreds of years old.",
      "Zadar was bombed 54 times by Allied forces in WWII — more heavily than any other city in Yugoslavia — because it was an Italian-controlled port.",
      "The Benedictine nuns of St. Mary's monastery in Zadar have maintained continuous habitation since 1066 — they are the oldest continuously operating institution in Croatia.",
      "Maraschino liqueur from Zadar was Napoleon's favorite drink and was served at the royal courts of Europe. It saved the Luxardo family's business when they fled Italian fascism.",
      "Zadar's old town sits on a peninsula that has been continuously inhabited for over 3,000 years — the Roman street grid is still the basis of today's streets.",
      "The nearby Kornati National Park contains 89 islands — the densest concentration of islands in the Mediterranean.",
    ],
    quiz:[
      {q:"Which Croatian king donated Bibinje to the Benedictine Order in 1066?",a:"Petar Krešimir IV",al:["Tomislav I","Zvonimir","Držislav"]},
      {q:"What is 'fjaka'?",a:"A state of blissful Dalmatian idleness",al:["A traditional dance","A fishing technique","A type of wind"]},
      {q:"UNESCO recognized Dalmatian klapa as an Intangible Cultural Heritage in which year?",a:"2012",al:["2005","2018","1998"]},
      {q:"What material makes the Sea Organ produce music?",a:"Ocean waves pushing air through stone pipes",al:["Solar energy","Tidal generators","Wind turbines"]},
      {q:"What is 'Bibinjski kogo'?",a:"Black pasta with cuttlefish ink — local specialty",al:["A folk dance","A type of wine","A Christmas dessert"]},
      {q:"What famous filmmaker said Zadar had 'the most beautiful sunset in the world'?",a:"Alfred Hitchcock",al:["Orson Welles","Federico Fellini","David Lean"]},
    ]
  },
  hercegovina:{
    title:"Hrvati Hercegovine",sub:"Croatians of Herzegovina",color:"#7c3aed",icon:"⚔️",
    intro:"For over a thousand years, Herzegovinian Croats have maintained their language, faith, and identity against extraordinary odds — Ottoman conquest, religious conversion, communist suppression, and war. Their story is one of the most resilient in European history.",
    sections:[
      {h:"Medieval Croatian Herzegovina",t:"The region known as Herzegovina (named after Herzog/Duke Stjepan Vukčić Kosača in 1448) was part of the medieval Croatian and Hungarian-Croatian Kingdom for centuries. The Franciscan monasteries of Humac, Kruševo, and Široki Brijeg served as cultural and religious centers. Before the Ottoman conquest, the population was entirely Catholic and predominantly Croatian-speaking. The medieval gravestones called 'stećci' — found across Herzegovina — are unique to this region and are now a UNESCO World Heritage Site."},
      {h:"The Franciscan Covenant — 400 Years of Cultural Preservation",t:"When the Ottomans conquered Herzegovina in 1482, they made a fateful decision: they permitted Franciscan priests to remain as the only Catholic clergy in the region, in exchange for taxes and cooperation. This was the single most important act in preserving Croatian identity in Herzegovina. For 400 years, Franciscan friars conducted baptisms, weddings, and funerals in Croatian, kept parish records, educated children, and maintained the thread of Croatian Catholic identity through everything. Of 35 pre-Ottoman monasteries, only 10 survived — but those 10 preserved a civilization."},
      {h:"The Ottoman Centuries — Complexity & Survival",t:"Ottoman rule brought not just conquest but profound social transformation. Tax exemptions for converts to Islam drove many Croats to change religion. Others adopted Orthodoxy to avoid Ottoman persecution. Yet in western Herzegovina — Mostar, Široki Brijeg, Grude, Ljubuški, Čapljina, Posušje — Croatian Catholic communities persisted against all odds. It is critical to understand: conversions were mostly driven by survival and economics, not conviction. The descendants of those who converted are today's Bosniaks — historically the same people, divided by history's cruelty."},
      {h:"Austro-Hungarian National Awakening (1878–1918)",t:"When Austria-Hungary occupied Bosnia-Herzegovina in 1878, the restrictions on Croatian cultural life finally lifted. Croatian newspapers began publishing, reading societies opened, schools taught in Croatian, and a national movement emerged. The Croatian Cultural Society Napredak (Progress), founded in 1902, opened schools, supported university students, and built cultural institutions that survive today. A Herzegovinian Croatian intelligentsia arose — writers, lawyers, politicians, priests — who would shape Croatian national politics into the 20th century."},
      {h:"Yugoslavia & Communist Suppression",t:"Under both Kingdom Yugoslavia (1918-1941) and Communist Yugoslavia (1945-1991), Herzegovinian Croats faced suppression. The Catholic Church was seen as a political threat. Franciscan priests were imprisoned and executed. The Bleiburg massacre (May 1945) killed tens of thousands of Croatian soldiers and civilians trying to surrender to British forces. Speaking freely about Croatian identity was dangerous. Yet the Franciscans maintained their parishes, kept the faith, and quietly preserved everything."},
      {h:"The Homeland War in Herzegovina (1992–1995)",t:"When Yugoslavia collapsed, Herzegovinian Croats faced an existential crisis. The Croatian Defence Council (HVO) formed in April 1992 to defend against Serbian aggression. In the first phase, Croats and Bosniaks cooperated — they were facing the same enemy. But from 1993, a catastrophic Croat-Bosniak conflict erupted over the future of Bosnia. The siege of Mostar, the destruction of the 16th-century Stari Most bridge (November 9, 1993), and atrocities on both sides remain painful chapters. The Washington Agreement (March 1994) ended the Croat-Bosniak war and established the Croat-Bosniak Federation."},
      {h:"Stari Most — Destruction & Resurrection",t:"The Ottoman bridge Stari Most in Mostar, built in 1566, was one of the finest examples of Ottoman architecture in Europe and a symbol of the multi-ethnic city. On November 9, 1993, Croatian HVO forces destroyed it with sustained tank and anti-tank fire — an act widely condemned as cultural destruction. It was rebuilt and reopened in 2004 using original Ottoman techniques and stone. Today it is a UNESCO World Heritage Site. Its destruction and reconstruction have become a metaphor for the war itself — things broken beyond imagination can, with enough will, be made whole again."}
    ],
    timeline:[
      {year:"7th c. AD",event:"Croat tribes settle in the western Balkans including what is today western Herzegovina"},
      {year:"925",event:"Croatia becomes a kingdom under Tomislav. Herzegovina area part of Croatian state"},
      {year:"1102",event:"Croatian-Hungarian Personal Union — Croatia retains its law but shares a king with Hungary"},
      {year:"1448",event:"Duke Stjepan Vukčić Kosača takes title 'Herzog' (Duke of St. Sava) — 'Herzegovina' named after him"},
      {year:"1482",event:"Ottoman conquest of Herzegovina. Franciscans granted permission to remain as only Catholic clergy"},
      {year:"1557",event:"Ottoman 'millet' system formalized — religious communities self-govern under Ottoman authority"},
      {year:"1566",event:"Stari Most bridge built in Mostar by Ottoman architect Mimar Hayruddin — stands for 427 years"},
      {year:"1878",event:"Austria-Hungary occupies Bosnia-Herzegovina. Croatian cultural institutions begin to open"},
      {year:"1902",event:"Croatian Cultural Society Napredak founded — supports Croatian education and culture in BiH"},
      {year:"1941–45",event:"WWII — mass atrocities in Herzegovina. Franciscan clergy resist both Nazi and Ustasha extremism"},
      {year:"1945",event:"Bleiburg massacre. Communist Yugoslavia suppresses Croatian identity. Franciscans persecuted"},
      {year:"Apr 1992",event:"HVO (Croatian Defence Council) formed. Croatian Defence of Herzegovina begins"},
      {year:"Nov 9, 1993",event:"Stari Most bridge in Mostar destroyed by HVO forces — condemned internationally"},
      {year:"Mar 1994",event:"Washington Agreement ends Croat-Bosniak war. Federation of BiH established"},
      {year:"Nov 1995",event:"Dayton Agreement ends the war. Bosnia and Herzegovina divided into two entities"},
      {year:"2004",event:"Rebuilt Stari Most reopens. UNESCO World Heritage status granted"},
    ],
    people:[
      {name:"Franciscan Friars of Herzegovina",years:"1482–present",role:"Cultural Preservers",story:"It is impossible to name one friar — there were hundreds across 500 years. Men who chose to stay when they could have fled, who kept Latin and Croatian alive in remote villages, who hid books from Ottoman inspectors, who argued for their parishioners in Ottoman courts, who educated children when there were no schools. The Franciscan province of Herzegovina is the oldest continuously operating institution in the region. Without these anonymous men of faith, there would be no Herzegovinian Croatian culture to speak of."},
      {name:"Fra Grgo Martić",years:"1822–1905",role:"Poet, Franciscan, Patriot",story:"One of Herzegovina's greatest Franciscan scholars — a poet, linguist, and national awakener who wrote in the Croatian literary language at a time when it was being actively suppressed. His epic poetry celebrated the Croatian medieval kingdom and galvanized cultural identity. He corresponded with Croatian linguists in Zagreb, helping standardize the Croatian written language across Bosnia and Croatia. He is the literary bridge between the Ottoman centuries and Croatian modernity."},
      {name:"Stjepan Vukčić Kosača",years:"~1404–1466",role:"Duke of Herzegovina",story:"The powerful Bosnian nobleman who gave Herzegovina its name. By calling himself 'Herzog of Saint Sava' (Duke of Saint Sava), he created a title that outlasted him by 600 years. A complex figure who allied with different powers depending on the threat — sometimes Ottoman, sometimes Hungarian, always trying to maintain independence. He was a patron of arts, built churches, and commissioned manuscripts. His story is the story of a man trying to survive between empires — which is the story of Herzegovina itself."},
    ],
    vocab:[
      {hr:"stećak",en:"medieval tombstone (sing.)",note:"The unique carved stone monuments found only in Bosnia and Herzegovina. Stećci (plural) are a UNESCO World Heritage Site"},
      {hr:"ganga",en:"traditional Herzegovina vocal style",note:"A raw, dissonant, two-voice singing style unique to western Herzegovina. Wild, powerful, and unlike anything else in Croatia"},
      {hr:"HVO",en:"Croatian Defence Council",note:"The Croatian military force in Bosnia-Herzegovina during the 1990s war (Hrvatsko vijeće obrane)"},
      {hr:"Napredak",en:"Progress (name of Croatian cultural society)",note:"'Napredak' — founded 1902 in Sarajevo to preserve Croatian education in Bosnia-Herzegovina. Still operating."},
      {hr:"fratri",en:"Franciscan friars",note:"'Fratri' — the affectionate Herzegovinian term for Franciscan brothers. 'Idi kod fratara' = Go see the friars. They are deeply trusted figures"},
      {hr:"Bosna",en:"Bosnia (region/river)",note:"Named after the Bosna River. Croatia, Serbia, and Bosnia all meet in this contested historic space"},
      {hr:"krvna osveta",en:"blood feud",note:"The clan-based revenge tradition that shaped Herzegovinian social codes for centuries. Partially a survival mechanism under Ottoman rule"},
      {hr:"žulja",en:"makes you uncomfortable / hurts",note:"Herzegovinian expression: 'To me žulja' = That bothers me. Raw, direct speech is a Herzegovinian trademark"},
    ],
    facts:[
      "The Franciscans of Herzegovina refused to hand over their parishes to the newly formed Mostar diocese in the 1880s — a conflict with the Catholic hierarchy that continues to this day. They believe they earned the right to these parishes through 400 years of suffering.",
      "Stari Most (Old Bridge) was built in 1566 using a mortar mixture whose exact formula is still unknown. The rebuilt bridge used the same local limestone (tenelija) and approximate Ottoman techniques — it took 4 years.",
      "Međugorje, a small village near Mostar, became one of the world's most visited pilgrimage sites after six young people reported visions of the Virgin Mary in 1981. Over 30 million pilgrims have visited.",
      "The Bleiburg massacre in May 1945 — where tens of thousands of Croatian soldiers and civilians were killed by Yugoslav partisans — is almost unknown in Western Europe but is seared into Croatian collective memory.",
      "Western Herzegovina has one of the highest concentrations of Croats per square kilometer in the world — more Croatian than most parts of Croatia itself.",
      "The ganga singing style of western Herzegovina is so distinctive it was used by ethnomusicologists to trace ancient vocal traditions from the pre-Christian Slavic period.",
    ],
    quiz:[
      {q:"Who gave Herzegovina its name?",a:"Duke Stjepan Vukčić Kosača (Herzog of Saint Sava)",al:["Ottoman Sultan Suleiman","Croatian King Tomislav","Byzantine Emperor Constantine"]},
      {q:"What did the Franciscans do that preserved Croatian identity under Ottoman rule?",a:"Stayed as the only Catholic clergy, maintaining language, faith and records for 400 years",al:["Armed resistance against the Ottomans","Built fortresses in the mountains","Fled to Venice and preserved culture there"]},
      {q:"What happened to the Stari Most bridge on November 9, 1993?",a:"It was destroyed by HVO forces",al:["It collapsed due to flooding","It was demolished by Serbian forces","It was damaged in an earthquake"]},
      {q:"What is 'ganga'?",a:"A raw, two-voice singing tradition unique to western Herzegovina",al:["A traditional circle dance","A type of wine from the region","A Franciscan prayer"]},
      {q:"What were 'stećci'?",a:"Unique medieval carved stone tombstones — now a UNESCO World Heritage Site",al:["Ottoman fortresses","Franciscan monasteries","Roman amphitheaters"]},
    ]
  },
  vukovar:{
    title:"Vukovar",sub:"Croatia's Stalingrad — Hero City",color:"#b91c1c",icon:"🕯️",
    intro:"Vukovar is Croatia's most sacred city — not because it was the most beautiful, but because it suffered the most and endured. The 87-day siege of 1991 was the most destructive battle in Europe since WWII. This is the story of a city that chose dignity over surrender.",
    sections:[
      {h:"Vučedol — The Cradle of European Civilization",t:"Before the tragedy, Vukovar stood on some of the most historically significant soil in Europe. The Vučedol archaeological site, just 5km away, dates to 3000-2200 BC and produced extraordinary evidence of early European civilization. The Vučedol Dove — a ritual vessel shaped as a three-legged bird — is depicted on Croatian banknotes and is the oldest dove figure in Europe. The Vučedol Orion is considered the oldest Indo-European astronomical calendar. The Vučedol culture extended across 14 modern European countries, making this corner of Slavonia the cultural epicenter of Bronze Age Europe."},
      {h:"Baroque Vukovar — A City of Beauty",t:"The Vukovar that existed before 1991 was one of Slavonia's most beautiful cities — a city of baroque mansions, wide tree-lined boulevards, and the Danube River defining its eastern edge. The Eltz Manor, built by the aristocratic Eltz family in the 18th century, housed Croatia's finest regional museum. The Franciscan monastery dated to 1733. Nobel laureate Lavoslav Ružička was born here in 1887. Vukovar was Slavonia's cultural capital — home to ~45,000 people from Croatian, Serbian, Hungarian, German, and Jewish communities who largely lived together without conflict for generations."},
      {h:"The Siege — 87 Days (Aug 25 – Nov 18, 1991)",t:"On August 25, 1991, the Yugoslav People's Army (JNA) and Serbian paramilitary forces launched a full-scale assault on Vukovar. The attackers had 36,000 troops, 600 tanks, 400 artillery pieces, and air support. The defenders had approximately 1,800 fighters — Croatian National Guard, police, and volunteers — with light weapons, minimal ammunition, and no air cover. For 87 days, an average of 12,000 shells and rockets hit the city EVERY SINGLE DAY. Water, electricity, and food supplies were cut. Civilians sheltered in basements for months. The city was methodically destroyed building by building. It was the fiercest battle in Europe since the 1944-45 Soviet-German battles — and the first major European city entirely destroyed since WWII."},
      {h:"The Defenders — Who Fought for Vukovar",t:"The defense of Vukovar was organized by the Croatian National Guard and the Vukovar Police Department under Commander Mile Dedaković 'Jastreb' (Hawk). The 204th Vukovar Brigade, composed largely of local volunteers including Croats, Serbs, and Hungarians who refused to leave their city, conducted the defense. Many defenders were ordinary civilians — teachers, doctors, factory workers — who picked up rifles for the first time. They fought not just for Croatia but for the idea that the modern world does not simply allow the extermination of a civilian population in the heart of Europe."},
      {h:"Siniša Glavašević — Voice of the Siege",t:"Siniša Glavašević was a radio journalist at Radio Vukovar who broadcast throughout the siege from the besieged city. He documented the defense, read poetry, played music, and kept Vukovar's spirit alive over the airwaves as the city burned. His broadcasts were heard across Croatia. On November 19, 1991 — one day after the city fell — he was captured at Vukovar Hospital and taken to the Ovčara farm. He was 32 years old. His final essays, written in the siege, include the unforgettable line: 'Sjeti se tko si' — Remember who you are."},
      {h:"Ovčara — The Massacre (Nov 20, 1991)",t:"After Vukovar fell on November 18, JNA forces took control of Vukovar Hospital. Despite a formal agreement with the International Committee of the Red Cross guaranteeing evacuation of the wounded, JNA Commander Mile Mrkšić authorized the removal of approximately 300 patients, staff, journalists, and civilians. They were transported to the Ovčara collective farm, 5km from the city. In a hangar, they were beaten for hours by Serbian paramilitaries while JNA soldiers watched. Then, in groups of 10-12, they were taken to a field and executed. Ages ranged from 16 to 72. 261 bodies were recovered. As of 2026, approximately 61 victims remain missing."},
      {h:"The Aftermath & Justice",t:"Around 3,000 soldiers and civilians died in the siege, including 86 children. Over 20,000 people were expelled. 7,000 went to detention camps in Serbia. 85% of buildings were destroyed or damaged. The International Criminal Tribunal for the former Yugoslavia (ICTY) convicted Mile Mrkšić to 20 years in prison. Veselin Šljivančanin received 17 years. But many perpetrators escaped justice. Forensic anthropologist Clyde Snow — the man who identified the Nazi war criminal Josef Mengele — came to Vukovar to help identify victims. The work of identification continues today."},
      {h:"The Water Tower — Symbol of Resistance",t:"Vukovar's water tower became the city's most powerful symbol. Hit by over 600 shells during the siege, it stood — damaged but not destroyed — through the entire battle. After the war, a decision was made to leave it scarred as a permanent memorial to the city's suffering, rather than repair it. For almost three decades, it stood as Europe's most eloquent war monument: a thing hit hundreds of times that refused to fall. In 2020, after years of debate, the tower was restored — but the shell holes are preserved and commemorated. Standing beneath it, you understand something that no textbook can explain."}
    ],
    timeline:[
      {year:"3000 BC",event:"Vučedol culture flourishes — Bronze Age civilization producing Europe's oldest calendar and finest metallurgy"},
      {year:"1st c. AD",event:"Roman Vukovar — Cornacum, a river port on the Danube (Danuvius)"},
      {year:"9th c.",event:"Croatian and Frankish settlement. The town grows as an agricultural and trade center"},
      {year:"1231",event:"First written mention of Vukovar as a market town under Hungarian-Croatian Kingdom"},
      {year:"1526",event:"Ottoman conquest of Slavonia after Battle of Mohács. Vukovar under Ottoman rule for 160 years"},
      {year:"1687",event:"Habsburg liberation of Slavonia. Vukovar rebuilt and repopulated with Croatian, Serbian, German and Hungarian settlers"},
      {year:"1736",event:"Eltz Manor construction begins — becomes one of Slavonia's finest baroque buildings"},
      {year:"1887",event:"Lavoslav Ružička born in Vukovar — future Nobel Prize winner in Chemistry (1939)"},
      {year:"1918",event:"Kingdom of Serbs, Croats and Slovenes formed. Vukovar becomes part of Yugoslavia"},
      {year:"1945",event:"After WWII, Communist Yugoslavia. Eltz Manor nationalized. German-speaking community expelled"},
      {year:"Jun 1991",event:"Croatia declares independence. JNA begins mobilizing around Slavonia"},
      {year:"Aug 25, 1991",event:"JNA and Serbian paramilitaries launch full assault on Vukovar. Siege begins"},
      {year:"Nov 18, 1991",event:"Vukovar falls after 87 days. Croatian defenders formally surrender"},
      {year:"Nov 19–20, 1991",event:"Ovčara massacre. 261 people executed. Siniša Glavašević among those killed"},
      {year:"1992–1998",event:"UN-administered Eastern Slavonia. Croatian population expelled. City in ruins"},
      {year:"Jan 1998",event:"Peaceful reintegration of Eastern Slavonia into Croatia. Croats begin returning"},
      {year:"2006",event:"Ovčara Memorial Centre opens on the site of the massacre"},
      {year:"2020",event:"Water tower restored and reopened as a cultural memorial"},
      {year:"2026",event:"Ongoing identification of remains. 61 Ovčara victims still missing"},
    ],
    people:[
      {name:"Siniša Glavašević",years:"1959–1991",role:"Journalist & Voice of Vukovar",story:"A Radio Vukovar journalist who became the voice of the besieged city. His broadcasts during the 87-day siege — readings of poetry, documentation of the defense, messages of hope — were heard across Croatia. He wrote essays during the siege, including the famous 'Priča o gradu' (Story of a City), that are now considered classics of Croatian literature. When the city fell, he was captured, taken to Ovčara, and murdered. He was 32. His words 'Sjeti se tko si' — Remember who you are — became Croatia's war-era motto. He was not a soldier; he was a man who believed that civilized people record what is happening to them."},
      {name:"Mile Dedaković 'Jastreb'",years:"1951–",role:"Commander of the Vukovar Defense",story:"A Croatian army colonel who organized the defense of Vukovar under impossible conditions. Facing 36,000 JNA troops with 1,800 fighters, he improvised military tactics that stretched the defense for 87 days — far longer than any military analyst thought possible. After the war, he controversially claimed that Croatia's leadership had abandoned Vukovar to political calculation and that relief could have come sooner. His accusations led to his marginalization, but also opened a painful public debate about what was and wasn't done to save the city."},
      {name:"Lavoslav Ružička",years:"1887–1976",role:"Nobel Prize Winner in Chemistry",story:"Born in Vukovar to a Croatian family, Ružička became one of the 20th century's greatest chemists. Working in Switzerland, he won the Nobel Prize in Chemistry in 1939 for his work on polymethylenes and higher terpenes — discoveries that led to synthetic hormones and perfumes. He donated his art collection to Swiss museums and his scientific archive to ETH Zurich. His Nobel medal was displayed in the Vukovar museum — among the treasures looted during the 1991 occupation."},
      {name:"The Defenders of the 204th Brigade",years:"1991",role:"Vukovar's Volunteer Soldiers",story:"There was no single hero of Vukovar — there were 1,800 of them. Ordinary people: factory workers, farmers, teachers, students, fathers, who picked up weapons to defend their neighbors. Among them were ethnic Serbs and Hungarians who chose to stand with their city. Many were untrained. Many had never fired a weapon. They held off a professional army with full air support for 87 days. They knew, as the weeks passed and relief didn't come, that they were fighting a battle they would lose. They fought anyway. Croatia's independence was bought with their lives."},
    ],
    vocab:[
      {hr:"branitelj",en:"defender (war veteran)",note:"The most honored word in Croatian — refers specifically to those who defended Croatia in the Homeland War. Always used with deep respect"},
      {hr:"Sjeti se Vukovara",en:"Remember Vukovar",note:"The phrase spoken every November 18 — Croatia's Day of Remembrance. 'Sjeti se' = remember (imperative)"},
      {hr:"svjećica",en:"little candle",note:"Every November 18, Croatians light svjećice for Vukovar. 'Svjećica za Vukovar' — a candle for Vukovar"},
      {hr:"Ovčara",en:"the Ovčara farm massacre site",note:"'Ovčara' means 'sheep farm' — the name of the place where 261 people were executed"},
      {hr:"vodotoranj",en:"water tower",note:"The Vukovar water tower — Croatia's most powerful war symbol. Hit 600+ times but never destroyed"},
      {hr:"obljetnica",en:"anniversary",note:"November 18 is the obljetnica — anniversary — of the fall of Vukovar. A national day of mourning"},
      {hr:"povorka sjećanja",en:"procession of remembrance",note:"The November 18 march through Vukovar's streets. Tens of thousands walk in silence"},
      {hr:"mučenik",en:"martyr",note:"The Vukovar defenders are called 'mučenici' — martyrs — by many Croats"},
      {hr:"sloboda",en:"freedom",note:"The word the defenders were fighting for. 'Za slobodu Hrvatske' — For Croatia's freedom"},
      {hr:"nikad zaboraviti",en:"never forget",note:"'Nikad nećemo zaboraviti' — We will never forget. The vow Croatians make about Vukovar"},
    ],
    facts:[
      "The 87-day siege of Vukovar produced more destruction per square kilometer than any battle in Europe since the 1944-45 Eastern Front fighting. 12,000 shells per day fell on a city of 45,000.",
      "The Vučedol Dove — depicted on Croatian banknotes — is 5,000 years old and is the earliest known representation of a dove in European art.",
      "Siniša Glavašević's essay 'Priča o gradu' (Story of a City) is now studied in Croatian schools as literature. He wrote it while the city burned around him.",
      "The Eltz Manor museum had 8,000+ works of art when the JNA occupied the city. Most were looted and taken to Serbia. Some items have been returned; most remain missing.",
      "Among the defenders of Vukovar were ethnic Serbs who refused to leave or fight for the JNA — they defended their city alongside their Croatian neighbors.",
      "The Ovčara memorial stands on the exact site of the massacre. The hangar walls still show bullet marks. Victims' photographs line the walls — names, faces, ages.",
      "Vukovar's water tower was hit by over 600 shells and artillery rounds. Engineers who examined it after the war said it should logically have collapsed — the structure's geometry was what saved it.",
      "As of 2026, human remains from the Homeland War are still being identified and returned to families across Croatia — the forensic work continues 35 years later.",
    ],
    quiz:[
      {q:"How many days did the Siege of Vukovar last?",a:"87 days",al:["37 days","115 days","60 days"]},
      {q:"What was Siniša Glavašević's profession?",a:"Radio journalist",al:["Medical doctor","Croatian Army officer","Politician"]},
      {q:"What was the Vučedol Dove?",a:"A 5,000-year-old ritual vessel — the oldest dove figure in European art",al:["A WWI memorial","A Baroque painting","A Roman mosaic"]},
      {q:"What does 'Sjeti se Vukovara' mean?",a:"Remember Vukovar",al:["Long live Vukovar","Vukovar is free","We are Vukovar"]},
      {q:"The Ovčara massacre site is preserved as what?",a:"A memorial centre where 261 people were executed on November 20, 1991",al:["A military museum","A national park","A government archive"]},
      {q:"What happened to the Vukovar water tower during the siege?",a:"Hit by 600+ shells but never collapsed — left scarred as a memorial",al:["Destroyed and rebuilt immediately","Used as a sniper post","Evacuated and protected by UN forces"]},
    ]
  },
  vinkovci:{
    title:"Vinkovci",sub:"Oldest Continuously Inhabited Town in Europe",color:"#b45309",icon:"🏛️",
    intro:"Vinkovci has been inhabited for 8,300 years without interruption — the oldest continuously occupied settlement in Europe. Its soil has witnessed the Bronze Age, Roman emperors, Ottoman conquest, and the modern Croatian War of Independence. Every layer of history is literally still underfoot.",
    sections:[
      {h:"8,300 Years — From Starčevo to Today",t:"The prehistoric sequence of Vinkovci is extraordinary: the Starčevo culture (6300–5500 BC) left the oldest fired ceramic kilns in Europe. The Sopot culture (5480–3790 BC) produced incredibly sophisticated pottery. The Vučedol culture (3000–2500 BC) mastered metal casting 1,000 years before most of Europe. Then came the Bronze Age, the Iron Age, Celtic tribes, Roman colonists, Avars, Slavic Croats, Hungarians, Ottomans, Habsburgs, Yugoslavs, and finally an independent Croatia. Eight thousand years of human civilization, all layered on the same soil where people still live and work today."},
      {h:"The Vučedol Calendar — World's Oldest",t:"In 1978, during construction of a hotel in Vinkovci, workers found a ceramic pot decorated with a star map. Archaeologist Dr. Aleksandar Durman analyzed the markings and concluded they depict the Orion constellation and match the sky of ~2600 BC — making it the world's oldest known astronomical calendar. The Vučedol culture used the stars to plan agricultural cycles. This pot from the Vinkovci hotel excavation is now the Vučedol Dove's companion as Croatia's two most significant archaeological artifacts. Croatia is older than almost anyone realizes."},
      {h:"Roman Cibalae — Birthplace of Emperors",t:"When Rome came to Slavonia, Vinkovci became Colonia Aurelia Cibalae — a prosperous Roman city with water supply, sewerage, thermal baths, temples, a forum, and workshops. But Cibalae's greatest distinction: two Roman Emperors were born here. Valentinian I (born 321 AD) became one of the last great Western Roman emperors, famous for massive fortification programs across the empire. His brother Valens (born ~328 AD) became Eastern Roman Emperor and died at the catastrophic Battle of Adrianople (378 AD) against the Goths — a defeat that fundamentally changed the trajectory of the entire Roman Empire. Two emperors from one small Slavonian town."},
      {h:"Valens, Beer, and the Fall of Rome",t:"Emperor Valens has an unusual footnote: he apparently preferred beer to wine (almost unheard of for a Roman nobleman), earning the nickname 'Sabaiarius' (Beer Belly). A 5,000-year-old beer storage pot found near Vinkovci confirms the region's ancient brewing tradition. But Valens's real legacy is tragic: at the Battle of Adrianople (August 9, 378 AD), he made the catastrophic military decision to attack a Gothic army without waiting for reinforcements. He died in the battle — the first Roman Emperor killed in battle since Decius in 251 AD — and the defeat opened the Balkans to Gothic settlement, accelerating the Western Roman Empire's collapse."},
      {h:"Ottoman Vinkovci & the Military Frontier",t:"From 1526 to 1687, Vinkovci was under Ottoman rule following the catastrophic Croatian-Hungarian defeat at Mohács. The city was largely depopulated — many residents fled north or west. When the Habsburgs reconquered Slavonia in 1687, they faced a devastated landscape. They repopulated it with Croatian returnees, German settlers, and other groups, placing the region under the Military Frontier (Vojna Krajina) — a permanently militarized buffer zone against the Ottomans managed directly from Vienna. This military organization shaped Slavonian society for 200 years."},
      {h:"The Anthem & Agatha Christie",t:"Two remarkable Vinkovci connections stand apart. Josip Runjanin (1821-1878), born near Vinkovci, composed the melody of 'Lijepa naša domovino' (Our Beautiful Homeland) — the Croatian national anthem. The city's music school is named after him. And Agatha Christie? She visited Vinkovci in 1928 while traveling on the Orient Express and used the city as a plot detail in 'Murder on the Orient Express' (1934). She was, by reports, charmed by the multi-ethnic Habsburg-era character of the town. A British red phone box in the city center today honors Steve Gaunt — an Englishman who arrived as a volunteer in 1991 and never left."},
      {h:"The Homeland War & Šokac Pride",t:"During 1991-1995, Vinkovci was within artillery range of the front line and suffered heavy bombardment — more destruction than in both World Wars combined, according to local historians. While it avoided Vukovar's complete fall, the psychological and physical toll was immense. Economic recovery was slow and painful. Yet Vinkovci has rebuilt with remarkable cultural pride. The Vinkovačke Jeseni folklore festival — one of Croatia's largest — celebrates the Šokac tradition of eastern Slavonia: embroidered costumes, folk music, traditional agricultural ceremonies, and the rich folk poetry of the Posavina region."}
    ],
    timeline:[
      {year:"6300 BC",event:"Starčevo culture — earliest settlers at the site of today's Vinkovci. Europe's oldest fired ceramic kilns"},
      {year:"5000 BC",event:"Sopot culture develops extraordinary pottery traditions — the finest Neolithic ceramics in this part of Europe"},
      {year:"3000 BC",event:"Vučedol culture — first European copper-bronze metallurgy. World's oldest known astronomical calendar created"},
      {year:"2600 BC",event:"The Vučedol Calendar pot created — depicts Orion constellation; used for agricultural planning"},
      {year:"321 AD",event:"Emperor Valentinian I born in Cibalae (Vinkovci) — future last great military emperor of Western Rome"},
      {year:"~328 AD",event:"Emperor Valens born in Cibalae — future Eastern Roman Emperor, will die in battle at Adrianople"},
      {year:"378 AD",event:"Battle of Adrianople. Emperor Valens defeated and killed by Goths — begins the fall of the Western Roman Empire"},
      {year:"7th c.",event:"Croatian Slavic tribes settle in Slavonia. Vinkovci/Cibalae absorbed into Croatian territory"},
      {year:"1231",event:"First medieval document mentioning Vinkovci as a market town"},
      {year:"1526",event:"Ottoman conquest of Slavonia after Battle of Mohács. Vinkovci under Ottoman rule for 161 years"},
      {year:"1687",event:"Habsburg liberation. Military Frontier (Vojna Krajina) established. Vinkovci repopulated"},
      {year:"1820s",event:"Major railway construction begins — Vinkovci becomes Croatia's second-largest rail junction"},
      {year:"1821",event:"Josip Runjanin born near Vinkovci — will compose the melody of the Croatian national anthem"},
      {year:"1928",event:"Agatha Christie visits Vinkovci on the Orient Express. Uses the city in her 1934 novel"},
      {year:"1978",event:"Hotel construction workers discover the Vučedol Calendar pot — a world-changing archaeological find"},
      {year:"1991–95",event:"Vinkovci within artillery range of the Vukovar-Slavonia front. Heavy shelling. Severe damage"},
      {year:"1998",event:"Eastern Slavonia peacefully reintegrated into Croatia. Reconstruction begins"},
      {year:"Annual",event:"Vinkovačke Jeseni (Vinkovci Autumn Festival) — one of Croatia's largest folklore celebrations"},
    ],
    people:[
      {name:"Josip Runjanin",years:"1821–1878",role:"Composer of the Croatian National Anthem",story:"Born in Vinkovci, Runjanin composed the melody to 'Lijepa naša domovino' (Our Beautiful Homeland) in 1846, setting the words written by Antun Mihanović in 1835. He was a military officer in the Austro-Hungarian army who composed music in his spare time. He never knew his melody would become the anthem of an independent Croatian state — he died in 1878 when Croatia was still part of the Habsburg Empire. Today every Croatian child knows his name; his music school in Vinkovci stands as a quiet monument to the man who gave Croatia its voice."},
      {name:"Emperor Valentinian I",years:"321–375 AD",role:"Roman Emperor",story:"Born in Cibalae (Vinkovci), Valentinian I rose from a military family to become one of Rome's most capable late emperors. He divided the empire with his brother Valens, taking the West for himself. His reign was characterized by massive military investment: he built new fortifications along the Rhine and Danube, reorganized the army, and fought successful campaigns against Alamanni and Sarmatian tribes. He died in 375 AD of a stroke during a heated negotiation with Germanic tribal leaders — allegedly he burst a blood vessel shouting at them. Even his death was fighting."},
      {name:"Emperor Valens",years:"~328–378 AD",role:"Eastern Roman Emperor",story:"Valentinian's younger brother Valens ruled the Eastern Roman Empire for 14 years. His reign was defined by a crisis that would end it: in 376 AD, hundreds of thousands of Gothic refugees crossed the Danube fleeing the Huns. Valens allowed them to settle — but Roman officials abused and exploited them. The Goths revolted. At Adrianople (378 AD), Valens attacked without waiting for his Western co-emperor's reinforcements. He was defeated and killed — his body never found. The defeat is called the 'beginning of the end of the Western Roman Empire.' Two brothers from Vinkovci: one died shouting, one died fighting. Both changed history."},
      {name:"Agatha Christie",years:"1890–1976",role:"World's Best-Selling Novelist & Vinkovci Visitor",story:"Dame Agatha Christie visited Vinkovci in 1928 during one of her trips on the famous Orient Express railway — the luxury train she would later immortalize in her 1934 novel 'Murder on the Orient Express.' The novel's train gets stuck near 'Vinkovci' in a snowdrift — a real detail from a real journey. Christie found the multi-ethnic Habsburg architecture of Slavonian towns fascinating. Her visit is commemorated by a plaque and the city uses the connection with pride. Not every city can claim that the world's best-selling novelist of all time set her most famous book partly in your town."},
      {name:"Steve Gaunt",years:"1960–",role:"The Englishman Who Stayed",story:"Steve Gaunt was a British volunteer who came to Vinkovci in 1991 to help during the war — as a humanitarian worker, observer, and friend to the local community. He fell in love with the city and never left. Thirty years later he is one of Vinkovci's best-known citizens, running cultural projects and serving as a living bridge between Croatia and Britain. A red British telephone box stands in Vinkovci's city center in his honor — a wonderfully absurd symbol of affection for the Englishman who chose Slavonia. His story proves that love for a place can choose you as much as you choose it."},
    ],
    vocab:[
      {hr:"Šokac",en:"Šokac (Slavonian Croatian folk group)",note:"The name for the Croatian population of eastern Slavonia/Srijem. Their folk culture — embroidery, music, customs — is distinct and celebrated"},
      {hr:"slavonska kulen",en:"Slavonian kulen (spiced sausage)",note:"Croatia's most celebrated cured meat — a dense, paprika-spiced pork sausage made in Slavonia. Protected EU designation. 'Kulen' without 'slavonski' is an imposter"},
      {hr:"tamburaši",en:"tamburica musicians",note:"Players of the tamburica, a Slavonian string instrument. A group of tamburaši playing folk music is the sound of eastern Croatia"},
      {hr:"vezovi",en:"traditional embroidery",note:"Slavonian and Šokac textile embroidery — geometric red and black patterns on white linen. UNESCO Intangible Heritage"},
      {hr:"Vojna Krajina",en:"Military Frontier",note:"The Habsburg militarized buffer zone against the Ottomans (1553–1881). It shaped Slavonian demographics, architecture and culture for 300 years"},
      {hr:"Jeseni",en:"Autumn (also: the Vinkovci Autumn festival)",note:"'Vinkovačke Jeseni' = Vinkovci Autumn. The name of the annual folklore festival celebrating Šokac culture"},
      {hr:"Cibalae",en:"Roman name for Vinkovci",note:"Colonia Aurelia Cibalae was its full Roman title. The word 'Cibalae' is still used in city branding"},
      {hr:"prahistorija",en:"prehistory",note:"'Vinkovci ima bogatu prahistoriju' = Vinkovci has a rich prehistory. The city takes enormous pride in its 8,300-year timeline"},
      {hr:"riblja čorba",en:"fish soup (Slavonian style)",note:"Slavonian catfish paprikash — a rich, spicy fish stew served over pasta. THE dish of eastern Croatia. 'Čorba' is the Slavonian word for soup"},
    ],
    facts:[
      "Two Roman Emperors born in the same town (Valentinian I and Valens) is unique in Roman history. No other city in the former empire can claim two emperors from one location.",
      "The Vučedol Calendar pot was found by accident during hotel construction in 1978 — workers almost discarded it. It is now recognized as the world's oldest known astronomical calendar.",
      "Agatha Christie's 'Murder on the Orient Express' specifically names Vinkovci as the location where the train gets stuck in snow — based on her real 1928 journey.",
      "The Croatian national anthem melody was composed by a Vinkovci-born man (Runjanin) to words written by a man from Zagreb (Mihanović) — a perfect Croatian collaboration.",
      "Emperor Valens's death at Adrianople in 378 AD is considered by historians one of the 5 most consequential battles in world history — it opened the door to the eventual fall of Rome.",
      "Vinkovci's pedestrian zone has Vučedol calendar star-map patterns embedded in the paving stones — you walk on a 4,600-year-old calendar every day.",
      "Steve Gaunt, the British volunteer, learned Croatian fluently and has been a Croatian citizen for over 20 years — his red phone box stands in the city center as affectionate tribute.",
      "Slavonian kulen takes 3-4 months to make — it's cured through winter then smoked with oak. EU protected designation means only kulen from Slavonia and Baranja can be called 'slavonski kulen'.",
    ],
    quiz:[
      {q:"How long has Vinkovci been continuously inhabited?",a:"8,300 years — since 6300 BC",al:["3,000 years","5,500 years","2,000 years"]},
      {q:"What two Roman Emperors were born in Vinkovci (then Cibalae)?",a:"Valentinian I and Valens",al:["Constantine and Theodosius","Diocletian and Maximian","Trajan and Hadrian"]},
      {q:"What famous novel features Vinkovci?",a:"Murder on the Orient Express — by Agatha Christie",al:["From Russia With Love","The Prisoner of Zenda","Death in the Adriatic"]},
      {q:"What is the Vučedol Calendar?",a:"A 4,600-year-old ceramic pot depicting the oldest known astronomical calendar in the world",al:["A bronze calendar tablet","A Roman stone inscription","A medieval manuscript"]},
      {q:"What is Slavonian kulen?",a:"A dense, paprika-spiced cured pork sausage — Croatia's most celebrated charcuterie",al:["A traditional dance","A type of embroidery","A folk instrument"]},
      {q:"Who composed the melody of the Croatian national anthem?",a:"Josip Runjanin, born near Vinkovci",al:["Antun Mihanović","Vatroslav Lisinski","Ivan Zajc"]},
    ]
  },
  zagreb:{
    title:"Zagreb",sub:"Capital & Cultural Heart of Croatia",color:"#dc2626",icon:"🏛️",
    intro:"Zagreb is Croatia's capital and largest city — 1,000 years of layered history compressed into a hillside medieval Upper Town, a grand Habsburg Lower Town, and a modern European metropolis of nearly one million people.",
    sections:[
      {h:"Origins: Two Hills, Two Churches, One City",t:"Zagreb began as two separate medieval settlements on adjacent hills above the Sava River. Kaptol — the ecclesiastical hill crowned by a cathedral — and Gradec — the civic hill protected by walls — coexisted in constant rivalry for centuries, sometimes literally at war with each other. The creek Medveščak separated them. Only in 1850 were they formally merged into the single city of Zagreb by decree of Ban Josip Jelačić. The Golden Bull of 1242, issued by King Béla IV of Hungary, granted Gradec the status of a free royal city — the foundation charter of Zagreb's civic identity."},
      {h:"Illyrian Movement — The Birth of Modern Croatian Identity",t:"In the 1830s and 1840s, Zagreb became the epicentre of the Croatian National Revival. The Illyrian Movement, led by Ljudevit Gaj, sought to standardize the South Slavic languages, create a unified literary Croatian, and resist Magyarization. Gaj standardized the Croatian Latin alphabet (adding č, š, ž) — the very letters you learn today. The Croatian National Theatre, the Croatian Academy, and the concept of Croatian literary language all emerged from Zagreb in this period. It was the city where Croatia decided to become itself."},
      {h:"Habsburg Vienna of the South",t:"Under the Austro-Hungarian empire, Zagreb was rebuilt as a grand European capital. The Lower Town (Donji Grad) was planned as a horseshoe of parks and boulevards — the famous 'Green Horseshoe' designed by Milan Lenuci in the 1880s. Neo-baroque and neo-Renaissance palaces, the Croatian National Theatre (1895), the University (1874), the Academy of Sciences (1866) — all built in two generations. Emperor Franz Joseph visited in 1895, the same day a young protester named Stjepan Radić burned the Hungarian flag in front of him. Austria-Hungary ended in 1918. Zagreb survived it intact."},
      {h:"Yugoslavia, WWII & the NDH",t:"From 1918-1941 Zagreb was the second city of the Kingdom of Yugoslavia. On April 10, 1941, the Nazi-backed Ustaše proclaimed the Independent State of Croatia (NDH) from Zagreb — a puppet fascist state that committed genocide against Serbs, Jews, Roma, and Croatian anti-fascists. The Jasenovac concentration camp is the most infamous symbol of NDH crimes. Croatian Partisans, led by communists, fought the NDH. After the war, Tito's Yugoslavia made Zagreb the capital of the Socialist Republic of Croatia within the Yugoslav federation — giving it cultural autonomy but political subordination."},
      {h:"1991: Independence & the Rocket Attack",t:"On June 25, 1991, Croatia declared independence from Yugoslavia. Three days later, JNA jets flew over Zagreb in a show of force — a terrifying moment the city never forgot. On October 7, 1991, two Yugoslav Air Force jets fired rockets at Banski Dvori — the seat of government — while President Franjo Tuđman and his Cabinet were meeting inside. The rockets hit the building. No one in the Cabinet was killed. The attack steeled Croatian resolve. Croatia survived the war with its capital unoccupied, and was internationally recognized on January 15, 1992."},
      {h:"Zagreb Today: Museums, Cafés & Potres",t:"Zagreb today is a liveable, walkable European capital with more museums per capita than any other European city — including the Museum of Broken Relationships, the Mimara, the Technical Museum, the Zagreb City Museum, and 350 others. The café culture on Tkalčićeva Street and the Dolac open-air market beneath the cathedral are the city's living rooms. A magnitude 5.5 earthquake struck on March 22, 2020 — the strongest in 140 years — damaging the Cathedral and Upper Town significantly. Reconstruction continues."}
    ],
    timeline:[
      {year:"1094",event:"Bishopric of Zagreb founded by King Ladislaus I — the official beginning of Zagreb"},
      {year:"1242",event:"Mongol invasion fails. King Béla IV grants Gradec the status of Free Royal City — Zagreb's founding charter"},
      {year:"1557",event:"Croatian Parliament (Sabor) permanently relocated to Zagreb. City becomes Croatia's political center"},
      {year:"1776",event:"Empress Maria Theresa merges Kaptol and Gradec administratively — first step toward unified Zagreb"},
      {year:"1835",event:"Ljudevit Gaj publishes in standardized Croatian and launches the Illyrian National Revival from Zagreb"},
      {year:"1850",event:"Ban Josip Jelačić formally merges all Zagreb settlements into one city"},
      {year:"1862",event:"First Croatian railway line opens: Zagreb–Sisak. Croatia enters the industrial age"},
      {year:"1895",event:"Croatian National Theatre opens. Emperor Franz Joseph attends. Stjepan Radić burns Hungarian flag outside"},
      {year:"Apr 10, 1941",event:"Ustaše proclaim the NDH (Independent State of Croatia). Zagreb becomes capital of a fascist puppet state"},
      {year:"May 8, 1945",event:"Liberation. Zagreb becomes capital of Socialist Republic of Croatia within Yugoslavia"},
      {year:"Jun 25, 1991",event:"Croatia declares independence. Zagreb becomes capital of the Republic of Croatia"},
      {year:"Oct 7, 1991",event:"JNA rockets strike Banski Dvori during Cabinet meeting. Tuđman survives"},
      {year:"Jan 15, 1992",event:"EU recognizes Croatian independence. Zagreb is internationally recognized capital"},
      {year:"Mar 22, 2020",event:"Magnitude 5.5 earthquake strikes Zagreb — strongest in 140 years. Cathedral damaged"},
    ],
    people:[
      {name:"Josip Jelačić",years:"1801–1859",role:"Ban of Croatia & National Hero",story:"The man on the horse in Zagreb's main square. Jelačić served as Ban (Governor) of Croatia and became a national hero by leading Croatian forces against the Hungarian Revolution in 1848 — paradoxically fighting for the Habsburg emperor while demanding Croatian autonomy from Hungary. He abolished serfdom in Croatia in 1848, before Austria did. His equestrian statue dominates Trg bana Jelačića — the living room of Zagreb. Under communism it was removed; after independence in 1990, it was restored, but facing the opposite direction."},
      {name:"Stjepan Radić",years:"1871–1928",role:"Peasant Leader & Political Martyr",story:"Croatia's most beloved democratic politician. Founder of the Croatian Peasant Party, Radić championed the rights of ordinary Croatian farmers against both Habsburg and Yugoslav centralizers. He was shot in the Yugoslav parliament in Belgrade in June 1928 — an assassination that traumatized Croatians forever. He died six weeks later in Zagreb. His grave at Mirogoj Cemetery is still visited daily. The attack proved to many Croatians that peaceful coexistence in Yugoslavia was impossible."},
      {name:"Nikola Tesla",years:"1856–1943",role:"Inventor (Croatian connection)",story:"While born in Smiljan (Lika) and dying in New York, Tesla spent formative years in Zagreb — he studied at the Technical School here and returned throughout his life. Zagreb celebrates its connection fiercely: the Tesla monument in front of the Technical Museum, a street named after him, and proud claim over the inventor of alternating current. Tesla's mother was Serbian, his father Serbian Orthodox priest, but his identity was proudly Croatian — he always signed letters 'Serb by birth, Croatian by homeland.'"},
      {name:"Miroslav Krleža",years:"1893–1981",role:"Greatest Croatian Writer",story:"Born and died in Zagreb, Krleža is the titan of Croatian literature — novelist, playwright, essayist, and editor. His novels 'The Return of Filip Latinovicz' and 'Banners' are the pinnacle of Croatian prose. He navigated impossible political terrain — communist by conviction but unwilling to be controlled, he argued with Tito and survived. He edited the Yugoslav Encyclopaedia from Zagreb for decades. Every educated Croatian has read him; many have opinions about him. He is buried at Mirogoj, Zagreb's magnificent arcaded cemetery."},
    ],
    vocab:[
      {hr:"Zagrepčanin / Zagrepčanka",en:"person from Zagreb (m/f)",note:"The adjective 'Zagrebački' — as in 'Zagrebački nogometni klub' (Zagreb Football Club)"},
      {hr:"Gornji Grad",en:"Upper Town",note:"The medieval hilltop quarter with St. Mark's Church, the Croatian Parliament, and cobblestone streets"},
      {hr:"Donji Grad",en:"Lower Town",note:"The Habsburg-era grid of boulevards, parks, and palaces — the 'real' Zagreb for most residents"},
      {hr:"Dolac",en:"Zagreb's main open-air market",note:"'Na Dolac' — at the market. Every morning, vendors sell fresh produce under red umbrellas above the cathedral"},
      {hr:"Špica",en:"Saturday morning coffee ritual",note:"The weekly tradition of seeing and being seen over coffee on Ilica or Tkalčićeva. Essential Zagreb culture"},
      {hr:"Licitarsko srce",en:"gingerbread heart",note:"Zagreb's iconic red gingerbread heart — UNESCO-listed craft. Given as a token of love and friendship"},
      {hr:"tramvaj",en:"tram",note:"Zagreb has one of Central Europe's oldest tram networks (since 1891). ZET runs 15 lines through the city"},
      {hr:"Mirogoj",en:"Zagreb's main cemetery / park",note:"One of Europe's most beautiful cemeteries — arcaded walls, ivy, parkland. Also where Jelačić and Radić are buried"},
    ],
    facts:[
      "Zagreb has over 350 museums — more museums per capita than any other European city. The Museum of Broken Relationships has toured 60 cities worldwide.",
      "The funicular connecting Lower and Upper Town (opened 1890) is just 66 meters long — one of the world's shortest public transport lines. It still runs today.",
      "Nikola Tesla's face appeared on the Croatian 100-kuna banknote. When Croatia adopted the euro in 2023, he was not on the new coins — a source of local debate.",
      "The Zagreb Cathedral has twin neo-Gothic spires completed in 1906. The earthquake of 2020 damaged one spire significantly — reconstruction is ongoing.",
      "Tkalčićeva Street was originally the course of Medveščak Creek — the stream that divided Kaptol from Gradec. It was paved over in the 19th century and became Zagreb's most famous café street.",
      "Zagreb's Advent (Christmas market) was voted Europe's Best Christmas Market four years in a row (2016–2019) by European Best Destinations.",
    ],
    quiz:[
      {q:"What royal document from 1242 is considered Zagreb's founding charter?",a:"The Golden Bull — granting Gradec the status of Free Royal City",al:["The Charter of Kaptol","The Treaty of Vienna","The Declaration of Slavonia"]},
      {q:"What happened at Banski Dvori on October 7, 1991?",a:"JNA jets fired rockets at the government building during a Cabinet meeting",al:["Croatia declared independence","The first democratic elections were held","A peace treaty was signed"]},
      {q:"What is 'Špica' in Zagreb culture?",a:"The Saturday morning coffee ritual of seeing and being seen",al:["The Zagreb Christmas market","The Upper Town cable car","A traditional folk dance"]},
      {q:"What UNESCO-listed craft is Zagreb most famous for?",a:"The licitarsko srce — decorated gingerbread heart",al:["The Šestinski šešir hat","The Zagreb Cathedral bells","The tram network"]},
      {q:"Who was shot in the Yugoslav parliament, later dying in Zagreb in 1928?",a:"Stjepan Radić",al:["Josip Jelačić","Ante Starčević","Frano Supilo"]},
      {q:"What famous street was built over a creek that once divided Zagreb's two medieval towns?",a:"Tkalčićeva Street (over the Medveščak Creek)",al:["Ilica Street","Vlaška Street","Jurišićeva Street"]},
    ]
  },
  split:{
    title:"Split",sub:"City Living Inside a Roman Palace",color:"#1d4ed8",icon:"🏛️",
    intro:"Split is Croatia's second-largest city and the capital of Dalmatia — a 1,700-year-old city that grew organically inside a Roman emperor's retirement palace. Today 170,000 people live, work, and celebrate inside Diocletian's 3rd-century walls.",
    sections:[
      {h:"Diocletian's Palace — The Emperor Retires Home",t:"Gaius Aurelius Valerius Diocletianus was born around 244 AD in Salona (today's Solin, 6km from Split) — a son of Dalmatian peasants who rose to become emperor of Rome. After ruling for 21 years, he made history by voluntarily abdicating in 305 AD — the first Roman emperor to do so. He retreated to the enormous palace he had been building since 295 AD on the Dalmatian coast. The palace covers 38,500 square meters, its walls are 2 meters thick and 17-26 meters high, and it had 16 towers. Diocletian spent his retirement here growing cabbages until his death around 312 AD."},
      {h:"From Palace to City: 1,700 Years of Adaptation",t:"After Diocletian's death, the palace served various military and administrative purposes. In the 7th century, refugees fleeing Slavic and Avar raids on nearby Salona moved inside the palace walls — and never left. Over the following centuries, medieval Split grew organically within the ancient structure. Churches were built inside temples, houses grew between columns, streets followed ancient corridors. Today the Diocletian's Palace UNESCO World Heritage Site is one of the world's most remarkable examples of continuous human habitation — a living Roman monument."},
      {h:"Ivan Meštrović — Croatia's Michelangelo",t:"Split is the spiritual home of Croatia's greatest sculptor, Ivan Meštrović (1883–1962). Though born in Slavonia, Meštrović is inseparable from Split — his gallery (the Meštrović Gallery, housed in a villa he designed) contains 190 of his monumental works. His statue of Gregory of Nin (Grgur Ninski) stands before the Golden Gate of Diocletian's Palace — 8.5 meters tall, thumb polished bronze-bright by a million tourists rubbing it for luck. Meštrović studied in Vienna, exhibited with Rodin in Paris, was commissioned by the Vatican, and was the first living artist to have a solo show at the Metropolitan Museum of New York."},
      {h:"Hajduk Split — The People's Club",t:"Founded in Prague in 1911 by Split students who chose the name 'Hajduk' — the rebellious Balkan freedom fighter — Hajduk Split is the most beloved and most contentious football club in Croatia. The Torcida, founded in 1950 as one of the world's first organized supporter groups, invented the modern concept of the ultras. Dinamo Zagreb vs Hajduk Split is the defining derby of Croatian football — 'Vječni derbi' (Eternal Derby). Split's identity is inseparable from the blue-and-white stripes. 'Bili smo, jesmo i bit ćemo Hajduk' — We were, are, and will be Hajduk."},
    ],
    timeline:[
      {year:"295 AD",event:"Emperor Diocletian begins construction of his retirement palace on the Dalmatian coast"},
      {year:"305 AD",event:"Diocletian abdicates — first Roman emperor to do so. Retires to Split and grows cabbages"},
      {year:"7th c.",event:"Refugees from destroyed Salona settle inside the palace. The city of Split is born"},
      {year:"1420",event:"Venice takes Split. 377 years of Venetian rule. Trade and architecture flourish"},
      {year:"1797",event:"Napoleon ends Venice. Split passes to Habsburg Austria"},
      {year:"1911",event:"Hajduk Split football club founded in Prague by Split students"},
      {year:"1918",event:"Split joins the Kingdom of Serbs, Croats and Slovenes"},
      {year:"1941",event:"Italian occupation during WWII. Partisan resistance grows"},
      {year:"1991",event:"Croatia declares independence. Split votes overwhelmingly for Croatian sovereignty"},
      {year:"1979",event:"Diocletian's Palace designated UNESCO World Heritage Site"},
    ],
    people:[
      {name:"Diocletian",years:"244–312 AD",role:"Roman Emperor",story:"Born a Dalmatian peasant, rose to command Rome, ruled for 21 years, voluntarily abdicated — and retired to build the most impressive private residence in the ancient world on his home coast. His palace is now a city. When ambassadors once begged him to return to power, he reportedly replied: 'If only you could see the cabbages I've planted with my own hands, you wouldn't make such a proposal.'"},
      {name:"Ivan Meštrović",years:"1883–1962",role:"Sculptor — Croatia's Greatest",story:"One of the 20th century's most powerful sculptors. His monumental works — the Gregory of Nin statue, the Job, the Pietà, the Wells of Life — combine Croatian folk tradition with classical grandeur. He was friends with Rodin, admired by Mussolini (before he refused to collaborate), imprisoned by the Ustaše, and ultimately emigrated to America where he taught at Syracuse and Notre Dame. He wanted his Split gallery to be his gift to his homeland."},
      {name:"Goran Ivanišević",years:"1971–",role:"Tennis Champion",story:"Split's greatest sporting hero. After three Wimbledon final losses (1992, 1994, 1998), Ivanišević entered Wimbledon 2001 as a wild card — ranked 125th in the world. He won. All of Split watched live on outdoor screens. When he returned home, 150,000 people met him at the harbor. The celebration lasted days. His serve was the most feared in tennis history; his personality made him Croatia's most beloved sportsman."},
    ],
    vocab:[
      {hr:"Splićanin / Splićanka",en:"person from Split (m/f)",note:"Split people are famously proud, loud, and passionate — proud to be called Splićanin"},
      {hr:"riva",en:"Split's famous seafront promenade",note:"The beating heart of Split — where everyone walks, sits, argues about football, and watches the world"},
      {hr:"fjaka",en:"blissful Mediterranean idleness",note:"The Dalmatian art of doing nothing perfectly. Split elevated it to philosophy: 'Nemoj mi kvarit fjaku' — don't ruin my fjaka"},
      {hr:"Bili",en:"The Whites — Hajduk Split's nickname",note:"From their white-and-blue kit. 'Hajdukovci' or simply 'Bili' — the most passionate football identity in Croatia"},
      {hr:"Torcida",en:"Hajduk's supporter group (founded 1950)",note:"One of the world's first organized supporter groups — predates most European ultras by 20 years"},
      {hr:"Dioklecijanova palača",en:"Diocletian's Palace",note:"How locals refer to the World Heritage Site they live inside. Abbreviated to just 'palača' in conversation"},
    ],
    facts:[
      "Diocletian's Palace is the only Roman imperial palace in the world that is still fully inhabited — about 3,000 people live within its walls today.",
      "The Gregory of Nin statue's left big toe is polished bright gold from tourists rubbing it — local legend says it brings good luck.",
      "Goran Ivanišević entered Wimbledon 2001 ranked 125th in the world and won — the lowest-ranked player ever to win the title.",
      "Split's Torcida (founded October 28, 1950) is one of the oldest organized football supporter groups in the world.",
      "The Vestibule of Diocletian's Palace has near-perfect natural acoustics — klapa groups perform there daily, the sound bouncing off the ancient stone.",
    ],
    quiz:[
      {q:"What unusual thing did Emperor Diocletian do in 305 AD?",a:"He voluntarily abdicated — the first Roman emperor to do so",al:["He converted to Christianity","He moved the capital to Byzantium","He lost a battle and was exiled"]},
      {q:"When was Hajduk Split football club founded, and where?",a:"1911 — founded in Prague by Split students",al:["1905 in Split","1920 in Zagreb","1908 in Vienna"]},
      {q:"What is 'fjaka'?",a:"The Dalmatian art of blissful, guilt-free idleness",al:["A type of Dalmatian wine","A traditional sailing boat","A coastal wind"]},
      {q:"What makes Diocletian's Palace unique among Roman monuments?",a:"It is the only Roman imperial palace still fully inhabited — about 3,000 residents live inside",al:["It has never been excavated","It was built entirely underground","It is the largest Roman structure ever built"]},
      {q:"What sporting achievement made Goran Ivanišević a Split legend?",a:"Winning Wimbledon 2001 as a wild card ranked 125th in the world",al:["Winning three consecutive US Opens","Winning the Davis Cup for Croatia","Reaching world number 1 ranking"]},
    ]
  },
  mostar:{
    title:"Mostar & Herzegovina",sub:"The Bridge That Was Destroyed and Reborn",color:"#b45309",icon:"🌉",
    intro:"Mostar is the cultural capital of Herzegovina — a region historically and ethnically Croatian. Its iconic Stari Most (Old Bridge) was built in 1566, destroyed in war in 1993, and rebuilt from the same stone in 2004. The bridge is a metaphor for the region itself.",
    sections:[
      {h:"The Stari Most — Ottoman Masterpiece",t:"Stari Most ('Old Bridge') was built in 1566 by Ottoman architect Mimar Hayruddin, a student of the legendary Sinan. The single-span arch bridge of local limestone (tenelija) crosses the Neretva River at 21 meters above the water, with a span of 29 meters. It was the widest man-made arch bridge in the world at the time of its construction. For 427 years it stood. The traditional divers of Mostar — 'Mostari' (bridge keepers) — have leaped from its 21-meter parapet for centuries. The bridge gave the city its name."},
      {h:"Croatian Herzegovina — History and Identity",t:"Herzegovina (Hercegovina) is the southern region of modern Bosnia and Herzegovina. The name comes from 'herceg' (duke) — specifically Stjepan Vukčić Kosača, who called himself 'Herceg of Hum and the Coast' in the 15th century. Croatians are one of the three constituent peoples of Bosnia and Herzegovina, and in Herzegovina — particularly west and west-central Herzegovina — Croatians form the majority. Mostar is the urban center of Croatian Herzegovina. The University of Mostar, Cathedral of the Holy Trinity, HŠK Zrinjski football club, and the Croatian Cultural Centre are the pillars of Herzegovinian Croatian life."},
      {h:"The War 1992-1994 and the Bridge's Destruction",t:"During the Bosnian War, Mostar was attacked first by the JNA and Serb forces (1992), then torn apart by conflict between Croatian and Bosniak forces (1993-1994). On November 9, 1993 — the same day as the fall of the Berlin Wall four years earlier — Croatian HVO (Croatian Defence Council) artillery destroyed the Stari Most. The bridge fell into the Neretva. It was a cultural crime that shocked the world. The complex political and military context of why it happened is still debated and contested by historians and the communities involved."},
      {h:"Reconstruction and UNESCO World Heritage",t:"After the Dayton Agreement ended the war, the international community committed to rebuilding the Stari Most as a symbol of reconciliation. The same type of local limestone (tenelija) was quarried. Ottoman-era bridge-building techniques were researched and revived. On July 23, 2004, the reconstructed Stari Most was inaugurated. In 2005, the Old Bridge area was designated a UNESCO World Heritage Site — 'a symbol of international cooperation, of the coexistence of diverse cultural, ethnic and religious communities.' The bridge divers returned."},
    ],
    timeline:[
      {year:"1566",event:"Stari Most completed by Mimar Hayruddin — the widest stone arch bridge in the world at the time"},
      {year:"1878",event:"Bosnia-Herzegovina occupied by Austria-Hungary after the Congress of Berlin"},
      {year:"1918",event:"Mostar joins the Kingdom of Serbs, Croats and Slovenes"},
      {year:"1945",event:"Mostar incorporated into Socialist Republic of Bosnia and Herzegovina within Yugoslavia"},
      {year:"1992",event:"Bosnian War begins. Mostar attacked by JNA and Serb forces. Croatian and Bosniak forces defend together"},
      {year:"1993",event:"Croatian-Bosniak conflict erupts. Battle of Mostar. November 9: Stari Most destroyed"},
      {year:"1994",event:"Washington Agreement ends Croatian-Bosniak conflict. Federation of Bosnia and Herzegovina created"},
      {year:"2004",event:"Reconstructed Stari Most inaugurated. Divers leap from the bridge again"},
      {year:"2005",event:"Old Bridge area designated UNESCO World Heritage Site"},
    ],
    people:[
      {name:"Stjepan Vukčić Kosača",years:"1404–1466",role:"Herceg of Hum — Founder of Herzegovina",story:"The medieval nobleman who gave Herzegovina its name — he called himself 'Herceg of Hum and the Coast' in 1448, and the land became 'Hercegovina' (land of the Herceg). His territory covered most of modern Herzegovina and parts of Dalmatia. He navigated between Ottoman power and Christian coalitions with varying success. He eventually converted to Islam under Ottoman pressure to preserve his lands — a decision still discussed centuries later."},
      {name:"Mimar Hayruddin",years:"16th c.",role:"Ottoman Architect",story:"The architect of Stari Most. A student of the great Ottoman architect Sinan, Hayruddin was commissioned to replace an older suspension bridge at Mostar. His design — a single daring limestone arch spanning 29 meters — was so bold that contemporaries predicted it would collapse immediately. He reputedly prepared his funeral shroud before the wooden scaffolding was removed. The bridge stood for 427 years. His achievement remains one of the architectural wonders of the Ottoman world."},
      {name:"Mladen Naletilić Tuta",years:"1946–",role:"HVO Commander (convicted war criminal)",story:"A reminder that the Croatian story in Mostar is not simple. Naletilić was convicted by the ICTY for war crimes during the Croatian-Bosniak conflict — specifically for crimes against Bosniak civilians in Herzegovina. His conviction is part of Croatia's reckoning with its own role in the Bosnian War. Croatia's path to EU membership required acknowledging and prosecuting these crimes."},
    ],
    vocab:[
      {hr:"Hercegovina",en:"Herzegovina — southern region of BiH",note:"From 'herceg' (duke) — the historical Croatian and Bosniak homeland south of the mountains"},
      {hr:"Stari Most",en:"Old Bridge",note:"'Stari' = old, 'Most' = bridge. Mostar literally means 'bridge keeper' — those who kept the old bridge"},
      {hr:"Mostari",en:"bridge divers / bridge keepers",note:"The traditional divers who leap from the 21-meter bridge — a Mostar tradition for centuries"},
      {hr:"tenelija",en:"local limestone used for the bridge",note:"The specific stone quarried near Mostar — creamy white, strong, and able to be worked like wood when freshly cut"},
      {hr:"Neretva",en:"the river flowing through Mostar",note:"The Neretva River's brilliant emerald-green water flows through Herzegovina to the Adriatic at Ploče"},
      {hr:"Herceg",en:"duke (medieval title)",note:"From German 'Herzog' — the title that gave Herzegovina its name"},
    ],
    facts:[
      "The Stari Most bridge has no mortar — the limestone blocks are held together purely by gravity and precision cutting. The same technique was used in reconstruction.",
      "The traditional Mostar dive from the bridge (21 meters) is an initiation rite — young men only jump after years of training. The impact with water at that height requires perfect form.",
      "The day Stari Most was destroyed (November 9, 1993) was the exact anniversary of Kristallnacht and the fall of the Berlin Wall — the symbolism was not lost on the world.",
      "When the bridge was reconstructed, over 1,000 stones from the riverbed were recovered and used in the new bridge alongside newly quarried tenelija stone.",
      "HŠK Zrinjski Mostar (founded 1905) is the most successful Croatian football club in BiH — named after the noble Zrinski family, Croatian national heroes.",
    ],
    quiz:[
      {q:"When was the Stari Most originally built, and by whom?",a:"1566, by Ottoman architect Mimar Hayruddin",al:["1389, by Venetian engineers","1650, by Austrian architects","1488, by Croatian stonemasons"]},
      {q:"What does the name 'Mostar' mean?",a:"Bridge keeper — from 'most' (bridge) and 'ar' (keeper)",al:["Stone city","River crossing","Old town"]},
      {q:"On what date was the Stari Most destroyed?",a:"November 9, 1993 — the anniversary of the Berlin Wall's fall",al:["June 28, 1993","April 6, 1992","December 25, 1993"]},
      {q:"What type of stone was the bridge built and rebuilt from?",a:"Tenelija — local Herzegovinian limestone",al:["Carrara marble","Dalmatian dolomite","Bosnian granite"]},
      {q:"When was the reconstructed Stari Most opened?",a:"July 23, 2004",al:["June 25, 2001","November 9, 1999","March 8, 2006"]},
    ]
  },
  tomislavgrad:{
    title:"Tomislavgrad",sub:"Where Croatia Was Born — 925 AD",color:"#7c3aed",icon:"👑",
    intro:"Tomislavgrad — historically Duvno — is the site where Croatia's first king was crowned in 925 AD and the Croatian Kingdom reached its earliest peak. Though today in Bosnia and Herzegovina, it is the historical cradle of the Croatian state and one of the most sacred sites in Croatian national memory.",
    sections:[
      {h:"The Coronation of King Tomislav — 925 AD",t:"In 925 AD, on the Duvanjsko polje (Duvno plain) near present-day Tomislavgrad, the Croatian nobility convened a grand assembly. Pope John X sent legates to crown Tomislav as Rex Chroatorum — King of the Croats. It was the moment a collection of Croatian tribes and župas crystallized into a recognized European kingdom. Tomislav ruled over Pannonian and Dalmatian Croatia, commanded a powerful army, and reportedly maintained a fleet of 80 large ships and 100 smaller ones on the Adriatic. He halted the Bulgarian Tsar Simeon's expansion and was recognized by both the Pope and the Byzantine Empire."},
      {h:"The Name: From Duvno to Tomislavgrad",t:"The town's original name was Duvno — a name with ancient Illyrian roots predating Slavic settlement. In 1925, on the exact 1,000th anniversary of King Tomislav's coronation, the town was renamed Tomislavgrad ('City of Tomislav') in honor of Croatia's first king. The renaming was a deliberate political and cultural act — connecting the Croatian people of Herzegovina to their medieval royal heritage. The town has been in Bosnia and Herzegovina since 1995, but remains overwhelmingly Croatian and Catholic in identity."},
      {h:"The Croatian Assembly of 925 — Duvanjski Sabor",t:"The Duvanjski sabor (Assembly of Duvno) in 925 AD was more than a coronation — it was the founding constitutional moment of the Croatian state. Croatian župans (regional lords) from across Croatia and Dalmatia gathered to acknowledge Tomislav as their king. The Assembly established the Church Province of Split, organized the Croatian dioceses, and addressed the long-standing dispute between the Latin and Slavic liturgies. The decisions made here shaped Croatian ecclesiastical and political organization for centuries. It was Croatia's first recorded grand national assembly."},
      {h:"Herzegovina — Croatian Heartland",t:"The region around Tomislavgrad — western Herzegovina — has been continuously inhabited by Croats for over 1,300 years. The Croatian people of Herzegovina maintained their identity through Ottoman rule (1463–1878), through Austro-Hungarian administration, through both Yugoslav states, and through the 1992-1995 war. The Croats of Herzegovina consider themselves the oldest continuous Croatian community — the descendants of those who were there when Tomislav was crowned. The Franciscan order, established in Herzegovina in the 13th century, was the primary guardian of Croatian Catholic identity during five centuries of Ottoman rule."},
    ],
    timeline:[
      {year:"925 AD",event:"KING TOMISLAV CROWNED — Pope John X recognizes Croatia as a kingdom. The Duvanjski sabor convenes"},
      {year:"928 AD",event:"King Tomislav defeats Bulgarian Tsar Simeon at the Battle of the Bosna River — protecting Croatian independence"},
      {year:"1102",event:"Croatia enters personal union with Hungary under King Koloman — Croatian nobility retain rights"},
      {year:"1463",event:"Ottoman conquest of Bosnia. Herzegovina under Ottoman rule begins. Franciscans become guardians of Croatian identity"},
      {year:"1878",event:"Congress of Berlin — Austria-Hungary occupies Bosnia-Herzegovina. Ottoman era ends"},
      {year:"1925",event:"1,000th anniversary of Tomislav's coronation. Town officially renamed Tomislavgrad"},
      {year:"1991",event:"Croatian-Herzegovinian community declares political affiliation with the new Republic of Croatia"},
      {year:"1992",event:"Bosnian War begins. Croatian Council of Defence (HVO) formed to protect Croatian population"},
      {year:"1995",event:"Dayton Agreement. Bosnia-Herzegovina internationally recognized with current borders"},
    ],
    people:[
      {name:"King Tomislav",years:"910–928 AD",role:"First King of Croatia",story:"The most important figure in Croatian history — the man who transformed a fragmented collection of Croatian tribes into a recognized European kingdom. The historical record is thin (a single papal letter from 925 AD refers to him as 'king') but the implications are enormous: he united Pannonian and Dalmatian Croatia, built a military powerful enough to defeat the Bulgarian empire, and won recognition from both Rome and Constantinople. His coronation site near Duvno became sacred Croatian soil. He is on Croatian banknotes; mountains are named for him; his name is among the most popular Croatian boys' names."},
      {name:"Fra Grgo Martić",years:"1822–1905",role:"Franciscan Friar & Croatian Poet",story:"Born in the Tomislavgrad area, Fra Grgo Martić spent his life as a Franciscan friar and fighter for Croatian identity in Herzegovina. His epic poems about the Homeland and his political activism made him the voice of Herzegovinian Croats during the Ottoman and early Austrian periods. He served as a Franciscan provincial, diplomat, and poet simultaneously. His collection 'Osvetnici' (The Avengers) celebrated Croatian resistance fighters against Ottoman rule."},
    ],
    vocab:[
      {hr:"Kralj",en:"king",note:"'Kralj Tomislav' — King Tomislav. The word 'kralj' comes from Carolus (Charlemagne's name in Slavic)"},
      {hr:"sabor",en:"assembly / parliament",note:"The Duvanjski sabor of 925 AD was Croatia's first recorded national assembly. 'Sabor' is still the name of Croatia's parliament"},
      {hr:"župan",en:"regional lord / county prefect",note:"Medieval Croatian administrators. 'Župan' survives today — county heads in Croatia are still called 'župan'"},
      {hr:"Hercegovina",en:"Herzegovina",note:"The historical region whose Croatian identity stretches back to the 7th-century settlement"},
      {hr:"fra",en:"Friar (Franciscan title)",note:"'Fra Grgo' — the honorific for Franciscan friars. The Franciscan order was the backbone of Croatian identity in Herzegovina"},
      {hr:"kruna",en:"crown",note:"'Kruna' — the royal crown. King Tomislav's coronation ('krunidba') gave Croatia its first royal crown"},
    ],
    facts:[
      "The single most important documentary evidence of Tomislav's kingship is a letter from Pope John X dated 925 AD — which refers to him as 'king' rather than 'duke.' One letter changed history.",
      "Tomislav reportedly commanded 100,000 infantry, 60,000 cavalry, 80 large warships and 100 smaller vessels — if accurate, medieval Croatia was a major military power.",
      "The Duvanjsko polje (Duvno plain) where the coronation took place is one of the largest karst fields in the Balkans — a natural amphitheatre that could hold an entire medieval army.",
      "The Franciscan presence in Herzegovina is unbroken since the 13th century — the Franciscans maintained Croatian literacy, Catholic faith, and national identity through 400 years of Ottoman rule.",
      "Tomislavgrad sits at 870 meters altitude — the highest town in Bosnia and Herzegovina. Winters are severe, and the area produces some of the finest lamb and cheese in the region.",
    ],
    quiz:[
      {q:"In what year was King Tomislav crowned, and where?",a:"925 AD — on the Duvanjsko polje near present-day Tomislavgrad",al:["879 AD in Nin","1102 AD in Split","945 AD in Zadar"]},
      {q:"What is the original name of Tomislavgrad?",a:"Duvno",al:["Herceg Grad","Kruševo","Livno"]},
      {q:"When was the town renamed Tomislavgrad, and why?",a:"1925 — on the 1,000th anniversary of Tomislav's coronation",al:["1918 — after WWI","1945 — after WWII","1991 — at Croatian independence"]},
      {q:"What was the Duvanjski sabor of 925 AD?",a:"Croatia's first grand national assembly — establishing the kingdom and church organization",al:["A military battle","A trade congress","A religious council only"]},
      {q:"Which religious order preserved Croatian identity in Herzegovina during Ottoman rule?",a:"The Franciscans",al:["The Dominicans","The Jesuits","The Benedictines"]},
    ]
  },
  knin:{
    title:"Knin",sub:"Medieval Capital · Occupied · Liberated",color:"#991b1b",icon:"🏰",
    intro:"Knin is a Dalmatian hinterland fortress city with a double identity: medieval seat of Croatian kings from the 10th century, and the city whose liberation on August 5, 1995 marked the decisive moment of the Homeland War — the day Croatia won.",
    sections:[
      {h:"Medieval Croatian Capital — Seat of Kings",t:"The Knin Fortress (Kninska tvrđava) stands on a 345-meter rock dominating the Krka River canyon. It is one of the largest fortifications in Croatia and among the most strategically significant in the Balkans — whoever held Knin controlled the routes between coastal Dalmatia and the Slavonian interior. In the 10th and 11th centuries, Knin was the seat of Croatian kings — including the last native Croatian king, Stjepan II (died 1091). The medieval Croatian župas surrounding Knin were the heartland of the early Croatian state."},
      {h:"1990: The Log Revolution",t:"As Yugoslavia began disintegrating in 1990, Serb nationalist politicians — led by the Serbian Democratic Party (SDS) under Milan Babić and Jovan Rašković — organized in the Knin region. The population of the Knin area was majority Serb. In August 1990, after Croatia's first democratic elections brought the Croatian Democratic Union to power, armed Serb paramilitaries began blocking roads with logs and felled trees — dubbed the 'Log Revolution' or Balvan revolucija. Roads to Dalmatia were cut off. Knin police refused to obey Zagreb. The Serbian Autonomous Oblast of Krajina was declared, with Knin as its capital."},
      {h:"The Republic of Serbian Krajina (1991-1995)",t:"On December 19, 1991, the Republic of Serbian Krajina (RSK) formally declared independence from Croatia with Knin as its capital. The RSK controlled approximately one-third of Croatian territory, cutting Croatia in two. The JNA (Yugoslav People's Army) supported the RSK with weapons, troops, and logistics. UN peacekeepers (UNPROFOR) were deployed in 1992, effectively freezing the front lines and protecting RSK control. The Croatian cities of Vukovar (destroyed), Zadar, Šibenik, Dubrovnik, and Osijek were attacked. The siege of Croatian territory and civilian populations continued."},
      {h:"Operation Storm — August 4-5, 1995",t:"On August 4, 1995, at 5:00 AM, Croatian artillery opened fire along the entire front line of the RSK in Operation Storm (Operacija Oluja). It was the largest European land military operation since World War II. Over 100,000 Croatian soldiers attacked on multiple axes simultaneously. By August 5, Croatian forces had broken through RSK defenses on every front. General Ante Gotovina's forces reached the outskirts of Knin on the evening of August 4. On the morning of August 5, Croatian soldiers raised the Croatian flag over Knin Fortress at approximately 10:00 AM. President Franjo Tuđman flew to Knin the same day. The RSK ceased to exist."},
    ],
    timeline:[
      {year:"10th c.",event:"Knin established as seat of Croatian kings — fortified capital of the medieval Croatian state"},
      {year:"1069",event:"King Petar Krešimir IV issues the first document signed 'from Knin' — earliest written record of the city"},
      {year:"1091",event:"King Stjepan II dies — last native Croatian king. Knin's role as royal capital ends"},
      {year:"1522",event:"Ottoman forces take Knin Fortress after a siege. Dalmatian hinterland under Ottoman control"},
      {year:"1688",event:"Venice retakes Knin from the Ottomans after a siege. Venetian era begins"},
      {year:"1797",event:"Napoleon ends Venice. Knin passes to Habsburg Austria"},
      {year:"Aug 1990",event:"LOG REVOLUTION — Armed Serb paramilitaries block roads. Serbian Autonomous Oblast proclaimed in Knin"},
      {year:"Dec 19, 1991",event:"Republic of Serbian Krajina declared with Knin as capital. One-third of Croatia occupied"},
      {year:"Aug 4, 1995",event:"OPERATION STORM BEGINS — Croatian forces attack along entire front at 5:00 AM"},
      {year:"Aug 5, 1995",event:"LIBERATION — Croatian flag raised over Knin Fortress. RSK ceases to exist. Homeland War effectively won"},
      {year:"Aug 5",event:"Observed annually as Dan pobjede — Victory and Homeland Thanksgiving Day"},
    ],
    people:[
      {name:"King Stjepan II",years:"?–1091",role:"Last Native Croatian King",story:"The last Croatian king of the native Trpimirović dynasty died without a legitimate heir in 1091. His death opened the succession crisis that led to Croatia entering personal union with Hungary in 1102. His court at Knin Fortress was the last fully independent Croatian royal court. The 900 years that followed — Habsburg, Ottoman, Venetian, Yugoslav — were all in some sense the consequence of his death without an heir."},
      {name:"Milan Martić",years:"1954–",role:"RSK Police Chief / President (war criminal)",story:"One of the key organizers of the Serb uprising in Knin and the RSK's last president. Convicted by the ICTY for war crimes and crimes against humanity — including ordering rocket attacks on Zagreb on May 2-3, 1995 that killed 7 civilians. He served 35 years. His conviction established that the RSK leadership bore responsibility for the ethnic cleansing of Croatian civilians from occupied territories."},
      {name:"General Ante Gotovina",years:"1955–",role:"Croatian Military Commander — Operation Storm",story:"The commander of Croatian forces in Split Military District whose forces took Knin in Operation Storm. Gotovina was indicted by the ICTY (2001), lived as a fugitive, was arrested in Tenerife (2005), convicted (2011), and then fully acquitted by the appeals chamber (2012) — one of the most dramatic reversals in ICTY history. His acquittal was celebrated in Croatia as vindication of Operation Storm. He is considered a national hero — the general who liberated Knin."},
    ],
    vocab:[
      {hr:"Oluja",en:"Storm — Operation Storm",note:"'Operacija Oluja' — the military operation of August 4-5, 1995 that liberated Knin and ended the RSK"},
      {hr:"Dan pobjede",en:"Victory Day — August 5",note:"'Dan pobjede i domovinske zahvalnosti' — Victory and Homeland Thanksgiving Day. National holiday."},
      {hr:"Krajina",en:"borderland / military frontier",note:"From 'kraj' (border, end). The Vojna krajina was the Habsburg military frontier — the region's historical name"},
      {hr:"tvrđava",en:"fortress",note:"'Kninska tvrđava' — Knin Fortress. One of Croatia's most important medieval fortifications"},
      {hr:"zastava",en:"flag",note:"'Zastava Hrvatske' — the Croatian flag raised over Knin on August 5, 1995. The moment Croatia calls its liberation"},
      {hr:"oslobođenje",en:"liberation",note:"'Oslobođenje Knina' — the liberation of Knin. Used specifically for the August 5, 1995 moment"},
    ],
    facts:[
      "Operation Storm lasted just 84 hours — one of the fastest decisive military operations in modern European history.",
      "The Croatian flag raised over Knin Fortress on August 5, 1995 is arguably the most iconic image in modern Croatian history — photographed and broadcast worldwide.",
      "Knin Fortress sits on a 345-meter rock — visible from 40km away. Whoever held it controlled the roads between coastal Dalmatia and inland Croatia.",
      "President Tuđman flew to Knin the same day it was liberated and addressed troops from the fortress. He quoted the medieval Croatian poet Ivan Gundulić: 'O lijepa, o draga, o slatka slobodo' — O beautiful, dear, sweet freedom.",
      "August 5 is a national holiday in Croatia (Dan pobjede). In Knin, the ceremony at the fortress involves raising the same type of Croatian flag every year at the exact time of the original liberation.",
    ],
    quiz:[
      {q:"What was Knin's role in medieval Croatia?",a:"Seat of Croatian kings — fortified capital of the medieval Croatian state",al:["A Venetian trading post","A Byzantine fortress","A Roman military camp"]},
      {q:"What was the 'Log Revolution' of 1990?",a:"Armed Serb paramilitaries blocking roads with logs — cutting off Dalmatia from Zagreb",al:["A workers' strike in lumber mills","A protest against deforestation","An anti-Yugoslav uprising"]},
      {q:"When did Croatian forces raise the flag over Knin Fortress?",a:"August 5, 1995 — during Operation Storm",al:["June 25, 1991","November 18, 1991","October 7, 1991"]},
      {q:"What does 'Dan pobjede' mean?",a:"Victory Day — Croatia's national holiday on August 5",al:["Day of Remembrance","Day of Independence","Day of Peace"]},
      {q:"How long did Operation Storm last before Knin was liberated?",a:"84 hours — one of the fastest decisive operations in modern European history",al:["12 days","6 months","3 weeks"]},
    ]
  }
};
// ═══ CITY OF THE DAY ═══
const CROATIAN_CITIES = [
  {name:"Dubrovnik",region:"Dalmatia",icon:"🏰",color:"#dc2626",tagline:"Pearl of the Adriatic",
    intro:"Dubrovnik is Croatia's most recognisable city — a perfectly preserved Renaissance walled city on the southern Dalmatian coast. For centuries the Republic of Ragusa was an independent city-state whose diplomatic genius kept it free from every empire that surrounded it.",
    history:"The Republic of Ragusa (1358–1808) was a marvel of small-state diplomacy — paying tribute to both the Ottoman Sultan and the Habsburg Emperor, maintaining fleets in every Mediterranean port, and abolishing the slave trade in 1416 (400 years before Britain). Its motto: 'Non bene pro toto libertas venditur auro' — Freedom is not well sold for all the gold. Napoleon ended it in 1808. The city walls (1.94km, up to 6m thick) were never breached in battle.",
    facts:["The Republic of Ragusa abolished slave trade in 1416 — 400 years before Britain","Dubrovnik's walls are 1.94km long and were never breached in battle","George Bernard Shaw called it 'the pearl of the Adriatic' — the phrase stuck","During the 1991-92 Homeland War, Dubrovnik was besieged and shelled for 7 months","Game of Thrones filmed 'King's Landing' extensively in Dubrovnik"],
    vocab:[{hr:"Raguza",en:"old name for Dubrovnik",note:"The Latin name used for the Republic of Ragusa — still heard in conversation"},{hr:"Stradun",en:"the main boulevard of Dubrovnik",note:"The polished limestone main street — the heart of the Old Town"},{hr:"Dubrovčanin",en:"person from Dubrovnik",note:"Dubrovnik people are famously proud of their city's independence and refinement"}],
    didYouKnow:"Dubrovnik pharmacies have been operating continuously since 1317 — the oldest still-active pharmacies in Europe."},
  {name:"Rijeka",region:"Kvarner",icon:"⚓",color:"#0e7490",tagline:"Port City of a Hundred Flags",
    intro:"Croatia's largest port and third-largest city, Rijeka has been ruled by Venice, France, Austria, Hungary, Italy, Yugoslavia and Croatia — yet always remained defiantly itself. It was European Capital of Culture in 2020.",
    history:"Rijeka's 20th century was uniquely turbulent even by Balkan standards. After WWI it was claimed by both Italy and Yugoslavia, leading Gabriele D'Annunzio to seize the city with a private army in 1919 in the 'Regency of Carnaro' — a bizarre proto-fascist mini-state. Italy formally annexed it in 1924. After WWII it became part of Yugoslavia. After 1991 it became Croatian. Its multi-ethnic character — Croatian, Italian, Hungarian, German communities — left a visible architectural and culinary legacy.",
    facts:["D'Annunzio's 1919 seizure of Rijeka inspired Mussolini's march on Rome — a direct precursor to Italian fascism","Rijeka's Carnival is the largest in Croatia — the fourth largest in Europe","The city was called 'Fiume' (Italian for river) and 'Sankt Veit am Flaum' (German) and 'Reka' (Croatian) simultaneously","Rijeka was European Capital of Culture in 2020","The Trsatska gradina fortress above the city has a miraculous shrine to the Virgin Mary — visited by pilgrims for 700 years"],
    vocab:[{hr:"luka",en:"port / harbour",note:"Rijeka's identity is its luka — the industrial port stretches for kilometres along the Kvarner bay"},{hr:"Kvarner",en:"the bay between Istria and the islands",note:"The Kvarner gulf — one of the stormiest and most beautiful in the Adriatic"},{hr:"Riječanin",en:"person from Rijeka",note:"A Riječanin identifies with the port, the carnival, and the defiant multi-cultural history"}],
    didYouKnow:"Rijeka's Mardi Gras Carnival has been running since 1449 — one of Europe's oldest continuous carnival traditions."},
  {name:"Pula",region:"Istria",icon:"🏟️",color:"#92400e",tagline:"Rome at the Adriatic's Edge",
    intro:"Pula is an ancient Roman city at the tip of the Istrian peninsula — home to one of the best-preserved Roman amphitheatres in the world, still used for concerts today. Two thousand years of history visible in every street.",
    history:"The Roman colony of Pietas Julia (1st century BC) grew into a prosperous city of 30,000. Pula's amphitheatre (Arena Pula), built between 27 BC and 68 AD, held 20,000 spectators and is the sixth largest in the Roman world — better preserved than the Colosseum in Rome. Like Labin, Pula was under Italy 1918-1943, with Croatian culture suppressed. After WWII, the Istrian Exodus saw most of Pula's Italian population leave. The city rebuilt and today is a vibrant coastal city of 60,000.",
    facts:["Pula Arena is the 6th largest Roman amphitheatre in the world — still used for concerts","James Joyce lived in Pula in 1904-1905, teaching English, and wrote early drafts of Dubliners here","The Temple of Augustus in Pula's forum dates to 2 BC and is one of the best-preserved Roman temples outside Rome","Pula is the filming location for several major Hollywood productions","The Arch of the Sergii (27 BC) has been standing continuously for 2,050 years"],
    vocab:[{hr:"Arena",en:"Pula's Roman amphitheatre",note:"'Idemo u Arenu' — going to the Arena means a concert or event in the ancient amphitheatre"},{hr:"Puležanin",en:"person from Pula",note:"Istrian identity is complex — Croatian and Italian cultures overlap in Pula's daily life"},{hr:"brijuni",en:"the Brijuni islands",note:"Tito's private island retreat — now a national park just off Pula, open to visitors"}],
    didYouKnow:"James Joyce wrote early drafts of 'Dubliners' while teaching English in Pula in 1904-05. He called it a 'queer old place.'"},
  {name:"Osijek",region:"Slavonia",icon:"🌻",color:"#b45309",tagline:"Capital of Slavonia",
    intro:"Osijek is the capital of Slavonia — Croatia's eastern region of flat plains, sunflowers, paprika and Pannonian history. Its baroque Tvrđa fortress is one of Central Europe's best-preserved 18th-century military complexes.",
    history:"Built on the site of the Roman Mursa (where Valentinian I and Valens were born — same as Vinkovci), Osijek's Tvrđa (fortress town) was constructed by the Habsburgs after they expelled the Ottomans in 1687. The baroque ensemble of churches, plague columns, and military buildings was built between 1712-1721 and is now a UNESCO candidate. During the 1991-92 war, Osijek was besieged and shelled for over a year. The city and its people endured one of the longest sieges in the Homeland War.",
    facts:["Osijek's Tvrđa fortress is one of the best-preserved baroque military complexes in Central Europe","Osijek was besieged by JNA and Serb forces for over 400 days in 1991-1992","The city sits on the Drava River — the natural border between Croatia and Hungary","Slavonski kulen (spicy paprika sausage) from the Osijek region is EU-protected","Osijek has the longest pedestrian street in Croatia — Europska Avenija"],
    vocab:[{hr:"Tvrđa",en:"the baroque fortress town in Osijek",note:"Osijek's old fortress district — a self-contained baroque city within a city"},{hr:"kulen",en:"Slavonian paprika sausage",note:"Croatia's most celebrated cured meat — dense, spicy, smoked. A Slavonian identity"},{hr:"Osječanin",en:"person from Osijek",note:"Slavonians are known for warmth, hospitality, and loyalty — and fierce pride in their region"}],
    didYouKnow:"Osijek's 18th-century Tvrđa fortress has plague columns, baroque churches, and military barracks all still intact — and students, cafés, and restaurants operate within the ancient walls today."},
  {name:"Šibenik",region:"Dalmatia",icon:"⛪",color:"#7c3aed",tagline:"Croatia's Only Gothic-Renaissance Cathedral",
    intro:"Šibenik is unique among Croatian coastal cities — it was founded by Croatians, not Romans or Greeks. Its Cathedral of St James, built over 105 years (1431-1536), is a UNESCO World Heritage Site and the only Gothic-Renaissance cathedral in the world built entirely of stone without brick or mortar.",
    history:"While most Dalmatian cities were Roman or Greek foundations, Šibenik first appears in records in 1066 under Croatian King Petar Krešimir IV — a purely medieval Croatian creation. The cathedral took three architects and 105 years to complete: Francesco di Giacomo, Juraj Dalmatinac (Georgius Matheus Dalmaticus), and Nikola Firentinac. Juraj Dalmatinac's frieze of 71 realistic portrait heads (faces of real 15th-century citizens) around the apse is one of the most extraordinary achievements of medieval Croatian art.",
    facts:["The Cathedral of St James took 105 years to build (1431-1536)","Juraj Dalmatinac carved 71 realistic portrait heads of real citizens around the cathedral — the first realistic portrait sculptures in Croatian art","Šibenik was the first Croatian city founded by Croatians (not Romans or Greeks)","The Krka National Park is just 15km from the city centre","Šibenik's St Michael's Fortress starred as Meereen in Game of Thrones"],
    vocab:[{hr:"katedrala",en:"cathedral",note:"Katedrala svetog Jakova — Cathedral of St James. Juraj Dalmatinac's masterpiece"},{hr:"Šibenčanin",en:"person from Šibenik",note:"Šibenik people are proud of being the only 'Croatian' coastal city — no Roman roots"},{hr:"Krka",en:"the river and national park near Šibenik",note:"'Nacionalni park Krka' — famous for travertine waterfalls and swimming pools"}],
    didYouKnow:"The 71 portrait heads carved by Juraj Dalmatinac around the Šibenik Cathedral apse are believed to be real 15th-century citizens — the earliest realistic portrait sculpture series in Croatian art."},
  {name:"Trogir",region:"Dalmatia",icon:"🏰",color:"#164e63",tagline:"UNESCO's Living Museum City",
    intro:"Trogir is a tiny island city connected to the mainland by a bridge — its entire historic centre is a UNESCO World Heritage Site. Two thousand years of architecture are compressed into an island smaller than a city block.",
    history:"Founded by Greek colonists from Issa (Vis) in the 3rd century BC, Trogir became the Roman Tragurium, then a medieval Croatian and Venetian city. The Cathedral of St Lawrence (begun 1213) contains the Radovan Portal (1240) — the finest example of Romanesque-Gothic carving in Croatia and one of the finest in Europe. The portal's carved scenes of everyday life — hunting, fishing, farming, the zodiac — are an extraordinary document of 13th-century Croatian daily existence.",
    facts:["Trogir's entire old town is a UNESCO World Heritage Site — one of the best-preserved medieval cities in the world","The Radovan Portal (1240) is considered the greatest medieval sculptural work in Croatia","Trogir was founded by Greek colonists in the 3rd century BC","The city has been continuously inhabited for 2,300 years","The Kamerlengo Fortress was built by Venice in the 14th century — still the dominant structure on the island"],
    vocab:[{hr:"Trogirski",en:"of/from Trogir",note:"Adjective for Trogir — 'trogirska dalmatinska kuhinja' = Trogir Dalmatian cuisine"},{hr:"balkon",en:"balcony",note:"Trogir's medieval streets are so narrow that neighbours on opposite sides can shake hands from their balkoni"},{hr:"prošek",en:"Dalmatian sweet dessert wine",note:"The traditional sweet wine made from dried grapes — served with local fig cake at celebrations"}],
    didYouKnow:"Trogir's streets are so narrow that the whole old town can be walked end-to-end in about 10 minutes — yet it contains 2,300 years of architecture."},
  {name:"Hvar",region:"Dalmatia",icon:"🌿",color:"#16a34a",tagline:"Sunniest Place in Croatia",
    intro:"Hvar island and its main town are Croatia's most glamorous destination — 2,726 hours of sunshine per year (the most in Croatia), lavender fields, Renaissance architecture, and a medieval walled town with Croatia's oldest community theatre.",
    history:"Hvar town's Stari Grad (old town, formerly Pharos) was founded by Greeks from Paros in 384 BC — one of the oldest Greek colonies in the Adriatic. The Hvar Communal Theatre (1612) is the oldest continuously operating community theatre in Europe and one of the oldest in the world. The 1510 Hvar Rebellion — led by Matij Ivanić, a Croatian peasant leader — was one of the earliest and most significant peasant uprisings in European history, predating many famous revolts.",
    facts:["The Hvar Communal Theatre (1612) is one of the oldest continuously operating community theatres in the world","Stari Grad Plain on Hvar is a UNESCO World Heritage Site — a Greek land division system from 384 BC, unchanged for 2,400 years","The Hvar Rebellion of 1510 was one of the first major peasant uprisings in European history, led by Matij Ivanić","Hvar gets 2,726 hours of sunshine per year — the most of any Croatian town, giving it record warmth even in winter","Lavender has been cultivated on Hvar for over 100 years — the island produces most of Croatia's lavender oil and hosts an annual Lavender Festival each June"],
    vocab:[{hr:"lavanda",en:"lavender",note:"Hvar's lavender fields bloom in June — the island is covered in purple and scent"},{hr:"Pharos",en:"ancient Greek name for Hvar / Stari Grad",note:"Founded by Greeks from Paros island in 384 BC — 'Pharos' became 'Hvar' over centuries"},{hr:"hvarska fjaka",en:"Hvar's version of blissful idleness",note:"Even the Dalmatian fjaka reaches peak intensity on Hvar — the island elevates doing nothing to an art form"}],
    didYouKnow:"Hvar's main square, Trg Sv. Stjepana, is the largest piazza on the Dalmatian coast — at roughly 4,500 square metres, it fills with café terraces every summer evening and is the social heart of the island."},
  {name:"Varaždin",region:"Northern Croatia",icon:"🎻",color:"#7c3aed",tagline:"Baroque Capital of Croatia",
    intro:"Varaždin was Croatia's capital from 1767 to 1776, and its baroque city centre rivals anything in Central Europe. The Spancirfest international street festival and world-class Varaždin Baroque Evenings music festival have made it Croatia's cultural surprise.",
    history:"Founded as a medieval fortress town, Varaždin grew into a major Croatian city under Habsburg rule. When a great fire destroyed it in 1776 (the same year it served as capital), the city was rebuilt in superb baroque style — giving it the most coherent baroque cityscape in Croatia. The Varaždin Cemetery, designed by Hermann Bollé in the late 19th century, is considered one of the most beautiful park cemeteries in Europe — a place Croatians genuinely visit for pleasure.",
    facts:["Varaždin was Croatia's capital from 1767-1776 — before a fire prompted the move to Zagreb","The Varaždin Baroque Evenings (since 1971) is one of Croatia's most prestigious classical music festivals","The city has the most completely preserved baroque architecture of any Croatian city","Varaždin's cemetery is considered one of the most beautiful in Europe — designed by Hermann Bollé in 1905","Croatian Reformation leader Stjepan Konzul was born in Varaždin"],
    vocab:[{hr:"Varaždinec",en:"person from Varaždin",note:"Northern Croatians speak the Kajkavian dialect — 'kaj?' means 'what?' instead of 'što?' or 'ča?'"},{hr:"kaj",en:"what (Kajkavian dialect)",note:"The third major Croatian dialect marker — standard: što, Dalmatian: ča, Northern: kaj"},{hr:"dvorac",en:"castle / palace",note:"'Varaždinski dvorac' — the preserved medieval fortress at the center of Varaždin"}],
    didYouKnow:"Varaždin's baroque cemetery is so beautiful that Croatians visit it as a park — locals picnic there, tourists photograph it, and international media call it 'the most beautiful cemetery in Croatia.'"},
  {name:"Karlovac",region:"Central Croatia",icon:"⭐",color:"#0e7490",tagline:"The Star-Shaped City",
    intro:"Karlovac was designed from scratch in 1579 as a star-shaped Renaissance fortress city — built by the Habsburg Empire to stop the Ottoman advance into Central Europe. Its perfectly geometric six-pointed star layout is still visible in the city plan today.",
    history:"Founded on June 13, 1579 by Archduke Charles II of Austria (for whom it is named — Carlstadt → Karlstadt → Karlovac), the city was designed by Italian architect Martin Gambon as a model Renaissance fortress. Four rivers converge here: Kupa, Mrežnica, Dobra, and Korana — making it a strategic and commercial hub. Today Karlovac is famous for Karlovačko pivo — one of Croatia's leading beer brands, brewed here since 1854.",
    facts:["Karlovac was designed as a perfect six-pointed star fortress in 1579 — the star shape is still visible in the street plan","Four rivers converge in Karlovac — unique in Croatia","Karlovačko beer has been brewed in Karlovac since 1854","During the Homeland War, Karlovac was on the front line — shelled and partially occupied","The Turanj Homeland War memorial is one of Croatia's most significant"],
    vocab:[{hr:"Karlovčanin",en:"person from Karlovac",note:"Karlovac locals are proud of four things: the star, the rivers, the beer, and surviving the war"},{hr:"Karlovačko",en:"Karlovac beer brand",note:"'Jedno Karlovačko, molim' — one Karlovačko, please. The classic Croatian beer order"},{hr:"zvijezda",en:"star",note:"Karlovac's star-fortress layout — 'šesterokraka zvijezda' (six-pointed star)"}],
    didYouKnow:"Karlovac is one of only a few cities in the world designed as a perfect geometric fortress from scratch — and you can still see the original star shape in Google Maps satellite view today."},
  {name:"Rovinj",region:"Istria",icon:"🎨",color:"#ea580c",tagline:"Most Romantic Town in Croatia",
    intro:"Rovinj is an Istrian fishing town built on a peninsula — cobblestone streets spiraling up to a hilltop church, coloured houses tumbling toward the sea, artists' galleries in every alley. Consistently voted one of the most romantic cities in Europe.",
    history:"Like Pula and Labin, Rovinj (Italian: Rovigno) was under Venice from 1283 until 1797, then Habsburg Austria. The town was built on an island that was connected to the mainland only in 1763 when the channel was filled in. Its Italian character is still visible — many older residents spoke Venetian Italian as their first language. Today Rovinj is a centre for artists and painters, with the Grisia street hosting a famous outdoor art exhibition every year since 1967.",
    facts:["Rovinj was an island until 1763 — the channel separating it from the mainland was filled in","The Grisia street art exhibition has been running since 1967 — one of Europe's longest-running outdoor art events","Rovinj's Italian-speaking community dates back to Venetian times — 'Rovignese' was its own dialect","The Church of St Euphemia atop the hill contains the sarcophagus of the 3rd-century Christian martyr","Rovinj's fishing fleet is still active — the town produces some of Croatia's finest olive oil and wine"],
    vocab:[{hr:"Rovinjanin",en:"person from Rovinj",note:"Rovinjesi identity blends Croatian and Venetian heritage — unique in Istria"},{hr:"grisia",en:"the famous art street in Rovinj",note:"The stone-paved street climbing to St Euphemia — lined with galleries and artists"},{hr:"tartuf",en:"truffle",note:"Istrian white truffles are world-famous — found in forests around Rovinj and Motovun. Among the world's finest"}],
    didYouKnow:"Rovinj produces some of Italy's finest olive oil — but it's in Croatia. The olive trees around Rovinj are often 500–800 years old, and the oil regularly wins international competitions."},
  {name:"Poreč",region:"Istria",icon:"✝️",color:"#b45309",tagline:"The Byzantine Mosaic Masterpiece",
    intro:"Poreč's Euphrasian Basilica is a UNESCO World Heritage Site and one of the finest surviving examples of early Byzantine mosaic art in the world — built in the 6th century while Justinian ruled Constantinople. The mosaics are contemporary with Ravenna.",
    history:"The Roman Parentium became a bishopric in the 4th century — one of the earliest in the region. Bishop Euphrasius built the basilica complex in 553-559 AD, covering the apses and walls with mosaics of extraordinary quality. The gold-background apse mosaic of the Virgin and Child between Bishop Euphrasius and the archangels Gabriel and Michael is considered a masterpiece of Byzantine art. Poreč also has the most complete preserved Roman street grid in Croatia — the Decumanus (main east-west road) still runs straight through the old town.",
    facts:["The Euphrasian Basilica mosaics (553-559 AD) are UNESCO-listed and among the finest in the world","Poreč has the best-preserved Roman street grid in Croatia — the Decumanus runs straight through the old town","The mosaic of Virgin and Child in the apse is contemporary with the famous Ravenna mosaics","Poreč is the most visited tourist destination in Croatia by number of overnight stays","The town preserves the Roman Temple of Mars (1st century AD) in the main square"],
    vocab:[{hr:"bazilika",en:"basilica",note:"Eufrazijeva bazilika — the Euphrasian Basilica. One of Croatia's greatest treasures"},{hr:"mozaik",en:"mosaic",note:"The 6th-century mosaics of Poreč are made of gold, glass and stone tesserae — still as vivid as when made"},{hr:"Decumanus",en:"main Roman street",note:"The straight Roman road that still runs through Poreč — walked by Roman legionnaires 2,000 years ago"}],
    didYouKnow:"The Euphrasian Basilica mosaics in Poreč were created in 553-559 AD — 1,470 years ago — and are still so vivid and well-preserved that they appear freshly made."},
  {name:"Opatija",region:"Kvarner",icon:"🌺",color:"#16a34a",tagline:"Austro-Hungarian Riviera",
    intro:"Opatija was the Austro-Hungarian Empire's most fashionable resort — from 1844, Viennese aristocrats, emperors, composers, and writers arrived to take the sea air. Its belle époque villas and the Lungomare coastal promenade make it Central Europe's seaside memory.",
    history:"The Liburnia coast near Opatija was 'discovered' for tourism in 1844 when Viennese merchant Iginio Scarpa built the Villa Angiolina and invited the aristocracy. The opening of the Vienna-Rijeka railway in 1873 brought the Habsburg elite in numbers. Emperor Franz Joseph I, Empress Elisabeth (Sisi), Archduke Franz Ferdinand, Kaiser Wilhelm II, Isadora Duncan, Anton Chekhov, Gustav Mahler, and James Joyce all visited or stayed. The grand hotels and villas of that era are still operating.",
    facts:["Opatija was the official Habsburg seaside resort from 1889 — Emperor Franz Joseph declared it a health resort","Anton Chekhov, Gustav Mahler, Isadora Duncan, and James Joyce all visited Opatija","The Lungomare coastal path (12km) was built in the 1880s and is still one of the finest promenades in Europe","The camelia flower (Camellia japonica) blooms here every February — Croatia's only winter flowering season","The Hotel Kvarner (1884) was the first hotel in Croatia — still operating"],
    vocab:[{hr:"Lungomare",en:"the Opatija coastal promenade",note:"From Italian 'lungo il mare' (along the sea) — the 12km promenade connecting Opatija to Lovran"},{hr:"vila",en:"villa",note:"The belle époque 'vile' of Opatija — ornate Austro-Hungarian residences that defined the Riviera"},{hr:"šetnica",en:"promenade / walking path",note:"A coastal walking path — 'šetati' means to stroll, an important Croatian social activity"}],
    didYouKnow:"Chekhov wrote early drafts of 'The Lady with the Dog' while staying in Opatija in 1898 — the story's resort atmosphere was inspired partly by the Adriatic."},
  {name:"Makarska",region:"Dalmatia",icon:"🏔️",color:"#0e7490",tagline:"Under the Biokovo Mountain",
    intro:"Makarska sits at the foot of the Biokovo mountain massif — a dramatic backdrop of 1,762-meter limestone peaks rising directly from the sea. It is the commercial and cultural capital of the Makarska Riviera, Croatia's most concentrated stretch of beach resorts.",
    history:"The Makarska Riviera has been inhabited since prehistoric times — the Illyrian Daorsi tribe left hilltop fortifications above the town. The town was under Venice, then briefly French, then Austrian. The Franciscan Monastery (1400) and its shell collection museum are among the most visited in Dalmatia. Makarska is also the hometown of Fra Andrija Kačić Miošić — the 18th-century Franciscan friar and poet whose 'Razgovor ugodni naroda slovinskog' (Pleasant Conversation of the Slavic People) was the most widely read book in Croatian homes for 200 years.",
    facts:["The Biokovo massif rises from sea level to 1,762m in just 4km — one of the steepest mountain faces in Europe","Makarska's Franciscan monastery has one of Europe's finest seashell collections (3,000+ species)","Fra Andrija Kačić Miošić's 1756 poem collection was the most widely read Croatian book for over 150 years","The Makarska Riviera stretches 60km — the most concentrated beach resort area in Croatia","Biokovo Nature Park has a glass-floored 'Skywalk' viewpoint at 1,228 meters"],
    vocab:[{hr:"Biokovo",en:"the mountain above Makarska",note:"The limestone massif that defines the entire Makarska Riviera — wild, dramatic, and beautiful"},{hr:"plaža",en:"beach",note:"The Makarska Riviera beaches are almost all pebble — 'šljunčana plaža' (pebble beach)"},{hr:"bura",en:"Bora wind",note:"Bura from Biokovo can be fierce — the wind descends the steep cliffs and churns the sea without warning"}],
    didYouKnow:"The Biokovo cliff face rises from sea level to 1,762 metres in just 4 kilometres — one of the steepest ascents from sea to summit in all of Europe."},
  {name:"Korčula",region:"Dalmatia",icon:"⚔️",color:"#7c3aed",tagline:"Birthplace of Marco Polo?",
    intro:"Korčula is a walled medieval city on its own island — with streets arranged in a herringbone pattern to deflect the wind and sun. The island claims (disputed but passionately believed) to be the birthplace of Marco Polo.",
    history:"Korčula was a Venetian city for most of the medieval period and was the site of the famous naval Battle of Curzola (1298) where the Genoese defeated Venice — and captured a certain Venetian merchant named Marco Polo (or Marko Polo, as Croatian history prefers). The island's shipbuilding tradition goes back to antiquity — 'korčulanski brodograditelji' (Korčula shipbuilders) were famous across the Adriatic. The Moreška sword dance, performed only in Korčula, is a UNESCO-listed living tradition.",
    facts:["Korčula's streets are arranged in a herringbone pattern to break the wind and provide shade — medieval urban engineering","Marco Polo may have been born in Korčula — the Polo family is documented in the island's records","The Moreška sword dance has been performed in Korčula every Thursday in summer for at least 500 years","Korčula's Cathedral of St Mark was built over 200 years in Gothic-Renaissance style","The island produces Grk and Pošip — two indigenous white wines unique to Korčula"],
    vocab:[{hr:"Moreška",en:"the traditional sword dance of Korčula",note:"A UNESCO-listed living tradition — two kings battle for a queen in an elaborate armed dance"},{hr:"Pošip",en:"indigenous Korčula white wine",note:"A crisp, full-bodied white wine grown only on Korčula — among Croatia's finest"},{hr:"Marko Polo",en:"the Italian/Croatian explorer (disputed)",note:"Korčula insists he was born here — the house is still shown to visitors"}],
    didYouKnow:"Korčula's herringbone street pattern was intentionally designed in the 13th century: streets run northeast-southwest to channel cooling Maestral breezes and block the harsh Bora wind."},
  {name:"Nin",region:"Dalmatia",icon:"⛪",color:"#ca8a04",tagline:"Where Croatian Kings Were Crowned",
    intro:"Nin is perhaps the smallest city in Croatia but one of the most historically significant — a tiny Roman and medieval city on a lagoon island where early Croatian kings were crowned, where the oldest Croatian church stands, and where Croatia's medieval identity was forged.",
    history:"The Roman Aenona was a prosperous municipality. After Rome's collapse, Nin became a Croatian settlement and in the 9th century the seat of the Croatian principality and later kingdom. Duke Trpimir I (the father of the Croatian Trpimirović dynasty) held court here. The tiny Church of the Holy Cross in Nin (9th century) is considered the oldest Croatian church in continuous use — a remarkable pre-Romanesque structure nicknamed 'the smallest cathedral in the world.' Bishop Grgur Ninski (Gregory of Nin), whose statue by Meštrović stands in Split and Nin, fought here for the right to use Croatian language in church services.",
    facts:["The Church of the Holy Cross in Nin (9th century) is considered the oldest preserved Croatian church","Croatian dukes and early kings were crowned in Nin before the capital moved to Knin and later Biograd","Grgur Ninski (Gregory of Nin) fought from Nin for the right to use Croatian Glagolitic script in church services","Nin's famous salt pans have been producing sea salt since Roman times","Nin's therapeutic mud (ljekovito blato) has been used for healing for centuries"],
    vocab:[{hr:"Glagoljica",en:"the Glagolitic script",note:"The medieval Croatian alphabet invented by St Cyril — Grgur Ninski fought to keep it in liturgy"},{hr:"Ninjani",en:"people from Nin",note:"Nin is tiny (around 1,500 residents) but its history dwarfs that of cities ten times its size"},{hr:"ljekovito blato",en:"therapeutic mud",note:"The natural mud of Nin lagoon — used for centuries to treat arthritis and skin conditions"}],
    didYouKnow:"The Church of the Holy Cross in Nin was designed so that on the winter and summer solstices, sunlight enters through specific windows and illuminates the altar exactly — a medieval architectural calendar."},
  {name:"Sinj",region:"Dalmatia",icon:"🐴",color:"#dc2626",tagline:"The Alka of Sinj",
    intro:"Sinj is the Dalmatian hinterland's most culturally distinct town — home to the Sinjska Alka (the Alka of Sinj), a mounted lance tournament held every first Sunday in August since 1715, commemorating the miraculous defence of the town against the Ottoman army.",
    history:"On August 14-15, 1715, approximately 60,000 Ottoman soldiers besieged the town of Sinj, defended by fewer than 700 soldiers and militia. The Ottomans withdrew — Sinj attributed its miraculous survival to the intercession of Our Lady of Sinj (Gospa Sinjska), whose icon the defenders had brought from Bosnia. To commemorate the victory, the Sinjska Alka was established the same year — an equestrian tournament where riders in 18th-century Dalmatian costume gallop at full speed and aim a lance at a small iron ring (alka). It has been held every year since 1715 without exception — even during wartime. It is UNESCO Intangible Cultural Heritage.",
    facts:["The Sinjska Alka has been held every year since 1715 without exception — including during WWII","The 'alka' target ring is only 35cm in diameter — striking its center ('Srida, srida!') is the greatest honor","The tournament is performed in authentic 18th-century Dalmatian Croatian military costume","Our Lady of Sinj (Gospa Sinjska) is one of the most venerated Marian icons in Croatia","Sinj is the 'Mecca' of Dalmatian hinterland Croatia (Dalmatinska Zagora)"],
    vocab:[{hr:"alka",en:"the iron ring target in the tournament",note:"'Srida, srida!' — center, center! The crowd shouts when a rider hits the alka dead center"},{hr:"Gospa Sinjska",en:"Our Lady of Sinj",note:"The venerated icon of the Virgin Mary — credited with saving Sinj in 1715"},{hr:"alkarski vitez",en:"knight of the Alka",note:"The riders in the tournament — alkaraši. They train year-round and wear authentic historical dress"}],
    didYouKnow:"The Alka of Sinj has been run every year since 1715 — through Ottoman sieges, Habsburg rule, WWI, WWII, Yugoslav communism, and Croatian independence. Not once has it been cancelled."},
  {name:"Ilok",region:"Slavonia",icon:"🍷",color:"#7c3aed",tagline:"Croatia's Wine Capital on the Danube",
    intro:"Ilok is Croatia's easternmost town — perched on a cliff above the Danube at the border with Serbia. Its medieval castle and 700-year-old wine cellars contain some of Croatia's finest Traminac and Graševina wines, and its history spans Roman, Ottoman, Habsburg and Croatian eras.",
    history:"Ilok's Odescalchi Castle (15th century, rebuilt 18th century) stands on Roman foundations above the Danube. The Nicola Iločki Mausoleum in the castle church is one of the finest Gothic structures in Croatia. The town was under Ottoman rule from 1526 to 1688 and produced famous Ottoman wines — Ottoman records show Ilok wines being sent to the Sultan's court. When the Habsburgs took Ilok, they rebuilt the castle for the Odescalchi family (whose descendant became Pope Innocent XI). During 1991-1997, Ilok was occupied by Serb forces and the Croatian population was expelled. The town was peacefully reintegrated in 1997.",
    facts:["Ilok's wine cellars date back to Franciscan monks in the 14th century — among Croatia's oldest","The Nicola Iločki mausoleum (15th c.) is one of the finest Gothic monuments in Croatia","Traminac Ilok wine was served at Queen Elizabeth II's coronation in 1953","During Ottoman rule, Ilok wines were sent to the Sultan's court — unusual for a nominally Muslim empire","Ilok was peacefully reintegrated into Croatia in 1997 after 6 years of occupation"],
    vocab:[{hr:"Traminac",en:"Traminer — Ilok's signature wine grape",note:"Traminac Mirisavi (Gewürztraminer) from Ilok is Croatia's most internationally celebrated white wine"},{hr:"Graševina",en:"Welschriesling — Slavonia's main grape",note:"The dominant white wine grape of Slavonia and eastern Croatia — light, fresh, widely drunk"},{hr:"Dunav",en:"the Danube River",note:"The Danube forms Croatia's border with Serbia at Ilok — 'Dunav je naša granica'"}],
    didYouKnow:"Traminac from Ilok was served at Queen Elizabeth II's coronation banquet in 1953 — making Ilok arguably the most regal address in Croatian wine history."},
  {name:"Đakovo",region:"Slavonia",icon:"⛪",color:"#1d4ed8",tagline:"Cathedral of the Slavonian Plains",
    intro:"Đakovo's neo-Gothic Cathedral of St Peter (1882), designed by Friedrich von Schmidt, is the architectural crown of Slavonia — its twin 84-meter spires are visible across the flat Pannonian plain for 30 kilometres. The Đakovački vezovi embroidery festival is Croatia's largest folklore event.",
    history:"Đakovo was the seat of the powerful Bishop of Bosnia from the 13th century through to modern times — the Diocese of Đakovo was the religious heart of Slavonia and Bosnia. Bishop Josip Juraj Strossmayer (1815-1905) was the most significant Catholic churchman in Croatian history — a builder of national culture who funded the Croatian Academy of Sciences and Arts, the University of Zagreb, and donated his art collection to found the Strossmayer Gallery. His Cathedral of St Peter remains his monument.",
    facts:["The Cathedral twin spires are 84 meters tall — visible 30km across the flat Slavonian plain","Bishop Strossmayer funded the Croatian Academy of Sciences, the University of Zagreb, and numerous schools","The Đakovački vezovi festival (since 1967) is Croatia's largest folklore gathering — 2,000+ performers","The Đakovo Stud Farm produces Lipizzan horses — the breed made famous by the Spanish Riding School in Vienna","The Dioceses of Đakovo has existed since the 13th century — one of Croatia's oldest bishoprics"],
    vocab:[{hr:"katedrala",en:"cathedral",note:"Đakovačka katedrala — Bishop Strossmayer's neo-Gothic masterpiece on the Slavonian plain"},{hr:"vez",en:"embroidery (Slavonian)",note:"Slavonian folk embroidery — geometric red patterns on white — is one of the most distinctive in Europe"},{hr:"Strossmayer",en:"Croatia's greatest bishop-patron",note:"'Strossmayer' is a synonym in Croatia for cultural patronage — as a verb, 'strossmayerizirati' means to build for the nation"}],
    didYouKnow:"Bishop Strossmayer donated so much to Croatian culture — the Academy, the University, galleries, schools — that Croatians today still use the phrase 'strossmayerova baština' (Strossmayer's legacy) to mean cultural philanthropy."},
  {name:"Vukovar Grad",region:"Slavonia",icon:"🕊️",color:"#78716c",tagline:"Symbol of Resistance",
    intro:"Beyond the Homeland War memorial sites, Vukovar's baroque city centre — once called 'the Vienna of the east' — is being rebuilt. The water tower, still bearing its war wounds, is Croatia's most powerful symbol of survival.",
    history:"Before the 1991 war, Vukovar was a prosperous Danube city with Croatia's largest pre-war population — mixed Croatian and Serb communities. Its baroque city centre (18th century, built by the Eltz family) rivalled any in Central Europe. The 87-day siege of 1991 destroyed 90% of the city. The water tower, hit by 600+ shells but never destroyed, became Croatia's symbol of resistance. Today Vukovar is slowly rebuilding — the Eltz Castle restoration is Croatia's largest architectural heritage project.",
    facts:["Vukovar's baroque Eltz Castle is being restored in what Croatia calls its largest ever architectural heritage project","The Vukovar water tower (hit by 600+ shells) has been deliberately left unrestored as a memorial","The Vučedol Culture Museum (near Vukovar) holds the 4,600-year-old Vučedol Dove — one of Croatia's most important archaeological finds","Vukovar was 'pupil of the year' of the European Heritage Awards in 2015 for its reconstruction efforts","The Vukovar-Srijem County is one of Croatia's most ethnically diverse regions even today"],
    vocab:[{hr:"vodotoranj",en:"water tower",note:"Vukovar's war-damaged water tower — deliberately unrepaired as a memorial to the siege"},{hr:"obnova",en:"reconstruction / renewal",note:"'Obnova Vukovara' — the reconstruction of Vukovar. A decades-long national project"},{hr:"Vučedolska golubica",en:"the Vučedol Dove",note:"The 4,600-year-old ceramic dove found near Vukovar — among Croatia's most iconic archaeological objects"}],
    didYouKnow:"The Vučedol Dove (c. 2500 BC) found near Vukovar was chosen as the image on Croatia's 20-kuna banknote — a 4,600-year-old symbol of Croatian civilisation on modern currency."},
  {name:"Koprivnica",region:"Podravina",icon:"🎨",color:"#16a34a",tagline:"Naive Art Capital of the World",
    intro:"Koprivnica is the capital of Croatian naive art — a self-taught peasant painting tradition from the nearby village of Hlebine that produced world-famous artists and gave Croatia one of its most distinctive cultural exports.",
    history:"In the 1930s, art teacher Krsto Hegedušić discovered the extraordinary talent of peasant painters in the village of Hlebine near Koprivnica. Ivan Generalić, Franjo Mraz, and Mirko Virius — farmers who had never had formal art training — created haunting, richly coloured paintings of rural Podravina life that electrified the European art world. The Hlebine School of naive art became internationally renowned. Today the Koprivnica Gallery of Naive Art is the premier institution of its kind in the world, and the naive art tradition continues in the region.",
    facts:["The Hlebine School of naive art (1930s) is internationally recognized as the finest naive art tradition in the world","Ivan Generalić's paintings are in major collections worldwide — self-taught peasant painter from Hlebine","Koprivnica hosts the Koprivnica city museum — Croatia's first systematic museum of naive art","The Podravina region's folk traditions (embroidery, pottery, songs) fed directly into the naive art imagery","Podravka food company (founded Koprivnica) produces Vegeta — the spice mix used in millions of kitchens worldwide"],
    vocab:[{hr:"naivna umjetnost",en:"naive art",note:"The self-taught, highly personal painting tradition of the Hlebine School — worldwide recognition"},{hr:"Podravina",en:"the Drava River region",note:"The flat agricultural plain along the Drava River — Koprivnica's cultural heartland"},{hr:"Vegeta",en:"Croatia's famous spice blend",note:"Made by Podravka in Koprivnica since 1959 — the all-purpose seasoning found in kitchens from Moscow to Mexico City"}],
    didYouKnow:"Vegeta — the seasoning mix created by Podravka in Koprivnica in 1959 — is used in over 40 countries and has been described as 'the most universally used Croatian culinary export in history.'"},
  {name:"Čakovec",region:"Međimurje",icon:"🏰",color:"#0e7490",tagline:"Northernmost Croatian Town",
    intro:"Čakovec is the capital of Međimurje — Croatia's smallest and northernmost county, wedged between the Mura and Drava rivers. The Zrinski Castle (Stari Grad) and the story of the Zrinski family make it one of Croatia's most romanticised historical places.",
    history:"Čakovec is inseparable from the Zrinski noble family — one of the great Croatian-Hungarian noble dynasties. Nikola Šubić Zrinski (1508-1566) is a Croatian national hero who died defending the fortress of Szigetvár (now in Hungary) against Suleiman the Magnificent's army of 100,000. He blew up the fortress with himself and his remaining garrison rather than surrender — an act of suicidal heroism that Croatians and Hungarians both honour. His story inspired one of the earliest Croatian operas (1866) and remains the definition of Croatian sacrifice.",
    facts:["The Zrinski Castle in Čakovec (today a museum) was the seat of Croatia's most celebrated noble family","Nikola Zrinski's 1566 defence of Szigetvár became the defining epic of Croatian heroism — immortalised in poetry, opera, and painting","Međimurje is Croatia's most densely populated county — and produces some of Croatia's finest wines","The Međimurska popevka (folk song tradition) is UNESCO-listed intangible cultural heritage","Čakovec is closer to Vienna and Budapest than to Dubrovnik"],
    vocab:[{hr:"Zrinski",en:"the great Croatian noble family",note:"The Zrinski family produced military commanders, poets, and national martyrs — central to Croatian identity"},{hr:"Međimurje",en:"land between the rivers (Mura and Drava)",note:"The northernmost Croatian county — 'međi' = between, 'murje' = Mura river area"},{hr:"popevka",en:"folk song (Kajkavian)",note:"Međimurska popevka — the folk song tradition of Međimurje. UNESCO-listed. Hauntingly beautiful melodies"}],
    didYouKnow:"Nikola Zrinski's 1566 last stand at Szigetvár killed Suleiman the Magnificent the same day — the Sultan died of illness during the siege and died the same morning of the final assault, though it was kept secret."},
  {name:"Gospić",region:"Lika",icon:"⛰️",color:"#78716c",tagline:"Capital of the Rocky Lika Region",
    intro:"Gospić is the capital of Lika — the rugged karst region that produced Nikola Tesla, Ante Starčević (father of Croatian nationalism), and a disproportionate number of Croatian military commanders. It is one of Croatia's most battle-tested regions.",
    history:"Lika has always been frontier land — the Habsburg Military Frontier (Vojna krajina) that separated Catholic Croatia from the Ottoman Empire. This region produced warriors by necessity. Ante Starčević (1823-1896), born in the Lika village of Žitnik near Gospić, founded the Croatian Party of Rights and is called 'Otac domovine' (Father of the Homeland) — his political philosophy formed the backbone of Croatian nationalism. Nikola Tesla was born in the Lika village of Smiljan, just 7km from Gospić.",
    facts:["Nikola Tesla was born in Smiljan, Lika — 7km from Gospić. His birthplace is a museum","Ante Starčević — 'Father of the Homeland' — was born in Lika and founded Croatian political nationalism","Gospić was heavily affected by the Homeland War — the Medak Pocket battle (1993) was a major Croatian operation","Lika produces some of Croatia's finest lamb (janjetina) and forest fruits","The Plitvice Lakes National Park is 50km from Gospić — Croatia's most visited site"],
    vocab:[{hr:"Ličanin",en:"person from Lika",note:"Lika people are known for hardiness, stubbornness, and dark humor — 'Ličanka je najljepša' they say"},{hr:"janjetina",en:"lamb (traditional Croatian roast)",note:"Lika lamb roasted on a spit (na ražnju) is considered the finest in Croatia — karst grass diet"},{hr:"Vojna krajina",en:"Military Frontier",note:"The Habsburg defensive zone from which Lika was administered — created tough, military-minded communities"}],
    didYouKnow:"Tesla and Starčević — arguably Croatia's greatest scientist and greatest political thinker — were both born within 15km of Gospić, Lika. Two giants from one frontier county."},
  {name:"Pag",region:"Dalmatia",icon:"🧀",color:"#ca8a04",tagline:"Moon Landscape, Lace and Cheese",
    intro:"Pag island is one of Croatia's most distinctive — a bare, moon-like limestone landscape scoured by the Bora wind, producing the saltiest sea air in the Adriatic. It is famous for three things: Paška čipka (Pag lace), Paški sir (Pag cheese), and Zrće beach.",
    history:"Pag's unique landscape was created by centuries of deforestation under Venice — the trees were cut for shipbuilding and the bare limestone was left to the wind. The result is an alien landscape of white karst, blue sea, and sheep (the island has more sheep than people). Paška čipka (Pag lace) is a UNESCO Intangible Cultural Heritage — needle lace of extraordinary fineness made by the women of Pag Town for centuries. The lace takes months to make and is still practiced today.",
    facts:["Pag island has more sheep than people — the sheep graze on salt-cured herbs, giving Paški sir its unique flavour","Paška čipka (Pag lace) is UNESCO-listed — one of the finest needle lace traditions in the world","Pag's moon-like landscape was created by Venice clear-cutting forests for shipbuilding","Paški sir (Pag cheese) is Croatia's most internationally known cheese — aged under olive oil and ash","Zrće beach on Pag became one of Europe's most famous outdoor club venues in the 2000s"],
    vocab:[{hr:"Paška čipka",en:"Pag needle lace",note:"UNESCO-listed lace made entirely by hand with a single needle — months to complete a piece"},{hr:"Paški sir",en:"Pag cheese",note:"Semi-hard sheep's milk cheese — aged under olive oil. Croatia's most internationally awarded cheese"},{hr:"bura",en:"the Bora wind",note:"On Pag, the bura is not just weather — it shapes the landscape, the sheep, the cheese, and the people"}],
    didYouKnow:"The sheep of Pag island graze on aromatic herbs — sage, rosemary, thyme — all salt-cured by sea air. This diet directly creates the unique flavour of Paški sir that cannot be replicated elsewhere."},
  {name:"Vis",region:"Dalmatia",icon:"🐟",color:"#0e7490",tagline:"Croatia's Most Remote Island",
    intro:"Vis is Croatia's furthest inhabited island from the mainland — for decades a Yugoslav military base off-limits to foreigners. Its isolation preserved it: unspoilt beaches, a vibrant fishing tradition, extraordinary wines, and Croatia's most authentic island culture.",
    history:"Ancient Issa (Vis) was founded by Syracuse in 397 BC — the oldest Greek settlement in Croatia. The island was a key naval base throughout history: Napoleon held it, Britain built a fortress here (1811), and the Austrians fought the decisive Battle of Vis (1866) against Italy here — the last major wooden warship battle in history. During WWII, Marshal Tito ran Yugoslav Partisan HQ from a cave on Vis (1944). Yugoslavia then closed the island to all foreigners from 1944 to 1989 — the 45-year isolation created a time capsule.",
    facts:["Vis (ancient Issa) is the oldest Greek colony in Croatia — founded 397 BC","The island was closed to foreign visitors from 1944 to 1989 — the longest military closure in peacetime Europe","Tito ran his WWII partisan headquarters from a cave on Vis in 1944 — still visitable","The Battle of Vis (1866) was one of the last major naval battles fought by wooden warships","Vugava (white) and Plavac Mali (red) wines from Vis are considered among Croatia's finest"],
    vocab:[{hr:"Komiža",en:"the fishing village on Vis — most authentic",note:"Komiža fishermen are known for faroška (boat-shaped lanterns) and the blue-oared fishing boats"},{hr:"Vugava",en:"Vis indigenous white wine grape",note:"Grown only on Vis — a light, floral white wine that pairs perfectly with grilled fish"},{hr:"Issa",en:"the ancient Greek name for Vis",note:"Still used proudly by islanders — 'Isseans' is what Vis people sometimes call themselves"}],
    didYouKnow:"The military closure of Vis (1944-1989) inadvertently preserved the island from mass tourism development — making it today the most authentically unspoilt island in Croatia."},
  {name:"Brač",region:"Dalmatia",icon:"🪨",color:"#78716c",tagline:"The Stone That Built the World",
    intro:"Brač is Croatia's third-largest island — famous for its Zlatni Rat beach (the most photographed in Croatia), its olive oil, and above all its brilliant white limestone. Brač stone built Diocletian's Palace, the White House in Washington, and the Austrian Parliament.",
    history:"The white limestone of Brač (vapnenac) has been quarried since Roman times and has built some of the world's most famous structures. The quarries at Škrip and Pučišća have operated continuously for 2,000 years. Today Pučišća is home to the world's only stone masonry school (Škola za klesare) — teaching the ancient craft of working Brač stone. Zlatni Rat (Golden Cape/Horn) near Bol is Croatia's most famous beach — a tongue of pebble that shifts shape with the wind.",
    facts:["Brač limestone was used to build Diocletian's Palace, the White House in Washington, and the Austrian Parliament in Vienna","The quarries at Pučišća have operated continuously for 2,000 years","Zlatni Rat (Golden Cape) near Bol changes shape with the currents — no two days look identical from above","The Pučišća Stone Masonry School is the only school of its kind in the world — teaching 2,000-year-old craft","Brač olive oil has been produced since Roman times — the island has over a million olive trees"],
    vocab:[{hr:"vapnenac",en:"limestone",note:"The brilliant white Brač limestone — 'bračko kamenje' is synonym for quality in Croatian construction"},{hr:"Zlatni Rat",en:"Golden Horn / Golden Cape",note:"Croatia's most photographed beach — a shifting pebble tongue that changes shape with currents and wind"},{hr:"klesarstvo",en:"stone masonry",note:"The ancient craft of shaping stone — kept alive at the Pučišća masonry school"}],
    didYouKnow:"The same limestone quarry that supplied stone for Diocletian's Palace (305 AD) also supplied stone for the White House in Washington — Brač stone has been a building material of choice for 2,000 years."},
  {name:"Slavonski Brod",region:"Slavonia",icon:"🌉",color:"#b45309",tagline:"Gateway to Slavonia on the Sava",
    intro:"Slavonski Brod is Slavonia's second city — an 18th-century Habsburg fortress town on the Sava River opposite Bosnia. Its Tvrđa (Brod Fortress) is among the largest Baroque fortifications in Central Europe.",
    history:"The Franciscan monastery in Brod (1721) and the vast Brod Fortress (1715-1780) were built as the southernmost defenses of the Habsburg Empire against Ottoman Bosnia just across the river. The fortress covers 60 hectares — larger than many towns of the time. During the Homeland War, Slavonski Brod was shelled repeatedly from Bosnian territory. The bridge across the Sava was a critical artery for humanitarian aid into Bosnia. Today the city is rebuilding its fortunes as a regional centre.",
    facts:["Brod Fortress (18th century) covers 60 hectares — one of the largest Baroque fortresses in Central Europe","The Sava River bridge was a critical humanitarian corridor during the Bosnian War","Slavonski Brod hosts Brodsko kolo — Croatia's largest folk dance festival (since 1966)","The Franciscan Monastery in Brod has operated continuously since 1721","The city was called just 'Brod' until 1934 when 'Slavonski' was added to distinguish it from Bosanski Brod"],
    vocab:[{hr:"Sava",en:"the river dividing Croatia from Bosnia",note:"The Sava River forms the border between Croatia and Bosnia at Slavonski Brod"},{hr:"brodski",en:"of/from Brod",note:"'Brodski kolač' — the traditional cake of Slavonski Brod"},{hr:"Posavina",en:"the Sava River valley region",note:"The fertile flood plains along the Sava — famous for agriculture, folklore, and traditional architecture"}],
    didYouKnow:"Brod Fortress was so large that the town of Slavonski Brod essentially grew around it — the fortress is larger than the original civilian settlement it was built to protect."},
  {name:"Samobor",region:"Zagreb County",icon:"🎭",color:"#dc2626",tagline:"Carnival and Cream Cake Capital",
    intro:"Samobor is Zagreb's charming neighbour — a small medieval town 20km west of the capital, famous for its spectacular carnival (the oldest in Croatia, since 1827), the samobarska kremšnita cream cake, and mountain hiking on Samoborsko gorje.",
    history:"Samobor received its free royal city charter in 1242 — the same year as Zagreb (Golden Bull of Béla IV). While Zagreb became the capital, Samobor remained a peaceful market town. The Samobor carnival is documented from 1827 and is one of the oldest continuous carnival traditions in Croatia. The town's central square, the Church of St Anastasius, and the medieval Samobor Castle ruins above the town create a perfect Central European small-town scene.",
    facts:["Samobor's carnival has been running since 1827 — the oldest continuously operating carnival in Croatia","Samobarska kremšnita (vanilla cream slice) is so famous it has its own fan club and annual festival","The Samobor Castle ruins above the town date from the 13th century","Samobor is the start of several hiking routes into Samoborsko gorje (Samobor Hills)","The Samoborček train (narrow-gauge, now a tram) has connected Samobor to Zagreb since 1901"],
    vocab:[{hr:"kremšnita",en:"vanilla cream slice / custard cake",note:"The most famous Croatian cake — layers of puff pastry, vanilla cream, and cream. Samobor's version is legendary"},{hr:"karneval",en:"carnival",note:"Samobor's carnival includes costumes, parades, and the burning of 'Fašnik' — the effigy of winter"},{hr:"Fašnik",en:"the effigy burned at the end of carnival",note:"The straw dummy representing winter and bad luck — burned on the last night of carnival to drive away evil"}],
    didYouKnow:"Samobarska kremšnita has been made according to the same recipe since 1929 — and Samobor bakeries sell approximately 1 million portions per year to the 14,000-resident town."},
  {name:"Požega",region:"Slavonia",icon:"🌟",color:"#16a34a",tagline:"The Golden Valley of Slavonia",
    intro:"Požega lies in the Požeška kotlina (Požega Valley) — a rare enclosed valley in the otherwise flat Slavonian plain, surrounded by wooded hills. Called the Golden Valley since the 18th century, it was a centre of Croatian cultural renaissance.",
    history:"Požega was one of the few Slavonian towns with continuous Croatian cultural life through the Ottoman period — the Franciscans maintained schools and libraries here. The 'Slavonian Enlightenment' of the 18th century centred on Požega, where Matija Antun Relković published his satirical 'Satyr or Wild Man' (1762) — the first major work of modern Slavonian literature. The town's baroque cathedral, Jesuit college, and Franciscan monastery form one of Croatia's finest 18th-century cultural ensembles.",
    facts:["Požega was called 'Aurea Civitas' (Golden City) by Habsburg administrators in the 18th century","Matija Antun Relković's 1762 satirical poem was the first major work of the Slavonian literary Enlightenment","Požega Valley is one of the few enclosed valleys in flat Slavonia — surrounded by the Papuk and Psunj mountains","The Požega Cathedral and Jesuit complex is among Croatia's finest baroque ensembles","Požeška kotlina produces excellent wines — particularly Graševina and Portugizac"],
    vocab:[{hr:"kotlina",en:"valley / basin",note:"Požeška kotlina — the Požega valley, enclosed by wooded mountains on all sides"},{hr:"Satir",en:"'The Satyr' — Relković's famous 1762 poem",note:"Relković's satirical poem criticised the cultural stagnation of Slavonians — and they loved him for it"},{hr:"Slavonac",en:"person from Slavonia",note:"Slavonians are known for large hearts, larger tables, and fiercely proud regional identity"}],
    didYouKnow:"Požega Valley is sometimes called 'the eye of Slavonia' — the only enclosed green valley in the otherwise completely flat Pannonian plain, ringed by mountains like a natural amphitheatre."},
  {name:"Petrinja",region:"Sisak-Moslavina",icon:"🕊️",color:"#44403c",tagline:"City of Earthquakes and Resilience",
    intro:"Petrinja is a Banija region town on the Kupa River — a former Habsburg fortress town that suffered heavily in both the 1991-95 Homeland War and the devastating December 2020 earthquake (magnitude 6.4) — the strongest earthquake in Croatia in 140 years.",
    history:"Built as a Habsburg fortress town in the 16th century on the Military Frontier, Petrinja was a mixed Croatian and Serb community before 1991. It fell to Serb forces in September 1991 and was not liberated until August 1995 (Operation Storm). The civilian population was expelled for four years. Twenty-five years later, on December 29, 2020, a magnitude 6.4 earthquake struck Petrinja — killing 7, destroying the town centre, and leaving 2,000 people homeless in winter. Reconstruction continues.",
    facts:["Petrinja was occupied from 1991-1995 and completely rebuilt after liberation","The December 29, 2020 earthquake (M6.4) was the strongest in Croatia in 140 years","A girl in Petrinja became internationally known after earthquake footage showed her describing her destroyed home — 'It's a warzone'","Petrinja Castle (Stari Grad) has been rebuilt multiple times — by Habsburgs, damaged in war, damaged in earthquake","Croatia received over €50 million in EU reconstruction funds for the earthquake zone"],
    vocab:[{hr:"Banija",en:"the historical region around Petrinja and Sisak",note:"The Banija/Banovina region — historically a Croatian-Serb mixed area of the Military Frontier"},{hr:"potres",en:"earthquake",note:"'Petrinjski potres' — the Petrinja earthquake. 'Potres' is also used metaphorically for any shocking event"},{hr:"obnova",en:"reconstruction",note:"'Obnova Petrinje' — the ongoing reconstruction effort. Used across Croatia for post-war and post-earthquake rebuilding"}],
    didYouKnow:"A 10-year-old girl in Petrinja became globally famous after the 2020 earthquake when she told a TV reporter: 'It's a warzone. I'm scared.' Her words prompted international humanitarian response within hours."},
  {name:"Bjelovar",region:"Bjelovar-Bilogora",icon:"⭐",color:"#0e7490",tagline:"The Eight-Pointed Star City",
    intro:"Bjelovar is a classic Habsburg planned city — built in the 1740s as a military administration centre with a radial plan of eight streets radiating from a central square, creating a perfect eight-pointed star visible from above.",
    history:"Founded in 1756 as the administrative centre of the Varaždin Generalcy (Habsburg Military Frontier command), Bjelovar was designed from scratch on a geometric plan — like Karlovac, but with eight radial streets instead of a star fortress. The Church of the Holy Trinity and the Cathedral of Teresa of Ávila (18th century) stand at the centre. Bjelovar is the commercial centre of Bilogora and Podravina — an agricultural region known for dairy products and traditional craft.",
    facts:["Bjelovar's radial eight-street plan is one of the few planned 18th-century cities in Croatia","The city was founded in 1756 as the Habsburg military administration centre","Bjelovar is the dairy capital of Croatia — the region produces most of Croatia's highest-quality milk","The October 1991 Bjelovar barracks action was one of the first Croatian military victories of the Homeland War","Bilogora (meaning 'white mountain') to the north is known for its hills, vineyards, and autumn colours"],
    vocab:[{hr:"zvijezda",en:"star",note:"Bjelovar's eight-street radial plan creates a star shape — best visible on a map"},{hr:"Bjelovarčanin",en:"person from Bjelovar",note:"Central Croatian identity — neither Slavonian nor Zagorje, but fiercely proud of Bjelovar"},{hr:"mlijeko",en:"milk",note:"The Bilogora region's dairy industry — 'bjelovarsko mlijeko' is synonymous with quality in Croatia"}],
    didYouKnow:"In October 1991, the Croatian National Guard captured the Bjelovar military barracks from the JNA — seizing enormous quantities of weapons and ammunition that equipped Croatian forces for the rest of the war."},
  {name:"Virovitica",region:"Virovitica-Podravina",icon:"🌻",color:"#ca8a04",tagline:"Between Podravina and Bilogora",
    intro:"Virovitica is a quiet Podravian town whose baroque Pejačević Castle houses one of Croatia's finest regional museums. It is the centre of the grape-growing and wine-making traditions of the Virovitica-Podravina region.",
    history:"Virovitica's Pejačević family — one of the great Croatian-Hungarian noble dynasties — built the baroque castle (17th century) and dominated the region for centuries. The composer Dora Pejačević (1885-1923) was one of the first professional Croatian female composers — her symphonies and chamber works are performed internationally today. Virovitica was on the front line during the Homeland War — the region around it was partly occupied and saw fierce fighting in 1991-1992.",
    facts:["Dora Pejačević (1885-1923) was Croatia's first major female composer — born in the Pejačević castle","Pejačević Castle houses one of Croatia's finest regional heritage museums","The Virovitica region's Graševina wine is among Slavonia's finest","During the Homeland War, the Virovitica area was part of the occupied Western Slavonia","The annual Vincekovica festival celebrates the grape-growing tradition with bonfires on St Vincent's Day (January 22)"],
    vocab:[{hr:"Dora Pejačević",en:"Croatia's first major female composer",note:"Her symphonic poem 'Leben und Sterben' (Life and Death) is her masterpiece — premiered Vienna 1916"},{hr:"Graševina",en:"Welschriesling grape — Slavonia's main wine",note:"The most widely grown grape in Slavonia — produces fresh, mineral whites"},{hr:"Vincekovica",en:"St Vincent's Day grape-growing festival",note:"January 22 — wine growers bring vines indoors and light bonfires to predict the harvest"}],
    didYouKnow:"Dora Pejačević completed her first symphony at age 29, had her works premiered in Vienna and Munich, and died at 37 — she is considered one of the most important 20th-century Croatian composers despite a career of barely 15 years."},
  {name:"Mljet",region:"Dalmatia",icon:"🌲",color:"#16a34a",tagline:"Croatia's Greenest Island",
    intro:"Mljet is Croatia's most forested island — 72% covered in dense Mediterranean forest of Aleppo pine and holm oak. Its saltwater lakes (Malo and Veliko jezero) in the national park, and the 12th-century Benedictine monastery on an island within a lake within an island, make it one of the Adriatic's most magical places.",
    history:"The ancient Greeks knew Mljet as Melita — Homer may have meant this island when he described the island of Calypso where Odysseus was held for seven years (though Malta also claims this). St Paul allegedly shipwrecked here on his way to Rome (Acts 28) — though Malta also claims that too. The Benedictine monastery on the lake island (founded 1151) operated for 600 years until Napoleon dissolved it. Today it is a hotel. The story of the mongoose on Mljet is historical: the Austrian government introduced mongooses to control snakes in the 1910s. They are still there.",
    facts:["Mljet National Park saltwater lakes connect directly to the sea — they experience tidal movement","The 12th-century Benedictine monastery on the lake island is now a hotel — one of Croatia's most unique accommodations","Mongooses were introduced to Mljet in 1910 to control vipers — they succeeded but now they are everywhere","Homer's Calypso island in the Odyssey may have been Mljet (or Malta — both claim it)","Mljet's forest is the largest continuous forest on any Croatian island"],
    vocab:[{hr:"jezero",en:"lake",note:"Mljet has two saltwater lakes — Malo (small) and Veliko (large) jezero — connected to the sea by a channel"},{hr:"tamaris / tamarisk",en:"salt cedar tree",note:"The fragrant coastal shrub that lines Mljet's shoreline — its pink flowers bloom in spring"},{hr:"Melita",en:"ancient Greek name for Mljet",note:"'Melita' means honey island in Greek — the same name as Malta, which also claims the Calypso legend"}],
    didYouKnow:"The mongooses introduced to Mljet in 1910 to control snakes are now so established that the island has a significant mongoose population — you will almost certainly see one. They are charming, fast, and entirely comfortable around humans."},
];
function getCityOfDay(){
  var n=new Date();
  var dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  var h=5381;var s='city:'+dk;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;h=h>>>0;
  return CROATIAN_CITIES[h%CROATIAN_CITIES.length];
}
// ═══ TENSE & GENDER CONJUGATION SYSTEM ═══
const TENSES = {
  persons:["ja","ti","on","ona","mi","vi","oni","one"],
  personsEn:["I","you","he","she","we","you (pl.)","they (m)","they (f)"],
  verbs:[
    {inf:"ići",en:"to go",
      present:["idem","ideš","ide","ide","idemo","idete","idu","idu"],
      pastM:["išao sam","išao si","išao je","išla je","išli smo","išli ste","išli su","išle su"],
      pastF:["išla sam","išla si","išao je","išla je","išle smo","išle ste","išli su","išle su"],
      futureM:["ići ću","ići ćeš","ići će","ići će","ići ćemo","ići ćete","ići će","ići će"],
      futureF:["ići ću","ići ćeš","ići će","ići će","ići ćemo","ići ćete","ići će","ići će"],
      shortPastM:["Išao sam","Išao si","Išao je",null,null,null,null,null],
      note:"Past tense: išao (m) vs išla (f). 'Sam' comes AFTER the participle in standard form."},
    {inf:"biti",en:"to be",
      present:["sam","si","je","je","smo","ste","su","su"],
      pastM:["bio sam","bio si","bio je","bila je","bili smo","bili ste","bili su","bile su"],
      pastF:["bila sam","bila si","bio je","bila je","bile smo","bile ste","bili su","bile su"],
      futureM:["bit ću","bit ćeš","bit će","bit će","bit ćemo","bit ćete","bit će","bit će"],
      futureF:["bit ću","bit ćeš","bit će","bit će","bit ćemo","bit ćete","bit će","bit će"],
      note:"'Biti' is the most important verb. Present tense forms (sam, si, je...) are auxiliary verbs used in ALL past tenses."},
    {inf:"raditi",en:"to work",
      present:["radim","radiš","radi","radi","radimo","radite","rade","rade"],
      pastM:["radio sam","radio si","radio je","radila je","radili smo","radili ste","radili su","radile su"],
      pastF:["radila sam","radila si","radio je","radila je","radile smo","radile ste","radili su","radile su"],
      futureM:["radit ću","radit ćeš","radit će","radit će","radit ćemo","radit ćete","radit će","radit će"],
      futureF:["radit ću","radit ćeš","radit će","radit će","radit ćemo","radit ćete","radit će","radit će"],
      note:"Regular -iti verb. Past: radio (m) / radila (f). The -o ending is ALWAYS masculine, -la is ALWAYS feminine."},
    {inf:"jesti",en:"to eat",
      present:["jedem","jedeš","jede","jede","jedemo","jedete","jedu","jedu"],
      pastM:["jeo sam","jeo si","jeo je","jela je","jeli smo","jeli ste","jeli su","jele su"],
      pastF:["jela sam","jela si","jeo je","jela je","jele smo","jele ste","jeli su","jele su"],
      futureM:["jest ću","jest ćeš","jest će","jest će","jest ćemo","jest ćete","jest će","jest će"],
      futureF:["jest ću","jest ćeš","jest će","jest će","jest ćemo","jest ćete","jest će","jest će"],
      note:"Past: jeo (m) / jela (f). Plural: jeli (m/mixed) / jele (all female group)."},
    {inf:"govoriti",en:"to speak",
      present:["govorim","govoriš","govori","govori","govorimo","govorite","govore","govore"],
      pastM:["govorio sam","govorio si","govorio je","govorila je","govorili smo","govorili ste","govorili su","govorile su"],
      pastF:["govorila sam","govorila si","govorio je","govorila je","govorile smo","govorile ste","govorili su","govorile su"],
      futureM:["govorit ću","govorit ćeš","govorit će","govorit će","govorit ćemo","govorit ćete","govorit će","govorit će"],
      futureF:["govorit ću","govorit ćeš","govorit će","govorit će","govorit ćemo","govorit ćete","govorit će","govorit će"],
      note:"Regular -iti verb. 'Govorim hrvatski' = I speak Croatian."},
    {inf:"imati",en:"to have",
      present:["imam","imaš","ima","ima","imamo","imate","imaju","imaju"],
      pastM:["imao sam","imao si","imao je","imala je","imali smo","imali ste","imali su","imale su"],
      pastF:["imala sam","imala si","imao je","imala je","imale smo","imale ste","imali su","imale su"],
      futureM:["imat ću","imat ćeš","imat će","imat će","imat ćemo","imat ćete","imat će","imat će"],
      futureF:["imat ću","imat ćeš","imat će","imat će","imat ćemo","imat ćete","imat će","imat će"],
      note:"Past: imao (m) / imala (f). 'Imam brata' = I have a brother."},
    {inf:"htjeti",en:"to want",
      present:["hoću","hoćeš","hoće","hoće","hoćemo","hoćete","hoće","hoće"],
      pastM:["htio sam","htio si","htio je","htjela je","htjeli smo","htjeli ste","htjeli su","htjele su"],
      pastF:["htjela sam","htjela si","htio je","htjela je","htjele smo","htjele ste","htjeli su","htjele su"],
      futureM:["htjet ću","htjet ćeš","htjet će","htjet će","htjet ćemo","htjet ćete","htjet će","htjet će"],
      futureF:["htjet ću","htjet ćeš","htjet će","htjet će","htjet ćemo","htjet ćete","htjet će","htjet će"],
      note:"Irregular! Past: htio (m) / htjela (f). Negative present: neću, nećeš, neće..."},
    {inf:"moći",en:"to be able to / can",
      present:["mogu","možeš","može","može","možemo","možete","mogu","mogu"],
      pastM:["mogao sam","mogao si","mogao je","mogla je","mogli smo","mogli ste","mogli su","mogle su"],
      pastF:["mogla sam","mogla si","mogao je","mogla je","mogle smo","mogle ste","mogli su","mogle su"],
      futureM:["moći ću","moći ćeš","moći će","moći će","moći ćemo","moći ćete","moći će","moći će"],
      futureF:["moći ću","moći ćeš","moći će","moći će","moći ćemo","moći ćete","moći će","moći će"],
      note:"Irregular! Past: mogao (m) / mogla (f). 'Mogu li?' = Can I? / May I?"},
    {inf:"živjeti",en:"to live",
      present:["živim","živiš","živi","živi","živimo","živite","žive","žive"],
      pastM:["živio sam","živio si","živio je","živjela je","živjeli smo","živjeli ste","živjeli su","živjele su"],
      pastF:["živjela sam","živjela si","živio je","živjela je","živjele smo","živjele ste","živjeli su","živjele su"],
      futureM:["živjet ću","živjet ćeš","živjet će","živjet će","živjet ćemo","živjet ćete","živjet će","živjet će"],
      futureF:["živjet ću","živjet ćeš","živjet će","živjet će","živjet ćemo","živjet ćete","živjet će","živjet će"],
      note:"Past: živio (m) / živjela (f). 'Živim u Hrvatskoj' = I live in Croatia."},
    {inf:"voljeti",en:"to love",
      present:["volim","voliš","voli","voli","volimo","volite","vole","vole"],
      pastM:["volio sam","volio si","volio je","voljela je","voljeli smo","voljeli ste","voljeli su","voljele su"],
      pastF:["voljela sam","voljela si","volio je","voljela je","voljele smo","voljele ste","voljeli su","voljele su"],
      futureM:["voljet ću","voljet ćeš","voljet će","voljet će","voljet ćemo","voljet ćete","voljet će","voljet će"],
      futureF:["voljet ću","voljet ćeš","voljet će","voljet će","voljet ćemo","voljet ćete","voljet će","voljet će"],
      note:"Past: volio (m) / voljela (f). 'Volim te' = I love you."}
  ],
  genderRules:[
    {rule:"Past tense participle endings",desc:"Masculine singular: -o / -ao / -io. Feminine singular: -la / -ala / -ela / -jela. Masculine plural: -li. Feminine plural: -le."},
    {rule:"'Sam/si/je' position",desc:"Standard: participle + sam/si/je (Išao sam). Inverted: Sam išao (less common, emphasis). Both are correct!"},
    {rule:"Mixed groups = masculine",desc:"If a group has ANY males, use masculine plural: Oni su išli. All-female group: One su išle."},
    {rule:"'On' vs 'Ona' always differs in past",desc:"On je radio (he worked). Ona je radila (she worked). The auxiliary 'je' stays the same, the participle changes."},
    {rule:"Future tense: no gender difference",desc:"Future uses infinitive + ću/ćeš/će. Gender doesn't matter: Ja ću ići (m or f)."},
    {rule:"Present tense: no gender difference",desc:"Idem, ideš, ide... is the same for male and female speakers."}
  ]
};
// ═══ INTERACTIVE MAP DATA ═══
const MAPPLACES = {
  categories:[
    {id:"home",label:"🏠 Home",color:"#dc2626"},
    {id:"city",label:"🏙️ Cities",color:"#0e7490"},
    {id:"park",label:"🌳 National Parks",color:"#16a34a"},
    {id:"beach",label:"🏖️ Beaches",color:"#0284c7"},
    {id:"history",label:"🏛️ Historic Sites",color:"#7c3aed"},
    {id:"island",label:"🌴 Islands",color:"#ea580c"}
  ],
  places:[
    {name:"Labin",desc:"Our new home! Medieval hilltop town, Labin Republic 1921",lat:45.0877,lng:14.1213,cat:"home"},
    {name:"Rabac",desc:"Pearl of Kvarner — beaches & diving",lat:45.0781,lng:14.1575,cat:"home"},
    {name:"Bibinje",desc:"Family roots — Marina Dalmacija, klapa festivals",lat:44.0742,lng:15.2875,cat:"home"},
    {name:"Zagreb",desc:"Capital city — 1M population, museums, nightlife",lat:45.8150,lng:15.9819,cat:"city"},
    {name:"Split",desc:"2nd largest city — Diocletian's Palace, Hajduk",lat:43.5081,lng:16.4402,cat:"city"},
    {name:"Dubrovnik",desc:"Pearl of the Adriatic — Old Town walls",lat:42.6507,lng:18.0944,cat:"city"},
    {name:"Zadar",desc:"3,000 years old — Sea Organ, Sun Salutation",lat:44.1194,lng:15.2314,cat:"city"},
    {name:"Rijeka",desc:"Port city — gateway to Kvarner",lat:45.3271,lng:14.4422,cat:"city"},
    {name:"Pula",desc:"Roman Arena — 6th largest in the world",lat:44.8666,lng:13.8496,cat:"city"},
    {name:"Osijek",desc:"Slavonian capital — Tvrđa fortress",lat:45.5550,lng:18.6955,cat:"city"},
    {name:"Vukovar",desc:"Hero City — Ovčara Memorial, Water Tower",lat:45.3510,lng:18.9983,cat:"city"},
    {name:"Vinkovci",desc:"Oldest town in Europe — 8,300 years",lat:45.2880,lng:18.8044,cat:"city"},
    {name:"Mostar",desc:"Stari Most bridge — Heart of Herzegovina",lat:43.3438,lng:17.8078,cat:"city"},
    {name:"Široki Brijeg",desc:"Franciscan monastery — Herzegovina heartland",lat:43.3833,lng:17.5936,cat:"city"},
    {name:"NP Plitvička Jezera",desc:"UNESCO — 16 terraced lakes, waterfalls",lat:44.8654,lng:15.5820,cat:"park"},
    {name:"NP Krka",desc:"Stunning waterfalls — swimming allowed!",lat:43.8017,lng:15.9614,cat:"park"},
    {name:"NP Kornati",desc:"89 islands — boat excursions from Zadar",lat:43.7833,lng:15.3500,cat:"park"},
    {name:"NP Paklenica",desc:"Rock climbing & hiking — near Zadar",lat:44.3650,lng:15.4400,cat:"park"},
    {name:"NP Brijuni",desc:"Islands off Pula — Tito's residence, safari",lat:44.9119,lng:13.7561,cat:"park"},
    {name:"NP Mljet",desc:"Pristine island — saltwater lakes",lat:42.7667,lng:17.3667,cat:"park"},
    {name:"Zlatni Rat (Bol)",desc:"Golden Horn — Croatia's most famous beach",lat:43.2558,lng:16.6556,cat:"beach"},
    {name:"Stinjačka Beach (Pula)",desc:"Rocky paradise near Pula",lat:44.8400,lng:13.8200,cat:"beach"},
    {name:"Baška (Krk)",desc:"Pebble beach backed by mountains",lat:44.9669,lng:14.7519,cat:"beach"},
    {name:"Girandella (Rabac)",desc:"Our local beach! Blue Flag",lat:45.0756,lng:14.1600,cat:"beach"},
    {name:"Diocletian's Palace",desc:"Roman emperor's palace — Split center",lat:43.5081,lng:16.4360,cat:"history"},
    {name:"Pula Arena",desc:"Roman amphitheatre — still hosts events",lat:44.8734,lng:13.8500,cat:"history"},
    {name:"Vučedol",desc:"5,000 year old culture — museum on Danube",lat:45.3622,lng:19.0431,cat:"history"},
    {name:"Ovčara Memorial",desc:"Vukovar massacre site — never forget",lat:45.3200,lng:18.9800,cat:"history"},
    {name:"Knin Fortress",desc:"Medieval fortress — Homeland War significance",lat:44.0414,lng:16.1986,cat:"history"},
    {name:"Nin",desc:"Oldest Croatian royal city — 7 kings crowned",lat:44.2386,lng:15.1806,cat:"history"},
    {name:"Hvar",desc:"Lavender island — nightlife & beaches",lat:43.1729,lng:16.4411,cat:"island"},
    {name:"Brač",desc:"Home of Zlatni Rat — stone quarries",lat:43.3069,lng:16.6506,cat:"island"},
    {name:"Korčula",desc:"Marco Polo's birthplace — medieval walls",lat:42.9597,lng:17.1358,cat:"island"},
    {name:"Cres",desc:"Largest Adriatic island — griffon vultures",lat:44.7061,lng:14.4056,cat:"island"},
    {name:"Krk",desc:"Bridge-connected island — Baška beach",lat:45.0275,lng:14.5753,cat:"island"},
    {name:"Lošinj",desc:"Island of vitality — dolphins & wellness",lat:44.5311,lng:14.4683,cat:"island"}
  ]
};
// ═══ GROCERY SHOPPING ═══
const GROCERY = {
  stores:[{name:"Konzum",desc:"Largest Croatian chain. Everywhere.",color:"#dc2626"},{name:"Lidl",desc:"German discount chain. Great prices.",color:"#003da5"},{name:"Spar",desc:"Austrian chain. Mid-range quality.",color:"#16a34a"},{name:"Plodine",desc:"Croatian-owned. Regional favorite.",color:"#f59e0b"},{name:"Kaufland",desc:"Large hypermarkets.",color:"#dc2626"},{name:"Tommy",desc:"Dalmatian chain. Great local products.",color:"#0e7490"}],
  brands:[["Dukat","Dairy — milk, yogurt, cheese"],["Podravka","Soups, sauces, Vegeta seasoning"],["Kraš","Chocolate, Baška cookies, Napolitanke"],["Vindija","Dairy & juice brand"],["Jamnica","Mineral water — most popular"],["Cedevita","Vitamin drink powder — iconic"],["Franck","Coffee brand — every Croatian drinks it"],["Zvijezda","Oils, mayo, ketchup"],["Gavrilović","Salami, kulen, meat products"],["PIK Vrbovec","Processed meats"],["Ledo","Ice cream & frozen food"],["Koestlin","Cookies & crackers"],["Jana","Premium water brand"],["Dorina","Chocolate bars (by Kraš)"]],
  vocab:[["mlijeko","milk"],["kruh","bread"],["jaja","eggs"],["sir","cheese"],["maslac","butter"],["jogurt","yogurt"],["brdašno","flour"],["ulje","oil"],["sol","salt"],["papar","pepper"],["šećer","sugar"],["riža","rice"],["tjestenina","pasta"],["piletina","chicken"],["svinjetina","pork"],["govedina","beef"],["riba","fish"],["voće","fruit"],["povrće","vegetables"],["voda","water"],["sok","juice"],["pivo","beer"],["vino","wine"],["vrećica","bag"],["blagajna","checkout"],["popust","discount"],["račun","receipt"],["deka","100g (ordering unit)"]],
  phrases:[["Dajte mi 20 deka kulena.","Give me 200g of kulen."],["Imate li vrećicu?","Do you have a bag?"],["Gdje je mlijeko?","Where is the milk?"],["Koliko košta?","How much does it cost?"],["Mogu li platiti karticom?","Can I pay by card?"],["Jeste li član?","Are you a member? (loyalty card)"],["Na akciji je.","It's on sale."],["Dva za jedan.","Two for one."]]
};
// ═══ CROATIAN RECIPES ═══
const RECIPES = [
  {name:"Palačinke",en:"Croatian Crepes",time:20,servings:4,
    ing:[["250g","brašno (flour)"],["2","jaja (eggs)"],["300ml","mlijeko (milk)"],["1 žličica","sol (salt)"],["ulje","za prženje (for frying)"],["Nutella/džem","za punjenje (filling)"]],
    steps:["Pomiješaj brašno, jaja, mlijeko i sol. (Mix flour, eggs, milk, salt.)","Ostavi 15 minuta. (Rest 15 min.)","Zagrij tavu s malo ulja. (Heat pan with oil.)","Ulij tanki sloj tijesta. (Pour thin layer of batter.)","Peči 1-2 minute po strani. (Cook 1-2 min per side.)","Posluži s Nutellom ili džemom! (Serve with Nutella or jam!)"]},
  {name:"Ćevapi",en:"Grilled Meat Sausages",time:30,servings:4,
    ing:[["500g","mljeveno meso (ground beef/lamb mix)"],["1","luk (onion, grated)"],["2 češnja","bijeli luk (garlic)"],["1 žličica","sol"],["1/2 žličice","papar"],["1 žličica","vegeta"]],
    steps:["Pomiješaj sve sastojke. (Mix all ingredients.)","Stavi u frižider 2 sata. (Refrigerate 2 hours.)","Oblikuj ćevape — 8cm dugi. (Shape into 8cm rolls.)","Peči na roštilju 3-4 min po strani. (Grill 3-4 min per side.)","Posluži u lepinji s lukom i ajvarom! (Serve in flatbread with onion & ajvar!)"]},
  {name:"Fritule",en:"Croatian Donuts",time:40,servings:6,
    ing:[["300g","brašno"],["2","jaja"],["50g","šećer (sugar)"],["200ml","mlijeko"],["1 vrećica","prašak za pecivo (baking powder)"],["korica","limuna (lemon zest)"],["rum","po želji (optional)"],["grožđice","raisins"],["ulje","za prženje"],["prah šećer","powdered sugar"]],
    steps:["Pomiješaj brašno, šećer i prašak. (Mix dry ingredients.)","Dodaj jaja, mlijeko, koricu limuna, rum. (Add wet ingredients.)","Umiješaj grožđice. (Fold in raisins.)","Zagrij ulje na 170°C. (Heat oil to 170°C.)","Kašikom stavljaj tijesto u ulje. (Drop spoonfuls into oil.)","Prži dok ne postanu zlatne. (Fry until golden.)","Pospi prah šećerom! (Dust with powdered sugar!)"]},
  {name:"Štrukli",en:"Zagreb Cheese Pastry",time:60,servings:6,
    ing:[["400g","brašno"],["1","jaje"],["200ml","mlaka voda (warm water)"],["2 žlice","ulje"],["500g","svježi sir (fresh cheese/cottage)"],["2","jaja (for filling)"],["200ml","kiselo vrhnje (sour cream)"],["sol","po okusu"]],
    steps:["Zamijesi tijesto od brašna, jajeta, vode i ulja. (Knead dough.)","Odmori 30 minuta. (Rest 30 min.)","Razvuci tijesto vrlo tanko. (Stretch dough paper-thin.)","Pomiješaj sir, jaja, vrhnje i sol. (Mix filling.)","Rasporedi nadjev po tijestu. (Spread filling on dough.)","Zamotaj u roladu i reži. (Roll up and cut pieces.)","Peci 40 min na 180°C ili kuhaj 15 min. (Bake 40min at 180°C or boil 15min.)"]},
  {name:"Sarma",en:"Stuffed Cabbage Rolls",time:180,servings:8,
    ing:[["1","kiseli kupus (sauerkraut head)"],["500g","mljeveno meso"],["100g","riža"],["1","luk"],["2 češnja","bijeli luk"],["sol, papar, vegeta","začini"],["200g","suha rebra / slanina (smoked ribs/bacon)"]],
    steps:["Odvoji listove kiselog kupusa. (Separate sauerkraut leaves.)","Pomiješaj meso, rižu, luk, češnjak, začine. (Mix filling.)","Stavi punjenje na list i zamotaj. (Place filling, roll tightly.)","Posloži sarme u lonac s kupusom. (Layer rolls in pot with sauerkraut.)","Dodaj suha rebra i vodu. (Add smoked meat and water.)","Kuhaj na laganoj vatri 3 sata. (Simmer 3 hours!)","Sarma je još bolja sutradan! (Even better next day!)"]}
];
// ═══ CONVERSATION ROLE-PLAY ═══
const ROLEPLAY = [
  {title:"U Školi — First Day",en:"At School — Meeting Teacher",
    lines:[
      {speaker:"Učiteljica",text:"Dobar dan! Dobro došli u naš razred.",en:"Good day! Welcome to our class."},
      {speaker:"Ti",text:"Dobar dan, učiteljice. Hvala.",en:"Good day, teacher. Thank you.",you:true},
      {speaker:"Učiteljica",text:"Kako se zoveš?",en:"What is your name?"},
      {speaker:"Ti",text:"Zovem se [ime]. Ja sam iz Amerike.",en:"My name is [name]. I am from America.",you:true},
      {speaker:"Učiteljica",text:"Govoriš li hrvatski?",en:"Do you speak Croatian?"},
      {speaker:"Ti",text:"Malo. Još učim. Oprostite ako pogriješim.",en:"A little. Still learning. Sorry if I make mistakes.",you:true},
      {speaker:"Učiteljica",text:"Nema problema! Sjedi ovdje, pored Ivana.",en:"No problem! Sit here, next to Ivan."},
      {speaker:"Ti",text:"Hvala! Koji sat imamo prvi?",en:"Thanks! What class do we have first?",you:true}]},
  {title:"Kod Doktora",en:"At the Doctor",
    lines:[
      {speaker:"Ti",text:"Dobar dan. Trebam pregled.",en:"Good day. I need an examination.",you:true},
      {speaker:"Doktor",text:"Dobar dan. Što vas muči?",en:"Good day. What's troubling you?"},
      {speaker:"Ti",text:"Boli me grlo i imam temperaturu.",en:"My throat hurts and I have a fever.",you:true},
      {speaker:"Doktor",text:"Koliko dugo?",en:"How long?"},
      {speaker:"Ti",text:"Tri dana.",en:"Three days.",you:true},
      {speaker:"Doktor",text:"Jeste li alergični na nešto?",en:"Are you allergic to anything?"},
      {speaker:"Ti",text:"Ne, nisam alergičan/alergična.",en:"No, I'm not allergic. (m/f)",you:true},
      {speaker:"Doktor",text:"Prepisat ću vam antibiotik. Idite u ljekarnu.",en:"I'll prescribe antibiotics. Go to the pharmacy."},
      {speaker:"Ti",text:"Hvala, doktore. Dovidenja.",en:"Thank you, doctor. Goodbye.",you:true}]},
  {title:"U Banci",en:"At the Bank",
    lines:[
      {speaker:"Ti",text:"Dobar dan. Želim otvoriti račun.",en:"Good day. I want to open an account.",you:true},
      {speaker:"Službenik",text:"Svakako. Imate li osobnu iskaznicu?",en:"Of course. Do you have an ID card?"},
      {speaker:"Ti",text:"Imam putovnicu i OIB.",en:"I have a passport and OIB.",you:true},
      {speaker:"Službenik",text:"Trebat će vam prijava boravišta.",en:"You'll need address registration."},
      {speaker:"Ti",text:"Imam. Evo dokumenta.",en:"I have it. Here's the document.",you:true},
      {speaker:"Službenik",text:"Odlično. Želite li karticu?",en:"Excellent. Do you want a card?"},
      {speaker:"Ti",text:"Da, molim. I internetsko bankarstvo.",en:"Yes please. And internet banking.",you:true}]},
  {title:"Kod Susjeda",en:"Meeting the Neighbors",
    lines:[
      {speaker:"Susjed",text:"Bok! Vi ste novi susjedi?",en:"Hi! You're the new neighbors?"},
      {speaker:"Ti",text:"Da! Ja sam [ime]. Drago mi je.",en:"Yes! I'm [name]. Nice to meet you.",you:true},
      {speaker:"Susjed",text:"Odakle ste?",en:"Where are you from?"},
      {speaker:"Ti",text:"Iz Amerike. Obitelj mi je iz Hercegovine.",en:"From America. My family is from Herzegovina.",you:true},
      {speaker:"Susjed",text:"Super! Dođite na kavu sutra.",en:"Great! Come for coffee tomorrow."},
      {speaker:"Ti",text:"Rado! U koliko sati?",en:"Gladly! What time?",you:true},
      {speaker:"Susjed",text:"U deset. I dovedite djecu!",en:"At ten. And bring the kids!"},
      {speaker:"Ti",text:"Hvala! Donosim kolač.",en:"Thanks! I'll bring cake.",you:true}]},
  {title:"Roditeljski Sastanak",en:"Parent-Teacher Conference",
    lines:[
      {speaker:"Ti",text:"Dobar dan. Ja sam mama/tata od [ime].",en:"Good day. I'm [name]'s mom/dad.",you:true},
      {speaker:"Učiteljica",text:"Dobar dan! Sjjednite.",en:"Good day! Have a seat."},
      {speaker:"Ti",text:"Kako napreduje moje dijete?",en:"How is my child progressing?",you:true},
      {speaker:"Učiteljica",text:"Vrlo dobro! Marljivo radi.",en:"Very well! Works diligently."},
      {speaker:"Ti",text:"Ima li problema s jezikom?",en:"Any problems with the language?",you:true},
      {speaker:"Učiteljica",text:"Malo, ali svaki dan je bolje.",en:"A little, but every day is better."},
      {speaker:"Ti",text:"Trebamo li vježbati nešto kod kuće?",en:"Should we practice anything at home?",you:true},
      {speaker:"Učiteljica",text:"Čitanje na hrvatskom bi puno pomoglo.",en:"Reading in Croatian would help a lot."}]}
];
// ═══ POVIJESNE ČINJENICE ═══
const HIST_FACTS = [
  {hr:"Hrvatska je imala prvog kralja 925. — Tomislava.",en:"Croatia had its first king in 925 — Tomislav."},
  {hr:"Kravata potječe iz Hrvatske — vojnici su je nosili u 17. st.",en:"The necktie originated in Croatia — soldiers wore them in the 17th century."},
  {hr:"Dubrovnik je bio neovisna republika više od 450 godina.",en:"Dubrovnik was an independent republic for over 450 years."},
  {hr:"Nikola Tesla je rođen u Smiljanu, Hrvatska, 1856.",en:"Nikola Tesla was born in Smiljan, Croatia, in 1856."},
  {hr:"Vučedolska kultura proizvela je najstariji europski kalendar.",en:"The Vučedol culture produced the oldest European calendar."},
  {hr:"Vinkovci su najstarije kontinuirano naselje u Europi — 8.300 godina.",en:"Vinkovci is Europe's oldest continuously inhabited settlement — 8,300 years."},
  {hr:"Marco Polo je prema predaji rođen na Korčuli.",en:"Marco Polo was traditionally believed born on Korčula."},
  {hr:"Hrvatska ima više od 1.000 otoka.",en:"Croatia has over 1,000 islands."},
  {hr:"Dioklecijanova palača u Splitu sagrađena je oko 305. godine.",en:"Diocletian's Palace in Split was built around 305 AD."},
  {hr:"Labinska Republika 1921. smatra se prvim antifašističkim ustankom u Europi.",en:"The Labin Republic of 1921 is Europe's first anti-fascist uprising."},
  {hr:"Glagoljica je najstarije slavensko pismo.",en:"Glagolitic is the oldest Slavic script."},
  {hr:"Plitvice su UNESCO od 1979.",en:"Plitvice became UNESCO World Heritage in 1979."},
  {hr:"Hrvatska je osvojila 2. mjesto na SP 2018. u Rusiji.",en:"Croatia won 2nd place at the 2018 World Cup in Russia."},
  {hr:"Carevi Valentinijan I. i Valens rođeni su u Vinkovcima.",en:"Emperors Valentinian I and Valens were born in Vinkovci."},
  {hr:"Josip Belušić iz Labina izumio je brzinomjer 1888.",en:"Josip Belušić from Labin invented the speedometer in 1888."},
  {hr:"Hrvatska je proglasila neovisnost 25. lipnja 1991.",en:"Croatia declared independence on June 25, 1991."},
  {hr:"Zadar je star više od 3.000 godina.",en:"Zadar is over 3,000 years old."},
  {hr:"Oluja 1995. bila je najveća kopnena operacija u Europi od WWII.",en:"Operation Storm 1995 was Europe's largest land operation since WWII."},
  {hr:"Lavoslav Ružička iz Vukovara dobio je Nobelovu nagradu 1939.",en:"Lavoslav Ružička from Vukovar won the Nobel Prize in 1939."},
  {hr:"Hrvatska koristi euro od 2023.",en:"Croatia adopted the euro in 2023."},
  {hr:"Stari Most u Mostaru srušen je 1993., obnovljen 2004.",en:"The Old Bridge in Mostar was destroyed 1993, rebuilt 2004."},
  {hr:"U obrani Vukovara, 1.800 branitelja suprotstavilo se 36.000 vojnika.",en:"In Vukovar's defense, 1,800 defenders faced 36,000 soldiers."},
  {hr:"Hrvati žive u BiH od 7. stoljeća.",en:"Croats have lived in BiH since the 7th century."},
  {hr:"Hitchcock je rekao da Zadar ima najljepši zalazak sunca.",en:"Hitchcock said Zadar has the most beautiful sunset."},
  {hr:"Kralj Petar Krešimir IV. darovao je Bibinje 1066.",en:"King Petar Krešimir IV granted Bibinje in 1066."},
  {hr:"Toni Kukoč osvojio je tri NBA naslova s Bullsima.",en:"Toni Kukoč won three NBA titles with the Bulls."},
  {hr:"Franjevci su čuvali hrvatski identitet u Hercegovini 400 godina.",en:"Franciscans preserved Croatian identity in Herzegovina for 400 years."},
  {hr:"Dražen Petrović poginuo je 1993. u 28. godini.",en:"Dražen Petrović died in 1993 at age 28."},
  {hr:"Vučedolska golubica je najstariji prikaz golubice u Europi.",en:"The Vučedol Dove is Europe's oldest dove depiction."},
  {hr:"Hrvatska ima 5.835 km obale s otocima.",en:"Croatia has 5,835 km of coastline with islands."},
  {hr:"Pulska Arena je 6. najveći rimski amfiteatar na svijetu.",en:"Pula Arena is the 6th largest Roman amphitheatre in the world."},
  {hr:"Ban Jelačić ukinuo je kmetstvo u Hrvatskoj 1848.",en:"Ban Jelačić abolished serfdom in Croatia in 1848."},
  {hr:"Sveti Vlaho je zaštitnik Dubrovnika od 972. godine.",en:"Saint Blaise has been Dubrovnik's patron since 972."},
  {hr:"Faust Vrančić izumio je padobran 1617.",en:"Faust Vrančić invented the parachute in 1617."},
  {hr:"Dubrovnik je imao jednu od prvih karantena na svijetu.",en:"Dubrovnik had one of the world's first quarantines."},
  {hr:"Šibenik je jedini grad s dvije UNESCO katedrale.",en:"Šibenik is the only city with two UNESCO cathedrals."},
  {hr:"Splitski Peristil datira iz 4. stoljeća.",en:"Split's Peristyle dates from the 4th century."},
  {hr:"Ivan Meštrović je jedan od najpoznatijih svjetskih kipara.",en:"Ivan Meštrović is one of the world's most famous sculptors."},
  {hr:"Bračko kamenje korišteno je za Bijelu kuću u Washingtonu.",en:"Stone from Brač was used for the White House in Washington."},
  {hr:"Pašk sir je jedan od najboljih sireva na svijetu.",en:"Pag cheese is one of the best cheeses in the world."},
  {hr:"Hrvatska ima osam nacionalnih parkova.",en:"Croatia has eight national parks."},
  {hr:"Sveučilište u Zadru osnovano je 1396. — najstarije u Hrvatskoj.",en:"University of Zadar was founded in 1396 — Croatia's oldest."},
  {hr:"Modri špilj na Biševu je jedno od najljepših prirodnih čuda.",en:"The Blue Cave on Biševo is one of the most beautiful natural wonders."},
  {hr:"Ivan Gundulić napisao je 'Osman', remek-djelo hrvatske književnosti.",en:"Ivan Gundulić wrote 'Osman', a masterpiece of Croatian literature."},
  {hr:"Ruđer Bošković bio je jedan od najvećih znanstvenika 18. stoljeća.",en:"Ruđer Bošković was one of the greatest scientists of the 18th century."},
  {hr:"Korčula ima jednu od najstarijih gradskih uprava u Europi (1214).",en:"Korčula has one of Europe's oldest city statutes (1214)."},
  {hr:"Slavonski hrast koristio se za gradnju europskih katedrala.",en:"Slavonian oak was used to build European cathedrals."},
  {hr:"Hvar ima najviše sunčanih sati u Hrvatskoj — 2.726 godišnje.",en:"Hvar has the most sunshine hours in Croatia — 2,726/year."},
  {hr:"Trakošćan je najposjećeniji dvorac u Hrvatskoj.",en:"Trakošćan is the most visited castle in Croatia."},
  {hr:"Maraska — liker od višanja iz Zadra — proizvodi se od 1700-ih.",en:"Maraska — cherry liqueur from Zadar — has been made since the 1700s."},
  {hr:"Nin je najstariji hrvatski kraljevski grad.",en:"Nin is the oldest Croatian royal city."},
  {hr:"Katedrala sv. Jakova u Šibeniku građena je 105 godina.",en:"St. James Cathedral in Šibenik took 105 years to build."},
  {hr:"Matija Vlačić Ilirik iz Labina bio je blizak suradnik Martina Luthera.",en:"Matthias Flacius from Labin was a close associate of Martin Luther."},
  {hr:"Vukovarski vodotoranj je simbol otpora i slobode.",en:"The Vukovar water tower is a symbol of resistance and freedom."},
  {hr:"Mljet je otok na kojem je, prema legendi, Odisej proveo 7 godina.",en:"Mljet is the island where Odysseus allegedly spent 7 years."},
  {hr:"Dubrovačke ljetne igre održavaju se od 1950.",en:"Dubrovnik Summer Festival has been held since 1950."},
  {hr:"Đakovački lipicanci poznati su u cijelom svijetu.",en:"Đakovo's Lipizzan horses are world-famous."},
  {hr:"Tvrtka Rimac Automobili proizvodi najbrže električne aute na svijetu.",en:"Rimac Automobili makes the world's fastest electric cars."},
  {hr:"Luka Modrić osvojio je Zlatnu loptu 2018.",en:"Luka Modrić won the Ballon d'Or in 2018."},
  {hr:"Gorski kotar je najšumovitija regija Hrvatske.",en:"Gorski Kotar is Croatia's most forested region."},
  {hr:"Sinjska alka je UNESCO zaštićena vitežka igra od 1715.",en:"Sinjska Alka is a UNESCO-protected knights' game since 1715."},
  {hr:"Dalmacija ima više od 300 sunčanih dana godišnje.",en:"Dalmatia has over 300 sunny days per year."},
  {hr:"Varaždin je bio glavni grad Hrvatske 1756-1776.",en:"Varaždin was Croatia's capital 1756-1776."},
  {hr:"Hrvati koriste tri pisma: latinicu, glagoljicu i ćirilicu.",en:"Croats have used three scripts: Latin, Glagolitic, and Cyrillic."},
  {hr:"Rabac se zove Biser Kvarnera.",en:"Rabac is called the Pearl of Kvarner."},
  {hr:"Ilirski pokret u 19. st. ujedinio je Južne Slavene oko hrvatskog jezika.",en:"The Illyrian Movement in the 19th c. united South Slavs around Croatian language."},
  {hr:"Kopački rit je jedan od najvećih močvarnih krajolika u Europi.",en:"Kopački Rit is one of Europe's largest wetland landscapes."},
  {hr:"Andrija Mohorovičić otkrio je granicu Zemljine kore — Moho sloj.",en:"Andrija Mohorovičić discovered the Earth's crust boundary — the Moho layer."},
  {hr:"Hrvatsko Zagorje ima više od 50 dvoraca.",en:"Hrvatsko Zagorje has over 50 castles."},
  {hr:"Pelješki most, otvoren 2022., povezuje južnu Dalmaciju.",en:"The Pelješac Bridge, opened 2022, connects southern Dalmatia."},
  {hr:"Split je drugi najveći grad u Hrvatskoj s oko 180.000 stanovnika.",en:"Split is Croatia's 2nd largest city with about 180,000 people."},
  {hr:"Pag je poznat po čipki koja je na UNESCO-voj listi.",en:"Pag is known for its lace, which is UNESCO-listed."},
  {hr:"Istarski pršut i tartufi poznati su u cijelom svijetu.",en:"Istrian prosciutto and truffles are world-famous."},
  {hr:"Šokačke tradicije u Slavoniji žive kroz Vinkovačke jeseni.",en:"Šokci traditions in Slavonia live through the Vinkovci Autumn festival."},
  {hr:"Ema Derossi-Bjelajac iz Labina bila je prva žena na čelu Hrvatske.",en:"Ema Derossi-Bjelajac from Labin was the first woman to lead Croatia."},
  {hr:"Stončanski zidovi su drugi najduži obrambeni zidovi u Europi.",en:"The Ston Walls are the second longest defensive walls in Europe."},
  {hr:"Neretva je jedina delta u Hrvatskoj i raj za ptice.",en:"Neretva has Croatia's only river delta and is a bird paradise."},
  {hr:"Ivana Brlić-Mažuranić je hrvatska 'Andersen' — spisateljica bajki.",en:"Ivana Brlić-Mažuranić is Croatia's 'Andersen' — a fairy tale writer."},
  {hr:"Vatreni su osvojili brončanu medalju na SP 2022. u Kataru.",en:"The Vatreni won bronze at the 2022 World Cup in Qatar."},
  {hr:"Rijeka je bila Europska prijestolnica kulture 2020.",en:"Rijeka was European Capital of Culture in 2020."},
  {hr:"Špancirfest u Varaždinu je jedan od najvećih festivala u Hrvatskoj.",en:"Špancirfest in Varaždin is one of Croatia's biggest festivals."},
  {hr:"Nikola Šubić Zrinski branio je Siget 1566. do smrti.",en:"Nikola Šubić Zrinski defended Siget in 1566 until death."},
  {hr:"Trg bana Jelačića u Zagrebu je najpoznatiji hrvatski trg.",en:"Ban Jelačić Square in Zagreb is Croatia's most famous square."},
  {hr:"Vukovar je imao oko 45.000 stanovnika prije rata.",en:"Vukovar had about 45,000 residents before the war."},
  {hr:"Ovčara je mjesto jednog od najtežih zločina u Domovinskom ratu.",en:"Ovčara is the site of one of the worst crimes of the Homeland War."},
  {hr:"Hrvatska je pristupila EU 1. srpnja 2013.",en:"Croatia joined the EU on July 1, 2013."},
  {hr:"'Lijepa naša domovino' je hrvatska himna od 1891.",en:"'Lijepa naša domovino' has been Croatia's anthem since 1891."},
  {hr:"Škabrnja je pretrpjela masovni zločin 18. studenoga 1991.",en:"Škabrnja suffered a mass atrocity on November 18, 1991."},
  {hr:"Knin je oslobođen 5. kolovoza 1995. u Oluji.",en:"Knin was liberated on August 5, 1995 during Operation Storm."},
  {hr:"Ivica Zubac je trenutno jedini Hrvat koji igra u NBA.",en:"Ivica Zubac is currently the only Croatian playing in the NBA."},
  {hr:"Jadransko more ima prosječnu dubinu od 252 metra.",en:"The Adriatic Sea has an average depth of 252 meters."},
  {hr:"Zagreb je prvi put spomenut 1094. godine.",en:"Zagreb was first mentioned in 1094."},
  {hr:"Hrvatsko narodno kazalište osnovano je 1895.",en:"Croatian National Theatre was founded in 1895."},
  {hr:"Brijuni su bili rezidencija Josipa Broza Tita.",en:"Brijuni were the residence of Josip Broz Tito."},
  {hr:"Roko Ukić igrao je za Cibonu, Split i Toronto Raptorse.",en:"Roko Ukić played for Cibona, Split and the Toronto Raptors."},
  {hr:"Dino Rađa igrao je za Boston Celticse od 1993. do 1997.",en:"Dino Rađa played for the Boston Celtics from 1993 to 1997."},
  {hr:"Bojan Bogdanović je jedan od najboljih hrvatskih strijelaca u NBA.",en:"Bojan Bogdanović is one of the best Croatian shooters in NBA history."},
  {hr:"Dalmatinski pas je pasmina koja potječe iz Dalmacije.",en:"The Dalmatian dog breed originates from Dalmatia."},
  {hr:"Zagrebačka katedrala je najviša građevina u Hrvatskoj.",en:"Zagreb Cathedral is the tallest building in Croatia."},
  {hr:"Biokovo Skywalk otvoren je 2020. na visini od 1.228 metara.",en:"Biokovo Skywalk opened in 2020 at 1,228 meters altitude."},
  {hr:"Morske orgulje u Zadru sviraju uz pomoć valova.",en:"The Sea Organ in Zadar plays music using waves."},
  {hr:"Hrvatsko vino Plavac Mali je jedno od najcjenjenijih crvenih vina.",en:"Croatian Plavac Mali is one of the most prized red wines."},
  {hr:"Krk je bio najvažniji glagoljaški centar.",en:"Krk was the most important center of Glagolitic culture."},
  {hr:"Baškanska ploča (oko 1100.) najstariji je hrvatski tekst.",en:"The Baška Tablet (c. 1100) is the oldest Croatian text."},
  {hr:"Herman Potočnik Noordung iz HR je osmislio svemirsku stanicu 1929.",en:"Herman Potočnik Noordung from HR designed a space station in 1929."},
  {hr:"Pozdrav Suncu u Zadru napravljen je od 300 staklenih ploča.",en:"Zadar's Sun Salutation is made of 300 glass panels."},
  {hr:"Vukovarska kolona sjećanja okuplja više od 100.000 ljudi svake godine.",en:"Vukovar's Memory Column draws over 100,000 people yearly."},
  {hr:"Ante Starčević poznat je kao Otac domovine.",en:"Ante Starčević is known as the Father of the Homeland."},
  {hr:"Labinski rudari 1921. organizirali su samoupravu 37 dana.",en:"Labin miners in 1921 organized self-government for 37 days."},
  {hr:"Jadrolinija je najstarija hrvatska trajektna kompanija.",en:"Jadrolinija is Croatia's oldest ferry company."},
  {hr:"Mate Parlov bio je svjetski boksački prvak 1978.",en:"Mate Parlov was world boxing champion in 1978."},
  {hr:"Stjepan Radić osnovao je Hrvatsku seljačku stranku 1904.",en:"Stjepan Radić founded the Croatian Peasant Party in 1904."},
  {hr:"Nacionalni park Kornati ima 89 otoka i otočića.",en:"Kornati National Park has 89 islands and islets."},
  {hr:"Marija Jurić Zagorka bila je prva hrvatska novinarka.",en:"Marija Jurić Zagorka was Croatia's first female journalist."},
  {hr:"Opatija je bila ljetovalište austrougarske aristokracije.",en:"Opatija was the summer resort of Austro-Hungarian aristocracy."},
  {hr:"'Kad je bilo tako, bilo je tako' — čuva istinu naše prošlosti.",en:"'When it was so, it was so' — preserving the truth of our past."},
  {hr:"Labinjonska Cakavica zaštićena je kao nematerijalno kulturno dobro 2019.",en:"Labinjonska Cakavica was protected as intangible cultural heritage in 2019."},
  {hr:"Giuseppina Martinuzzi iz Labina bila je prva istarska socijalna aktivistica.",en:"Giuseppina Martinuzzi from Labin was Istria's first social activist."},
  {hr:"Stipan Sorić bio je narodni junak iz Bibinja u borbi protiv Turaka.",en:"Stipan Sorić was a folk hero from Bibinje in the fight against the Turks."},
  {hr:"Bibinje ima pet katoličkih crkava u malom mjestu.",en:"Bibinje has five Catholic churches in a small town."},
  {hr:"Napredak je hrvatsko kulturno društvo osnovano 1902. u BiH.",en:"Napredak is a Croatian cultural society founded in 1902 in BiH."},
  {hr:"Hercegovina znači 'zemlja hercega' — po hercegu Stjepanu Vukčiću.",en:"Herzegovina means 'land of the duke' — after duke Stjepan Vukčić."},
  {hr:"Sveučilište u Mostaru predaje na hrvatskom jeziku.",en:"University of Mostar teaches in Croatian language."},
  {hr:"Međugorje je jedno od najposjećenijih hodočasničkih mjesta na svijetu.",en:"Međugorje is one of the most visited pilgrimage sites in the world."},
  {hr:"Neum je jedini bosanskohercegovački grad na moru.",en:"Neum is Bosnia's only coastal town."},
  {hr:"Ganga je tradicionalno pjevanje zapadne Hercegovine.",en:"Ganga is traditional singing of western Herzegovina."},
  {hr:"Grude su bile administrativno središte za vrijeme rata.",en:"Grude was the administrative center during the war."},
  {hr:"Ljubuški ima srednjovjekovnu tvrđavu iz 14. stoljeća.",en:"Ljubuški has a medieval fortress from the 14th century."},
  {hr:"Široki Brijeg je poznat po franjevačkom samostanu i patriotizmu.",en:"Široki Brijeg is known for its Franciscan monastery and patriotism."},
  {hr:"HVO je osnovan 8. travnja 1992. za obranu Hrvata u BiH.",en:"The HVO was founded April 8, 1992 to defend Croats in BiH."},
  {hr:"Washingtonski sporazum 1994. zaustavio je sukob Hrvata i Bošnjaka.",en:"The Washington Agreement 1994 ended the Croat-Bosniak conflict."},
  {hr:"35 franjevačkih samostana u BiH postojalo je prije Turaka.",en:"35 Franciscan monasteries in BiH existed before the Ottomans."},
  {hr:"Baby Lasagna predstavljao je Hrvatsku na Eurosongu.",en:"Baby Lasagna represented Croatia at Eurovision."},
  {hr:"Oliver Dragojevic poznat je kao 'glas Dalmacije'.",en:"Oliver Dragojević is known as 'the voice of Dalmatia'."},
  {hr:"Agatha Christie spominje Vinkovce u 'Umorstvu u Orient Expressu'.",en:"Agatha Christie mentions Vinkovci in 'Murder on the Orient Express'."},
  {hr:"Steve Gaunt, Englez, došao je u Vinkovce 1991. i ostao zauvijek.",en:"Steve Gaunt, an Englishman, came to Vinkovci in 1991 and stayed forever."},
  {hr:"Sopot kultura kod Vinkovaca datira iz 5480.-3790. pr. Kr.",en:"Sopot culture near Vinkovci dates to 5480-3790 BC."},
  {hr:"Vinkovci su imali prvo metal-lijevanje na svijetu — Vučedol kultura.",en:"Vinkovci had the world's first metal casting — Vučedol culture."},
  {hr:"Rimski Cibalae imao je vodovod, kanalizaciju i terme.",en:"Roman Cibalae had a water supply, sewerage, and thermal baths."},
  {hr:"Josip Runjanin, skladatelj hrvatske himne, odrastao je u Vinkovcima.",en:"Josip Runjanin, composer of the Croatian anthem, grew up in Vinkovci."},
  {hr:"Vinkovačke jeseni najstariji su folklorni festival u Hrvatskoj.",en:"Vinkovci Autumn is the oldest folklore festival in Croatia."},
  {hr:"Sinišu Glavaševića ubili su na Ovčari — bio je vukovarski novinar.",en:"Siniša Glavašević was killed at Ovčara — he was Vukovar's journalist."},
  {hr:"Masovna grobnica na Ovčari ekshumirana je 1996.",en:"The mass grave at Ovčara was exhumed in 1996."},
  {hr:"Dvjesto žrtava identificirano je iz masovne grobnice na Ovčari.",en:"200 victims were identified from the Ovčara mass grave."},
  {hr:"Mile Mrkšić osuđen je na 20 godina za zločin na Ovčari.",en:"Mile Mrkšić was sentenced to 20 years for the Ovčara crime."},
  {hr:"Do 12.000 projektila dnevno padalo je na Vukovar 1991.",en:"Up to 12,000 shells per day fell on Vukovar in 1991."},
  {hr:"86 djece poginulo je u opsadi Vukovara.",en:"86 children died in the siege of Vukovar."},
  {hr:"Vukovarski vodotoranj obnovljen je i otvoren 2020.",en:"Vukovar's water tower was restored and opened in 2020."},
  {hr:"Povorka sjećanja u Vukovaru održava se svake godine 18. studenoga.",en:"The Memory Procession in Vukovar is held every November 18."},
  {hr:"Eltz dvorac u Vukovaru bio je bombardiran i opljačkan 1991.",en:"Eltz Castle in Vukovar was bombed and looted in 1991."},
  {hr:"Vučedolski muzej na Dunavu otvoren je 2015.",en:"The Vučedol Museum on the Danube opened in 2015."},
  {hr:"Hrvatska ima 11 UNESCO materijalnih i nematerijalnih dobara.",en:"Croatia has 11 UNESCO material and immaterial heritage sites."},
  {hr:"Jadranska magistrala je jedna od najljepših cesta na svijetu.",en:"The Adriatic Highway is one of the most beautiful roads in the world."},
  {hr:"Crveni otok kod Rovinja je popularan turistički biser.",en:"Red Island near Rovinj is a popular tourist gem."},
  {hr:"Istra je najveći poluotok u Jadranskom moru.",en:"Istria is the largest peninsula in the Adriatic Sea."},
  {hr:"Hrvatska je osvojila 3. mjesto na SP 2022. — drugi put na postolju!",en:"Croatia won 3rd at the 2022 World Cup — second time on the podium!"},
  {hr:"Rijeka ima najduži karneval u Hrvatskoj.",en:"Rijeka has the longest carnival in Croatia."},
  {hr:"Papuk je prvi geopark u Hrvatskoj.",en:"Papuk is Croatia's first geopark."},
  {hr:"Croatia Airlines osnovan je 1989.",en:"Croatia Airlines was founded in 1989."},
  {hr:"Hrvatsko more jedno je od najčišćih na Mediteranu.",en:"Croatian sea is among the cleanest in the Mediterranean."},
  {hr:"Nikola Tesla je izumio izmjeničnu struju.",en:"Nikola Tesla invented alternating current."},
  {hr:"Bjelolasica je najviši skijaški centar u Hrvatskoj.",en:"Bjelolasica is Croatia's highest ski center."},
  {hr:"Medvedgrad je srednjovjekovna utvrda iznad Zagreba.",en:"Medvedgrad is a medieval fortress above Zagreb."},
  {hr:"Vrsar je bio omiljeno mjesto Giacoma Casanove.",en:"Vrsar was Giacomo Casanova's favorite place."},
  {hr:"Solinska Salona bila je glavni grad rimske Dalmacije.",en:"Solin's Salona was the capital of Roman Dalmatia."},
  {hr:"Hrvatski jezik ima sedam padeža.",en:"Croatian language has seven cases."},
  {hr:"Stradun je glavna ulica u Dubrovniku — duga 300 metara.",en:"Stradun is Dubrovnik's main street — 300 meters long."},
  {hr:"Mala Gospa (8. rujna) je veliki blagdan u Dalmaciji.",en:"Nativity of Mary (Sept 8) is a major feast in Dalmatia."},
  {hr:"Crkva Sv. Donata u Zadru potječe iz 9. stoljeća.",en:"St. Donatus Church in Zadar dates from the 9th century."},
  {hr:"Crkvina u Biskupiji kod Knina je kraljevsko krunidbeno mjesto.",en:"Crkvina in Biskupija near Knin is a royal coronation site."},
  {hr:"Zvonimir je bio hrvatski kralj od 1076. do 1089.",en:"Zvonimir was Croatian king from 1076 to 1089."},
  {hr:"Ban Kulin iz Bosne vladao je od 1180. do 1204.",en:"Ban Kulin of Bosnia ruled from 1180 to 1204."},
  {hr:"Tomislav je ujedinio Panonsku i Dalmatinsku Hrvatsku.",en:"Tomislav united Pannonian and Dalmatian Croatia."},
  {hr:"Trpimirova darovnica (852.) prvi put spominje 'Hrvate'.",en:"Trpimir's charter (852) first mentions 'Croats'."},
  {hr:"Šubići su bili najmoćnija hrvatska plemićka obitelj u 13. st.",en:"The Šubić family was the most powerful Croatian noble family in the 13th c."},
  {hr:"Hrvati su pokršteni u 7.-9. stoljeću.",en:"Croats were Christianized in the 7th-9th century."},
  {hr:"Branimir je dobio papino priznanje Hrvatske 879.",en:"Branimir received papal recognition of Croatia in 879."},
  {hr:"Drniški pršut je zaštićen oznakom izvornosti.",en:"Drniš prosciutto has protected designation of origin."},
  {hr:"Turopolje ima najstariju europsku samoupravu — Plemenita općina od 1278.",en:"Turopolje has Europe's oldest self-government — Noble Municipality since 1278."},
  {hr:"Rijeka Krka ima 7 slapova na 75 km.",en:"The Krka River has 7 waterfalls over 75 km."},
  {hr:"Stari Grad na Hvaru je jedno od najstarijih naselja u Europi.",en:"Stari Grad on Hvar is one of the oldest settlements in Europe."},
  {hr:"Hrvatsku zastavu čine crvena, bijela i plava pruga.",en:"The Croatian flag has red, white, and blue stripes."},
  {hr:"Grb Hrvatske ima 25 polja — bijela i crvena šahovnica.",en:"Croatia's coat of arms has 25 fields — white and red checkerboard."},
  {hr:"Hrvatsko more dom je za dupine, kornjače i sredozemne medvjedice.",en:"Croatian sea is home to dolphins, turtles, and Mediterranean monk seals."},
  {hr:"Advent u Zagrebu proglašen je najboljim božićnim sajmom u Europi.",en:"Advent in Zagreb was declared Europe's best Christmas market."},
  {hr:"Otočić Baljenac nalikuje otisku prsta iz zraka.",en:"The islet of Baljenac looks like a fingerprint from above."},
  {hr:"Čakovec je središte Međimurja — najsjevernije hrvatske županije.",en:"Čakovec is the center of Međimurje — Croatia's northernmost county."},
  {hr:"Daruvar je poznat po termalnim izvorima od rimskog doba.",en:"Daruvar has been known for thermal springs since Roman times."},
  {hr:"Imotski ima Crveno i Modro jezero — prirodna čuda u kršu.",en:"Imotski has the Red and Blue Lakes — natural karst wonders."},
  {hr:"Lastovo je najudaljeniji nastanjeni hrvatski otok.",en:"Lastovo is the most remote inhabited Croatian island."},
  {hr:"Lonjsko polje je najveće poplavno područje u Hrvatskoj.",en:"Lonjsko Polje is Croatia's largest floodplain."},
  {hr:"Motovun je srednjovjekovni gradić u srcu Istre.",en:"Motovun is a medieval town in the heart of Istria."},
  {hr:"Trogir je UNESCO grad — rimska, romanička i barokna arhitektura.",en:"Trogir is a UNESCO city — Roman, Romanesque, and Baroque architecture."},
  {hr:"Vis je bio vojna baza zatvorena za turiste do 1989.",en:"Vis was a military base closed to tourists until 1989."},
  {hr:"Samobor je poznat po kremšnitama.",en:"Samobor is famous for kremšnita cream cakes."},
  {hr:"Kumrovec je rodno selo Josipa Broza Tita.",en:"Kumrovec is the birthplace of Josip Broz Tito."},
  {hr:"Sisak je najstariji grad u kontinentalnoj Hrvatskoj — rimska Siscia.",en:"Sisak is the oldest city in continental Croatia — Roman Siscia."},
  {hr:"Vukovar leži na ušću Vuke u Dunav.",en:"Vukovar lies at the confluence of the Vuka and the Danube."},
  {hr:"Drniš je rodni grad Ivana Meštrovića.",en:"Drniš is Ivan Meštrović's hometown."},
  {hr:"Crikvenica je najstarije morsko kupalište u Hrvatskoj.",en:"Crikvenica is the oldest seaside resort in Croatia."},
  {hr:"Mali Ston ima najstarije solane na Mediteranu.",en:"Mali Ston has the oldest salt pans in the Mediterranean."},
  {hr:"Rijeka Cetina je najdulji tok koji utječe u Jadran.",en:"The Cetina is the longest river flowing into the Adriatic."},
  {hr:"Na Jankovcu u Papuku nalazi se najstarija šumarija u Hrvatskoj.",en:"Jankovac in Papuk has Croatia's oldest forestry office."}
,
  {hr:"Marin Držić napisao je 'Dundo Maroje' — remek-djelo renesansne komedije.",en:"Marin Držić wrote 'Dundo Maroje' — a Renaissance comedy masterpiece."},
  {hr:"Slavonski hrast je jedan od najkvalitetnijih drvnih materijala u Europi.",en:"Slavonian oak is one of the finest woods in Europe."},
  {hr:"Korčulanska moreška je tradicijski borbeni ples iz 15. stoljeća.",en:"Korčula's Moreška is a traditional battle dance from the 15th century."},
  {hr:"Hrvatsko more ima oko 450 vrsta riba.",en:"Croatian sea has about 450 fish species."},
  {hr:"Vukovar je bio multietnički grad Hrvata, Srba, Mađara i ostalih.",en:"Vukovar was a multi-ethnic city of Croats, Serbs, Hungarians and others."},
  {hr:"Slavonski kulen je zaštićen kao hrvatska oznaka izvornosti.",en:"Slavonian kulen has Croatian protected designation of origin."},
  {hr:"Nikola Tesla dao je svijetu izmjeničnu struju i radio.",en:"Nikola Tesla gave the world alternating current and radio."},
  {hr:"Pula Arena izgrađena je u 1. stoljeću za 23.000 gledatelja.",en:"Pula Arena was built in the 1st century for 23,000 spectators."},
  {hr:"Kornatski otoci nemaju stalnih stanovnika.",en:"The Kornati islands have no permanent residents."},
  {hr:"Dubrovačka Republika imala je vlastiti novac, zastavu i diplomaciju.",en:"The Republic of Dubrovnik had its own currency, flag and diplomacy."},
  {hr:"Peristil u Splitu koristi se kao pozornica od antičkih vremena.",en:"Split's Peristyle has been used as a stage since ancient times."},
  {hr:"Jelsa na Hvaru ima najstariju procesiju 'Za Križem' od 1510.",en:"Jelsa on Hvar has the oldest 'Following the Cross' procession since 1510."},
  {hr:"Čipka s Paga izrađuje se ručno od 15. stoljeća.",en:"Pag lace has been made by hand since the 15th century."},
  {hr:"Benkovac je bio središte srpske pobune u Krajini 1991.",en:"Benkovac was the center of the Serb rebellion in Krajina in 1991."},
  {hr:"Bleiburška tragedija 1945. temelj je kolektivnog sjećanja Hrvata.",en:"The Bleiburg tragedy of 1945 is fundamental to Croatian collective memory."},
  {hr:"Trakošćan, Varaždin i Veliki Tabor su najljepši dvorci u Zagorju.",en:"Trakošćan, Varaždin and Veliki Tabor are Zagorje's most beautiful castles."},
  {hr:"'Naša Hrvatska' — ne samo zemlja, nego osjećaj.",en:"'Our Croatia' — not just a land, but a feeling."},
  {hr:"Jadransko more zvuči kroz morske orgulje u Zadru.",en:"The Adriatic Sea sounds through the Sea Organ in Zadar."},
  {hr:"Svetvinčenat ima jednu od najbolje očuvanih srednjovjekovnih utvrda u Istri.",en:"Svetvinčenat has one of the best-preserved medieval forts in Istria."},
  {hr:"Korčulanska Gradska vijećnica iz 15. st. najstarija je u Dalmaciji.",en:"Korčula's 15th c. Town Hall is the oldest in Dalmatia."},
  {hr:"Krčki knezovi Frankopani vladali su 500 godina.",en:"The Frankopan Princes of Krk ruled for 500 years."},
  {hr:"Grožnjan je grad umjetnika — više galerija nego stanovnika.",en:"Grožnjan is an artists' town — more galleries than residents."},
  {hr:"Rovinj je nekad bio otok — spojen s kopnom u 18. st.",en:"Rovinj was once an island — connected to mainland in 18th c."},
  {hr:"Učka je najviša planina Istre — 1.396 m.",en:"Učka is the highest mountain in Istria — 1,396 m."},
  {hr:"Istarski tartufi spadaju među najskuplje na svijetu.",en:"Istrian truffles are among the most expensive in the world."},
  {hr:"Limski kanal je fjord u Istri dug 12 km.",en:"Lim Channel is a 12 km fjord in Istria."},
  {hr:"Raša je najmlađi grad u Istri — sagrađen za rudare 1936.",en:"Raša is the youngest town in Istria — built for miners in 1936."},
  {hr:"Buzet je 'grad tartufa' — godišnji festival tartufa.",en:"Buzet is the 'city of truffles' — annual truffle festival."},
  {hr:"Brijunski otoci imaju Safari park s egzotičnim životinjama.",en:"Brijuni islands have a Safari park with exotic animals."},
  {hr:"Josip Broz Tito primio je više od 100 državnih poglavara na Brijunima.",en:"Josip Broz Tito received over 100 heads of state at Brijuni."},
  {hr:"Pazin ima ponor koji je inspirirao Jules Vernea.",en:"Pazin has a chasm that inspired Jules Verne."},
  {hr:"Istra je poznata po Malvaziji — autohtonom bijelom vinu.",en:"Istria is known for Malvasia — an indigenous white wine."},
  {hr:"Poreč ima Eufrazijevu baziliku — UNESCO od 1997.",en:"Poreč has the Euphrasian Basilica — UNESCO since 1997."},
  {hr:"Umag je domaćin ATP teniskog turnira svake godine.",en:"Umag hosts an ATP tennis tournament every year."},
  {hr:"Mošćenička Draga ima jednu od najljepših plaža u Kvarneru.",en:"Mošćenička Draga has one of the most beautiful beaches in Kvarner."},
  {hr:"Kastav je srednjovjekovna utvrda iznad Rijeke.",en:"Kastav is a medieval fortress above Rijeka."},
  {hr:"Lovran je poznat po festivalu marunadi — kestena.",en:"Lovran is known for the marunada festival — chestnuts."},
  {hr:"Cres i Lošinj bili su jedan otok do 1. stoljeća.",en:"Cres and Lošinj were one island until the 1st century."},
  {hr:"Beli na Cresu dom je za bjeloglave supove.",en:"Beli on Cres is home to griffon vultures."},
  {hr:"Rab ima najstariji gradski park u Europi — Komrčar.",en:"Rab has the oldest city park in Europe — Komrčar."},
  {hr:"Novalja na Pagu poznata je po plaži Zrće — 'hrvatski Ibiza'.",en:"Novalja on Pag is known for Zrće beach — 'Croatian Ibiza'."},
  {hr:"Senj je bio dom uskoka — pirati koji su branili Hrvatsku.",en:"Senj was home to the Uskoks — pirates who defended Croatia."},
  {hr:"Krapina je nalazište neandertalaca starog 130.000 godina.",en:"Krapina is a Neanderthal site 130,000 years old."},
  {hr:"Plitvička jezera imaju 16 jezera povezanih slapovima.",en:"Plitvice Lakes have 16 lakes connected by waterfalls."},
  {hr:"Karlovac je osnovan 1579. kao tvrđava protiv Turaka — u obliku zvijezde.",en:"Karlovac was founded 1579 as a star-shaped fortress against the Turks."},
  {hr:"Čavoglave su selo koje je postalo simbol otpora u Domovinskom ratu.",en:"Čavoglave is a village that became a symbol of resistance in the Homeland War."},
  {hr:"Slavonija je žitnica Hrvatske.",en:"Slavonia is Croatia's breadbasket."},
  {hr:"Baranja je poznata po vinogradima i multikulturalnosti.",en:"Baranja is known for vineyards and multiculturalism."},
  {hr:"Požega leži u kotlini okruženoj planinama — 'Zlatna dolina'.",en:"Požega lies in a valley surrounded by mountains — 'Golden Valley'."},
  {hr:"Đakovo ima jednu od najljepših katedrala u Hrvatskoj.",en:"Đakovo has one of the most beautiful cathedrals in Croatia."},
  {hr:"Brodsko kolo je slavonski festival folklora i tradicije.",en:"Brodsko Kolo is Slavonia's festival of folklore and tradition."},
  {hr:"Ilok je najistočniji grad u Hrvatskoj — na Dunavu.",en:"Ilok is Croatia's easternmost city — on the Danube."},
  {hr:"Ilok proizvodi vrhunska vina — posebno Graševinu i Traminac.",en:"Ilok produces premium wines — especially Graševina and Traminer."},
  {hr:"Osječka Tvrđa je jedna od najbolje očuvanih baroknih utvrda u Europi.",en:"Osijek's Tvrđa is one of Europe's best-preserved baroque fortresses."},
  {hr:"Vukovarska bolnica bila je posljednje utočište branitelja.",en:"Vukovar Hospital was the defenders' last refuge."},
  {hr:"Borovo Selo — incident 2. svibnja 1991. početak je rata.",en:"Borovo Selo — the incident of May 2, 1991 was the start of the war."},
  {hr:"Lika je najrjeđe naseljena regija Hrvatske.",en:"Lika is Croatia's most sparsely populated region."},
  {hr:"Gospić je središte Like — područje ljepote i tišine.",en:"Gospić is the center of Lika — an area of beauty and silence."},
  {hr:"Velebit je najduža planina u Hrvatskoj — 145 km.",en:"Velebit is Croatia's longest mountain — 145 km."},
  {hr:"Paklenica je raj za penjače — 400+ smjerova.",en:"Paklenica is a climber's paradise — 400+ routes."},
  {hr:"Sjeverni Velebit ima Lukinu jamu — 1.421 m duboku.",en:"Northern Velebit has Lukina Pit — 1,421 m deep."},
  {hr:"Međimurje je najsjevernija i najmanja hrvatska županija.",en:"Međimurje is Croatia's northernmost and smallest county."},
  {hr:"Varaždin je bio prijestolnica Hrvatske do požara 1776.",en:"Varaždin was Croatia's capital until a fire in 1776."},
  {hr:"Krapinske toplice poznate su još od rimskog doba.",en:"Krapinske Toplice have been known since Roman times."},
  {hr:"Zagreb ima gornji i donji grad — povezani uspinjačom.",en:"Zagreb has upper and lower town — connected by funicular."},
  {hr:"Zagrebačka uspinjača jedna je od najkraćih na svijetu — 66 metara.",en:"Zagreb's funicular is one of the world's shortest — 66 meters."},
  {hr:"Dolac je zagrebačka tržnica poznata kao 'trbuh Zagreba'.",en:"Dolac is Zagreb's market known as 'the belly of Zagreb'."},
  {hr:"Muzej prekinutih veza u Zagrebu je jedinstven na svijetu.",en:"Museum of Broken Relationships in Zagreb is unique in the world."},
  {hr:"Hrvatsko narodno kazalište u Zagrebu otvoreno je 1895.",en:"Croatian National Theatre in Zagreb opened in 1895."},
  {hr:"Jarun u Zagrebu zovu 'zagrebačko more'.",en:"Jarun in Zagreb is called 'Zagreb's sea'."},
  {hr:"Maksimir je najstariji javni park u jugoistočnoj Europi.",en:"Maksimir is the oldest public park in southeastern Europe."},
  {hr:"Mirogoj u Zagrebu jedan je od najljepših groblja u Europi.",en:"Mirogoj in Zagreb is one of the most beautiful cemeteries in Europe."},
  {hr:"Hrvati su bili izuzetak — i uvijek će biti.",en:"Croats were the exception — and always will be."},
  {hr:"Ratnici su neuništivi.",en:"Warriors are indestructible."},
  {hr:"Sjeti se Vukovara.",en:"Remember Vukovar."},
  {hr:"Za dom.",en:"For the homeland."},
  {hr:"Naša Hrvatska — naš dom, naš ponos, naš život.",en:"Our Croatia — our home, our pride, our life."},
  {hr:"Dubrovačke zidine duge su 1.940 metara.",en:"Dubrovnik's walls are 1,940 meters long."},
  {hr:"Sv. Vlaho je zaštitnik Dubrovnika — slavi se 3. veljače.",en:"St. Blaise is Dubrovnik's patron — celebrated February 3."},
  {hr:"Lokrum je otok zabranjen za noćenje — prema legendi proklet.",en:"Lokrum is an island forbidden for overnight stays — cursed by legend."},
  {hr:"Trogir je uništen od Saracena 1123. i potpuno obnovljen.",en:"Trogir was destroyed by Saracens in 1123 and completely rebuilt."},
  {hr:"Fortuna u Hvaru je najstarija kazališna zgrada u Europi (1612).",en:"Fortuna in Hvar is the oldest theatre building in Europe (1612)."},
  {hr:"Vis je mjesto bitke 1866. između Italije i Austrije.",en:"Vis was the site of an 1866 battle between Italy and Austria."},
  {hr:"Biševo ima Modru špilju vidljivu samo oko podneva.",en:"Biševo has a Blue Cave visible only around noon."},
  {hr:"Susak ima jedinu pješčanu plažu u sjevernom Jadranu.",en:"Susak has the only sandy beach in the northern Adriatic."},
  {hr:"Silba nema automobila — samo pješaci i bicikli.",en:"Silba has no cars — only pedestrians and bicycles."},
  {hr:"Dugi Otok ima slano jezero Mir — jedno od dva u Hrvatskoj.",en:"Dugi Otok has salt lake Mir — one of two in Croatia."},
  {hr:"Premuda je otok na kojem je potonula austrougarska bojna brod.",en:"Premuda is where an Austro-Hungarian battleship was sunk."},
  {hr:"Ilovik je 'otok cvijeća' u Kvarneru.",en:"Ilovik is the 'island of flowers' in Kvarner."},
  {hr:"Palagruža je najudaljeniji hrvatski otok — bliže Italiji nego Hrvatskoj.",en:"Palagruža is Croatia's most remote island — closer to Italy."},
  {hr:"Jabuka je vulkanski otok u Jadranu.",en:"Jabuka is a volcanic island in the Adriatic."},
  {hr:"Kornati nemaju izvora pitke vode.",en:"Kornati have no fresh water sources."},
  {hr:"Hrvatska je u top 20 turističkih destinacija na svijetu.",en:"Croatia is in the top 20 tourist destinations in the world."},
  {hr:"Rimac Nevera je najbrži električni automobil na svijetu.",en:"Rimac Nevera is the world's fastest electric car."},
  {hr:"Miroslav Krleža je najutjecajniji hrvatski književnik 20. stoljeća.",en:"Miroslav Krleža is Croatia's most influential 20th c. writer."},
  {hr:"August Šenoa napisao je 'Zlatarevo zlato' — klasik hrvatske književnosti.",en:"August Šenoa wrote 'The Goldsmith's Gold' — a Croatian literary classic."},
  {hr:"Tin Ujević je jedan od najcjenjenijih hrvatskih pjesnika.",en:"Tin Ujević is one of Croatia's most esteemed poets."},
  {hr:"Marko Marulić iz Splita smatra se ocem hrvatske književnosti.",en:"Marko Marulić from Split is considered the father of Croatian literature."},
  {hr:"Judita Marka Marulića (1501) prvi je ep na hrvatskom jeziku.",en:"Marulić's Judita (1501) is the first epic poem in Croatian."},
  {hr:"Nikola Jurišić branio je Kiseg s 800 ljudi protiv 100.000 Turaka 1532.",en:"Nikola Jurišić defended Kőszeg with 800 against 100,000 Turks in 1532."},
  {hr:"Josip Jelačić je ban koji je ukinuo kmetstvo i branio Hrvatsku.",en:"Josip Jelačić is the ban who abolished serfdom and defended Croatia."},
  {hr:"Vukovarska ulica u Zagrebu nazvana je u spomen žrtvama.",en:"Vukovarska street in Zagreb is named in memory of the victims."},
  {hr:"Franjo Tuđman bio je prvi predsjednik neovisne Hrvatske.",en:"Franjo Tuđman was the first president of independent Croatia."},
  {hr:"Goran Ivanišević je jedini Hrvat koji je osvojio Wimbledon (2001).",en:"Goran Ivanišević is the only Croat to win Wimbledon (2001)."},
  {hr:"Janica Kostelić osvojila je 4 olimpijska zlata u skijanju.",en:"Janica Kostelić won 4 Olympic golds in skiing."},
  {hr:"Ivica Kostelić osvojio je Ukupni svjetski kup u skijanju 2011.",en:"Ivica Kostelić won the Overall World Cup in skiing in 2011."},
  {hr:"Sandra Perković je dvostruka olimpijska pobjednica u bacanju diska.",en:"Sandra Perković is a double Olympic champion in discus."},
  {hr:"Blanka Vlašić je jedna od najvećih visinašica svih vremena.",en:"Blanka Vlašić is one of the greatest high jumpers of all time."},
  {hr:"Sara Kolak osvojila je olimpijsko zlato u bacanju koplja 2016.",en:"Sara Kolak won Olympic gold in javelin in 2016."},
  {hr:"Hrvatsko rukomet je osvajalo medalje na svim velikim natjecanjima.",en:"Croatian handball has won medals at all major competitions."},
  {hr:"Vaterpolo klub Jug Dubrovnik 7 puta je bio europski prvak.",en:"Water polo club Jug Dubrovnik has been European champion 7 times."},
  {hr:"Hrvatska je na SP 1998. osvojila brončanu medalju — prvi nastup!",en:"Croatia won bronze at the 1998 World Cup — their first appearance!"},
  {hr:"Davor Šuker bio je najbolji strijelac SP 1998.",en:"Davor Šuker was the top scorer at the 1998 World Cup."},
  {hr:"Luka Modrić je proglašen najboljim igračem SP 2018.",en:"Luka Modrić was named the best player at the 2018 World Cup."},
  {hr:"Ivan Rakitić je zabio pobjednički jedanaesterac u polufinalu SP 2018.",en:"Ivan Rakitić scored the winning penalty in the 2018 WC semifinal."},
  {hr:"Mario Mandžukić zabio je prvi autogol i prvi gol u finalu SP.",en:"Mario Mandžukić scored both an own goal and a goal in the WC final."},
  {hr:"Mateo Kovačić je bio dio zlatnog sastava Reala i Chelseaja.",en:"Mateo Kovačić was part of Real Madrid and Chelsea's golden squads."},
  {hr:"Ivan Perišić zabio je gol u finalu SP 2018.",en:"Ivan Perišić scored a goal in the 2018 WC final."},
  {hr:"Ante Rebić je strijelac jednog od najljepših golova u povijesti SP.",en:"Ante Rebić scored one of the most beautiful goals in WC history."},
  {hr:"Domagoj Vida branio je Hrvatsku u polufinalu SP 2018.",en:"Domagoj Vida defended Croatia in the 2018 WC semifinal."},
  {hr:"Hrvatska je pobijedila Brazil u četvrtfinalu SP 2022.",en:"Croatia defeated Brazil in the 2022 WC quarterfinal."},
  {hr:"Dominik Livaković je bio heroj jedanaesteraca na SP 2022.",en:"Dominik Livaković was the penalty hero at the 2022 WC."},
  {hr:"Joško Gvardiol jedan je od najskupljih hrvatskih igrača ikad.",en:"Joško Gvardiol is one of the most expensive Croatian players ever."},
  {hr:"Zvonimir Boban je legenda Dinama i AC Milana.",en:"Zvonimir Boban is a legend of Dinamo and AC Milan."},
  {hr:"Torcida je najstarija navijačka skupina u Europi — osnovana 1950.",en:"Torcida is Europe's oldest fan group — founded 1950."},
  {hr:"Bad Blue Boys su navijači Dinama Zagreba od 1986.",en:"Bad Blue Boys have been Dinamo Zagreb's fans since 1986."},
  {hr:"Cibona je osvojila Europski kup 1985. i 1986.",en:"Cibona won the European Cup in 1985 and 1986."},
  {hr:"Krešimir Ćosić je bio prvi Europljanin u NBA Kući slavnih.",en:"Krešimir Ćosić was the first European in the NBA Hall of Fame."},
  {hr:"Dražen Petrović je primljen u NBA Kuću slavnih 2002.",en:"Dražen Petrović was inducted into the NBA Hall of Fame in 2002."},
  {hr:"Toni Kukoč je primljen u NBA Kuću slavnih 2021.",en:"Toni Kukoč was inducted into the NBA Hall of Fame in 2021."},
  {hr:"Hrvatska košarkaška reprezentacija osvojila je srebrnu medalju na OI 1992.",en:"Croatia's basketball team won silver at the 1992 Olympics."},
  {hr:"Hrvatska je imala 7 igrača u NBA u jednom trenutku.",en:"Croatia had 7 players in the NBA at one point."},
  {hr:"Dinamo Zagreb je igrao u Ligi prvaka više puta.",en:"Dinamo Zagreb has played in the Champions League multiple times."},
  {hr:"Hajduk Split osnovan je 1911. u Pragu.",en:"Hajduk Split was founded in 1911 in Prague."},
  {hr:"NK Zagreb je najstariji hrvatski nogometni klub — osnovan 1903.",en:"NK Zagreb is Croatia's oldest football club — founded 1903."},
  {hr:"Maksimir je najstariji stadion u Hrvatskoj.",en:"Maksimir is the oldest stadium in Croatia."},
  {hr:"Poljud u Splitu projektirao je japanski arhitekt.",en:"Poljud in Split was designed by a Japanese architect."},
  {hr:"Rijeka je dobila hrvatski naslov prvaka 2017. — nakon 72 godine!",en:"Rijeka won the Croatian title in 2017 — after 72 years!"},
  {hr:"INmusic je najveći festival otvorenog tipa u Hrvatskoj.",en:"INmusic is Croatia's largest open-air festival."},
  {hr:"Ultra Europe u Splitu privlači 150.000 posjetitelja.",en:"Ultra Europe in Split attracts 150,000 visitors."},
  {hr:"Outlook Festival na Puntu održavao se od 2008. do 2022.",en:"Outlook Festival in Punta was held from 2008 to 2022."},
  {hr:"Rabac ima 4 plaže s Plavom zastavom.",en:"Rabac has 4 Blue Flag beaches."},
  {hr:"Labin ima 94 skulpture u parku Dubrova.",en:"Labin has 94 sculptures in Dubrova Park."},
  {hr:"Girandella je najpopularnija plaža u Rabcu.",en:"Girandella is the most popular beach in Rabac."},
  {hr:"Istarska Malvazija je najrasprostranjenije bijelo vino u Istri.",en:"Istrian Malvasia is the most widespread white wine in Istria."},
  {hr:"Teran je autohtono istarsko crno vino.",en:"Teran is an indigenous Istrian red wine."},
  {hr:"Istarski pršut suši se na buri i zri najmanje 12 mjeseci.",en:"Istrian prosciutto is dried by bura wind and aged at least 12 months."},
  {hr:"Fuži su tradicionalna istarska tjestenina.",en:"Fuži are traditional Istrian pasta."},
  {hr:"Maneštra je istarska juha od povrća — svaka kuća ima svoj recept.",en:"Maneštra is Istrian vegetable soup — every house has its own recipe."},
  {hr:"Fritaja je istarska verzija omleta — često s tartufima.",en:"Fritaja is the Istrian version of an omelet — often with truffles."},
  {hr:"Istra ima više od 3.000 stabala maslina starih preko 1.000 godina.",en:"Istria has over 3,000 olive trees older than 1,000 years."},
  {hr:"Istrska maslinova ulja redovno osvajaju svjetske nagrade.",en:"Istrian olive oils regularly win world awards."},
  {hr:"Rapska torta je slatki specijalitet otoka Raba od 15. st.",en:"Rab cake is a sweet specialty of Rab island from the 15th century."},
  {hr:"Paški sir zri minimum 6 mjeseci i ima zaštićen naziv.",en:"Pag cheese ages minimum 6 months and has a protected name."},
  {hr:"Zagorski štrukli mogu biti kuhani ili pečeni.",en:"Zagorje štrukli can be boiled or baked."},
  {hr:"Hrvatsku su posjetili 21 milijun turista u rekordnoj 2023. godini.",en:"Croatia was visited by 21 million tourists in the record year 2023."},
  {hr:"Pelješki most dug je 2.404 metra.",en:"The Pelješac Bridge is 2,404 meters long."},
  {hr:"Hrvatska ima 4 EU zaštićene oznake za vino.",en:"Croatia has 4 EU protected wine designations."},
  {hr:"Prosječna plaća u Hrvatskoj je oko 1.300 EUR neto.",en:"Average salary in Croatia is about 1,300 EUR net."},
  {hr:"Hrvatska ima 20 županija i Grad Zagreb.",en:"Croatia has 20 counties and the City of Zagreb."},
  {hr:"Sjeti se Vukovara. Sjeti se tko smo. Sjeti se zašto smo tu.",en:"Remember Vukovar. Remember who we are. Remember why we're here."},
  {hr:"Naša Hrvatska — jer biti Hrvat nije samo znati jezik, nego živjeti srcem.",en:"Our Croatia — because being Croatian isn't just knowing the language, it's living with heart."}];
function getHistFact(){
  var n=new Date();
  var dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  // Different salt from proverb so the two never share the same pick
  var h=5381;var s='fact:'+dk;for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;h=h>>>0;
  return HIST_FACTS[h%HIST_FACTS.length];
}
// ═══ LEARNING PATH ═══
const LEARN_PATH = [
  {level:1,title:"Survivor",desc:"First 48 hours",items:[
    {id:"lp1",name:"Basic Greetings",ck:function(s){return s.lc>=1},go:"lesson"},{id:"lp2",name:"Numbers",ck:function(s){return s.lc>=2},go:"lesson"},{id:"lp3",name:"Emergency Phrases",ck:function(s){return s.lc>=3},go:"emergency"},{id:"lp4",name:"Order Food",ck:function(s){return s.lc>=4},go:"foodorder"},{id:"lp5",name:"Get Around",ck:function(s){return s.lc>=4},go:"transport"}]},
  {level:2,title:"Settler",desc:"First week",items:[
    {id:"lp6",name:"Family Words",ck:function(s){return s.lc>=5},go:"lesson"},{id:"lp7",name:"School Kit",ck:function(s){return s.lc>=6},go:"school"},{id:"lp8",name:"Making Friends",ck:function(s){return s.lc>=6},go:"friends"},{id:"lp9",name:"Grocery Shopping",ck:function(s){return s.lc>=7},go:"grocery"},{id:"lp10",name:"Alphabet",ck:function(s){return s.lc>=7},go:"alphabet"},{id:"lp11",name:"First Quiz",ck:function(s){return s.xp>=50},go:"mcgame"}]},
  {level:3,title:"Communicator",desc:"First month",items:[
    {id:"lp12",name:"Grammar Intro",ck:function(s){return s.gc>=1},go:"grammar"},{id:"lp13",name:"Texting/Slang",ck:function(s){return s.lc>=10},go:"texting"},{id:"lp14",name:"Role-Play",ck:function(s){return s.lc>=10},go:"roleplay"},{id:"lp15",name:"Read a Story",ck:function(s){return s.lc>=12},go:"readlist"},{id:"lp16",name:"Conjugation",ck:function(s){return s.gc>=2},go:"conjdrill"},{id:"lp17",name:"Listening",ck:function(s){return s.lc>=12},go:"listening"},{id:"lp18",name:"Tenses & Gender",ck:function(s){return s.gc>=3},go:"tenses"}]},
  {level:4,title:"Explorer",desc:"Months 2-3",items:[
    {id:"lp19",name:"7 Cases",ck:function(s){return s.gc>=4},go:"padezi"},{id:"lp20",name:"Padeži Master",ck:function(s){return s.gc>=5},go:"padezifull"},{id:"lp21",name:"Verb Aspect",ck:function(s){return s.gc>=5},go:"aspect"},{id:"lp22",name:"Modal Verbs",ck:function(s){return s.gc>=6},go:"modal"},{id:"lp23",name:"Declension",ck:function(s){return s.gc>=6},go:"declension"},{id:"lp24",name:"False Friends",ck:function(s){return s.lc>=20},go:"falsefr"},{id:"lp25",name:"Dialects",ck:function(s){return s.lc>=20},go:"dialects"}]},
  {level:5,title:"Hrvat",desc:"Months 4-6",items:[
    {id:"lp26",name:"Idioms",ck:function(s){return s.lc>=25},go:"idioms"},{id:"lp27",name:"Tongue Twisters",ck:function(s){return s.lc>=25},go:"brzalice"},{id:"lp28",name:"Word Formation",ck:function(s){return s.lc>=25},go:"wordform"},{id:"lp29",name:"Diminutives",ck:function(s){return s.lc>=28},go:"diminutives"},{id:"lp30",name:"Advanced Reading",ck:function(s){return s.lc>=30},go:"readlist"},{id:"lp31",name:"Domovinski Rat",ck:function(s){return s.lc>=30},go:"history"},{id:"lp32",name:"Cook Croatian!",ck:function(s){return s.lc>=30},go:"recipes"},{id:"lp33",name:"200 XP!",ck:function(s){return s.xp>=200},go:"dashboard"}]}
];
// ═══ REFLEXIVE VERBS ═══
const REFLEXIVE = {
  title:"Povratni Glagoli",
  intro:"Reflexive verbs use SE (oneself). In Croatian, SE moves around in the sentence but never starts it.",
  verbs:[
    {inf:"tuširati se",en:"to shower",forms:{ja:"tuširam se",ti:"tuširaš se",on:"tušira se",mi:"tuširamo se",vi:"tuširate se",oni:"tuširaju se"},past:{m:"tuširao sam se",f:"tuširala sam se"}},
    {inf:"obući se",en:"to get dressed",forms:{ja:"obučem se",ti:"obučeš se",on:"obuče se",mi:"obučemo se",vi:"obučete se",oni:"obuku se"},past:{m:"obukao sam se",f:"obukla sam se"}},
    {inf:"obuti se",en:"to put on shoes",forms:{ja:"obujem se",ti:"obuješ se",on:"obuje se",mi:"obujemo se",vi:"obujete se",oni:"obuju se"},past:{m:"obuo sam se",f:"obula sam se"}},
    {inf:"obrijati se",en:"to shave",forms:{ja:"obrijem se",ti:"obriješ se",on:"obrije se",mi:"obrijemo se",vi:"obrijete se",oni:"obriju se"},past:{m:"obrijao sam se",f:"obrijala sam se"}},
    {inf:"počešljati se",en:"to comb hair",forms:{ja:"počešljam se",ti:"počešljaš se",on:"počešlja se",mi:"počešljamo se",vi:"počešljate se",oni:"počešljaju se"},past:{m:"počešljao sam se",f:"počešljala sam se"}},
    {inf:"vratiti se",en:"to return",forms:{ja:"vratim se",ti:"vratiš se",on:"vrati se",mi:"vratimo se",vi:"vratite se",oni:"vrate se"},past:{m:"vratio sam se",f:"vratila sam se"}},
    {inf:"koncentrirati se",en:"to concentrate",forms:{ja:"koncentriram se",ti:"koncentriraš se",on:"koncentrira se",mi:"koncentriramo se",vi:"koncentrirate se",oni:"koncentriraju se"},past:{m:"koncentrirao sam se",f:"koncentrirala sam se"}},
    {inf:"probuditi se",en:"to wake up",forms:{ja:"probudim se",ti:"probudiš se",on:"probudi se",mi:"probudimo se",vi:"probudite se",oni:"probude se"},past:{m:"probudio sam se",f:"probudila sam se"}}
  ],
  rules:[
    {rule:"SE never opens a sentence",icon:"🚫",bad:"Se tuširam svaki dan.",good:"Tuširam se svaki dan.",note:"SE is a clitic — it must attach after the first stressed word or phrase."},
    {rule:"Present tense: SE follows the verb",icon:"✅",bad:"Ja se vraćam kući.",good:"Vraćam se kući.",note:"The subject pronoun (ja/ti/on) is usually dropped. SE attaches right after the verb."},
    {rule:"Past tense: auxiliary comes before SE",icon:"📌",bad:"Tuširali se su.",good:"Tuširali su se.",note:"Clitics stack in order: [aux] [se] — never swap them. 'Sam/si/je/smo/ste/su' always beats SE."},
    {rule:"Future tense: SE follows ću/ćeš/će...",icon:"🔮",bad:"Se tuširaću.",good:"Tuširat ću se.",note:"In future, the ću-form comes second, SE comes after: 'Tuširat ću se', 'Obući ćeš se'."},
    {rule:"Negative: NE attaches to the verb",icon:"❌",bad:"Ne se mogu koncentrirati.",good:"Ne mogu se koncentrirati.",note:"NE fuses with the verb. SE stays in its normal position after the conjugated verb."},
    {rule:"Questions work the same way",icon:"❓",bad:"Se jesi umorio?",good:"Jesi li se umorio?",note:"LI follows the auxiliary. SE stays after the auxiliary: 'Jesi li se tuširao?'"}
  ],
  tenseExamples:[
    {verb:"tuširati se",en:"to shower",
      present:{hr:"Tuširam se svako jutro.",en:"I shower every morning."},
      past:{hr:"Tuširao sam se prije treninga.",en:"I showered before training."},
      future:{hr:"Tuširat ću se poslije.",en:"I will shower afterwards."},
      negative:{hr:"Ne tuširam se hladnom vodom.",en:"I don't shower in cold water."}},
    {verb:"obući se",en:"to get dressed",
      present:{hr:"Obučem se za deset minuta.",en:"I get dressed in ten minutes."},
      past:{hr:"Obukla se i otišla.",en:"She got dressed and left."},
      future:{hr:"Obući ćeš se toplo.",en:"You will dress warmly."},
      negative:{hr:"Nije se još obukao.",en:"He hasn't gotten dressed yet."}},
    {verb:"vratiti se",en:"to return",
      present:{hr:"Vraćamo se kući u pet.",en:"We return home at five."},
      past:{hr:"Vratio sam se kasno.",en:"I returned late."},
      future:{hr:"Vratit će se sutra.",en:"He will return tomorrow."},
      negative:{hr:"Nismo se još vratili.",en:"We haven't returned yet."}},
    {verb:"probuditi se",en:"to wake up",
      present:{hr:"Probudim se u sedam.",en:"I wake up at seven."},
      past:{hr:"Probudila se rano.",en:"She woke up early."},
      future:{hr:"Probudit ćemo se zajedno.",en:"We will wake up together."},
      negative:{hr:"Nije se probudio na alarm.",en:"He didn't wake up to the alarm."}},
    {verb:"koncentrirati se",en:"to concentrate",
      present:{hr:"Ne mogu se koncentrirati.",en:"I can't concentrate."},
      past:{hr:"Koncentrirali su se na zadatak.",en:"They concentrated on the task."},
      future:{hr:"Koncentrirat ćeš se bolje.",en:"You will concentrate better."},
      negative:{hr:"Djeca se ne mogu koncentrirati.",en:"Children can't concentrate."}}
  ],
  quiz:[
    {q:"I woke up at seven.",a:"Probudio sam se u sedam.",opts:["Probudio sam se u sedam.","Probudim sam se u sedam.","Se probudio sam u sedam."]},
    {q:"She got dressed quickly.",a:"Brzo se obukla.",opts:["Brzo se obukla.","Brzo obukla se.","Se brzo obukla."]},
    {q:"We returned home.",a:"Vratili smo se kući.",opts:["Vratili smo se kući.","Se vratili smo kući.","Vratili se smo kući."]},
    {q:"He shaved this morning.",a:"Obrijao se jutros.",opts:["Obrijao se jutros.","Se obrijao jutros.","Jutros obrijao se."]},
    {q:"I can't concentrate.",a:"Ne mogu se koncentrirati.",opts:["Ne mogu se koncentrirati.","Ne se mogu koncentrirati.","Se ne mogu koncentrirati."]},
    {q:"They showered after the gym.",a:"Tuširali su se nakon teretane.",opts:["Tuširali su se nakon teretane.","Se tuširali su nakon teretane.","Tuširali ce su nakon teretane."]},
    {q:"She combs her hair every morning.",a:"Počešlja se svako jutro.",opts:["Počešlja se svako jutro.","Se počešlja svako jutro.","Počešlja svako jutro se."]},
    {q:"Will you get dressed now? (ti)",a:"Obući ćeš se sada?",opts:["Obući ćeš se sada?","Se obući ćeš sada?","Obući se ćeš sada?"]},
    {q:"We will return soon.",a:"Vratit ćemo se uskoro.",opts:["Vratit ćemo se uskoro.","Se vratit ćemo uskoro.","Vratit se ćemo uskoro."]},
    {q:"Did you shower? (ti)",a:"Jesi li se tuširao?",opts:["Jesi li se tuširao?","Se jesi li tuširao?","Jesi se li tuširao?"]}
  ]
};
// ═══ SVOJ vs MOJ ═══
const SVOJMOJ = {
  title:"Svoj vs Moj",
  intro:"In Croatian, 'svoj' (reflexive possessive) always refers back to the subject of the sentence. Using 'moj/tvoj/njegov' when 'svoj' is correct sounds unnatural — native speakers notice immediately.",
  rule:"Use SVOJ when the possessor IS the subject of the sentence. Use MOJ/TVOJ/NJEGOV when referring to someone ELSE's item.",
  pairs:[
    {wrong:"Uzeo je njegov kaput.",right:"Uzeo je svoj kaput.",note:"Subject 'he' took HIS OWN coat → svoj. 'Njegov' would mean he took someone else's coat."},
    {wrong:"Ona voli njezin pas.",right:"Ona voli svojeg psa.",note:"She loves HER OWN dog → svojeg. 'Njezin' implies the dog belongs to someone else."},
    {wrong:"Idemo u naš stan.",right:"Idemo u svoj stan.",note:"We are going to OUR OWN apartment → svoj. 'Naš' could work too but 'svoj' is more natural."},
    {wrong:"Zaboravila sam moj ključ.",right:"Zaboravila sam svoj ključ.",note:"I forgot MY OWN key → svoj. 'Moj' here is technically wrong in standard Croatian."},
    {wrong:"Kupit će tvoj auto.",right:"Kupit će svoj auto.",note:"He will buy HIS OWN car → svoj. 'Tvoj' means he's buying YOUR car."},
    {wrong:"Pišeš li tvoj zadatak?",right:"Pišeš li svoj zadatak?",note:"Are you writing YOUR OWN homework? → svoj. 'Tvoj' is redundant when you're the subject."}
  ],
  forms:[
    {case:"Nominative",m:"svoj",f:"svoja",n:"svoje",pl:"svoji/svoje"},
    {case:"Genitive",m:"svojeg/svog",f:"svoje",n:"svojeg/svog",pl:"svojih"},
    {case:"Dative",m:"svojem/svom",f:"svojoj",n:"svojem/svom",pl:"svojim"},
    {case:"Accusative (animate)",m:"svojeg/svog",f:"svoju",n:"svoje",pl:"svoje/svoja"},
    {case:"Instrumental",m:"svojim",f:"svojom",n:"svojim",pl:"svojim"},
    {case:"Locative",m:"svojem/svom",f:"svojoj",n:"svojem/svom",pl:"svojim"}
  ],
  exceptions:[
    {text:"When the subject IS 'ja' and the sentence is simple present, both 'moj' and 'svoj' sound natural: 'Imam moj/svoj bicikl.'",icon:"💡"},
    {text:"In questions where the subject is unclear, 'moj/tvoj' may be used for clarity: 'Je li to tvoj ili njegov?'",icon:"💡"},
    {text:"After prepositions in set phrases: 'u svojoj koži' (in one's skin), 'biti svoj čovjek' (to be one's own person).",icon:"📌"}
  ],
  quiz:[
    {q:"She forgot _____ keys. (her own)",a:"svoje",opts:["njezine","svoje","moje"],note:"Subject 'she' → svoje"},
    {q:"He is washing _____ car. (his own)",a:"svoj",opts:["njegov","tvoj","svoj"],note:"Subject 'he' → svoj"},
    {q:"We love _____ city. (our own)",a:"svoj",opts:["naš","njihov","svoj"],note:"Subject 'we' → svoj"},
    {q:"Are you doing _____ homework? (your own)",a:"svoj",opts:["tvoj","njegov","svoj"],note:"Subject 'you' → svoj"},
    {q:"They packed _____ bags. (their own)",a:"svoje",opts:["njihove","naše","svoje"],note:"Subject 'they' → svoje"},
    {q:"I left _____ phone at home. (my own)",a:"svoj",opts:["moj","tvoj","svoj"],note:"Subject 'I' → svoj"}
  ]
};
// ═══ BASKETBALL PRACTICE ═══
const BASKETBALL = {
  title:"Na košarkaškom treningu",
  subtitle:"At Basketball Practice",
  intro:"These are the real phrases a Croatian basketball coach uses on the court. Master these and you'll understand every drill, every play call, every correction.",
  sections:[
    {title:"Osnove treninga",en:"Training Basics",icon:"📋",phrases:[
      {hr:"Zagrijavamo se!",en:"We're warming up!",note:"Start of every practice"},
      {hr:"Na linije!",en:"To the lines!",note:"Go to the baseline/lines"},
      {hr:"Trčite krug!",en:"Run a lap!",note:"Run around the court"},
      {hr:"Istezanje!",en:"Stretching!",note:"Time to stretch"},
      {hr:"Slobodna baca!",en:"Free throws!",note:"Free throw practice"},
      {hr:"Dribling!",en:"Dribbling!",note:"Dribbling drill"},
      {hr:"Šut na koš!",en:"Shoot at the basket!",note:"Shooting drill"},
      {hr:"Skok lopte!",en:"Jump ball!",note:"Tip-off / rebounding"},
      {hr:"Pauza! Svi ovdje!",en:"Break! Everyone here!",note:"Huddle up"},
      {hr:"Idemo!",en:"Let's go!",note:"Let's go / move it"}
    ]},
    {title:"Pozicije i igrači",en:"Positions & Players",icon:"🏀",phrases:[
      {hr:"plej (razigravač)",en:"point guard (PG)"},
      {hr:"bek (bačker/šuter)",en:"shooting guard (SG)"},
      {hr:"mali krilni igrač",en:"small forward (SF)"},
      {hr:"krilni centar",en:"power forward (PF)"},
      {hr:"centar",en:"center (C)"},
      {hr:"starter",en:"starter"},
      {hr:"zamjena / rezerva",en:"substitute / bench player"},
      {hr:"kapetan",en:"captain"},
      {hr:"napadač",en:"forward"},
      {hr:"branič",en:"defender"}
    ]},
    {title:"Napadačke naredbe",en:"Offensive Commands",icon:"⚡",phrases:[
      {hr:"Napad!",en:"Offense!",note:"Switch to attack"},
      {hr:"Probij!",en:"Drive to the basket!",note:"Drive in"},
      {hr:"Dodaj!",en:"Pass it!",note:"Pass the ball"},
      {hr:"Šutaj!",en:"Shoot!",note:"Take the shot"},
      {hr:"Postavi blok!",en:"Set a screen!",note:"Pick / screen"},
      {hr:"Izlazi na loptu!",en:"Come to the ball!",note:"Move toward the ball"},
      {hr:"Otvori se!",en:"Get open! / Space out!",note:"Find open space"},
      {hr:"Trokica!",en:"Three-pointer!",note:"Shoot from three"},
      {hr:"Polagan napad!",en:"Slow the offense!",note:"Slow it down"},
      {hr:"Brzi napad! Kontra!",en:"Fast break! Counter!",note:"Transition offense"}
    ]},
    {title:"Obrambene naredbe",en:"Defensive Commands",icon:"🛡️",phrases:[
      {hr:"Obrana!",en:"Defense!",note:"Switch to defense"},
      {hr:"Prati svog igrača!",en:"Mark your man!",note:"Man-to-man marking"},
      {hr:"Zona obrana!",en:"Zone defense!",note:"Switch to zone"},
      {hr:"Pritisak!",en:"Press!",note:"Full-court press"},
      {hr:"Blokiraj šut!",en:"Block the shot!",note:"Contest the shot"},
      {hr:"Uzmi skok!",en:"Get the rebound!",note:"Grab the board"},
      {hr:"Kradi loptu!",en:"Steal the ball!",note:"Go for the steal"},
      {hr:"Prati ruke!",en:"Watch the hands!",note:"Contest passing lanes"},
      {hr:"Fauliraš!",en:"You're fouling!",note:"You're committing a foul"},
      {hr:"Komunicirajte!",en:"Communicate!",note:"Talk on defense"}
    ]},
    {title:"Pohvale i ispravci",en:"Praise & Corrections",icon:"🗣️",phrases:[
      {hr:"Odlično! Bravo!",en:"Excellent! Well done!"},
      {hr:"Tako je! To je to!",en:"That's it! That's the one!"},
      {hr:"Još jednom!",en:"One more time!"},
      {hr:"Fokusiraj se!",en:"Focus!"},
      {hr:"Ne žuri!",en:"Don't rush!"},
      {hr:"Glava gore!",en:"Head up!",note:"Keep your head up when dribbling"},
      {hr:"Slušaj me!",en:"Listen to me!"},
      {hr:"Pogrešno! Ovako!",en:"Wrong! Like this!"},
      {hr:"Budi agresivniji!",en:"Be more aggressive!"},
      {hr:"Vjerujem u tebe!",en:"I believe in you!"}
    ]},
    {title:"Utakmica",en:"Game Situations",icon:"🏆",phrases:[
      {hr:"Igramo za pobjedu!",en:"We play to win!"},
      {hr:"Tajm-aut!",en:"Time out!"},
      {hr:"Izmjena!",en:"Substitution!"},
      {hr:"Izlazi! Ulazi!",en:"Come out! Go in!",note:"Sub off/on"},
      {hr:"Vodimo! Gubimo!",en:"We're winning! We're losing!"},
      {hr:"Još dvije minute!",en:"Two minutes left!"},
      {hr:"Faul! Osobna greška!",en:"Foul! Personal foul!"},
      {hr:"Koš vrijedi!",en:"Basket counts!"},
      {hr:"Kraj utakmice!",en:"End of game!"},
      {hr:"Pobijedili smo!",en:"We won!"}
    ]},
    {title:"Ključni košarkaški pojmovi",en:"Key Basketball Terms",icon:"📖",phrases:[
      {hr:"koš",en:"basket / shot made"},
      {hr:"lopta",en:"ball"},
      {hr:"teren / parket",en:"court"},
      {hr:"koš (obruč)",en:"hoop / rim"},
      {hr:"asistencija",en:"assist"},
      {hr:"skok (ofenzivni/defenzivni)",en:"rebound (offensive/defensive)"},
      {hr:"trica / trojka",en:"three-pointer"},
      {hr:"slobodno bacanje",en:"free throw"},
      {hr:"dodavanje",en:"passing"},
      {hr:"pogreška / prekršaj",en:"turnover / violation"},
      {hr:"poluvrijeme",en:"halftime"},
      {hr:"produžetak",en:"overtime"},
      {hr:"rezultat",en:"score"},
      {hr:"dvorana",en:"gym / hall"}
    ]}
  ]
};
// ═══ AT THE GYM ═══
const GYM = {
  title:"U teretani",
  subtitle:"At the Gym",
  intro:"Essential Croatian vocabulary for the gym — from equipment names to trainer instructions and tracking your workout.",
  sections:[
    {title:"Oprema",en:"Equipment",icon:"🏋️",phrases:[
      {hr:"bučica",en:"dumbbell"},
      {hr:"bučice (par)",en:"dumbbells (a pair)"},
      {hr:"šipka",en:"barbell"},
      {hr:"uteg",en:"weight plate"},
      {hr:"čučanj stalak",en:"squat rack"},
      {hr:"klupaica",en:"bench"},
      {hr:"kabel stroj",en:"cable machine"},
      {hr:"sprava",en:"machine"},
      {hr:"traka za trčanje",en:"treadmill"},
      {hr:"bicikl ergometar",en:"stationary bike"},
      {hr:"eliptičar",en:"elliptical"},
      {hr:"konop za preskakanje",en:"jump rope"},
      {hr:"vučna traka / band",en:"resistance band"},
      {hr:"lopta za vježbanje",en:"exercise ball / Swiss ball"},
      {hr:"stalak za bučice",en:"dumbbell rack"}
    ]},
    {title:"Vježbe",en:"Exercises",icon:"💪",phrases:[
      {hr:"čučanj",en:"squat"},
      {hr:"mrtvo dizanje",en:"deadlift"},
      {hr:"potisak s klupe",en:"bench press"},
      {hr:"veslanje",en:"rowing"},
      {hr:"zgib",en:"pull-up"},
      {hr:"dip",en:"dip"},
      {hr:"iskorak",en:"lunge"},
      {hr:"plank",en:"plank"},
      {hr:"skleka",en:"push-up"},
      {hr:"biceps pregib",en:"bicep curl"},
      {hr:"triceps ekstenzija",en:"tricep extension"},
      {hr:"potisak iznad glave",en:"overhead press"},
      {hr:"bočni odručivanje",en:"lateral raise"},
      {hr:"pretklon s utegom",en:"Romanian deadlift"},
      {hr:"trbušnjak",en:"crunch / sit-up"}
    ]},
    {title:"Dijelovi tijela",en:"Body Parts",icon:"🫀",phrases:[
      {hr:"prsa",en:"chest"},
      {hr:"leđa",en:"back"},
      {hr:"ramena",en:"shoulders"},
      {hr:"biceps",en:"biceps"},
      {hr:"triceps",en:"triceps"},
      {hr:"prednjača / quad",en:"quadriceps"},
      {hr:"stražnjača",en:"glutes / butt"},
      {hr:"hamstringi",en:"hamstrings"},
      {hr:"telad / listovi",en:"calves"},
      {hr:"trbuh",en:"abs / stomach"},
      {hr:"core",en:"core"},
      {hr:"podlaktica",en:"forearm"},
      {hr:"trapez",en:"traps"},
      {hr:"latissimus / lats",en:"lats (latissimus dorsi)"}
    ]},
    {title:"Trening fraze",en:"Training Phrases",icon:"📊",phrases:[
      {hr:"serija",en:"set"},
      {hr:"ponavljanje",en:"repetition / rep"},
      {hr:"pauza / odmor",en:"rest / break"},
      {hr:"zagrijavanje",en:"warm-up"},
      {hr:"hlađenje",en:"cool-down"},
      {hr:"maksimalna težina",en:"max weight / 1RM"},
      {hr:"lagano / srednje / teško",en:"light / medium / heavy"},
      {hr:"Koliko serija?",en:"How many sets?"},
      {hr:"Koliko ponavljanja?",en:"How many reps?"},
      {hr:"Koliko kilograma?",en:"How many kilograms?"},
      {hr:"Povećaj težinu!",en:"Increase the weight!"},
      {hr:"Smanji težinu!",en:"Lower the weight!"},
      {hr:"Radi sporije!",en:"Go slower!"},
      {hr:"Drži leđa ravno!",en:"Keep your back straight!"},
      {hr:"Dublje! Niže!",en:"Deeper! Lower!"}
    ]},
    {title:"Trener i savjeti",en:"Trainer & Advice",icon:"🗣️",phrases:[
      {hr:"Mogu li koristiti ovu spravu?",en:"Can I use this machine?"},
      {hr:"Možete li mi pomoći?",en:"Can you help me?"},
      {hr:"Pokaži mi kako se radi.",en:"Show me how it's done."},
      {hr:"Koliko trebam odmarati?",en:"How long should I rest?"},
      {hr:"Boli me _____.",en:"My _____ hurts."},
      {hr:"Trebam osigurač.",en:"I need a spotter."},
      {hr:"Jesi li slobodan?",en:"Are you free? / Is this taken?"},
      {hr:"Oslobodi spravu.",en:"Free up the machine."},
      {hr:"Vrati utege na mjesto.",en:"Put the weights back."},
      {hr:"Odlično! Još jedna serija!",en:"Great! One more set!"}
    ]},
    {title:"Fitness ciljevi",en:"Fitness Goals",icon:"🎯",phrases:[
      {hr:"Želim izgubiti kilograme.",en:"I want to lose weight."},
      {hr:"Želim dobiti mišiće.",en:"I want to build muscle."},
      {hr:"Trebam više snage.",en:"I need more strength."},
      {hr:"Radim na kardiu.",en:"I'm working on cardio."},
      {hr:"Idem u teretanu svaki dan.",en:"I go to the gym every day."},
      {hr:"Danas treniram noge.",en:"Today I'm training legs."},
      {hr:"Proteinski šejk",en:"Protein shake"},
      {hr:"Oporavljam se.",en:"I'm recovering."},
      {hr:"Dobio/la sam ozljedu.",en:"I got injured."},
      {hr:"Odmor dan",en:"Rest day"}
    ]}
  ]
};
// ═══ SCENE DESCRIPTION EXERCISES ═══
const SCENES = [
  {title:"U kuhinji",desc:"A family scene in the kitchen",qs:[
    {q:"Gdje su ljudi?",hint:"u",a:"kuhinji",en:"Where are the people? In the kitchen."},
    {q:"Što mama radi?",hint:"",a:"pere suđe",en:"What is mom doing? Washing dishes."},
    {q:"Što djeca rade?",hint:"",a:"igraju se",en:"What are the children doing? Playing."}
  ]},
  {title:"U parku",desc:"A sunny day at the park",qs:[
    {q:"Kakvo je vrijeme?",hint:"",a:"sunčano",en:"What's the weather like? Sunny."},
    {q:"Što dječak vozi?",hint:"",a:"bicikl",en:"What is the boy riding? A bicycle."},
    {q:"Gdje je pas?",hint:"u",a:"vodi",en:"Where is the dog? In the water."}
  ]},
  {title:"U školi",desc:"A classroom during a lesson",qs:[
    {q:"Tko stoji ispred ploče?",hint:"",a:"učiteljica",en:"Who stands in front of the board? The teacher."},
    {q:"Što djeca rade?",hint:"",a:"pišu",en:"What are the children doing? Writing."},
    {q:"Je li učionica velika ili mala?",hint:"",a:"velika",en:"Is the classroom big or small? Big."}
  ]},
  {title:"Na plaži",desc:"Summer vacation at the beach",qs:[
    {q:"Što radi djevojčica?",hint:"",a:"pliva",en:"What is the girl doing? Swimming."},
    {q:"Gdje je suncobran?",hint:"na",a:"pijesku",en:"Where is the umbrella? On the sand."},
    {q:"Je li more mirno ili nemirno?",hint:"",a:"mirno",en:"Is the sea calm or rough? Calm."}
  ]}
];
// ═══ FILL-IN STORIES ═══
const FILL_STORIES = [
  {title:"Markov dan",story:[
    {text:"Marko se probudio u _____ ujutro.",blank:"sedam",opts:["sedam","tri","ponoć"],en:"Marko woke up at seven in the morning."},
    {text:"Najprije se _____ i oprao zube.",blank:"otuširao",opts:["otuširao","najeo","zaigrao"],en:"First he showered and brushed his teeth."},
    {text:"Za doručak je pojeo _____ s džemom.",blank:"palačinke",opts:["palačinke","juhu","salatu"],en:"For breakfast he ate pancakes with jam."},
    {text:"Na posao je išao _____.",blank:"pješice",opts:["pješice","avionom","brodom"],en:"He went to work on foot."},
    {text:"Putem je kupio _____ za čitanje.",blank:"novine",opts:["novine","cipele","cvijeće"],en:"On the way he bought a newspaper to read."},
    {text:"Na poslu je primijetio da nema _____.",blank:"mobitel",opts:["mobitel","ručak","kapu"],en:"At work he noticed he didn't have his phone."}
  ]},
  {title:"Izlet na otok",story:[
    {text:"Obitelj je išla na izlet na _____ Hvar.",blank:"otok",opts:["otok","planinu","rijeku"],en:"The family went on a trip to the island of Hvar."},
    {text:"Bili su u _____.",blank:"hotelu",opts:["hotelu","šatoru","avionu"],en:"They were in a hotel."},
    {text:"Kuhar je otišao _____ u Split.",blank:"brodom",opts:["brodom","biciklom","pješice"],en:"The cook went by boat to Split."},
    {text:"Počeo je jako puhati _____.",blank:"vjetar",opts:["vjetar","snijeg","kiša"],en:"A strong wind started blowing."},
    {text:"_____ nije bio zatvoren.",blank:"Restoran",opts:["Restoran","Hotel","Otok"],en:"The restaurant was closed."},
    {text:"Tata je napravio _____ za večeru.",blank:"pizzu",opts:["pizzu","juhu","salatu"],en:"Dad made pizza for dinner."}
  ]},
  {title:"Kod zubara",story:[
    {text:"Mama je rekla djeci da moraju _____ zube.",blank:"prati",opts:["prati","bojiti","brojiti"],en:"Mom told the children they must brush their teeth."},
    {text:"Djeca su jako voljela _____ i bombone.",blank:"čokoladu",opts:["čokoladu","povrće","ribu"],en:"The children loved chocolate and candy."},
    {text:"Mama im je obećala _____.",blank:"poklon",opts:["poklon","kaznu","zadaću"],en:"Mom promised them a gift."},
    {text:"Zubar je rekao da su zubi _____.",blank:"zdravi",opts:["zdravi","bolesni","mali"],en:"The dentist said the teeth were healthy."},
    {text:"Poklon su bile nove _____ za zube.",blank:"četkice",opts:["četkice","paste","čokolade"],en:"The gift was new toothbrushes."},
    {text:"Djeca su bila jako _____.",blank:"razočarana",opts:["razočarana","sretna","umorna"],en:"The children were very disappointed."}
  ]}
,
  {title:"Dan na farmi",story:[
    {text:"Vjeverica _____ čita knjigu u parku.",blank:"ponekad",opts:["ponekad","nikad","kuha"],en:"The squirrel sometimes reads a book in the park."},
    {text:"Pas _____ trči u vrtu.",blank:"uvijek",opts:["uvijek","rijetko","spava"],en:"The dog always runs in the garden."},
    {text:"Mačka _____ spava na krevetu.",blank:"često",opts:["često","vozi","pjeva"],en:"The cat often sleeps on the bed."},
    {text:"Konj _____ trči po polju.",blank:"svaki dan",opts:["svaki dan","nikad","kuha"],en:"The horse runs through the field every day."},
    {text:"Krava _____ mlijeko.",blank:"daje",opts:["daje","pije","vozi"],en:"The cow gives milk."},
    {text:"Ptica _____ pjeva ujutro.",blank:"uvijek",opts:["uvijek","vozi","kuha"],en:"The bird always sings in the morning."}
  ]}];
// ═══ SHUFFLE HELPER ═══
var _shCache={};
function shMemo(key,arr,n){if(!_shCache[key])_shCache[key]=shuffleArr(arr);return n?_shCache[key].slice(0,n):_shCache[key]}
function shuffleArr(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
// ═══ PRONOUN CASES ═══
const PRONOUNCASE = {
  intro:"Croatian pronouns change form depending on the preposition. Learn the patterns!",
  table:[
    {nom:"ja",gen:"mene",dat:"meni",aku:"mene",inst:"mnom",lok:"meni"},
    {nom:"ti",gen:"tebe",dat:"tebi",aku:"tebe",inst:"tobom",lok:"tebi"},
    {nom:"on",gen:"njega",dat:"njemu",aku:"njega",inst:"njim",lok:"njemu"},
    {nom:"ona",gen:"nje",dat:"njoj",aku:"nju",inst:"njom",lok:"njoj"},
    {nom:"mi",gen:"nas",dat:"nama",aku:"nas",inst:"nama",lok:"nama"},
    {nom:"vi",gen:"vas",dat:"vama",aku:"vas",inst:"vama",lok:"vama"},
    {nom:"oni/one",gen:"njih",dat:"njima",aku:"njih",inst:"njima",lok:"njima"}
  ],
  quiz:[
    {q:"Ana ide u kino sa _____. (ja)",a:"mnom",opts:["mene","mnom","meni"]},
    {q:"Baka je ponosna na _____. (ti)",a:"tebe",opts:["tobom","tebi","tebe"]},
    {q:"Škola je daleko od _____. (ja)",a:"mene",opts:["mnom","mene","meni"]},
    {q:"Učiteljica priča o _____. (ti)",a:"tebi",opts:["tebe","tobom","tebi"]},
    {q:"Hoćeš li sa _____ na kavu? (ja)",a:"mnom",opts:["mnom","mene","meni"]},
    {q:"Otišli su na more bez _____. (ti)",a:"tebe",opts:["tebi","tebe","tobom"]},
    {q:"Sestra brine za _____. (ja)",a:"mene",opts:["mnom","meni","mene"]},
    {q:"Dođi do _____! (ja)",a:"mene",opts:["mnom","mene","meni"]},
    {q:"Luka se igra s _____. (ti)",a:"tobom",opts:["tebe","tebi","tobom"]},
    {q:"Baka je _____ skuhala ručak. (ja)",a:"meni",opts:["mene","mnom","meni"]},
    {q:"Pričamo o _____. (on)",a:"njemu",opts:["njega","njim","njemu"]},
    {q:"Idem s _____ na izlet. (ona)",a:"njom",opts:["nju","njoj","njom"]},
    {q:"Ovaj poklon je za _____. (vi)",a:"vas",opts:["vama","vas","vam"]},
    {q:"Stolica stoji blizu _____. (mi)",a:"nas",opts:["nama","nas","nam"]},
    {q:"Razgovaraju o _____. (oni)",a:"njima",opts:["njih","njima","njim"]}
  ]
};
// ═══ GENDER & PLURALS ═══
const GENDERDRILL = {
  sort:[
    {word:"knjiga",g:"f"},{word:"prijatelj",g:"m"},{word:"olovka",g:"f"},{word:"selo",g:"n"},{word:"more",g:"n"},{word:"stan",g:"m"},{word:"brat",g:"m"},{word:"jutro",g:"n"},{word:"učiteljica",g:"f"},{word:"sin",g:"m"},{word:"sunce",g:"n"},{word:"haljina",g:"f"},{word:"kamion",g:"m"},{word:"sladoled",g:"m"},{word:"vlak",g:"m"},{word:"sestra",g:"f"},{word:"jež",g:"m"},{word:"računalo",g:"n"},{word:"kuća",g:"f"},{word:"grad",g:"m"},{word:"mlijeko",g:"n"},{word:"stolica",g:"f"},{word:"stol",g:"m"},{word:"vrata",g:"n"},{word:"jabuka",g:"f"},{word:"pas",g:"m"},{word:"pismo",g:"n"},{word:"prozor",g:"m"},{word:"škola",g:"f"},{word:"dijete",g:"n"}
  ],
  plurals:[
    {s:"jabuka",p:"jabuke"},{s:"haljina",p:"haljine"},{s:"učiteljica",p:"učiteljice"},{s:"sestra",p:"sestre"},{s:"računalo",p:"računala"},{s:"selo",p:"sela"},{s:"sunce",p:"sunca"},{s:"more",p:"mora"},{s:"kamion",p:"kamioni"},{s:"sladoled",p:"sladoledi"},{s:"vlak",p:"vlakovi"},{s:"jež",p:"ježevi"},{s:"brat",p:"braća"},{s:"prijatelj",p:"prijatelji"},{s:"stan",p:"stanovi"},{s:"grad",p:"gradovi"},{s:"pas",p:"psi"},{s:"stol",p:"stolovi"},{s:"knjiga",p:"knjige"},{s:"olovka",p:"olovke"}
  ],
  adjectives:[
    {noun:"jagoda",adj:"crvena",en:"red strawberry",opts:["crveno","crven","crvena"]},
    {noun:"selo",adj:"tiho",en:"quiet village",opts:["tih","tiho","tiha"]},
    {noun:"sunce",adj:"žuto",en:"yellow sun",opts:["žute","žut","žuto"]},
    {noun:"kamion",adj:"velik",en:"big truck",opts:["veliko","velik","velika"]},
    {noun:"kuća",adj:"nova",en:"new house",opts:["nova","novo","nov"]},
    {noun:"more",adj:"plavo",en:"blue sea",opts:["plav","plava","plavo"]},
    {noun:"pas",adj:"mali",en:"small dog",opts:["mali","mala","malo"]},
    {noun:"škola",adj:"stara",en:"old school",opts:["stari","staro","stara"]},
    {noun:"dijete",adj:"malo",en:"small child",opts:["malo","mali","mala"]},
    {noun:"grad",adj:"lijep",en:"beautiful city",opts:["lijep","lijepa","lijepo"]}
  ]
};
// ═══ SENTENCE BUILDER ═══
const SENTBUILD = [
  {en:"I am hungry.",hr:"Ja sam gladan.",opts:["Ja sam gladan.","Ja sam gladna.","Ja si gladan."]},
  {en:"I am happy.",hr:"Ja sam sretan.",opts:["Ja sam sretan.","Ja sam sretna.","Ja si sretan."]},
  {en:"Thank you!",hr:"Hvala!",opts:["Hvala!","Molim!","Oprosti!"]},
  {en:"Please!",hr:"Molim!",opts:["Molim!","Hvala!","Oprosti!"]},
  {en:"Sorry!",hr:"Oprosti!",opts:["Oprosti!","Hvala!","Molim!"]},
  {en:"I am sad.",hr:"Tužan sam.",opts:["Tužan sam.","Tužna sam.","Tužno sam."]},
  {en:"This is a red apple.",hr:"Ovo je crvena jabuka.",opts:["Ovo je crvena jabuka.","Ovo je crven jabuka.","Ovo je crveno jabuka."]},
  {en:"Salad is healthy.",hr:"Salata je zdrava.",opts:["Salata je zdrava.","Salata je zdrav.","Salata je zdravo."]},
  {en:"I don't drink juice.",hr:"Ne pijem sok.",opts:["Ne pijem sok.","Ne pijem soka.","Ja ne piti sok."]},
  {en:"I am thirsty.",hr:"Žedan sam.",opts:["Žedan sam.","Žedna sam.","Žedno sam."]},
  {en:"I want orange juice.",hr:"Želim sok od naranče.",opts:["Želim sok od naranče.","Želim naranča sok.","Hoću sok naranča."]},
  {en:"She eats meat.",hr:"Ona jede meso.",opts:["Ona jede meso.","Ona jesti meso.","Ona jedem meso."]},
  {en:"My eyes are blue.",hr:"Moje oči su plave.",opts:["Moje oči su plave.","Moji oči su plavi.","Moja oči su plavo."]},
  {en:"I like to read.",hr:"Volim čitati.",opts:["Volim čitati.","Volim čitat.","Ja voli čitati."]},
  {en:"I don't eat meat.",hr:"Ne jedem meso.",opts:["Ne jedem meso.","Ne jesti meso.","Ja ne jede meso."]},
  {en:"Fish is swimming.",hr:"Riba pliva.",opts:["Riba pliva.","Riba plivaju.","Riba plivam."]},
  {en:"We are running.",hr:"Mi trčimo.",opts:["Mi trčimo.","Mi trčite.","Mi trčim."]},
  {en:"Dogs are sleeping.",hr:"Psi spavaju.",opts:["Psi spavaju.","Psi spava.","Psi spavamo."]},
  {en:"Bird is flying.",hr:"Ptica leti.",opts:["Ptica leti.","Ptica letim.","Ptica lete."]},
  {en:"My window is small.",hr:"Moj prozor je mali.",opts:["Moj prozor je mali.","Moja prozor je mala.","Moje prozor je malo."]},
  {en:"Sea is blue.",hr:"More je plavo.",opts:["More je plavo.","More je plav.","More je plava."]},
  {en:"I love to sleep.",hr:"Volim spavati.",opts:["Volim spavati.","Ja voli spavati.","Volim spavam."]},
  {en:"Sky is blue.",hr:"Nebo je plavo.",opts:["Nebo je plavo.","Nebo je plav.","Nebo je plava."]},
  {en:"I need coffee.",hr:"Trebam kavu.",opts:["Trebam kavu.","Trebam kava.","Treba kavu."]},
  {en:"I must drink water.",hr:"Moram piti vodu.",opts:["Moram piti vodu.","Moram pijem vodu.","Mora piti vodu."]},
  {en:"My dog is sad.",hr:"Moj pas je tužan.",opts:["Moj pas je tužan.","Moja pas je tužna.","Moje pas je tužno."]},
  {en:"This table is white.",hr:"Ovaj stol je bijeli.",opts:["Ovaj stol je bijeli.","Ova stol je bijela.","Ovo stol je bijelo."]},
  {en:"I am reading.",hr:"Ja čitam.",opts:["Ja čitam.","Ja čitaš.","Ja čita."]},
  {en:"He is reading.",hr:"On čita.",opts:["On čita.","On čitam.","On čitaju."]},
  {en:"We are reading.",hr:"Mi čitamo.",opts:["Mi čitamo.","Mi čitate.","Mi čitam."]}
,
  {en:"The cat often sleeps.",hr:"Mačka često spava.",opts:["Mačka često spava.","Mačka često spavam.","Mačka često spavaju."]},
  {en:"The dog always runs.",hr:"Pas uvijek trči.",opts:["Pas uvijek trči.","Pas uvijek trčim.","Pas uvijek trče."]},
  {en:"The squirrel never drives.",hr:"Vjeverica nikad ne vozi.",opts:["Vjeverica nikad ne vozi.","Vjeverica nikad ne vozim.","Vjeverica nikad ne voze."]},
  {en:"We sometimes cook.",hr:"Mi ponekad kuhamo.",opts:["Mi ponekad kuhamo.","Mi ponekad kuham.","Mi ponekad kuhaju."]},
  {en:"They rarely read.",hr:"Oni rijetko čitaju.",opts:["Oni rijetko čitaju.","Oni rijetko čitam.","Oni rijetko čita."]},
  {en:"She usually sings.",hr:"Ona obično pjeva.",opts:["Ona obično pjeva.","Ona obično pjevam.","Ona obično pjevaju."]},
  {en:"I drink coffee every day.",hr:"Pijem kavu svaki dan.",opts:["Pijem kavu svaki dan.","Pijem kava svaki dan.","Pijem kave svaki dan."]},
  {en:"He never swims.",hr:"On nikad ne pliva.",opts:["On nikad ne pliva.","On nikad ne plivam.","On nikad ne plivaju."]},
  {en:"You often study.",hr:"Ti često učiš.",opts:["Ti često učiš.","Ti često učim.","Ti često uči."]},
  {en:"They live in Zagreb.",hr:"Oni žive u Zagrebu.",opts:["Oni žive u Zagrebu.","Oni živim u Zagrebu.","Oni živi u Zagrebu."]},
  {en:"The bear loves honey.",hr:"Medvjed voli med.",opts:["Medvjed voli med.","Medvjed volim med.","Medvjed vole med."]},
  {en:"The fox sometimes eats.",hr:"Lisica ponekad jede.",opts:["Lisica ponekad jede.","Lisica ponekad jedem.","Lisica ponekad jedu."]}];
// ═══ VERB CONJUGATION DRILL ═══
const VERBDRILL = [
  {inf:"raditi",en:"to work",forms:["radim","radiš","radi","radimo","radite","rade"]},
  {inf:"piti",en:"to drink",forms:["pijem","piješ","pije","pijemo","pijete","piju"]},
  {inf:"jesti",en:"to eat",forms:["jedem","jedeš","jede","jedemo","jedete","jedu"]},
  {inf:"hodati",en:"to walk",forms:["hodam","hodaš","hoda","hodamo","hodate","hodaju"]},
  {inf:"učiti",en:"to learn",forms:["učim","učiš","uči","učimo","učite","uče"]},
  {inf:"voljeti",en:"to love",forms:["volim","voliš","voli","volimo","volite","vole"]},
  {inf:"trebati",en:"to need",forms:["trebam","trebaš","treba","trebamo","trebate","trebaju"]},
  {inf:"plivati",en:"to swim",forms:["plivam","plivaš","pliva","plivamo","plivate","plivaju"]},
  {inf:"trčati",en:"to run",forms:["trčim","trčiš","trči","trčimo","trčite","trče"]},
  {inf:"spavati",en:"to sleep",forms:["spavam","spavaš","spava","spavamo","spavate","spavaju"]},
  {inf:"letjeti",en:"to fly",forms:["letim","letiš","leti","letimo","letite","lete"]},
  {inf:"pisati",en:"to write",forms:["pišem","pišeš","piše","pišemo","pišete","pišu"]},
  {inf:"imati",en:"to have",forms:["imam","imaš","ima","imamo","imate","imaju"]},
  {inf:"živjeti",en:"to live",forms:["živim","živiš","živi","živimo","živite","žive"]},
  {inf:"voziti",en:"to drive",forms:["vozim","voziš","vozi","vozimo","vozite","voze"]},
  {inf:"kuhati",en:"to cook",forms:["kuham","kuhaš","kuha","kuhamo","kuhate","kuhaju"]},
  {inf:"pjevati",en:"to sing",forms:["pjevam","pjevaš","pjeva","pjevamo","pjevate","pjevaju"]},
  {inf:"čitati",en:"to read",forms:["čitam","čitaš","čita","čitamo","čitate","čitaju"]},
  {inf:"slušati",en:"to listen",forms:["slušam","slušaš","sluša","slušamo","slušate","slušaju"]},
  {inf:"gledati",en:"to watch",forms:["gledam","gledaš","gleda","gledamo","gledate","gledaju"]}
];
const VBPERSONS = ["ja","ti","on/ona","mi","vi","oni/one"];
// ═══ TENSE TRANSFORMER ═══
const TENSEFLIP = [
  {prez:"Učim cijeli dan.",perf:"Učila sam cijeli dan.",neg:"Nisam učila cijeli dan."},
  {prez:"Trčim svako jutro.",perf:"Trčala sam svako jutro.",neg:"Nisam trčala svako jutro."},
  {prez:"Čitam knjigu.",perf:"Čitala sam knjigu.",neg:"Nisam čitala knjigu."},
  {prez:"Spavam do 10 sati.",perf:"Spavala sam do 10 sati.",neg:"Nisam spavala do 10 sati."},
  {prez:"Kuham ručak.",perf:"Kuhala sam ručak.",neg:"Nisam kuhala ručak."},
  {prez:"Gledam TV.",perf:"Gledala sam TV.",neg:"Nisam gledala TV."},
  {prez:"Pišem e-mail.",perf:"Pisala sam e-mail.",neg:"Nisam pisala e-mail."},
  {prez:"Plešem svaku večer.",perf:"Plesala sam svaku večer.",neg:"Nisam plesala svaku večer."},
  {prez:"Idem u školu.",perf:"Išla sam u školu.",neg:"Nisam išla u školu."},
  {prez:"Pijem kavu.",perf:"Pila sam kavu.",neg:"Nisam pila kavu."},
  {prez:"Vozim auto.",perf:"Vozila sam auto.",neg:"Nisam vozila auto."},
  {prez:"Pjevam pjesmu.",perf:"Pjevala sam pjesmu.",neg:"Nisam pjevala pjesmu."},
  {prez:"Slušam glazbu.",perf:"Slušala sam glazbu.",neg:"Nisam slušala glazbu."},
  {prez:"Jedem salatu.",perf:"Jela sam salatu.",neg:"Nisam jela salatu."},
  {prez:"Učim hrvatski.",perf:"Učila sam hrvatski.",neg:"Nisam učila hrvatski."}
,
  {prez:"Čitam knjigu.",perf:"Čitao sam knjigu.",neg:"Nisam čitao knjigu."},
  {prez:"Kuham ručak.",perf:"Kuhao sam ručak.",neg:"Nisam kuhao ručak."},
  {prez:"Pjevam pjesmu.",perf:"Pjevao sam pjesmu.",neg:"Nisam pjevao pjesmu."},
  {prez:"Jedem sladoled.",perf:"Jeo sam sladoled.",neg:"Nisam jeo sladoled."},
  {prez:"Plivam u bazenu.",perf:"Plivao sam u bazenu.",neg:"Nisam plivao u bazenu."},
  {prez:"Igram nogomet.",perf:"Igrao sam nogomet.",neg:"Nisam igrao nogomet."},
  {prez:"Pijem kavu.",perf:"Pio sam kavu.",neg:"Nisam pio kavu."},
  {prez:"Trčim u parku.",perf:"Trčao sam u parku.",neg:"Nisam trčao u parku."},
  {prez:"Sviram violinu.",perf:"Svirao sam violinu.",neg:"Nisam svirao violinu."},
  {prez:"Vozim auto.",perf:"Vozio sam auto.",neg:"Nisam vozio auto."}];
// ═══ RIDDLES ═══
const RIDDLES = [
  {clue:"Imam četiri noge, ali ne mogu hodati. Ljudi sjede na meni.",answer:"stolica",en:"chair",opts:["stolica","stol","krevet","pod"]},
  {clue:"Zimi sam bijel, ali u proljeće se topim. Djeca me vole praviti.",answer:"snjegović",en:"snowman",opts:["snjegović","oblak","led","snijeg"]},
  {clue:"Imam krila ali nisam ptica. Letim noću i spavam danju.",answer:"šišmiš",en:"bat",opts:["šišmiš","sova","leptir","orao"]},
  {clue:"Svako jutro izlazim, a navečer se sakrijem. Dajem svijetlo i toplinu.",answer:"sunce",en:"sun",opts:["sunce","mjesec","zvijezda","lampa"]},
  {clue:"Živim u vodi. Imam peraje ali nemam noge. Ljudi me love.",answer:"riba",en:"fish",opts:["riba","žaba","patka","rak"]},
  {clue:"Imam tisuću listova ali nisam drvo. Ljudi me čitaju.",answer:"knjiga",en:"book",opts:["knjiga","novine","cvijet","kalendar"]},
  {clue:"Nosim tešku kuću na leđima. Jako sam spor.",answer:"puž",en:"snail",opts:["puž","kornjača","jež","rak"]},
  {clue:"Glasno zvonim ujutro. Budim ljude koji spavaju.",answer:"budilica",en:"alarm clock",opts:["budilica","telefon","zvono","radio"]},
  {clue:"Imam ključ ali ne otključavam vrata. Ljudi me sviraju.",answer:"klavir",en:"piano",opts:["klavir","gitara","violina","flauta"]},
  {clue:"Živim u šumi. Volim med. Zimi jako dugo spavam.",answer:"medvjed",en:"bear",opts:["medvjed","vuk","lisica","jež"]},
  {clue:"Živim u vodi i na kopnu. Zelena sam i glasno pjevam navečer.",answer:"žaba",en:"frog",opts:["žaba","kornjača","gušter","zmija"]},
  {clue:"Imam rep i četiri noge. Lajam kad netko dođe na vrata.",answer:"pas",en:"dog",opts:["pas","mačka","vuk","lisica"]}
];
// ═══ LOGIC QUIZ (Pitalica style) ═══
const LOGICQUIZ = [
  {q:"Na plaži trebaš:",right:["ručnik","kupaći"],wrong:["jaknu","čizme"]},
  {q:"Za doručak pijem:",right:["kavu","sok"],wrong:["juhu","vino"]},
  {q:"Zimi nosim:",right:["kaput","rukavice"],wrong:["kupaći","sandale"]},
  {q:"U školu nosim:",right:["ruksak","olovku"],wrong:["lonac","jastuk"]},
  {q:"Kad pada kiša uzimam:",right:["kišobran","čizme"],wrong:["sunčane naočale","kupaći"]},
  {q:"U kuhinji koristim:",right:["lonac","nož"],wrong:["jastuk","ručnik"]},
  {q:"Na nogometu trebaš:",right:["loptu","tenisice"],wrong:["kravatu","kišobran"]},
  {q:"Kad sam bolestan idem:",right:["liječniku"],wrong:["u kino","na plažu","u restoran"]},
  {q:"Za Božić ukrašavamo:",right:["bor","kuću"],wrong:["auto","ruksak"]},
  {q:"Ujutro najprije:",right:["perem zube","oblačim se"],wrong:["idem spavati","gledam TV"]},
  {q:"U supermarketu kupujem:",right:["kruh","mlijeko"],wrong:["krevet","prozor"]},
  {q:"Kad je vruće želim:",right:["sladoled","plivati"],wrong:["kaput","čaj"]}
];
// ═══ ORDINAL NUMBERS ═══
const ORDINALS = [
  {num:1,hr:"prvi",en:"first",loc:"prvom"},{num:2,hr:"drugi",en:"second",loc:"drugom"},{num:3,hr:"treći",en:"third",loc:"trećem"},{num:4,hr:"četvrti",en:"fourth",loc:"četvrtom"},{num:5,hr:"peti",en:"fifth",loc:"petom"},{num:6,hr:"šesti",en:"sixth",loc:"šestom"},{num:7,hr:"sedmi",en:"seventh",loc:"sedmom"},{num:8,hr:"osmi",en:"eighth",loc:"osmom"},{num:9,hr:"deveti",en:"ninth",loc:"devetom"},{num:10,hr:"deseti",en:"tenth",loc:"desetom"},{num:11,hr:"jedanaesti",en:"eleventh",loc:"jedanaestom"},{num:12,hr:"dvanaesti",en:"twelfth",loc:"dvanaestom"},{num:13,hr:"trinaesti",en:"thirteenth",loc:"trinaestom"},{num:14,hr:"četrnaesti",en:"fourteenth",loc:"četrnaestom"},{num:15,hr:"petnaesti",en:"fifteenth",loc:"petnaestom"}
];
const ORDQUIZ = [
  {q:"Marko živi na _____ katu. (1st)",a:"prvom",opts:["prvom","prvi","prvog"]},
  {q:"Goran živi na _____ katu. (14th)",a:"četrnaestom",opts:["četrnaestom","četrnaesti","četrnaestog"]},
  {q:"Tamara živi na _____ katu. (9th)",a:"devetom",opts:["devetom","deveti","devetog"]},
  {q:"Petar živi na _____ katu. (15th)",a:"petnaestom",opts:["petnaestom","petnaesti","petnaestog"]},
  {q:"Obitelj Horvat živi na _____ katu. (2nd)",a:"drugom",opts:["drugom","drugi","drugog"]},
  {q:"Domagoj živi na _____ katu. (5th)",a:"petom",opts:["petom","peti","petog"]},
  {q:"Krešimir živi na _____ katu. (6th)",a:"šestom",opts:["šestom","šesti","šestog"]},
  {q:"Tomislav živi na _____ katu. (11th)",a:"jedanaestom",opts:["jedanaestom","jedanaesti","jedanaestog"]}
];
// ═══ RELATIVE PRONOUNS ═══
const RELPRON = {
  intro:"koji (m), koja (f), koje (n) = which/that/who. Changes by case and gender.",
  table:{m:{nom:"koji",gen:"kojeg",dat:"kojem",aku:"koji/kojeg",lok:"kojem"},f:{nom:"koja",gen:"koje",dat:"kojoj",aku:"koju",lok:"kojoj"},n:{nom:"koje",gen:"kojeg",dat:"kojem",aku:"koje",lok:"kojem"}},
  quiz:[
    {q:"Ovo je auto _____ je parkiran u garaži. (m, NOM)",a:"koji",opts:["koji","kojeg","kojem"]},
    {q:"Ovo je pas _____ želim kupiti. (m, AKU animate)",a:"kojeg",opts:["koji","kojeg","kojem"]},
    {q:"To je ruksak bez _____ ne idem u školu. (m, GEN)",a:"kojeg",opts:["koji","kojeg","kojem"]},
    {q:"To je crtić o _____ pričam. (m, LOK)",a:"kojem",opts:["koji","kojeg","kojem"]},
    {q:"Ovo je kuća _____ je velika. (f, NOM)",a:"koja",opts:["koja","koje","koju"]},
    {q:"To je knjiga _____ čitam. (f, AKU)",a:"koju",opts:["koja","koju","kojoj"]},
    {q:"To je škola o _____ pričam. (f, LOK)",a:"kojoj",opts:["koja","koju","kojoj"]},
    {q:"Ovo je dijete _____ plače. (n, NOM)",a:"koje",opts:["koji","koja","koje"]},
    {q:"Ovo je selo _____ je lijepo. (n, NOM)",a:"koje",opts:["koji","koja","koje"]},
    {q:"To je more o _____ sanjam. (n, LOK)",a:"kojem",opts:["koji","kojoj","kojem"]}
  ]
};
// ═══ EMOTION GENDER DRILL ═══
const EMOGENDER = [
  {subj:"Ja sam danas...",gender:"m",pairs:[{m:"sretan",f:"sretna"},{m:"tužan",f:"tužna"},{m:"ljut",f:"ljuta"},{m:"veseo",f:"vesela"},{m:"zabrinut",f:"zabrinuta"},{m:"uplašen",f:"uplašena"},{m:"umoran",f:"umorna"}]},
  {subj:"Mama je danas...",gender:"f",pairs:[{m:"sretan",f:"sretna"},{m:"tužan",f:"tužna"},{m:"ljut",f:"ljuta"},{m:"veseo",f:"vesela"},{m:"zabrinut",f:"zabrinuta"},{m:"uplašen",f:"uplašena"},{m:"umoran",f:"umorna"}]},
  {subj:"Tata je danas...",gender:"m",pairs:[{m:"sretan",f:"sretna"},{m:"tužan",f:"tužna"},{m:"ljut",f:"ljuta"},{m:"veseo",f:"vesela"},{m:"zabrinut",f:"zabrinuta"},{m:"uplašen",f:"uplašena"},{m:"umoran",f:"umorna"}]}
];
// ═══ QUESTION WORDS DRILL ═══
const QWORDS = [
  {q:"_____ si ti?",en:"Who are you?",a:"Tko",opts:["Tko","Što","Gdje"]},
  {q:"_____ radiš sada?",en:"What are you doing?",a:"Što",opts:["Tko","Što","Kad"]},
  {q:"_____ živiš?",en:"Where do you live?",a:"Gdje",opts:["Gdje","Kad","Kako"]},
  {q:"_____ učiš hrvatski?",en:"When do you study Croatian?",a:"Kad",opts:["Kad","Kako","Gdje"]},
  {q:"_____ imaš godina?",en:"How old are you?",a:"Koliko",opts:["Koliko","Kako","Koji"]},
  {q:"_____ si danas?",en:"How are you today?",a:"Kako",opts:["Kako","Kad","Tko"]},
  {q:"_____ učiš hrvatski?",en:"Why do you study Croatian?",a:"Zašto",opts:["Zašto","Kako","Kad"]},
  {q:"_____ je ovo?",en:"Whose is this?",a:"Čiji",opts:["Čiji","Koji","Kakav"]},
  {q:"_____ je pas?",en:"What kind of dog? (m)",a:"Kakav",opts:["Kakav","Kakva","Kakvo"]},
  {q:"_____ je kuća?",en:"What kind of house? (f)",a:"Kakva",opts:["Kakav","Kakva","Kakvo"]},
  {q:"_____ je selo?",en:"What kind of village? (n)",a:"Kakvo",opts:["Kakav","Kakva","Kakvo"]},
  {q:"_____ ideš?",en:"Where are you going?",a:"Kamo",opts:["Kamo","Gdje","Odakle"]}
];
// ═══ NEGATION DRILL ═══
const NEGATION = [
  {pos:"Kuham ručak.",neg:"Ne kuham ručak.",en:"I cook lunch. / I don't cook lunch."},
  {pos:"Idem u park.",neg:"Ne idem u park.",en:"I go to the park. / I don't go to the park."},
  {pos:"Pijem čaj.",neg:"Ne pijem čaj.",en:"I drink tea. / I don't drink tea."},
  {pos:"Učim hrvatski.",neg:"Ne učim hrvatski.",en:"I study Croatian. / I don't study Croatian."},
  {pos:"Vozim bicikl.",neg:"Ne vozim bicikl.",en:"I ride a bike. / I don't ride a bike."},
  {pos:"Pišem zadaću.",neg:"Ne pišem zadaću.",en:"I write homework. / I don't write homework."},
  {pos:"Gledam TV.",neg:"Ne gledam TV.",en:"I watch TV. / I don't watch TV."},
  {pos:"Idem u grad.",neg:"Ne idem u grad.",en:"I go to town. / I don't go to town."},
  {pos:"Mama radi.",neg:"Mama ne radi.",en:"Mom works. / Mom doesn't work."},
  {pos:"Tata vozi.",neg:"Tata ne vozi.",en:"Dad drives. / Dad doesn't drive."},
  {pos:"Sestra spava.",neg:"Sestra ne spava.",en:"Sister sleeps. / Sister doesn't sleep."},
  {pos:"Mama posprema stan.",neg:"Mama ne posprema stan.",en:"Mom tidies the apartment. / Mom doesn't tidy."},
  {pos:"Igram nogomet.",neg:"Ne igram nogomet.",en:"I play football. / I don't play football."},
  {pos:"Imam psa.",neg:"Nemam psa.",en:"I have a dog. / I don't have a dog."},
  {pos:"Imam auto.",neg:"Nemam auto.",en:"I have a car. / I don't have a car."}
];
// ═══ COLOR AGREEMENT ═══
const COLORAGREE = {
  colors:[
    {m:"crven",f:"crvena",n:"crveno",mpl:"crveni",fpl:"crvene",npl:"crvena",en:"red"},
    {m:"žut",f:"žuta",n:"žuto",mpl:"žuti",fpl:"žute",npl:"žuta",en:"yellow"},
    {m:"plav",f:"plava",n:"plavo",mpl:"plavi",fpl:"plave",npl:"plava",en:"blue"},
    {m:"zelen",f:"zelena",n:"zeleno",mpl:"zeleni",fpl:"zelene",npl:"zelena",en:"green"},
    {m:"crn",f:"crna",n:"crno",mpl:"crni",fpl:"crne",npl:"crna",en:"black"},
    {m:"bijel",f:"bijela",n:"bijelo",mpl:"bijeli",fpl:"bijele",npl:"bijela",en:"white"},
    {m:"smeđ",f:"smeđa",n:"smeđe",mpl:"smeđi",fpl:"smeđe",npl:"smeđa",en:"brown"},
    {m:"siv",f:"siva",n:"sivo",mpl:"sivi",fpl:"sive",npl:"siva",en:"grey"},
    {m:"narančast",f:"narančasta",n:"narančasto",mpl:"narančasti",fpl:"narančaste",npl:"narančasta",en:"orange"},
    {m:"ljubičast",f:"ljubičasta",n:"ljubičasto",mpl:"ljubičasti",fpl:"ljubičaste",npl:"ljubičasta",en:"purple"},
    {m:"roz",f:"roza",n:"rozo",mpl:"rozi",fpl:"roze",npl:"roza",en:"pink"}
  ],
  singQuiz:[
    {noun:"Knjiga",g:"f",en:"book",color:"crvena",opts:["crven","crvena","crveno"]},
    {noun:"Sunce",g:"n",en:"sun",color:"žuto",opts:["žut","žuta","žuto"]},
    {noun:"Grad",g:"m",en:"city",color:"siv",opts:["siv","siva","sivo"]},
    {noun:"Žaba",g:"f",en:"frog",color:"zelena",opts:["zelen","zelena","zeleno"]},
    {noun:"More",g:"n",en:"sea",color:"plavo",opts:["plav","plava","plavo"]},
    {noun:"Sat",g:"m",en:"clock",color:"crn",opts:["crn","crna","crno"]},
    {noun:"Mačka",g:"f",en:"cat",color:"smeđa",opts:["smeđ","smeđa","smeđe"]},
    {noun:"Računalo",g:"n",en:"computer",color:"bijelo",opts:["bijel","bijela","bijelo"]},
    {noun:"Cvijet",g:"m",en:"flower",color:"žut",opts:["žut","žuta","žuto"]},
    {noun:"Ruža",g:"f",en:"rose",color:"crvena",opts:["crven","crvena","crveno"]}
  ],
  plurQuiz:[
    {noun:"Knjige",g:"f",en:"books",color:"crvene",opts:["crveni","crvene","crvena"]},
    {noun:"Sunca",g:"n",en:"suns",color:"žuta",opts:["žuti","žute","žuta"]},
    {noun:"Gradovi",g:"m",en:"cities",color:"sivi",opts:["sivi","sive","siva"]},
    {noun:"Žabe",g:"f",en:"frogs",color:"zelene",opts:["zeleni","zelene","zelena"]},
    {noun:"Računala",g:"n",en:"computers",color:"bijela",opts:["bijeli","bijele","bijela"]},
    {noun:"Satovi",g:"m",en:"clocks",color:"crni",opts:["crni","crne","crna"]},
    {noun:"Mačke",g:"f",en:"cats",color:"smeđe",opts:["smeđi","smeđe","smeđa"]},
    {noun:"Cvjetovi",g:"m",en:"flowers",color:"žuti",opts:["žuti","žute","žuta"]}
  ]
};
// ═══ SIBILARIZACIJA ═══
const SIBIL = {
  intro:"Before -i in locative plural, k→c, g→z, h→s. This is called sibilarizacija.",
  examples:[
    {nom:"slika",lok:"na slici",rule:"k→c"},{nom:"noga",lok:"na nozi",rule:"g→z"},{nom:"majka",lok:"prema majci",rule:"k→c"},{nom:"bajka",lok:"u bajci",rule:"k→c"},{nom:"Rijeka",lok:"u Rijeci",rule:"k→c"},{nom:"knjiga",lok:"u knjizi",rule:"g→z"},{nom:"ruka",lok:"na ruci",rule:"k→c"},{nom:"juha",lok:"u juhi",rule:"h stays"}
  ],
  quiz:[
    {q:"Pričam o _____. (slika)",a:"slici",opts:["slici","sliki","slikai"]},
    {q:"Flaster je na _____. (noga)",a:"nozi",opts:["nozi","nogi","nogai"]},
    {q:"Kuća je na _____. (slika)",a:"slici",opts:["slici","sliki","slikai"]},
    {q:"Idem prema _____. (majka)",a:"majci",opts:["majci","majki","majkai"]},
    {q:"To je kao u _____. (bajka)",a:"bajci",opts:["bajci","bajki","bajkai"]},
    {q:"On živi u _____. (Rijeka)",a:"Rijeci",opts:["Rijeci","Rijeki","Rijeku"]},
    {q:"Pričam o _____. (knjiga)",a:"knjizi",opts:["knjizi","knjigi","knjigai"]},
    {q:"Prsten je na _____. (ruka)",a:"ruci",opts:["ruci","ruki","rukai"]}
  ]
};
// ═══ PROFESSION GENDER PAIRS ═══
const PROFGENDER = [
  {m:"učitelj",f:"učiteljica",en:"teacher"},{m:"policajac",f:"policajka",en:"police officer"},{m:"medicinski brat",f:"medicinska sestra",en:"nurse"},{m:"poštar",f:"poštarka",en:"postman"},{m:"prodavač",f:"prodavačica",en:"salesperson"},{m:"odvjetnik",f:"odvjetnica",en:"lawyer"},{m:"novinar",f:"novinarka",en:"journalist"},{m:"frizer",f:"frizerka",en:"hairdresser"},{m:"kuhar",f:"kuharica",en:"cook"},{m:"konobar",f:"konobarica",en:"waiter"},{m:"liječnik",f:"liječnica",en:"doctor"},{m:"vozač",f:"vozačica",en:"driver"},{m:"pilot",f:"pilotkinja",en:"pilot"},{m:"glumac",f:"glumica",en:"actor"},{m:"sportaš",f:"sportašica",en:"athlete"}
];
// ═══ COMPARATIVES & SUPERLATIVES ═══
const COMPARE = [
  {base:"lijep",comp:"ljepši",super:"najljepši",en:"beautiful"},
  {base:"velik",comp:"veći",super:"najveći",en:"big"},
  {base:"malen",comp:"manji",super:"najmanji",en:"small"},
  {base:"dobar",comp:"bolji",super:"najbolji",en:"good"},
  {base:"loš",comp:"gori",super:"najgori",en:"bad"},
  {base:"brz",comp:"brži",super:"najbrži",en:"fast"},
  {base:"spor",comp:"sporiji",super:"najsporiji",en:"slow"},
  {base:"mlad",comp:"mlađi",super:"najmlađi",en:"young"},
  {base:"star",comp:"stariji",super:"najstariji",en:"old"},
  {base:"jak",comp:"jači",super:"najjači",en:"strong"},
  {base:"slab",comp:"slabiji",super:"najslabiji",en:"weak"},
  {base:"skup",comp:"skuplji",super:"najskuplji",en:"expensive"},
  {base:"jeftin",comp:"jeftiniji",super:"najjeftiniji",en:"cheap"},
  {base:"pametan",comp:"pametniji",super:"najpametniji",en:"smart"},
  {base:"glup",comp:"gluplji",super:"najgluplji",en:"stupid"}
];
const COMPQUIZ = [
  {q:"Zagreb je _____ od Labina. (big)",a:"veći",opts:["veći","velik","najveći"]},
  {q:"Sladoled je _____ od juhe. (good)",a:"bolji",opts:["dobar","bolji","najbolji"]},
  {q:"Puž je _____ od konja. (slow)",a:"sporiji",opts:["spor","sporiji","najsporiji"]},
  {q:"Baka peče _____ kolače! (best)",a:"najbolje",opts:["dobre","bolje","najbolje"]},
  {q:"Mačka je _____ od slona. (small)",a:"manja",opts:["mala","manja","najmanja"]},
  {q:"Konj je _____ od puža. (fast)",a:"brži",opts:["brz","brži","najbrži"]},
  {q:"Mama je _____ od bake. (young)",a:"mlađa",opts:["mlada","mlađa","najmlađa"]},
  {q:"Ovo je _____ haljina u trgovini! (most beautiful)",a:"najljepša",opts:["lijepa","ljepša","najljepša"]}
];
// ═══ FUTURE TENSE ═══
const FUTURE = {
  intro:"Future = short form of htjeti + infinitive. Ja ću, ti ćeš, on/ona će, mi ćemo, vi ćete, oni/one će.",
  forms:["ću","ćeš","će","ćemo","ćete","će"],
  quiz:[
    {q:"Ja _____ učiti hrvatski. (will)",a:"ću",opts:["ću","ćeš","će"]},
    {q:"Ti _____ ići u školu. (will)",a:"ćeš",opts:["ću","ćeš","će"]},
    {q:"On _____ kuhati ručak. (will)",a:"će",opts:["ću","ćeš","će"]},
    {q:"Mi _____ putovati u Hrvatsku. (will)",a:"ćemo",opts:["ćemo","ćete","će"]},
    {q:"Vi _____ plivati u moru. (will)",a:"ćete",opts:["ćemo","ćete","će"]},
    {q:"Oni _____ igrati nogomet. (will)",a:"će",opts:["ćemo","ćete","će"]},
    {q:"Sutra _____ padati kiša. (will)",a:"će",opts:["ću","ćeš","će"]},
    {q:"Ja _____ pisati zadaću. (will)",a:"ću",opts:["ću","ćeš","će"]},
    {q:"Mi _____ jesti pizzu. (will)",a:"ćemo",opts:["ćemo","ćete","će"]},
    {q:"Ti _____ čitati knjigu. (will)",a:"ćeš",opts:["ću","ćeš","će"]}
  ]
};
// ═══ RESTAURANT CONVERSATION ═══
const RESTCONV = [
  {waiter:"Dobar dan! Imate li rezervaciju?",you:"Nemamo. Imate li slobodan stol?"},
  {waiter:"Naravno! Stol za koliko osoba?",you:"Stol za četvero, molim."},
  {waiter:"Izvolite jelovnik!",you:"Hvala! Što možete preporučiti?"},
  {waiter:"Preporučujem zagrebački odrezak.",you:"Uzet ću to! I jednu salatu, molim."},
  {waiter:"Hoćete li nešto za popiti?",you:"Jednu kavu s mlijekom i sok od naranče."},
  {waiter:"Je li sve u redu?",you:"Da, hvala. Sve je izvrsno!"},
  {waiter:"Želite li desert?",you:"Da, palačinke s čokoladom, molim."},
  {waiter:"Izvolite!",you:"Molim Vas račun!"},
  {waiter:"Kako plaćate?",you:"Karticom, molim."}
];
// ═══ POSSESSIVE PRONOUNS ═══
const POSSESS = {
  table:[
    {person:"ja",m:"moj",f:"moja",n:"moje",en:"my"},
    {person:"ti",m:"tvoj",f:"tvoja",n:"tvoje",en:"your (sg)"},
    {person:"on",m:"njegov",f:"njegova",n:"njegovo",en:"his"},
    {person:"ona",m:"njezin",f:"njezina",n:"njezino",en:"her"},
    {person:"mi",m:"naš",f:"naša",n:"naše",en:"our"},
    {person:"vi",m:"vaš",f:"vaša",n:"vaše",en:"your (pl)"},
    {person:"oni/one",m:"njihov",f:"njihova",n:"njihovo",en:"their"}
  ],
  quiz:[
    {person:"ja",noun:"kuća",g:"f",a:"moja",opts:["moj","moja","moje"]},
    {person:"ja",noun:"selo",g:"n",a:"moje",opts:["moj","moja","moje"]},
    {person:"ja",noun:"stan",g:"m",a:"moj",opts:["moj","moja","moje"]},
    {person:"ti",noun:"sestra",g:"f",a:"tvoja",opts:["tvoj","tvoja","tvoje"]},
    {person:"ti",noun:"dijete",g:"n",a:"tvoje",opts:["tvoj","tvoja","tvoje"]},
    {person:"ti",noun:"brat",g:"m",a:"tvoj",opts:["tvoj","tvoja","tvoje"]},
    {person:"on",noun:"mačka",g:"f",a:"njegova",opts:["njegov","njegova","njegovo"]},
    {person:"on",noun:"sunce",g:"n",a:"njegovo",opts:["njegov","njegova","njegovo"]},
    {person:"on",noun:"sin",g:"m",a:"njegov",opts:["njegov","njegova","njegovo"]},
    {person:"ona",noun:"kava",g:"f",a:"njezina",opts:["njezin","njezina","njezino"]},
    {person:"ona",noun:"računalo",g:"n",a:"njezino",opts:["njezin","njezina","njezino"]},
    {person:"ona",noun:"cvijet",g:"m",a:"njezin",opts:["njezin","njezina","njezino"]},
    {person:"mi",noun:"kuća",g:"f",a:"naša",opts:["naš","naša","naše"]},
    {person:"mi",noun:"more",g:"n",a:"naše",opts:["naš","naša","naše"]},
    {person:"vi",noun:"soba",g:"f",a:"vaša",opts:["vaš","vaša","vaše"]},
    {person:"oni",noun:"baka",g:"f",a:"njihova",opts:["njihov","njihova","njihovo"]},
    {person:"oni",noun:"selo",g:"n",a:"njihovo",opts:["njihov","njihova","njihovo"]},
    {person:"oni",noun:"trajekt",g:"m",a:"njihov",opts:["njihov","njihova","njihovo"]}
  ]
};
// ═══ ADJECTIVE OPPOSITES ═══
const ADJOPPOSITES = [
  {a:"velik",b:"malen",ex:{a:"Slon je velik.",b:"Miš je malen."}},
  {a:"brz",b:"spor",ex:{a:"Konj je brz.",b:"Puž je spor."}},
  {a:"hrabar",b:"plašljiv",ex:{a:"Lav je hrabar.",b:"Zec je plašljiv."}},
  {a:"opasan",b:"bezopasan",ex:{a:"Lav je opasan.",b:"Zec je bezopasan."}},
  {a:"vrijedan",b:"lijen",ex:{a:"Pčela je vrijedna.",b:"Mačka je lijena."}},
  {a:"ozbiljan",b:"neozbiljan",ex:{a:"Sova je ozbiljna.",b:"Majmun je neozbiljan."}},
  {a:"zanimljiv",b:"dosadan",ex:{a:"Dupin je zanimljiv.",b:"Puž je dosadan."}},
  {a:"pametan",b:"glup",ex:{a:"Pas je pametan.",b:"Kokoš je glupa."}},
  {a:"jak",b:"slab",ex:{a:"Medvjed je jak.",b:"Miš je slab."}},
  {a:"mlad",b:"star",ex:{a:"Tele je mlado.",b:"Kornjača je stara."}}
];
// ═══ CITY & COUNTRY LOCATIVE ═══
const CITYLOC = {
  cities:[
    {nom:"Zagreb",lok:"Zagrebu"},{nom:"Zadar",lok:"Zadru"},{nom:"Vukovar",lok:"Vukovaru"},{nom:"Pariz",lok:"Parizu"},{nom:"Varaždin",lok:"Varaždinu"},{nom:"Dubrovnik",lok:"Dubrovniku"},{nom:"Opatija",lok:"Opatiji"},{nom:"Rijeka",lok:"Rijeci"},{nom:"Split",lok:"Splitu"},{nom:"Labin",lok:"Labinu"},{nom:"Bibinje",lok:"Bibinjama"},{nom:"Mostar",lok:"Mostaru"},{nom:"London",lok:"Londonu"},{nom:"Berlin",lok:"Berlinu"}
  ],
  countries:[
    {nom:"Hrvatska",lok:"Hrvatskoj"},{nom:"Italija",lok:"Italiji"},{nom:"Slovenija",lok:"Sloveniji"},{nom:"Njemačka",lok:"Njemačkoj"},{nom:"Francuska",lok:"Francuskoj"},{nom:"Kanada",lok:"Kanadi"},{nom:"Velika Britanija",lok:"Velikoj Britaniji"},{nom:"Bosna i Hercegovina",lok:"Bosni i Hercegovini"},{nom:"Amerika",lok:"Americi"},{nom:"Srbija",lok:"Srbiji"}
  ]
};
// ═══ ACCUSATIVE FOOD & CLOTHES ═══
const AKUFOOD = [
  {nom:"čokolada",aku:"čokoladu",q:"Voliš li _____?"},{nom:"pizza",aku:"pizzu",q:"Voliš li _____?"},{nom:"juha",aku:"juhu",q:"Voliš li _____?"},{nom:"tjestenina",aku:"tjesteninu",q:"Voliš li _____?"},{nom:"voda",aku:"vodu",q:"Piješ li _____?"},{nom:"riža",aku:"rižu",q:"Jedeš li _____?"},{nom:"kruh",aku:"kruh",q:"Jedeš li _____?"},{nom:"džem",aku:"džem",q:"Voliš li _____?"},{nom:"med",aku:"med",q:"Voliš li _____?"},{nom:"sladoled",aku:"sladoled",q:"Voliš li _____?"},{nom:"mlijeko",aku:"mlijeko",q:"Piješ li _____?"},{nom:"voće",aku:"voće",q:"Jedeš li _____?"},{nom:"povrće",aku:"povrće",q:"Jedeš li _____?"},{nom:"meso",aku:"meso",q:"Jedeš li _____?"},{nom:"kava",aku:"kavu",q:"Piješ li _____?"}
];
const AKUCLOTHES = [
  {nom:"majica",aku:"majicu",q:"Nosiš li _____?"},{nom:"kaput",aku:"kaput",q:"Nosiš li _____?"},{nom:"haljina",aku:"haljinu",q:"Nosiš li _____?"},{nom:"košulja",aku:"košulju",q:"Nosiš li _____?"},{nom:"suknja",aku:"suknju",q:"Nosiš li _____?"},{nom:"torba",aku:"torbu",q:"Nosiš li _____?"},{nom:"kravata",aku:"kravatu",q:"Nosiš li _____?"},{nom:"jakna",aku:"jaknu",q:"Nosiš li _____?"},{nom:"šešir",aku:"šešir",q:"Nosiš li _____?"},{nom:"šal",aku:"šal",q:"Nosiš li _____?"}
];
// ═══ CONVERSATION MATCH ═══
const CONVMATCH = [
  {title:"U trgovini",pairs:[
    {q:"Dobar dan! Mogu li Vam pomoći?",a:"Da, molim Vas. Tražim knjigu.",wrong:"Idem autobusom."},
    {q:"Kakvu knjigu želite?",a:"Jednu sa slikama životinja.",wrong:"Moja sestra kuha ručak."},
    {q:"Za koga je knjiga?",a:"Za moju mamu. Uskoro je njezin rođendan.",wrong:"Obično u podne."},
    {q:"Želi li Vaša mama ovu knjigu?",a:"Da, ali je preskupa.",wrong:"Počešljam se svako jutro."},
    {q:"Ova je jeftinija. Ima lijepe slike.",a:"Savršeno! Želim ju kupiti.",wrong:"Idem na posao pješice."}
  ]},
  {title:"O hrani",pairs:[
    {q:"Koja je tvoja omiljena hrana?",a:"Volim sir na pizzi i na kruhu.",wrong:"Išao sam u kino."},
    {q:"Tko kuha tvoj ručak?",a:"Moja sestra. Ona to voli raditi.",wrong:"Imam deset godina."},
    {q:"Voliš li ti ponekad kuhati?",a:"Da, ali samo jednostavna jela.",wrong:"Autobusom idem na posao."},
    {q:"Kada si prvi put počela kuhati?",a:"Imala sam možda deset godina.",wrong:"Volim sir na pizzi."},
    {q:"U koje vrijeme imaš ručak?",a:"Obično u podne.",wrong:"Moja sestra kuha."}
  ]},
  {title:"O poslu",pairs:[
    {q:"Ideš li uvijek pješice na posao?",a:"Idem autobusom ako pada kiša.",wrong:"Obično u podne."},
    {q:"Koliko ljudi tamo radi?",a:"Samo nekoliko. To je malen biznis.",wrong:"Da, volim kuhati."},
    {q:"Gdje jedeš ručak?",a:"Ponekad u uredu, a ponekad vani.",wrong:"Imam deset godina."},
    {q:"Mogu li koristiti kompjuter?",a:"Dobro, ali samo kad sam na sastanku.",wrong:"Išla sam na otok."},
    {q:"Kada se vraćaš s posla?",a:"Obično kad završim sve za taj dan.",wrong:"Volim sir na kruhu."}
  ]}
];
var _searchIdx=null;
function buildSearchIndex(){if(_searchIdx)return _searchIdx;var idx=[];Object.keys(V).forEach(function(cat){V[cat].forEach(function(w){idx.push({hr:w[0],en:w[1],type:"vocab",go:"lesson"})})});
[{n:"School Kit",s:"school"},{n:"Texting",s:"texting"},{n:"Friends",s:"friends"},{n:"Food",s:"foodorder"},{n:"Transport",s:"transport"},{n:"Emergency",s:"emergency"},{n:"Football",s:"football"},{n:"Pop Culture",s:"popculture"},{n:"Practical Life",s:"practical"},{n:"Grocery",s:"grocery"},{n:"Recipes",s:"recipes"},{n:"Role-Play",s:"roleplay"},{n:"Map",s:"crmap"},{n:"Grammar",s:"grammar"},{n:"Cases",s:"padezi"},{n:"Padeži Master",s:"padezifull"},{n:"Aspect",s:"aspect"},{n:"Conjugation",s:"conjdrill"},{n:"Modal Verbs",s:"modal"},{n:"Declension",s:"declension"},{n:"Tenses Gender",s:"tenses"},{n:"Colors Gender",s:"boje"},{n:"Alphabet",s:"alphabet"},{n:"False Friends",s:"falsefr"},{n:"Dialects",s:"dialects"},{n:"Diminutives",s:"diminutives"},{n:"Word Formation",s:"wordform"},{n:"Tongue Twisters",s:"brzalice"},{n:"Flashcards",s:"flashcards"},{n:"Typing",s:"typing"},{n:"Idioms",s:"idioms"},{n:"Proverbs",s:"proverbs"},{n:"Leaderboard",s:"leaderboard"},{n:"Badges",s:"badges"},{n:"Domovinski Rat",s:"history"},{n:"Kings",s:"kings"},{n:"Labin Rabac",s:"region_labin"},{n:"Bibinje Zadar",s:"region_bibinje"},{n:"Hercegovina",s:"region_hercegovina"},{n:"Vukovar",s:"region_vukovar"},{n:"Vinkovci",s:"region_vinkovci"},{n:"Learning Path",s:"learnpath"},{n:"Favorites",s:"favorites"},{n:"Journal",s:"journal"}].forEach(function(x){idx.push({hr:x.n,en:x.n,type:"screen",go:x.s})});
GROCERY.phrases.forEach(function(p){idx.push({hr:p[0],en:p[1],type:"phrase",go:"grocery"})});SCHOOL.phrases.forEach(function(p){idx.push({hr:p[0],en:p[1],type:"phrase",go:"school"})});TRANSPORT.forEach(function(t){idx.push({hr:t.hr,en:t.en,type:"phrase",go:"transport"})});EMERGENCY.phrases.forEach(function(p){idx.push({hr:p[0],en:p[1],type:"phrase",go:"emergency"})});_searchIdx=idx;return idx}
// ═══ CSS THEME ═══
const CSS=`
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
:root{--card:#fff;--card-b:rgba(0,0,0,.07);--inp-bg:#fff;--inp-c:#1c1917;--inp-b:#e2e8f0;--ob-bg:#fff;--ob-c:#1c1917;--ob-b:#e2e8f0;--ob-hbg:#f0f9ff;--nav-bg:rgba(255,255,255,.96);--nav-b:rgba(0,0,0,.06);--nav-lbl:#94a3b8;--ghost-bg:#fff;--ghost-c:#475569;--ghost-b:#e2e8f0;--heading:#0f172a;--subtext:#64748b;--sh-c:#94a3b8;--rt-c:#374151;--bar-bg:rgba(0,0,0,.08)}
.dark{--card:#1e293b;--card-b:rgba(255,255,255,.08);--inp-bg:#0f172a;--inp-c:#e2e8f0;--inp-b:#334155;--ob-bg:#1e293b;--ob-c:#e2e8f0;--ob-b:#334155;--ob-hbg:rgba(14,116,144,.2);--nav-bg:rgba(15,23,42,.96);--nav-b:rgba(255,255,255,.08);--nav-lbl:#64748b;--ghost-bg:#1e293b;--ghost-c:#94a3b8;--ghost-b:#334155;--heading:#e2e8f0;--subtext:#94a3b8;--sh-c:#64748b;--rt-c:#cbd5e1;--bar-bg:rgba(255,255,255,.1)}
/* Skip-to-content for keyboard/screen reader navigation */
.skip-link{position:absolute;top:-100%;left:0;padding:12px 20px;background:#0e7490;color:#fff;font-weight:700;font-size:15px;z-index:9999;border-radius:0 0 8px 0;text-decoration:none}
.skip-link:focus{top:0}
/* Visible focus ring for keyboard navigation */
:focus-visible{outline:3px solid #0e7490;outline-offset:3px}
@keyframes rise{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:translateY(0)}}
@keyframes slideUp{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
@keyframes pop{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}60%{transform:translate(-50%,-50%) scale(1.04)}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes boat{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-8px) rotate(1.5deg)}}
@keyframes wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes confetti{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(60px) rotate(360deg);opacity:0}}
@keyframes streakPop{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1)}}
/* === CARDS === */
.c{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)}
.c:hover{box-shadow:0 4px 24px rgba(14,116,144,.1),0 1px 3px rgba(0,0,0,.06);transition:box-shadow .2s}
.tc{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:16px;cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s;box-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)}
.tc:hover{border-color:rgba(14,116,144,.22);transform:translateY(-2px);box-shadow:0 8px 32px rgba(14,116,144,.13),0 1px 3px rgba(0,0,0,.06)}
.tc:active{transform:translateY(0) scale(.98);box-shadow:0 1px 3px rgba(0,0,0,.06)}
/* === BUTTONS === */
.b{padding:12px 22px;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s,filter .15s;font-family:'Outfit',sans-serif;letter-spacing:.01em;line-height:1}
.b:hover{transform:translateY(-1px);filter:brightness(1.06)}
.b:active{transform:translateY(0);filter:brightness(.97)}
.b:focus-visible{outline:3px solid rgba(14,116,144,.45);outline-offset:3px}
.bp{background:linear-gradient(135deg,#0e7490,#164e63);color:#fff;box-shadow:0 3px 12px rgba(14,116,144,.28)}
.bp:hover{box-shadow:0 6px 20px rgba(14,116,144,.36)}
.bs{background:linear-gradient(135deg,#16a34a,#166534);color:#fff;box-shadow:0 3px 12px rgba(22,163,74,.24)}
.bw{background:linear-gradient(135deg,#d97706,#b45309);color:#fff;box-shadow:0 3px 12px rgba(180,83,9,.24)}
.bv{background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;box-shadow:0 3px 12px rgba(124,58,237,.24)}
.bd{background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;box-shadow:0 3px 12px rgba(220,38,38,.24)}
.bg{background:var(--ghost-bg);color:var(--ghost-c);border:1.5px solid var(--ghost-b);box-shadow:0 1px 3px rgba(0,0,0,.06)}
.bg:hover{background:var(--ob-hbg);border-color:#0e7490;color:#0e7490}
/* === INPUTS === */
input[type=text],input[type=password],input[type=email],input[type=search],textarea{width:100%;padding:13px 16px;border:1.5px solid var(--inp-b);border-radius:12px;background:var(--inp-bg);color:var(--inp-c);font-size:15px;font-weight:500;outline:none;font-family:'Outfit',sans-serif;transition:border-color .2s,box-shadow .2s}
input[type=search]::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}
input:focus,textarea:focus{border-color:#0e7490;box-shadow:0 0 0 3px rgba(14,116,144,.1)}
input::placeholder,textarea::placeholder{color:#94a3b8;font-weight:400}
/* === QUIZ OPTIONS === */
.ob{width:100%;padding:14px 18px;border:1.5px solid var(--ob-b);border-radius:12px;background:var(--ob-bg);color:var(--ob-c);font-size:15px;font-weight:600;cursor:pointer;transition:all .18s;font-family:'Outfit',sans-serif;text-align:left;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.ob:hover{border-color:#0e7490;background:var(--ob-hbg);transform:translateX(2px)}
.ob:active{transform:translateX(0) scale(.98)}
.ob.ok{border-color:#16a34a;background:#f0fdf4;color:#15803d}
.ob.no{border-color:#dc2626;background:#fef2f2;color:#b91c1c}
/* === TYPOGRAPHY === */
.sh{font-size:11px;font-weight:800;color:var(--sh-c);margin-bottom:10px;margin-top:24px;letter-spacing:.1em;text-transform:uppercase;padding-bottom:0;border-bottom:none}
/* === READING TEXT === */
.rt{font-size:17px;line-height:2;color:var(--rt-c)}
.rt .w{cursor:pointer;border-radius:4px;padding:1px 4px;transition:all .15s}
.rt .w:hover{background:rgba(14,116,144,.12);color:#0e7490}
/* === NAV BAR (mobile-first) === */
.nav-bar{position:fixed;bottom:0;left:0;right:0;background:var(--nav-bg);border-top:1px solid var(--nav-b);display:flex;justify-content:space-around;align-items:center;padding:4px 0;padding-bottom:max(4px,env(safe-area-inset-bottom));z-index:9000;backdrop-filter:saturate(160%) blur(24px)}
.nav-btn{background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;padding:6px 10px;min-width:58px;border-radius:14px;transition:background .15s}
.nav-btn:active{background:rgba(14,116,144,.08)}
.nav-btn .nav-icon{font-size:21px;display:block;transition:transform .2s}
.nav-btn .nav-label{font-size:10px;font-weight:600;color:var(--nav-lbl);transition:color .15s}
.nav-btn.active .nav-icon{transform:scale(1.08)}
.nav-btn.active .nav-label{font-weight:800;color:#0e7490}
/* === LAYOUT === */
.dash{max-width:640px;margin:0 auto;padding:20px 16px 84px;position:relative;z-index:1;animation:slideUp .3s ease}
.scr-wrap{max-width:640px;margin:0 auto;padding:20px 16px 84px;position:relative;z-index:1;animation:slideUp .25s ease}
/* === DESKTOP (≥768px) === */
@media(min-width:768px){
  .nav-bar{bottom:auto;top:0;border-top:none;border-bottom:1px solid var(--nav-b);padding:0 32px;justify-content:center;gap:2px;height:60px}
  .nav-btn{flex-direction:row;gap:7px;padding:8px 16px;min-width:auto;border-radius:10px;height:40px}
  .nav-btn .nav-icon{font-size:17px}
  .nav-btn .nav-label{font-size:13px;font-weight:600;color:var(--nav-lbl)}
  .nav-btn.active{background:rgba(14,116,144,.09)}
  .nav-btn.active .nav-icon{transform:none}
  .nav-btn.active .nav-label{color:#0e7490;font-weight:700}
  .dash{max-width:920px;padding:76px 32px 48px}
  .scr-wrap{max-width:920px;padding:76px 32px 48px}
  .c{border-radius:20px}.tc{border-radius:20px}
}
@media(min-width:1200px){
  .dash{max-width:1160px;padding:76px 48px 48px}
  .scr-wrap{max-width:1160px;padding:76px 48px 48px}
}
@media(prefers-reduced-motion:reduce){
  *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
}
/* === SEMANTIC BUTTON RESET — allows <button className="tc"> ===*/
button.tc{font-family:'Outfit',sans-serif;width:100%;cursor:pointer;display:block}
/* === SCREEN-READER ONLY === */
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
/* === DAILY CHALLENGE OPTIONS === */
.dc-opt:not(:disabled):hover{border-color:#7c3aed!important;background:#faf5ff!important}
.dark .dc-opt:not(:disabled):hover{background:rgba(124,58,237,.15)!important}
/* === SEARCH RESULTS DROPDOWN === */
.sr-item{padding:11px 16px;border-bottom:1px solid var(--card-b);cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background .1s}
.sr-item:hover,.sr-item:active{background:var(--ob-hbg)}
.sr-close{padding:10px;text-align:center;font-size:12px;color:var(--subtext);cursor:pointer;border-top:1px solid var(--card-b)}
.sr-close:hover{color:#0e7490}
/* === FLASHCARD 3D FLIP === */
@keyframes fcFlip{0%{transform:rotateY(90deg);opacity:.5}100%{transform:rotateY(0deg);opacity:1}}
.fc-scene{perspective:1000px;width:100%;height:220px;margin-top:20px}
.fc-card{width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.4,0,.2,1);cursor:pointer;position:relative}
.fc-card.flipped{transform:rotateY(180deg)}
.fc-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
.fc-front{background:linear-gradient(135deg,#dbeafe,#bfdbfe)}
.fc-back{background:linear-gradient(135deg,#dcfce7,#bbf7d0);transform:rotateY(180deg)}
`;
const BG_LIGHT={minHeight:"100vh",background:"#f1f5f9",color:"#1c1917",fontFamily:"'Outfit',sans-serif",position:"relative",overflowX:"hidden"};
const BG_DARK={minHeight:"100vh",background:"linear-gradient(170deg,#0f172a 0%,#1e293b 30%,#1a1a2e 60%,#16213e 100%)",color:"#e2e8f0",fontFamily:"'Outfit',sans-serif",position:"relative",overflowX:"hidden"};
const BG=BG_LIGHT;
const H=(t,s)=><div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid rgba(0,0,0,.06)"}}>
  <h2
    style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"var(--heading)",fontWeight:800,letterSpacing:"-.02em",lineHeight:1.2}}>
    {t}
  </h2>
  {s&&<p style={{color:"var(--subtext)",fontSize:13,marginTop:5,fontWeight:500}}>
    {s}
  </p>}
</div>;
const Bar=({v,mx,color="#0e7490",h=8})=><div
  style={{background:"var(--bar-bg)",borderRadius:h/2,height:h,overflow:"hidden"}}>
  <div
    style={{width:Math.min((v/mx)*100,100)+"%",height:"100%",background:color,borderRadius:h/2,transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}} />
</div>;
const Spk=({text,label})=><button
  onClick={e=>{e.stopPropagation();speak(text)}}
  style={{background:"rgba(14,116,144,.1)",border:"1px solid rgba(14,116,144,.2)",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#0e7490",display:"inline-flex",alignItems:"center",gap:6,fontWeight:700,fontSize:14}}>
  🔊
  {label&&<span style={{fontSize:12}}>
    {label}
  </span>}
</button>;
// ═══ MAIN APP ═══
// ═══ ERROR BOUNDARY — Prevents white screen of death ═══
class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return{hasError:true,error:error}}
  componentDidCatch(error,info){console.error("App crash caught:",error,info)}
  render(){
    if(this.state.hasError){
      return (
        <div
          style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#fef3c7,#fff7ed)",padding:24,textAlign:"center"}}>
          <div>
            <div style={{fontSize:64,marginBottom:16}}>
              ⚠️
            </div>
            <h2
              style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#164e63",marginBottom:8}}>
              Something went wrong
            </h2>
            <p style={{color:"#78716c",marginBottom:20,fontSize:14}}>
              The app hit an unexpected error. Your progress is saved.
            </p>
            <button
              onClick={function(){window.location.reload()}}
              style={{padding:"12px 32px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children
  }
}

const COUNTRIES = {
  title: "Countries & Nationalities",
  intro: "Learn Croatian country names, nationality adjectives (m/f/n), and demonyms. Adjectives must agree with the noun's gender — pay attention to the endings!",
  tip: "Country names are mostly feminine (Hrvatska, Italija, Njemačka). Nationality adjectives decline like regular adjectives. Demonyms (people words) are separate nouns.",
  countries: [
    { country:"Hrvatska", en:"Croatia", adj_m:"hrvatski", adj_f:"hrvatska", adj_n:"hrvatsko", dem_m:"Hrvat", dem_f:"Hrvatica", flag:"🇭🇷", note:"Our homeland!" },
    { country:"Bosna i Hercegovina", en:"Bosnia & Herzegovina", adj_m:"bosanski", adj_f:"bosanska", adj_n:"bosansko", dem_m:"Bosanac", dem_f:"Bosanka", flag:"🇧🇦", note:"Neighbor with deep Croatian ties" },
    { country:"Srbija", en:"Serbia", adj_m:"srpski", adj_f:"srpska", adj_n:"srpsko", dem_m:"Srbin", dem_f:"Srpkinja", flag:"🇷🇸", note:"Srbin is unusual — note the -in ending" },
    { country:"Slovenija", en:"Slovenia", adj_m:"slovenski", adj_f:"slovenska", adj_n:"slovensko", dem_m:"Slovenac", dem_f:"Slovenka", flag:"🇸🇮" },
    { country:"Italija", en:"Italy", adj_m:"talijanski", adj_f:"talijanska", adj_n:"talijansko", dem_m:"Talijan", dem_f:"Talijanka", flag:"🇮🇹", note:"Note: talijanski not *italijanski" },
    { country:"Njemačka", en:"Germany", adj_m:"njemački", adj_f:"njemačka", adj_n:"njemačko", dem_m:"Nijemac", dem_f:"Njemica", flag:"🇩🇪", note:"Comes from 'nijem' (mute) — what Slavs called Germanic peoples" },
    { country:"Austrija", en:"Austria", adj_m:"austrijski", adj_f:"austrijska", adj_n:"austrijsko", dem_m:"Austrijanac", dem_f:"Austrijanka", flag:"🇦🇹" },
    { country:"Francuska", en:"France", adj_m:"francuski", adj_f:"francuska", adj_n:"francusko", dem_m:"Francuz", dem_f:"Francuskinja", flag:"🇫🇷" },
    { country:"Španjolska", en:"Spain", adj_m:"španjolski", adj_f:"španjolska", adj_n:"španjolsko", dem_m:"Španjolac", dem_f:"Španjolka", flag:"🇪🇸" },
    { country:"Portugal", en:"Portugal", adj_m:"portugalski", adj_f:"portugalska", adj_n:"portugalsko", dem_m:"Portugálac", dem_f:"Portugalka", flag:"🇵🇹" },
    { country:"Engleska / UK", en:"England / UK", adj_m:"engleski", adj_f:"engleska", adj_n:"englesko", dem_m:"Englez", dem_f:"Engleskinja", flag:"🇬🇧", note:"UK = Ujedinjeno Kraljevstvo" },
    { country:"Amerika (SAD)", en:"USA", adj_m:"američki", adj_f:"američka", adj_n:"američko", dem_m:"Amerikanac", dem_f:"Amerikanka", flag:"🇺🇸", note:"SAD = Sjedinjene Američke Države" },
    { country:"Kanada", en:"Canada", adj_m:"kanadski", adj_f:"kanadska", adj_n:"kanadsko", dem_m:"Kanaðanin", dem_f:"Kanađanka", flag:"🇨🇦" },
    { country:"Australija", en:"Australia", adj_m:"australski", adj_f:"australska", adj_n:"australsko", dem_m:"Australijanac", dem_f:"Australijanka", flag:"🇦🇺" },
    { country:"Rusija", en:"Russia", adj_m:"ruski", adj_f:"ruska", adj_n:"rusko", dem_m:"Rus", dem_f:"Ruskinja", flag:"🇷🇺" },
    { country:"Poljska", en:"Poland", adj_m:"poljski", adj_f:"poljska", adj_n:"poljsko", dem_m:"Poljak", dem_f:"Poljakinja", flag:"🇵🇱" },
    { country:"Mađarska", en:"Hungary", adj_m:"mađarski", adj_f:"mađarska", adj_n:"mađarsko", dem_m:"Mađar", dem_f:"Mađarica", flag:"🇭🇺" },
    { country:"Češka", en:"Czech Republic", adj_m:"češki", adj_f:"češka", adj_n:"češko", dem_m:"Čeh", dem_f:"Čehinja", flag:"🇨🇿" },
    { country:"Slovačka", en:"Slovakia", adj_m:"slovački", adj_f:"slovačka", adj_n:"slovačko", dem_m:"Slovak", dem_f:"Slovakinja", flag:"🇸🇰" },
    { country:"Grčka", en:"Greece", adj_m:"grčki", adj_f:"grčka", adj_n:"grčko", dem_m:"Grk", dem_f:"Grkinja", flag:"🇬🇷" },
    { country:"Turska", en:"Turkey", adj_m:"turski", adj_f:"turska", adj_n:"tursko", dem_m:"Turčin", dem_f:"Turkinja", flag:"🇹🇷", note:"Turčin has the unusual -in ending like Srbin" },
    { country:"Japan", en:"Japan", adj_m:"japanski", adj_f:"japanska", adj_n:"japansko", dem_m:"Japanac", dem_f:"Japanka", flag:"🇯🇵" },
    { country:"Kina", en:"China", adj_m:"kineski", adj_f:"kineska", adj_n:"kinesko", dem_m:"Kinez", dem_f:"Kineskinja", flag:"🇨🇳" },
    { country:"Brazil", en:"Brazil", adj_m:"brazilski", adj_f:"brazilska", adj_n:"brazilsko", dem_m:"Brazilac", dem_f:"Brazilka", flag:"🇧🇷" },
  ],
  phrases: [
    { hr:"Odakle si?", en:"Where are you from?" },
    { hr:"Ja sam iz Hrvatske.", en:"I am from Croatia." },
    { hr:"Ja sam Hrvat / Hrvatica.", en:"I am Croatian (m/f)." },
    { hr:"Govorim hrvatski.", en:"I speak Croatian." },
    { hr:"On je Nijemac. Ona je Njemica.", en:"He is German. She is German." },
    { hr:"Živim u Australiji.", en:"I live in Australia." },
    { hr:"Putujemo u Italiju.", en:"We are travelling to Italy." },
    { hr:"Ona dolazi iz Amerike.", en:"She comes from America." },
  ],
  quiz: [
    { q:"What is the nationality adjective (m) for Italy?", a:"talijanski", opts:["italienski","talijanski","italički","italiski"] },
    { q:"What is the female demonym for Germany?", a:"Njemica", opts:["Njemkinja","Nijemka","Njemica","Njemanka"] },
    { q:"How do you say 'I am from Croatia'?", a:"Ja sam iz Hrvatske.", opts:["Ja sam iz Hrvatska.","Ja sam od Hrvatska.","Ja sam iz Hrvatske.","Ja sam u Hrvatskoj."] },
    { q:"What does SAD stand for?", a:"Sjedinjene Američke Države", opts:["Slobodne Američke Države","Sjeverne Atlantske Države","Sjedinjene Američke Države","Savez Američkih Država"] },
    { q:"Which ending do Srbin and Turčin share?", a:"-in", opts:["-ac","-in","-ec","-oc"] },
  ],
};

const PROFESSIONS = {
  title: "Professions & Jobs",
  intro: "In Croatian, most professions have distinct masculine and feminine forms. Always use the correct form based on the person's gender — it's grammatically required!",
  tip: "Many feminine forms add -ica or -ka to the masculine. Some are completely different words. When unsure, it's better to use the person's specific form than a generic one.",
  categories: [
    {
      cat: "Healthcare",
      icon: "🏥",
      jobs: [
        { m:"liječnik", f:"liječnica", en:"doctor", note:"Most common word for doctor" },
        { m:"doktor", f:"doktorica", en:"doctor (informal)", note:"Also used informally" },
        { m:"stomatolog", f:"stomatologinja", en:"dentist" },
        { m:"medicinska sestra", f:"medicinska sestra", en:"nurse (f)", note:"Medicinska brat for male nurses" },
        { m:"ljekarnik", f:"ljekarnica", en:"pharmacist" },
        { m:"kirurg", f:"kirurginja", en:"surgeon" },
        { m:"psihijatar", f:"psihijatrica", en:"psychiatrist" },
        { m:"psiholog", f:"psihologinja", en:"psychologist" },
      ]
    },
    {
      cat: "Education",
      icon: "📚",
      jobs: [
        { m:"učitelj", f:"učiteljica", en:"primary school teacher", note:"For elementary school" },
        { m:"profesor", f:"profesorica", en:"secondary/uni teacher", note:"For high school & university" },
        { m:"odgajatelj", f:"odgajateljica", en:"kindergarten teacher / educator" },
        { m:"ravnatelj", f:"ravnateljica", en:"school principal" },
        { m:"student", f:"studentica", en:"university student" },
        { m:"đak / učenik", f:"đakinja / učenica", en:"pupil / school student" },
      ]
    },
    {
      cat: "Law & Government",
      icon: "⚖️",
      jobs: [
        { m:"odvjetnik", f:"odvjetnica", en:"lawyer / attorney" },
        { m:"sudac", f:"sutkinja", en:"judge", note:"Note the completely different female form!" },
        { m:"policajac", f:"policajka", en:"police officer" },
        { m:"vojnik", f:"vojnikinja", en:"soldier" },
        { m:"ministar", f:"ministrica", en:"minister (government)" },
        { m:"gradonačelnik", f:"gradonačelnica", en:"mayor" },
        { m:"diplomat", f:"diplomatica", en:"diplomat" },
      ]
    },
    {
      cat: "Business & Office",
      icon: "💼",
      jobs: [
        { m:"direktor", f:"direktorica", en:"director / CEO" },
        { m:"menadžer", f:"menadžerica", en:"manager" },
        { m:"tajnik", f:"tajnica", en:"secretary" },
        { m:"računovođa", f:"računovođa", en:"accountant", note:"Same form for both genders!" },
        { m:"ekonomist", f:"ekonomistica", en:"economist" },
        { m:"poduzetnik", f:"poduzetnica", en:"entrepreneur" },
        { m:"prodavač", f:"prodavačica", en:"salesperson / shop assistant" },
      ]
    },
    {
      cat: "Trades & Services",
      icon: "🔧",
      jobs: [
        { m:"kuhar", f:"kuharica", en:"cook / chef" },
        { m:"konobar", f:"konobarica", en:"waiter / waitress" },
        { m:"vozač", f:"vozačica", en:"driver" },
        { m:"pilot", f:"pilotkinja", en:"pilot" },
        { m:"vatrogasac", f:"vatrogasac / vatrogaskinja", en:"firefighter" },
        { m:"frizer", f:"frizerka", en:"hairdresser" },
        { m:"postolar", f:"postolarka", en:"shoemaker" },
        { m:"zidar", f:"zidarica", en:"builder / bricklayer" },
        { m:"električar", f:"električarka", en:"electrician" },
        { m:"vodoinstalater", f:"vodoinstalaterka", en:"plumber" },
      ]
    },
    {
      cat: "Creative & Media",
      icon: "🎨",
      jobs: [
        { m:"novinar", f:"novinarka", en:"journalist" },
        { m:"pisac", f:"spisateljica", en:"writer / author", note:"Note the different female form!" },
        { m:"glumac", f:"glumica", en:"actor / actress" },
        { m:"pjevač", f:"pjevačica", en:"singer" },
        { m:"fotograf", f:"fotografkinja", en:"photographer" },
        { m:"dizajner", f:"dizajnerica", en:"designer" },
        { m:"arhitekt", f:"arhitektica", en:"architect" },
        { m:"inženjer", f:"inženjerka", en:"engineer" },
      ]
    },
  ],
  phrases: [
    { hr:"Čime se baviš?", en:"What do you do for work? (informal)" },
    { hr:"Čime se bavite?", en:"What do you do for work? (formal)" },
    { hr:"Ja sam liječnik.", en:"I am a doctor. (m)" },
    { hr:"Ja sam liječnica.", en:"I am a doctor. (f)" },
    { hr:"Radim kao učitelj.", en:"I work as a teacher. (m)" },
    { hr:"Radim kao učiteljica.", en:"I work as a teacher. (f)" },
    { hr:"Gdje radiš?", en:"Where do you work?" },
    { hr:"Radim u bolnici / školi / uredu.", en:"I work in a hospital / school / office." },
    { hr:"Koliko zarađuješ?", en:"How much do you earn?" },
    { hr:"Tražim posao.", en:"I am looking for a job." },
    { hr:"Nezaposlen sam.", en:"I am unemployed. (m)" },
    { hr:"Umirovljenik sam.", en:"I am retired. (m)" },
  ],
  quiz: [
    { q:"What is the female form of 'sudac' (judge)?", a:"sutkinja", opts:["sutkinja","sutnica","sutkica","sučica"] },
    { q:"How do you say 'I work as a nurse'?", a:"Radim kao medicinska sestra.", opts:["Radim u medicinskom.","Radim kao medicinska sestra.","Radim kao nursa.","Ja sam medicinarka."] },
    { q:"Which profession has the SAME form for m and f?", a:"računovođa", opts:["liječnik","računovođa","konobar","vozač"] },
    { q:"What is the female form of 'pisac' (writer)?", a:"spisateljica", opts:["pisačica","pisatkinja","spisateljica","piskinja"] },
    { q:"How do you ask 'What do you do?' formally?", a:"Čime se bavite?", opts:["Što radite?","Čime se bavite?","Čime baviš?","Što je tvoj posao?"] },
  ],
};

const WEATHER = {
  title: "Vrijeme — Weather",
  intro: "Weather is one of the most common conversation starters in Croatia. Learn to describe the weather, ask about the forecast, and talk about seasons.",
  tip: "'Vrijeme' means both 'weather' AND 'time' — context determines the meaning. 'Kakvo je vrijeme?' = What's the weather like?",
  vocab: [
    { hr:"sunce", en:"sun", icon:"☀️" },
    { hr:"sunčano", en:"sunny", icon:"🌤️" },
    { hr:"oblačno", en:"cloudy", icon:"☁️" },
    { hr:"oblak", en:"cloud", icon:"🌥️" },
    { hr:"kiša", en:"rain", icon:"🌧️" },
    { hr:"pada kiša", en:"it's raining", icon:"🌧️" },
    { hr:"grmljavina / grmljavinska oluja", en:"thunderstorm", icon:"⛈️" },
    { hr:"munja", en:"lightning", icon:"⚡" },
    { hr:"grom", en:"thunder", icon:"🌩️" },
    { hr:"snijeg", en:"snow", icon:"❄️" },
    { hr:"pada snijeg", en:"it's snowing", icon:"🌨️" },
    { hr:"vjetar", en:"wind", icon:"💨" },
    { hr:"vjetrovito", en:"windy", icon:"🌬️" },
    { hr:"magla", en:"fog", icon:"🌫️" },
    { hr:"magleno", en:"foggy", icon:"🌫️" },
    { hr:"led", en:"ice", icon:"🧊" },
    { hr:"mraz", en:"frost / freeze", icon:"🌡️" },
    { hr:"sumaglica", en:"haze / mist", icon:"🌁" },
    { hr:"pljusak", en:"downpour / heavy rain", icon:"⛈️" },
    { hr:"toplina", en:"heat", icon:"🌡️" },
    { hr:"hladnoća", en:"cold (noun)", icon:"🥶" },
    { hr:"vlažnost", en:"humidity", icon:"💧" },
    { hr:"temperatura", en:"temperature", icon:"🌡️" },
    { hr:"stupanj (Celzij)", en:"degree (Celsius)", icon:"°C" },
    { hr:"prognoza", en:"forecast", icon:"📅" },
    { hr:"bura", en:"bura wind (cold NE wind, Dalmatia)", icon:"💨", note:"Famous Croatian coastal wind" },
    { hr:"jugo", en:"jugo wind (warm humid S wind)", icon:"🌊", note:"Brings heavy rain to coast" },
    { hr:"maestral", en:"maestral (afternoon sea breeze)", icon:"🌊", note:"Pleasant summer wind" },
  ],
  adjectives: [
    { hr:"toplo", en:"warm", hr2:"vruće", en2:"hot" },
    { hr:"hladno", en:"cold", hr2:"svježe", en2:"cool / fresh" },
    { hr:"mokro", en:"wet", hr2:"suho", en2:"dry" },
    { hr:"vedro", en:"clear / bright", hr2:"tmurno", en2:"gloomy / overcast" },
    { hr:"ugodno", en:"pleasant", hr2:"neprijatno", en2:"unpleasant" },
  ],
  seasons: [
    { hr:"proljeće", en:"spring", adj:"proljetni/a/o", months:"ožujak, travanj, svibanj", icon:"🌸" },
    { hr:"ljeto", en:"summer", adj:"ljetni/a/o", months:"lipanj, srpanj, kolovoz", icon:"☀️" },
    { hr:"jesen", en:"autumn / fall", adj:"jesenski/a/o", months:"rujan, listopad, studeni", icon:"🍂" },
    { hr:"zima", en:"winter", adj:"zimski/a/o", months:"prosinac, siječanj, veljača", icon:"❄️" },
  ],
  phrases: [
    { hr:"Kakvo je vrijeme?", en:"What's the weather like?" },
    { hr:"Kakva je prognoza za sutra?", en:"What's the forecast for tomorrow?" },
    { hr:"Lijepo je vrijeme.", en:"The weather is nice." },
    { hr:"Loše je vrijeme.", en:"The weather is bad." },
    { hr:"Pada kiša.", en:"It's raining." },
    { hr:"Pada snijeg.", en:"It's snowing." },
    { hr:"Puše vjetar.", en:"The wind is blowing." },
    { hr:"Ima 30 stupnjeva.", en:"It's 30 degrees." },
    { hr:"Vani je vruće / hladno.", en:"It's hot / cold outside." },
    { hr:"Ponesite kišobran!", en:"Take an umbrella!" },
    { hr:"Grmi i sijeva.", en:"It's thundering and lightning." },
    { hr:"Nebo je vedro.", en:"The sky is clear." },
    { hr:"Sunce sja.", en:"The sun is shining." },
    { hr:"Magla je gusta.", en:"The fog is thick." },
    { hr:"Bura puše duž obale.", en:"The bura blows along the coast." },
    { hr:"Ljeto je vruće i suho.", en:"Summer is hot and dry." },
    { hr:"Zima je hladna i kišna.", en:"Winter is cold and rainy." },
  ],
  quiz: [
    { q:"What does 'Kakvo je vrijeme?' mean?", a:"What's the weather like?", opts:["What time is it?","What's the weather like?","What season is it?","How long is the forecast?"] },
    { q:"What is 'thunder' in Croatian?", a:"grom", opts:["munja","kiša","grom","oluja"] },
    { q:"What is the famous cold NE wind on the Croatian coast called?", a:"bura", opts:["maestral","jugo","bura","tramontana"] },
    { q:"Which word means BOTH 'weather' and 'time'?", a:"vrijeme", opts:["prognoza","sat","vrijeme","dan"] },
    { q:"How do you say 'It's snowing'?", a:"Pada snijeg.", opts:["Snijeg je.","Pada snijeg.","Snijega pada.","Ima snijeg."] },
  ],
};

const CLOTHES = {
  title: "Odjeća i obuća — Clothing",
  intro: "Learn Croatian vocabulary for clothing and footwear. You'll need this for shopping, describing people, and everyday conversations.",
  tip: "Most clothing items are feminine nouns (majica, jakna, haljina). 'Obući' means to put on clothes, 'skinuti' means to take off. 'Nositi' means to wear habitually.",
  categories: [
    {
      cat: "Gornji dio / Tops",
      icon: "👕",
      items: [
        { hr:"majica", en:"T-shirt / top", gen:"f" },
        { hr:"košulja", en:"shirt (button-up)", gen:"f" },
        { hr:"bluza", en:"blouse", gen:"f" },
        { hr:"džemper / pulover", en:"sweater / jumper", gen:"m" },
        { hr:"hoodie / dukserica", en:"hoodie / sweatshirt", gen:"f" },
        { hr:"prsluk", en:"vest / waistcoat", gen:"m" },
        { hr:"tanka majica na bretele", en:"tank top / singlet", gen:"f" },
      ]
    },
    {
      cat: "Donji dio / Bottoms",
      icon: "👖",
      items: [
        { hr:"hlače", en:"trousers / pants", gen:"f pl", note:"Always plural in Croatian" },
        { hr:"traperice / džins", en:"jeans", gen:"f pl" },
        { hr:"kratke hlače", en:"shorts", gen:"f pl" },
        { hr:"suknja", en:"skirt", gen:"f" },
        { hr:"tajice", en:"leggings / tights", gen:"f pl" },
        { hr:"odijelo", en:"suit", gen:"n" },
        { hr:"smoking", en:"tuxedo / suit", gen:"m" },
      ]
    },
    {
      cat: "Haljine i kombinezon / Dresses",
      icon: "👗",
      items: [
        { hr:"haljina", en:"dress", gen:"f" },
        { hr:"mini haljina", en:"mini dress", gen:"f" },
        { hr:"večernja haljina", en:"evening gown", gen:"f" },
        { hr:"kombinezon", en:"jumpsuit / overalls", gen:"m" },
      ]
    },
    {
      cat: "Jakne i kaputi / Outerwear",
      icon: "🧥",
      items: [
        { hr:"jakna", en:"jacket", gen:"f" },
        { hr:"kaput", en:"coat", gen:"m" },
        { hr:"zimska jakna", en:"winter jacket", gen:"f" },
        { hr:"kišni ogrtač / mantil", en:"raincoat", gen:"m" },
        { hr:"vjetrovka", en:"windbreaker", gen:"f" },
        { hr:"krzno / bunda", en:"fur coat", gen:"f" },
      ]
    },
    {
      cat: "Obuća / Footwear",
      icon: "👟",
      items: [
        { hr:"cipele", en:"shoes", gen:"f pl", note:"Always plural" },
        { hr:"tenisice / patike", en:"sneakers / trainers", gen:"f pl" },
        { hr:"čizme", en:"boots", gen:"f pl" },
        { hr:"sandale", en:"sandals", gen:"f pl" },
        { hr:"japanke", en:"flip-flops / thongs", gen:"f pl", note:"Literally 'Japanese ones'" },
        { hr:"papuče", en:"slippers", gen:"f pl" },
        { hr:"pete / štikle", en:"high heels", gen:"f pl" },
        { hr:"čarape", en:"socks", gen:"f pl" },
        { hr:"čarape (duge)", en:"stockings / tights", gen:"f pl" },
      ]
    },
    {
      cat: "Dodaci / Accessories",
      icon: "👜",
      items: [
        { hr:"šešir", en:"hat (brimmed)", gen:"m" },
        { hr:"kapa", en:"cap / beanie", gen:"f" },
        { hr:"šal", en:"scarf", gen:"m" },
        { hr:"rukavice", en:"gloves", gen:"f pl" },
        { hr:"naočale", en:"glasses / sunglasses", gen:"f pl" },
        { hr:"sunčane naočale", en:"sunglasses", gen:"f pl" },
        { hr:"narukvica", en:"bracelet", gen:"f" },
        { hr:"ogrlica", en:"necklace", gen:"f" },
        { hr:"prsten", en:"ring", gen:"m" },
        { hr:"torbica", en:"handbag / purse", gen:"f" },
        { hr:"ruksak", en:"backpack / rucksack", gen:"m" },
        { hr:"kaiš / remen", en:"belt", gen:"m" },
        { hr:"kravata", en:"tie / necktie", gen:"f" },
        { hr:"leptir-mašna", en:"bow tie", gen:"f" },
      ]
    },
    {
      cat: "Donje rublje / Underwear",
      icon: "🩲",
      items: [
        { hr:"gaće", en:"underwear (m)", gen:"f pl" },
        { hr:"gaćice", en:"underwear (f) / panties", gen:"f pl" },
        { hr:"grudnjak", en:"bra", gen:"m" },
        { hr:"pijama", en:"pyjamas", gen:"f" },
        { hr:"spavaćica", en:"nightgown", gen:"f" },
      ]
    },
  ],
  phrases: [
    { hr:"Što nosiš?", en:"What are you wearing?" },
    { hr:"Nosim plavu majicu.", en:"I'm wearing a blue T-shirt." },
    { hr:"Mogu li probati ovo?", en:"Can I try this on?" },
    { hr:"Imate li to u drugoj veličini?", en:"Do you have it in another size?" },
    { hr:"Koja je tvoja veličina?", en:"What is your size?" },
    { hr:"Preusko mi je.", en:"It's too tight for me." },
    { hr:"Preveliko mi je.", en:"It's too big for me." },
    { hr:"Preskupo je.", en:"It's too expensive." },
    { hr:"Je li na rasprodaji?", en:"Is it on sale?" },
    { hr:"Koliko stoji?", en:"How much does it cost?" },
    { hr:"Oblači se toplo!", en:"Dress warmly!" },
    { hr:"Svlačionica je tamo.", en:"The changing room is over there." },
  ],
  quiz: [
    { q:"What are 'tenisice'?", a:"sneakers / trainers", opts:["sandals","sneakers / trainers","boots","slippers"] },
    { q:"'Hlače' is always used in which grammatical number?", a:"plural", opts:["singular","plural","dual","either"] },
    { q:"What do 'japanke' literally mean?", a:"Japanese ones", opts:["water shoes","beach shoes","Japanese ones","rubber ones"] },
    { q:"How do you say 'Can I try this on?'", a:"Mogu li probati ovo?", opts:["Mogu li vidjeti ovo?","Mogu li platiti ovo?","Mogu li probati ovo?","Hoću li probati?"] },
    { q:"What is 'ogrlica'?", a:"necklace", opts:["bracelet","ring","necklace","earring"] },
  ],
};

const BODYDESC = {
  title: "Opisivanje izgleda — Physical Description",
  intro: "Learn to describe people's physical appearance in Croatian — height, build, hair, eyes, age, and more. These adjectives must agree with the gender of the person being described.",
  tip: "Adjectives agree with the subject's gender: visok (m) / visoka (f) / visoko (n). When describing 'she has', use 'ima' + accusative.",
  sections: [
    {
      title: "Visina / Height",
      icon: "📏",
      items: [
        { hr:"visok / visoka", en:"tall (m/f)" },
        { hr:"nizak / niska", en:"short (m/f)" },
        { hr:"srednje visine", en:"of medium height" },
        { hr:"Koliko si visok/a?", en:"How tall are you? (m/f)" },
        { hr:"Visok sam 180 cm.", en:"I am 180 cm tall." },
      ]
    },
    {
      title: "Građa / Build",
      icon: "💪",
      items: [
        { hr:"mršav / mršava", en:"slim / thin (m/f)" },
        { hr:"vitak / vitka", en:"slender / trim (m/f)" },
        { hr:"atletski građen/a", en:"athletic build (m/f)" },
        { hr:"snažan / snažna", en:"strong / muscular (m/f)" },
        { hr:"debeo / debela", en:"fat / overweight (m/f)", note:"Use carefully — can be blunt" },
        { hr:"punašan / punašna", en:"chubby / plump (m/f)", note:"Softer than debeo/debela" },
        { hr:"prosječne građe", en:"average build" },
      ]
    },
    {
      title: "Kosa / Hair",
      icon: "💇",
      items: [
        { hr:"crna kosa", en:"black hair" },
        { hr:"smeđa kosa", en:"brown hair / brunette" },
        { hr:"plava kosa", en:"blonde hair" },
        { hr:"crvena kosa", en:"red / auburn hair" },
        { hr:"sijeda kosa", en:"grey / silver hair" },
        { hr:"tamna kosa", en:"dark hair" },
        { hr:"svijetla kosa", en:"light hair" },
        { hr:"kratka kosa", en:"short hair" },
        { hr:"duga kosa", en:"long hair" },
        { hr:"kovrčava kosa", en:"curly hair" },
        { hr:"ravna kosa", en:"straight hair" },
        { hr:"valovita kosa", en:"wavy hair" },
        { hr:"ćelav", en:"bald (m)" },
        { hr:"pramenovi", en:"highlights / streaks" },
      ]
    },
    {
      title: "Oči / Eyes",
      icon: "👁️",
      items: [
        { hr:"plave oči", en:"blue eyes" },
        { hr:"smeđe oči", en:"brown eyes" },
        { hr:"zelene oči", en:"green eyes" },
        { hr:"sive oči", en:"grey eyes" },
        { hr:"tamne oči", en:"dark eyes" },
        { hr:"svijetle oči", en:"light eyes" },
        { hr:"naočale", en:"glasses" },
        { hr:"kontaktne leće", en:"contact lenses" },
      ]
    },
    {
      title: "Lice / Face",
      icon: "😊",
      items: [
        { hr:"brada", en:"beard" },
        { hr:"brkovi", en:"moustache" },
        { hr:"pjege", en:"freckles" },
        { hr:"jamice", en:"dimples" },
        { hr:"bore", en:"wrinkles" },
        { hr:"tetoviranje / tetovaža", en:"tattoo" },
        { hr:"piercing", en:"piercing" },
        { hr:"okruglo lice", en:"round face" },
        { hr:"ovalno lice", en:"oval face" },
        { hr:"dugačko lice", en:"long face" },
      ]
    },
    {
      title: "Dob / Age",
      icon: "🎂",
      items: [
        { hr:"mlad / mlada", en:"young (m/f)" },
        { hr:"star / stara", en:"old (m/f)" },
        { hr:"sredovječan/a", en:"middle-aged (m/f)" },
        { hr:"beba / dojenče", en:"baby / infant" },
        { hr:"dijete (djeca)", en:"child (children)" },
        { hr:"tinejdžer/ka", en:"teenager (m/f)" },
        { hr:"odrasla osoba", en:"adult" },
        { hr:"starija osoba", en:"elderly person" },
        { hr:"Koliko imaš godina?", en:"How old are you?" },
        { hr:"Imam 30 godina.", en:"I am 30 years old." },
        { hr:"Izgleda mlađe od svojih godina.", en:"She/He looks younger than their age." },
      ]
    },
    {
      title: "General Descriptions",
      icon: "✨",
      items: [
        { hr:"lijep / lijepa", en:"handsome / beautiful (m/f)" },
        { hr:"zgodan / zgodna", en:"attractive / good-looking (m/f)" },
        { hr:"simpatičan / simpatična", en:"pleasant / charming (m/f)" },
        { hr:"sladak / slatka", en:"cute / sweet (m/f)" },
        { hr:"uredan / uredna", en:"neat / tidy (m/f)" },
        { hr:"neuredan / neuredna", en:"messy / untidy (m/f)" },
      ]
    },
  ],
  phrases: [
    { hr:"Kako izgleda?", en:"What does he/she look like?" },
    { hr:"On je visok i mršav.", en:"He is tall and slim." },
    { hr:"Ona ima plavu dugu kosu.", en:"She has long blonde hair." },
    { hr:"Ima smeđe oči.", en:"He/She has brown eyes." },
    { hr:"Nosi naočale.", en:"He/She wears glasses." },
    { hr:"Izgleda mlado.", en:"He/She looks young." },
    { hr:"Liči na tatu.", en:"He/She looks like dad." },
    { hr:"Onaj visoki čovjek — tko je to?", en:"That tall man — who is that?" },
    { hr:"Nije ga lako opisati.", en:"He's not easy to describe." },
  ],
  quiz: [
    { q:"How do you say 'She has curly hair'?", a:"Ona ima kovrčavu kosu.", opts:["Ona ima ravnu kosu.","Ona ima kovrčavu kosu.","Ona je kovrčava.","Ona nosi kosu."] },
    { q:"What is the male form of 'visoka' (tall)?", a:"visok", opts:["visoki","visoko","visok","visokan"] },
    { q:"How do you ask 'How old are you?'", a:"Koliko imaš godina?", opts:["Koliko si star?","Koliko imaš godina?","Koja ti je dob?","Koliko ti je?"] },
    { q:"What does 'pjege' mean?", a:"freckles", opts:["dimples","wrinkles","freckles","birthmarks"] },
    { q:"What is the softer word for overweight?", a:"punašan/a", opts:["debeo/debela","krupan/a","punašan/a","težak/a"] },
  ],
};

const PHONOLOGY = {
  title: "Izgovor — Croatian Pronunciation",
  intro: "Croatian spelling is almost perfectly phonetic — one letter, one sound, always. Once you learn the sounds, you can read any Croatian word correctly. This guide covers the letters that differ most from English.",
  tip: "The Croatian alphabet has 30 letters. Every letter is always pronounced the same way — there are no silent letters and no 'magic e'. If you see it, you say it!",
  letters: [
    {
      letter: "č",
      name: "Č (ch-sound, hard)",
      ipa: "/tʃ/",
      like: "Like 'ch' in 'church' or 'cheese'",
      examples: [{ hr:"čaj", en:"tea" }, { hr:"čovjek", en:"man/person" }, { hr:"čitati", en:"to read" }],
      memory: "Č = CHurch (hard CH)",
      color: "#dc2626",
    },
    {
      letter: "ć",
      name: "Ć (ch-sound, soft)",
      ipa: "/tɕ/",
      like: "Softer than Č — like 'ch' in 'cheap' but with tongue touching the palate further forward",
      examples: [{ hr:"ćevapi", en:"grilled meat rolls" }, { hr:"ćerka", en:"daughter (regional)" }, { hr:"doći", en:"to come" }],
      memory: "Ć = soft & tiny CH (note the accent curves inward like a hug)",
      color: "#ea580c",
    },
    {
      letter: "š",
      name: "Š (sh-sound)",
      ipa: "/ʃ/",
      like: "Like 'sh' in 'shop' or 'show'",
      examples: [{ hr:"škola", en:"school" }, { hr:"šuma", en:"forest" }, { hr:"šešir", en:"hat" }],
      memory: "Š = SHop (the caron ˇ looks like a roof — Š shelters like a SHop)",
      color: "#16a34a",
    },
    {
      letter: "ž",
      name: "Ž (zh-sound)",
      ipa: "/ʒ/",
      like: "Like 's' in 'measure' or 'treasure', or French 'j' in 'bonjour'",
      examples: [{ hr:"život", en:"life" }, { hr:"žena", en:"woman/wife" }, { hr:"žuti", en:"yellow" }],
      memory: "Ž = meaZure (voiced SH)",
      color: "#0ea5e9",
    },
    {
      letter: "đ",
      name: "Đ (dj-sound, soft)",
      ipa: "/dʑ/",
      like: "Like 'dj' in 'djinn' or 'j' in English 'yes' but voiced — a soft D+J blend",
      examples: [{ hr:"đak", en:"pupil / student" }, { hr:"đavao", en:"devil" }, { hr:"međunarodni", en:"international" }],
      memory: "Đ = soft DJ (the bar through D = something extra, a softening)",
      color: "#7c3aed",
    },
    {
      letter: "dž",
      name: "DŽ (hard dj-sound)",
      ipa: "/dʒ/",
      like: "Like 'j' in 'jungle' or 'dg' in 'judge' — the hard version of Đ",
      examples: [{ hr:"džep", en:"pocket" }, { hr:"džungla", en:"jungle" }, { hr:"džin", en:"gin / djinn" }],
      memory: "DŽ = Jungle (hard J). Đ is softer, DŽ is harder.",
      color: "#db2777",
    },
    {
      letter: "lj",
      name: "LJ (ly-sound)",
      ipa: "/ʎ/",
      like: "Like 'lli' in 'million' or Italian 'gli' — L and Y blended into one sound",
      examples: [{ hr:"ljubav", en:"love" }, { hr:"ljeto", en:"summer" }, { hr:"ljudi", en:"people" }],
      memory: "LJ = miLlion (the Y-coloured L)",
      color: "#d97706",
    },
    {
      letter: "nj",
      name: "NJ (ny-sound)",
      ipa: "/ɲ/",
      like: "Like 'ny' in 'canyon' or Spanish 'ñ' in 'mañana'",
      examples: [{ hr:"njega", en:"him / care" }, { hr:"Njemačka", en:"Germany" }, { hr:"knjiga", en:"book" }],
      memory: "NJ = caNYon (the Spanish Ñ sound)",
      color: "#059669",
    },
    {
      letter: "r (vocalic)",
      name: "R (vocalic / syllabic R)",
      ipa: "/r̩/",
      like: "R can form a syllable on its own — like 'er' in 'butter' but rolled",
      examples: [{ hr:"trg", en:"square / plaza" }, { hr:"prst", en:"finger" }, { hr:"crkva", en:"church" }],
      memory: "Vocalic R = R as a vowel. 'Trg' has NO vowel other than the R itself!",
      color: "#164e63",
    },
    {
      letter: "c",
      name: "C (ts-sound)",
      ipa: "/ts/",
      like: "Always 'ts' as in 'cats' or 'pizza' — NEVER like English K or S",
      examples: [{ hr:"car", en:"tsar / emperor" }, { hr:"cesta", en:"road" }, { hr:"cvjet", en:"flower" }],
      memory: "C = TSar (always TS, never K or S)",
      color: "#78716c",
    },
    {
      letter: "j",
      name: "J (y-sound)",
      ipa: "/j/",
      like: "Always like 'y' in 'yes' or 'year' — NEVER like English J",
      examples: [{ hr:"ja", en:"I" }, { hr:"jesti", en:"to eat" }, { hr:"jezik", en:"language / tongue" }],
      memory: "J = Yes (always Y, never English J)",
      color: "#6d28d9",
    },
  ],
  confusedPairs: [
    { a:"č", b:"ć", tip:"Č is harder (back of mouth), Ć is softer (front). In speech, many Croatians merge them — but in writing they are distinct.", example_a:"čaj (tea)", example_b:"ćevapi (grilled meat)" },
    { a:"đ", b:"dž", tip:"Đ is soft (like 'dj'), DŽ is hard (like 'jungle j'). Think: Đ gentle, DŽ forceful.", example_a:"đak (student)", example_b:"džep (pocket)" },
    { a:"š", b:"s", tip:"Š = SH sound. S = regular S. They are completely different!", example_a:"šuma (forest)", example_b:"suma (sum/total)" },
    { a:"ž", b:"z", tip:"Ž = ZH (measure). Z = regular Z. Ž is the voiced version of Š.", example_a:"žena (woman)", example_b:"zena — doesn't exist!" },
  ],
  rules: [
    { rule:"One letter = one sound", detail:"Croatian is perfectly phonetic. Every letter always makes the same sound, with zero exceptions." },
    { rule:"No silent letters", detail:"Unlike English, every letter you write is also pronounced. 'Knjiga' = KN-YEE-GA (the K is not silent)." },
    { rule:"Stress", detail:"Stress can fall on any syllable and is not written (unlike Spanish/Italian). You must memorize stress with each word." },
    { rule:"Vowels are pure", detail:"Croatian vowels a, e, i, o, u are pure sounds — they don't glide like English vowels. 'A' is always like the 'a' in 'father'." },
    { rule:"Every vowel is pronounced", detail:"Even adjacent vowels are each pronounced separately. 'Zaobići' has 4 vowels, each distinct." },
  ],
  quiz: [
    { q:"Č and Ć both sound like 'ch'. What is the key difference?", a:"Č is harder, Ć is softer", opts:["Č is softer, Ć is harder","Č is harder, Ć is softer","They are identical sounds","Č is only in loan words"] },
    { q:"How is the letter J always pronounced in Croatian?", a:"Like Y in 'yes'", opts:["Like J in 'jungle'","Like Y in 'yes'","Like H in 'house'","Like G in 'gem'"] },
    { q:"What is special about vocalic R?", a:"R forms a syllable with no vowel", opts:["R is always silent","R sounds like W","R forms a syllable with no vowel","R sounds like L"] },
    { q:"How is the letter C always pronounced in Croatian?", a:"Like TS in 'cats'", opts:["Like K in 'cat'","Like S in 'sun'","Like TS in 'cats'","Like CH in 'church'"] },
    { q:"Which pair causes the most confusion for learners?", a:"Č and Ć", opts:["Š and Ž","Đ and J","Č and Ć","LJ and NJ"] },
  ],
};

export { V, PADEZI, PROVERBS, HIST_FACTS, MEDIA, MAPPLACES, BADGES, LEARN_PATH, REFLEXIVE, SVOJMOJ, BASKETBALL, GYM, CROATIAN_CITIES, COUNTRIES, PROFESSIONS, WEATHER, CLOTHES, BODYDESC, PHONOLOGY, SCENES, FILL_STORIES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, RESTCONV, POSSESS, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH, TOP100, HISTORY, EVENTS, MODAL, GRAM, PLACE, READ, ALPHA, ZNAM, BOJE, CONJ, UNJUMBLE, IDIOMS, PREPS, KINGS, LISTEN, STORIES, NUMTIME, ASPECT, FALSEFR, PREPDRILL, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, PADEZI_FULL, SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, REGIONS, TENSES, GROCERY, RECIPES, ROLEPLAY, CSS, BG_LIGHT, BG_DARK };
export { _fbReady };
export { H, Bar, Spk };
export { initFirebase, hp, gA, sA, gP, sP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, fbOnAuthStateChanged, fbSetUserSecurity, fbGetUserSecurity, fbCreateAccount, loadVoices, getBestVoice, stopAudio, speakAzure, speakGoogle, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getProverbOfDay, getDailyChallenge, getHistFact, getCityOfDay, shMemo, shuffleArr, buildSearchIndex };
