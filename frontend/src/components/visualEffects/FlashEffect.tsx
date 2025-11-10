/**
 * FlashEffect - Full-screen flash visual effect
 *
 * Renders a full-screen overlay that flashes on beats.
 * Appears instantly at full opacity and fades out smoothly.
 */

import React, { useEffect, useState } from 'react';
import './FlashEffect.css';

/**
 * FlashEffect component props
 */
export interface FlashEffectProps {
  /** Intensity of the flash (0-1), affects final opacity */
  intensity: number;
  /** Duration of the fade-out animation in milliseconds */
  duration: number;
  /** Flash configuration */
  config: {
    /** Flash color (hex, rgb, or CSS color name) */
    color: string;
    /** Base opacity (0-1) */
    opacity: number;
  };
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * FlashEffect component
 *
 * Full-screen flash overlay with configurable color and opacity.
 * Uses CSS transitions for smooth fade-out animation.
 *
 * @example
 * ```tsx
 * <FlashEffect
 *   intensity={0.8}
 *   duration={300}
 *   config={{ color: '#ffffff', opacity: 0.5 }}
 *   onComplete={() => console.log('Flash complete')}
 * />
 * ```
 */
export function FlashEffect({ intensity, duration, config, onComplete }: FlashEffectProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Start active (full opacity)
    setActive(true);

    // Trigger fade-out after a tiny delay to ensure CSS transition works
    const activateTimer = setTimeout(() => {
      setActive(false);
    }, 10);

    // Call onComplete after full duration
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(activateTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  // Calculate final opacity based on base opacity and intensity
  const finalOpacity = config.opacity * intensity;

  return (
    <div
      className={`flash-effect ${active ? 'flash-effect--active' : ''}`}
      style={{
        ['--flash-color' as any]: config.color,
        ['--flash-opacity' as any]: finalOpacity,
        ['--flash-duration' as any]: `${duration}ms`,
      }}
    />
  );
}
