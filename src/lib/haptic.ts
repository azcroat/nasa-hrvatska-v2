// Haptic feedback wrapper — silently no-ops on unsupported devices
export function tapHaptic(): void {
  try {
    navigator.vibrate?.(8);
  } catch {}
}
export function lightHaptic(): void {
  try {
    navigator.vibrate?.(15);
  } catch {}
}
export function doneHaptic(): void {
  try {
    navigator.vibrate?.([10, 30, 10]);
  } catch {}
}
