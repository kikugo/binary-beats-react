import { InstrumentType } from "../components/InstrumentSelector";

export interface BinaryBeatsConfig {
  name: string;
  notes: string[];
  instrumentType: InstrumentType;
  tempo: number;
  createdAt: number; // timestamp
}

const CONFIG_STORAGE_KEY = 'binary-beats-configs';

// Get all saved configurations
export const getSavedConfigs = (): BinaryBeatsConfig[] => {
  try {
    const storedConfigs = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!storedConfigs) {
      return [];
    }
    return JSON.parse(storedConfigs);
  } catch (error) {
    console.error('Error loading saved configurations:', error);
    return [];
  }
};

// Save a new configuration
export const saveConfig = (config: Omit<BinaryBeatsConfig, 'createdAt'>): BinaryBeatsConfig => {
  try {
    const configs = getSavedConfigs();
    
    // Create new config with timestamp
    const newConfig: BinaryBeatsConfig = {
      ...config,
      createdAt: Date.now()
    };
    
    // Check if a config with this name already exists
    const existingConfigIndex = configs.findIndex(
      c => c.name.toLowerCase() === config.name.toLowerCase()
    );
    
    if (existingConfigIndex >= 0) {
      // Update existing config
      configs[existingConfigIndex] = newConfig;
    } else {
      // Add new config
      configs.push(newConfig);
    }
    
    // Save to localStorage
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
    
    return newConfig;
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw new Error('Failed to save configuration');
  }
};

// Delete a configuration
export const deleteConfig = (configName: string): boolean => {
  try {
    const configs = getSavedConfigs();
    const filteredConfigs = configs.filter(
      config => config.name.toLowerCase() !== configName.toLowerCase()
    );
    
    if (filteredConfigs.length === configs.length) {
      // No config was removed
      return false;
    }
    
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(filteredConfigs));
    return true;
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return false;
  }
};
