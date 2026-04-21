/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Vendor browser APIs not in the standard TypeScript DOM lib
interface Window {
  webkitAudioContext: typeof AudioContext;
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  __nhReportError?: (error: Error, info: import('react').ErrorInfo) => void;
}

// canvas-confetti has no bundled types
declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    ticks?: number;
    gravity?: number;
    scalar?: number;
  }
  function confetti(options?: Options): Promise<null> | null;
  export = confetti;
}
