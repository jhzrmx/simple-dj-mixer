import { guess } from 'web-audio-beat-detector';

export async function detectBPM(file: File): Promise<number | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const result = await guess(audioBuffer);
    await audioContext.close();
    return result?.bpm || null;
  } catch (err) {
    console.error('BPM detection failed:', err);
    return null;
  }
}

export function normalizeBPM(bpm: number): number {
  let normalized = bpm;
  while (normalized > 140) normalized /= 2;
  while (normalized < 70) normalized *= 2;
  return Math.round(normalized);
}
