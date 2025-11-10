/**
 * useMetronomePresets Hook
 *
 * Manages preset CRUD operations with localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import type { MetronomeConfig, MetronomePreset } from '../types/metronome';

const STORAGE_KEY = 'metronome_presets';
const MAX_PRESETS = 50;

/**
 * useMetronomePresets hook return type
 */
export interface UseMetronomePresetsReturn {
  /** Array of saved presets */
  presets: MetronomePreset[];
  /** Save a new preset */
  savePreset: (name: string, config: MetronomeConfig, description?: string) => void;
  /** Load a preset by ID */
  loadPreset: (id: string) => MetronomeConfig | null;
  /** Delete a preset by ID */
  deletePreset: (id: string) => void;
  /** Export presets as JSON string */
  exportPresets: () => string;
  /** Import presets from JSON string */
  importPresets: (json: string) => { success: boolean; error?: string };
  /** Error message, if any */
  error: string | null;
}

/**
 * Generate unique preset ID
 */
function generateId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * useMetronomePresets Hook
 *
 * Manages metronome presets with localStorage persistence.
 * Handles saving, loading, deleting, and import/export of presets.
 *
 * @returns Preset state and management functions
 */
export function useMetronomePresets(): UseMetronomePresetsReturn {
  const [presets, setPresets] = useState<MetronomePreset[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPresets(Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.error('Failed to load presets:', err);
      setError('Failed to load presets from storage');
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      setError(null);
    } catch (err: any) {
      if (err.name === 'QuotaExceededError') {
        setError('Storage quota exceeded. Delete unused presets.');
      } else {
        setError('Failed to save presets');
      }
    }
  }, [presets]);

  const savePreset = useCallback(
    (name: string, config: MetronomeConfig, description?: string) => {
      if (presets.length >= MAX_PRESETS) {
        setError(`Maximum ${MAX_PRESETS} presets allowed`);
        return;
      }

      const now = new Date().toISOString();
      const newPreset: MetronomePreset = {
        id: generateId(),
        name,
        description: description || null,
        config,
        createdAt: now,
        updatedAt: now,
      };

      setPresets(prev => [...prev, newPreset]);
      setError(null);
    },
    [presets.length]
  );

  const loadPreset = useCallback(
    (id: string): MetronomeConfig | null => {
      const preset = presets.find(p => p.id === id);
      return preset ? preset.config : null;
    },
    [presets]
  );

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    setError(null);
  }, []);

  const exportPresets = useCallback((): string => {
    return JSON.stringify(presets, null, 2);
  }, [presets]);

  const importPresets = useCallback((json: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json);

      if (!Array.isArray(parsed)) {
        return { success: false, error: 'Invalid format: expected array' };
      }

      // Validate structure
      const valid = parsed.every(
        p => p.id && p.name && p.config && p.createdAt && p.updatedAt
      );

      if (!valid) {
        return { success: false, error: 'Invalid preset structure' };
      }

      setPresets(parsed);
      setError(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to parse JSON' };
    }
  }, []);

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    exportPresets,
    importPresets,
    error,
  };
}
