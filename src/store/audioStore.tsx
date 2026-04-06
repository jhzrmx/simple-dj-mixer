import { createStore } from 'solid-js/store';
import { createSignal, createContext, useContext, onCleanup } from 'solid-js';
import { AudioContextManager } from '../hooks/contexts/audioContext';

interface DeckState {
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  bpm: number | null;
  setPlaying: ((playing: boolean) => void) | null;
  setSpinning: ((spinning: boolean) => void) | null;
}

interface AudioStore {
  leftDeck: DeckState;
  rightDeck: DeckState;
  leftLevel: number;
  rightLevel: number;
  crossfader: number;
  audioCtxManager: AudioContextManager | null;
}

const AudioStoreContext = createContext<any>(null);

export function AudioProvider(props: { children: any }) {
  const [store, setStore] = createStore<AudioStore>({
    leftDeck: { audio: null, isPlaying: false, bpm: null, setPlaying: null, setSpinning: null },
    rightDeck: { audio: null, isPlaying: false, bpm: null, setPlaying: null, setSpinning: null },
    leftLevel: 0,
    rightLevel: 0,
    crossfader: 0.5,
    audioCtxManager: null,
  });

  const [smoothedLeft, setSmoothedLeft] = createSignal(0);
  const [smoothedRight, setSmoothedRight] = createSignal(0);

  let animationId: number | undefined;

  onCleanup(() => {
    if (animationId !== undefined) cancelAnimationFrame(animationId);
  });

  const initContext = () => {
    if (store.audioCtxManager) return;
    const manager = new AudioContextManager();
    setStore('audioCtxManager', manager);

    manager.setGainUpdate(() => {
      const cross = store.crossfader;
      const curve = Math.pow(cross, 1.5);
      if (cross < 0.5) {
        manager.setLeftGain(1);
        manager.setRightGain(curve * 2);
      } else {
        manager.setLeftGain((1 - curve) * 2);
        manager.setRightGain(1);
      }
    });

    startVUMeter();
  };

  const startVUMeter = () => {
    const update = () => {
      if (store.audioCtxManager) {
        const leftRaw = store.audioCtxManager.getLeftLevel();
        const rightRaw = store.audioCtxManager.getRightLevel();

        const newLeft = leftRaw > smoothedLeft() ? leftRaw : smoothedLeft() * 0.92 + leftRaw * 0.08;
        const newRight = rightRaw > smoothedRight() ? rightRaw : smoothedRight() * 0.92 + rightRaw * 0.08;

        setSmoothedLeft(newLeft);
        setSmoothedRight(newRight);
        setStore('leftLevel', newLeft);
        setStore('rightLevel', newRight);

        // Update VU rings
        updateVURing('left', newLeft);
        updateVURing('right', newRight);
      }
      animationId = requestAnimationFrame(update);
    };
    animationId = requestAnimationFrame(update);
  };

  const updateVURing = (side: string, level: number) => {
    const ring = document.getElementById(`vu-ring-${side}`);
    if (ring && level > 0.02) {
      const intensity = Math.pow(level, 0.6) * 1.8;
      const glow = 10 + Math.min(1.5, intensity) * 20;
      const alpha = 0.3 + Math.min(1, intensity) * 0.7;
      ring.style.borderColor = `rgba(0,255,200,${alpha})`;
      ring.style.boxShadow = `0 0 ${glow}px rgba(0,255,200,0.9)`;
    } else if (ring) {
      ring.style.borderColor = 'transparent';
      ring.style.boxShadow = 'none';
    }
  };

  const registerDeck = (deckId: string, controls: any) => {
    if (deckId === 'left') {
      setStore('leftDeck', { ...store.leftDeck, setPlaying: controls.setPlaying, setSpinning: controls.setSpinning });
    } else {
      setStore('rightDeck', { ...store.rightDeck, setPlaying: controls.setPlaying, setSpinning: controls.setSpinning });
    }
  };

  const connectDeck = (deckId: string, audio: HTMLAudioElement) => {
    initContext();
    store.audioCtxManager?.connectDeck(deckId, audio);
    if (deckId === 'left') {
      setStore('leftDeck', { ...store.leftDeck, audio });
    } else {
      setStore('rightDeck', { ...store.rightDeck, audio });
    }
  };

  const ensureConnection = (deckId: string) => {
    const audio = deckId === 'left' ? store.leftDeck.audio : store.rightDeck.audio;
    if (audio && store.audioCtxManager) {
      store.audioCtxManager.connectDeck(deckId, audio);
    }
  };

  const resumeContext = async () => {
    initContext();
    await store.audioCtxManager?.resume();
  };

  const setPlaying = (deckId: string, playing: boolean) => {
    if (deckId === 'left') {
      setStore('leftDeck', { ...store.leftDeck, isPlaying: playing });
    } else {
      setStore('rightDeck', { ...store.rightDeck, isPlaying: playing });
    }
  };

  const setBpm = (deckId: string, bpm: number | null) => {
    if (deckId === 'left') {
      setStore('leftDeck', { ...store.leftDeck, bpm });
    } else {
      setStore('rightDeck', { ...store.rightDeck, bpm });
    }
  };

  const getBpm = (deckId: string) => {
    return deckId === 'left' ? store.leftDeck.bpm : store.rightDeck.bpm;
  };

  const setCrossfader = (value: number) => {
    setStore('crossfader', value);
    store.audioCtxManager?.updateGains();
  };

  const value = {
    leftLevel: () => store.leftLevel,
    rightLevel: () => store.rightLevel,
    connectDeck,
    ensureConnection,
    resumeContext,
    setPlaying,
    setBpm,
    getBpm,
    registerDeck,
    setCrossfader,
  };

  return (
    <AudioStoreContext.Provider value={value}>
      {props.children}
    </AudioStoreContext.Provider>
  );
}

export function useAudioStore() {
  const ctx = useContext(AudioStoreContext);
  if (!ctx) throw new Error('useAudioStore must be used within AudioProvider');
  return ctx;
}
