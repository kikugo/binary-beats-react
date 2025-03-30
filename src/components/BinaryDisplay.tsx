import React from 'react';
import './BinaryDisplay.css';

interface BinaryDisplayProps {
  binary: string;
}

/**
 * Component that displays the current binary number
 */
const BinaryDisplay: React.FC<BinaryDisplayProps> = ({ binary }) => {
  // Split binary string into array for better styling
  const binaryDigits = binary.split('');
  
  return (
    <div className="binary-display">
      <div className="binary-counter">
        {binaryDigits.map((digit, index) => (
          <span 
            key={index} 
            className={`binary-digit ${digit === '1' ? 'active' : ''}`}
          >
            {digit}
          </span>
        ))}
      </div>
      <div className="decimal-display">
        = {parseInt(binary, 2)}
      </div>
    </div>
  );
};

export default BinaryDisplay;
