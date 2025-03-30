import React from 'react';
import './TempoControl.css';

interface TempoControlProps {
  tempo: number;
  onChange: (tempo: number) => void;
}

const TempoControl: React.FC<TempoControlProps> = ({ tempo, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value, 10);
    onChange(newTempo);
  };

  return (
    <div className="tempo-control">
      <h3>Tempo (BPM)</h3>
      <div className="tempo-slider-container">
        <span>Slow</span>
        <input
          type="range"
          min="30"
          max="120"
          value={tempo}
          onChange={handleChange}
          className="tempo-slider"
        />
        <span>Fast</span>
      </div>
      <div className="tempo-value">{tempo} BPM</div>
    </div>
  );
};

export default TempoControl;
