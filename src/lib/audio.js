// ═══════════════════════════════════════════════════════════
// Audio Engine — Native Croatian Pronunciation
// Extracted from data.jsx as part of Sprint 1 architectural split
// ═══════════════════════════════════════════════════════════

let _au=false;let _voices=[];let _voicesLoaded=false;let _audioCache={};let _currentAudio=null;
const _iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function uA(){if(_au)return;_au=true;try{const c=new(window.AudioContext||window.webkitAudioContext)();const b=c.createBuffer(1,1,22050);const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);c.resume()}catch(e){}}
["touchstart","click"].forEach(e=>{document.addEventListener(e,function h(){uA();document.removeEventListener(e,h)},{passive:true,once:true})});
export function loadVoices(){if(window.speechSynthesis){_voices=window.speechSynthesis.getVoices();_voicesLoaded=_voices.length>0}}
if(window.speechSynthesis){loadVoices();window.speechSynthesis.onvoiceschanged=loadVoices}
export function getBestVoice(){if(!_voicesLoaded)loadVoices();const v=_voices;const hr=v.filter(x=>x.lang.startsWith("hr"));if(hr.length>0)return hr.find(x=>!x.localService)||hr[0];const bs=v.filter(x=>x.lang.startsWith("bs"));if(bs.length>0)return bs[0];const sr=v.filter(x=>x.lang.startsWith("sr"));if(sr.length>0)return sr[0];return null}
export function stopAudio(){if(_currentAudio){try{_currentAudio.pause();_currentAudio.currentTime=0}catch(e){}_currentAudio=null}if(window.speechSynthesis)window.speechSynthesis.cancel()}
export async function speakAzure(text,slow){
  stopAudio();
  const a=new Audio();a.volume=1.0;_currentAudio=a;
  try{
    const r=await fetch("/api/tts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:text,slow:!!slow})});
    if(!r.ok){const rb=await r.text().catch(()=>"");console.error("[TTS] Azure HTTP "+r.status+" body:"+rb+" — check AZURE_TTS_KEY + AZURE_TTS_REGION in Cloudflare env vars");return false;}
    const blob=await r.blob();const url=URL.createObjectURL(blob);
    a.src=url;a.load();
    await a.play();return true;
  }catch(e){console.error("[TTS] Azure error:",e);return false}
}
export function speakGoogle(text,onFail){
  stopAudio();
  if(text.length>200){const sentences=text.match(/[^.!?]+[.!?]+/g)||[text];let i=0;function playNext(){if(i>=sentences.length)return;const s=sentences[i].trim();if(!s){i++;playNext();return}const url="https://translate.google.com/translate_tts?ie=UTF-8&tl=hr&client=tw-ob&q="+encodeURIComponent(s);const a=new Audio(url);a.volume=1.0;_currentAudio=a;a.onended=()=>{i++;playNext()};a.onerror=()=>{if(onFail)onFail(text)};a.play().catch(()=>{if(onFail)onFail(text)})}playNext();return}
  const url="https://translate.google.com/translate_tts?ie=UTF-8&tl=hr&client=tw-ob&q="+encodeURIComponent(text);
  const a=new Audio(url);a.volume=1.0;_currentAudio=a;
  a.onerror=()=>{if(onFail)onFail(text)};
  const p=a.play();if(p)p.catch(()=>{if(onFail)onFail(text)})
}
export function speakSynth(text,rate){
  if(!window.speechSynthesis)return;
  stopAudio();
  const u=new SpeechSynthesisUtterance(text);u.lang="hr-HR";u.rate=rate;u.pitch=1.0;u.volume=1.0;
  const best=getBestVoice();if(best)u.voice=best;
  window.speechSynthesis.speak(u);
}
export function speak(text){
  if(!text)return;
  speakAzure(text,false).then(ok=>{if(!ok)speakSynth(text,0.9)}).catch(()=>speakSynth(text,0.9));
}
export function speakSlow(text){
  if(!text)return;
  speakAzure(text,true).then(ok=>{if(!ok)speakSynth(text,0.6)}).catch(()=>speakSynth(text,0.6));
}
export function speakEN(text){if(!text||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=0.9;window.speechSynthesis.speak(u)}
