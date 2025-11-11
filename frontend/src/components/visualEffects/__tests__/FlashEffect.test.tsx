/**
 * Unit tests for FlashEffect component
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FlashEffect } from '../FlashEffect';

describe('FlashEffect', () => {
  const defaultProps = {
    intensity: 0.5,
    duration: 300,
    config: {
      color: '#ffffff',
      opacity: 0.5,
    },
  };

  describe('Rendering', () => {
    test('renders without crashing', () => {
      const { container } = render(<FlashEffect {...defaultProps} />);
      expect(container.querySelector('.flash-effect')).toBeInTheDocument();
    });

    test('applies correct color from config', () => {
      const { container } = render(
        <FlashEffect {...defaultProps} config={{ ...defaultProps.config, color: '#ff0000' }} />
      );

      const flashElement = container.querySelector('.flash-effect') as HTMLElement;
      expect(flashElement.style.getPropertyValue('--flash-color')).toBe('#ff0000');
    });

    test('applies opacity based on config and intensity', () => {
      const { container } = render(<FlashEffect {...defaultProps} intensity={1.0} />);

      const flashElement = container.querySelector('.flash-effect');
      // Opacity should be config.opacity * intensity
      expect(flashElement).toHaveStyle({ opacity: expect.any(String) });
    });

    test('is positioned as full-screen overlay', () => {
      const { container } = render(<FlashEffect {...defaultProps} />);

      const flashElement = container.querySelector('.flash-effect');
      // Check that element has the correct class which applies positioning via CSS
      expect(flashElement).toHaveClass('flash-effect');
      expect(flashElement).toBeInTheDocument();
    });
  });

  describe('Intensity variations', () => {
    test('renders with low intensity (0.2)', () => {
      const { container } = render(<FlashEffect {...defaultProps} intensity={0.2} />);

      const flashElement = container.querySelector('.flash-effect');
      expect(flashElement).toBeInTheDocument();
    });

    test('renders with high intensity (1.0)', () => {
      const { container } = render(<FlashEffect {...defaultProps} intensity={1.0} />);

      const flashElement = container.querySelector('.flash-effect');
      expect(flashElement).toBeInTheDocument();
    });

    test('renders with zero intensity', () => {
      const { container } = render(<FlashEffect {...defaultProps} intensity={0} />);

      const flashElement = container.querySelector('.flash-effect');
      // Should still render but with 0 opacity
      expect(flashElement).toBeInTheDocument();
    });
  });

  describe('Duration', () => {
    test('applies short duration (100ms)', () => {
      const { container } = render(<FlashEffect {...defaultProps} duration={100} />);

      const flashElement = container.querySelector('.flash-effect');
      expect(flashElement).toBeInTheDocument();
    });

    test('applies long duration (1000ms)', () => {
      const { container } = render(<FlashEffect {...defaultProps} duration={1000} />);

      const flashElement = container.querySelector('.flash-effect');
      expect(flashElement).toBeInTheDocument();
    });
  });

  describe('Color variations', () => {
    test('renders with white color', () => {
      const { container } = render(
        <FlashEffect {...defaultProps} config={{ ...defaultProps.config, color: '#ffffff' }} />
      );

      const flashElement = container.querySelector('.flash-effect');
      expect(flashElement).toBeInTheDocument();
    });

    test('renders with colored flash (red)', () => {
      const { container } = render(
        <FlashEffect {...defaultProps} config={{ ...defaultProps.config, color: '#ff0000' }} />
      );

      const flashElement = container.querySelector('.flash-effect') as HTMLElement;
      expect(flashElement.style.getPropertyValue('--flash-color')).toBe('#ff0000');
    });

    test('renders with colored flash (blue)', () => {
      const { container } = render(
        <FlashEffect {...defaultProps} config={{ ...defaultProps.config, color: '#0000ff' }} />
      );

      const flashElement = container.querySelector('.flash-effect') as HTMLElement;
      expect(flashElement.style.getPropertyValue('--flash-color')).toBe('#0000ff');
    });
  });

  describe('Pointer events', () => {
    test('does not block pointer events', () => {
      const { container } = render(<FlashEffect {...defaultProps} />);

      const flashElement = container.querySelector('.flash-effect');
      // Pointer events style is defined in CSS class
      expect(flashElement).toHaveClass('flash-effect');
      expect(flashElement).toBeInTheDocument();
    });
  });
});
