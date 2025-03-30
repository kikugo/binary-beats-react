# Binary Beats React

A modern React and TypeScript implementation of the binary music concept, where binary counting creates musical patterns, featuring a dynamic audio visualizer.

![Binary Beats React](https://github.com/kikugo/binary-beats-react/raw/main/public/preview.png)  <!-- TODO: Update with a current screenshot -->

## About

Binary Beats React transforms binary counting into music and visuals. As a counter increments in binary (0-1023), each column plays a musical note when it changes to a "1". This creates interesting musical patterns based purely on the mathematics of binary counting. The application also features a dynamic visualizer that reacts to the binary state.

This project is a modern reimplementation featuring:
- React component architecture
- TypeScript for type safety and better developer experience
- Custom hooks for audio engine abstraction (`useToneAudio`) and state management
- Performant Canvas-based audio visualization
- Responsive design for all devices

## Features

- 🎵 Binary-driven musical patterns using a reliable `Tone.PolySynth` engine.
- 📊 **New!** Dual Visualizer Modes:
    - **Frequency Bars:** Visual representation of each bit's state.
    - **Waveform:** Dynamic wave generated from the active bits.
    - Click the visualizer to toggle modes!
- 🎨 Dynamic color schemes for the visualizer based on the binary value.
- 🎹 Customizable notes for each binary position (functionality currently stable but UI temporarily simplified).
- 🎛️ Simple play/pause controls.
- 🔄 URL-based sharing of custom note configurations.
- 💻 Modern React implementation with hooks.
- ✨ Performance optimizations in both audio and visual rendering.

## Usage

To run this project locally:

```bash
# Clone the repository
git clone https://github.com/kikugo/binary-beats-react.git
cd binary-beats-react

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Planned Features

- Multiple instrument options (re-implementation planned)
- Sound effect controls (reverb, delay)
- Dark/light theme options
- Save/load functionality for configurations
- Advanced sharing options

## Credits and Inspiration

This project was inspired by:
- [Binary Music Player](https://github.com/tholman/binary-music-player) by Tim Holman
- [1023.exe](https://www.youtube.com/watch?v=CdaPhpGG6As) by Alfred Kedhammar
- The general concept of algorithmic music and creative coding.

## Technology

- React 18
- TypeScript
- Tone.js for audio synthesis
- Vite for development and building

## License

MIT License

Copyright (c) 2024 [Your Name or Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---
