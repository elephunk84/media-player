/**
 * ClipCreator Component Tests
 *
 * Tests the ClipCreator component UI interactions, validation, and clip creation.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClipCreator from '../ClipCreator';

describe('ClipCreator Component', () => {
  const mockOnClipCreated = jest.fn();
  const mockOnCreateClip = jest.fn();

  const defaultProps = {
    videoId: 1,
    videoDuration: 120, // 2 minutes
    currentTime: 30,
    onClipCreated: mockOnClipCreated,
    onCreateClip: mockOnCreateClip,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnCreateClip.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render all control elements', () => {
      render(<ClipCreator {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /create clip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set start/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set end/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/clip name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^create clip$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should display initial time placeholders', () => {
      render(<ClipCreator {...defaultProps} />);

      const timeDisplays = screen.getAllByText('--:--');
      expect(timeDisplays).toHaveLength(2); // Start and end time displays
    });

    it('should render empty clip name input initially', () => {
      render(<ClipCreator {...defaultProps} />);

      const nameInput = screen.getByLabelText(/clip name/i);
      expect(nameInput).toHaveValue('');
    });
  });

  describe('Setting Start Time', () => {
    it('should set start time when Set Start button clicked', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} currentTime={45} />);

      const setStartButton = screen.getByRole('button', { name: /set start/i });
      await user.click(setStartButton);

      // Should display formatted time (45 seconds = 0:45)
      expect(screen.getByText('0:45')).toBeInTheDocument();
    });

    it('should update start time when clicked multiple times', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={30} />);

      const setStartButton = screen.getByRole('button', { name: /set start/i });
      await user.click(setStartButton);

      expect(screen.getByText('0:30')).toBeInTheDocument();

      // Change current time and click again
      rerender(<ClipCreator {...defaultProps} currentTime={60} />);
      await user.click(setStartButton);

      expect(screen.getByText('1:00')).toBeInTheDocument();
    });

    it('should clear error when setting start time', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} />);

      // Try to create without times to trigger error
      const createButton = screen.getByRole('button', { name: /^create clip$/i });
      await user.click(createButton);

      // Set start time should clear the error
      const setStartButton = screen.getByRole('button', { name: /set start/i });
      await user.click(setStartButton);

      await waitFor(() => {
        expect(screen.queryByText(/both start and end times must be set/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Setting End Time', () => {
    it('should set end time when Set End button clicked', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} currentTime={75} />);

      const setEndButton = screen.getByRole('button', { name: /set end/i });
      await user.click(setEndButton);

      // Should display formatted time (75 seconds = 1:15)
      expect(screen.getByText('1:15')).toBeInTheDocument();
    });

    it('should update end time when clicked multiple times', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={60} />);

      const setEndButton = screen.getByRole('button', { name: /set end/i });
      await user.click(setEndButton);

      expect(screen.getByText('1:00')).toBeInTheDocument();

      rerender(<ClipCreator {...defaultProps} currentTime={90} />);
      await user.click(setEndButton);

      expect(screen.getByText('1:30')).toBeInTheDocument();
    });
  });

  describe('Clip Name Input', () => {
    it('should update clip name when user types', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} />);

      const nameInput = screen.getByLabelText(/clip name/i);
      await user.type(nameInput, 'My Awesome Clip');

      expect(nameInput).toHaveValue('My Awesome Clip');
    });

    it('should allow empty clip name during typing', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} />);

      const nameInput = screen.getByLabelText(/clip name/i);
      await user.type(nameInput, 'Test');
      await user.clear(nameInput);

      expect(nameInput).toHaveValue('');
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all fields when Clear button clicked', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} currentTime={30} />);

      // Set start time
      await user.click(screen.getByRole('button', { name: /set start/i }));

      // Set end time
      await user.click(screen.getByRole('button', { name: /set end/i }));

      // Type clip name
      const nameInput = screen.getByLabelText(/clip name/i);
      await user.type(nameInput, 'Test Clip');

      // Click clear
      await user.click(screen.getByRole('button', { name: /clear/i }));

      // Verify all cleared
      expect(screen.getAllByText('--:--')).toHaveLength(2);
      expect(nameInput).toHaveValue('');
    });

    it('should clear error message when Clear clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      // Set up valid clip but make creation fail
      mockOnCreateClip.mockRejectedValueOnce(new Error('Network error'));

      await user.click(screen.getByRole('button', { name: /set start/i }));

      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));

      const nameInput = screen.getByLabelText(/clip name/i);
      await user.type(nameInput, 'Test Clip');

      // Create clip (will fail)
      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Click clear
      await user.click(screen.getByRole('button', { name: /clear/i }));

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should disable Create button when start and end times not set', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} />);

      const nameInput = screen.getByLabelText(/clip name/i);
      await user.type(nameInput, 'Test Clip');

      const createButton = screen.getByRole('button', { name: /^create clip$/i });
      expect(createButton).toBeDisabled();
    });

    it('should disable Create button when start time >= end time', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={60} />);

      // Set start at 60s
      await user.click(screen.getByRole('button', { name: /set start/i }));

      // Set end at 30s (before start)
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));

      const nameInput = screen.getByLabelText(/clip name/i);
      await user.type(nameInput, 'Invalid Clip');

      const createButton = screen.getByRole('button', { name: /^create clip$/i });
      expect(createButton).toBeDisabled();
    });

    it('should disable Create button when clip name is empty', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));

      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));

      // Don't set name
      const createButton = screen.getByRole('button', { name: /^create clip$/i });
      expect(createButton).toBeDisabled();
    });

    it('should disable Create button when start time exceeds video duration', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} videoDuration={100} currentTime={150} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));

      const nameInput = screen.getByLabelText(/clip name/i);
      await user.type(nameInput, 'Test');

      const createButton = screen.getByRole('button', { name: /^create clip$/i });
      expect(createButton).toBeDisabled();
    });

    it('should disable Create button when validation fails', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      const createButton = screen.getByRole('button', { name: /^create clip$/i });

      // Initially disabled (no times set)
      expect(createButton).toBeDisabled();

      // Set start time at 10s
      await user.click(screen.getByRole('button', { name: /set start/i }));
      expect(createButton).toBeDisabled();

      // Set end time at 30s
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));
      expect(createButton).toBeDisabled(); // Still disabled - no name

      // Add name
      await user.type(screen.getByLabelText(/clip name/i), 'Valid Clip');
      expect(createButton).not.toBeDisabled();
    });
  });

  describe('Clip Creation', () => {
    it('should create clip with valid data', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      // Set start time at 10s
      await user.click(screen.getByRole('button', { name: /set start/i }));

      // Set end time at 30s
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));

      // Set clip name
      await user.type(screen.getByLabelText(/clip name/i), 'Test Clip');

      // Create clip
      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      await waitFor(() => {
        expect(mockOnCreateClip).toHaveBeenCalledWith({
          videoId: 1,
          name: 'Test Clip',
          startTime: 10,
          endTime: 30,
        });
      });

      expect(mockOnClipCreated).toHaveBeenCalled();
    });

    it('should trim whitespace from clip name', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));

      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));

      await user.type(screen.getByLabelText(/clip name/i), '  Trimmed Name  ');

      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      await waitFor(() => {
        expect(mockOnCreateClip).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Trimmed Name',
          })
        );
      });
    });

    it('should reset form after successful creation', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));
      await user.type(screen.getByLabelText(/clip name/i), 'Test Clip');

      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      await waitFor(() => {
        expect(mockOnClipCreated).toHaveBeenCalled();
      });

      // Form should be reset
      await waitFor(() => {
        expect(screen.getAllByText('--:--')).toHaveLength(2);
        expect(screen.getByLabelText(/clip name/i)).toHaveValue('');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while creating clip', async () => {
      const user = userEvent.setup();
      let resolveCreate: () => void;
      const createPromise = new Promise<void>((resolve) => {
        resolveCreate = resolve;
      });
      mockOnCreateClip.mockReturnValue(createPromise);

      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));
      await user.type(screen.getByLabelText(/clip name/i), 'Test Clip');

      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      // Button should show loading text
      expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();

      // All buttons should be disabled
      expect(screen.getByRole('button', { name: /set start/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /set end/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /clear/i })).toBeDisabled();

      // Resolve the promise
      resolveCreate!();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^create clip$/i })).toBeInTheDocument();
      });
    });

    it('should disable input while creating', async () => {
      const user = userEvent.setup();
      let resolveCreate: () => void;
      const createPromise = new Promise<void>((resolve) => {
        resolveCreate = resolve;
      });
      mockOnCreateClip.mockReturnValue(createPromise);

      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));
      await user.type(screen.getByLabelText(/clip name/i), 'Test Clip');

      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      // Input should be disabled
      expect(screen.getByLabelText(/clip name/i)).toBeDisabled();

      resolveCreate!();
      await waitFor(() => {
        expect(screen.getByLabelText(/clip name/i)).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when creation fails', async () => {
      const user = userEvent.setup();
      mockOnCreateClip.mockRejectedValue(new Error('API Error: Failed to create clip'));

      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));
      await user.type(screen.getByLabelText(/clip name/i), 'Test Clip');

      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      await waitFor(() => {
        expect(screen.getByText(/API Error: Failed to create clip/i)).toBeInTheDocument();
      });

      expect(mockOnClipCreated).not.toHaveBeenCalled();
    });

    it('should display generic error for non-Error exceptions', async () => {
      const user = userEvent.setup();
      mockOnCreateClip.mockRejectedValue('String error');

      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));
      await user.type(screen.getByLabelText(/clip name/i), 'Test Clip');

      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create clip/i)).toBeInTheDocument();
      });
    });

    it('should restore button text after error', async () => {
      const user = userEvent.setup();
      mockOnCreateClip.mockRejectedValue(new Error('Test error'));

      const { rerender } = render(<ClipCreator {...defaultProps} currentTime={10} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));
      rerender(<ClipCreator {...defaultProps} currentTime={30} />);
      await user.click(screen.getByRole('button', { name: /set end/i }));
      await user.type(screen.getByLabelText(/clip name/i), 'Test Clip');

      await user.click(screen.getByRole('button', { name: /^create clip$/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^create clip$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format seconds correctly (MM:SS)', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} currentTime={95} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));

      expect(screen.getByText('1:35')).toBeInTheDocument();
    });

    it('should format hours correctly (HH:MM:SS) when over 1 hour', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} currentTime={3665} videoDuration={4000} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));

      expect(screen.getByText('1:01:05')).toBeInTheDocument();
    });

    it('should pad single digits with zero', async () => {
      const user = userEvent.setup();
      render(<ClipCreator {...defaultProps} currentTime={5} />);

      await user.click(screen.getByRole('button', { name: /set start/i }));

      expect(screen.getByText('0:05')).toBeInTheDocument();
    });
  });
});
