import { useState, useEffect } from 'react';
import BinaryDisplay from './components/BinaryDisplay';
import NoteSelector from './components/NoteSelector';
import PlayerControls from './components/PlayerControls';
import InstrumentSelector, { InstrumentType } from './components/InstrumentSelector';
import TempoControl from './components/TempoControl';
import Visualizer from './components/Visualizer';
import ThemeToggle from './components/ThemeToggle';
import { useToneAudio } from './hooks/useToneAudio';
import './App.css';

// Default note configuration
const DEFAULT_NOTES = ["D4", "E4", "F4", "G4", "A5", "C5", "D5", "E5", "F5", "G5"];

// Default tempo (BPM)
const DEFAULT_TEMPO = 50;

function App() {
  // State management
  const [count, setCount] = useState(0);
  const [binary, setBinary] = useState('0000000000');
  const [notes, setNotes] = useState<string[]>(DEFAULT_NOTES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('synth');
  const [tempo, setTempo] = useState(DEFAULT_TEMPO);
  
  // Custom hook for Tone.js audio handling
  const { playNote, startAudio, stopAudio } = useToneAudio({ 
    notes, 
    instrumentType,
    tempo
  });

  // Update binary representation whenever count changes
  useEffect(() => {
    const binaryString = count.toString(2).padStart(10, '0');
    setBinary(binaryString);
  }, [count]);

  // Initialize from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const keysParam = urlParams.get('keys');
    
    if (keysParam) {
      const keyData = keysParam.replace(/\^/g, "#").split(",");
      if (keyData.length === 10) {
        setNotes(keyData);
      }
    }
  }, []);

  // Update URL when notes change
  useEffect(() => {
    if (history.replaceState) {
      history.replaceState(
        {},
        "",
        `?keys=${notes.join(",")}`.replace(/\#/g, "^")
      );
    }
  }, [notes]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      stopAudio();
      setCount(0);
      setBinary('0000000000');
    } else {
      startAudio((time: number) => {
        setCount(prevCount => {
          const newCount = prevCount + 1 > 1023 ? 0 : prevCount + 1;
          const newBinary = newCount.toString(2).padStart(10, '0');
          
          // Compare with previous binary to trigger notes
          const prevBinary = prevCount.toString(2).padStart(10, '0');
          for (let i = 0; i < newBinary.length; i++) {
            if (newBinary[i] === '1' && prevBinary[i] !== '1') {
              playNote(i, time);
            }
          }
          
          return newCount;
        });
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Update a specific note
  const updateNote = (index: number, note: string) => {
    const newNotes = [...notes];
    newNotes[index] = note;
    setNotes(newNotes);
  };

  return (
    <div className="app-container">
      <ThemeToggle />
      <h1>Binary Beats</h1>
      <p className="description">
        A musical interpretation of binary counting. Each position plays a note when it changes to a 1.
      </p>
      
      <div className="main-container">
        <BinaryDisplay binary={binary} />
        <Visualizer isPlaying={isPlaying} binary={binary} />
        <PlayerControls 
          isPlaying={isPlaying} 
          onPlayPause={handlePlayPause} 
          onCustomize={() => setShowCustomizer(!showCustomizer)}
          showCustomizer={showCustomizer}
        />
        
        {showCustomizer && (
          <div className="customization-panel">
            <InstrumentSelector
              currentInstrument={instrumentType}
              onChange={setInstrumentType}
            />
            <TempoControl
              tempo={tempo}
              onChange={setTempo}
            />
            <NoteSelector 
              notes={notes} 
              onUpdateNote={updateNote}
            />
          </div>
        )}
      </div>
      
      <footer>
        <p>
          Inspired by <a href="http://tholman.com" target="_blank" rel="noopener noreferrer">Tim Holman</a>'s 
          original implementation and <a href="https://www.youtube.com/watch?v=CdaPhpGG6As" target="_blank" rel="noopener noreferrer">1023.exe by Alfred Kedhammar</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
