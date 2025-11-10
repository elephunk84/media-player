/**
 * MetronomeOverlay - Main metronome component
 *
 * Orchestrates all metronome functionality including hooks, controls, and visual effects.
 */

import React, { useState } from 'react';
import { useMetronome } from '../hooks/useMetronome';
import { useMetronomeAudio } from '../hooks/useMetronomeAudio';
import { useMetronomeVisuals } from '../hooks/useMetronomeVisuals';
import { useMetronomePresets } from '../hooks/useMetronomePresets';
import { MetronomeControls } from './MetronomeControls';
import { VisualEffectRenderer } from './MetronomeVisualEffects';
import type { UseVideoPlayerReturn } from '../hooks/useVideoPlayer';
import type { MetronomeConfig } from '../types/metronome';
import './MetronomeOverlay.css';

/**
 * MetronomeOverlay component props
 */
export interface MetronomeOverlayProps {
  /** Video player state from useVideoPlayer hook */
  playerState: UseVideoPlayerReturn;
  /** Optional initial configuration */
  initialConfig?: Partial<MetronomeConfig>;
}

/**
 * MetronomeOverlay component
 *
 * Main metronome overlay that integrates all metronome functionality.
 * Renders controls, visual effects, and manages all metronome state.
 *
 * @example
 * ```tsx
 * const player = useVideoPlayer();
 * <MetronomeOverlay playerState={player} />
 * ```
 */
export function MetronomeOverlay({ playerState, initialConfig }: MetronomeOverlayProps) {
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  // Initialize all hooks
  const metronome = useMetronome(playerState);
  const audio = useMetronomeAudio(metronome.engineRef, metronome.config.audio);
  const visuals = useMetronomeVisuals(
    metronome.engineRef,
    metronome.config.visual,
    metronome.config.bpm
  );
  const presets = useMetronomePresets();

  // Apply initial config if provided
  React.useEffect(() => {
    if (initialConfig) {
      metronome.updateConfig(initialConfig);
    }
  }, []);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in input field
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'm' && e.ctrlKey) {
        e.preventDefault();
        metronome.toggle();
      } else if (e.key === 'Escape' && settingsPanelOpen) {
        setSettingsPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [metronome, settingsPanelOpen]);

  return (
    <div className="metronome-overlay">
      {/* Controls */}
      <div className="metronome-overlay__controls">
        <MetronomeControls
          enabled={metronome.enabled}
          bpm={metronome.config.bpm}
          isRunning={metronome.isRunning}
          onToggle={metronome.toggle}
          onBPMChange={(bpm) => metronome.updateConfig({ bpm })}
          onOpenSettings={() => setSettingsPanelOpen(true)}
        />
      </div>

      {/* Settings Panel - Simplified for initial implementation */}
      {settingsPanelOpen && (
        <div className="metronome-overlay__settings-panel">
          <div className="metronome-settings-panel">
            <div className="metronome-settings-panel__header">
              <h3>Metronome Settings</h3>
              <button onClick={() => setSettingsPanelOpen(false)} aria-label="Close settings">
                ×
              </button>
            </div>
            <div className="metronome-settings-panel__content">
              <p style={{ color: '#fff', fontSize: '14px' }}>
                Detailed settings panel coming soon. Use the controls to adjust BPM.
              </p>
              <p style={{ color: '#aaa', fontSize: '12px', marginTop: '8px' }}>
                Current BPM: {metronome.config.bpm}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Effects */}
      {metronome.enabled && (
        <VisualEffectRenderer effect={visuals.activeEffect} config={metronome.config.visual} />
      )}

      {/* Error Messages */}
      {audio.audioError && (
        <div className="metronome-overlay__error">{audio.audioError}</div>
      )}
      {presets.error && <div className="metronome-overlay__error">{presets.error}</div>}
    </div>
  );
}
