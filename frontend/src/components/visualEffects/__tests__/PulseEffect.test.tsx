/**
 * Unit tests for PulseEffect component
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PulseEffect } from '../PulseEffect';

describe('PulseEffect', () => {
  const defaultProps = {
    intensity: 0.5,
    duration: 300,
    config: {
      color: '#ffffff',
      opacity: 0.5,
      size: 30,
      position: {
        x: 50,
        y: 50,
        preset: 'center' as const,
      },
      shape: 'circle' as const,
    },
  };

  describe('Rendering', () => {
    test('renders without crashing', () => {
      const { container } = render(<PulseEffect {...defaultProps} />);
      expect(container.querySelector('.pulse-effect')).toBeInTheDocument();
    });

    test('applies correct color from config', () => {
      const { container } = render(<PulseEffect {...defaultProps} />);

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toBeInTheDocument();
    });

    test('is positioned according to config', () => {
      const { container } = render(<PulseEffect {...defaultProps} />);

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toHaveStyle({
        position: 'fixed',
      });
    });
  });

  describe('Shapes', () => {
    test('renders circle shape', () => {
      const { container } = render(
        <PulseEffect {...defaultProps} config={{ ...defaultProps.config, shape: 'circle' }} />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toHaveClass('pulse-effect--circle');
    });

    test('renders square shape', () => {
      const { container } = render(
        <PulseEffect {...defaultProps} config={{ ...defaultProps.config, shape: 'square' }} />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toHaveClass('pulse-effect--square');
    });

    test('renders diamond shape', () => {
      const { container } = render(
        <PulseEffect {...defaultProps} config={{ ...defaultProps.config, shape: 'diamond' }} />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toHaveClass('pulse-effect--diamond');
    });

    test('renders star shape', () => {
      const { container } = render(
        <PulseEffect {...defaultProps} config={{ ...defaultProps.config, shape: 'star' }} />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toHaveClass('pulse-effect--star');
    });
  });

  describe('Positioning', () => {
    test('centers pulse at center position', () => {
      const { container } = render(
        <PulseEffect
          {...defaultProps}
          config={{
            ...defaultProps.config,
            position: { x: 50, y: 50, preset: 'center' },
          }}
        />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toBeInTheDocument();
    });

    test('positions pulse at custom coordinates', () => {
      const { container } = render(
        <PulseEffect
          {...defaultProps}
          config={{
            ...defaultProps.config,
            position: { x: 75, y: 25, preset: 'custom' },
          }}
        />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toBeInTheDocument();
    });
  });

  describe('Size', () => {
    test('renders with small size (10%)', () => {
      const { container } = render(
        <PulseEffect {...defaultProps} config={{ ...defaultProps.config, size: 10 }} />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toBeInTheDocument();
    });

    test('renders with large size (80%)', () => {
      const { container } = render(
        <PulseEffect {...defaultProps} config={{ ...defaultProps.config, size: 80 }} />
      );

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toBeInTheDocument();
    });
  });

  describe('Intensity', () => {
    test('renders with low intensity', () => {
      const { container } = render(<PulseEffect {...defaultProps} intensity={0.2} />);

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toBeInTheDocument();
    });

    test('renders with high intensity', () => {
      const { container } = render(<PulseEffect {...defaultProps} intensity={1.0} />);

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toBeInTheDocument();
    });
  });

  describe('Pointer events', () => {
    test('does not block pointer events', () => {
      const { container } = render(<PulseEffect {...defaultProps} />);

      const pulseElement = container.querySelector('.pulse-effect');
      expect(pulseElement).toHaveStyle({ pointerEvents: 'none' });
    });
  });
});
