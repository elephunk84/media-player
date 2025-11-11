/**
 * PulseEffect - Expanding/contracting shape effect
 *
 * Renders a shape that expands from small to large while fading out.
 * Supports multiple shapes (circle, square, diamond, star).
 */

import { useEffect, useState } from 'react';
import './PulseEffect.css';

/**
 * PulseEffect component props
 */
export interface PulseEffectProps {
  /** Intensity of the pulse (0-1), affects size */
  intensity: number;
  /** Duration of the animation in milliseconds */
  duration: number;
  /** Pulse configuration */
  config: {
    /** Pulse color */
    color: string;
    /** Base opacity (0-1) */
    opacity: number;
    /** Base size as percentage of viewport height */
    size: number;
    /** Position configuration */
    position: { x: number; y: number };
    /** Shape of the pulse */
    shape: 'circle' | 'square' | 'diamond' | 'star';
  };
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * PulseEffect component
 *
 * Expanding pulse effect with configurable shape, color, and position.
 * Uses CSS transforms for GPU-accelerated animation.
 *
 * @example
 * ```tsx
 * <PulseEffect
 *   intensity={0.8}
 *   duration={500}
 *   config={{
 *     color: '#ff0000',
 *     opacity: 0.7,
 *     size: 30,
 *     position: { x: 50, y: 50 },
 *     shape: 'circle'
 *   }}
 * />
 * ```
 */
export function PulseEffect({ intensity, duration, config, onComplete }: PulseEffectProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Trigger expansion
    const activateTimer = setTimeout(() => {
      setActive(true);
    }, 10);

    // Call onComplete after animation
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(activateTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  // Calculate final size based on intensity
  const finalSize = config.size * (1 + intensity * 0.5);

  // Calculate final opacity
  const finalOpacity = config.opacity * intensity;

  return (
    <div
      className={`pulse-effect pulse-effect--${config.shape} ${active ? 'pulse-effect--active' : ''}`}
      style={
        {
          '--pulse-color': config.color,
          '--pulse-opacity': finalOpacity,
          '--pulse-size': `${finalSize}vh`,
          '--pulse-duration': `${duration}ms`,
          left: `${config.position.x}%`,
          top: `${config.position.y}%`,
        } as React.CSSProperties
      }
    />
  );
}
