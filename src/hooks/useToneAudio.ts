import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { InstrumentType } from '../components/InstrumentSelector';
import { AudioEffectsConfig } from '../components/AudioEffectsPanel';

// Declare any type for Tone.js nodes to avoid TypeScript errors
type ToneNode = any;

// Default note durations corresponding to binary positions
const DEFAULT_NOTE_DURATIONS = [1.7, 1.5, 1.3, 1.2, 0.9, 0.7, 0.6, 0.5, 0.5, 0.4];

interface UseToneAudioProps {
  notes: string[];
  instrumentType: InstrumentType;
  tempo?: number;
  effects?: AudioEffectsConfig;
}

type ToneInstrument = Tone.Synth | Tone.AMSynth | Tone.FMSynth | Tone.MembraneSynth | Tone.MetalSynth;

// Default effects configuration
const DEFAULT_EFFECTS: AudioEffectsConfig = {
  reverb: 0,
  delay: 0,
  filter: 1,
  volume: 0.8
};

/**
 * Custom hook for managing Tone.js audio functionality
 */
export const useToneAudio = ({ 
  notes, 
  instrumentType, 
  tempo = 50,
  effects = DEFAULT_EFFECTS 
}: UseToneAudioProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const synthRef = useRef<ToneInstrument | null>(null);
  
  // Audio effects nodes
  const effectsRef = useRef<{
    volume: ToneNode;
    reverb: ToneNode;
    delay: ToneNode;
    filter: ToneNode;
  }>({ volume: null, reverb: null, delay: null, filter: null });
  
  // Re-initialize when instrument type changes
  useEffect(() => {
    // Resume audio context if suspended before initializing
    const resumeAudioContext = async () => {
      if (Tone.context.state !== 'running') {
        try {
          await Tone.context.resume();
          console.log('Audio context resumed successfully');
        } catch (error) {
          console.error('Failed to resume audio context:', error);
        }
      }
    };
    
    // Ensure audio context is running
    resumeAudioContext();
    
    // Set up listeners for user interaction to resume audio context
    const handleInteraction = () => resumeAudioContext();
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    if (isInitialized) {
      // Dispose of previous synth to free memory
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      
      // Dispose of effects
      Object.values(effectsRef.current).forEach(effect => {
        if (effect) effect.dispose();
      });
      effectsRef.current = { volume: null, reverb: null, delay: null, filter: null };
      
      setIsInitialized(false);
    }
    
    return () => {
      // Remove event listeners
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
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
      
          // Create simpler audio chain to avoid performance issues
      // Start with a basic volume control only
      const volumeNode = new Tone.Volume(effects.volume * 20 - 10); // Convert 0-1 to -10 to +10 dB
      
      // Create a simplified audio chain - this is a complete rewrite of the effects system
      // to favor stability and performance over complex routing
      // Only use volume control by default
      const nodes: ToneNode[] = [];
      
      // Add volume node (always present)
      nodes.push(volumeNode);
      
      // Track all created nodes for cleanup
      let reverbNode = null;
      let delayNode = null;
      let filterNode = null;

      // SIMPLIFIED APPROACH: Create a basic chain
      // Instead of complex routing, use minimal effects to ensure audio stability
      
      // Add filter - simple lowpass filter with moderate settings
      if (effects.filter < 0.95) {
        const filterFreq = effects.filter * 10000 + 200; // 200Hz to 10.2kHz
        filterNode = new Tone.Filter({
          frequency: filterFreq,
          type: "lowpass",
          Q: 1
        });
        nodes.push(filterNode);
      }
      
      // Add delay only if significantly engaged (avoiding subtle delay that might cause issues)
      if (effects.delay > 0.1) { // Higher threshold for activation
        delayNode = new Tone.FeedbackDelay({
          delayTime: 0.25,
          feedback: Math.min(0.35, effects.delay * 0.4), // Very conservative feedback
          wet: effects.delay * 0.8 // Slightly reduced wet level
        });
        nodes.push(delayNode);
      }
      
      // Add reverb only if significantly engaged 
      if (effects.reverb > 0.1) { // Higher threshold for activation
        // Use FreeVerb instead of Reverb for performance reasons
        // FreeVerb doesn't need to build impulse responses
        reverbNode = new Tone.Freeverb({
          roomSize: effects.reverb * 0.8,
          dampening: 3000, 
          wet: effects.reverb * 0.7 // Slightly reduced wet level
        });
        nodes.push(reverbNode);
      }
      
      // Store references to effect nodes
      effectsRef.current = {
        volume: volumeNode,
        reverb: reverbNode,
        delay: delayNode,
        filter: filterNode
      };
      
      // SIMPLIFIED CONNECTION APPROACH
      // Disconnect synth from any previous connections
      synth.disconnect();
      
      // Create manual chain connections using the Tone.connect() method
      if (nodes.length > 0) {
        // First connect synth to the first effect
        let previousNode = synth;
        
        // Connect all nodes in sequence
        for (const node of nodes) {
          if (node) {
            previousNode.connect(node);
            previousNode = node;
          }
        }
        
        // Connect the last node to the destination
        previousNode.connect(Tone.getDestination());
      } else {
        // If no effects, connect directly to destination
        synth.connect(Tone.getDestination());
      }
      
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
  
  // Update audio effects when they change
  useEffect(() => {
    // Apply effect changes to existing nodes if initialized
    if (isInitialized && effectsRef.current) {
      // Instead of updating individual properties, we'll recreate the entire chain
      // This is more reliable and prevents audio glitches
      
      // First dispose of all existing effects
      Object.values(effectsRef.current).forEach(effect => {
        if (effect) {
          try {
            effect.disconnect();
          } catch (e) {
            // Ignore disconnection errors
          }
        }
      });
      
      // Then reinitialize the synth to rebuild the audio chain
      // This triggers a clean rebuild of the entire audio graph
      setIsInitialized(false);
      
      // Schedule reinit for the next frame to avoid audio glitches
      requestAnimationFrame(() => {
        initializeSynth();
      });
    }
  }, [effects, isInitialized, initializeSynth]);
  
  // Instead of a separate hook for audio context, we merged it with the initialization hook above
  // to avoid React hook order errors
  
  return {
    playNote,
    startAudio,
    stopAudio,
    isInitialized
  };
};
