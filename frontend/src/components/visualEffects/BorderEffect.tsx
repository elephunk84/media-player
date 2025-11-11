/**
 * BorderEffect - Border highlight effect
 *
 * Renders a border around the video that appears at full thickness
 * and then shrinks and fades out.
 */

import { useEffect, useState } from 'react';
import './BorderEffect.css';

/**
 * BorderEffect component props
 */
export interface BorderEffectProps {
  /** Intensity of the border (0-1), affects thickness */
  intensity: number;
  /** Duration of the animation in milliseconds */
  duration: number;
  /** Border configuration */
  config: {
    /** Border color */
    color: string;
    /** Base opacity (0-1) */
    opacity: number;
    /** Base thickness in pixels */
    thickness: number;
  };
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * BorderEffect component
 *
 * Full-screen border that shrinks and fades on beat.
 * Uses box-sizing: border-box to prevent layout shifts.
 *
 * @example
 * ```tsx
 * <BorderEffect
 *   intensity={0.8}
 *   duration={400}
 *   config={{
 *     color: '#00ff00',
 *     opacity: 0.8,
 *     thickness: 10
 *   }}
 * />
 * ```
 */
export function BorderEffect({ intensity, duration, config, onComplete }: BorderEffectProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Start active (full thickness)
    setActive(true);

    // Trigger fade-out
    const activateTimer = setTimeout(() => {
      setActive(false);
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

  // Calculate final thickness based on intensity
  const finalThickness = config.thickness * (1 + intensity);

  // Calculate final opacity
  const finalOpacity = config.opacity * intensity;

  return (
    <div
      className={`border-effect ${active ? 'border-effect--active' : ''}`}
      style={
        {
          '--border-color': config.color,
          '--border-opacity': finalOpacity,
          '--border-thickness': `${finalThickness}px`,
          '--border-duration': `${duration}ms`,
        } as React.CSSProperties
      }
    />
  );
}
