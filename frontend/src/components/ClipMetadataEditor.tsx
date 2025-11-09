/**
 * ClipMetadataEditor Component
 *
 * Editable form for clip custom metadata (key-value pairs).
 * Supports adding, editing, and removing metadata fields.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState } from 'react';
import './ClipMetadataEditor.css';

interface ClipMetadataEditorProps {
  customMetadata: Record<string, unknown>;
  onSave: (metadata: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}

/**
 * Validate metadata value type
 */
function validateMetadataValue(value: string): { valid: boolean; error?: string } {
  if (value.trim() === '') {
    return { valid: false, error: 'Value cannot be empty' };
  }
  return { valid: true };
}

/**
 * Parse value to appropriate type (string, number, or boolean)
 */
function parseMetadataValue(value: string): string | number | boolean {
  // Try to parse as boolean
  if (value.toLowerCase() === 'true') {
    return true;
  }
  if (value.toLowerCase() === 'false') {
    return false;
  }

  // Try to parse as number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }

  // Default to string
  return value;
}

export default function ClipMetadataEditor({
  customMetadata,
  onSave,
  isSaving,
}: ClipMetadataEditorProps) {
  // Convert metadata object to array of entries for easier editing
  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(
    Object.entries(customMetadata).map(([key, value]) => ({
      key,
      value: String(value),
    }))
  );

  const [errors, setErrors] = useState<Record<number, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Handle key change
  const handleKeyChange = (index: number, newKey: string) => {
    const updated = [...entries];
    updated[index].key = newKey;
    setEntries(updated);
    setHasChanges(true);
  };

  // Handle value change
  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...entries];
    updated[index].value = newValue;
    setEntries(updated);
    setHasChanges(true);

    // Validate
    const validation = validateMetadataValue(newValue);
    if (!validation.valid) {
      setErrors({ ...errors, [index]: validation.error || 'Invalid value' });
    } else {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  // Add new entry
  const handleAddEntry = () => {
    setEntries([...entries, { key: '', value: '' }]);
    setHasChanges(true);
  };

  // Remove entry
  const handleRemoveEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    setHasChanges(true);

    // Remove error for this index
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  // Save metadata
  const handleSave = async () => {
    // Validate all entries
    const validationErrors: Record<number, string> = {};
    let hasErrors = false;

    entries.forEach((entry, index) => {
      if (entry.key.trim() === '') {
        validationErrors[index] = 'Key cannot be empty';
        hasErrors = true;
      }

      const validation = validateMetadataValue(entry.value);
      if (!validation.valid) {
        validationErrors[index] = validation.error || 'Invalid value';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(validationErrors);
      return;
    }

    // Check for duplicate keys
    const keys = entries.map((e) => e.key.trim());
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      alert(`Duplicate keys found: ${duplicates.join(', ')}`);
      return;
    }

    // Convert entries to metadata object with proper types
    const metadata: Record<string, unknown> = {};
    entries.forEach((entry) => {
      metadata[entry.key.trim()] = parseMetadataValue(entry.value);
    });

    await onSave(metadata);
    setHasChanges(false);
  };

  // Reset to original
  const handleReset = () => {
    setEntries(
      Object.entries(customMetadata).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    );
    setErrors({});
    setHasChanges(false);
  };

  return (
    <div className="clip-metadata-editor">
      <div className="metadata-editor-header">
        <h3>Custom Metadata</h3>
        <p className="metadata-editor-description">
          Add custom key-value pairs to store additional information about this clip.
        </p>
      </div>

      <div className="metadata-entries">
        {entries.length === 0 ? (
          <div className="metadata-empty">
            No custom metadata. Click &ldquo;Add Field&rdquo; to add metadata.
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={index} className="metadata-entry">
              <div className="metadata-entry-fields">
                <input
                  type="text"
                  className="metadata-key-input"
                  placeholder="Key"
                  value={entry.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  disabled={isSaving}
                />
                <input
                  type="text"
                  className="metadata-value-input"
                  placeholder="Value (text, number, or true/false)"
                  value={entry.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  disabled={isSaving}
                />
                <button
                  className="btn-icon btn-remove"
                  onClick={() => handleRemoveEntry(index)}
                  disabled={isSaving}
                  title="Remove field"
                >
                  ✕
                </button>
              </div>
              {errors[index] && <div className="metadata-error">{errors[index]}</div>}
            </div>
          ))
        )}
      </div>

      <div className="metadata-actions">
        <button className="btn btn-secondary" onClick={handleAddEntry} disabled={isSaving}>
          + Add Field
        </button>

        <div className="metadata-save-actions">
          {hasChanges && (
            <button className="btn btn-tertiary" onClick={handleReset} disabled={isSaving}>
              Reset
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              void handleSave();
            }}
            disabled={isSaving || Object.keys(errors).length > 0}
          >
            {isSaving ? 'Saving...' : 'Save Metadata'}
          </button>
        </div>
      </div>
    </div>
  );
}
