import { createSignal, onMount } from 'solid-js';
import WaveSurfer from 'wavesurfer.js';
import { useAudioStore } from '../store/audioStore';
import { detectBPM, normalizeBPM } from '../utils/bpmDetector';
import { formatTime } from '../utils/formatTime';

interface DeckProps {
  side: 'left' | 'right';
}

export function Deck(props: DeckProps) {
  const [audioElement] = createSignal(new Audio());
  const [waveSurfer, setWaveSurfer] = createSignal<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isSpinning, setIsSpinning] = createSignal(false);
  const [trackName, setTrackName] = createSignal('');
  const [currentTime, setCurrentTime] = createSignal('0:00');
  const [duration, setDuration] = createSignal('0:00');
  const [bpm, setBpm] = createSignal<number | null>(null);
  const [isSyncing, setIsSyncing] = createSignal(false);
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [originalPlaybackRate, setOriginalPlaybackRate] = createSignal(1.0);

  const store = useAudioStore();
  const isLeft = props.side === 'left';
  const deckId = isLeft ? 'left' : 'right';
  const title = isLeft ? 'DECK A' : 'DECK B';
  const badge = isLeft ? 'LEFT' : 'RIGHT';

  let fileInputRef: HTMLInputElement | undefined;

  const updateTimeDisplay = () => {
    const audio = audioElement();
    if (audio.duration && !isNaN(audio.duration)) {
      setCurrentTime(formatTime(audio.currentTime));
      setDuration(formatTime(audio.duration));
      waveSurfer()?.seekTo(audio.currentTime / audio.duration);
    }
  };

  const loadTrack = async (file: File) => {
    const url = URL.createObjectURL(file);
    const audio = audioElement();

    if (isPlaying()) {
      audio.pause();
      setIsPlaying(false);
      setIsSpinning(false);
    }

    audio.src = url;
    audio.load();
    audio.playbackRate = originalPlaybackRate();

    setTrackName(file.name.length > 28 ? file.name.slice(0, 25) + '...' : file.name);

    waveSurfer()?.load(url);

    audio.onloadedmetadata = async () => {
      setDuration(formatTime(audio.duration));
      setCurrentTime('0:00');

      const detectedBpm = await detectBPM(file);
      const normalizedBpm = detectedBpm ? normalizeBPM(detectedBpm) : null;
      if (normalizedBpm && normalizedBpm > 40 && normalizedBpm < 210) {
        setBpm(normalizedBpm);
        store.setBpm(deckId, normalizedBpm);
      } else {
        setBpm(null);
        store.setBpm(deckId, null);
      }

      store.connectDeck(deckId, audio);
    };
  };

  const isAudioFile = (file: File) => {
    if (file.type.startsWith('audio/')) return true;
    return /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
  };

  const handleAudioFile = (file: File | undefined) => {
    if (!file) return;
    if (!isAudioFile(file)) {
      alert('Only audio files are allowed.');
      return;
    }
    loadTrack(file);
  };

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    handleAudioFile(input.files?.[0]);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleAudioFile(e.dataTransfer?.files?.[0]);
  };

  const handlePlay = async () => {
    const audio = audioElement();
    if (!audio.src) return;

    await store.resumeContext();
    store.ensureConnection(deckId);

    await audio.play();
    setIsPlaying(true);
    setIsSpinning(true);
    store.setPlaying(deckId, true);
  };

  const handlePause = () => {
    const audio = audioElement();
    audio.pause();
    setIsPlaying(false);
    setIsSpinning(false);
    store.setPlaying(deckId, false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 500);

    const targetSide = isLeft ? 'right' : 'left';
    const targetBpm = store.getBpm(targetSide);

    if (!targetBpm) {
      alert(`Load a track on Deck ${targetSide.toUpperCase()} first`);
      return;
    }

    const currentBpm = store.getBpm(deckId);
    if (!currentBpm) {
      alert(`Could not detect BPM on this deck`);
      return;
    }

    const ratio = targetBpm / currentBpm;
    const newRate = Math.min(1.8, Math.max(0.55, ratio)) * originalPlaybackRate();
    audioElement().playbackRate = newRate;
    setOriginalPlaybackRate(newRate);
  };

  const handleWaveformClick = (e: MouseEvent) => {
    const container = waveSurfer()?.getWrapper();
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const percent = Math.min(1, Math.max(0, x));
    const audio = audioElement();
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
    }
  };

  onMount(() => {
    const ws = WaveSurfer.create({
      container: `#waveform-${deckId}`,
      waveColor: '#4c7eff',
      progressColor: '#00ffc3',
      height: 70,
      barWidth: 2,
      barGap: 1,
      interact: false,
      cursorWidth: 1,
      cursorColor: '#ffffff',
    });

    setWaveSurfer(ws);

    const audio = audioElement();
    audio.addEventListener('timeupdate', updateTimeDisplay);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setIsSpinning(false);
      store.setPlaying(deckId, false);
    });
    audio.crossOrigin = 'anonymous';

    store.registerDeck(deckId, {
      audio,
      setPlaying: setIsPlaying,
      setSpinning: setIsSpinning,
    });

    return () => {
      audio.pause();
      audio.src = '';
      ws.destroy();
    };
  });

  return (
    <div
      class="flex-1 min-w-70 deck-glass rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
      classList={{ 'ring-2 ring-cyan-400/80': isDragOver() }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div class="flex justify-between items-baseline mb-2">
        <span class="text-2xl font-extrabold bg-linear-to-r from-[#eef4ff] to-[#b4c4ff] bg-clip-text text-transparent">
          {title}
        </span>
        <span class="bg-[#2a2f44] px-3 py-1 rounded-full text-xs font-semibold text-[#bdd4ff]">
          {badge}
        </span>
      </div>

      <div class="flex items-center justify-between bg-black/45 rounded-full px-4 py-2 mb-4 gap-2 backdrop-blur-sm border border-white/10">
        <div class="bg-[#10131f] px-3 py-1 rounded-full font-mono font-extrabold text-sm text-[#c4ffda] shadow-inner">
          <span class="text-xs text-[#8f9ee0] mr-1">BPM</span>
          {bpm() ? bpm() : '---'}
        </div>
        <button
          onClick={handleSync}
          classList={{
            'bg-gradient-to-br from-[#2a2f48] to-[#1a1e32] text-[#d9e2ff]': !isSyncing(),
            'sync-btn-active': isSyncing(),
          }}
          class="px-4 py-1.5 rounded-full font-bold text-xs cursor-pointer transition-all shadow-md flex items-center gap-1.5 active:scale-95"
        >
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 fill-current" aria-hidden="true">
            <path d="M12 5a7 7 0 0 1 6.36 4H16a1 1 0 1 0 0 2h5a1 1 0 0 0 1-1V5a1 1 0 1 0-2 0v2.06A9 9 0 0 0 3 12a1 1 0 1 0 2 0 7 7 0 0 1 7-7Zm9 6a1 1 0 0 0-1 1 7 7 0 0 1-13.36 3H9a1 1 0 1 0 0-2H4a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-2.06A9 9 0 0 0 21 12a1 1 0 0 0-1-1Z" />
          </svg>
          SYNC TO {isLeft ? 'B' : 'A'}
        </button>
      </div>

      <div
        class="relative w-full mb-3 cursor-pointer"
        onClick={handleWaveformClick}
      >
        <div
          id={`waveform-${deckId}`}
          class="relative z-0 w-full h-17.5 rounded-xl overflow-hidden bg-black/40"
        />
        <div class="pointer-events-none absolute bottom-1 right-3 z-10 bg-black/70 px-2 py-0.5 font-mono text-xs font-semibold text-[#cafff0] backdrop-blur-sm rounded-full border border-cyan-400/30">
          {currentTime()} / {duration()}
        </div>
      </div>

      <div class="flex justify-center my-4 relative">
        <div class="relative w-37.5 h-37.5 md:w-37.5 md:h-37.5">
          <div
            classList={{
              'animate-spin-slow': isSpinning(),
            }}
            class="absolute inset-0 rounded-full bg-radial from-[#2d3348] to-[#0c0f18] shadow-2xl border-2 border-white/20 flex items-center justify-center"
          >
            <div class="w-15 h-15 rounded-full bg-radial from-[#c0d0ff] to-[#2a3a7a] shadow-inner flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-7 h-7 text-[#101b3b] fill-current" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Zm0 5a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z" />
              </svg>
            </div>
          </div>
          <div
            id={`vu-ring-${deckId}`}
            class="absolute -inset-2 rounded-full border-4 border-transparent pointer-events-none transition-all duration-75"
          />
        </div>
      </div>

      <label class="block bg-[#202536] text-center py-2 rounded-full text-sm font-medium text-[#cddcff] cursor-pointer transition-all hover:bg-[#2c334e] hover:border-[#6a7bc0] border border-[#3a405a]">
        <span class="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M4 4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm10 0v4h4" />
            <path d="M12 10a1 1 0 0 1 1 1v3.59l1.3-1.3a1 1 0 1 1 1.4 1.42l-3 3a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.42l1.3 1.3V11a1 1 0 0 1 1-1Z" />
          </svg>
          LOAD TRACK
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3"
          onChange={handleFileChange}
          class="hidden"
        />
      </label>
      <div class="text-xs text-center mt-2 text-[#a3b3e6] truncate">
        {trackName()}
      </div>

      <div class="flex justify-center mt-4">
        <button
          onClick={() => (isPlaying() ? handlePause() : handlePlay())}
          class="w-12 h-12 rounded-full bg-[#3f4b86] text-white font-bold shadow-lg flex items-center justify-center active:scale-95 transition-all hover:shadow-cyan-400/40"
          aria-label={isPlaying() ? 'Pause track' : 'Play track'}
          title={isPlaying() ? 'Pause' : 'Play'}
        >
          {isPlaying() ? (
            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M7 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm10 0a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M8 5.5A1.5 1.5 0 0 1 10.3 4.2l8 6a2.2 2.2 0 0 1 0 3.6l-8 6A1.5 1.5 0 0 1 8 18.5v-13Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
