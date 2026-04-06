export class AudioContextManager {
  private ctx: AudioContext | null = null;
  private gainLeft: GainNode | null = null;
  private gainRight: GainNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private sourceLeft: MediaElementAudioSourceNode | null = null;
  private sourceRight: MediaElementAudioSourceNode | null = null;
  private sourceLeftAudio: HTMLAudioElement | null = null;
  private sourceRightAudio: HTMLAudioElement | null = null;
  private gainUpdateCallback: (() => void) | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainLeft = this.ctx.createGain();
    this.gainRight = this.ctx.createGain();
    this.analyserLeft = this.ctx.createAnalyser();
    this.analyserRight = this.ctx.createAnalyser();

    this.analyserLeft.fftSize = 256;
    this.analyserRight.fftSize = 256;

    this.gainLeft.connect(this.analyserLeft);
    this.gainRight.connect(this.analyserRight);
    this.analyserLeft.connect(this.ctx.destination);
    this.analyserRight.connect(this.ctx.destination);
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  connectDeck(deckId: string, audio: HTMLAudioElement) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    if (deckId === 'left') {
      // Reuse existing source node for this audio element; creating another throws InvalidStateError.
      if (this.sourceLeft && this.sourceLeftAudio === audio) return;
      if (this.sourceLeft) this.sourceLeft.disconnect();
      this.sourceLeft = this.ctx.createMediaElementSource(audio);
      this.sourceLeftAudio = audio;
      this.sourceLeft.connect(this.gainLeft!);
    } else {
      // Reuse existing source node for this audio element; creating another throws InvalidStateError.
      if (this.sourceRight && this.sourceRightAudio === audio) return;
      if (this.sourceRight) this.sourceRight.disconnect();
      this.sourceRight = this.ctx.createMediaElementSource(audio);
      this.sourceRightAudio = audio;
      this.sourceRight.connect(this.gainRight!);
    }
  }

  setGainUpdate(callback: () => void) {
    this.gainUpdateCallback = callback;
  }

  updateGains() {
    this.gainUpdateCallback?.();
  }

  setLeftGain(value: number) {
    if (this.gainLeft) this.gainLeft.gain.value = value;
  }

  setRightGain(value: number) {
    if (this.gainRight) this.gainRight.gain.value = value;
  }

  getLeftLevel(): number {
    if (!this.analyserLeft) return 0;
    const data = new Uint8Array(this.analyserLeft.frequencyBinCount);
    this.analyserLeft.getByteTimeDomainData(data);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs((data[i] - 128) / 128);
      max = Math.max(max, v);
    }
    return Math.min(1, max * 1.4);
  }

  getRightLevel(): number {
    if (!this.analyserRight) return 0;
    const data = new Uint8Array(this.analyserRight.frequencyBinCount);
    this.analyserRight.getByteTimeDomainData(data);
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs((data[i] - 128) / 128);
      max = Math.max(max, v);
    }
    return Math.min(1, max * 1.4);
  }
}
