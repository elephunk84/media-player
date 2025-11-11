/**
 * MetronomeControls - Basic metronome control interface
 *
 * Provides toggle button, BPM slider, and settings access.
 */

import './MetronomeControls.css';

/**
 * MetronomeControls component props
 */
export interface MetronomeControlsProps {
  /** Whether metronome is enabled */
  enabled: boolean;
  /** Current BPM */
  bpm: number;
  /** Whether metronome is running */
  isRunning: boolean;
  /** Toggle metronome on/off */
  onToggle: () => void;
  /** Handle BPM change */
  onBPMChange: (bpm: number) => void;
  /** Open settings panel */
  onOpenSettings: () => void;
}

/**
 * MetronomeControls component
 *
 * Basic control interface with toggle, BPM adjustment, and settings button.
 *
 * @example
 * ```tsx
 * <MetronomeControls
 *   enabled={true}
 *   bpm={120}
 *   isRunning={true}
 *   onToggle={() => console.log('Toggle')}
 *   onBPMChange={(bpm) => console.log('BPM:', bpm)}
 *   onOpenSettings={() => console.log('Settings')}
 * />
 * ```
 */
export function MetronomeControls({
  enabled,
  bpm,
  isRunning,
  onToggle,
  onBPMChange,
  onOpenSettings,
}: MetronomeControlsProps) {
  return (
    <div className="metronome-controls">
      {/* Toggle Button */}
      <button
        className={`metronome-controls__toggle ${enabled ? 'metronome-controls__toggle--active' : ''}`}
        onClick={onToggle}
        aria-label={enabled ? 'Disable metronome' : 'Enable metronome'}
        aria-pressed={enabled}
        title={enabled ? 'Disable metronome' : 'Enable metronome'}
      >
        <svg className="metronome-icon" viewBox="0 0 24 24" width="24" height="24">
          <path
            d="M12 2 L12 22 M8 10 L12 2 L16 10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isRunning && <span className="metronome-controls__pulse-indicator" />}
      </button>

      {/* BPM Slider (shown when enabled) */}
      {enabled && (
        <div className="metronome-controls__bpm">
          <label htmlFor="metronome-bpm-slider" className="metronome-controls__bpm-label">
            BPM
          </label>
          <input
            id="metronome-bpm-slider"
            type="range"
            min="30"
            max="300"
            step="1"
            value={bpm}
            onChange={(e) => onBPMChange(Number(e.target.value))}
            className="metronome-controls__bpm-slider"
            aria-label="Beats per minute"
            aria-valuemin={30}
            aria-valuemax={300}
            aria-valuenow={bpm}
          />
          <span className="metronome-controls__bpm-value">{bpm}</span>
        </div>
      )}

      {/* Settings Button */}
      {enabled && (
        <button
          className="metronome-controls__settings"
          onClick={onOpenSettings}
          aria-label="Open metronome settings"
          title="Metronome settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24" />
          </svg>
        </button>
      )}
    </div>
  );
}
