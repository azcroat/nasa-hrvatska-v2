// e2e/fixtures/mockMediaRecorder.js
// SP10: swaps in a fake MediaRecorder + navigator.mediaDevices.getUserMedia
// so the recorder state machine advances without real audio.

export async function mockMediaRecorder(page) {
  await page.addInitScript(() => {
    const fakeStream = {
      getTracks: () => [{ stop: () => {} }],
      getAudioTracks: () => [{ stop: () => {} }],
      getVideoTracks: () => [],
    };

    if (typeof navigator !== 'undefined') {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => Promise.resolve(fakeStream),
        },
      });
    }

    class FakeMediaRecorder {
      constructor(stream, options) {
        this.stream = stream;
        this.mimeType = (options && options.mimeType) || 'audio/webm';
        this.state = 'inactive';
        this.ondataavailable = null;
        this.onstop = null;
        this.onerror = null;
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        if (this.state === 'inactive') return;
        this.state = 'inactive';
        const blob = new Blob([new Uint8Array(8)], { type: this.mimeType });
        if (this.ondataavailable) this.ondataavailable({ data: blob });
        if (this.onstop) this.onstop();
      }
      pause() { this.state = 'paused'; }
      resume() { this.state = 'recording'; }
      requestData() {
        const blob = new Blob([new Uint8Array(8)], { type: this.mimeType });
        if (this.ondataavailable) this.ondataavailable({ data: blob });
      }
    }
    FakeMediaRecorder.isTypeSupported = () => true;

    // @ts-ignore — replacing constructor
    window.MediaRecorder = FakeMediaRecorder;
  });
}
