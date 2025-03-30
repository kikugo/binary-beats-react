import React from 'react';
import './PlayerControls.css';

interface PlayerControlsProps {
  isPlaying: boolean;
  showCustomizer: boolean;
  onPlayPause: () => void;
  onCustomize: () => void;
}

/**
 * Component that handles playback controls and customization toggle
 */
const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  showCustomizer,
  onPlayPause,
  onCustomize
}) => {
  return (
    <div className="player-controls">
      <button 
        className={`play-button ${isPlaying ? 'playing' : ''}`}
        onClick={onPlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <span className="pause-icon">❚❚</span>
        ) : (
          <span className="play-icon">▶</span>
        )}
      </button>
      
      <button 
        className={`customize-button ${showCustomizer ? 'active' : ''}`}
        onClick={onCustomize}
      >
        {showCustomizer ? 'Hide Notes' : 'Customize Notes'}
      </button>
    </div>
  );
};

export default PlayerControls;
