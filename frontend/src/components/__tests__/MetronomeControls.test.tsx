/**
 * Unit tests for MetronomeControls component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetronomeControls } from '../MetronomeControls';

describe('MetronomeControls', () => {
  const defaultProps = {
    enabled: false,
    bpm: 60,
    isRunning: false,
    onToggle: jest.fn(),
    onBPMChange: jest.fn(),
    onOpenSettings: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<MetronomeControls {...defaultProps} />);
      expect(screen.getByRole('button', { name: /metronome/i })).toBeInTheDocument();
    });

    test('renders toggle button with correct aria attributes', () => {
      render(<MetronomeControls {...defaultProps} />);
      const toggleButton = screen.getByRole('button', { name: /metronome/i });

      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('shows BPM slider when enabled', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} />);

      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveValue('60');
    });

    test('does not show BPM slider when disabled', () => {
      render(<MetronomeControls {...defaultProps} enabled={false} />);

      expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    });

    test('displays current BPM value', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} bpm={120} />);

      expect(screen.getByText(/120/)).toBeInTheDocument();
    });
  });

  describe('Toggle button', () => {
    test('calls onToggle when toggle button is clicked', () => {
      const onToggle = jest.fn();
      render(<MetronomeControls {...defaultProps} onToggle={onToggle} />);

      const toggleButton = screen.getByRole('button', { name: /metronome/i });
      fireEvent.click(toggleButton);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test('shows active state when enabled', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} />);

      const toggleButton = screen.getByRole('button', { name: /disable metronome/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
      expect(toggleButton).toHaveClass('metronome-controls__toggle--active');
    });

    test('shows pulse indicator when running', () => {
      const { container } = render(<MetronomeControls {...defaultProps} isRunning={true} />);

      const pulseIndicator = container.querySelector('.metronome-controls__pulse-indicator');
      expect(pulseIndicator).toBeInTheDocument();
    });

    test('does not show pulse indicator when not running', () => {
      const { container } = render(<MetronomeControls {...defaultProps} isRunning={false} />);

      const pulseIndicator = container.querySelector('.metronome-controls__pulse-indicator');
      expect(pulseIndicator).not.toBeInTheDocument();
    });
  });

  describe('BPM Slider', () => {
    test('calls onBPMChange when slider value changes', () => {
      const onBPMChange = jest.fn();
      render(<MetronomeControls {...defaultProps} enabled={true} onBPMChange={onBPMChange} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '120' } });

      expect(onBPMChange).toHaveBeenCalledWith(120);
    });

    test('has correct min and max values (30-300)', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '30');
      expect(slider).toHaveAttribute('max', '300');
    });

    test('updates display when BPM prop changes', () => {
      const { rerender } = render(<MetronomeControls {...defaultProps} enabled={true} bpm={60} />);

      expect(screen.getByText(/60/)).toBeInTheDocument();

      rerender(<MetronomeControls {...defaultProps} enabled={true} bpm={180} />);

      expect(screen.getByText(/180/)).toBeInTheDocument();
    });
  });

  describe('Settings button', () => {
    test('renders settings button when enabled', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    test('calls onOpenSettings when settings button is clicked', () => {
      const onOpenSettings = jest.fn();
      render(<MetronomeControls {...defaultProps} enabled={true} onOpenSettings={onOpenSettings} />);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('toggle button has accessible label', () => {
      render(<MetronomeControls {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /metronome/i });
      expect(toggleButton).toHaveAccessibleName();
    });

    test('slider has accessible label', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAccessibleName();
    });

    test('updates aria-pressed on toggle', () => {
      const { rerender } = render(<MetronomeControls {...defaultProps} enabled={false} />);

      const toggleButton = screen.getByRole('button', { name: /metronome/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');

      rerender(<MetronomeControls {...defaultProps} enabled={true} />);

      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Edge cases', () => {
    test('handles rapid toggle clicks', () => {
      const onToggle = jest.fn();
      render(<MetronomeControls {...defaultProps} onToggle={onToggle} />);

      const toggleButton = screen.getByRole('button', { name: /metronome/i });

      // Rapidly click 5 times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(toggleButton);
      }

      expect(onToggle).toHaveBeenCalledTimes(5);
    });

    test('handles BPM at minimum (30)', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} bpm={30} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('30');
    });

    test('handles BPM at maximum (300)', () => {
      render(<MetronomeControls {...defaultProps} enabled={true} bpm={300} />);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('300');
    });
  });
});
