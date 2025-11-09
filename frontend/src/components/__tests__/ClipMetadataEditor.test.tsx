/**
 * ClipMetadataEditor Component Tests
 *
 * Tests the ClipMetadataEditor component for metadata editing, validation, and save functionality.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClipMetadataEditor from '../ClipMetadataEditor';

describe('ClipMetadataEditor Component', () => {
  const mockOnSave = jest.fn();

  const defaultProps = {
    customMetadata: {},
    onSave: mockOnSave,
    isSaving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render with empty metadata message', () => {
      render(<ClipMetadataEditor {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /custom metadata/i })).toBeInTheDocument();
      expect(screen.getByText(/no custom metadata/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
    });

    it('should render existing metadata entries', () => {
      const metadata = {
        category: 'highlight',
        rating: 5,
        reviewed: true,
      };

      render(<ClipMetadataEditor {...defaultProps} customMetadata={metadata} />);

      // Should have 3 key-value pairs displayed
      const keyInputs = screen.getAllByPlaceholderText(/key/i);
      expect(keyInputs).toHaveLength(3);

      // Check values are displayed
      expect(screen.getByDisplayValue('category')).toBeInTheDocument();
      expect(screen.getByDisplayValue('highlight')).toBeInTheDocument();
      expect(screen.getByDisplayValue('rating')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('reviewed')).toBeInTheDocument();
      expect(screen.getByDisplayValue('true')).toBeInTheDocument();
    });

    it('should render save and add buttons', () => {
      render(<ClipMetadataEditor {...defaultProps} />);

      expect(screen.getByRole('button', { name: /save metadata/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument();
    });

    it('should not show reset button when no changes', () => {
      render(<ClipMetadataEditor {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    });
  });

  describe('Adding Entries', () => {
    it('should add new entry when Add Field clicked', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      expect(screen.queryByPlaceholderText(/key/i)).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /add field/i }));

      expect(screen.getByPlaceholderText(/key/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/value/i)).toBeInTheDocument();
    });

    it('should add multiple entries', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));
      await user.click(screen.getByRole('button', { name: /add field/i }));
      await user.click(screen.getByRole('button', { name: /add field/i }));

      const keyInputs = screen.getAllByPlaceholderText(/key/i);
      expect(keyInputs).toHaveLength(3);
    });

    it('should show reset button after adding entry', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });

  describe('Editing Entries', () => {
    it('should update key when user types', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const keyInput = screen.getByPlaceholderText(/key/i);
      await user.type(keyInput, 'myKey');

      expect(keyInput).toHaveValue('myKey');
    });

    it('should update value when user types', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const valueInput = screen.getByPlaceholderText(/value/i);
      await user.type(valueInput, 'myValue');

      expect(valueInput).toHaveValue('myValue');
    });

    it('should allow editing existing metadata', async () => {
      const user = userEvent.setup();
      const metadata = { category: 'test' };
      render(<ClipMetadataEditor {...defaultProps} customMetadata={metadata} />);

      const valueInput = screen.getByDisplayValue('test');
      await user.clear(valueInput);
      await user.type(valueInput, 'updated');

      expect(valueInput).toHaveValue('updated');
    });

    it('should show reset button when editing existing entry', async () => {
      const user = userEvent.setup();
      const metadata = { category: 'test' };
      render(<ClipMetadataEditor {...defaultProps} customMetadata={metadata} />);

      const valueInput = screen.getByDisplayValue('test');
      await user.type(valueInput, ' updated');

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });

  describe('Removing Entries', () => {
    it('should remove entry when remove button clicked', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));
      await user.click(screen.getByRole('button', { name: /add field/i }));

      expect(screen.getAllByPlaceholderText(/key/i)).toHaveLength(2);

      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      await user.click(removeButtons[0]);

      expect(screen.getAllByPlaceholderText(/key/i)).toHaveLength(1);
    });

    it('should remove all entries when all remove buttons clicked', async () => {
      const user = userEvent.setup();
      const metadata = { key1: 'value1', key2: 'value2' };
      render(<ClipMetadataEditor {...defaultProps} customMetadata={metadata} />);

      expect(screen.getAllByPlaceholderText(/key/i)).toHaveLength(2);

      const removeButtons = screen.getAllByRole('button', { name: '✕' });
      await user.click(removeButtons[0]);
      await user.click(removeButtons[0]); // Index shifts after first removal

      expect(screen.getByText(/no custom metadata/i)).toBeInTheDocument();
    });

    it('should clear errors when removing entry', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const valueInput = screen.getByPlaceholderText(/value/i);
      await user.type(valueInput, 'test');
      await user.clear(valueInput);

      // Error should appear
      expect(screen.getByText(/value cannot be empty/i)).toBeInTheDocument();

      // Remove entry
      await user.click(screen.getByRole('button', { name: '✕' }));

      // Error should be gone
      expect(screen.queryByText(/value cannot be empty/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error for empty value', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const valueInput = screen.getByPlaceholderText(/value/i);
      await user.type(valueInput, 'test');
      await user.clear(valueInput);

      expect(screen.getByText(/value cannot be empty/i)).toBeInTheDocument();
    });

    it('should clear error when valid value entered', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const valueInput = screen.getByPlaceholderText(/value/i);
      await user.type(valueInput, 'a');
      await user.clear(valueInput);

      expect(screen.getByText(/value cannot be empty/i)).toBeInTheDocument();

      await user.type(valueInput, 'valid');

      await waitFor(() => {
        expect(screen.queryByText(/value cannot be empty/i)).not.toBeInTheDocument();
      });
    });

    it('should prevent save with empty key', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const valueInput = screen.getByPlaceholderText(/value/i);
      await user.type(valueInput, 'test value');

      await user.click(screen.getByRole('button', { name: /save metadata/i }));

      expect(screen.getByText(/key cannot be empty/i)).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should alert on duplicate keys', async () => {
      const user = userEvent.setup();
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<ClipMetadataEditor {...defaultProps} />);

      // Add two entries with same key
      await user.click(screen.getByRole('button', { name: /add field/i }));
      await user.click(screen.getByRole('button', { name: /add field/i }));

      const keyInputs = screen.getAllByPlaceholderText(/key/i);
      const valueInputs = screen.getAllByPlaceholderText(/value/i);

      await user.type(keyInputs[0], 'duplicate');
      await user.type(valueInputs[0], 'value1');

      await user.type(keyInputs[1], 'duplicate');
      await user.type(valueInputs[1], 'value2');

      await user.click(screen.getByRole('button', { name: /save metadata/i }));

      expect(alertSpy).toHaveBeenCalledWith('Duplicate keys found: duplicate');
      expect(mockOnSave).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe('Save Functionality', () => {
    it('should save metadata with correct types', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      // Add entries for different types
      await user.click(screen.getByRole('button', { name: /add field/i }));
      await user.click(screen.getByRole('button', { name: /add field/i }));
      await user.click(screen.getByRole('button', { name: /add field/i }));

      const keyInputs = screen.getAllByPlaceholderText(/key/i);
      const valueInputs = screen.getAllByPlaceholderText(/value/i);

      // String
      await user.type(keyInputs[0], 'stringKey');
      await user.type(valueInputs[0], 'stringValue');

      // Number
      await user.type(keyInputs[1], 'numberKey');
      await user.type(valueInputs[1], '42');

      // Boolean
      await user.type(keyInputs[2], 'boolKey');
      await user.type(valueInputs[2], 'true');

      await user.click(screen.getByRole('button', { name: /save metadata/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          stringKey: 'stringValue',
          numberKey: 42,
          boolKey: true,
        });
      });
    });

    it('should parse boolean values correctly', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));
      await user.click(screen.getByRole('button', { name: /add field/i }));

      const keyInputs = screen.getAllByPlaceholderText(/key/i);
      const valueInputs = screen.getAllByPlaceholderText(/value/i);

      await user.type(keyInputs[0], 'trueVal');
      await user.type(valueInputs[0], 'true');

      await user.type(keyInputs[1], 'falseVal');
      await user.type(valueInputs[1], 'false');

      await user.click(screen.getByRole('button', { name: /save metadata/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          trueVal: true,
          falseVal: false,
        });
      });
    });

    it('should trim whitespace from keys', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const keyInput = screen.getByPlaceholderText(/key/i);
      const valueInput = screen.getByPlaceholderText(/value/i);

      await user.type(keyInput, '  trimmedKey  ');
      await user.type(valueInput, 'value');

      await user.click(screen.getByRole('button', { name: /save metadata/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          trimmedKey: 'value',
        });
      });
    });

    it('should clear hasChanges flag after successful save', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const keyInput = screen.getByPlaceholderText(/key/i);
      const valueInput = screen.getByPlaceholderText(/value/i);

      await user.type(keyInput, 'test');
      await user.type(valueInput, 'value');

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /save metadata/i }));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to original metadata', async () => {
      const user = userEvent.setup();
      const metadata = { original: 'value' };
      render(<ClipMetadataEditor {...defaultProps} customMetadata={metadata} />);

      const valueInput = screen.getByDisplayValue('value');
      await user.clear(valueInput);
      await user.type(valueInput, 'modified');

      expect(valueInput).toHaveValue('modified');

      await user.click(screen.getByRole('button', { name: /reset/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue('value')).toBeInTheDocument();
      });
    });

    it('should clear errors when reset', async () => {
      const user = userEvent.setup();
      const metadata = { test: 'value' };
      render(<ClipMetadataEditor {...defaultProps} customMetadata={metadata} />);

      const valueInput = screen.getByDisplayValue('value');
      await user.clear(valueInput);

      expect(screen.getByText(/value cannot be empty/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /reset/i }));

      await waitFor(() => {
        expect(screen.queryByText(/value cannot be empty/i)).not.toBeInTheDocument();
      });
    });

    it('should hide reset button after reset', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /reset/i }));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should disable all inputs when saving', () => {
      const metadata = { key: 'value' };
      render(<ClipMetadataEditor {...defaultProps} customMetadata={metadata} isSaving={true} />);

      const keyInput = screen.getByDisplayValue('key');
      const valueInput = screen.getByDisplayValue('value');
      const removeButton = screen.getByRole('button', { name: '✕' });
      const addButton = screen.getByRole('button', { name: /add field/i });
      const saveButton = screen.getByRole('button', { name: /saving/i });

      expect(keyInput).toBeDisabled();
      expect(valueInput).toBeDisabled();
      expect(removeButton).toBeDisabled();
      expect(addButton).toBeDisabled();
      expect(saveButton).toBeDisabled();
    });

    it('should show "Saving..." text on save button', () => {
      render(<ClipMetadataEditor {...defaultProps} isSaving={true} />);

      expect(screen.getByRole('button', { name: /saving.../i })).toBeInTheDocument();
    });

    it('should disable reset button when saving', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();

      rerender(<ClipMetadataEditor {...defaultProps} isSaving={true} />);

      expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper placeholder text', () => {
      render(<ClipMetadataEditor {...defaultProps} />);

      // No inputs initially
      expect(screen.queryByPlaceholderText(/key/i)).not.toBeInTheDocument();
    });

    it('should have remove button with title attribute', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /add field/i }));

      const removeButton = screen.getByRole('button', { name: '✕' });
      expect(removeButton).toHaveAttribute('title', 'Remove field');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ClipMetadataEditor {...defaultProps} />);

      // Tab through buttons
      await user.tab();
      expect(screen.getByRole('button', { name: /add field/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /save metadata/i })).toHaveFocus();
    });
  });
});
