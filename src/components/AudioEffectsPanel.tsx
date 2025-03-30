import React from 'react';
import './AudioEffectsPanel.css';

export interface AudioEffectsConfig {
  reverb: number;       // 0 to 1 - amount of reverb
  delay: number;        // 0 to 1 - amount of delay
  filter: number;       // 0 to 1 - cutoff frequency (normalized)
  volume: number;       // 0 to 1 - master volume
}

interface AudioEffectsPanelProps {
  effects: AudioEffectsConfig;
  onChange: (effects: AudioEffectsConfig) => void;
}

const AudioEffectsPanel: React.FC<AudioEffectsPanelProps> = ({ effects, onChange }) => {
  // Handle slider change
  const handleEffectChange = (effect: keyof AudioEffectsConfig, value: number) => {
    onChange({
      ...effects,
      [effect]: value
    });
  };

  return (
    <div className="audio-effects-panel">
      <h3>Audio Effects</h3>
      
      <div className="effect-control">
        <label htmlFor="volume">Volume</label>
        <input
          id="volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effects.volume}
          onChange={(e) => handleEffectChange('volume', parseFloat(e.target.value))}
        />
        <span className="effect-value">{Math.round(effects.volume * 100)}%</span>
      </div>
      
      <div className="effect-control">
        <label htmlFor="reverb">Reverb</label>
        <input
          id="reverb"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effects.reverb}
          onChange={(e) => handleEffectChange('reverb', parseFloat(e.target.value))}
        />
        <span className="effect-value">{Math.round(effects.reverb * 100)}%</span>
      </div>
      
      <div className="effect-control">
        <label htmlFor="delay">Delay</label>
        <input
          id="delay"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effects.delay}
          onChange={(e) => handleEffectChange('delay', parseFloat(e.target.value))}
        />
        <span className="effect-value">{Math.round(effects.delay * 100)}%</span>
      </div>
      
      <div className="effect-control">
        <label htmlFor="filter">Filter</label>
        <input
          id="filter"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effects.filter}
          onChange={(e) => handleEffectChange('filter', parseFloat(e.target.value))}
        />
        <span className="effect-value">{Math.round(effects.filter * 100)}%</span>
      </div>
    </div>
  );
};

export default AudioEffectsPanel;
