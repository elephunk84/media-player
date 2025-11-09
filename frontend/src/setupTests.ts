/**
 * Jest Setup File
 *
 * Runs before all tests to configure testing environment.
 */

import '@testing-library/jest-dom';

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
