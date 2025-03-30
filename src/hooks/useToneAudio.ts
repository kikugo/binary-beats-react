import { useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';

// Default note durations corresponding to binary positions
const DEFAULT_NOTE_DURATIONS = [1.7, 1.5, 1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.5, 0.4];

/**
 * Custom hook for managing Tone.js audio functionality
 */
export const useToneAudio = (notes: string[]) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  
  // Initialize the synthesizer 
  const initializeSynth = useCallback(async () => {
    if (!isInitialized) {
      // Request audio context to be created (needed for browsers)
      await Tone.start();
      
      // Create polyphonic synthesizer
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.4,
          release: 1.5
        }
      }).toDestination();
      
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  // Play a specific note at a specific index
  const playNote = useCallback((index: number, time: number = Tone.now()) => {
    if (synthRef.current && index >= 0 && index < notes.length) {
      synthRef.current.triggerAttackRelease(
        notes[index], 
        DEFAULT_NOTE_DURATIONS[index], 
        time
      );
    }
  }, [notes]);
  
  // Start audio playback with a callback for timing
  const startAudio = useCallback(async (callback: (time: number) => void) => {
    await initializeSynth();
    
    // Set BPM
    Tone.Transport.bpm.value = 50;
    
    // Schedule the callback to run repeatedly
    const id = Tone.Transport.scheduleRepeat((time) => {
      callback(time);
    }, '32i');
    
    // Start the Transport timeline
    Tone.Transport.start();
    
    return id;
  }, [initializeSynth]);
  
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
