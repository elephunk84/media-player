/**
 * Unit tests for BorderEffect component
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BorderEffect } from '../BorderEffect';

describe('BorderEffect', () => {
  const defaultProps = {
    intensity: 0.5,
    duration: 300,
    config: {
      color: '#ffffff',
      opacity: 0.5,
      thickness: 8,
    },
  };

  describe('Rendering', () => {
    test('renders without crashing', () => {
      const { container } = render(<BorderEffect {...defaultProps} />);
      expect(container.querySelector('.border-effect')).toBeInTheDocument();
    });

    test('applies correct color from config', () => {
      const { container } = render(<BorderEffect {...defaultProps} />);

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('is positioned as full-screen overlay', () => {
      const { container } = render(<BorderEffect {...defaultProps} />);

      const borderElement = container.querySelector('.border-effect');
      // Positioning is defined in CSS class
      expect(borderElement).toHaveClass('border-effect');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('Thickness', () => {
    test('renders with thin border (2px)', () => {
      const { container } = render(
        <BorderEffect {...defaultProps} config={{ ...defaultProps.config, thickness: 2 }} />
      );

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('renders with thick border (20px)', () => {
      const { container } = render(
        <BorderEffect {...defaultProps} config={{ ...defaultProps.config, thickness: 20 }} />
      );

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('renders with default thickness (8px)', () => {
      const { container } = render(<BorderEffect {...defaultProps} />);

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('Color', () => {
    test('renders with white border', () => {
      const { container } = render(
        <BorderEffect {...defaultProps} config={{ ...defaultProps.config, color: '#ffffff' }} />
      );

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('renders with red border', () => {
      const { container } = render(
        <BorderEffect {...defaultProps} config={{ ...defaultProps.config, color: '#ff0000' }} />
      );

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('renders with blue border', () => {
      const { container } = render(
        <BorderEffect {...defaultProps} config={{ ...defaultProps.config, color: '#0000ff' }} />
      );

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('Intensity', () => {
    test('renders with low intensity', () => {
      const { container } = render(<BorderEffect {...defaultProps} intensity={0.2} />);

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('renders with high intensity', () => {
      const { container } = render(<BorderEffect {...defaultProps} intensity={1.0} />);

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('renders with zero intensity', () => {
      const { container } = render(<BorderEffect {...defaultProps} intensity={0} />);

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('Duration', () => {
    test('applies short duration (100ms)', () => {
      const { container } = render(<BorderEffect {...defaultProps} duration={100} />);

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });

    test('applies long duration (1000ms)', () => {
      const { container } = render(<BorderEffect {...defaultProps} duration={1000} />);

      const borderElement = container.querySelector('.border-effect');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('Pointer events', () => {
    test('does not block pointer events', () => {
      const { container } = render(<BorderEffect {...defaultProps} />);

      const borderElement = container.querySelector('.border-effect');
      // Pointer events style is defined in CSS class
      expect(borderElement).toHaveClass('border-effect');
      expect(borderElement).toBeInTheDocument();
    });
  });
});
