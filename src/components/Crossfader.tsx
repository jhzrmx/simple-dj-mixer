import { useAudioStore } from '../store/audioStore';

export function Crossfader() {
  const store = useAudioStore();

  const handleCrossfaderInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = Number(target.value) / 100;
    store.setCrossfader(value);
  };

  return (
    <div class="bg-black/55 rounded-3xl px-6 py-4 mt-1 border border-white/10">
      <div class="flex justify-between mb-2 font-semibold text-[#cbd6ff] text-sm">
        <span>DECK A</span>
        <span>CROSSFADER</span>
        <span>DECK B</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(store.crossfader() * 100)}
        onInput={handleCrossfaderInput}
        class="w-full h-1.5 appearance-none bg-linear-to-r from-[#3f7bd5] via-[#8fbbff] to-[#3f7bd5] rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#4c7eff] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
      />
    </div>
  );
}
