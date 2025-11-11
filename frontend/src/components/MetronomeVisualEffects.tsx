/**
 * VisualEffectRenderer - Factory component for visual effects
 *
 * Renders the appropriate visual effect component based on configuration.
 * Uses discriminated union pattern for type-safe rendering.
 */

import React from 'react';
import { FlashEffect } from './visualEffects/FlashEffect';
import { PulseEffect } from './visualEffects/PulseEffect';
import { BorderEffect } from './visualEffects/BorderEffect';
import type { BeatEffect, VisualConfig } from '../types/metronome';

/**
 * VisualEffectRenderer component props
 */
export interface VisualEffectRendererProps {
  /** Current beat effect to render, or null */
  effect: BeatEffect | null;
  /** Visual configuration */
  config: VisualConfig;
}

/**
 * VisualEffectRenderer component
 *
 * Factory component that selects and renders the appropriate visual effect
 * based on the visual configuration. Uses TypeScript discriminated unions
 * for type-safe rendering.
 *
 * @example
 * ```tsx
 * <VisualEffectRenderer
 *   effect={{
 *     intensity: 0.8,
 *     timestamp: 123.45,
 *     duration: 300
 *   }}
 *   config={{
 *     enabled: true,
 *     visualStyle: 'flash',
 *     color: '#ffffff',
 *     opacity: 0.5
 *   }}
 * />
 * ```
 */
export function VisualEffectRenderer({ effect, config }: VisualEffectRendererProps) {
  // Don't render if no effect or style is 'none'
  if (!effect || config.visualStyle === 'none') {
    return null;
  }

  // Render based on visual style (discriminated union)
  switch (config.visualStyle) {
    case 'flash': {
      // Flash effect - full-screen flash
      if (!config.enabled) {
        return null;
      }

      return (
        <FlashEffect
          intensity={effect.intensity}
          duration={effect.duration}
          config={{
            color: config.color,
            opacity: config.opacity,
          }}
        />
      );
    }

    case 'pulse': {
      // Pulse effect - expanding shape
      if (!config.enabled) {
        return null;
      }

      return (
        <PulseEffect
          intensity={effect.intensity}
          duration={effect.duration}
          config={{
            color: config.color,
            opacity: config.opacity,
            size: config.size,
            position: config.position,
            shape: config.shape,
          }}
        />
      );
    }

    case 'border': {
      // Border effect - shrinking border
      if (!config.enabled) {
        return null;
      }

      return (
        <BorderEffect
          intensity={effect.intensity}
          duration={effect.duration}
          config={{
            color: config.color,
            opacity: config.opacity,
            thickness: config.thickness,
          }}
        />
      );
    }

    default: {
      // TypeScript exhaustiveness check
      // This ensures we handle all cases in the discriminated union
      const _exhaustive: never = config;
      return null;
    }
  }
}
