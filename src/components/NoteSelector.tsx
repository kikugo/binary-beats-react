import React, { useState } from 'react';
import './NoteSelector.css';

// Available piano notes
const PIANO_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

// Available octaves
const OCTAVES = [1, 2, 3, 4, 5, 6, 7];

interface NoteSelectorProps {
  notes: string[];
  onUpdateNote: (index: number, note: string) => void;
}

/**
 * Component for selecting musical notes for each binary position
 */
const NoteSelector: React.FC<NoteSelectorProps> = ({ notes, onUpdateNote }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Helper function to display selected note information (not used yet, but will be used in future enhancements)

  // Handle click on a note input field
  const handleNoteClick = (index: number) => {
    setSelectedIndex(index);
  };

  // Handle selection of a piano key
  const handleKeySelect = (note: string, octave: number) => {
    if (selectedIndex !== null) {
      const newNote = `${note}${octave}`;
      onUpdateNote(selectedIndex, newNote);
      
      // Move to next input (or back to first if at the end)
      setSelectedIndex((selectedIndex + 1) % notes.length);
    }
  };

  return (
    <div className="note-selector">
      <div className="note-inputs">
        {notes.map((note, index) => (
          <div 
            key={index} 
            className={`note-input ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleNoteClick(index)}
          >
            {note}
          </div>
        ))}
      </div>
      
      <div className="piano-container">
        <div className="octave-selector">
          {OCTAVES.map(octave => (
            <React.Fragment key={octave}>
              <div className="octave-label">Octave {octave}</div>
              <div className="piano-keys">
                {PIANO_KEYS.map(key => {
                  const isSharp = key.includes('#');
                  return (
                    <div 
                      key={`${key}${octave}`}
                      className={`piano-key ${isSharp ? 'sharp' : 'natural'}`}
                      onClick={() => handleKeySelect(key, octave)}
                    >
                      {key}
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoteSelector;
