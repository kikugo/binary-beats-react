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
    volume: Tone.Volume | null;
    reverb: Tone.Reverb | null;
    delay: Tone.FeedbackDelay | null;
    filter: Tone.Filter | null;
  }>({ volume: null, reverb: null, delay: null, filter: null });
  
  // Re-initialize when instrument type changes
  useEffect(() => {
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
      
      // Create audio effects chain
      const volumeNode = new Tone.Volume(effects.volume * 20 - 10); // Convert 0-1 to -10 to +10 dB
      const reverbNode = new Tone.Reverb({
        decay: 1 + effects.reverb * 4, // 1-5 seconds
        wet: effects.reverb
      });
      
      const delayNode = new Tone.FeedbackDelay({
        delayTime: 0.25,
        feedback: effects.delay * 0.6, // 0-0.6 to avoid runaway feedback
        wet: effects.delay
      });
      
      const filterFreq = effects.filter * 10000 + 200; // 200Hz to 10.2kHz
      const filterNode = new Tone.Filter(filterFreq, "lowpass");
      
      // Store references to effect nodes
      effectsRef.current = {
        volume: volumeNode,
        reverb: reverbNode,
        delay: delayNode,
        filter: filterNode
      };
      
      // Connect the audio chain
      synth.chain(
        filterNode,
        delayNode,
        reverbNode,
        volumeNode,
        Tone.Destination
      );
      
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
      const { volume, reverb, delay, filter } = effectsRef.current;
      
      if (volume) {
        volume.volume.value = effects.volume * 20 - 10; // Convert 0-1 to -10 to +10 dB
      }
      
      if (reverb) {
        // The decay time needs to be updated differently - we need to recreate the reverb
        // with the new decay time as it can't be changed dynamically
        const currentDecay = typeof reverb.decay === 'number' ? reverb.decay : 3;
        if (Math.abs(currentDecay - (1 + effects.reverb * 4)) > 0.1) {
          // Dispose the old reverb and create a new one
          const oldReverb = reverb;
          const newReverb = new Tone.Reverb({
            decay: 1 + effects.reverb * 4,
            wet: effects.reverb
          });
          
          // Replace in the chain
          oldReverb.disconnect();
          newReverb.connect(effectsRef.current.volume!);
          effectsRef.current.delay?.disconnect();
          effectsRef.current.delay?.connect(newReverb);
          
          // Store the new reverb
          effectsRef.current.reverb = newReverb;
          oldReverb.dispose();
        } else {
          // Just update the wet value
          reverb.wet.value = effects.reverb;
        }
      }
      
      if (delay) {
        delay.feedback.value = effects.delay * 0.6; // 0-0.6 to avoid runaway feedback
        delay.wet.value = effects.delay;
      }
      
      if (filter) {
        filter.frequency.value = effects.filter * 10000 + 200; // 200Hz to 10.2kHz
      }
    }
  }, [effects, isInitialized]);
  
  return {
    playNote,
    startAudio,
    stopAudio,
    isInitialized
  };
};
