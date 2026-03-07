import React, { useState, useEffect, useCallback, useRef } from "react";
import { _fbReady, _fbAuth, _fbDb, W, H, Bar, Spk, V, PADEZI, PROVERBS, HIST_FACTS, MEDIA, MAPPLACES, BADGES, LEARN_PATH, REFLEXIVE, SCENES, FILL_STORIES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, RESTCONV, POSSESS, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH, TOP100, HISTORY, EVENTS, MODAL, GRAM, PLACE, READ, ALPHA, ZNAM, BOJE, CONJ, UNJUMBLE, IDIOMS, PREPS, KINGS, LISTEN, STORIES, NUMTIME, ASPECT, FALSEFR, PREPDRILL, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, PADEZI_FULL, SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, REGIONS, TENSES, GROCERY, RECIPES, ROLEPLAY, CSS, BG_LIGHT, BG_DARK, initFirebase, hp, gA, sA, gP, sP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, loadVoices, getBestVoice, stopAudio, speakAzure, speakGoogle, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getProverbOfDay, getDailyChallenge, getHistFact, shMemo, shuffleArr, buildSearchIndex } from "./data.jsx";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import WelcomeScreen from "./components/home/WelcomeScreen.jsx";
import PlacementTest from "./components/home/PlacementTest.jsx";
import LearnTab from "./components/learn/LearnTab.jsx";
import CroatiaTab from "./components/croatia/CroatiaTab.jsx";
import ImmersionHub from "./components/croatia/ImmersionHub.jsx";
import AIConversation from "./components/croatia/AIConversation.jsx";
import ProfileTab from "./components/profile/ProfileTab.jsx";
import HomeTab from "./components/home/HomeTab.jsx";
import PracticeTab from "./components/practice/PracticeTab.jsx";
import LessonScreen from "./components/learn/LessonScreen.jsx";
import GrammarScreen from "./components/learn/GrammarScreen.jsx";
import AlphabetScreen from "./components/learn/AlphabetScreen.jsx";
import ReadingList from "./components/learn/ReadingList.jsx";
import ReadingScreen from "./components/learn/ReadingScreen.jsx";
import BadgesScreen from "./components/profile/BadgesScreen.jsx";
import ProfileScreen from "./components/profile/ProfileScreen.jsx";
import VocabJournal from "./components/profile/VocabJournal.jsx";
import FavoritesScreen from "./components/profile/FavoritesScreen.jsx";
import LearnPath from "./components/profile/LearnPath.jsx";
import ProverbsScreen from "./components/croatia/ProverbsScreen.jsx";
import Flashcards from "./components/practice/Flashcards.jsx";
import ListeningScreen from "./components/practice/ListeningScreen.jsx";
import McGame from "./components/practice/McGame.jsx";
import IdiomsScreen from "./components/croatia/IdiomsScreen.jsx";
// Croatia screens
import { TextingScreen, FriendsScreen, FoodOrderScreen, TransportScreen, EmergencyScreen, PopCultureScreen, PracticalScreen, SchoolScreen, GroceryScreen, HistoryScreen as CroatiaHistoryScreen, BasketballScreen, GymScreen } from "./components/croatia/CroatiaCulture.jsx";
import HNLScreen from "./components/croatia/HNLScreen.jsx";
import { RegionScreen, RoleplayScreen, RecipesScreen } from "./components/croatia/RegionScreens.jsx";
import { EventsCalendar, Top100Screen } from "./components/croatia/EventsTop100.jsx";
import KingsScreen from "./components/croatia/KingsScreen.jsx";
import CrMap from "./components/croatia/CrMap.jsx";
// Grammar reference screens
import { AspectScreen, FalseFriendsScreen, DeclensionScreen, BrzaliceScreen, DialectsScreen, DiminutivesScreen, WordFormScreen, ColorQuirkScreen, SvojMojScreen } from "./components/learn/GrammarRef.jsx";
// Learn screens
import ModalScreen from "./components/learn/ModalScreen.jsx";
import PadeziScreen from "./components/learn/PadeziScreen.jsx";
import PadezifullScreen from "./components/learn/PadezifullScreen.jsx";
import TensesScreen from "./components/learn/TensesScreen.jsx";
// Exercises
import { ReflexiveScreen, FillStoryScreen, ConvMatchScreen, ScenesScreen, PronounsScreen, GenderDrillScreen, SentenceBuilderScreen, VerbDrillScreen } from "./components/practice/exercises/Exercises1.jsx";
import { TenseFlipScreen, RiddlesScreen, LogicQuizScreen, OrdinalsScreen, RelativePronounsScreen, EmotionGenderScreen, OppositesScreen, CityLocativeScreen, AccusativeDrillScreen } from "./components/practice/exercises/Exercises2.jsx";
import { ColorAgreementScreen, PossessivesScreen, QuestionWordsScreen, NegationScreen, SibilarizationScreen, RestaurantScreen, ProfessionGenderScreen, ComparativesScreen, FutureTenseScreen } from "./components/practice/exercises/Exercises3.jsx";
// Practice game screens
import McResult from "./components/practice/McResult.jsx";
import StoryScreens from "./components/practice/StoryScreens.jsx";
import NumTime from "./components/practice/NumTime.jsx";
import Unjumble from "./components/practice/Unjumble.jsx";
import PrepDrill from "./components/practice/PrepDrill.jsx";
import TypingScreen from "./components/practice/TypingScreen.jsx";
import ConjugationDrill from "./components/practice/ConjugationDrill.jsx";
import ZnamGame from "./components/practice/ZnamGame.jsx";
import BojeGame from "./components/practice/BojeGame.jsx";
import MatchGame from "./components/practice/MatchGame.jsx";
import WordSprint from "./components/practice/WordSprint.jsx";
import SpeakingScreen from "./components/practice/SpeakingScreen.jsx";
// Profile screens
import Leaderboard from "./components/profile/Leaderboard.jsx";

const BG = BG_LIGHT;

var _appNavDepth=0;
function pushUrl(path){try{if(window.location.pathname!==path){_appNavDepth++;window.history.pushState({_ad:_appNavDepth},"",path)}}catch(e){}}

function App(){
  const[as,setAs]=useState("loading"); // auth screen
  const[au,setAu]=useState(null); // auth user
  const[em,setEm]=useState("");const[pw,setPw]=useState("");const[pc,setPc]=useState("");const[dn,setDn]=useState("");
  const[sq,setSq]=useState("");const[sa,setSa]=useState("");const[rpEm,setRpEm]=useState("");const[rpSa,setRpSa]=useState("");const[rpPw,setRpPw]=useState("");const[rpPc,setRpPc]=useState("");const[rpStep,setRpStep]=useState(1);const[rpQ,setRpQ]=useState("");
  const[ae,setAe]=useState("");const[al,setAl]=useState(false);const[sp,setSp2]=useState(false);
  const ds={xp:0,str:1,diff:"beginner",lc:0,pf:0,gc:0,sp:0,de:0,rc:0,al:0,mv:0,hi:0,rs:[],ct:[],badges:[]};
  const[scr,_setScr]=useState("welcome");
  const setScr=useCallback(function(s){
    _setScr(s);
    if(s==="welcome"||s==="placement")return;
    pushUrl(s==="dashboard"?"/":`/${s}`);
  },[]);
  const[name,setName]=useState("");
  const[st,setSt]=useState(ds);
  const[pi,sPi]=useState(0);const[ps,sPs]=useState(0);const[pa,sPa]=useState(false);const[px,sPx]=useState(-1);const[pq,sPq]=useState([]);
  const[lt,sLt]=useState(null);const[li,sLi]=useState([]);const[lx,sLx]=useState(0);const[ls,sLs]=useState(0);const[lp,sLp]=useState("learn");const[la,sLa]=useState(false);const[lsl,sLsl]=useState(-1);const[qi,sQi]=useState([]);
  const[gl,sGl]=useState(null);const[gx,sGx]=useState(0);const[gp,sGp]=useState("learn");const[gs,sGs]=useState(0);const[ga,sGa]=useState(false);const[gsl,sGsl]=useState(-1);
  const[gt,sGt]=useState(null);const[gsc,sGsc]=useState(0);const[gph,sGph]=useState("play");const[mp,sMp]=useState([]);const[msl,sMsl]=useState([]);const[mm,sMm]=useState([]);
  const[mcQ,sMcQ]=useState([]);const[mcI,sMcI]=useState(0);const[mcS,sMcS]=useState(0);const[mcA,sMcA]=useState(false);const[mcSl,sMcSl]=useState(-1);
  const[rp,sRp]=useState(null);const[rph,sRph]=useState("read");const[rqi,sRqi]=useState(0);const[rsc,sRsc]=useState(0);const[ra,sRa]=useState(false);const[rsl,sRsl]=useState(-1);const[hw,sHw]=useState(null);
  const[sw,sSw]=useState(null);const[sr,sSr]=useState(null);const[sx,sSx]=useState(0);const[si,sSi]=useState([]);const[ssc,sSsc]=useState(0);
  const[m7,sM7]=useState("menu");const[m7i,sM7i]=useState(0);const[m7s,sM7s]=useState(0);const[m7a,sM7a]=useState(false);const[m7sl,sM7sl]=useState(-1);const[m7o,sM7o]=useState([]);const[m7q,sM7q]=useState([]);const[m7v,sM7v]=useState(0);
  const[znSec,sZnSec]=useState(0);const[znIdx,sZnIdx]=useState(0);const[znSc,sZnSc]=useState(0);const[znAns,sZnAns]=useState(false);const[znSel,sZnSel]=useState(-1);const[znOpts,sZnOpts]=useState([]);const[znMode,sZnMode]=useState("menu");
  const[bjMode,sBjMode]=useState("learn");const[bjIdx,sBjIdx]=useState(0);const[bjSc,sBjSc]=useState(0);const[bjAns,sBjAns]=useState(false);const[bjSel,sBjSel]=useState(-1);const[bjOpts,sBjOpts]=useState([]);const[bjQ,sBjQ]=useState([]);
  const[cjMode,sCjMode]=useState("menu");const[cjQ,sCjQ]=useState([]);const[cjI,sCjI]=useState(0);const[cjS,sCjS]=useState(0);const[cjA,sCjA]=useState(false);const[cjSl,sCjSl]=useState(-1);const[cjO,sCjO]=useState([]);
  const[czMode,sCzMode]=useState("learn");const[kgTab,sKgTab]=useState("timeline");
  const[fcPool,sFcPool]=useState([]);const[fcI,sFcI]=useState(0);const[fcFlip,sFcFlip]=useState(false);const[fcKnow,sFcKnow]=useState(0);
  const[lsQ,sLsQ]=useState([]);const[lsI,sLsI]=useState(0);const[lsS,sLsS]=useState(0);const[lsA,sLsA]=useState(false);const[lsSl,sLsSl]=useState(-1);const[lsO,sLsO]=useState([]);
  const[stSt,sStSt]=useState(null);const[stSc,sStSc]=useState(0);
  const[ntQ,sNtQ]=useState([]);const[ntI,sNtI]=useState(0);const[ntS,sNtS]=useState(0);const[ntA,sNtA]=useState(false);const[ntSl,sNtSl]=useState(-1);const[ntO,sNtO]=useState([]);const[czI,sCzI]=useState(0);const[czS,sCzS]=useState(0);const[czA,sCzA]=useState(false);const[czSl,sCzSl]=useState(-1);const[czO,sCzO]=useState([]);const[czQ,sCzQ]=useState([]);
  const[ujQ,sUjQ]=useState([]);const[ujI,sUjI]=useState(0);const[ujS,sUjS]=useState(0);const[ujIn,sUjIn]=useState("");const[ujA,sUjA]=useState(false);
  const[asQ,sAsQ]=useState([]);const[asI,sAsI]=useState(0);const[asS,sAsS]=useState(0);const[asA,sAsA]=useState(false);const[asSl,sAsSl]=useState(-1);const[asO,sAsO]=useState([]);const[asMode,sAsMode]=useState("learn");
  const[ppQ,sPpQ]=useState([]);const[ppI,sPpI]=useState(0);const[ppS,sPpS]=useState(0);const[ppA,sPpA]=useState(false);const[ppSl,sPpSl]=useState(-1);
  const[dcNoun,sDcNoun]=useState(0);const[dcMode,sDcMode]=useState("learn");const[dcI,sDcI]=useState(0);const[dcS,sDcS]=useState(0);const[dcA,sDcA]=useState(false);const[dcSl,sDcSl]=useState(-1);const[dcO,sDcO]=useState([]);const[dcQ,sDcQ]=useState([]);
  const[tyW,sTyW]=useState(null);const[tyIn,sTyIn]=useState("");const[tyI,sTyI]=useState(0);const[tyS,sTyS]=useState(0);const[tyA,sTyA]=useState(false);const[tyPool,sTyPool]=useState([]);
  const[curEx,sCurEx]=useState("");
  const[dchlA,sDchlA]=useState(function(){var n=new Date();var k=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');return localStorage.getItem("dcDay")===k}());const[dchlSl,sDchlSl]=useState(-1);
  const[pfTab,sPfTab]=useState("sing");const[pfGender,sPfGender]=useState("f");const[pfMode,sPfMode]=useState("learn");
  const[pfQ,sPfQ]=useState([]);const[pfI,sPfI]=useState(0);const[pfS,sPfS]=useState(0);const[pfA,sPfA]=useState(false);const[pfSl,sPfSl]=useState(-1);const[pfO,sPfO]=useState([]);const[pfCase,sPfCase]=useState("");const[pfCaseA,sPfCaseA]=useState(false);const[pfCaseSl,sPfCaseSl]=useState(-1);
  const[famData,setFamData]=useState(null);const[famMembers,setFamMembers]=useState([]);const[famLoading,setFamLoading]=useState(false);
  const[famName,setFamName]=useState("");const[famCode,setFamCode]=useState("");const[famErr,setFamErr]=useState("");const[famTab,setFamTab]=useState("main");
  const[tab,_setTab]=useState("home");
  const TAB_PATHS={home:"/",learn:"/learn",practice:"/practice",croatia:"/croatia",profile:"/profile"};
  const setTab=useCallback(function(t){_setTab(t);pushUrl(TAB_PATHS[t]||"/");},[]);
  const[tnVerb,setTnVerb]=useState(0);const[tnTense,setTnTense]=useState("present");const[tnGender,setTnGender]=useState("m");const[tnMode,setTnMode]=useState("learn");const[tnQ,setTnQ]=useState([]);const[tnI,setTnI]=useState(0);const[tnS,setTnS]=useState(0);const[tnA,setTnA]=useState(false);const[tnSl,setTnSl]=useState(-1);const[tnO,setTnO]=useState([]);
  const[mapCat,setMapCat]=useState("all");const[mapSel,setMapSel]=useState(null);
  const[rpIdx,setRpIdx]=useState(0);const[rpLine,setRpLine]=useState(0);const[rpShow,setRpShow]=useState(false);
  const[rcIdx,setRcIdx]=useState(0);const[rcServ,setRcServ]=useState(4);const[rcTimer,setRcTimer]=useState(null);const[rcTimerVal,setRcTimerVal]=useState(0);
  const[jWords,setJWords]=useState(function(){try{return JSON.parse(localStorage.getItem("uJournal")||"[]")}catch{return[]}});const[jIn,setJIn]=useState("");const[jEn,setJEn]=useState("");
  const[darkMode,setDarkMode]=useState(function(){return localStorage.getItem("darkMode")==="true"});
  const[favs,setFavs]=useState(function(){try{return JSON.parse(localStorage.getItem("uFavs")||"[]")}catch{return[]}});
  const[srchQ,setSrchQ]=useState("");const[srchR,setSrchR]=useState([]);const[srchOpen,setSrchOpen]=useState(false);
  var toggleFav=function(item){var key=item.hr||item.name;var exists=favs.some(function(f){return(f.hr||f.name)===key});var nf=exists?favs.filter(function(f){return(f.hr||f.name)!==key}):[{hr:item.hr,en:item.en,type:item.type||"custom",go:item.go}].concat(favs);setFavs(nf);localStorage.setItem("uFavs",JSON.stringify(nf))};
  var isFav=function(key){return favs.some(function(f){return(f.hr||f.name)===key})};
  var doSearch=function(q){if(!q.trim()){setSrchR([]);return}var idx=buildSearchIndex();var lq=q.toLowerCase();setSrchR(idx.filter(function(i){return(i.hr&&i.hr.toLowerCase().indexOf(lq)>=0)||(i.en&&i.en.toLowerCase().indexOf(lq)>=0)}).slice(0,15))};
  var getWeekStats=function(){var sr=getSR();var weak=Object.values(sr).filter(function(v){return v.w>v.r}).length;var strong=Object.values(sr).filter(function(v){return v.r>v.w}).length;return{lessons:st.lc,grammar:st.gc,streak:getStreak().count,weak:weak,strong:strong}};
  const[tDir,sTDir]=useState("en-hr");const[tIn,sTIn]=useState("");const[tOut,sTOut]=useState("");const[tL,sTL]=useState(false);
  const[t1k,sT1k]=useState(null);
  const[hIdx,sHIdx]=useState(0);
  const[evM,sEvM]=useState(new Date().getMonth()+1);
  const[showXP,setShowXP]=useState(false);const[xpA,setXpA]=useState(0);const[nB,setNB]=useState(null);const[sB,setSB]=useState(false);
  useEffect(()=>{initFirebase();
    const s=gS();if(s&&s.u){if(isSessionExpired()){cS();setAs("login");setTimeout(function(){setAe("\u2705 Your session expired. Your account is safe \u2014 just sign in again.")},200);return}const a=gA();if(a[s.u]){const p=gP(s.u);setAu({u:s.u,d:a[s.u].d,e:a[s.u].e||s.u});touchSession();updateStreak();var lf=getLocalFamily();if(lf)setFamData(lf);if(p){setName(p.name||a[s.u].d);setSt(p.st||ds);setScr((p.cp||(p.st&&(p.st.xp>0||p.st.lc>0)))?"dashboard":"welcome")}else setName(a[s.u].d);setAs("app");}else{
      if(_fbReady&&_fbAuth){
        _fbAuth.onAuthStateChanged(function(user){
          if(user){var dn=user.displayName||user.email;var k=user.email;
            var a=gA();var ex=a[k]||{};ex.d=dn;ex.e=k;a[k]=ex;sA(a);
            fbLoadProgress(k).then(function(fp){if(fp)sP(k,fp);
              setAu({u:k,d:dn,e:k});sS({u:k});touchSession();updateStreak();
              fbLoadUserFamily(k).then(function(f){if(f)setFamData(f)});
              var p=fp||gP(k);if(p){setName(p.name||dn);setSt(p.st||ds);setScr((p.cp||(p.st&&(p.st.xp>0||p.st.lc>0)))?"dashboard":"welcome")}else setName(dn);
              setAs("app")})
          }else{
            // Firebase has no user — only clear session if there is no local account to fall back to
            var _s=gS();var _a=gA();
            if(_s&&_s.u&&_a[_s.u]){setAs("login")}else{cS();setAs("login")}}})
      }else{setAs("login")}}}else setAs("login")
  },[]);
  useEffect(()=>{if(au&&as==="app"){sP(au.u,{name,st,cp:scr!=="welcome"&&scr!=="placement"});touchSession()}},[st,scr,name,au,as]);
  useEffect(()=>{if(as!=="app")return;const iv=setInterval(()=>{if(isSessionExpired()){cS();setAu(null);setSt(ds);setScr("welcome");setName("");setAs("login")}},5*60*1000);return()=>clearInterval(iv)},[as]);
  useEffect(()=>{if(as!=="app")return;const h=()=>touchSession();window.addEventListener("click",h);window.addEventListener("touchstart",h);window.addEventListener("keydown",h);return()=>{window.removeEventListener("click",h);window.removeEventListener("touchstart",h);window.removeEventListener("keydown",h)}},[as]);
  async function doReg(){
    setAe("");if(!em.trim()||!isValidEmail(em.trim())){setAe("Please enter a valid email address.");return}if(!pw||pw.length<6){setAe("Password must be at least 6 characters.");return}if(pw!==pc){setAe("Passwords do not match.");return}if(!dn.trim()){setAe("Please enter your display name.");return}
    if(!sq.trim()){setAe("Please select a security question.");return}if(!sa.trim()||sa.trim().length<2){setAe("Please enter a security answer (2+ characters).");return}
    setAl(true);try{initFirebase();const k=em.trim().toLowerCase();
    // Block re-registration of existing local account
    var existingAccts=gA();if(existingAccts[k]){setAe("An account with this email already exists. Please sign in instead.");setAl(false);return}
    if(_fbReady){var fb=await fbRegister(k,pw,dn.trim());
    // fb.err is already friendly-fied — match against friendly message substrings
    if(!fb.ok&&fb.err.indexOf("already")>=0){setAe("An account with this email already exists. Please sign in instead.");setAl(false);return}
    if(!fb.ok&&(fb.err.indexOf("least 6")>=0||fb.err.indexOf("weak")>=0)){setAe("Password is too weak. Use at least 6 characters.");setAl(false);return}
    if(!fb.ok&&fb.err.indexOf("valid email")>=0){setAe("Please enter a valid email address.");setAl(false);return}
    // Other Firebase errors (network, etc.) — fall through and create local account anyway
    if(fb.ok){try{var id=k.replace(/[.#$/\[\]]/g,"_");await _fbDb.collection("users").doc(id).set({sq:sq.trim(),sa:(await hp(sa.trim().toLowerCase()))},{merge:true})}catch(e){}}}
    const a=gA();const h=await hp(pw);const sah=await hp(sa.trim().toLowerCase());a[k]={p:h,d:dn.trim(),e:k,sq:sq.trim(),sa:sah,created:Date.now()};sA(a);
    setAu({u:k,d:dn.trim(),e:k});sS({u:k});setName(dn.trim());setSt(ds);setScr("welcome");setAs("app");setEm("");setPw("");setPc("");setDn("");setSq("");setSa("")}catch(e){setAe("Registration failed. Please try again.")}setAl(false)
  }
  async function doReset(){
    setAe("");initFirebase();
    if(rpStep===1){
      if(!rpEm.trim()||!isValidEmail(rpEm.trim())){setAe("Please enter your email address.");return}
      var k=rpEm.trim().toLowerCase();var sqFound="";var saFound="";
      var a=gA();if(a[k]&&a[k].sq){sqFound=a[k].sq;saFound=a[k].sa}
      if(!sqFound&&_fbReady&&_fbDb){
        try{var id=k.replace(/[.#$/\[\]]/g,"_");var doc=await _fbDb.collection("users").doc(id).get();
        if(doc.exists&&doc.data().sq){sqFound=doc.data().sq;saFound=doc.data().sa}
        else if(doc.exists&&!doc.data().sq){
          var fb=await fbResetPassword(k);
          if(fb.ok){setAs("login");setTimeout(function(){setAe("\u2705 Password reset email sent! Check your inbox.")},100);return}
          else{setAe(fb.err);return}}
        }catch(e){}}
      if(!sqFound){
        if(_fbReady){var fb2=await fbResetPassword(k);
          if(fb2.ok){setAs("login");setTimeout(function(){setAe("\u2705 Password reset email sent! Check your inbox.")},100);return}}
        setAe("No account found with this email.");return}
      localStorage.setItem("_rpSaHash",saFound);localStorage.setItem("_rpEmail",k);
      setRpQ(sqFound);setRpStep(2)}
    else if(rpStep===2){
      if(!rpSa.trim()){setAe("Please enter your security answer.");return}
      var sah=await hp(rpSa.trim().toLowerCase());
      var stored=localStorage.getItem("_rpSaHash");
      if(sah!==stored){setAe("Incorrect security answer. Please try again.");return}
      setRpStep(3)}
    else if(rpStep===3){
      if(!rpPw||rpPw.length<6){setAe("New password must be at least 6 characters.");return}
      if(rpPw!==rpPc){setAe("Passwords do not match.");return}
      var k=localStorage.getItem("_rpEmail");
      var a=gA();if(a[k]){a[k].p=await hp(rpPw);sA(a)}
      if(_fbReady&&_fbAuth){
        try{
          // Try to create Firebase account for users who only had local accounts
          await _fbAuth.createUserWithEmailAndPassword(k,rpPw);
        }catch(e){
          // Account already exists in Firebase — send password reset email instead
          try{await _fbAuth.sendPasswordResetEmail(k)}catch(e2){}
        }}
      localStorage.removeItem("_rpSaHash");localStorage.removeItem("_rpEmail");
      setAe("");setRpEm("");setRpSa("");setRpPw("");setRpPc("");setRpStep(1);setRpQ("");
      setAs("login");setTimeout(function(){setAe("\u2705 Password reset! Sign in with your new password.")},100)}
  }
  async function doLog(){
    setAe("");if(!em.trim()||!isValidEmail(em.trim())){setAe("Please enter a valid email address.");return}if(!pw){setAe("Please enter your password.");return}setAl(true);
    try{
    initFirebase();const k=em.trim().toLowerCase();var fbResult=null;
    // Try Firebase first
    if(_fbReady){try{fbResult=await fbLogin(k,pw);}catch(e){fbResult=null;}}
    if(fbResult&&fbResult.ok){
      // Firebase success — log in and sync local hash for future offline use
      var fbProgress=await fbLoadProgress(k);var fdn=fbResult.user.displayName||k;
      var fa=gA();var fex=fa[k]||{};fex.d=fdn;fex.e=k;
      try{fex.p=await hp(pw);}catch(e){}  // sync hash — critical so local fallback always works
      fa[k]=fex;sA(fa);if(fbProgress)sP(k,fbProgress);
      setAu({u:k,d:fdn,e:k});sS({u:k});
      var fp=fbProgress||gP(k);if(fp){setName(fp.name||fdn);setSt(fp.st||ds);setScr((fp.cp||(fp.st&&(fp.st.xp>0||fp.st.lc>0)))?"dashboard":"welcome")}else setName(fdn);
      setAs("app");setEm("");setPw("");fbLoadUserFamily(k).then(function(f){if(f)setFamData(f)});setAl(false);return;}
    // Hard-stop only on rate limiting
    if(fbResult&&fbResult.err&&fbResult.err.indexOf("Too many attempts")>=0){setAe(fbResult.err);setAl(false);return;}
    // Local account fallback
    var la=gA();
    if(!la[k]){setAe("No account found with this email. Please check your email or create a new account.");setAl(false);return;}
    if(la[k].p){
      var lh=await hp(pw);
      if(la[k].p===lh){
        setAu({u:k,d:la[k].d,e:k});sS({u:k});var lp=gP(k);
        if(lp){setName(lp.name||la[k].d);setSt(lp.st||ds);setScr((lp.cp||(lp.st&&(lp.st.xp>0||lp.st.lc>0)))?"dashboard":"welcome")}else setName(la[k].d);
        setAs("app");setEm("");setPw("");setAl(false);return;}
      // Account exists but password wrong — always this message, never Firebase's "no account found"
      setAe("Incorrect password. Try again or use Forgot Password.");setAl(false);return;}
    // Account record exists but has no password hash — guide to reset
    setAe("Please use 'Forgot Password' to restore access to your account.");
    }catch(e){setAe("Login failed. Please try again.")}setAl(false)
  }
  function doOut(){fbLogout();cS();setAu(null);setSt(ds);setScr("welcome");setName("");setFamData(null);setFamMembers([]);setAs("login")}
  const doTr=async()=>{
    const t=tIn.trim();if(!t)return;sTL(true);sTOut("");
    const[s,g]=tDir==="en-hr"?["en","hr"]:["hr","en"];
    try{const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${s}|${g}`);const d=await r.json();if(d.responseStatus===200&&d.responseData?.translatedText)sTOut(d.responseData.translatedText);else if(d.responseStatus===429||String(d.responseDetails||"").toLowerCase().includes("limit"))sTOut("Daily translation limit reached. Try again tomorrow or visit translate.google.com");else sTOut("Translation unavailable. Try translate.google.com")}catch(e){sTOut("Network error — check your connection.")}sTL(false)
  };
// ═══ ANTI-GAMING: XP COOLDOWN SYSTEM ═══
function canEarnXP(exerciseId){
  try{
    var cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");
    var today=new Date().toISOString().slice(0,10);
    if(cd[exerciseId]===today)return false;
    return true;
  }catch(e){return true}
}
function markExerciseDone(exerciseId){
  try{
    var cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");
    var today=new Date().toISOString().slice(0,10);
    cd[exerciseId]=today;
    var clean={};
    for(var k in cd){if(cd[k]===today)clean[k]=cd[k]}
    localStorage.setItem("xpCooldown",JSON.stringify(clean));
  }catch(e){}
}
  // ═══ BROWSER BACK BUTTON SUPPORT (popstate) ═══
  useEffect(function(){
    // Mark baseline so we can detect when back would exit the app
    window.history.replaceState({_ad:0},"",window.location.pathname);
    var tabByPath={"/":"home","/learn":"learn","/practice":"practice","/croatia":"croatia","/profile":"profile"};
    // Maps every screen name to its parent tab so nav bar stays in sync
    var screenTab={
      lesson:"learn",grammar:"learn",padezi:"learn",padezifull:"learn",modal:"learn",tenses:"learn",
      alphabet:"learn",reading:"learn",read:"learn",readinglist:"learn",readlist:"learn",aspect:"learn",falsefr:"learn",
      declension:"learn",brzalice:"learn",dialects:"learn",diminutives:"learn",wordform:"learn",colorquirk:"learn",svojmoj:"learn",
      mcgame:"practice",mcresult:"practice",flashcards:"practice",match:"practice",typing:"practice",
      listening:"practice",speaking:"practice",znam:"practice",boje:"practice",conj:"practice",conjdrill:"practice",
      unjumble:"practice",prepdrill:"practice",numtime:"practice",wordsprint:"practice",
      profgender:"practice",comparatives:"practice",future:"practice",sibil:"practice",restaurant:"practice",
      qwords:"practice",negation:"practice",possess:"practice",coloragree:"practice",opposites:"practice",
      cityloc:"practice",akudrill:"practice",ordinals:"practice",relpron:"practice",emogender:"practice",
      verbdrill:"practice",tenseflip:"practice",riddles:"practice",logicquiz:"practice",pronouns:"practice",
      genderdrill:"practice",sentbuild:"practice",reflexive:"practice",fillstory:"practice",
      convmatch:"practice",scenes:"practice",storyselect:"practice",story:"practice",
      proverbs:"practice",idioms:"practice",
      region_labin:"croatia",region_bibinje:"croatia",region_hercegovina:"croatia",
      region_vukovar:"croatia",region_vinkovci:"croatia",immersion:"croatia",aiconvo:"croatia",crmap:"croatia",
      history:"croatia",kings:"croatia",grocery:"croatia",recipes:"croatia",roleplay:"croatia",
      texting:"croatia",friends:"croatia",foodorder:"croatia",transport:"croatia",emergency:"croatia",
      football:"croatia",popculture:"croatia",practical:"croatia",school:"croatia",basketball:"croatia",gym:"croatia",
      top100:"croatia",events:"croatia",
      badges:"profile",leaderboard:"profile",vocabjournal:"profile",favorites:"profile",learnpath:"profile",
    };
    function onPopState(e){
      var p=window.location.pathname;
      // Tab-root paths → restore dashboard + correct tab
      if(tabByPath[p]!==undefined){_setScr("dashboard");_setTab(tabByPath[p]);return;}
      var s=p.slice(1);
      // Unknown or auth paths → safe fallback to home dashboard
      if(!s||s==="welcome"||s==="placement"){_setScr("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");return;}
      // Restore screen + sync nav tab
      _setScr(s);
      if(screenTab[s])_setTab(screenTab[s]);
    }
    window.addEventListener("popstate",onPopState);
    return function(){window.removeEventListener("popstate",onPopState)};
  },[]);// eslint-disable-line
  const award=useCallback((amt)=>{
    if(curEx&&!canEarnXP(curEx)){setXpA(0);setShowXP(true);setTimeout(()=>setShowXP(false),2000);return}
    setXpA(amt);setShowXP(true);
    setSt(s=>{const n={...s,xp:s.xp+amt};const nb=BADGES.filter(b=>!s.badges.includes(b.id)&&b.r(n));if(nb.length){n.badges=[...s.badges,...nb.map(b=>b.id)];setTimeout(()=>{setNB(nb[0]);setSB(true);setTimeout(()=>setSB(false),3000)},600)}return n});
    setTimeout(()=>setShowXP(false),1500)
  },[]);
  function goBack(){
    if(curEx)markExerciseDone(curEx);
    sCurEx("");
    // Only use browser back if we have an in-app history entry to return to.
    // history.state._ad === 0 means we're at the app baseline — going back
    // would exit the SPA entirely. Instead, fall back to the home dashboard.
    var depth=(window.history.state&&window.history.state._ad)||0;
    if(depth>0){window.history.back();}
    else{_setScr("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");}
  }
  const level=lvl(st.xp);
  const topics=Object.keys(V[st.diff==="beginner"?"greetings"in V?0:0:0]||V);
  const allCats=Object.keys(V);
  const icons={greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾",body:"🦴","body & face":"🦴",colors:"🎨",home:"🏠","home & rooms":"🏠",clothing:"👔",weather:"☀️","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏",time:"📅","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖","commands at home":"🏡","fairy tales":"📜",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊"};
  // ═══ AUTH SCREENS ═══
  if(as==="loading")return (
    <div
      style={{...BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>
        {CSS}
      </style>
      <div style={{textAlign:"center",animation:"rise .6s"}}>
        <div style={{fontSize:64,animation:"boat 3s ease-in-out infinite"}}>
          ⛵
        </div>
        <p style={{color:"#78716c",marginTop:16,fontWeight:600}}>
          Loading...
        </p>
      </div>
    </div>
  );
  if(as==="login"||as==="register"){
    return <LoginScreen as={as} ae={ae} al={al} em={em} pw={pw} pc={pc} dn={dn} sp={sp} sq={sq} sa={sa} setAs={setAs} setAe={setAe} setEm={setEm} setPw={setPw} setPc={setPc} setDn={setDn} setSp2={setSp2} setSq={setSq} setSa={setSa} setRpEm={setRpEm} setRpSa={setRpSa} setRpPw={setRpPw} setRpPc={setRpPc} setRpStep={setRpStep} setRpQ={setRpQ} doLog={doLog} doReg={doReg} />;
  }
  // ═══ RESET PASSWORD SCREEN ═══
  if(as==="reset"){
    return <ResetPassword ae={ae} rpEm={rpEm} rpSa={rpSa} rpPw={rpPw} rpPc={rpPc} rpStep={rpStep} rpQ={rpQ} setAs={setAs} setAe={setAe} setRpEm={setRpEm} setRpSa={setRpSa} setRpPw={setRpPw} setRpPc={setRpPc} setRpStep={setRpStep} setRpQ={setRpQ} doReset={doReset} />;
  }
    // ═══ MAIN APP RENDER ═══
  return (
    <div style={darkMode?Object.assign({},BG_DARK):BG_LIGHT}>
      <style>
        {CSS}
      </style>
      <W />
      <XPPopup showXP={showXP} xpA={xpA} />
      <BadgeToast show={sB} badge={nB} />
      {scr==="welcome" && <WelcomeScreen name={name} au={au} st={st} setScr={setScr} setName={setName} sPq={sPq} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} />}
      {scr==="placement" && <PlacementTest pq={pq} pi={pi} ps={ps} pa={pa} px={px} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} setScr={setScr} setSt={setSt} />}
      {// ═══ DASHBOARD ═══
      scr==="dashboard"&&<div className="dash">
        {// ═══ TAB: HOME ═══
        tab==="home"&&<HomeTab
          name={name} level={level} st={st}
          tDir={tDir} sTDir={sTDir} tIn={tIn} sTIn={sTIn} tOut={tOut} tL={tL} doTr={doTr}
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          getWeekStats={getWeekStats}
          award={award}
          setTab={setTab} setScr={setScr}
          allCats={allCats} sh={sh}
          sMcQ={sMcQ} sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl}
          sFcPool={sFcPool} sFcI={sFcI} sFcFlip={sFcFlip} sFcKnow={sFcKnow}
        />}
        <div style={{position:"relative",marginBottom:20}}>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none",opacity:.4}}>🔍</span>
            <input
              type="text"
              value={srchQ}
              onChange={function(e){setSrchQ(e.target.value);doSearch(e.target.value);setSrchOpen(true)}}
              onFocus={function(){if(srchQ)setSrchOpen(true)}}
              placeholder="Search words, phrases, screens…"
              style={{width:"100%",padding:"12px 16px 12px 44px",fontSize:14,borderRadius:14,border:"1.5px solid #e2e8f0",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}} />
          </div>
          {srchOpen&&srchR.length>0&&<div
            style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"white",borderRadius:16,
              boxShadow:"0 12px 40px rgba(0,0,0,.14)",zIndex:100,maxHeight:320,overflow:"auto",
              border:"1.5px solid #e2e8f0"}}>
            {srchR.map(function(r,i){return (
              <div
                key={i}
                style={{padding:"11px 16px",borderBottom:"1px solid #f8fafc",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"background .1s"}}
                onMouseOver={function(e){e.currentTarget.style.background="#f8fafc"}}
                onMouseOut={function(e){e.currentTarget.style.background="white"}}
                onClick={function(){setSrchOpen(false);setSrchQ("");setScr(r.go)}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#0f172a"}}>{r.hr}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:1}}>{r.en}</div>
                </div>
                <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,fontWeight:700,
                  background:r.type==="vocab"?"#dbeafe":r.type==="screen"?"#dcfce7":"#fef9c3",
                  color:r.type==="vocab"?"#1d4ed8":r.type==="screen"?"#166534":"#a16207"}}>
                  {r.type}
                </span>
              </div>
            );})}
            <div style={{padding:"10px",textAlign:"center",fontSize:12,color:"#94a3b8",cursor:"pointer",borderTop:"1px solid #f1f5f9"}}
              onClick={function(){setSrchOpen(false)}}>
              Close
            </div>
          </div>}
        </div>
        {// ═══ TAB: LEARN ═══
        tab==="learn"&&<LearnTab
          allCats={allCats} icons={icons} setScr={setScr} sCurEx={sCurEx}
          sh={sh} sLt={sLt} sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl}
          setTnVerb={setTnVerb} setTnTense={setTnTense} setTnGender={setTnGender} setTnMode={setTnMode}
          sCzMode={sCzMode} sPfTab={sPfTab} sPfGender={sPfGender} sPfMode={sPfMode}
          sDcMode={sDcMode} sAsMode={sAsMode} sCjMode={sCjMode} sM7={sM7} sBjMode={sBjMode}
        />}
        {// ═══ TAB: PRACTICE ═══
        tab==="practice"&&<PracticeTab
          allCats={allCats} sh={sh} setScr={setScr} sCurEx={sCurEx}
          sMcQ={sMcQ} sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl}
          sFcPool={sFcPool} sFcI={sFcI} sFcFlip={sFcFlip} sFcKnow={sFcKnow}
          sMp={sMp} sMsl={sMsl} sMm={sMm} sGsc={sGsc} sGph={sGph}
          sTyPool={sTyPool} sTyI={sTyI} sTyS={sTyS} sTyIn={sTyIn} sTyA={sTyA} sTyW={sTyW}
          sLsQ={sLsQ} sLsI={sLsI} sLsS={sLsS} sLsA={sLsA} sLsSl={sLsSl} sLsO={sLsO}
          sSi={sSi} sSx={sSx} sSw={sSw} sSr={sSr} sSsc={sSsc}
          sZnMode={sZnMode}
          sUjQ={sUjQ} sUjI={sUjI} sUjS={sUjS} sUjIn={sUjIn} sUjA={sUjA}
          sPpQ={sPpQ} sPpI={sPpI} sPpS={sPpS} sPpA={sPpA} sPpSl={sPpSl}
          sNtQ={sNtQ} sNtI={sNtI} sNtS={sNtS} sNtA={sNtA} sNtSl={sNtSl} sNtO={sNtO}
          sEvM={sEvM}
        />}
        {// ═══ TAB: CROATIA ═══
        tab==="croatia"&&<CroatiaTab
          setScr={setScr} sHIdx={sHIdx} sKgTab={sKgTab} sCurEx={sCurEx}
          setRcIdx={setRcIdx} setRcServ={setRcServ}
          setRpIdx={setRpIdx} setRpLine={setRpLine} setRpShow={setRpShow}
          setMapCat={setMapCat} setMapSel={setMapSel}
        />}
        {// ═══ TAB: PROFILE ═══
        tab==="profile"&&<ProfileTab
          name={name} au={au} level={level} st={st} favs={favs}
          darkMode={darkMode} setDarkMode={setDarkMode}
          setScr={setScr} doOut={doOut}
        />}
      </div>}
      {// ═══ MODAL VERBS ═══
      scr==="modal"&&<ModalScreen goBack={goBack} award={award} setSt={setSt} />}
      {scr==="modal_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🔮 Modalni Glagoli","Modal Verbs — željeti · htjeti · morati · trebati · moći · smjeti")}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
          {["menu","learn","fill","quiz"].map(m=><button
            key={m}
            className={"b "+(m7===m?"bv":"bg")}
            style={{fontSize:12,padding:"6px 12px"}}
            onClick={()=>{sM7(m);sM7i(0);sM7s(0);sM7a(false);sM7sl(-1);sM7o([]);sM7q([]);sM7v(0)}}>
            {m==="menu"?"📋 Menu":m==="learn"?"📖 Learn":m==="fill"?"✏️ Fill Blanks":"🏆 Quiz"}
          </button>)}
        </div>
        {m7==="menu"&&<React.Fragment>
          <div
            className="c"
            style={{marginBottom:20,borderLeft:"4px solid #7c3aed",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#5b21b6",marginBottom:8}}>
              🔮 What are Modal Verbs?
            </div>
            <div style={{fontSize:14,lineHeight:1.7}}>
              {"Modal verbs express ability, obligation, permission, need, and desire. They combine with infinitives: "}
              <b style={{color:"#7c3aed"}}>
                Mogu čitati
              </b>
              {" (I can read), "}
              <b style={{color:"#7c3aed"}}>
                Moram ići
              </b>
              {" (I must go)."}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {MODAL.verbs.map((v,i)=><div
              key={i}
              className="tc"
              style={{textAlign:"center",padding:"14px 8px"}}
              onClick={()=>{sM7v(i);sM7("learn")}}>
              <div style={{fontSize:28}}>
                {v.icon}
              </div>
              <div style={{fontSize:14,fontWeight:800,color:"#5b21b6"}}>
                {v.inf}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {v.en}
              </div>
            </div>)}
          </div>
        </React.Fragment>}
        {m7==="learn"&&(()=>{const v=MODAL.verbs[m7v];return (
          <React.Fragment>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
              {MODAL.verbs.map((mv,mi)=><button
                key={mi}
                className={"b "+(m7v===mi?"bv":"bg")}
                style={{fontSize:11,padding:"8px 14px"}}
                onClick={()=>sM7v(mi)}>
                {mv.icon}
                {" "}
                {mv.inf}
              </button>)}
            </div>
            <div className="c" style={{marginBottom:16,borderLeft:"4px solid #7c3aed"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{fontSize:40}}>
                  {v.icon}
                </div>
                <div>
                  <div
                    style={{fontSize:24,fontWeight:800,color:"#5b21b6",fontFamily:"'Playfair Display',serif"}}>
                    {v.inf}
                  </div>
                  <div style={{fontSize:15,color:"#78716c"}}>
                    {v.en}
                  </div>
                </div>
                <Spk text={v.inf} />
              </div>
            </div>
            <div className="c" style={{marginBottom:16,padding:0,overflow:"hidden"}}>
              <div
                style={{padding:"12px 16px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",fontWeight:700,fontSize:14}}>
                Conjugation
              </div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                <tbody>
                  {MODAL.persons.map((p,pi)=><tr
                    key={pi}
                    style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}
                    onClick={()=>speak(v.forms[pi])}>
                    <td style={{padding:"10px 12px",fontWeight:600,color:"#78716c",width:"30%"}}>
                      {p}
                    </td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:"#16a34a"}}>
                      {"✅ "}
                      {v.forms[pi]}
                    </td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:"#dc2626"}}>
                      {"❌ "}
                      {v.neg[pi]}
                    </td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div
              className="c"
              style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"#fffbeb"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#b45309",marginBottom:4}}>
                💡 TIP
              </div>
              <div style={{fontSize:13,color:"#92400e"}}>
                {v.tip}
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {m7v>0&&<button className="b bg" onClick={()=>sM7v(i=>i-1)}>
                ← Prev
              </button>}
              {m7v<5&&<button className="b bv" onClick={()=>sM7v(i=>i+1)}>
                Next →
              </button>}
              {m7v===5&&<button
                className="b bv"
                onClick={()=>{sM7("fill");sM7i(0);sM7s(0);sM7a(false);sM7sl(-1);sM7q([]);sM7o([])}}>
                Practice Fill Blanks →
              </button>}
            </div>
          </React.Fragment>
        );})()}
        {m7==="fill"&&(()=>{
          if(m7q.length===0){const q=sh(MODAL.fillBlanks).slice(0,10);setTimeout(()=>{sM7q(q);sM7o(sh([q[0].a,...q[0].al]))},0);return (
            <div style={{textAlign:"center",padding:40}}>
              Loading...
            </div>
          );}
          const total=m7q.length;
          if(m7i>=total){const pct=Math.round((m7s/total)*100);return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {pct>=80?"🏆":pct>=50?"👍":"📚"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                Fill Blanks Complete!
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#7c3aed"}}>
                {m7s}
                {" / "}
                {total}
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button
                  className="b bg"
                  onClick={()=>{sM7q([]);sM7i(0);sM7s(0);sM7a(false);sM7sl(-1)}}>
                  🔄 Retry
                </button>
                <button
                  className="b bv"
                  onClick={()=>{sM7("quiz");sM7q([]);sM7i(0);sM7s(0);sM7a(false);sM7sl(-1);sM7o([])}}>
                  Master Quiz →
                </button>
              </div>
            </div>
          );}
          const q=m7q[m7i];const ci=m7o.indexOf(q.a);const pts=q.q.split("_____");
          return (
            <React.Fragment>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>
                  {m7i+1}
                  {" / "}
                  {total}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#7c3aed"}}>
                  {"Score: "}
                  {m7s}
                </div>
              </div>
              <Bar v={m7i+1} mx={total} color="#7c3aed" h={6} />
              <div className="c" style={{marginTop:16}}>
                <div style={{fontSize:11,color:"#7c3aed",fontWeight:700,marginBottom:6}}>
                  {"Verb: "}
                  {q.v}
                </div>
                <div style={{fontSize:17,lineHeight:1.8}}>
                  {pts[0]}
                  <span
                    style={{borderBottom:"3px solid #7c3aed",fontWeight:800,color:"#7c3aed",padding:"0 4px"}}>
                    {m7a?q.a:"___"}
                  </span>
                  {pts[1]||""}
                </div>
                <div style={{fontSize:13,color:"#78716c",fontStyle:"italic",marginTop:8}}>
                  {q.en}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
                {m7o.map((o,oi)=><button
                  key={oi}
                  className={"ob "+(m7a?(oi===ci?"ok":m7sl===oi?"no":""):"")}
                  onClick={()=>{if(!m7a){sM7sl(oi);sM7a(true);if(oi===ci){sM7s(s=>s+1);award(5);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}}}>
                  {o}
                </button>)}
              </div>
              {m7a&&<button
                className="b bv"
                style={{width:"100%",marginTop:16}}
                onClick={()=>{if(m7i<total-1){const n=m7q[m7i+1];sM7o(sh([n.a,...n.al]));sM7i(i=>i+1);sM7a(false);sM7sl(-1)}else{award(m7s*3);sM7i(total)}}}>
                {m7i<total-1?"Next →":"See Results"}
              </button>}
            </React.Fragment>
          );})()}
        {m7==="quiz"&&(()=>{
          if(m7q.length===0){const q=sh(MODAL.masterQuiz).slice(0,10);setTimeout(()=>{sM7q(q);sM7o(sh([q[0].a,...q[0].al]))},0);return (
            <div style={{textAlign:"center",padding:40}}>
              Loading...
            </div>
          );}
          const total=m7q.length;
          if(m7i>=total){const pct=Math.round((m7s/total)*100);return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {pct>=80?"🌟":"👍"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                {pct>=80?"Modal Master!":"Keep Practicing!"}
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#7c3aed"}}>
                {m7s}
                {" / "}
                {total}
              </div>
              {pct>=70&&<div
                style={{padding:12,background:"#dcfce7",borderRadius:12,marginTop:12,fontSize:14,color:"#16a34a",fontWeight:700}}>
                🏅 Modal Verbs Badge Earned!
              </div>}
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button
                  className="b bg"
                  onClick={()=>{sM7q([]);sM7i(0);sM7s(0);sM7a(false);sM7sl(-1)}}>
                  🔄 Retry
                </button>
                <button
                  className="b bv"
                  onClick={()=>{setSt(s=>({...s,mv:s.mv+1,gc:s.gc+1}));award(m7s*3+20);goBack()}}>
                  🏠 Finish!
                </button>
              </div>
            </div>
          );}
          const q=m7q[m7i];const ci=m7o.indexOf(q.a);
          return (
            <React.Fragment>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>
                  {"🏆 "}
                  {m7i+1}
                  /
                  {total}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#7c3aed"}}>
                  {"Score: "}
                  {m7s}
                </div>
              </div>
              <Bar v={m7i+1} mx={total} color="#7c3aed" h={6} />
              <div className="c" style={{marginTop:16}}>
                <p style={{fontSize:18,fontWeight:700,marginBottom:20}}>
                  {q.q}
                </p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
                {m7o.map((o,oi)=><button
                  key={oi}
                  className={"ob "+(m7a?(oi===ci?"ok":m7sl===oi?"no":""):"")}
                  onClick={()=>{if(!m7a){sM7sl(oi);sM7a(true);if(oi===ci){sM7s(s=>s+1);award(5);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}}}>
                  {o}
                </button>)}
              </div>
              {m7a&&<button
                className="b bv"
                style={{width:"100%",marginTop:16}}
                onClick={()=>{if(m7i<total-1){const n=m7q[m7i+1];sM7o(sh([n.a,...n.al]));sM7i(i=>i+1);sM7a(false);sM7sl(-1)}else sM7i(total)}}>
                {m7i<total-1?"Next →":"Results"}
              </button>}
            </React.Fragment>
          );})()}
      </div>}
      {// ═══ HISTORY ═══
      scr==="history"&&<CroatiaHistoryScreen goBack={goBack} />}
      {scr==="history_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🇭🇷 "+HISTORY.title,HISTORY.subtitle)}
        <div
          className="c"
          style={{marginBottom:20,borderLeft:"4px solid #dc2626",background:"linear-gradient(135deg,#fef2f2,#fee2e2)"}}>
          <div style={{fontSize:14,lineHeight:1.8,color:"#1c1917"}}>
            {HISTORY.intro}
          </div>
        </div>
        <div
          style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>
          Timeline
        </div>
        {HISTORY.timeline.map((e,i)=><div
          key={i}
          className="c"
          style={{marginBottom:12,borderLeft:"4px solid "+(i<3?"#f59e0b":i<5?"#dc2626":"#16a34a")}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:24}}>
              {e.emoji}
            </span>
            <div>
              <div style={{fontSize:12,fontWeight:800,color:"#b45309"}}>
                {e.year}
              </div>
              <div
                style={{fontSize:16,fontWeight:800,color:"#164e63",fontFamily:"'Playfair Display',serif"}}>
                {e.title}
              </div>
            </div>
          </div>
          <p style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>
            {e.text}
          </p>
        </div>)}
        <h3 className="sh" style={{marginTop:24}}>
          🏅 Key Figures
        </h3>
        {HISTORY.heroes.map((h,i)=><div key={i} className="c" style={{marginBottom:10,padding:"14px 20px"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#164e63"}}>
            {h.name}
          </div>
          <div style={{fontSize:12,color:"#b45309",fontWeight:600,marginBottom:4}}>
            {h.role}
          </div>
          <div style={{fontSize:13,color:"#44403c"}}>
            {h.desc}
          </div>
        </div>)}
        <h3 className="sh" style={{marginTop:24}}>
          📅 Key Dates to Remember
        </h3>
        {HISTORY.keyDates.map((d,i)=><div
          key={i}
          style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(0,0,0,.05)"}}>
          <div style={{minWidth:140,fontSize:13,fontWeight:700,color:"#dc2626"}}>
            {d[0]}
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>
              {d[1]}
            </div>
            <div style={{fontSize:12,color:"#78716c"}}>
              {d[2]}
            </div>
          </div>
        </div>)}
        <h3 className="sh" style={{marginTop:24}}>
          📝 Homeland War Vocabulary
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {HISTORY.vocabulary.map((v,i)=><div
            key={i}
            className="c"
            style={{padding:"10px 14px",cursor:"pointer"}}
            onClick={()=>speak(v[0])}>
            <div style={{fontSize:14,fontWeight:700,color:"#991b1b"}}>
              {v[0]}
              {" 🔊"}
            </div>
            <div style={{fontSize:12,color:"#78716c"}}>
              {v[1]}
            </div>
          </div>)}
        </div>
        <div
          className="c"
          style={{marginTop:24,textAlign:"center",borderLeft:"4px solid #dc2626",background:"linear-gradient(135deg,#fef2f2,#fee2e2)"}}>
          <div
            style={{fontSize:24,fontWeight:800,color:"#991b1b",fontFamily:"'Playfair Display',serif",fontStyle:"italic",marginBottom:8}}>
            {HISTORY.quote}
          </div>
          <div
            style={{fontSize:20,fontWeight:700,color:"#b91c1c",fontFamily:"'Playfair Display',serif",fontStyle:"italic"}}>
            {HISTORY.quote2}
          </div>
        </div>
      </div>}
      {// ═══ EVENTS CALENDAR ═══
      scr==="events"&&<EventsCalendar goBack={goBack} />}
      {scr==="events_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📅 Croatian Events & Holidays","Traditional celebrations throughout the year")}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=><button
            key={m}
            className={"b "+(evM===m?"bp":"bg")}
            style={{fontSize:12,padding:"6px 10px"}}
            onClick={()=>sEvM(m)}>
            {["Sij","Velj","Ožu","Tra","Svi","Lip","Srp","Kol","Ruj","Lis","Stu","Pro"][m-1]}
          </button>)}
        </div>
        {EVENTS.filter(e=>e.month===evM||e.month===0).map((e,i)=><div
          key={i}
          className="c"
          style={{marginBottom:12,borderLeft:"4px solid #0e7490"}}>
          <div
            style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div
              style={{fontSize:16,fontWeight:800,color:"#164e63",cursor:"pointer",fontFamily:"'Playfair Display',serif"}}
              onClick={()=>speak(e.name)}>
              {e.name}
              {" 🔊"}
            </div>
            {e.day>0&&<div style={{fontSize:12,color:"#b45309",fontWeight:700}}>
              {e.day}
              {". "}
              {["","siječnja","veljače","ožujka","travnja","svibnja","lipanja","srpnja","kolovoza","rujna","listopada","studenog","prosinca"][evM]}
            </div>}
          </div>
          <div style={{fontSize:13,color:"#0e7490",fontWeight:600,marginBottom:6}}>
            {e.en}
          </div>
          <div style={{fontSize:13,color:"#44403c",lineHeight:1.6}}>
            {e.desc}
          </div>
        </div>)}
      </div>}
      {// ═══ TRANSLATOR ═══
      scr==="top100"&&<Top100Screen goBack={goBack} />}
      {scr==="top100_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("💯 Top 100 Words","Essential words for real-world situations")}
        {!t1k?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {Object.keys(TOP100).map(k=><div key={k} className="tc" style={{textAlign:"center"}} onClick={()=>sT1k(k)}>
            <div style={{fontSize:28}}>
              {k.includes("Airport")?"✈️":k.includes("Restaurant")?"🍽️":k.includes("Doctor")?"🏥":k.includes("Beach")?"🏖️":k.includes("Market")?"🛒":k.includes("Meeting")?"🤝":k.includes("Emergency")?"🚨":"📋"}
            </div>
            <div style={{fontSize:13,fontWeight:700,marginTop:6}}>
              {k}
            </div>
          </div>)}
        </div>:
        <React.Fragment>
          <button className="b bg" style={{marginBottom:16}} onClick={()=>sT1k(null)}>
            ← All Categories
          </button>
          <h3 style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:16}}>
            {t1k}
          </h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {TOP100[t1k].map((w,i)=><div
              key={i}
              className="c"
              style={{padding:"10px 14px",cursor:"pointer"}}
              onClick={()=>speak(w[0])}>
              <div style={{fontSize:14,fontWeight:700,color:"#0e7490"}}>
                {w[0]}
                {" 🔊"}
              </div>
              <div style={{fontSize:12,color:"#78716c"}}>
                {w[1]}
              </div>
            </div>)}
          </div>
        </React.Fragment>}
      </div>}
      {// ═══ MULTIPLE CHOICE GAME ═══
      scr==="mcgame"&&<McGame
        mcQ={mcQ} mcI={mcI} mcS={mcS} mcA={mcA} mcSl={mcSl}
        sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl}
        setScr={setScr} goBack={goBack} award={award}
      />}
      {scr==="mcresult"&&<McResult mcQ={mcQ} mcS={mcS} setScr={setScr} goBack={goBack} award={award} sMcQ={sMcQ} sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl} />}
      {scr==="mcresult_OLD"&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"40px 24px",paddingBottom:80,textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{fontSize:64}}>
          {mcS===mcQ.length?"🌟":"🎉"}
        </div>
        <h2
          style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63"}}>
          {mcS===mcQ.length?"Perfect!":"Great Job!"}
        </h2>
        <p style={{color:"#78716c",marginTop:8,fontSize:20}}>
          {mcS}
          /
          {mcQ.length}
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
          <button
            className="b bg"
            onClick={()=>{const pool=allCats.flatMap(c=>V[c]);const items=sh(pool).slice(0,15).map(w=>{const wr=sh(pool.filter(p=>p[1]!==w[1])).slice(0,3).map(p=>p[1]);const mixed=[w[1],...wr];const shuffled=sh(mixed);return{hr:w[0],en:w[1],ph:w[2],opts:shuffled,correct:w[1]}});sMcQ(items);sMcI(0);sMcS(0);sMcA(false);sMcSl(-1);setScr("mcgame")}}>
            Play Again
          </button>
          <button className="b bp" onClick={goBack}>
            Continue →
          </button>
        </div>
        <button
          onClick={function(){setScr("dashboard");setTab("home")}}
          style={{padding:"14px 32px",border:"2px solid #d6d3d1",borderRadius:14,background:"white",color:"#78716c",fontSize:15,fontWeight:700,cursor:"pointer"}}>
          ← Done
        </button>
      </div>}
      {// ═══ CROATIAN CASES ═══
      scr==="padezi"&&<PadeziScreen goBack={goBack} award={award} setSt={setSt} />}
      {scr==="padezi_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("\ud83d\udcda Pade\u017ei \u2014 7 Croatian Cases","Master noun endings for every situation")}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["learn","quiz"].map(function(m){return (
            <button
              key={m}
              className={"b "+(czMode===m?"bp":"bg")}
              style={{fontSize:13,padding:"8px 16px"}}
              onClick={function(){sCzMode(m);sCzI(0);sCzS(0);sCzA(false);sCzSl(-1);if(m==="quiz"){var q=sh(PADEZI.quiz);sCzQ(q);sCzO(sh([q[0].a].concat(q[0].al)))}}}>
              {m==="learn"?"\ud83d\udcd6 Learn":"\u270f\ufe0f Quiz"}
            </button>
          );})}
        </div>
        {czMode==="learn"&&<React.Fragment>
          {PADEZI.cases.map(function(c,i){return (
            <div
              key={i}
              className="c"
              style={{marginBottom:12,borderLeft:"4px solid "+(i<2?"#0e7490":i<4?"#b45309":"#7c3aed")}}>
              <div
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:17,fontWeight:800,color:"#164e63"}}>
                  {i+1}
                  {". "}
                  {c.name}
                </div>
                <div style={{fontSize:12,color:"#0e7490",fontWeight:700}}>
                  {c.q}
                </div>
              </div>
              <div style={{fontSize:13,color:"#78716c",marginBottom:4}}>
                {c.en}
                {" \u2014 "}
                {c.use}
              </div>
              {c.exs.map(function(e,ei){return (
                <div
                  key={ei}
                  style={{fontSize:14,padding:"4px 0",cursor:"pointer"}}
                  onClick={function(){speak(e)}}>
                  {"\ud83d\udd0a "}
                  {e}
                </div>
              );})}
              <div style={{fontSize:12,color:"#b45309",marginTop:6,fontStyle:"italic"}}>
                {"\ud83d\udca1 "}
                {c.tip}
              </div>
            </div>
          );})}
          <div className="c" style={{marginTop:16}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0e7490",marginBottom:10}}>
              📌 Prepositions & Their Cases
            </div>
            {PREPS.map(function(p,i){return (
              <div
                key={i}
                style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,.04)",fontSize:13}}>
                <div style={{minWidth:60,fontWeight:800,color:"#164e63"}}>
                  {p.prep}
                </div>
                <div style={{minWidth:90,color:"#b45309",fontWeight:600}}>
                  {p.cases.join(", ")}
                </div>
                <div style={{color:"#78716c"}}>
                  {p.en}
                </div>
              </div>
            );})}
          </div>
          <button
            className="b bp"
            style={{width:"100%",marginTop:16}}
            onClick={function(){sCzMode("quiz");var q=sh(PADEZI.quiz);sCzQ(q);sCzI(0);sCzS(0);sCzA(false);sCzSl(-1);sCzO(sh([q[0].a].concat(q[0].al)))}}>
            Start Quiz →
          </button>
        </React.Fragment>}
        {czMode==="quiz"&&(function(){
          if(!czQ.length)return null;var total=czQ.length;
          if(czI>=total){var pct=Math.round((czS/total)*100);return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {pct>=80?"\ud83c\udfc6":"\ud83d\udc4d"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                Cases Quiz Complete!
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>
                {czS}
                {" / "}
                {total}
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button className="b bg" onClick={function(){sCzMode("learn")}}>
                  📖 Review
                </button>
                <button
                  className="b bp"
                  onClick={function(){award(czS*3+15);setSt(function(s){return Object.assign({},s,{gc:s.gc+1})});goBack()}}>
                  🏠 Finish!
                </button>
              </div>
            </div>
          );}
          var q=czQ[czI];var ci=czO.indexOf(q.a);
          return (
            <React.Fragment>
              <Bar v={czI+1} mx={total} h={6} />
              <div className="c" style={{marginTop:16}}>
                <p style={{fontSize:17,fontWeight:700,lineHeight:1.6}}>
                  {q.q}
                </p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
                {czO.map(function(o,oi){return (
                  <button
                    key={oi}
                    className={"ob "+(czA?(oi===ci?"ok":czSl===oi?"no":""):"")}
                    onClick={function(){if(!czA){sCzSl(oi);sCzA(true);if(oi===ci){sCzS(function(s){return s+1});award(4);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}}}>
                    {o}
                  </button>
                );})}
              </div>
              {czA&&<button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={function(){if(czI<total-1){var n=czQ[czI+1];sCzO(sh([n.a].concat(n.al)));sCzI(function(i){return i+1});sCzA(false);sCzSl(-1)}else sCzI(total)}}>
                {czI<total-1?"Next \u2192":"See Results"}
              </button>}
            </React.Fragment>
          );})()}
      </div>}
      {// ═══ UNJUMBLE / WORD ORDER ═══
      scr==="unjumble"&&<Unjumble goBack={goBack} award={award} />}
      {scr==="unjumble_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("\ud83e\udde9 Word Order","Arrange words to form correct Croatian sentences")}
        {ujQ[ujI]?(function(){var total=ujQ.length;var q=ujQ[ujI];
          return (
            <React.Fragment>
              <Bar v={ujI+1} mx={total} h={6} />
              <div className="c" style={{marginTop:16}}>
                <div style={{fontSize:13,color:"#78716c",marginBottom:8}}>
                  Translate to Croatian:
                </div>
                <div style={{fontSize:18,fontWeight:700,color:"#164e63",marginBottom:16}}>
                  "
                  {q.en}
                  "
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
                  {sh(q.words).map(function(w,wi){return (
                    <button
                      key={wi}
                      style={{padding:"8px 16px",borderRadius:10,border:"2px solid #0e7490",background:"rgba(14,116,144,.06)",cursor:"pointer",fontWeight:600,fontSize:15}}
                      onClick={function(){sUjIn(function(prev){return(prev?prev+" ":"")+w})}}>
                      {w}
                    </button>
                  );})}
                </div>
                <div
                  style={{minHeight:50,padding:"14px 18px",border:"2px solid "+(ujA?(ujIn.replace(/[.?!]/g,"").trim().toLowerCase()===q.correct.replace(/[.?!]/g,"").trim().toLowerCase()?"#16a34a":"#dc2626"):"rgba(14,116,144,.12)"),borderRadius:14,background:"rgba(255,255,255,.65)",fontSize:16,fontWeight:600}}>
                  {ujIn||"\u2190 Tap words to build sentence"}
                </div>
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button className="b bg" style={{fontSize:13}} onClick={function(){sUjIn("")}}>
                    🗑 Clear
                  </button>
                  {!ujA&&<button
                    className="b bp"
                    onClick={function(){sUjA(true);if(ujIn.replace(/[.?!]/g,"").trim().toLowerCase()===q.correct.replace(/[.?!]/g,"").trim().toLowerCase()){sUjS(function(s){return s+1});award(5);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}}>
                    Check ✅
                  </button>}
                </div>
                {ujA&&<div
                  style={{marginTop:12,padding:"12px 16px",borderRadius:10,background:ujIn.replace(/[.?!]/g,"").trim().toLowerCase()===q.correct.replace(/[.?!]/g,"").trim().toLowerCase()?"rgba(22,163,74,.08)":"rgba(220,38,38,.08)",fontSize:14}}>
                  {ujIn.replace(/[.?!]/g,"").trim().toLowerCase()===q.correct.replace(/[.?!]/g,"").trim().toLowerCase()?
                    <span style={{color:"#16a34a",fontWeight:700}}>
                      ✅ Correct!
                    </span>:
                    <span style={{color:"#dc2626"}}>
                      {"\u274c Correct answer: "}
                      <b>
                        {q.correct}
                      </b>
                    </span>}
                </div>}
                {ujA&&<button
                  className="b bp"
                  style={{width:"100%",marginTop:12}}
                  onClick={function(){if(ujI<total-1){sUjI(function(i){return i+1});sUjIn("");sUjA(false)}else{award(ujS*3+10);goBack()}}}>
                  {ujI<total-1?"Next \u2192":"Finish!"}
                </button>}
              </div>
            </React.Fragment>
          );})():
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:64}}>
            🌟
          </div>
          <p>
            {"Score: "}
            {ujS}
            /
            {ujQ.length}
          </p>
          <button className="b bp" onClick={goBack}>
            Continue →
          </button>
        </div>}
      </div>}
      {// ═══ IDIOMS & SLANG ═══
      scr==="idioms"&&<IdiomsScreen goBack={goBack} />}
      {// ═══ FLASHCARDS ═══
      scr==="flashcards"&&<Flashcards
        fcPool={fcPool} fcI={fcI} fcFlip={fcFlip} fcKnow={fcKnow}
        sFcFlip={sFcFlip} sFcI={sFcI} sFcKnow={sFcKnow}
        goBack={goBack} award={award}
      />}
      {// ═══ LISTENING COMPREHENSION ═══
      scr==="listening"&&<ListeningScreen
        lsQ={lsQ} lsI={lsI} lsS={lsS} lsA={lsA} lsSl={lsSl} lsO={lsO}
        sLsQ={sLsQ} sLsI={sLsI} sLsS={sLsS} sLsA={sLsA} sLsSl={sLsSl} sLsO={sLsO}
        goBack={goBack} award={award} sh={sh}
      />}
      {// ═══ STORY SELECT ═══
      scr==="storyselect"&&<StoryScreens goBack={goBack} award={award} sCurEx={sCurEx} />}
      {scr==="storyselect_OLD"&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("\ud83d\udcd6 Mini Stories","Interactive stories where YOU choose what happens")}
        {STORIES.map(function(s,i){return (
          <div
            key={i}
            className="tc"
            onClick={function(){sStSt(s);sStSc(0);setScr("story");sCurEx("story")}}
            style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
            <div style={{fontSize:36}}>
              {i===0?"\u2615":i===1?"\ud83c\udf52":"\ud83c\udfd6\ufe0f"}
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:700}}>
                {s.title}
              </div>
              <div style={{fontSize:12,color:"#78716c"}}>
                {s.tEn}
                {" \u00b7 "}
                {s.scenes.length}
                {" scenes"}
              </div>
            </div>
          </div>
        );})}
      </div>}
      {// ═══ STORY PLAY ═══
      scr==="story_OLD"&&stSt&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button
          className="b bg"
          style={{marginBottom:16,fontSize:13}}
          onClick={function(){setScr("storyselect")}}>
          ← Back
        </button>
        {H("\ud83d\udcd6 "+stSt.title,stSt.tEn)}
        {(function(){var scene=stSt.scenes[stSc];if(!scene)return (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:64}}>
              🌟
            </div>
            <h3>
              Story complete!
            </h3>
            <button
              className="b bp"
              style={{marginTop:16}}
              onClick={function(){award(15);setScr("storyselect");if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}>
              Back to Stories
            </button>
          </div>
        );
          return (
            <React.Fragment>
              <Bar v={stSc+1} mx={stSt.scenes.length} h={6} />
              <div className="c" style={{marginTop:16}}>
                <div
                  style={{fontSize:16,fontWeight:700,lineHeight:1.7,color:"#1c1917",cursor:"pointer"}}
                  onClick={function(){speak(scene.text)}}>
                  {scene.text}
                  {" \ud83d\udd0a"}
                </div>
                <div
                  style={{fontSize:14,color:"#78716c",fontStyle:"italic",marginTop:8,lineHeight:1.6}}>
                  {scene.en}
                </div>
              </div>
              {scene.choices.length>0?<div style={{marginTop:16}}>
                <div style={{fontSize:13,fontWeight:700,color:"#0e7490",marginBottom:8}}>
                  Što radiš? — What do you do?
                </div>
                {scene.choices.map(function(ch,ci){return (
                  <button
                    key={ci}
                    className="ob"
                    style={{borderColor:"#0e7490"}}
                    onClick={function(){sStSc(ch.next)}}>
                    {ch.text}
                  </button>
                );})}
              </div>:
              <button
                className="b bp"
                style={{width:"100%",marginTop:20}}
                onClick={function(){award(15);setScr("storyselect");if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}>
                ✅ Story Complete!
              </button>}
            </React.Fragment>
          );})()}
      </div>}
      {// ═══ NUMBER & TIME DRILLS ═══
      scr==="numtime"&&<NumTime goBack={goBack} award={award} />}
      {scr==="numtime_OLD"&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("\ud83d\udd22 Numbers & Time","Practice numbers, time, and currency in Croatian")}
        {ntQ[ntI]?(function(){var total=ntQ.length;var q=ntQ[ntI];var ci=ntO.indexOf(q.a);
          if(ntI>=total){return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {ntS>=total*0.7?"\ud83c\udfc6":"\ud83d\udc4d"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                Numbers Complete!
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>
                {ntS}
                {" / "}
                {total}
              </div>
              <button
                className="b bp"
                style={{marginTop:16}}
                onClick={function(){award(ntS*3+10);goBack()}}>
                Finish!
              </button>
            </div>
          );}
          return (
            <React.Fragment>
              <Bar v={ntI+1} mx={total} h={6} />
              <div className="c" style={{marginTop:16}}>
                <p style={{fontSize:18,fontWeight:700}}>
                  {q.q}
                </p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
                {ntO.map(function(o,oi){return (
                  <button
                    key={oi}
                    className={"ob "+(ntA?(oi===ci?"ok":ntSl===oi?"no":""):"")}
                    onClick={function(){if(!ntA){sNtSl(oi);sNtA(true);if(oi===ci)sNtS(function(s){return s+1})}}}>
                    {o}
                  </button>
                );})}
              </div>
              {ntA&&<button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={function(){if(ntI<total-1){var n=ntQ[ntI+1];sNtO(sh([n.a].concat(n.al)));sNtI(function(i){return i+1});sNtA(false);sNtSl(-1)}else sNtI(total)}}>
                {ntI<total-1?"Next \u2192":"See Results"}
              </button>}
            </React.Fragment>
          );})():null}
      </div>}
      {// ═══ ALL PROVERBS ═══
      scr==="proverbs"&&<ProverbsScreen goBack={goBack} />}
      {// ═══ LEADERBOARD ═══
      scr==="leaderboard"&&<Leaderboard goBack={goBack} au={au} name={name} famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers} famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName} famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr} famTab={famTab} setFamTab={setFamTab} />}
      {scr==="leaderboard_OLD"&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("\ud83c\udfc6 Family Leaderboard","Compete with your family!")}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {["main","create","join"].map(function(t){return (
            <button
              key={t}
              className={"b "+(famTab===t?"bp":"bg")}
              style={{fontSize:12,padding:"8px 14px"}}
              onClick={function(){setFamTab(t);setFamErr("")}}>
              {t==="main"?"\ud83c\udfc6 Leaderboard":t==="create"?"\u2795 Create Family":"\ud83d\udd17 Join Family"}
            </button>
          );})}
        </div>
        {famTab==="main"&&<React.Fragment>
          {famData?<React.Fragment>
            <div
              className="c"
              style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"linear-gradient(135deg,#fffbeb,#fef3c7)"}}>
              <div
                style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#92400e"}}>
                    {"\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66 "}
                    {famData.name}
                  </div>
                  <div style={{fontSize:12,color:"#78716c"}}>
                    {"Code: "}
                    <span style={{fontWeight:800,color:"#0e7490",letterSpacing:2,fontSize:14}}>
                      {famData.code}
                    </span>
                    {" \u2014 Share this with family!"}
                  </div>
                </div>
                <div
                  style={{fontSize:11,padding:"3px 8px",background:famData.role==="admin"?"#dbeafe":"#e7e5e4",borderRadius:12,color:famData.role==="admin"?"#1e40af":"#78716c",fontWeight:600}}>
                  {famData.role}
                </div>
              </div>
            </div>
            <button
              className="b bp"
              style={{width:"100%",marginBottom:16,fontSize:14}}
              onClick={function(){if(!_fbReady){setFamErr("Firebase not configured.");return}setFamLoading(true);fbGetFamilyMembers(famData.code).then(function(m){setFamMembers(m);setFamLoading(false)})}}
              disabled={famLoading}>
              {famLoading?"Loading...":"\ud83d\udd04 Refresh Leaderboard"}
            </button>
            {famErr&&<div style={{color:"#dc2626",fontSize:13,marginBottom:12}}>
              {famErr}
            </div>}
            {famMembers.length>0?famMembers.map(function(u,i){return (
              <div
                key={i}
                className="c"
                style={{display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:i===0?"4px solid #f59e0b":i===1?"4px solid #9ca3af":"4px solid #d97706"}}>
                <div
                  style={{width:44,height:44,borderRadius:"50%",background:i===0?"linear-gradient(135deg,#f59e0b,#d97706)":i===1?"linear-gradient(135deg,#9ca3af,#6b7280)":"linear-gradient(135deg,#d97706,#92400e)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:20}}>
                  {i===0?"\ud83e\udd47":i===1?"\ud83e\udd48":i===2?"\ud83e\udd49":i+1}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:700}}>
                    {u.name}
                    {u.role==="admin"?" \ud83d\udc51":""}
                  </div>
                  <div style={{fontSize:12,color:"#78716c"}}>
                    {u.lc}
                    {" lessons \u00b7 Joined "}
                    {new Date(u.joined).toLocaleDateString()}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:800,color:"#b45309"}}>
                    {u.xp}
                  </div>
                  <div style={{fontSize:11,color:"#78716c"}}>
                    XP
                  </div>
                </div>
              </div>
            );}):
            <div className="c" style={{textAlign:"center",color:"#78716c"}}>
              Tap 'Refresh Leaderboard' to load family scores.
            </div>}
            <button
              style={{marginTop:20,width:"100%",padding:"12px",border:"2px solid rgba(220,38,38,.15)",borderRadius:14,background:"rgba(220,38,38,.03)",color:"#dc2626",fontSize:13,fontWeight:600,cursor:"pointer"}}
              onClick={function(){if(confirm("Leave this family group? You can rejoin with the code later.")){fbLeaveFamily(famData.code,au.e).then(function(){setFamData(null);setFamMembers([]);localStorage.removeItem("uFamily")})}}}>
              🚪 Leave Family
            </button>
          </React.Fragment>:
          <div className="c" style={{textAlign:"center",padding:"32px 20px"}}>
            <div style={{fontSize:48,marginBottom:12}}>
              👨‍👩‍👧‍👦
            </div>
            <h3 style={{color:"#164e63",marginBottom:8}}>
              No Family Group Yet
            </h3>
            <p style={{color:"#78716c",fontSize:14,marginBottom:16}}>
              Create a family group and share the code with your family members. Everyone who joins can see each other's progress and compete for the top spot!
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button className="b bp" onClick={function(){setFamTab("create")}}>
                ➕ Create Family
              </button>
              <button className="b bg" onClick={function(){setFamTab("join")}}>
                🔗 Join Family
              </button>
            </div>
          </div>}
        </React.Fragment>}
        {famTab==="create"&&<React.Fragment>
          <div className="c" style={{padding:24}}>
            <div style={{fontSize:14,color:"#44403c",marginBottom:16}}>
              Create a family group. You'll get a 6-character code to share with your family members.
            </div>
            {famErr&&<div
              style={{background:famErr.startsWith("\u2705")?"rgba(22,163,74,.08)":"rgba(220,38,38,.08)",border:"1px solid",borderColor:famErr.startsWith("\u2705")?"rgba(22,163,74,.2)":"rgba(220,38,38,.2)",borderRadius:10,padding:"12px 16px",color:famErr.startsWith("\u2705")?"#16a34a":"#dc2626",fontSize:14,fontWeight:600,marginBottom:16}}>
              {famErr}
            </div>}
            <label
              style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>
              FAMILY NAME
            </label>
            <input
              type="text"
              placeholder={'e.g. "The Horvat Family"'}
              value={famName}
              onChange={function(e){setFamName(e.target.value);setFamErr("")}}
              style={{marginBottom:16}} />
            <button
              className="b bp"
              style={{width:"100%",fontSize:16}}
              disabled={famLoading}
              onClick={function(){if(!famName.trim()){setFamErr("Please enter a family name.");return}if(!_fbReady){setFamErr("Firebase not configured. Family groups require Firebase.");return}if(!au||!au.e){setFamErr("You must be logged in.");return}setFamLoading(true);fbCreateFamily(famName.trim(),au.e,name||au.d).then(function(r){setFamLoading(false);if(r.ok){setFamData(r.family);setFamTab("main");setFamName("");setFamErr("")}else{setFamErr(r.err)}})}}>
              {famLoading?"Creating...":"\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66 Create Family Group"}
            </button>
          </div>
        </React.Fragment>}
        {famTab==="join"&&<React.Fragment>
          <div className="c" style={{padding:24}}>
            <div style={{fontSize:14,color:"#44403c",marginBottom:16}}>
              Enter the 6-character family code that was shared with you.
            </div>
            {famErr&&<div
              style={{background:famErr.startsWith("\u2705")?"rgba(22,163,74,.08)":"rgba(220,38,38,.08)",border:"1px solid",borderColor:famErr.startsWith("\u2705")?"rgba(22,163,74,.2)":"rgba(220,38,38,.2)",borderRadius:10,padding:"12px 16px",color:famErr.startsWith("\u2705")?"#16a34a":"#dc2626",fontSize:14,fontWeight:600,marginBottom:16}}>
              {famErr}
            </div>}
            <label
              style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>
              FAMILY CODE
            </label>
            <input
              type="text"
              placeholder="e.g. AB3X7K"
              value={famCode}
              onChange={function(e){setFamCode(e.target.value.toUpperCase());setFamErr("")}}
              maxLength={6}
              style={{marginBottom:16,textAlign:"center",letterSpacing:6,fontSize:24,fontWeight:800,textTransform:"uppercase"}} />
            <button
              className="b bp"
              style={{width:"100%",fontSize:16}}
              disabled={famLoading}
              onClick={function(){if(famCode.trim().length!==6){setFamErr("Code must be 6 characters.");return}if(!_fbReady){setFamErr("Firebase not configured.");return}if(!au||!au.e){setFamErr("You must be logged in.");return}setFamLoading(true);fbJoinFamily(famCode.trim(),au.e,name||au.d).then(function(r){setFamLoading(false);if(r.ok){setFamData(r.family);setFamTab("main");setFamCode("");setFamErr("")}else{setFamErr(r.err)}})}}>
              {famLoading?"Joining...":"\ud83d\udd17 Join Family"}
            </button>
          </div>
        </React.Fragment>}
      </div>}
      {// ═══ SCHOOL KIT ═══
      scr==="school"&&<SchoolScreen goBack={goBack} />}
      {scr==="school_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🏫 School Survival Kit","Everything for Croatian school")}
        <div
          className="c"
          style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>
            {SCHOOL.grading.title}
          </div>
          <div style={{fontSize:14,marginTop:4}}>
            {SCHOOL.grading.desc}
          </div>
        </div>
        <div
          className="c"
          style={{marginBottom:12,borderLeft:"4px solid #f59e0b",background:"#fffbeb"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#b45309"}}>
            ⚠️ Formal Rules
          </div>
          <div style={{fontSize:13,marginTop:4}}>
            {SCHOOL.formal}
          </div>
        </div>
        <h3 className="sh">
          📚 Classroom Vocabulary
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {SCHOOL.classroom.map(function(w,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer"}}
              onClick={function(){speak(w[0])}}>
              <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>
                {w[0]}
                {" 🔊"}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {w[1]}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh" style={{marginTop:16}}>
          📝 Subjects
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {SCHOOL.subjects.map(function(w,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer"}}
              onClick={function(){speak(w[0])}}>
              <div style={{fontSize:13,fontWeight:700,color:"#7c3aed"}}>
                {w[0]}
                {" 🔊"}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {w[1]}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh" style={{marginTop:16}}>
          🗣️ Essential Phrases
        </h3>
        {SCHOOL.phrases.map(function(p,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}}
            onClick={function(){speak(p[0])}}>
            <span style={{fontWeight:700,fontSize:14}}>
              {p[0]}
              {" 🔊"}
            </span>
            <span style={{color:"#78716c",fontSize:13}}>
              {p[1]}
            </span>
          </div>
        );})}
      </div>}
      {scr==="texting"&&<TextingScreen goBack={goBack} />}
      {scr==="texting_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📱 Texting & Slang","How Croatian kids actually text")}
        {TEXTING.map(function(t,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:8,cursor:"pointer"}}
            onClick={function(){speak(t.slang)}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>
                {t.slang}
                {" 🔊"}
              </div>
              <div style={{fontSize:14,fontWeight:600,color:"#0e7490"}}>
                {t.means}
              </div>
            </div>
            <div style={{fontSize:12,color:"#78716c",marginTop:2}}>
              {t.ctx}
            </div>
          </div>
        );})}
      </div>}
      {scr==="friends"&&<FriendsScreen goBack={goBack} />}
      {scr==="friends_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🤝 Making Friends","Real phrases kids use")}
        {FRIENDS.map(function(f,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:8,cursor:"pointer"}}
            onClick={function(){speak(f.hr)}}>
            <div style={{fontSize:15,fontWeight:700,color:"#164e63"}}>
              {f.hr}
              {" 🔊"}
            </div>
            <div style={{fontSize:14,color:"#0e7490",marginTop:2}}>
              {f.en}
            </div>
          </div>
        );})}
      </div>}
      {scr==="foodorder"&&<FoodOrderScreen goBack={goBack} />}
      {scr==="foodorder_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🍕 Ordering Food","Bakery, fast food, ice cream, restaurants")}
        {[FOODORDER.bakery,FOODORDER.fastfood,FOODORDER.icecream].map(function(sec,si){return (
          <div key={si} className="c" style={{marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:800,color:"#b45309",marginBottom:10}}>
              {sec.title}
            </div>
            <div
              style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:10}}>
              {sec.items.map(function(w,i){return (
                <div
                  key={i}
                  style={{padding:"4px 0",cursor:"pointer",fontSize:13}}
                  onClick={function(){speak(w[0])}}>
                  <span style={{fontWeight:600}}>
                    {w[0]}
                  </span>
                  {" — "}
                  {w[1]}
                </div>
              );})}
            </div>
            <div style={{borderTop:"1px solid #f3f4f6",paddingTop:8}}>
              {sec.phrases.map(function(p,i){return (
                <div
                  key={i}
                  style={{fontSize:13,padding:"3px 0",cursor:"pointer",fontWeight:600,color:"#164e63"}}
                  onClick={function(){speak(p)}}>
                  {p}
                  {" 🔊"}
                </div>
              );})}
            </div>
          </div>
        );})}
        <div className="c" style={{borderLeft:"4px solid #f59e0b"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#b45309"}}>
            💡 Tipping
          </div>
          <div style={{fontSize:13}}>
            {FOODORDER.restaurant.tip}
          </div>
        </div>
        <h3 className="sh" style={{marginTop:16}}>
          🍽️ Restaurant Phrases
        </h3>
        {FOODORDER.restaurant.phrases.map(function(p,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}}
            onClick={function(){speak(p[0])}}>
            <span style={{fontWeight:700,fontSize:14}}>
              {p[0]}
              {" 🔊"}
            </span>
            <span style={{color:"#78716c",fontSize:13}}>
              {p[1]}
            </span>
          </div>
        );})}
      </div>}
      {scr==="transport"&&<TransportScreen goBack={goBack} />}
      {scr==="transport_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🚌 Getting Around","Bus, tram, taxi phrases")}
        {TRANSPORT.map(function(t,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}}
            onClick={function(){speak(t.hr)}}>
            <span style={{fontWeight:700,fontSize:14}}>
              {t.hr}
              {" 🔊"}
            </span>
            <span style={{color:"#78716c",fontSize:13}}>
              {t.en}
            </span>
          </div>
        );})}
      </div>}
      {scr==="emergency"&&<EmergencyScreen goBack={goBack} />}
      {scr==="emergency_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🚨 Emergency Phrases","Medical, police, urgent")}
        <div
          className="c"
          style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2",textAlign:"center"}}>
          <div style={{fontSize:48,fontWeight:800,color:"#dc2626"}}>
            112
          </div>
          <div style={{fontSize:14,fontWeight:700}}>
            {EMERGENCY.number}
          </div>
        </div>
        {EMERGENCY.phrases.map(function(p,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}}
            onClick={function(){speak(p[0])}}>
            <span style={{fontWeight:700,fontSize:14,color:"#dc2626"}}>
              {p[0]}
              {" 🔊"}
            </span>
            <span style={{color:"#78716c",fontSize:13}}>
              {p[1]}
            </span>
          </div>
        );})}
        <h3 className="sh" style={{marginTop:16}}>
          🦴 Body Parts
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {EMERGENCY.bodyParts.map(function(b,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px",cursor:"pointer",textAlign:"center"}}
              onClick={function(){speak("Boli me "+b[0])}}>
              <div style={{fontSize:13,fontWeight:700}}>
                {b[0]}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {b[1]}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh" style={{marginTop:16}}>
          📞 Numbers
        </h3>
        {EMERGENCY.phoneNumbers.map(function(p,i){return (
          <div key={i} style={{display:"flex",gap:12,padding:"6px 0",fontSize:14}}>
            <span style={{fontWeight:800,color:"#dc2626",minWidth:60}}>
              {p[0]}
            </span>
            <span>
              {p[1]}
            </span>
          </div>
        );})}
      </div>}
      {scr==="football"&&<HNLScreen goBack={goBack} />}
      {scr==="immersion"&&<ImmersionHub goBack={goBack} setScr={setScr} />}
      {scr==="aiconvo"&&<AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} />}
      {scr==="football_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("⚽ Football & Water Polo","Croatia's biggest sports")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {FOOTBALL.vocab.map(function(w,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer"}}
              onClick={function(){speak(w[0])}}>
              <span style={{fontWeight:700,fontSize:13}}>
                {w[0]}
              </span>
              {" — "}
              <span style={{color:"#78716c",fontSize:12}}>
                {w[1]}
              </span>
            </div>
          );})}
        </div>
        <h3 className="sh" style={{marginTop:16}}>
          🏆 Major Teams
        </h3>
        {FOOTBALL.teams.map(function(t,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:8,borderLeft:"4px solid "+t.color}}>
            <div style={{fontSize:16,fontWeight:800}}>
              {t.name}
            </div>
            <div style={{fontSize:13,color:"#78716c"}}>
              {t.desc}
            </div>
          </div>
        );})}
        <h3 className="sh" style={{marginTop:16}}>
          🤽 Water Polo
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {FOOTBALL.waterPolo.map(function(w,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer"}}
              onClick={function(){speak(w[0])}}>
              <span style={{fontWeight:700}}>
                {w[0]}
              </span>
              {" — "}
              <span style={{color:"#78716c"}}>
                {w[1]}
              </span>
            </div>
          );})}
        </div>
      </div>}
      {scr==="popculture"&&<PopCultureScreen goBack={goBack} />}
      {scr==="basketball"&&<BasketballScreen goBack={goBack} />}
      {scr==="gym"&&<GymScreen goBack={goBack} />}
      {scr==="popculture_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🎵 Croatian Pop Culture","Music, TV & artists your friends know")}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {POPCULTURE.map(function(p,i){return (
            <div
              key={i}
              className="tc"
              style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer"}}
              onClick={function(e){e.preventDefault();window.open(p.web,"_blank","noopener,noreferrer")}}>
              <div style={{fontSize:24}}>
                {p.icon}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"#164e63"}}>
                  {p.name}
                </div>
                <div style={{fontSize:11,color:"#78716c"}}>
                  {p.desc}
                </div>
              </div>
            </div>
          );})}
        </div>
      </div>}
      {scr==="practical"&&<PracticalScreen goBack={goBack} />}
      {scr==="practical_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("💼 Practical Life in Croatia","Documents, customs, culture")}
        <div className="c" style={{marginBottom:12,borderLeft:"4px solid #dc2626"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>
            {PRACTICAL.oib.title}
          </div>
          <div style={{fontSize:13,marginTop:4}}>
            {PRACTICAL.oib.desc}
          </div>
        </div>
        <div className="c" style={{marginBottom:12,borderLeft:"4px solid #0e7490"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#0e7490"}}>
            {PRACTICAL.mbo.title}
          </div>
          <div style={{fontSize:13,marginTop:4}}>
            {PRACTICAL.mbo.desc}
          </div>
        </div>
        <h3 className="sh">
          📄 Documents
        </h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {PRACTICAL.documents.map(function(d,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer"}}
              onClick={function(){speak(d[0])}}>
              <div style={{fontSize:13,fontWeight:700}}>
                {d[0]}
                {" 🔊"}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {d[1]}
              </div>
            </div>
          );})}
        </div>
        <div className="c" style={{marginTop:16,borderLeft:"4px solid #f59e0b"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#b45309"}}>
            📅 School Calendar
          </div>
          <div style={{fontSize:13,marginTop:4}}>
            {PRACTICAL.schoolCalendar}
          </div>
        </div>
        <h3 className="sh" style={{marginTop:16}}>
          🇭🇷 Croatian Customs
        </h3>
        {PRACTICAL.customs.map(function(c,i){return (
          <div key={i} className="c" style={{marginBottom:8}}>
            <div style={{fontSize:14,fontWeight:800,color:"#164e63"}}>
              {c.rule}
            </div>
            <div style={{fontSize:13,color:"#44403c",marginTop:4}}>
              {c.desc}
            </div>
          </div>
        );})}
      </div>}
      {scr==="region_labin"&&<RegionScreen regionKey="labin" goBack={goBack} />}
      {scr==="region_labin_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H(REGIONS.labin.title,REGIONS.labin.sub)}
        {REGIONS.labin.sections.map(function(s,i){return (
          <div key={i} className="c" style={{marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:800,color:"#164e63",marginBottom:6}}>
              {s.h}
            </div>
            <div style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>
              {s.t}
            </div>
          </div>
        );})}
      </div>}
      {scr==="region_bibinje"&&<RegionScreen regionKey="bibinje" goBack={goBack} />}
      {scr==="region_bibinje_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H(REGIONS.bibinje.title,REGIONS.bibinje.sub)}
        {REGIONS.bibinje.sections.map(function(s,i){return (
          <div key={i} className="c" style={{marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:800,color:"#164e63",marginBottom:6}}>
              {s.h}
            </div>
            <div style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>
              {s.t}
            </div>
          </div>
        );})}
      </div>}
      {scr==="region_hercegovina"&&<RegionScreen regionKey="hercegovina" goBack={goBack} />}
      {scr==="region_hercegovina_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H(REGIONS.hercegovina.title,REGIONS.hercegovina.sub)}
        {REGIONS.hercegovina.sections.map(function(s,i){return (
          <div key={i} className="c" style={{marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:800,color:"#164e63",marginBottom:6}}>
              {s.h}
            </div>
            <div style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>
              {s.t}
            </div>
          </div>
        );})}
      </div>}
      {scr==="region_vukovar"&&<RegionScreen regionKey="vukovar" goBack={goBack} />}
      {scr==="region_vukovar_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H(REGIONS.vukovar.title,REGIONS.vukovar.sub)}
        {REGIONS.vukovar.sections.map(function(s,i){return (
          <div key={i} className="c" style={{marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:800,color:"#164e63",marginBottom:6}}>
              {s.h}
            </div>
            <div style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>
              {s.t}
            </div>
          </div>
        );})}
      </div>}
      {scr==="region_vinkovci"&&<RegionScreen regionKey="vinkovci" goBack={goBack} />}
      {scr==="region_vinkovci_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H(REGIONS.vinkovci.title,REGIONS.vinkovci.sub)}
        {REGIONS.vinkovci.sections.map(function(s,i){return (
          <div key={i} className="c" style={{marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:800,color:"#164e63",marginBottom:6}}>
              {s.h}
            </div>
            <div style={{fontSize:14,lineHeight:1.7,color:"#44403c"}}>
              {s.t}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ PADEŽI FULL (SINGULAR & PLURAL) ═══
      scr==="padezifull"&&<PadezifullScreen goBack={goBack} award={award} />}
      {scr==="padezifull_OLD"&&<div
        style={{maxWidth:680,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📚 "+PADEZI_FULL.title,PADEZI_FULL.subtitle)}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {["sing","plur","quiz"].map(function(t){return (
            <button
              key={t}
              className={"b "+(pfTab===t||(pfMode==="quiz"&&t==="quiz")?"bp":"bg")}
              style={{fontSize:13,padding:"8px 16px"}}
              onClick={function(){sPfTab(t);if(t!=="quiz")sPfMode("learn");if(t==="quiz"){sPfMode("quiz");var q=sh(PADEZI_FULL.quiz);sPfQ(q);sPfI(0);sPfS(0);sPfA(false);sPfSl(-1);sPfO(q[0].opts);sPfCase("");sPfCaseA(false);sPfCaseSl(-1)}}}>
              {t==="sing"?"Jednina":t==="plur"?"Množina":"🏆 Quiz"}
            </button>
          );})}
        </div>
        {pfTab==="sing"&&pfMode==="learn"&&<React.Fragment>
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {["f","n","m"].map(function(g){return (
              <button
                key={g}
                className={"b "+(pfGender===g?"bw":"bg")}
                style={{fontSize:12,padding:"6px 14px"}}
                onClick={function(){sPfGender(g)}}>
                {g==="f"?"🔴 Ženski":g==="n"?"🟢 Srednji":"🔵 Muški"}
              </button>
            );})}
          </div>
          {(function(){var data=PADEZI_FULL.singEndings[pfGender];return (
            <React.Fragment>
              <div
                className="c"
                style={{marginBottom:12,borderLeft:"4px solid "+(pfGender==="f"?"#dc2626":pfGender==="n"?"#16a34a":"#0e7490")}}>
                <div style={{fontSize:15,fontWeight:800}}>
                  {data.label}
                </div>
                <div style={{fontSize:13,color:"#78716c",marginTop:4}}>
                  {"Endings: "}
                  {data.endings.join(" / ")}
                </div>
                {data.note&&<div style={{fontSize:12,color:"#b45309",marginTop:6,fontWeight:600}}>
                  {"⚠️ "}
                  {data.note}
                </div>}
              </div>
              {data.words.map(function(w,wi){return (
                <div
                  key={wi}
                  className="c"
                  style={{marginBottom:12,padding:0,overflow:"hidden"}}>
                  <div
                    style={{padding:"10px 14px",background:pfGender==="f"?"linear-gradient(135deg,#dc2626,#b91c1c)":pfGender==="n"?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#0e7490,#164e63)",color:"#fff",fontWeight:700,fontSize:14}}>
                    {w.nom}
                    {" ("}
                    {w.en}
                    )
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <tbody>
                      {PADEZI_FULL.caseNames.map(function(cn,ci){return (
                        <tr
                          key={ci}
                          style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}
                          onClick={function(){speak(w.forms[ci])}}>
                          <td style={{padding:"8px 10px",fontWeight:700,width:"30%"}}>
                            {cn}
                          </td>
                          <td style={{padding:"8px 10px",fontSize:11,color:"#78716c",width:"25%"}}>
                            {PADEZI_FULL.caseQs[ci]}
                          </td>
                          <td style={{padding:"8px 10px",fontWeight:600}}>
                            {w.forms[ci]}
                            {" 🔊"}
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              );})}
            </React.Fragment>
          );})()}
        </React.Fragment>}
        {pfTab==="plur"&&pfMode==="learn"&&<React.Fragment>
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {["f","n","m"].map(function(g){return (
              <button
                key={g}
                className={"b "+(pfGender===g?"bw":"bg")}
                style={{fontSize:12,padding:"6px 14px"}}
                onClick={function(){sPfGender(g)}}>
                {g==="f"?"🔴 Ženski":g==="n"?"🟢 Srednji":"🔵 Muški"}
              </button>
            );})}
          </div>
          {(function(){var data=PADEZI_FULL.plurEndings[pfGender];return (
            <React.Fragment>
              <div
                className="c"
                style={{marginBottom:12,borderLeft:"4px solid "+(pfGender==="f"?"#dc2626":pfGender==="n"?"#16a34a":"#0e7490")}}>
                <div style={{fontSize:15,fontWeight:800}}>
                  {data.label}
                </div>
                <div style={{fontSize:13,color:"#78716c",marginTop:4}}>
                  {"Noun: "}
                  {data.endings.join(" / ")}
                </div>
                <div style={{fontSize:13,color:"#7c3aed",marginTop:2}}>
                  {"Adj: "}
                  {data.adjEnd.join(" / ")}
                </div>
              </div>
              {data.words.map(function(w,wi){return (
                <div
                  key={wi}
                  className="c"
                  style={{marginBottom:12,padding:0,overflow:"hidden"}}>
                  <div
                    style={{padding:"10px 14px",background:pfGender==="f"?"linear-gradient(135deg,#dc2626,#b91c1c)":pfGender==="n"?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#0e7490,#164e63)",color:"#fff",fontWeight:700,fontSize:14}}>
                    {w.adj}
                    {" "}
                    {w.nom}
                    {" ("}
                    {w.en}
                    )
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <tbody>
                      {PADEZI_FULL.caseNames.map(function(cn,ci){return (
                        <tr
                          key={ci}
                          style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}
                          onClick={function(){speak(w.forms[ci])}}>
                          <td style={{padding:"8px 10px",fontWeight:700,width:"30%"}}>
                            {cn}
                          </td>
                          <td style={{padding:"8px 10px",fontWeight:600}}>
                            {w.forms[ci]}
                            {" 🔊"}
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              );})}
            </React.Fragment>
          );})()}
        </React.Fragment>}
        {pfMode==="quiz"&&(function(){if(!pfQ.length)return null;var total=pfQ.length;if(pfI>=total){var pct=Math.round((pfS/total)*100);return (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:64}}>
              {pct>=80?"🏆":"📚"}
            </div>
            <h2>
              {pfS}
              {" / "}
              {total}
            </h2>
            <button className="b bp" onClick={function(){award(pfS*5);goBack()}}>
              🏠 Finish
            </button>
          </div>
        );}var q=pfQ[pfI];if(!pfA)return (
          <React.Fragment>
            <Bar v={pfI+1} mx={total} />
            <div className="c" style={{marginTop:16}}>
              <div style={{fontSize:12,color:"#b45309",fontWeight:600}}>
                {"Base: "}
                {q.base}
              </div>
              <div style={{fontSize:18,marginTop:8}}>
                {q.sentence.replace("___","___")}
              </div>
              <div style={{fontSize:13,color:"#78716c",marginTop:4}}>
                {q.en}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
              {pfO.map(function(o,oi){return (
                <button
                  key={oi}
                  className="ob"
                  onClick={function(){sPfSl(oi);sPfA(true);if(o===q.answer)sPfS(function(s){return s+1})}}>
                  {o}
                </button>
              );})}
            </div>
          </React.Fragment>
        );if(pfA&&!pfCaseA)return (
          <React.Fragment>
            <div className="c" style={{textAlign:"center",marginTop:16}}>
              <div
                style={{fontSize:16,fontWeight:700,color:pfO[pfSl]===q.answer?"#16a34a":"#dc2626"}}>
                {pfO[pfSl]===q.answer?"✅ "+q.answer:"❌ "+q.answer}
              </div>
              <div style={{fontSize:12,color:"#78716c",marginTop:8}}>
                Which case?
              </div>
            </div>
            <div
              style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16,justifyContent:"center"}}>
              {PADEZI_FULL.caseNames.map(function(cn,ci){return (
                <button
                  key={ci}
                  style={{padding:"10px 16px",borderRadius:12,border:"2px solid "+(pfCaseA?(cn===q.caseName?"#16a34a":"#e7e5e4"):"#d6d3d1"),background:pfCaseA?(cn===q.caseName?"#dcfce7":"white"):"white",fontWeight:700,cursor:"pointer"}}
                  onClick={function(){if(!pfCaseA){sPfCaseSl(ci);sPfCaseA(true);if(cn===q.caseName&&pfO[pfSl]===q.answer)sPfS(function(s){return s+0.5})}}}>
                  {cn}
                </button>
              );})}
            </div>
          </React.Fragment>
        );return (
          <div style={{textAlign:"center",marginTop:16}}>
            <div style={{fontSize:16,fontWeight:700}}>
              {q.answer}
              {" ("}
              {q.caseName}
              )
            </div>
            <button
              className="b bp"
              style={{marginTop:16}}
              onClick={function(){if(pfI<total-1){var n=pfQ[pfI+1];sPfO(n.opts);sPfI(pfI+1);sPfA(false);sPfSl(-1);sPfCaseA(false);sPfCaseSl(-1)}else sPfI(total)}}>
              Next →
            </button>
          </div>
        );})()}
      </div>}
      {// ═══ VERB ASPECT ═══
      scr==="aspect"&&<AspectScreen goBack={goBack} />}
      {scr==="aspect_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🔄 Verb Aspect","Perfective vs Imperfective")}
        {ASPECT.pairs.map(function(p,i){return (
          <div key={i} className="c" style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span
                style={{fontWeight:700,color:"#dc2626",cursor:"pointer"}}
                onClick={function(){speak(p.imp)}}>
                {p.imp}
                {" 🔊"}
              </span>
              <span
                style={{fontWeight:700,color:"#16a34a",cursor:"pointer"}}
                onClick={function(){speak(p.perf)}}>
                {p.perf}
                {" 🔊"}
              </span>
            </div>
            <div style={{fontSize:13,color:"#78716c"}}>
              {p.en}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ FALSE FRIENDS ═══
      scr==="falsefr"&&<FalseFriendsScreen goBack={goBack} />}
      {scr==="falsefr_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("⚠️ False Friends","Croatian words that trick English speakers")}
        {FALSEFR.map(function(f,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:10,cursor:"pointer"}}
            onClick={function(){speak(f.hr)}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>
                {f.hr}
                {" 🔊"}
              </span>
              <span style={{fontSize:14,color:"#78716c"}}>
                {"Looks like: "}
                {f.looks}
              </span>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:4}}>
              {"Actually means: "}
              {f.means}
            </div>
            {f.ex&&<div style={{fontSize:12,color:"#78716c",fontStyle:"italic",marginTop:2}}>
              {f.ex}
            </div>}
          </div>
        );})}
      </div>}
      {// ═══ PREPOSITION DRILLS ═══
      scr==="prepdrill"&&<PrepDrill goBack={goBack} award={award} />}
      {scr==="prepdrill_OLD"&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📍 Preposition Drills","Fill in the correct preposition")}
        {(function(){if(!ppQ.length)return null;var total=ppQ.length;if(ppI>=total)return (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:64}}>
              {ppS>=total*0.8?"🏆":"📚"}
            </div>
            <h2>
              {ppS}
              {" / "}
              {total}
            </h2>
            <button className="b bp" onClick={function(){award(ppS*5);goBack()}}>
              🏠 Done
            </button>
          </div>
        );var q=ppQ[ppI];return (
          <React.Fragment>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span>
                {ppI+1}
                {" / "}
                {total}
              </span>
              <span style={{color:"#0e7490",fontWeight:700}}>
                {"Score: "}
                {ppS}
              </span>
            </div>
            <Bar v={ppI+1} mx={total} />
            <div className="c" style={{marginTop:16}}>
              <div style={{fontSize:18}}>
                {q.sentence}
              </div>
              <div style={{fontSize:13,color:"#78716c",marginTop:4}}>
                {q.en}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:16}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  className="ob"
                  style={{textAlign:"center",background:ppA?(o===q.answer?"#dcfce7":ppSl===oi?"#fee2e2":"white"):"white",borderColor:ppA?(o===q.answer?"#16a34a":ppSl===oi?"#dc2626":"rgba(14,116,144,.12)"):"rgba(14,116,144,.12)"}}
                  onClick={function(){if(!ppA){sPpSl(oi);sPpA(true);if(o===q.answer)sPpS(ppS+1)}}}>
                  {o}
                </button>
              );})}
            </div>
            {ppA&&<button
              className="b bp"
              style={{width:"100%",marginTop:16}}
              onClick={function(){sPpI(ppI+1);sPpA(false);sPpSl(-1)}}>
              Next →
            </button>}
          </React.Fragment>
        );})()}
      </div>}
      {// ═══ DECLENSION TRAINER ═══
      scr==="declension"&&<DeclensionScreen goBack={goBack} />}
      {scr==="declension_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📝 Noun Declension Trainer","All 7 cases for key nouns")}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {DECL.nouns.map(function(n,i){return (
            <button
              key={i}
              className={"b "+(dcNoun===i?"bp":"bg")}
              style={{fontSize:13}}
              onClick={function(){sDcNoun(i)}}>
              {n.nom}
              {" ("}
              {n.en}
              )
            </button>
          );})}
        </div>
        {(function(){var n=DECL.nouns[dcNoun];return (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <tbody>
              {DECL.cases.map(function(cs,ci){return (
                <tr
                  key={ci}
                  style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer"}}
                  onClick={function(){speak(n.forms[ci])}}>
                  <td style={{padding:"10px",fontWeight:700,color:"#0e7490"}}>
                    {(ci+1)+". "}
                    {cs}
                  </td>
                  <td style={{padding:"10px",fontWeight:600,fontSize:16}}>
                    {n.forms[ci]}
                    {" 🔊"}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        );})()}
      </div>}
      {// ═══ TONGUE TWISTERS ═══
      scr==="brzalice"&&<BrzaliceScreen goBack={goBack} />}
      {scr==="brzalice_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("😝 Brzalice","Croatian Tongue Twisters")}
        {shMemo("bz",BRZALICE).map(function(b,i){return (
          <div key={i} className="c" style={{marginBottom:12}}>
            <div
              style={{fontSize:16,fontWeight:700,color:"#164e63",cursor:"pointer"}}
              onClick={function(){speak(b.hr)}}>
              {b.hr}
              {" 🔊"}
            </div>
            <div style={{fontSize:13,color:"#78716c",marginTop:4}}>
              {b.en}
            </div>
            <div style={{fontSize:12,color:"#b45309",marginTop:2}}>
              {"Target: "}
              {b.target}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ DIALECTS ═══
      scr==="dialects"&&<DialectsScreen goBack={goBack} />}
      {scr==="dialects_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🗺️ Regional Dialects","Štokavski, Kajkavski, Čakavski")}
        {DIALECTS.info.map(function(d,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:12,borderLeft:"4px solid "+["#0e7490","#7c3aed","#dc2626"][i]}}>
            <div style={{fontSize:16,fontWeight:800}}>
              {d.name}
            </div>
            <div style={{fontSize:13,color:"#78716c",marginTop:4}}>
              {d.region}
            </div>
            <div style={{fontSize:13,marginTop:4}}>
              {d.desc}
            </div>
          </div>
        );})}
        <h3 className="sh" style={{marginTop:16}}>
          Comparison Table
        </h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr>
              {["English","Što","Kaj","Ča"].map(function(h,i){return (
                <th
                  key={i}
                  style={{padding:"8px",borderBottom:"2px solid #e7e5e4",textAlign:"left"}}>
                  {h}
                </th>
              );})}
            </tr>
          </thead>
          <tbody>
            {DIALECTS.compare.map(function(r,i){return (
              <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"8px",color:"#78716c"}}>
                  {r.en}
                </td>
                <td style={{padding:"8px",fontWeight:600}}>
                  {r.sto}
                </td>
                <td style={{padding:"8px",fontWeight:600}}>
                  {r.kaj}
                </td>
                <td style={{padding:"8px",fontWeight:600}}>
                  {r.ca}
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>}
      {// ═══ DIMINUTIVES ═══
      scr==="diminutives"&&<DiminutivesScreen goBack={goBack} />}
      {scr==="diminutives_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🐣 Umanjenice","Diminutives — making things small & cute")}
        {DIMWORDS.map(function(d,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
            onClick={function(){speak(d.dim)}}>
            <div>
              <span style={{fontSize:15,fontWeight:700}}>
                {d.base}
              </span>
              <span style={{color:"#78716c"}}>
                {" → "}
              </span>
              <span style={{fontSize:15,fontWeight:700,color:"#16a34a"}}>
                {d.dim}
                {" 🔊"}
              </span>
            </div>
            <div style={{fontSize:12,color:"#78716c"}}>
              {d.suffix}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ WORD FORMATION ═══
      scr==="wordform"&&<WordFormScreen goBack={goBack} />}
      {scr==="wordform_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🧩 Word Formation","How prefixes build Croatian vocabulary")}
        {WORDFORM.bases.map(function(b,bi){return (
          <div key={bi} className="c" style={{marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>
              {"Base: "}
              {b.verb}
              {" ("}
              {b.en}
              )
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {b.derived.map(function(d,di){return (
                <div
                  key={di}
                  style={{padding:"6px 0",cursor:"pointer",fontSize:14}}
                  onClick={function(){speak(d[0])}}>
                  <span style={{fontWeight:700,color:"#0e7490"}}>
                    {d[0]}
                    {" 🔊"}
                  </span>
                  {" — "}
                  <span style={{color:"#78716c",fontSize:12}}>
                    {d[1]}
                  </span>
                </div>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ COLOR QUIRKS ═══
      scr==="colorquirk"&&<ColorQuirkScreen goBack={goBack} />}
      {scr==="svojmoj"&&<SvojMojScreen goBack={goBack} award={award} />}
      {scr==="colorquirk_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🎨 Color Quirks","Colors mean different things in Croatian!")}
        {COLORQUIRK.map(function(q,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:10,cursor:"pointer"}}
            onClick={function(){speak(q.hr)}}>
            <div style={{fontSize:16,fontWeight:700,color:"#164e63"}}>
              {q.hr}
              {" 🔊"}
            </div>
            <div style={{fontSize:14,color:"#0e7490",marginTop:2}}>
              {"Literal: "}
              {q.literal}
            </div>
            <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:2}}>
              {"Means: "}
              {q.means}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ TYPING PRACTICE ═══
      scr==="typing"&&<TypingScreen goBack={goBack} award={award} />}
      {scr==="typing_OLD"&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("⌨️ Typing Practice","Type Croatian words with special characters")}
        {(function(){if(!tyPool.length||!tyW)return null;if(tyI>=tyPool.length)return (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:64}}>
              {tyS>=tyPool.length*0.8?"🏆":"📚"}
            </div>
            <h2>
              {tyS}
              {" / "}
              {tyPool.length}
            </h2>
            <button className="b bp" onClick={function(){award(tyS*5);goBack()}}>
              🏠 Done
            </button>
          </div>
        );return (
          <React.Fragment>
            <Bar v={tyI+1} mx={tyPool.length} />
            <div className="c" style={{textAlign:"center",marginTop:16}}>
              <div style={{fontSize:13,color:"#78716c"}}>
                Type this word in Croatian:
              </div>
              <div style={{fontSize:24,fontWeight:800,color:"#164e63",marginTop:8}}>
                {tyW[1]}
              </div>
              <div style={{fontSize:13,color:"#78716c",marginTop:4}}>
                (
                {tyW[0]}
                )
              </div>
            </div>
            <input
              type="text"
              value={tyIn}
              onChange={function(e){sTyIn(e.target.value)}}
              onKeyDown={function(e){if(e.key==="Enter"&&!tyA){sTyA(true);if(tyIn.trim().toLowerCase()===tyW[0].toLowerCase())sTyS(tyS+1)}}}
              placeholder="Type Croatian..."
              style={{marginTop:16,textAlign:"center",fontSize:18}} />
            <div
              style={{display:"flex",gap:6,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
              {["č","ć","š","ž","đ"].map(function(ch){return (
                <button
                  key={ch}
                  style={{padding:"8px 16px",border:"2px solid #e7e5e4",borderRadius:10,fontSize:18,fontWeight:700,cursor:"pointer",background:"white"}}
                  onClick={function(){sTyIn(tyIn+ch)}}>
                  {ch}
                </button>
              );})}
            </div>
            {tyA&&<div style={{textAlign:"center",marginTop:16}}>
              <div
                style={{fontSize:18,fontWeight:700,color:tyIn.trim().toLowerCase()===tyW[0].toLowerCase()?"#16a34a":"#dc2626"}}>
                {tyIn.trim().toLowerCase()===tyW[0].toLowerCase()?"✅ Correct!":"❌ "+tyW[0]}
              </div>
              <button
                className="b bp"
                style={{marginTop:12}}
                onClick={function(){var next=tyI+1;sTyI(next);sTyA(false);sTyIn("");if(next<tyPool.length)sTyW(tyPool[next])}}>
                Next →
              </button>
            </div>}
          </React.Fragment>
        );})()}
      </div>}
      {// ═══ TENSES & GENDER CONJUGATION ═══
      scr==="tenses"&&<TensesScreen goBack={goBack} award={award} />}
      {scr==="tenses_OLD"&&<div
        style={{maxWidth:680,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🔄 Tenses & Gender","Past / Present / Future — How men & women speak differently")}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {["learn","rules","quiz"].map(function(m){return (
            <button
              key={m}
              className={"b "+(tnMode===m?"bp":"bg")}
              style={{fontSize:13,padding:"8px 16px"}}
              onClick={function(){setTnMode(m);if(m==="quiz"){var qs=[];TENSES.verbs.forEach(function(v,vi){["present","past","future"].forEach(function(t){var pidx=Math.floor(Math.random()*6);var gnd=Math.random()>0.5?"m":"f";var forms=t==="present"?v.present:t==="past"?(gnd==="m"?v.pastM:v.pastF):(gnd==="m"?v.futureM:v.futureF);var correct=forms[pidx];var person=TENSES.persons[pidx];var wrongForms=TENSES.verbs.filter(function(_,i){return i!==vi}).map(function(wv){var wf=t==="present"?wv.present:t==="past"?(gnd==="m"?wv.pastM:wv.pastF):(gnd==="m"?wv.futureM:wv.futureF);return wf[pidx]});var wrongs=sh(wrongForms).slice(0,3);qs.push({verb:v.inf,en:v.en,tense:t,person:person,personEn:TENSES.personsEn[pidx],gender:gnd,answer:correct,opts:sh([correct].concat(wrongs))})})});qs=sh(qs).slice(0,15);setTnQ(qs);setTnI(0);setTnS(0);setTnA(false);setTnSl(-1);setTnO(qs[0].opts)}}}>
              {m==="learn"?"📖 Learn":m==="rules"?"📌 Rules":"🏆 Quiz"}
            </button>
          );})}
        </div>
        {// ═══ LEARN MODE ═══
        tnMode==="learn"&&<React.Fragment>
          <div style={{display:"flex",gap:8,marginBottom:12,justifyContent:"center"}}>
            <button
              style={{padding:"8px 20px",borderRadius:12,border:"2px solid "+(tnGender==="m"?"#0e7490":"#e7e5e4"),background:tnGender==="m"?"rgba(14,116,144,.08)":"white",fontWeight:700,fontSize:14,cursor:"pointer",color:tnGender==="m"?"#0e7490":"#78716c"}}
              onClick={function(){setTnGender("m")}}>
              👨 Muško (Male)
            </button>
            <button
              style={{padding:"8px 20px",borderRadius:12,border:"2px solid "+(tnGender==="f"?"#dc2626":"#e7e5e4"),background:tnGender==="f"?"rgba(220,38,38,.06)":"white",fontWeight:700,fontSize:14,cursor:"pointer",color:tnGender==="f"?"#dc2626":"#78716c"}}
              onClick={function(){setTnGender("f")}}>
              👩 Žensko (Female)
            </button>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:16,justifyContent:"center"}}>
            {["present","past","future"].map(function(t){return (
              <button
                key={t}
                className={"b "+(tnTense===t?"bw":"bg")}
                style={{fontSize:13,padding:"6px 16px"}}
                onClick={function(){setTnTense(t)}}>
                {t==="present"?"Sadašnjost":t==="past"?"Prošlost":"Budućnost"}
              </button>
            );})}
          </div>
          <div
            style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16,justifyContent:"center"}}>
            {TENSES.verbs.map(function(v,i){return (
              <button
                key={i}
                style={{padding:"6px 12px",borderRadius:10,border:"2px solid "+(tnVerb===i?"#164e63":"#e7e5e4"),background:tnVerb===i?"#164e63":"white",color:tnVerb===i?"white":"#44403c",fontWeight:600,fontSize:12,cursor:"pointer"}}
                onClick={function(){setTnVerb(i)}}>
                {v.inf}
              </button>
            );})}
          </div>
          {(function(){var v=TENSES.verbs[tnVerb];var forms=tnTense==="present"?v.present:tnTense==="past"?(tnGender==="m"?v.pastM:v.pastF):(tnGender==="m"?v.futureM:v.futureF);
            var tenseLabel=tnTense==="present"?"Sadašnjost (Present)":tnTense==="past"?"Prošlost (Past)":"Budućnost (Future)";
            return (
              <React.Fragment>
                <div
                  className="c"
                  style={{marginBottom:12,borderLeft:"4px solid "+(tnGender==="m"?"#0e7490":"#dc2626"),padding:0,overflow:"hidden"}}>
                  <div
                    style={{padding:"12px 16px",background:tnGender==="m"?"linear-gradient(135deg,#0e7490,#164e63)":"linear-gradient(135deg,#dc2626,#9f1239)",color:"#fff"}}>
                    <div style={{fontSize:18,fontWeight:800}}>
                      {v.inf}
                      {" — "}
                      {v.en}
                    </div>
                    <div style={{fontSize:13,opacity:.85,marginTop:2}}>
                      {tenseLabel}
                      {" • "}
                      {tnGender==="m"?"Speaking as male":"Speaking as female"}
                    </div>
                  </div>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <tbody>
                      {forms.map(function(f,fi){
                        var isSpeaker=(fi===0||fi===1||fi===4||fi===5);
                        var personLabel=TENSES.persons[fi]+(fi===2?" (he)":fi===3?" (she)":fi===6?" (they m)":fi===7?" (they f)":"");
                        return (
                          <tr
                            key={fi}
                            style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer",background:isSpeaker?"rgba(14,116,144,.03)":"white"}}
                            onClick={function(){speak(TENSES.persons[fi]+" "+f)}}>
                            <td
                              style={{padding:"10px 14px",fontWeight:700,color:"#7c3aed",width:"20%",fontSize:14}}>
                              {TENSES.persons[fi]}
                            </td>
                            <td
                              style={{padding:"10px 14px",fontWeight:700,fontSize:15,color:fi<=1||fi===4||fi===5?(tnGender==="m"?"#0e7490":"#dc2626"):"#44403c"}}>
                              {f}
                              {" 🔊"}
                            </td>
                            <td style={{padding:"10px 14px",fontSize:11,color:"#a8a29e"}}>
                              {TENSES.personsEn[fi]}
                            </td>
                          </tr>
                        );})}
                    </tbody>
                  </table>
                </div>
                {v.note&&<div
                  className="c"
                  style={{borderLeft:"4px solid #f59e0b",background:"#fffbeb",marginTop:8}}>
                  <div style={{fontSize:13,color:"#92400e"}}>
                    {"💡 "}
                    {v.note}
                  </div>
                </div>}
                {tnTense==="past"&&<div
                  className="c"
                  style={{marginTop:12,background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",borderLeft:"4px solid #7c3aed"}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#7c3aed",marginBottom:8}}>
                    {"♂️ vs ♀️ Gender Comparison (ja + "}
                    {v.inf}
                    )
                  </div>
                  <div style={{display:"flex",gap:16}}>
                    <div
                      style={{flex:1,cursor:"pointer"}}
                      onClick={function(){speak("ja "+v.pastM[0])}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#0e7490"}}>
                        👨 Male:
                      </div>
                      <div style={{fontSize:16,fontWeight:800}}>
                        {"Ja "}
                        {v.pastM[0]}
                        {" 🔊"}
                      </div>
                    </div>
                    <div
                      style={{flex:1,cursor:"pointer"}}
                      onClick={function(){speak("ja "+v.pastF[0])}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>
                        👩 Female:
                      </div>
                      <div style={{fontSize:16,fontWeight:800}}>
                        {"Ja "}
                        {v.pastF[0]}
                        {" 🔊"}
                      </div>
                    </div>
                  </div>
                </div>}
              </React.Fragment>
            );})()}
        </React.Fragment>}
        {// ═══ RULES MODE ═══
        tnMode==="rules"&&<React.Fragment>
          <div
            className="c"
            style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>
              Why Gender Matters
            </div>
            <div style={{fontSize:14,marginTop:6,lineHeight:1.7}}>
              In Croatian, the PAST TENSE changes based on the speaker's gender. If you are a man, you say 'Išao sam' (I went). If you are a woman, you say 'Išla sam.' This is one of the FIRST things Croatians notice about your Croatian. Getting it right marks you as a serious learner.
            </div>
          </div>
          {TENSES.genderRules.map(function(r,i){return (
            <div key={i} className="c" style={{marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:800,color:"#164e63"}}>
                {r.rule}
              </div>
              <div style={{fontSize:13,color:"#44403c",marginTop:4,lineHeight:1.6}}>
                {r.desc}
              </div>
            </div>
          );})}
        </React.Fragment>}
        {// ═══ QUIZ MODE ═══
        tnMode==="quiz"&&(function(){if(!tnQ.length)return null;var total=tnQ.length;
          if(tnI>=total){var pct=Math.round((tnS/total)*100);return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {pct>=80?"🏆":pct>=50?"👍":"📚"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                Tense Quiz Complete!
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>
                {tnS}
                {" / "}
                {total}
              </div>
              <button
                className="b bp"
                style={{marginTop:16}}
                onClick={function(){award(tnS*5);goBack()}}>
                🏠 Finish
              </button>
            </div>
          );}
          var q=tnQ[tnI];
          return (
            <React.Fragment>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:14,fontWeight:700}}>
                  {tnI+1}
                  {" / "}
                  {total}
                </span>
                <span style={{fontSize:14,fontWeight:700,color:"#0e7490"}}>
                  {"Score: "}
                  {tnS}
                </span>
              </div>
              <Bar v={tnI+1} mx={total} />
              <div className="c" style={{marginTop:16}}>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <span
                    style={{padding:"3px 10px",background:q.tense==="present"?"#dbeafe":q.tense==="past"?"#fef3c7":"#dcfce7",borderRadius:10,fontSize:12,fontWeight:700}}>
                    {q.tense}
                  </span>
                  <span
                    style={{padding:"3px 10px",background:q.gender==="m"?"rgba(14,116,144,.1)":"rgba(220,38,38,.08)",borderRadius:10,fontSize:12,fontWeight:700,color:q.gender==="m"?"#0e7490":"#dc2626"}}>
                    {q.gender==="m"?"👨 Male":"👩 Female"}
                  </span>
                </div>
                <div style={{fontSize:13,color:"#78716c"}}>
                  {"Conjugate: "}
                  <b>
                    {q.verb}
                  </b>
                  {" ("}
                  {q.en}
                  )
                </div>
                <div style={{fontSize:20,fontWeight:800,color:"#164e63",marginTop:8}}>
                  {q.person}
                  {" + "}
                  {q.verb}
                  {" = ?"}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
                {tnO.map(function(o,oi){return (
                  <button
                    key={oi}
                    className="ob"
                    style={{background:tnA?(o===q.answer?"#dcfce7":tnSl===oi?"#fee2e2":"white"):"white",borderColor:tnA?(o===q.answer?"#16a34a":tnSl===oi?"#dc2626":"rgba(14,116,144,.12)"):"rgba(14,116,144,.12)"}}
                    onClick={function(){if(!tnA){setTnSl(oi);setTnA(true);if(o===q.answer)setTnS(tnS+1)}}}>
                    {o}
                  </button>
                );})}
              </div>
              {tnA&&<button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={function(){if(tnI<total-1){var n=tnQ[tnI+1];setTnO(n.opts);setTnI(tnI+1);setTnA(false);setTnSl(-1)}else setTnI(total)}}>
                {tnI<total-1?"Next →":"See Results"}
              </button>}
            </React.Fragment>
          );})()}
      </div>}
      {// ═══ INTERACTIVE MAP ═══
      scr==="crmap"&&<CrMap goBack={goBack} />}
      {scr==="crmap_OLD"&&<div
        style={{maxWidth:680,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🗺️ Interactive Map","Explore Croatia & get directions")}
        <div
          style={{borderRadius:14,overflow:"hidden",marginBottom:16,border:"2px solid rgba(14,116,144,.12)"}}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2800000!2d16.0!3d44.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2shr"
            width="100%"
            height="300"
            style={{border:"none",display:"block"}}
            loading="lazy"
            allowFullScreen={true}
            referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          <button
            style={{padding:"6px 14px",borderRadius:10,border:"2px solid "+(mapCat==="all"?"#164e63":"#e7e5e4"),background:mapCat==="all"?"#164e63":"white",color:mapCat==="all"?"white":"#44403c",fontWeight:600,fontSize:12,cursor:"pointer"}}
            onClick={function(){setMapCat("all")}}>
            All
          </button>
          {MAPPLACES.categories.map(function(cat){return (
            <button
              key={cat.id}
              style={{padding:"6px 14px",borderRadius:10,border:"2px solid "+(mapCat===cat.id?cat.color:"#e7e5e4"),background:mapCat===cat.id?cat.color:"white",color:mapCat===cat.id?"white":"#44403c",fontWeight:600,fontSize:12,cursor:"pointer"}}
              onClick={function(){setMapCat(cat.id)}}>
              {cat.label}
            </button>
          );})}
        </div>
        {MAPPLACES.places.filter(function(p){return mapCat==="all"||p.cat===mapCat}).map(function(p,i){
          var catInfo=MAPPLACES.categories.find(function(c){return c.id===p.cat});
          return (
            <div
              key={i}
              className="c"
              style={{marginBottom:8,padding:"12px 14px",borderLeft:"4px solid "+(catInfo?catInfo.color:"#e7e5e4"),cursor:"pointer"}}
              onClick={function(){setMapSel(mapSel===i?null:i)}}>
              <div
                style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"#164e63"}}>
                    {p.name}
                  </div>
                  <div style={{fontSize:12,color:"#78716c",marginTop:2}}>
                    {p.desc}
                  </div>
                </div>
                <div
                  style={{fontSize:11,padding:"3px 8px",background:catInfo?catInfo.color+"18":"#f3f4f6",borderRadius:10,color:catInfo?catInfo.color:"#78716c",fontWeight:600}}>
                  {catInfo?catInfo.label.split(" ")[1]:""}
                </div>
              </div>
              {mapSel===i&&<div
                style={{display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:"1px solid #f3f4f6"}}>
                <div
                  style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer"}}
                  onClick={function(){window.open("https://www.google.com/maps/dir/?api=1&destination="+p.lat+","+p.lng+"&travelmode=driving","_blank","noopener,noreferrer")}}>
                  🚧 Driving
                </div>
                <div
                  style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer"}}
                  onClick={function(){window.open("https://www.google.com/maps/search/?api=1&query="+p.lat+","+p.lng,"_blank","noopener,noreferrer")}}>
                  🗺️ Map
                </div>
                <div
                  style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 14px",background:"#16a34a",color:"white",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer"}}
                  onClick={function(){window.open("https://www.google.com/maps/dir/?api=1&destination="+p.lat+","+p.lng+"&travelmode=walking","_blank","noopener,noreferrer")}}>
                  🚶
                </div>
              </div>}
            </div>
          );})}
      </div>}
      {// ═══ GROCERY SHOPPING ═══
      scr==="grocery"&&<GroceryScreen goBack={goBack} />}
      {scr==="grocery_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🛒 Grocery Shopping","Stores, brands & essential vocab")}
        <h3 className="sh">
          🏪 Supermarket Chains
        </h3>
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
          {GROCERY.stores.map(function(s,i){return (
            <div
              key={i}
              className="c"
              style={{textAlign:"center",padding:"10px",borderTop:"3px solid "+s.color}}>
              <div style={{fontSize:14,fontWeight:800}}>
                {s.name}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {s.desc}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          ⭐ Croatian Brands to Know
        </h3>
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {GROCERY.brands.map(function(b,i){return (
            <div key={i} className="c" style={{padding:"8px 12px"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#164e63"}}>
                {b[0]}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {b[1]}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          📚 Shopping Vocabulary
        </h3>
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {GROCERY.vocab.map(function(w,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer"}}
              onClick={function(){speak(w[0])}}>
              <div style={{fontSize:13,fontWeight:700,color:"#0e7490"}}>
                {w[0]}
                {" 🔊"}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {w[1]}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          🗣️ At the Store
        </h3>
        {GROCERY.phrases.map(function(p,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer"}}
            onClick={function(){speak(p[0])}}>
            <span style={{fontWeight:700,fontSize:14}}>
              {p[0]}
              {" 🔊"}
            </span>
            <span style={{color:"#78716c",fontSize:13}}>
              {p[1]}
            </span>
          </div>
        );})}
      </div>}
      {// ═══ RECIPES ═══
      scr==="recipes"&&<RecipesScreen goBack={goBack} />}
      {scr==="recipes_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🍳 Croatian Recipes","Cook & learn vocabulary")}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {RECIPES.map(function(r,i){return (
            <button
              key={i}
              className={"b "+(rcIdx===i?"bp":"bg")}
              style={{fontSize:13}}
              onClick={function(){setRcIdx(i);setRcServ(r.servings)}}>
              {r.name}
            </button>
          );})}
        </div>
        {(function(){var r=RECIPES[rcIdx];var scale=rcServ/r.servings;return (
          <React.Fragment>
            <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b"}}>
              <div style={{fontSize:18,fontWeight:800,color:"#164e63"}}>
                {r.name}
              </div>
              <div style={{fontSize:14,color:"#78716c"}}>
                {r.en}
                {" • "}
                {r.time}
                {" min"}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
                <span style={{fontSize:13,fontWeight:700}}>
                  Servings:
                </span>
                <button
                  style={{width:32,height:32,borderRadius:"50%",border:"2px solid #0e7490",background:"white",fontWeight:800,fontSize:16,cursor:"pointer"}}
                  onClick={function(){if(rcServ>1)setRcServ(rcServ-1)}}>
                  -
                </button>
                <span style={{fontSize:20,fontWeight:800,minWidth:30,textAlign:"center"}}>
                  {rcServ}
                </span>
                <button
                  style={{width:32,height:32,borderRadius:"50%",border:"2px solid #0e7490",background:"white",fontWeight:800,fontSize:16,cursor:"pointer"}}
                  onClick={function(){setRcServ(rcServ+1)}}>
                  +
                </button>
              </div>
            </div>
            <h3 className="sh">
              🥚 Ingredients (scaled)
            </h3>
            {r.ing.map(function(ig,i){var amt=ig[0];var num=parseFloat(amt);var unit=amt.replace(/[0-9./]+/g,"").trim();var scaled=!isNaN(num)?Math.round(num*scale*10)/10+unit:amt;return (
              <div
                key={i}
                style={{padding:"6px 0",fontSize:14,borderBottom:"1px solid #f3f4f6",display:"flex",gap:8,cursor:"pointer"}}
                onClick={function(){speak(ig[1].split("(")[0])}}>
                <span style={{fontWeight:800,color:"#0e7490",minWidth:60}}>
                  {scaled}
                </span>
                <span>
                  {ig[1]}
                  {" 🔊"}
                </span>
              </div>
            );})}
            <h3 className="sh" style={{marginTop:16}}>
              👨‍🍳 Steps
            </h3>
            {r.steps.map(function(s,i){return (
              <div
                key={i}
                className="c"
                style={{marginBottom:8,display:"flex",gap:12,cursor:"pointer"}}
                onClick={function(){speak(s.split("(")[0])}}>
                <div
                  style={{width:28,height:28,borderRadius:"50%",background:"#0e7490",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>
                  {i+1}
                </div>
                <div style={{fontSize:14,lineHeight:1.6}}>
                  {s}
                  {" 🔊"}
                </div>
              </div>
            );})}
          </React.Fragment>
        );})()}
      </div>}
      {// ═══ CONVERSATION ROLE-PLAY ═══
      scr==="roleplay"&&<RoleplayScreen goBack={goBack} />}
      {scr==="roleplay_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🎭 Conversation Role-Play","Practice real-life dialogues")}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          {ROLEPLAY.map(function(r,i){return (
            <button
              key={i}
              className={"b "+(rpIdx===i?"bp":"bg")}
              style={{fontSize:12}}
              onClick={function(){setRpIdx(i);setRpLine(0);setRpShow(false)}}>
              {r.title}
            </button>
          );})}
        </div>
        {(function(){var r=ROLEPLAY[rpIdx];return (
          <React.Fragment>
            <div
              className="c"
              style={{marginBottom:16,borderLeft:"4px solid #7c3aed",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)"}}>
              <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>
                {r.title}
              </div>
              <div style={{fontSize:13,color:"#78716c"}}>
                {r.en}
              </div>
            </div>
            {r.lines.slice(0,rpLine+1).map(function(l,i){return (
              <div
                key={i}
                style={{display:"flex",justifyContent:l.you?"flex-end":"flex-start",marginBottom:8}}>
                <div
                  style={{maxWidth:"80%",padding:"12px 16px",borderRadius:l.you?"16px 16px 4px 16px":"16px 16px 16px 4px",background:l.you?"linear-gradient(135deg,#0e7490,#164e63)":"rgba(255,255,255,.8)",color:l.you?"white":"#1c1917",cursor:"pointer",border:l.you?"none":"1px solid #e7e5e4"}}
                  onClick={function(){speak(l.text)}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:4,opacity:.7}}>
                    {l.speaker}
                  </div>
                  <div style={{fontSize:15,fontWeight:600}}>
                    {l.text}
                    {" 🔊"}
                  </div>
                  {rpShow&&<div style={{fontSize:12,marginTop:4,opacity:.7,fontStyle:"italic"}}>
                    {l.en}
                  </div>}
                </div>
              </div>
            );})}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              {rpLine<r.lines.length-1&&<button
                className="b bp"
                style={{flex:1}}
                onClick={function(){setRpLine(rpLine+1)}}>
                Next Line →
              </button>}
              <button className="b bg" onClick={function(){setRpShow(!rpShow)}}>
                {rpShow?"Hide English":"Show English"}
              </button>
              {rpLine>=r.lines.length-1&&<button
                className="b bp"
                style={{flex:1}}
                onClick={function(){setRpLine(0);setRpShow(false);if(rpIdx<ROLEPLAY.length-1)setRpIdx(rpIdx+1)}}>
                ↻ Next Scenario
              </button>}
            </div>
          </React.Fragment>
        );})()}
      </div>}
      {// ═══ VOCABULARY JOURNAL ═══
      scr==="journal"&&<VocabJournal
        jWords={jWords} setJWords={setJWords} jIn={jIn} setJIn={setJIn}
        jEn={jEn} setJEn={setJEn} goBack={goBack}
      />}
      {// ═══ LEARNING PATH ═══
      scr==="learnpath"&&<LearnPath st={st} setScr={setScr} goBack={goBack} />}
      {// ═══ FAVORITES ═══
      scr==="favorites"&&<FavoritesScreen
        favs={favs} toggleFav={toggleFav} setScr={setScr} goBack={goBack}
      />}
      {// ═══ REFLEXIVE VERBS ═══
      scr==="reflexive"&&<ReflexiveScreen goBack={goBack} award={award} />}
      {scr==="reflexive_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🧲 "+REFLEXIVE.title,"SE verbs — essential for daily Croatian")}
        <div
          className="c"
          style={{marginBottom:16,padding:"12px 16px",background:"rgba(14,116,144,.06)"}}>
          <div style={{fontSize:13,color:"#164e63"}}>
            {REFLEXIVE.intro}
          </div>
        </div>
        {REFLEXIVE.verbs.map(function(v,vi){return (
          <div key={vi} className="c" style={{marginBottom:12}}>
            <div
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <span style={{fontSize:16,fontWeight:800,color:"#164e63"}}>
                  {v.inf}
                </span>
                <span style={{fontSize:13,color:"#78716c",marginLeft:8}}>
                  {v.en}
                </span>
              </div>
              <button
                style={{background:"none",border:"none",fontSize:16,cursor:"pointer"}}
                onClick={function(){speak(v.inf)}}>
                🔊
              </button>
            </div>
            <div
              style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,fontSize:12}}>
              {Object.keys(v.forms).map(function(p,pi){return (
                <div
                  key={pi}
                  style={{padding:"4px 8px",background:"rgba(14,116,144,.04)",borderRadius:10,cursor:"pointer"}}
                  onClick={function(){speak(v.forms[p])}}>
                  <span style={{fontWeight:700,color:"#0e7490"}}>
                    {p}
                    {": "}
                  </span>
                  {v.forms[p]}
                </div>
              );})}
            </div>
            <div style={{display:"flex",gap:8,marginTop:6,fontSize:12}}>
              <div
                style={{padding:"4px 8px",background:"#fef3c7",borderRadius:10,cursor:"pointer"}}
                onClick={function(){speak(v.past.m)}}>
                {"👨 "}
                {v.past.m}
              </div>
              <div
                style={{padding:"4px 8px",background:"#fce7f3",borderRadius:10,cursor:"pointer"}}
                onClick={function(){speak(v.past.f)}}>
                {"👩 "}
                {v.past.f}
              </div>
            </div>
          </div>
        );})}
        <h3 className="sh" style={{marginTop:20}}>
          🎯 Quick Quiz
        </h3>
        {(function(){var qi=Math.floor(Math.random()*REFLEXIVE.quiz.length);var q=REFLEXIVE.quiz[qi];return (
          <div className="c">
            <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>
              {"🇬🇧 "}
              {q.q}
            </div>
            {q.opts.map(function(o,oi){return (
              <button
                key={oi}
                className="ob"
                style={{display:"block",width:"100%",marginBottom:6,textAlign:"left"}}
                onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a)award(5);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        );})()}
      </div>}
      {// ═══ FILL-IN STORIES ═══
      scr==="fillstory"&&<FillStoryScreen goBack={goBack} award={award} />}
      {scr==="fillstory_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📝 Story Builder","Read and fill the blanks")}
        {FILL_STORIES.map(function(story,si){return (
          <div key={si} className="c" style={{marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>
              {"📖 "}
              {story.title}
            </div>
            {story.story.map(function(s,qi){return (
              <div key={qi} style={{marginBottom:10}}>
                <div style={{fontSize:13,color:"#44403c",marginBottom:4}}>
                  {s.text.replace("_____","______")}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {s.opts.map(function(o,oi){return (
                    <button
                      key={oi}
                      style={{padding:"6px 12px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                      onClick={function(e){var btns=e.target.parentNode.children;for(var i=0;i<btns.length;i++){btns[i].style.background="white";btns[i].style.borderColor="#d6d3d1"}e.target.style.background=o===s.blank?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===s.blank?"#16a34a":"#dc2626";if(o===s.blank)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                      {o}
                    </button>
                  );})}
                </div>
                <div style={{fontSize:11,color:"#a8a29e",marginTop:2}}>
                  {s.en}
                </div>
              </div>
            );})}
          </div>
        );})}
      </div>}
      {// ═══ CONVERSATION MATCH ═══
      scr==="convmatch"&&<ConvMatchScreen goBack={goBack} award={award} />}
      {scr==="convmatch_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("💬 Conversation Match","Pick the right response")}
        {CONVMATCH.map(function(conv,ci){return (
          <div key={ci} className="c" style={{marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>
              {"🗣️ "}
              {conv.title}
            </div>
            {conv.pairs.map(function(p,pi){return (
              <div
                key={pi}
                style={{marginBottom:12,paddingBottom:12,borderBottom:pi<conv.pairs.length-1?"1px solid #f3f4f6":"none"}}>
                <div
                  style={{fontSize:13,fontWeight:700,color:"#164e63",marginBottom:6,cursor:"pointer"}}
                  onClick={function(){speak(p.q)}}>
                  {"🗣️ "}
                  {p.q}
                </div>
                {[p.a,p.wrong].sort(function(){return Math.random()-0.5}).map(function(o,oi){return (
                  <button
                    key={oi}
                    style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:12,textAlign:"left",cursor:"pointer"}}
                    onClick={function(e){e.target.style.background=o===p.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===p.a?"#16a34a":"#dc2626";if(o===p.a){award(5);speak(p.a);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                    {o}
                  </button>
                );})}
              </div>
            );})}
          </div>
        );})}
      </div>}
      {// ═══ SCENE DESCRIPTION ═══
      scr==="scenes"&&<ScenesScreen goBack={goBack} />}
      {scr==="scenes_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🖼️ Describe the Scene","Answer questions about everyday situations")}
        {SCENES.map(function(scene,si){return (
          <div key={si} className="c" style={{marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:4}}>
              {scene.title}
            </div>
            <div style={{fontSize:12,color:"#78716c",marginBottom:10}}>
              {scene.desc}
            </div>
            {scene.qs.map(function(q,qi){return (
              <div key={qi} style={{marginBottom:10}}>
                <div
                  style={{fontSize:13,fontWeight:600,color:"#164e63",cursor:"pointer",marginBottom:4}}
                  onClick={function(){speak(q.q)}}>
                  {"🔊 "}
                  {q.q}
                  {q.hint?" ("+q.hint+" ...)":""}
                </div>
                <div style={{fontSize:12,color:"#78716c"}}>
                  {"🇬🇧 "}
                  {q.en}
                </div>
              </div>
            );})}
          </div>
        );})}
      </div>}
      {// ═══ PRONOUN CASES ═══
      scr==="pronouns"&&<PronounsScreen goBack={goBack} award={award} />}
      {scr==="pronouns_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🎯 Pronoun Cases","How ja/ti/on/ona change with prepositions")}
        <div
          className="c"
          style={{marginBottom:16,padding:"12px",fontSize:12,background:"rgba(14,116,144,.06)"}}>
          {PRONOUNCASE.intro}
        </div>
        <div style={{overflowX:"auto",marginBottom:20}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead>
              <tr>
                {["NOM","GEN","DAT","AKU","INST","LOK"].map(function(h,i){return (
                  <th
                    key={i}
                    style={{padding:"6px 4px",background:"#0e7490",color:"white",fontWeight:700}}>
                    {h}
                  </th>
                );})}
              </tr>
            </thead>
            <tbody>
              {PRONOUNCASE.table.map(function(r,ri){return (
                <tr key={ri} style={{background:ri%2?"#f0fdfa":"white"}}>
                  {[r.nom,r.gen,r.dat,r.aku,r.inst,r.lok].map(function(v,vi){return (
                    <td
                      key={vi}
                      style={{padding:"6px 4px",borderBottom:"1px solid #e7e5e4",cursor:"pointer",fontWeight:vi===0?700:400,color:vi===0?"#0e7490":"#44403c"}}
                      onClick={function(){speak(v)}}>
                      {v}
                    </td>
                  );})}
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <h3 className="sh">
          🧠 Fill the Blank
        </h3>
        {shMemo("pc",PRONOUNCASE.quiz,10).map(function(q,qi){return (
          <div key={qi} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
            <div
              style={{fontSize:13,fontWeight:600,marginBottom:6,cursor:"pointer"}}
              onClick={function(){speak(q.q.replace("_____",q.a))}}>
              {"🔊 "}
              {q.q}
            </div>
            <div style={{display:"flex",gap:6}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ GENDER & PLURALS ═══
      scr==="genderdrill"&&<GenderDrillScreen goBack={goBack} award={award} />}
      {scr==="genderdrill_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("♂️♀️ Gender, Plurals & Adjectives","Master noun genders and endings")}
        <h3 className="sh">
          📦 Sort by Gender — tap a word, then tap M / F / N
        </h3>
        {(function(){var words=GENDERDRILL.sort.slice().sort(function(){return Math.random()-0.5}).slice(0,12);return (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
            {words.map(function(w,i){return (
              <button
                key={i}
                style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){var correct=w.g==="m"?"#dbeafe":w.g==="f"?"#fce7f3":"#dcfce7";e.target.style.background=correct;e.target.style.borderColor=w.g==="m"?"#1e40af":w.g==="f"?"#db2777":"#16a34a";e.target.innerHTML=w.word+" ("+(w.g==="m"?"♂ M":w.g==="f"?"♀ F":"⚧ N")+")";award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {w.word}
              </button>
            );})}
          </div>
        );}())}
        <h3 className="sh">
          📐 Make it Plural
        </h3>
        {GENDERDRILL.plurals.slice(0,10).map(function(p,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:8,padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:14}}>
              <span style={{fontWeight:700,color:"#164e63"}}>
                {p.s}
              </span>
              {" → ?"}
            </div>
            <button
              style={{padding:"6px 12px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
              onClick={function(e){e.target.innerHTML=p.p;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(p.p);award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
              Show
            </button>
          </div>
        );})}
        <h3 className="sh" style={{marginTop:16}}>
          🎨 Pick the Right Adjective
        </h3>
        {GENDERDRILL.adjectives.map(function(a,i){return (
          <div key={i} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,marginBottom:6}}>
              <span style={{fontWeight:700,color:"#164e63"}}>
                {a.noun}
              </span>
              {" = "}
              {a.en}
              {" → _____ "}
              {a.noun}
            </div>
            <div style={{display:"flex",gap:6}}>
              {a.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===a.adj?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===a.adj?"#16a34a":"#dc2626";if(o===a.adj){award(3);speak(a.adj+" "+a.noun);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ SENTENCE BUILDER ═══
      scr==="sentbuild"&&<SentenceBuilderScreen goBack={goBack} award={award} />}
      {scr==="sentbuild_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🏗️ Build the Sentence","Translate English to Croatian")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12,color:"#164e63"}}>
          🇬🇧 Read the English sentence, then pick the correct Croatian translation.
        </div>
        {shMemo("sb",SENTBUILD,15).map(function(s,i){return (
          <div key={i} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#164e63",marginBottom:6}}>
              {"🇬🇧 "}
              {s.en}
            </div>
            {s.opts.map(function(o,oi){return (
              <button
                key={oi}
                style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:13,textAlign:"left",cursor:"pointer"}}
                onClick={function(e){e.target.style.background=o===s.hr?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===s.hr?"#16a34a":"#dc2626";if(o===s.hr){award(5);speak(s.hr);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                {"🇭🇷 "}
                {o}
              </button>
            );})}
          </div>
        );})}
      </div>}
      {// ═══ VERB DRILL ═══
      scr==="verbdrill"&&<VerbDrillScreen goBack={goBack} />}
      {scr==="verbdrill_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("💪 20 Essential Verbs","Full present tense conjugation")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Tap any form to hear it. Learn all 6 persons for each verb.
        </div>
        {shMemo("vd",VERBDRILL).map(function(v,vi){return (
          <div
            key={vi}
            className="c"
            style={{marginBottom:10,padding:0,overflow:"hidden"}}>
            <div
              style={{padding:"8px 14px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
              onClick={function(){speak(v.inf)}}>
              <span style={{fontWeight:800}}>
                {v.inf}
              </span>
              <span style={{fontSize:12,opacity:.7}}>
                {v.en}
              </span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
              {v.forms.map(function(f,fi){return (
                <div
                  key={fi}
                  style={{padding:"6px 12px",borderBottom:"1px solid #f0fdfa",borderRight:fi%2===0?"1px solid #f0fdfa":"none",fontSize:12,cursor:"pointer",display:"flex",gap:6}}
                  onClick={function(){speak(f)}}>
                  <span style={{fontWeight:700,color:"#0e7490",minWidth:50}}>
                    {VBPERSONS[fi]}
                  </span>
                  <span>
                    {f}
                  </span>
                </div>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ TENSE TRANSFORMER ═══
      scr==="tenseflip"&&<TenseFlipScreen goBack={goBack} award={award} />}
      {scr==="tenseflip_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("⏳ Present → Past","Convert prezent to perfekt and negative")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 See the present tense, then tap to reveal the past (perfekt) and negative past forms.
        </div>
        {shMemo("tf",TENSEFLIP,10).map(function(t,ti){return (
          <div key={ti} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
            <div
              style={{fontSize:14,fontWeight:700,color:"#164e63",marginBottom:8,cursor:"pointer"}}
              onClick={function(){speak(t.prez)}}>
              {"🔵 "}
              {t.prez}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button
                style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer",textAlign:"left"}}
                onClick={function(e){e.target.textContent="✅ "+t.perf;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(t.perf);award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                🔵 Perfekt?
              </button>
              <button
                style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer",textAlign:"left"}}
                onClick={function(e){e.target.textContent="❌ "+t.neg;e.target.style.background="#fee2e2";e.target.style.borderColor="#dc2626";speak(t.neg);award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                🔴 Negative?
              </button>
            </div>
          </div>
        );})}
      </div>}
      {// ═══ RIDDLES ═══
      scr==="riddles"&&<RiddlesScreen goBack={goBack} award={award} />}
      {scr==="riddles_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🧩 Što je to?","Read the clues in Croatian, guess the answer!")}
        {shMemo("rid",RIDDLES,8).map(function(r,ri){return (
          <div key={ri} className="c" style={{marginBottom:14,padding:"14px 16px"}}>
            <div
              style={{fontSize:14,fontStyle:"italic",color:"#44403c",marginBottom:10,lineHeight:1.5,cursor:"pointer"}}
              onClick={function(){speak(r.clue)}}>
              🔊 “
              {r.clue}
              ”
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {r.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"8px 16px",border:"2px solid "+(o===r.answer?"#d6d3d1":"#d6d3d1"),borderRadius:12,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===r.answer?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===r.answer?"#16a34a":"#dc2626";if(o===r.answer){award(5);speak(r.answer);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
            <div style={{fontSize:11,color:"#a8a29e",marginTop:6}}>
              {"🇬🇧 "}
              {r.en}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ LOGIC QUIZ ═══
      scr==="logicquiz"&&<LogicQuizScreen goBack={goBack} award={award} />}
      {scr==="logicquiz_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🧠 Think in Croatian","Pick the answers that make sense")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Read the Croatian situation and pick ALL correct answers. Some questions have 2 right answers!
        </div>
        {shMemo("lq",LOGICQUIZ).map(function(lq,li){var allOpts=lq.right.concat(lq.wrong).sort(function(){return Math.random()-0.5});return (
          <div key={li} className="c" style={{marginBottom:12,padding:"12px 14px"}}>
            <div
              style={{fontSize:14,fontWeight:700,color:"#164e63",marginBottom:8,cursor:"pointer"}}
              onClick={function(){speak(lq.q)}}>
              {"🔊 "}
              {lq.q}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {allOpts.map(function(o,oi){var isRight=lq.right.indexOf(o)>=0;return (
                <button
                  key={oi}
                  style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=isRight?"#dcfce7":"#fee2e2";e.target.style.borderColor=isRight?"#16a34a":"#dc2626";if(isRight){award(3);speak(o);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ ORDINALS & FLOORS ═══
      scr==="ordinals"&&<OrdinalsScreen goBack={goBack} award={award} />}
      {scr==="ordinals_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🏢 Ordinal Numbers","prvi, drugi, treći... + locative (na ___om katu)")}
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:20}}>
          {ORDINALS.map(function(o,i){return (
            <div
              key={i}
              className="c"
              style={{textAlign:"center",padding:"8px 4px",cursor:"pointer"}}
              onClick={function(){speak(o.hr)}}>
              <div style={{fontSize:18,fontWeight:800,color:"#0e7490"}}>
                {o.num}
                .
              </div>
              <div style={{fontSize:13,fontWeight:700}}>
                {o.hr}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {o.en}
              </div>
              <div style={{fontSize:10,color:"#b45309",marginTop:2}}>
                {"na "}
                {o.loc}
                om
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          🏢 Na kojem katu?
        </h3>
        {shMemo("oq",ORDQUIZ).map(function(q,qi){return (
          <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>
              {q.q}
            </div>
            <div style={{display:"flex",gap:6}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak("na "+q.a+" katu");if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ RELATIVE PRONOUNS ═══
      scr==="relpron"&&<RelativePronounsScreen goBack={goBack} award={award} />}
      {scr==="relpron_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🔗 Koji, Koja, Koje","Relative pronouns — which/that/who")}
        <div
          className="c"
          style={{marginBottom:16,padding:"12px",fontSize:12,background:"rgba(14,116,144,.06)"}}>
          {RELPRON.intro}
        </div>
        <div style={{overflowX:"auto",marginBottom:20}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr>
                {["","NOM","GEN","DAT","AKU","LOK"].map(function(h,i){return (
                  <th
                    key={i}
                    style={{padding:"6px",background:"#0e7490",color:"white",fontWeight:700}}>
                    {h}
                  </th>
                );})}
              </tr>
            </thead>
            <tbody>
              {["m","f","n"].map(function(g,gi){var r=RELPRON.table[g];return (
                <tr key={gi} style={{background:gi%2?"#f0fdfa":"white"}}>
                  <td style={{padding:"6px",fontWeight:800,color:"#0e7490"}}>
                    {g==="m"?"♂ M":g==="f"?"♀ F":"⚧ N"}
                  </td>
                  {[r.nom,r.gen,r.dat,r.aku,r.lok].map(function(v,vi){return (
                    <td
                      key={vi}
                      style={{padding:"6px",cursor:"pointer"}}
                      onClick={function(){speak(v)}}>
                      {v}
                    </td>
                  );})}
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <h3 className="sh">
          🎯 Fill the Blank
        </h3>
        {shMemo("rp",RELPRON.quiz).map(function(q,qi){return (
          <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>
              {q.q}
            </div>
            <div style={{display:"flex",gap:6}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ EMOTIONS & GENDER ═══
      scr==="emogender"&&<EmotionGenderScreen goBack={goBack} award={award} />}
      {scr==="emogender_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("😀 How Are You Feeling?","Pick the right gender form for emotions")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Croatian adjectives change based on gender. 👨 = masculine ending, 👩 = feminine ending. Tap the correct form!
        </div>
        {EMOGENDER.map(function(eg,ei){return (
          <div key={ei} className="c" style={{marginBottom:16}}>
            <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>
              {eg.subj}
              {" ("}
              {eg.gender==="m"?"👨":"👩"}
              )
            </div>
            {eg.pairs.map(function(p,pi){var correct=eg.gender==="m"?p.m:p.f;var wrong=eg.gender==="m"?p.f:p.m;return (
              <div key={pi} style={{display:"flex",gap:8,marginBottom:6}}>
                {[correct,wrong].sort(function(){return Math.random()-0.5}).map(function(o,oi){return (
                  <button
                    key={oi}
                    style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                    onClick={function(e){e.target.style.background=o===correct?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===correct?"#16a34a":"#dc2626";if(o===correct){award(2);speak(eg.subj.split("...")[0]+" "+correct);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                    {o}
                  </button>
                );})}
              </div>
            );})}
          </div>
        );})}
      </div>}
      {// ═══ ADJECTIVE OPPOSITES ═══
      scr==="opposites"&&<OppositesScreen goBack={goBack} award={award} />}
      {scr==="opposites_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("↔️ Opposites","Learn adjective pairs with animals")}
        {shMemo("ao",ADJOPPOSITES).map(function(p,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div
              style={{flex:1,textAlign:"center",cursor:"pointer"}}
              onClick={function(){speak(p.ex.a)}}>
              <div style={{fontSize:16,fontWeight:800,color:"#16a34a"}}>
                {p.a}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {p.ex.a}
              </div>
            </div>
            <div style={{fontSize:18,color:"#d6d3d1"}}>
              ↔
            </div>
            <div
              style={{flex:1,textAlign:"center",cursor:"pointer"}}
              onClick={function(){speak(p.ex.b)}}>
              <div style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>
                {p.b}
              </div>
              <div style={{fontSize:11,color:"#78716c"}}>
                {p.ex.b}
              </div>
            </div>
          </div>
        );})}
      </div>}
      {// ═══ CITY & COUNTRY LOCATIVE ═══
      scr==="cityloc"&&<CityLocativeScreen goBack={goBack} award={award} />}
      {scr==="cityloc_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🏙️ Where Do You Live?","City & country names in locative case")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 "Gdje živiš?" uses the locative case. Zagreb → u Zagrebu, Hrvatska → u Hrvatskoj.
        </div>
        <h3 className="sh">
          🏙️ Gradovi (Cities)
        </h3>
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {CITYLOC.cities.map(function(c2,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer",textAlign:"center"}}
              onClick={function(){speak("Živim u "+c2.lok)}}>
              <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>
                {c2.nom}
              </div>
              <div style={{fontSize:12,color:"#0e7490"}}>
                {"→ u "}
                {c2.lok}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          🌍 Države (Countries)
        </h3>
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {CITYLOC.countries.map(function(c2,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",cursor:"pointer",textAlign:"center"}}
              onClick={function(){speak(c2.nom+" - u "+c2.lok)}}>
              <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>
                {c2.nom}
              </div>
              <div style={{fontSize:12,color:"#b45309"}}>
                {"→ u "}
                {c2.lok}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          🎯 Quick Quiz
        </h3>
        {shMemo("cl",CITYLOC.cities,8).map(function(c2,i){var wrong=CITYLOC.cities[(i+3)%CITYLOC.cities.length].lok;return (
          <div
            key={i}
            className="c"
            style={{marginBottom:6,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13}}>
              {c2.nom}
              {" → u _____"}
            </div>
            <div style={{display:"flex",gap:4}}>
              {[c2.lok,wrong].sort(function(){return Math.random()-0.5}).map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===c2.lok?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===c2.lok?"#16a34a":"#dc2626";if(o===c2.lok)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ ACCUSATIVE DRILL ═══
      scr==="akudrill"&&<AccusativeDrillScreen goBack={goBack} award={award} />}
      {scr==="akudrill_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🍽️ Accusative Case","How nouns change after Voliš li / Nosiš li / Jedeš li")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Feminine nouns ending in -a change to -u in accusative. Masculine/neuter nouns usually stay the same.
        </div>
        <h3 className="sh">
          🍔 Hrana (Food)
        </h3>
        {shMemo("af",AKUFOOD).map(function(f,i){return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{flex:1,fontSize:12}}>
              <span style={{color:"#78716c"}}>
                {f.q.replace("_____","")}
              </span>
              {" "}
              <span style={{fontWeight:700,color:"#164e63"}}>
                {f.nom}
              </span>
              {" → ?"}
            </div>
            <button
              style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
              onClick={function(e){e.target.textContent=f.aku;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(f.q.replace("_____",f.aku));award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
              Show
            </button>
          </div>
        );})}
        <h3 className="sh" style={{marginTop:16}}>
          👚 Odjeća (Clothes)
        </h3>
        {shMemo("ac",AKUCLOTHES).map(function(cl,i){return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{flex:1,fontSize:12}}>
              <span style={{color:"#78716c"}}>
                {cl.q.replace("_____","")}
              </span>
              {" "}
              <span style={{fontWeight:700,color:"#164e63"}}>
                {cl.nom}
              </span>
              {" → ?"}
            </div>
            <button
              style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
              onClick={function(e){e.target.textContent=cl.aku;e.target.style.background="#dcfce7";e.target.style.borderColor="#16a34a";speak(cl.q.replace("_____",cl.aku));award(2);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
              Show
            </button>
          </div>
        );})}
      </div>}
      {// ═══ COLOR AGREEMENT ═══
      scr==="coloragree"&&<ColorAgreementScreen goBack={goBack} award={award} />}
      {scr==="coloragree_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🎨 Color + Gender Agreement","Colors change endings by noun gender — singular AND plural")}
        <div style={{overflowX:"auto",marginBottom:20}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead>
              <tr>
                {["Color","M","F","N","M pl","F pl","N pl"].map(function(h,i){return (
                  <th key={i} style={{padding:"6px 4px",background:"#0e7490",color:"white"}}>
                    {h}
                  </th>
                );})}
              </tr>
            </thead>
            <tbody>
              {COLORAGREE.colors.map(function(c2,ci){return (
                <tr key={ci} style={{background:ci%2?"#f0fdfa":"white"}}>
                  <td style={{padding:"4px",fontWeight:700,color:"#164e63"}}>
                    {c2.en}
                  </td>
                  {[c2.m,c2.f,c2.n,c2.mpl,c2.fpl,c2.npl].map(function(v,vi){return (
                    <td
                      key={vi}
                      style={{padding:"4px",cursor:"pointer"}}
                      onClick={function(){speak(v)}}>
                      {v}
                    </td>
                  );})}
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <h3 className="sh">
          🎯 Singular: Pick the right color form
        </h3>
        {shMemo("cs",COLORAGREE.singQuiz).map(function(q,qi){return (
          <div
            key={qi}
            style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{flex:1,fontSize:13}}>
              <span style={{fontWeight:700}}>
                {q.noun}
              </span>
              {" ("}
              {q.en}
              ) je _____
            </div>
            <div style={{display:"flex",gap:4}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.color?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.color?"#16a34a":"#dc2626";if(o===q.color){award(3);speak(q.noun+" je "+q.color);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
        <h3 className="sh" style={{marginTop:16}}>
          🎯 Plural: Pick the right color form
        </h3>
        {shMemo("cp",COLORAGREE.plurQuiz).map(function(q,qi){return (
          <div
            key={qi}
            style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{flex:1,fontSize:13}}>
              <span style={{fontWeight:700}}>
                {q.noun}
              </span>
              {" ("}
              {q.en}
              ) su _____
            </div>
            <div style={{display:"flex",gap:4}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.color?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.color?"#16a34a":"#dc2626";if(o===q.color){award(3);speak(q.noun+" su "+q.color);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ POSSESSIVE PRONOUNS ═══
      scr==="possess"&&<PossessivesScreen goBack={goBack} award={award} />}
      {scr==="possess_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("👤 Possessive Pronouns","moj/moja/moje — changes by noun gender")}
        <div style={{overflowX:"auto",marginBottom:20}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr>
                {["Person","M","F","N","English"].map(function(h,i){return (
                  <th key={i} style={{padding:"6px",background:"#0e7490",color:"white"}}>
                    {h}
                  </th>
                );})}
              </tr>
            </thead>
            <tbody>
              {POSSESS.table.map(function(r,ri){return (
                <tr key={ri} style={{background:ri%2?"#f0fdfa":"white"}}>
                  <td style={{padding:"6px",fontWeight:800,color:"#0e7490"}}>
                    {r.person}
                  </td>
                  {[r.m,r.f,r.n,r.en].map(function(v,vi){return (
                    <td
                      key={vi}
                      style={{padding:"6px",cursor:"pointer"}}
                      onClick={function(){speak(v)}}>
                      {v}
                    </td>
                  );})}
                </tr>
              );})}
            </tbody>
          </table>
        </div>
        <div
          className="c"
          style={{marginBottom:16,padding:"10px",background:"rgba(245,158,11,.06)",fontSize:12}}>
          💡 Rule: -a noun = -a pronoun (moja kuća), -o/-e noun = -e pronoun (moje selo), consonant noun = no ending (moj stan)
        </div>
        <h3 className="sh">
          🎯 Ovo je _____ ...
        </h3>
        {shMemo("pq",POSSESS.quiz,10).map(function(q,qi){return (
          <div
            key={qi}
            style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{flex:1,fontSize:13}}>
              (
              {q.person}
              {") Ovo je _____ "}
              <span style={{fontWeight:700}}>
                {q.noun}
              </span>
            </div>
            <div style={{display:"flex",gap:4}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"8px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:11,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak("Ovo je "+q.a+" "+q.noun);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ QUESTION WORDS ═══
      scr==="qwords"&&<QuestionWordsScreen goBack={goBack} award={award} />}
      {scr==="qwords_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("❓ Question Words","Tko? Što? Gdje? Kad? Koliko? Kako? Zašto?")}
        <div
          className="c"
          style={{marginBottom:16,padding:"12px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Croatian has specific question words for each type of information. Gender matters for 'what kind of' — Kakav (m), Kakva (f), Kakvo (n).
        </div>
        {shMemo("qw",QWORDS).map(function(q,qi){return (
          <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>
              {q.q}
              {" — "}
              <span style={{color:"#78716c",fontStyle:"italic"}}>
                {q.en}
              </span>
            </div>
            <div style={{display:"flex",gap:6}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a));if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ NEGATION ═══
      scr==="negation"&&<NegationScreen goBack={goBack} />}
      {scr==="negation_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("❌ Positive ↔ Negative","Radim → Ne radim • Imam → Nemam")}
        <div
          className="c"
          style={{marginBottom:12,padding:"10px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Most verbs: add NE before the verb. Exception: imam → nemam, znam → ne znam.
        </div>
        {shMemo("ng",NEGATION).map(function(n,ni){return (
          <div
            key={ni}
            className="c"
            style={{marginBottom:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{flex:1}}>
              <div
                style={{fontSize:13,fontWeight:700,color:"#16a34a",cursor:"pointer",marginBottom:2}}
                onClick={function(){speak(n.pos)}}>
                {"✅ "}
                {n.pos}
              </div>
              <div
                style={{fontSize:13,fontWeight:700,color:"#dc2626",cursor:"pointer"}}
                onClick={function(){speak(n.neg)}}>
                {"❌ "}
                {n.neg}
              </div>
            </div>
            <div style={{fontSize:11,color:"#78716c",maxWidth:140,textAlign:"right"}}>
              {n.en}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ SIBILARIZACIJA ═══
      scr==="sibil"&&<SibilarizationScreen goBack={goBack} award={award} />}
      {scr==="sibil_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🔄 Sibilarizacija","k→c, g→z, h→s before -i")}
        <div
          className="c"
          style={{marginBottom:16,padding:"12px",background:"rgba(245,158,11,.06)",fontSize:13}}>
          {SIBIL.intro}
        </div>
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {SIBIL.examples.map(function(ex,i){return (
            <div
              key={i}
              className="c"
              style={{padding:"8px 12px",textAlign:"center",cursor:"pointer"}}
              onClick={function(){speak(ex.lok)}}>
              <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>
                {ex.nom}
                {" → "}
                {ex.lok}
              </div>
              <div style={{fontSize:11,color:"#b45309"}}>
                {ex.rule}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          🎯 Fill the Blank
        </h3>
        {shMemo("sq",SIBIL.quiz).map(function(q,qi){return (
          <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>
              {q.q}
            </div>
            <div style={{display:"flex",gap:6}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ RESTAURANT PRACTICE ═══
      scr==="restaurant"&&<RestaurantScreen goBack={goBack} />}
      {scr==="restaurant_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🍽️ At the Restaurant","Practice ordering food in Croatian")}
        <div
          className="c"
          style={{marginBottom:16,padding:"12px",background:"rgba(14,116,144,.06)",fontSize:12}}>
          💡 Tap any line to hear it spoken. Practice the waiter-customer dialogue until it feels natural.
        </div>
        {RESTCONV.map(function(r,ri){return (
          <div key={ri} style={{marginBottom:12}}>
            <div style={{display:"flex",gap:8,marginBottom:4}}>
              <div
                style={{fontSize:11,fontWeight:800,color:"white",background:"#0e7490",padding:"2px 8px",borderRadius:10}}>
                K
              </div>
              <div
                style={{flex:1,padding:"8px 12px",background:"#f0fdfa",borderRadius:"4px 12px 12px 12px",fontSize:13,cursor:"pointer"}}
                onClick={function(){speak(r.waiter)}}>
                {r.waiter}
              </div>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <div
                style={{flex:1,padding:"8px 12px",background:"#eff6ff",borderRadius:"12px 4px 12px 12px",fontSize:13,textAlign:"right",cursor:"pointer"}}
                onClick={function(){speak(r.you)}}>
                {r.you}
              </div>
              <div
                style={{fontSize:11,fontWeight:800,color:"white",background:"#1e40af",padding:"2px 8px",borderRadius:10}}>
                Ti
              </div>
            </div>
          </div>
        );})}
      </div>}
      {// ═══ PROFESSION GENDERS ═══
      scr==="profgender"&&<ProfessionGenderScreen goBack={goBack} award={award} />}
      {scr==="profgender_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("👨‍⚖️👩‍⚖️ Profession Pairs","Every job has a masculine AND feminine form")}
        {shMemo("pg",PROFGENDER).map(function(p,i){return (
          <div
            key={i}
            className="c"
            style={{marginBottom:6,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div
              style={{flex:1,textAlign:"center",cursor:"pointer"}}
              onClick={function(){speak(p.m)}}>
              <div style={{fontSize:14,fontWeight:700,color:"#1e40af"}}>
                {"👨 "}
                {p.m}
              </div>
            </div>
            <div style={{fontSize:11,color:"#78716c",padding:"0 8px"}}>
              {p.en}
            </div>
            <div
              style={{flex:1,textAlign:"center",cursor:"pointer"}}
              onClick={function(){speak(p.f)}}>
              <div style={{fontSize:14,fontWeight:700,color:"#db2777"}}>
                {"👩 "}
                {p.f}
              </div>
            </div>
          </div>
        );})}
      </div>}
      {// ═══ COMPARATIVES ═══
      scr==="comparatives"&&<ComparativesScreen goBack={goBack} award={award} />}
      {scr==="comparatives_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("📈 Lijep, Ljepši, Najljepši","Adjective → Comparative → Superlative")}
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,marginBottom:20}}>
          <div
            style={{padding:"6px",background:"#0e7490",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>
            Base
          </div>
          <div
            style={{padding:"6px",background:"#b45309",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>
            Comparative
          </div>
          <div
            style={{padding:"6px",background:"#7c3aed",color:"white",fontWeight:700,fontSize:12,textAlign:"center"}}>
            Superlative
          </div>
          {COMPARE.map(function(cm){return [
            <div
              key={cm.base+"b"}
              style={{padding:"6px",borderBottom:"1px solid #e7e5e4",fontSize:12,cursor:"pointer"}}
              onClick={function(){speak(cm.base)}}>
              {cm.base}
              {" ("}
              {cm.en}
              )
            </div>,
            <div
              key={cm.base+"c"}
              style={{padding:"6px",borderBottom:"1px solid #e7e5e4",fontSize:12,fontWeight:700,color:"#b45309",cursor:"pointer"}}
              onClick={function(){speak(cm.comp)}}>
              {cm.comp}
            </div>,
            <div
              key={cm.base+"s"}
              style={{padding:"6px",borderBottom:"1px solid #e7e5e4",fontSize:12,fontWeight:700,color:"#7c3aed",cursor:"pointer"}}
              onClick={function(){speak(cm.super)}}>
              {cm.super}
            </div>
          ];}).flat()}
        </div>
        <h3 className="sh">
          🎯 Pick the right form
        </h3>
        {shMemo("cq",COMPQUIZ).map(function(q,qi){return (
          <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>
              {q.q}
            </div>
            <div style={{display:"flex",gap:6}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ FUTURE TENSE ═══
      scr==="future"&&<FutureTenseScreen goBack={goBack} award={award} />}
      {scr==="future_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🚀 Future Tense","ću, ćeš, će, ćemo, ćete, će + infinitive")}
        <div
          className="c"
          style={{marginBottom:16,padding:"12px",background:"rgba(14,116,144,.06)",fontSize:13}}>
          {FUTURE.intro}
        </div>
        <div
          style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {["ja ću","ti ćeš","on/ona će","mi ćemo","vi ćete","oni/one će"].map(function(f,i){return (
            <div
              key={i}
              className="c"
              style={{textAlign:"center",padding:"8px",cursor:"pointer"}}
              onClick={function(){speak(f)}}>
              <div style={{fontSize:14,fontWeight:800,color:"#0e7490"}}>
                {f}
              </div>
            </div>
          );})}
        </div>
        <h3 className="sh">
          🎯 Fill the Blank
        </h3>
        {shMemo("fq",FUTURE.quiz).map(function(q,qi){return (
          <div key={qi} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>
              {q.q}
            </div>
            <div style={{display:"flex",gap:6}}>
              {q.opts.map(function(o,oi){return (
                <button
                  key={oi}
                  style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a){award(3);speak(q.q.replace("_____",q.a).split("(")[0]);if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}}>
                  {o}
                </button>
              );})}
            </div>
          </div>
        );})}
      </div>}
      {// ═══ CROATIAN KINGS ═══
      scr==="kings"&&<KingsScreen goBack={goBack} award={award} setSt={setSt} />}
      {scr==="kings_OLD"&&<div
        style={{maxWidth:640,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("\ud83d\udc51 "+KINGS.title,KINGS.subtitle)}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>
          {["timeline","dukes","kings","cities","vocab"].map(function(t){return (
            <button
              key={t}
              className={"b "+(kgTab===t?"bw":"bg")}
              style={{fontSize:12,padding:"6px 12px"}}
              onClick={function(){sKgTab(t)}}>
              {t==="timeline"?"\ud83d\udcdc Timeline":t==="dukes"?"\ud83c\udff0 Dukes":t==="kings"?"\ud83d\udc51 Kings":t==="cities"?"\ud83c\udfd9\ufe0f Royal Cities":"\ud83d\udcda Vocabulary"}
            </button>
          );})}
        </div>
        {kgTab==="timeline"&&<React.Fragment>
          <div
            className="c"
            style={{marginBottom:20,borderLeft:"4px solid #b45309",background:"linear-gradient(135deg,#fffbeb,#fef3c7)"}}>
            <div style={{fontSize:14,lineHeight:1.8,color:"#1c1917"}}>
              {KINGS.intro}
            </div>
          </div>
          {KINGS.eras.map(function(e,i){return (
            <div
              key={i}
              className="c"
              style={{marginBottom:12,borderLeft:"4px solid "+(i<2?"#f59e0b":i===2?"#b45309":i===3?"#7c3aed":"#dc2626")}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:28}}>
                  {e.emoji}
                </span>
                <div
                  style={{fontSize:17,fontWeight:800,color:"#164e63",fontFamily:"'Playfair Display',serif"}}>
                  {e.title}
                </div>
              </div>
              <p style={{fontSize:14,lineHeight:1.8,color:"#44403c"}}>
                {e.text}
              </p>
            </div>
          );})}
          <h3 className="sh" style={{marginTop:24}}>
            📌 Key Dates
          </h3>
          {KINGS.keyFacts.map(function(f,i){return (
            <div
              key={i}
              style={{display:"flex",gap:12,padding:"8px 0",borderBottom:"1px solid rgba(0,0,0,.05)"}}>
              <div style={{minWidth:60,fontSize:14,fontWeight:800,color:"#b45309"}}>
                {f[0]}
              </div>
              <div style={{fontSize:14,color:"#44403c"}}>
                {f[1]}
              </div>
            </div>
          );})}
          <div
            className="c"
            style={{marginTop:24,textAlign:"center",borderLeft:"4px solid #b45309",background:"linear-gradient(135deg,#fffbeb,#fef3c7)"}}>
            <div
              style={{fontSize:20,fontWeight:800,color:"#92400e",fontFamily:"'Playfair Display',serif",fontStyle:"italic",marginBottom:6}}>
              {KINGS.quote}
            </div>
            <div style={{fontSize:14,color:"#78716c",fontStyle:"italic"}}>
              {KINGS.quoteEn}
            </div>
          </div>
        </React.Fragment>}
        {kgTab==="dukes"&&<React.Fragment>
          <div
            className="c"
            style={{marginBottom:16,background:"#fffbeb",borderLeft:"4px solid #f59e0b"}}>
            <div style={{fontSize:14,lineHeight:1.7}}>
              Before Croatia became a kingdom in 925, it was ruled by dukes (knezovi) who built the foundations of the Croatian state. These leaders established the dynasty, gained papal recognition, and created the institutions that made the kingdom possible.
            </div>
          </div>
          {KINGS.dukes.map(function(d,i){return (
            <div
              key={i}
              className="c"
              style={{marginBottom:10,cursor:"pointer"}}
              onClick={function(){speak(d.name)}}>
              <div
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:16,fontWeight:800,color:"#164e63"}}>
                  {"\ud83c\udff0 "}
                  {d.name}
                  {" \ud83d\udd0a"}
                </div>
                <div style={{fontSize:12,color:"#b45309",fontWeight:700}}>
                  {d.years}
                </div>
              </div>
              <div style={{fontSize:12,color:"#0e7490",fontWeight:600,marginBottom:4}}>
                {d.title}
              </div>
              <div style={{fontSize:13,color:"#44403c",lineHeight:1.6}}>
                {d.desc}
              </div>
            </div>
          );})}
        </React.Fragment>}
        {kgTab==="kings"&&<React.Fragment>
          <div
            className="c"
            style={{marginBottom:16,background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderLeft:"4px solid #b45309"}}>
            <div style={{fontSize:14,lineHeight:1.7}}>
              From Tomislav in 925 to Petar Svačić in 1097, these kings ruled a sovereign Croatia. They defended the nation against empires, expanded its borders, and built a civilization that forms the bedrock of Croatian identity.
            </div>
          </div>
          {KINGS.kings.map(function(k,i){return (
            <div
              key={i}
              className="c"
              style={{marginBottom:12,borderLeft:"4px solid "+(k.color||"#0e7490"),cursor:"pointer"}}
              onClick={function(){speak(k.name)}}>
              <div
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div
                  style={{fontSize:17,fontWeight:800,color:k.color||"#164e63",fontFamily:"'Playfair Display',serif"}}>
                  {k.emoji}
                  {" "}
                  {k.name}
                  {" \ud83d\udd0a"}
                </div>
                <div style={{fontSize:12,color:"#b45309",fontWeight:700}}>
                  {k.years}
                </div>
              </div>
              <div
                style={{fontSize:12,color:k.color||"#0e7490",fontWeight:700,marginBottom:4}}>
                {k.title}
              </div>
              <div style={{fontSize:13,color:"#44403c",lineHeight:1.7}}>
                {k.desc}
              </div>
            </div>
          );})}
        </React.Fragment>}
        {kgTab==="cities"&&<React.Fragment>
          <div className="c" style={{marginBottom:16,borderLeft:"4px solid #7c3aed"}}>
            <div style={{fontSize:14,lineHeight:1.7}}>
              The Croatian kingdom had no single permanent capital. Instead, the royal court moved between five principal cities, each serving as a seat of power at different times.
            </div>
          </div>
          {KINGS.royalCities.map(function(c,i){return (
            <div
              key={i}
              className="c"
              style={{marginBottom:10,cursor:"pointer"}}
              onClick={function(){speak(c.name)}}>
              <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>
                {"\ud83c\udfd9\ufe0f "}
                {c.name}
                {" \ud83d\udd0a"}
              </div>
              <div style={{fontSize:13,color:"#44403c",lineHeight:1.6}}>
                {c.desc}
              </div>
            </div>
          );})}
        </React.Fragment>}
        {kgTab==="vocab"&&<React.Fragment>
          <div style={{fontSize:14,fontWeight:700,color:"#0e7490",marginBottom:12}}>
            📚 Medieval Croatian Vocabulary — Tap to hear:
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {KINGS.vocabulary.map(function(v,i){return (
              <div
                key={i}
                className="c"
                style={{padding:"10px 14px",cursor:"pointer"}}
                onClick={function(){speak(v[0])}}>
                <div style={{fontSize:14,fontWeight:700,color:"#b45309"}}>
                  {v[0]}
                  {" \ud83d\udd0a"}
                </div>
                <div style={{fontSize:12,color:"#78716c"}}>
                  {v[1]}
                </div>
              </div>
            );})}
          </div>
          <button
            className="b bp"
            style={{width:"100%",marginTop:20}}
            onClick={function(){setSt(function(s){return Object.assign({},s,{hi:(s.hi||0)+1})}); award(25);goBack();if(e&&e.target){var _p=e.target.closest?e.target.closest("div"):e.target.parentNode;if(_p)_p.style.pointerEvents="none"}}}>
            ✅ Mark as Read (+25 XP)
          </button>
        </React.Fragment>}
      </div>}
      {// ═══ CONJUGATION DRILL ═══
      scr==="conjdrill"&&<ConjugationDrill goBack={goBack} award={award} setSt={setSt} />}
      {scr==="conjdrill_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("\ud83d\udd04 Verb Conjugation Drill","Present, past & future tense")}
        {cjMode==="menu"&&<React.Fragment>
          <div className="c" style={{marginBottom:20}}>
            Choose a tense to practice. Conjugate verbs for all 6 persons.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {["all","present","past","future"].map(function(t){return (
              <div
                key={t}
                className="tc"
                style={{textAlign:"center",cursor:"pointer",padding:"20px 14px"}}
                onClick={function(){var pool=t==="all"?CONJ.verbs:CONJ.verbs.filter(function(v){return v.tense===t});var qs=[];pool.forEach(function(v){CONJ.persons.forEach(function(p,pi){qs.push({verb:v.inf,en:v.en,tense:v.tense,person:p,pi:pi,answer:v.forms[pi]})})});var picked=sh(qs).slice(0,20);var first=picked[0];var wrongs=sh(CONJ.verbs.flatMap(function(v){return v.forms}).filter(function(f){return f!==first.answer})).slice(0,3);sCjQ(picked);sCjI(0);sCjS(0);sCjA(false);sCjSl(-1);sCjO(sh([first.answer].concat(wrongs)));sCjMode("quiz")}}>
                <div style={{fontSize:32}}>
                  {t==="all"?"\ud83c\udfb2":t==="present"?"\ud83d\udccd":t==="past"?"\u23ea":"\u23e9"}
                </div>
                <div
                  style={{fontSize:15,fontWeight:700,marginTop:6,textTransform:"capitalize"}}>
                  {t==="all"?"All Tenses":t+" Tense"}
                </div>
                <div style={{fontSize:12,color:"#78716c"}}>
                  {t==="all"?CONJ.verbs.length+" verbs":CONJ.verbs.filter(function(v){return v.tense===t}).length+" verbs"}
                </div>
              </div>
            );})}
          </div>
          <div className="c" style={{marginTop:20}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0e7490",marginBottom:10}}>
              📖 Verb Reference
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {CONJ.verbs.filter(function(v){return v.tense==="present"}).map(function(v,i){return (
                <div
                  key={i}
                  style={{padding:"8px",background:"rgba(14,116,144,.04)",borderRadius:10,cursor:"pointer",textAlign:"center"}}
                  onClick={function(){speak(v.forms[0])}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>
                    {v.inf}
                  </div>
                  <div style={{fontSize:11,color:"#78716c"}}>
                    {v.en}
                  </div>
                </div>
              );})}
            </div>
          </div>
        </React.Fragment>}
        {cjMode==="quiz"&&(function(){
          var total=cjQ.length;
          if(cjI>=total){var pct=Math.round((cjS/total)*100);return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {pct>=80?"\ud83c\udfc6":"\ud83d\udc4d"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                Conjugation Complete!
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>
                {cjS}
                {" / "}
                {total}
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button className="b bg" onClick={function(){sCjMode("menu")}}>
                  📋 Menu
                </button>
                <button
                  className="b bp"
                  onClick={function(){award(cjS*2+10);setSt(function(s){return Object.assign({},s,{gc:s.gc+1})});goBack()}}>
                  🏠 Finish!
                </button>
              </div>
            </div>
          );}
          var q=cjQ[cjI];var ci=cjO.indexOf(q.answer);var tC=q.tense==="present"?"#0e7490":q.tense==="past"?"#b45309":"#7c3aed";var tL=q.tense.toUpperCase();
          return (
            <React.Fragment>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>
                  {cjI+1}
                  {" / "}
                  {total}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#0e7490"}}>
                  {"Score: "}
                  {cjS}
                </div>
              </div>
              <Bar v={cjI+1} mx={total} color={tC} h={6} />
              <div className="c" style={{marginTop:16,textAlign:"center"}}>
                <div
                  style={{display:"inline-block",padding:"3px 12px",borderRadius:14,fontSize:11,fontWeight:800,color:"#fff",background:tC,marginBottom:8}}>
                  {tL}
                </div>
                <div style={{fontSize:22,fontWeight:800,color:"#164e63"}}>
                  {q.verb}
                  {" ("}
                  {q.en}
                  )
                </div>
                <div style={{fontSize:18,fontWeight:700,color:tC,marginTop:8}}>
                  {q.person}
                  {" ___?"}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
                {cjO.map(function(o,oi){return (
                  <button
                    key={oi}
                    className={"ob "+(cjA?(oi===ci?"ok":cjSl===oi?"no":""):"")}
                    onClick={function(){if(!cjA){sCjSl(oi);sCjA(true);if(oi===ci){sCjS(function(s){return s+1});award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}}}>
                    {q.person}
                    {" "}
                    {o}
                  </button>
                );})}
              </div>
              {cjA&&<button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={function(){if(cjI<total-1){var next=cjQ[cjI+1];var wrongs=sh(CONJ.verbs.flatMap(function(v){return v.forms}).filter(function(f){return f!==next.answer})).slice(0,3);sCjO(sh([next.answer].concat(wrongs)));sCjI(function(i){return i+1});sCjA(false);sCjSl(-1)}else{sCjI(total)}}}>
                {cjI<total-1?"Next \u2192":"See Results"}
              </button>}
            </React.Fragment>
          );})()}
      </div>}
      {// ═══ ZNAM - NE ZNAM ═══
      scr==="znam"&&<ZnamGame goBack={goBack} award={award} />}
      {scr==="znam_OLD"&&<div
        style={{maxWidth:600,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🇭🇷 "+ZNAM.title,"Translate English to Croatian")}
        {znMode==="menu"&&<React.Fragment>
          <div className="c" style={{marginBottom:20}}>
            Select a section to practice translating English sentences into Croatian. Pick the correct Croatian translation from four choices.
          </div>
          {ZNAM.sections.map((sec,si)=><div
            key={si}
            className="tc"
            onClick={()=>{const s0=sec.sentences[0];sZnSec(si);sZnIdx(0);sZnSc(0);sZnAns(false);sZnSel(-1);sZnOpts(sh([s0.hr,...s0.alts]));sZnMode("quiz")}}
            style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
            <div
              style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#0e7490,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:16}}>
              {si+1}
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>
                {sec.name}
              </div>
              <div style={{fontSize:12,color:"#78716c"}}>
                {sec.sentences.length}
                {" sentences"}
              </div>
            </div>
          </div>)}
        </React.Fragment>}
        {znMode==="quiz"&&(()=>{
          const sec=ZNAM.sections[znSec];const sent=sec.sentences[znIdx];const correct=sent.hr;
          return (
            <React.Fragment>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>
                  {sec.name}
                  {" — "}
                  {znIdx+1}
                  /
                  {sec.sentences.length}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#0e7490"}}>
                  {"Score: "}
                  {znSc}
                </div>
              </div>
              <Bar v={znIdx+1} mx={sec.sentences.length} h={6} />
              <div className="c" style={{marginTop:16,textAlign:"center"}}>
                <div style={{fontSize:12,color:"#78716c",marginBottom:6}}>
                  Translate to Croatian:
                </div>
                <div style={{fontSize:20,fontWeight:800,color:"#1c1917"}}>
                  "
                  {sent.en}
                  "
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
                {znOpts.map((o,oi)=><button
                  key={oi}
                  className={"ob "+(znAns?(o===correct?"ok":znSel===oi?"no":""):"")}
                  onClick={()=>{if(znAns)return;sZnSel(oi);sZnAns(true);if(o===correct){sZnSc(s=>s+1);award(5);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}}>
                  {o}
                </button>)}
              </div>
              {znAns&&<button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={()=>{
                  if(znIdx<sec.sentences.length-1){const nxt=sec.sentences[znIdx+1];sZnIdx(i=>i+1);sZnAns(false);sZnSel(-1);sZnOpts(sh([nxt.hr,...nxt.alts]))}
                  else sZnMode("done")}}>
                {znIdx<sec.sentences.length-1?"Next →":"See Results"}
              </button>}
            </React.Fragment>
          );})()}
        {znMode==="done"&&(()=>{
          const sec=ZNAM.sections[znSec];const pct=Math.round((znSc/sec.sentences.length)*100);
          return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {pct>=80?"🏆":pct>=50?"👍":"📚"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                {sec.name}
                {" Complete!"}
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>
                {znSc}
                {" / "}
                {sec.sentences.length}
              </div>
              <div style={{fontSize:14,color:"#78716c",marginBottom:24}}>
                {pct}
                % correct
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                <button
                  className="b bg"
                  onClick={()=>{const s0=ZNAM.sections[znSec].sentences[0];sZnIdx(0);sZnSc(0);sZnAns(false);sZnSel(-1);sZnOpts(sh([s0.hr,...s0.alts]));sZnMode("quiz")}}>
                  🔄 Retry
                </button>
                {znSec<ZNAM.sections.length-1&&<button
                  className="b bp"
                  onClick={()=>{const ns=znSec+1;const s0=ZNAM.sections[ns].sentences[0];sZnSec(ns);sZnIdx(0);sZnSc(0);sZnAns(false);sZnSel(-1);sZnOpts(sh([s0.hr,...s0.alts]));sZnMode("quiz")}}>
                  Next Section →
                </button>}
                <button className="b bg" onClick={()=>sZnMode("menu")}>
                  📋 All Sections
                </button>
              </div>
            </div>
          );})()}
      </div>}
      {// ═══ COLORS & GENDER ═══
      scr==="boje"&&<BojeGame goBack={goBack} award={award} />}
      {scr==="boje_OLD"&&<div
        style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🎨 "+BOJE.title,"Color adjectives change to match noun gender")}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["learn","quiz"].map(m=><button
            key={m}
            className={"b "+(bjMode===m?"bp":"bg")}
            style={{fontSize:13,padding:"8px 16px"}}
            onClick={()=>{sBjMode(m);sBjIdx(0);sBjSc(0);sBjAns(false);sBjSel(-1);sBjQ(m==="quiz"?sh(BOJE.quiz):[])}}>
            {m==="learn"?"📖 Learn":"✏️ Quiz"}
          </button>)}
        </div>
        {bjMode==="learn"&&<React.Fragment>
          <div
            className="c"
            style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"#fffbeb"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#92400e",marginBottom:8}}>
              🎨 How Colors Change by Gender
            </div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#1c1917"}}>
              <div>
                {"🔴 "}
                <b>
                  Feminine (-a):
                </b>
                {" Ruža je crven"}
                <b style={{color:"#dc2626"}}>
                  a
                </b>
                .
              </div>
              <div>
                {"🔵 "}
                <b>
                  Neuter (-o):
                </b>
                {" Sunce je crven"}
                <b style={{color:"#2563eb"}}>
                  o
                </b>
                .
              </div>
              <div>
                {"🟢 "}
                <b>
                  Masculine (∅):
                </b>
                {" Cvijet je crven"}
                <b style={{color:"#16a34a"}}>
                  {""}
                </b>
                .
              </div>
              <div style={{marginTop:8}}>
                {"📚 "}
                <b>
                  Feminine plural (-e):
                </b>
                {" Ruže su crven"}
                <b style={{color:"#dc2626"}}>
                  e
                </b>
                .
              </div>
              <div>
                {"📚 "}
                <b>
                  Neuter plural (-a):
                </b>
                {" Sunca su crven"}
                <b style={{color:"#2563eb"}}>
                  a
                </b>
                .
              </div>
              <div>
                {"📚 "}
                <b>
                  Masculine plural (-i):
                </b>
                {" Cvjetovi su crven"}
                <b style={{color:"#16a34a"}}>
                  i
                </b>
                .
              </div>
            </div>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:"#0e7490",marginBottom:10}}>
            All Colors — Tap to hear:
          </div>
          <div
            style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {BOJE.colors.map((c,i)=><div
              key={i}
              className="c"
              style={{padding:"12px 14px",cursor:"pointer"}}
              onClick={()=>speak(c.f)}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div
                  style={{width:24,height:24,borderRadius:10,background:c.hex,border:c.en==="white"?"2px solid #d6d3d1":"none"}} />
                <span style={{fontSize:15,fontWeight:700}}>
                  {c.en}
                </span>
              </div>
              <div style={{fontSize:12,display:"flex",gap:8}}>
                <span style={{color:"#dc2626"}}>
                  {c.f}
                </span>
                <span style={{color:"#2563eb"}}>
                  {c.n}
                </span>
                <span style={{color:"#16a34a"}}>
                  {c.m}
                </span>
              </div>
            </div>)}
          </div>
          <button
            className="b bp"
            style={{width:"100%"}}
            onClick={()=>{sBjMode("quiz");sBjQ(sh(BOJE.quiz));sBjIdx(0);sBjSc(0);sBjAns(false);sBjSel(-1)}}>
            Start Quiz →
          </button>
        </React.Fragment>}
        {bjMode==="quiz"&&(()=>{
          if(bjQ.length===0){sBjQ(sh(BOJE.quiz));return null}
          const total=bjQ.length;
          if(bjIdx>=total){const pct=Math.round((bjSc/total)*100);return (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:64}}>
                {pct>=80?"🎨":"👍"}
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>
                Colors Quiz Complete!
              </h2>
              <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>
                {bjSc}
                {" / "}
                {total}
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}>
                <button className="b bg" onClick={()=>{sBjMode("learn")}}>
                  📖 Review
                </button>
                <button
                  className="b bg"
                  onClick={()=>{sBjQ(sh(BOJE.quiz));sBjIdx(0);sBjSc(0);sBjAns(false);sBjSel(-1)}}>
                  🔄 Retry
                </button>
                <button className="b bp" onClick={goBack}>
                  🏠 Done
                </button>
              </div>
            </div>
          );}
          const q=bjQ[bjIdx];const gLabel=q.g==="f"?"feminine":q.g==="n"?"neuter":q.g==="m"?"masculine":q.g==="fp"?"feminine plural":q.g==="np"?"neuter plural":"masculine plural";
          const gColor=q.g.includes("f")?"#dc2626":q.g.includes("n")?"#2563eb":"#16a34a";
          if(bjOpts.length===0||bjOpts[0]===undefined){
            const allForms=BOJE.colors.flatMap(c=>q.g==="f"?[c.f]:q.g==="n"?[c.n]:q.g==="m"?[c.m]:q.g==="fp"?[c.fp]:q.g==="np"?[c.np]:[c.mp]);
            const wrongs=sh(allForms.filter(f=>f!==q.answer)).slice(0,3);
            const opts=sh([q.answer,...wrongs]);
            setTimeout(()=>sBjOpts(opts),0);return (
            <div style={{textAlign:"center",padding:40}}>
              Loading...
            </div>
          );}
          return (
            <React.Fragment>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700}}>
                  {bjIdx+1}
                  {" / "}
                  {total}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#0e7490"}}>
                  {"Score: "}
                  {bjSc}
                </div>
              </div>
              <Bar v={bjIdx+1} mx={total} color={gColor} h={6} />
              <div className="c" style={{marginTop:16}}>
                <div style={{fontSize:12,fontWeight:700,color:gColor,marginBottom:4}}>
                  (
                  {gLabel}
                  )
                </div>
                <div style={{fontSize:18,color:"#1c1917"}}>
                  <b>
                    {q.noun}
                  </b>
                  {" je "}
                  <span
                    style={{borderBottom:"3px solid "+gColor,fontWeight:800,color:gColor,fontSize:20,padding:"0 4px"}}>
                    {bjAns?q.answer:"___?"}
                  </span>
                  {""}
                </div>
                <div style={{fontSize:13,color:"#78716c",fontStyle:"italic",marginTop:8}}>
                  {q.en}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
                {bjOpts.map((o,oi)=><button
                  key={oi}
                  className={"ob "+(bjAns?(o===q.answer?"ok":bjSel===oi?"no":""):"")}
                  onClick={()=>{if(bjAns)return;sBjSel(oi);sBjAns(true);if(o===q.answer){sBjSc(s=>s+1);award(5);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}}>
                  {o}
                </button>)}
              </div>
              {bjAns&&<button
                className="b bp"
                style={{width:"100%",marginTop:16}}
                onClick={()=>{
                  if(bjIdx<total-1){const nq=bjQ[bjIdx+1];const allForms=BOJE.colors.flatMap(c=>nq.g==="f"?[c.f]:nq.g==="n"?[c.n]:nq.g==="m"?[c.m]:nq.g==="fp"?[c.fp]:nq.g==="np"?[c.np]:[c.mp]);const wrongs=sh(allForms.filter(f=>f!==nq.answer)).slice(0,3);sBjOpts(sh([nq.answer,...wrongs]));sBjIdx(i=>i+1);sBjAns(false);sBjSel(-1)}
                  else{award(bjSc*2);sBjIdx(total)}}}>
                {bjIdx<total-1?"Next →":"See Results"}
              </button>}
            </React.Fragment>
          );})()}
      </div>}
      {// ═══ MATCH GAME ═══
      scr==="match"&&<MatchGame mp={mp} mm={mm} msl={msl} gph={gph} gsc={gsc} sMm={sMm} sMsl={sMsl} sGsc={sGsc} sGph={sGph} goBack={goBack} award={award} />}
      {// ═══ WORD SPRINT ═══
      scr==="wordsprint"&&<WordSprint sh={sh} allCats={allCats} award={award} goBack={goBack} />}
      {scr==="match_OLD"&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🃏 Match Pairs")}
        {gph==="play"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {mp.map(c=><div
            key={c.id}
            style={{padding:"14px 12px",border:mm.includes(c.p)?"2px solid #22c55e":msl.some(s=>s.id===c.id)?"2px solid #0e7490":"2px solid #e7e5e4",borderRadius:14,background:mm.includes(c.p)?"rgba(77,124,15,.1)":msl.some(s=>s.id===c.id)?"rgba(14,116,144,.1)":"white",textAlign:"center",fontWeight:600,fontSize:14,cursor:"pointer",opacity:mm.includes(c.p)?0.6:1}}
            onClick={()=>{
              if(mm.includes(c.p))return;if(msl.length===0)sMsl([c]);
              else{const f=msl[0];if(f.id===c.id){sMsl([]);return}if(f.p===c.p&&f.tp!==c.tp){sMm(m=>[...m,c.p]);sGsc(s=>s+1);sMsl([]);if(mm.length+1===6)setTimeout(()=>{award(20);sGph("done")},500)}else{sMsl([f,c]);setTimeout(()=>sMsl([]),800)}}}}>
            {c.t}
          </div>)}
        </div>}
        {gph==="done"&&<div style={{textAlign:"center",paddingTop:40}}>
          <div style={{fontSize:64}}>
            🎉
          </div>
          <h3
            style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#164e63",marginTop:12}}>
            All Matched!
          </h3>
          <button className="b bp" style={{marginTop:24}} onClick={goBack}>
            Continue →
          </button>
        </div>}
      </div>}
      {// ═══ SPEAKING / PRONUNCIATION ═══
      scr==="speaking"&&<SpeakingScreen sw={sw} si={si} sx={sx} sr={sr} ssc={ssc} sSr={sSr} sSx={sSx} sSw={sSw} sSsc={sSsc} goBack={goBack} award={award} setSt={setSt} />}
      {scr==="speaking_OLD"&&sw&&<div
        style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>
          ← Back
        </button>
        {H("🎤 Pronunciation Practice")}
        <Bar v={sx+1} mx={si.length} color="#4d7c0f" h={6} />
        <div className="c" style={{textAlign:"center",marginTop:16}}>
          <p
            style={{fontSize:36,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>
            {sw[0]}
          </p>
          <p style={{fontSize:14,color:"#78716c",marginBottom:4}}>
            /
            {sw[2]}
            /
          </p>
          <p style={{fontSize:16,color:"#44403c",marginBottom:16}}>
            {sw[1]}
          </p>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
            <Spk text={sw[0]} label="Normal" />
            <button
              onClick={()=>speakSlow(sw[0])}
              style={{background:"rgba(77,124,15,.1)",border:"1px solid rgba(77,124,15,.2)",borderRadius:10,padding:"7px 12px",cursor:"pointer",fontSize:12,color:"#4d7c0f",fontWeight:700}}>
              🐢 Slow
            </button>
          </div>
          <button className="b bs" onClick={()=>{sSr("ok");sSsc(s=>s+1)}}>
            👍 I Said It Correctly!
          </button>
          {sr==="ok"&&<div style={{color:"#4d7c0f",fontSize:20,fontWeight:800,marginTop:12}}>
            ✓ Great pronunciation!
          </div>}
          {sr==="ok"&&<button
            className="b bp"
            style={{marginTop:16}}
            onClick={()=>{if(sx<si.length-1){const n=sx+1;sSx(n);sSw(si[n]);sSr(null)}else{award(ssc*5+5);setSt(s=>({...s,sp:s.sp+1}));goBack()}}}>
            {sx<si.length-1?"Next →":"Finish"}
          </button>}
        </div>
      </div>}
      {// ═══ VOCABULARY LESSON ═══
      scr==="lesson"&&<LessonScreen
        lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi} icons={icons}
        sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
        goBack={goBack} award={award} setSt={setSt}
      />}
      {// ═══ GRAMMAR ═══
      scr==="grammar"&&<GrammarScreen
        gl={gl} gp={gp} gx={gx} gs={gs} ga={ga} gsl={gsl}
        sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
        goBack={goBack} award={award} setSt={setSt}
      />}
      {// ═══ ALPHABET ═══
      scr==="alphabet"&&<AlphabetScreen goBack={goBack} />}
      {// ═══ READING LIST ═══
      scr==="readlist"&&<ReadingList
        setScr={setScr} sRp={sRp} sRph={sRph} sRqi={sRqi} sRsc={sRsc}
        sRa={sRa} sRsl={sRsl} sHw={sHw} sCurEx={sCurEx} goBack={goBack}
      />}
      {// ═══ READING ═══
      scr==="reading"&&<ReadingScreen
        rp={rp} rph={rph} rqi={rqi} rsc={rsc} ra={ra} rsl={rsl} hw={hw}
        sRph={sRph} sRqi={sRqi} sRsc={sRsc} sRa={sRa} sRsl={sRsl} sHw={sHw}
        goBack={goBack} setScr={setScr} award={award} setSt={setSt}
      />}
      {// ═══ BADGES ═══
      scr==="badges"&&<BadgesScreen badges={st.badges} goBack={goBack} />}
      {// ═══ PROFILE ═══
      scr==="profile"&&<ProfileScreen
        name={name} level={level} st={st} au={au}
        goBack={goBack} doOut={doOut}
      />}
      {(as==="app"&&scr!=="welcome"&&scr!=="placement") && <TabBar tab={tab} setTab={setTab} setScr={setScr} />}
    </div>
  );
}
export default App;
