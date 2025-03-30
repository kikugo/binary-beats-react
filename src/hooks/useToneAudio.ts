import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { InstrumentType } from '../components/InstrumentSelector';
import { AudioEffectsConfig } from '../components/AudioEffectsPanel';

// Default note durations corresponding to binary positions
const DEFAULT_NOTE_DURATIONS = [1.7, 1.5, 1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.5, 0.4];

interface UseToneAudioProps {
  notes: string[];
  instrumentType: InstrumentType;
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
 * Completely rebuilt audio hook with a minimal, reliable implementation
 * for better cross-browser compatibility and performance.
 */
export const useToneAudio = ({ 
  notes, 
  instrumentType = 'synth', 
  tempo = 50,
  effects = DEFAULT_EFFECTS 
}: UseToneAudioProps) => {
  // Keep track of Tone.js initialization state
  const [isReady, setIsReady] = useState(false);
  
  // Reference to synth instance
  const synthRef = useRef<any>(null);
  
  // Reference to volume node
  const volumeRef = useRef<Tone.Volume | null>(null);
  
  // Initialize Tone.js on component mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Start the audio context and unlock it
        await Tone.start();
        
        // Make sure the context is running
        if (Tone.context.state !== 'running') {
          await Tone.context.resume();
        }
        
        console.log('Audio ready, context state:', Tone.context.state);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };
    
    // Try to set up audio
    setupAudio();
    
    // Set up event handlers to unlock audio
    const unlockAudio = async () => {
      if (Tone.context.state !== 'running') {
        try {
          await Tone.context.resume();
          console.log('Audio context resumed by user interaction');
        } catch (err) {
          console.error('Failed to resume context:', err);
        }
      }
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    // Clean up on unmount
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      
      // Clean up any synths
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      
      if (volumeRef.current) {
        volumeRef.current.dispose();
      }
    };
  }, []);
  
  // Create/recreate synth when instrument type or effects change
  useEffect(() => {
    // Only proceed if audio is ready
    if (!isReady) return;
    
    console.log('Creating synth with instrument:', instrumentType);
    
    // Dispose of previous synth if exists
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
    
    if (volumeRef.current) {
      volumeRef.current.dispose();
      volumeRef.current = null;
    }
    
    // Create volume node
    const volume = new Tone.Volume(effects.volume * 20 - 10).toDestination();
    volumeRef.current = volume;
    
    // Create synth based on instrument type
    let synth;
    switch (instrumentType) {
      case 'metal':
        synth = new Tone.MetalSynth({
          frequency: 200,
          envelope: { attack: 0.001, decay: 0.1, release: 0.1 }
        }).connect(volume);
        break;
      case 'pluck':
        synth = new Tone.PluckSynth().connect(volume);
        break;
      case 'membrane':
        synth = new Tone.MembraneSynth().connect(volume);
        break;
      case 'fm':
        synth = new Tone.FMSynth().connect(volume);
        break;
      case 'synth':
      default:
        synth = new Tone.Synth().connect(volume);
        break;
    }
    
    // Store synth in ref
    synthRef.current = synth;
    
    // Log successful creation
    console.log('Synth created successfully');
    
  }, [instrumentType, effects.volume, isReady]);
  
  // Play a note
  const playNote = useCallback((index: number, time: number = Tone.now()) => {
    // Safety check
    if (!synthRef.current || !isReady || index < 0 || index >= notes.length) {
      return;
    }
    
    try {
      // Get note and duration
      const note = notes[index];
      const duration = DEFAULT_NOTE_DURATIONS[index] || 0.5;
      
      console.log(`Playing note ${note} at index ${index}`);
      
      // Play with appropriate method based on instrument type
      if (instrumentType === 'metal') {
        synthRef.current.triggerAttackRelease(duration, time);
      } else if (instrumentType === 'membrane') {
        const freq = Tone.Frequency(note).toFrequency();
        synthRef.current.triggerAttackRelease(freq, duration, time);
      } else {
        synthRef.current.triggerAttackRelease(note, duration, time);
      }
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, [notes, instrumentType, isReady]);
  
  // Start audio playback
  const startAudio = useCallback(async (callback: (time: number) => void) => {
    if (!isReady) {
      try {
        // Try to resume again
        await Tone.start();
        await Tone.context.resume();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to start audio:', error);
        return null;
      }
    }
    
    try {      
      // Set BPM
      Tone.Transport.bpm.value = tempo;
      
      // Schedule the callback
      const id = Tone.Transport.scheduleRepeat((time) => {
        callback(time);
      }, '16n');
      
      // Start transport
      Tone.Transport.start();
      
      console.log('Audio started successfully');
      return id;
    } catch (error) {
      console.error('Error starting audio:', error);
      return null;
    }
  }, [tempo, isReady]);
  
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
