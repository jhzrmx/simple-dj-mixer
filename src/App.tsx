// src/App.tsx
import { createSignal, onMount} from 'solid-js';
import { Deck } from './components/Deck';
import { VUMeter } from './components/VUMeter';
import { Crossfader } from './components/Crossfader';
import { AudioContextManager } from './hooks/contexts/audioContext';
import { useAudioStore } from './store/audioStore';

function App() {
  const [audioCtxManager] = createSignal(new AudioContextManager());
  const { leftLevel, rightLevel } = useAudioStore();

  onMount(() => {
    const handleUserInteraction = () => {
      audioCtxManager().resume();
      document.body.removeEventListener('touchstart', handleUserInteraction);
      document.body.removeEventListener('click', handleUserInteraction);
    };
    document.body.addEventListener('touchstart', handleUserInteraction);
    document.body.addEventListener('click', handleUserInteraction);
  });

  return (
    <div class="min-h-screen flex justify-center items-center p-6">
      <div class="max-w-350 w-full mixer-glass rounded-[3rem] p-6 md:p-8 shadow-2xl">
        <div class="flex flex-wrap gap-6 justify-center items-stretch mb-8">
          <Deck side="left" />
          <div class="hidden md:flex gap-8 items-center justify-center bg-black/40 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 min-w-35">
            <VUMeter label="DECK A" level={leftLevel()} />
            <VUMeter label="DECK B" level={rightLevel()} />
          </div>
          <Deck side="right" />
        </div>
        <Crossfader />
      </div>
    </div>
  );
}

export default App;
