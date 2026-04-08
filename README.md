# Simple DJ Mixer

A browser-based DJ mixer built with SolidJS and Web Audio APIs.

It includes two decks, waveform display, BPM detection, sync controls, VU metering, and a crossfader for live blending.

## Live Demo

- Demo: https://jhzrmx.github.io/simple-dj-mixer/

## Features

- Two independent decks (Deck A and Deck B)
- Drag-and-drop or file input track loading
- Interactive waveform visualization with seek support
- BPM detection and normalization
- One-click tempo sync between decks
- Crossfader-based deck blending
- Live VU meters and deck ring activity glow
- Responsive mixer UI for desktop and mobile

## Tech Stack

- SolidJS
- TypeScript
- Vite
- Tailwind CSS (via `@tailwindcss/vite`)
- WaveSurfer.js
- Web Audio API
- `web-audio-beat-detector`

## Getting Started

### 1. Clone

```bash
git clone https://github.com/jhzrmx/simple-dj-mixer.git
cd simple-dj-mixer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Then open `http://localhost:5173/`.

## Scripts

- `npm run dev` - Start local development server
- `npm run build` - Type-check and build production assets
- `npm run preview` - Preview built app locally

## Project Structure

```text
src/
  components/      UI components (Deck, Crossfader, VUMeter)
  hooks/           Audio context manager and shared logic
  store/           Global audio state store
  utils/           BPM detection and helper utilities
  App.tsx          Main mixer layout
```

## How Audio Works

- Each deck audio element is connected to a dedicated Web Audio source node.
- Per-deck gain nodes are controlled by the crossfader.
- Analyzer nodes read live signal levels for the VU display.
- BPM utilities process loaded files and expose normalized values for sync.

## Contributing

Contributions are welcome and appreciated.

### Ways to contribute

- Report bugs
- Propose UX or audio improvements
- Add tests or improve reliability
- Improve docs and onboarding

### Contribution workflow

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-change`
3. Make focused commits with clear messages.
4. Run checks locally: `npm run build`
5. Open a pull request with:
   - What changed
   - Why it changed
   - How to test it
   - Screenshots/GIFs for UI changes

### PR guidelines

- Keep pull requests small and focused.
- Avoid unrelated formatting-only changes.
- Preserve existing behavior unless explicitly changing it.
- Document any user-facing behavior updates in this README.

## Development Notes

- Browser autoplay policies require user interaction before audio playback.
- The app is best tested in modern Chromium, Firefox, or Safari versions.
- Prefer adding types and small, composable functions when extending features.

## Roadmap Ideas

- Pitch bend and jog wheel behavior
- EQ (low/mid/high) per deck
- Cue points and loop controls
- Playlist/crate management
- Keyboard shortcuts

## License

No license file is currently defined.

If you plan to open-source this broadly, consider adding a license such as MIT.
