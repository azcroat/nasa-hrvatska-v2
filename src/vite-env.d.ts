/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Vendor browser APIs not in the standard TypeScript DOM lib
interface Window {
  webkitAudioContext: typeof AudioContext;
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
