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

    this.updateGains();
  }

  setGainUpdate(callback: () => void) {
    this.gainUpdateCallback = callback;
  }

  updateGains() {
    this.gainUpdateCallback?.();
  }

  setLeftGain(value: number) {
    if (!this.gainLeft) return;
    this.gainLeft.gain.value = Math.max(0, Math.min(1, value));
  }

  setRightGain(value: number) {
    if (!this.gainRight) return;
    this.gainRight.gain.value = Math.max(0, Math.min(1, value));
  }

  private getRmsLevel(analyser: AnalyserNode | null, audio: HTMLAudioElement | null): number {
    if (!analyser || !audio || audio.paused || audio.ended) return 0;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);

    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumSquares / data.length);
    const boosted = Math.min(1, rms * 2.8);

    // Ignore analyser noise floor to prevent a single lingering VU bar when paused.
    return boosted < 0.03 ? 0 : boosted;
  }

  getLeftLevel(): number {
    return this.getRmsLevel(this.analyserLeft, this.sourceLeftAudio);
  }

  getRightLevel(): number {
    return this.getRmsLevel(this.analyserRight, this.sourceRightAudio);
  }
}
