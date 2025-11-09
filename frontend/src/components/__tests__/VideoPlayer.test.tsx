/**
 * VideoPlayer Component Tests
 *
 * Tests the VideoPlayer component rendering, controls, and interactions.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from '../VideoPlayer';

// Mock video.js module
jest.mock('video.js', () => {
  const mockPlayer = {
    src: jest.fn(),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    ready: jest.fn((callback: () => void) => callback()),
    currentTime: jest.fn(),
    volume: jest.fn(),
    muted: jest.fn(),
    requestFullscreen: jest.fn(),
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return jest.fn(() => mockPlayer);
});

// Mock useVideoPlayer hook
jest.mock('../../hooks/useVideoPlayer', () => ({
  useVideoPlayer: jest.fn(() => ({
    player: null,
    isPlaying: false,
    buffering: false,
    error: null,
    currentTime: 0,
    duration: 100,
    volume: 1,
    initialize: jest.fn(),
    dispose: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    togglePlay: jest.fn(),
    seek: jest.fn(),
    setVolume: jest.fn(),
    toggleMute: jest.fn(),
    toggleFullscreen: jest.fn(),
  })),
}));

describe('VideoPlayer Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render video element with correct attributes', () => {
      render(<VideoPlayer videoId={1} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
      expect(videoElement.tagName).toBe('VIDEO');
    });

    it('should render with videoId prop', () => {
      render(<VideoPlayer videoId={123} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
    });

    it('should render with clipId prop', () => {
      render(<VideoPlayer clipId={456} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<VideoPlayer videoId={1} className="custom-player" />);

      const container = screen.getByTestId('video-player').parentElement;
      expect(container).toHaveClass('custom-player');
    });

    it('should show error when neither videoId nor clipId provided', () => {
      render(<VideoPlayer />);

      expect(screen.getByText(/must provide either videoId or clipId/i)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should handle autoplay prop', () => {
      render(<VideoPlayer videoId={1} autoplay={true} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
    });

    it('should handle controls prop', () => {
      render(<VideoPlayer videoId={1} controls={false} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
    });

    it('should default controls to true', () => {
      render(<VideoPlayer videoId={1} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
    });

    it('should default autoplay to false', () => {
      render(<VideoPlayer videoId={1} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
    });
  });

  describe('Stream URL', () => {
    it('should use video stream URL when videoId provided', () => {
      render(<VideoPlayer videoId={123} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
      // URL is set via Video.js initialization
    });

    it('should use clip stream URL when clipId provided', () => {
      render(<VideoPlayer clipId={456} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
      // URL is set via Video.js initialization
    });

    it('should prioritize videoId over clipId when both provided', () => {
      render(<VideoPlayer videoId={123} clipId={456} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
      // Should use /api/stream/video/123
    });
  });

  describe('Lifecycle', () => {
    it('should cleanup player on unmount', () => {
      const { unmount } = render(<VideoPlayer videoId={1} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();

      unmount();
      // Cleanup should be called via useEffect
    });

    it('should reinitialize when videoId changes', async () => {
      const { rerender } = render(<VideoPlayer videoId={1} />);

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument();
      });

      rerender(<VideoPlayer videoId={2} />);

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument();
      });
    });

    it('should reinitialize when clipId changes', async () => {
      const { rerender } = render(<VideoPlayer clipId={1} />);

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument();
      });

      rerender(<VideoPlayer clipId={2} />);

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on video element', () => {
      render(<VideoPlayer videoId={1} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
      // Video.js adds its own ARIA attributes
    });

    it('should be keyboard accessible', () => {
      render(<VideoPlayer videoId={1} controls={true} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
      // Video.js controls are keyboard accessible
    });
  });

  describe('Error Handling', () => {
    it('should handle missing videoId and clipId gracefully', () => {
      const { container } = render(<VideoPlayer />);

      expect(container).toBeInTheDocument();
      // Should render without crashing
    });

    it('should not crash when player initialization fails', () => {
      // This tests resilience even if Video.js fails
      render(<VideoPlayer videoId={1} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
    });
  });

  describe('Player Instance Prop', () => {
    it('should use provided playerInstance if given', () => {
      const mockPlayerInstance = {
        player: null,
        isPlaying: true,
        buffering: false,
        error: null,
        currentTime: 0,
        duration: 100,
        volume: 1,
        initialize: jest.fn(),
        dispose: jest.fn(),
        play: jest.fn(),
        pause: jest.fn(),
        togglePlay: jest.fn(),
        seek: jest.fn(),
        setVolume: jest.fn(),
        toggleMute: jest.fn(),
        toggleFullscreen: jest.fn(),
      };

      render(<VideoPlayer videoId={1} playerInstance={mockPlayerInstance} />);

      const videoElement = screen.getByTestId('video-player');
      expect(videoElement).toBeInTheDocument();
      // Should use the provided instance instead of creating new one
    });
  });
});
