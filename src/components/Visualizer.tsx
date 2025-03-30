import React, { useRef, useEffect } from 'react';
import './Visualizer.css';

interface VisualizerProps {
  isPlaying: boolean;
  binary: string;
}

// Color schemes - vibrant gradient based on position
const colorSchemes = [
  (index: number) => `hsla(${index * (360 / 10)}, 100%, 70%, 1)`, // Rainbow
  (index: number) => `hsla(${200 + index * 10}, 100%, 65%, 1)`,    // Blues
  (index: number) => `hsla(${320 + index * 5}, 90%, 65%, 1)`,      // Purples
  (index: number) => `hsla(${25 + index * 5}, 100%, 60%, 1)`,      // Oranges
  (index: number) => `hsla(${120 + index * 5}, 90%, 60%, 1)`,      // Greens
];

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, binary }) => {
  // Store previous binary value to detect changes
  const prevBinaryRef = useRef<string>(binary);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
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
    
    // Animation variables
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speed: number;
      opacity: number;
      index: number;
    }> = [];
    
    // Create initial particles based on binary state
    const createParticles = () => {
      particles.length = 0;
      
      // Select color scheme based on binary value
      const binaryValue = parseInt(binary, 2);
      const colorSchemeIndex = binaryValue % colorSchemes.length;
      const getColor = colorSchemes[colorSchemeIndex];
      
      binary.split('').forEach((bit, index) => {
        if (bit === '1') {          
          particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            size: Math.random() * 4 + 3,
            color: getColor(index),
            speed: Math.random() * 2 + 0.5,
            opacity: 1,
            index
          });
        }
      });
    };
    
    // Animation loop
    const animate = () => {
      if (!isPlaying) {
        // Fade out particles when not playing
        ctx.fillStyle = 'rgba(20, 20, 35, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw existing particles with fade out
        particles.forEach((particle) => {
          particle.opacity -= 0.01;
          if (particle.opacity > 0) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particle.color.replace('1)', `${particle.opacity})`);
            ctx.fill();
          }
        });
        
        // Remove faded particles
        for (let i = particles.length - 1; i >= 0; i--) {
          if (particles[i].opacity <= 0) {
            particles.splice(i, 1);
          }
        }
        
        if (particles.length > 0) {
          animationRef.current = requestAnimationFrame(animate);
        }
        return;
      }
      
      // Check if binary changed and create particles accordingly
      const prevBinary = prevBinaryRef.current;
      if (binary !== prevBinary) {
        // Create explosion effect on binary change
        const binaryInt = parseInt(binary, 2);
        
        // For each changed bit, create an explosion
        binary.split('').forEach((bit, index) => {
          const prevBit = prevBinary[index] || '0';
          if (bit !== prevBit) {
            // Create explosion at this position
            const explosionCount = 20; // Number of particles in explosion
            const colorSchemeIndex = binaryInt % colorSchemes.length;
            const getColor = colorSchemes[colorSchemeIndex];
            
            for (let i = 0; i < explosionCount; i++) {
              const angle = (i / explosionCount) * Math.PI * 2;
              
              // Calculate initial position with slight offset from center
              // This creates an immediate small explosion effect
              const startDistance = 10; // Small initial distance from center
              const x = canvas.width / 2 + Math.cos(angle) * startDistance;
              const y = canvas.height / 2 + Math.sin(angle) * startDistance;
              
              // Initial velocity in all directions
              const speed = Math.random() * 3 + 1.5; // Faster than regular particles
              
              particles.push({
                x: x,
                y: y,
                size: Math.random() * 5 + 2,
                color: getColor(index),
                speed: speed,
                opacity: 1,
                index: index * 100 + i // Store both bit index and position in circle
              });
            }
          }
        });
        
        // Update reference
        prevBinaryRef.current = binary;
      }
      
      // Always create some background particles when playing
      createParticles();
      
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(20, 20, 35, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        // Calculate direction based on index with some variation
        const particleAngleIndex = particle.index % 100; // Get original position in circle
        const baseIndex = Math.floor(particle.index / 100); // Get original bit index
        
        // Different movement patterns based on particle type
        let moveAngle;
        
        // Get time variation for animation effects
        const timeVariation = Date.now() * 0.0001; // Subtle time-based variation
        
        if (particleAngleIndex < 20) { 
          // Explosion particles - maintain outward direction with slight wobble
          moveAngle = (particleAngleIndex / 20) * Math.PI * 2 + Math.sin(timeVariation) * 0.1;
        } else {
          // Regular particles - use original behavior
          const baseAngle = (baseIndex / 10) * Math.PI * 2;
          moveAngle = baseAngle + Math.sin(timeVariation) * 0.2;
        }
        
        // Move particle with some oscillation
        const speedVariation = Math.sin(timeVariation * 2 + particle.index) * 0.3 + 1;
        particle.x += Math.cos(moveAngle) * particle.speed * speedVariation;
        particle.y += Math.sin(moveAngle) * particle.speed * speedVariation;
        
        // Reduce size and opacity over time
        particle.size *= 0.995;
        particle.opacity -= 0.005;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace('1)', `${particle.opacity})`);
        ctx.fill();
        
        // Remove small or transparent particles
        if (particle.size < 0.5 || particle.opacity <= 0) {
          particles.splice(i, 1);
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
  }, [isPlaying, binary]);
  
  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
};

export default Visualizer;
