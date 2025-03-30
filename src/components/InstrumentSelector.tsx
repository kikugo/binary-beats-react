import React from 'react';
import './InstrumentSelector.css';

export type InstrumentType = 'synth' | 'am' | 'fm' | 'membrane' | 'metal';

interface InstrumentSelectorProps {
  currentInstrument: InstrumentType;
  onChange: (instrument: InstrumentType) => void;
}

const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({ 
  currentInstrument, 
  onChange 
}) => {
  const instruments = [
    { id: 'synth', name: 'Synth', description: 'Basic synthesizer with sine wave' },
    { id: 'am', name: 'AM Synth', description: 'Amplitude modulation synthesizer' },
    { id: 'fm', name: 'FM Synth', description: 'Frequency modulation synthesizer' },
    { id: 'membrane', name: 'Membrane', description: 'Drum-like percussive sounds' },
    { id: 'metal', name: 'Metal', description: 'Metallic, bell-like sounds' }
  ];

  return (
    <div className="instrument-selector">
      <h3>Instrument</h3>
      <div className="instrument-options">
        {instruments.map((instrument) => (
          <button
            key={instrument.id}
            className={`instrument-button ${currentInstrument === instrument.id ? 'selected' : ''}`}
            onClick={() => onChange(instrument.id as InstrumentType)}
            title={instrument.description}
          >
            {instrument.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InstrumentSelector;
