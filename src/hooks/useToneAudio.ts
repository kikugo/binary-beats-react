import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { InstrumentType } from '../components/InstrumentSelector';

// Default note durations corresponding to binary positions
const DEFAULT_NOTE_DURATIONS = [1.7, 1.5, 1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.5, 0.4];

interface UseToneAudioProps {
  notes: string[];
  instrumentType: InstrumentType;
  tempo?: number;
}

type ToneInstrument = Tone.Synth | Tone.AMSynth | Tone.FMSynth | Tone.MembraneSynth | Tone.MetalSynth;

/**
 * Custom hook for managing Tone.js audio functionality
 */
export const useToneAudio = ({ notes, instrumentType, tempo = 50 }: UseToneAudioProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const synthRef = useRef<ToneInstrument | null>(null);
  
  // Re-initialize when instrument type changes
  useEffect(() => {
    if (isInitialized) {
      // Dispose of previous synth to free memory
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      setIsInitialized(false);
    }
  }, [instrumentType, isInitialized]);
  
  // Initialize the synthesizer 
  const initializeSynth = useCallback(async () => {
    if (!isInitialized) {
      // Request audio context to be created (needed for browsers)
      await Tone.start();
      
      // Create appropriate synthesizer based on instrument type
      let synth: ToneInstrument;
      
      switch (instrumentType) {
        case 'synth':
          synth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1.5 }
          });
          break;
        case 'am':
          synth = new Tone.AMSynth({
            harmonicity: 3,
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 1.5 }
          });
          break;
        case 'fm':
          synth = new Tone.FMSynth({
            harmonicity: 2,
            modulationIndex: 3,
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 1.5 }
          });
          break;
        case 'membrane':
          synth = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 1.5 }
          });
          break;
        case 'metal':
          synth = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.1, release: 0.8 }
          });
          // Set frequency separately due to TypeScript constraints
          (synth as Tone.MetalSynth).frequency.value = 200;
          break;
        default:
          synth = new Tone.Synth();
      }
      
      // Connect to audio output and store reference
      synth.toDestination();
      synthRef.current = synth;
      
      setIsInitialized(true);
    }
  }, [isInitialized, instrumentType]);
  
  // Play a specific note at a specific index
  const playNote = useCallback((index: number, time: number = Tone.now()) => {
    if (synthRef.current && index >= 0 && index < notes.length) {
      // Different instruments have specific requirements for note duration
      const duration = DEFAULT_NOTE_DURATIONS[index] || 0.5;
      
      if (instrumentType === 'metal') {
        // Metal synth doesn't take note parameter, just triggers with duration
        (synthRef.current as Tone.MetalSynth).triggerAttackRelease(duration, time);
      } else if (instrumentType === 'membrane') {
        // For membrane synth, we need to convert the note to frequency
        const freq = Tone.Frequency(notes[index]).toFrequency();
        (synthRef.current as Tone.MembraneSynth).triggerAttackRelease(freq, duration, time);
      } else {
        // Standard synths take note and duration
        synthRef.current.triggerAttackRelease(notes[index], duration, time);
      }
    }
  }, [notes, instrumentType]);
  
  // Start audio playback with a callback for timing
  const startAudio = useCallback(async (callback: (time: number) => void) => {
    await initializeSynth();
    
    // Set BPM
    Tone.Transport.bpm.value = tempo;
    
    // Schedule the callback to run repeatedly
    const id = Tone.Transport.scheduleRepeat((time) => {
      callback(time);
    }, '32i');
    
    // Start the Transport timeline
    Tone.Transport.start();
    
    return id;
  }, [initializeSynth, tempo]);
  
  // Stop audio playback
  const stopAudio = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear all scheduled events
  }, []);
  
  return {
    playNote,
    startAudio,
    stopAudio,
    isInitialized
  };
};
