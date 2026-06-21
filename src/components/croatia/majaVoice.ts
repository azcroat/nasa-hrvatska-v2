// Voice-availability for Maja conversations.
//
// Maja's primary speech path is the Web Speech API (SpeechRecognition). iOS
// Safari does NOT implement it, so on iPhone `SR_SUPPORTED` is false. But iOS
// can still do voice via MediaRecorder -> Whisper (the useWhisperSTT fallback,
// same path AIConversation uses). So "can this device do voice at all?" is:
// Web Speech available, OR (getUserMedia + MediaRecorder) available.
//
// Pure + dependency-free so it can be unit-tested without the component's deps.
export function isVoiceAvailable(
  srSupported: boolean,
  hasGetUserMedia: boolean,
  hasMediaRecorder: boolean,
): boolean {
  return srSupported || (hasGetUserMedia && hasMediaRecorder);
}
