import {  For } from 'solid-js';

interface VUMeterProps {
  label: string;
  level: number;
}

const NUM_BARS = 14;

export function VUMeter(props: VUMeterProps) {
  const getBarClass = (index: number) => {
    const isActive = index < props.level * NUM_BARS;
    if (!isActive) return 'vu-bar';

    const ratio = index / NUM_BARS;
    if (ratio > 0.8) return 'vu-bar vu-bar-active bg-red-500';
    if (ratio > 0.6) return 'vu-bar vu-bar-active bg-yellow-400';
    return 'vu-bar vu-bar-active bg-green-400';
  };

  return (
    <div class="flex flex-col items-center gap-2">
      <div class="text-xs font-bold text-[#bcc6f0] tracking-wide">{props.label}</div>
      <div class="flex flex-col-reverse gap-1 h-50 justify-start items-center">
        <For each={Array.from({ length: NUM_BARS })}>
          {(_, index) => (
            <div class={getBarClass(index())} />
          )}
        </For>
      </div>
    </div>
  );
}
