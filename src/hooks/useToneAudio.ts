import { useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { InstrumentType } from '../components/InstrumentSelector';
import { AudioEffectsConfig } from '../components/AudioEffectsPanel';

// For debouncing rapid note triggers
const NOTE_DEBOUNCE_TIME = 50; // ms

// Default note durations corresponding to binary positions
const DEFAULT_NOTE_DURATIONS = [1.7, 1.5, 1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.5, 0.4];

interface UseToneAudioProps {
  notes: string[];
  instrumentType?: InstrumentType; // Optional since we're just using basic synth
  tempo?: number;
  effects?: AudioEffectsConfig;
}

// Default effects configuration
const DEFAULT_EFFECTS: AudioEffectsConfig = {
  reverb: 0,
  delay: 0,
  filter: 1,
  volume: 0.8
};

/**
 * Extremely simplified audio hook using only a basic synth
 * Focuses on maximum reliability and cross-browser compatibility
 */
export const useToneAudio = ({ 
  notes, 
  tempo = 50,
  effects = DEFAULT_EFFECTS 
}: UseToneAudioProps) => {
  // Using PolySynth instead of basic Synth to handle multiple notes
  const synthRef = useRef<Tone.PolySynth | null>(null);
  
  // Initialize audio on mount
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Explicitly create and start audio context
        await Tone.start();
        console.log('Tone.js started');
        
        // Create a polyphonic synth with simple settings
        if (!synthRef.current) {
          // Create a polyphonic synth that can play multiple notes at once
          synthRef.current = new Tone.PolySynth(Tone.Synth);
          
          // Set volume separately
          synthRef.current.volume.value = effects.volume * 20 - 10;
          
          // Configure each voice's settings
          synthRef.current.set({
            oscillator: {
              type: 'triangle'
            },
            envelope: {
              attack: 0.01,
              decay: 0.1,
              sustain: 0.3,
              release: 0.5
            }
          });
          
          // Connect to output
          synthRef.current.toDestination();
          console.log('PolySynth created');
        }
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };
    
    initAudio();
    
    // Add multiple ways to unlock audio context on different browsers
    const resumeAudio = async () => {
      if (Tone.context && Tone.context.state !== 'running') {
        try {
          await Tone.context.resume();
          console.log('Audio context resumed');
        } catch (err) {
          console.error('Failed to resume context:', err);
        }
      }
    };
    
    // Listen for common user interactions
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
      document.removeEventListener('touchstart', resumeAudio);
      
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, [effects.volume]);
  
  // Update volume when it changes
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = effects.volume * 20 - 10;
    }
  }, [effects.volume]);
  
  // Track last played times for debouncing
  const lastPlayedRef = useRef<Record<number, number>>({});
  
  // Improved note playing with debouncing
  const playNote = useCallback((index: number, time: number = Tone.now()) => {
    if (!synthRef.current || index < 0 || index >= notes.length) {
      console.log(`Invalid note attempt at index ${index}`);
      return;
    }
    
    try {
      // Implement debouncing to prevent rapid re-triggers
      const now = Date.now();
      const lastPlayed = lastPlayedRef.current[index] || 0;
      
      if (now - lastPlayed < NOTE_DEBOUNCE_TIME) {
        // Skip if the note was played too recently
        return;
      }
      
      // Update last played time
      lastPlayedRef.current[index] = now;
      
      const note = notes[index];
      if (!note) {
        console.log(`No note data at index ${index}`);
        return;
      }
      
      const duration = DEFAULT_NOTE_DURATIONS[index] || 0.5;
      
      // Ensure the note is in the format Tone.js expects
      if (typeof note === 'string' && note.match(/^[A-G][#b]?[0-9]$/)) {
        // Add a small random offset to time to avoid exact simultaneous triggers
        const offset = Math.random() * 0.01;
        synthRef.current.triggerAttackRelease(note, duration, time + offset);
        console.log(`Playing note ${note} with duration ${duration}`);
      } else {
        console.log(`Invalid note format at index ${index}: ${note}`);
      }
    } catch (error) {
      console.error('Error playing note:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  }, [notes]);
  
  // Start audio playback
  const startAudio = useCallback(async (callback: (time: number) => void) => {
    try {
      // Make sure audio context is running
      if (Tone.context && Tone.context.state !== 'running') {
        await Tone.context.resume();
      }
      
      // Set BPM
      Tone.Transport.bpm.value = tempo;
      
      // Use a simpler, more reliable time interval
      const id = Tone.Transport.scheduleRepeat((time) => {
        callback(time);
      }, '8n');
      
      Tone.Transport.start();
      console.log('Audio playback started');
      return id;
    } catch (error) {
      console.error('Failed to start audio:', error);
      return null;
    }
  }, [tempo]);
  
  // Stop audio playback
  const stopAudio = useCallback(() => {
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      console.log('Audio stopped');
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, []);
  
  return {
    playNote,
    startAudio,
    stopAudio
  };
};
