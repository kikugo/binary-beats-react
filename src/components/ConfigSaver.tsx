import React, { useState, useEffect } from 'react';
import { InstrumentType } from './InstrumentSelector';
import { AudioEffectsConfig } from './AudioEffectsPanel';
import { BinaryBeatsConfig, getSavedConfigs, saveConfig, deleteConfig } from '../utils/configStorage';
import './ConfigSaver.css';

interface ConfigSaverProps {
  notes: string[];
  instrumentType: InstrumentType;
  tempo: number;
  effects: AudioEffectsConfig;
  onLoadConfig: (config: BinaryBeatsConfig) => void;
}

const ConfigSaver: React.FC<ConfigSaverProps> = ({ 
  notes, 
  instrumentType, 
  tempo, 
  effects,
  onLoadConfig 
}) => {
  const [configName, setConfigName] = useState('');
  const [savedConfigs, setSavedConfigs] = useState<BinaryBeatsConfig[]>([]);
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load saved configs on component mount
  useEffect(() => {
    setSavedConfigs(getSavedConfigs());
  }, []);

  const handleSaveConfig = () => {
    if (!configName.trim()) {
      setSaveMessage('Please enter a configuration name');
      return;
    }

    try {
      const newConfig = saveConfig({
        name: configName,
        notes,
        instrumentType,
        tempo,
        effects
      });

      setSavedConfigs(getSavedConfigs());
      setConfigName('');
      setSaveMessage(`Configuration "${newConfig.name}" saved successfully!`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      setSaveMessage('Failed to save configuration');
    }
  };

  const handleDeleteConfig = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (deleteConfig(name)) {
      setSavedConfigs(getSavedConfigs());
      setSaveMessage(`Configuration "${name}" deleted`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    }
  };

  return (
    <div className="config-saver">
      <h3>Save/Load Configuration</h3>
      
      <div className="save-config-form">
        <input
          type="text"
          placeholder="Enter configuration name"
          value={configName}
          onChange={(e) => setConfigName(e.target.value)}
          className="config-name-input"
        />
        <button 
          onClick={handleSaveConfig}
          className="save-config-button"
        >
          Save Current Settings
        </button>
      </div>
      
      {saveMessage && (
        <div className="save-message">{saveMessage}</div>
      )}
      
      <div className="saved-configs-section">
        <button 
          className="toggle-configs-button"
          onClick={() => setShowSavedConfigs(!showSavedConfigs)}
        >
          {showSavedConfigs ? 'Hide Saved Configurations' : 'Show Saved Configurations'}
        </button>
        
        {showSavedConfigs && (
          <div className="saved-configs-list">
            {savedConfigs.length === 0 ? (
              <p className="no-configs-message">No saved configurations yet</p>
            ) : (
              savedConfigs.map((config) => (
                <div 
                  key={config.name} 
                  className="saved-config-item"
                  onClick={() => onLoadConfig(config)}
                >
                  <div className="config-info">
                    <span className="config-name">{config.name}</span>
                    <span className="config-date">
                      {new Date(config.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="delete-config-button"
                    onClick={(e) => handleDeleteConfig(config.name, e)}
                    title="Delete configuration"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigSaver;
