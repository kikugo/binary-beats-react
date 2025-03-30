import React, { useRef, useEffect, useState } from 'react';
import './Visualizer.css';

interface VisualizerProps {
  isPlaying: boolean;
  binary: string;
}

// Visual modes
enum VisualMode {
  BARS = 'bars',
  WAVE = 'wave',
}

// Color schemes
const colorSchemes = {
  red: ['#FF3333', '#FF6666', '#FF9999', '#FFCCCC'],
  blue: ['#3333FF', '#6666FF', '#9999FF', '#CCCCFF'],
  green: ['#33FF33', '#66FF66', '#99FF99', '#CCFFCC'],
  purple: ['#9933FF', '#BB66FF', '#CC99FF', '#DDCCFF'],
  orange: ['#FF9933', '#FFBB66', '#FFCC99', '#FFEECC'],
};

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, binary }) => {
  // State for visualization mode
  const [visualMode, setVisualMode] = useState<VisualMode>(VisualMode.BARS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Store the previous binary for animation transitions
  const prevBinaryRef = useRef<string>(binary);
  
  // Toggle visualization mode
  const toggleVisualMode = () => {
    setVisualMode(prevMode => 
      prevMode === VisualMode.BARS ? VisualMode.WAVE : VisualMode.BARS
    );
  };

  // Initialize and manage the canvas-based visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Handle window resize
    const handleResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    // Performance optimization: pre-calculate bar positioning
    const barCount = 10; // For 10-bit binary number
    const barWidth = canvas.width / (barCount * 1.5);
    const barSpacing = canvas.width / barCount - barWidth;
    const barMaxHeight = canvas.height * 0.8;
    
    // Get color scheme based on binary value
    const getColorScheme = () => {
      const binaryValue = parseInt(binary, 2) || 0;
      const schemes = Object.values(colorSchemes);
      return schemes[binaryValue % schemes.length];
    };
    
    // Animation helpers
    const barHeights = new Array(barCount).fill(0);
    const targetHeights = new Array(barCount).fill(0);
    const wavePoints: Array<{x: number, y: number}> = [];
    
    // Update target heights based on binary
    const updateTargetHeights = () => {
      binary.split('').forEach((bit, index) => {
        // Set target height based on bit value (0 or 1)
        targetHeights[index] = bit === '1' ? Math.random() * 0.4 + 0.6 : Math.random() * 0.2; // Normalized height
      });
    };
    
    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(10, 10, 20, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // If not playing, gradually reduce heights
      if (!isPlaying) {
        barHeights.forEach((height, i) => {
          if (height > 0) {
            barHeights[i] *= 0.95; // Gradually reduce height
          }
        });
      } else {
        // Update target heights if playing
        updateTargetHeights();

        // Check for binary value change
        if (binary !== prevBinaryRef.current) {
          // Flash effect when binary changes
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          prevBinaryRef.current = binary;
        }
      }

      // Animate bar heights towards target values
      for (let i = 0; i < barCount; i++) {
        barHeights[i] += (targetHeights[i] * barMaxHeight - barHeights[i]) * 0.1;
      }

      // Get colors based on current binary value
      const colors = getColorScheme();

      // Render based on visualization mode
      if (visualMode === VisualMode.BARS) {
        // Frequency Bar Visualization
        binary.split('').forEach((bit, i) => {
          const height = barHeights[i];
          const x = i * (barWidth + barSpacing) + barSpacing;
          const y = canvas.height - height;

          // Color based on bit value
          const colorIndex = bit === '1' ? 0 : 3; // Brighter color for 1s
          
          // Draw bar with gradient
          const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
          gradient.addColorStop(0, colors[colorIndex]);
          gradient.addColorStop(1, colors[colorIndex + 1 > 3 ? 3 : colorIndex + 1]);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, height);

          // Add shine effect
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(x, y, barWidth * 0.5, height);
          
          // Add value indicator
          const circleRadius = barWidth * 0.3;
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, y, circleRadius, 0, Math.PI * 2);
          ctx.fillStyle = bit === '1' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
          ctx.fill();
        });
      } else {
        // Wave Visualization
        const centerY = canvas.height / 2;
        const amplitude = canvas.height * 0.3;
        
        // Clear previous points
        wavePoints.length = 0;
        
        // Generate wave points
        for (let x = 0; x < canvas.width; x++) {
          const t = Date.now() * 0.001;
          const binaryValue = parseInt(binary, 2) || 1;
          const waveFreq = binaryValue / 100 + 0.05;
          
          // Composite wave from binary bits
          let y = centerY;
          binary.split('').forEach((bit, i) => {
            if (bit === '1') {
              const bitFreq = (i + 1) * waveFreq;
              y += Math.sin((x * bitFreq / 100) + t * (i + 1)) * amplitude * (barHeights[i] / barMaxHeight);
            }
          });
          
          wavePoints.push({x, y});
        }
        
        // Draw the wave
        if (wavePoints.length > 1) {
          ctx.beginPath();
          ctx.moveTo(wavePoints[0].x, wavePoints[0].y);
          
          for (let i = 1; i < wavePoints.length; i++) {
            ctx.lineTo(wavePoints[i].x, wavePoints[i].y);
          }
          
          ctx.strokeStyle = colors[0];
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Draw glow effect
          ctx.strokeStyle = colors[1];
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, binary, visualMode]);
  
  return (
    <div className="visualizer-container">
      <canvas 
        ref={canvasRef} 
        className="visualizer-canvas" 
        onClick={toggleVisualMode}
        title="Click to change visualization mode"
      />
      <div className="visualizer-mode-indicator">
        {visualMode === VisualMode.BARS ? 'BAR MODE' : 'WAVE MODE'}
      </div>
    </div>
  );
};

export default Visualizer;
