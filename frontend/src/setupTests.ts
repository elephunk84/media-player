/**
 * Jest Setup File
 *
 * Runs before all tests to configure testing environment.
 */

import '@testing-library/jest-dom';

// Suppress act() warnings from React Testing Library
// These are false positives when using @testing-library/user-event
// which handles act() internally
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock Video.js since it requires a DOM environment
global.HTMLMediaElement.prototype.load = () => {
  /* do nothing */
};
global.HTMLMediaElement.prototype.play = () => Promise.resolve();
global.HTMLMediaElement.prototype.pause = () => {
  /* do nothing */
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
