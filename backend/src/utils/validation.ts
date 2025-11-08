/**
 * Input Validation Utilities
 *
 * Utility functions for validating and sanitizing user inputs.
 */

/**
 * Validation error thrown when input validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate that a value is a positive integer
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field (for error messages)
 * @throws ValidationError if validation fails
 */
export function validatePositiveInteger(value: unknown, fieldName: string): void {
  if (typeof value !== 'number') {
    throw new ValidationError(`${fieldName} must be a number`);
  }

  if (!Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }

  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be positive`);
  }
}

/**
 * Validate that a value is a non-negative integer
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field (for error messages)
 * @throws ValidationError if validation fails
 */
export function validateNonNegativeInteger(value: unknown, fieldName: string): void {
  if (typeof value !== 'number') {
    throw new ValidationError(`${fieldName} must be a number`);
  }

  if (!Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }

  if (value < 0) {
    throw new ValidationError(`${fieldName} must be non-negative`);
  }
}

/**
 * Validate that a string is not empty
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field (for error messages)
 * @throws ValidationError if validation fails
 */
export function validateNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
}

/**
 * Validate that a string has a maximum length
 *
 * @param value - Value to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field (for error messages)
 * @throws ValidationError if validation fails
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): void {
  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
  }
}

/**
 * Validate that an array is not empty
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field (for error messages)
 * @throws ValidationError if validation fails
 */
export function validateNonEmptyArray(value: unknown, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  if (value.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
}

/**
 * Sanitize a file path to prevent directory traversal attacks
 *
 * @param filePath - File path to sanitize
 * @returns Sanitized file path
 * @throws ValidationError if path contains suspicious patterns
 */
export function sanitizeFilePath(filePath: string): string {
  // Check for null bytes
  if (filePath.includes('\0')) {
    throw new ValidationError('File path contains invalid characters');
  }

  // Check for directory traversal attempts
  if (filePath.includes('..')) {
    throw new ValidationError('File path contains directory traversal');
  }

  // Remove leading/trailing whitespace
  return filePath.trim();
}

/**
 * Validate and sanitize a video title
 *
 * @param title - Title to validate
 * @returns Sanitized title
 * @throws ValidationError if validation fails
 */
export function validateVideoTitle(title: string): string {
  validateNonEmptyString(title, 'Title');
  validateMaxLength(title, 255, 'Title');
  return title.trim();
}

/**
 * Validate and sanitize a video description
 *
 * @param description - Description to validate
 * @returns Sanitized description or null
 * @throws ValidationError if validation fails
 */
export function validateVideoDescription(description: string | null): string | null {
  if (description === null) {
    return null;
  }

  if (typeof description !== 'string') {
    throw new ValidationError('Description must be a string or null');
  }

  const trimmed = description.trim();
  if (trimmed.length === 0) {
    return null;
  }

  validateMaxLength(trimmed, 10000, 'Description');
  return trimmed;
}

/**
 * Validate an array of tags
 *
 * @param tags - Tags to validate
 * @returns Validated tags array
 * @throws ValidationError if validation fails
 */
export function validateTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) {
    throw new ValidationError('Tags must be an array');
  }

  const validatedTags = tags.map((tag, index) => {
    if (typeof tag !== 'string') {
      throw new ValidationError(`Tag at index ${index} must be a string`);
    }

    const trimmed = tag.trim();
    if (trimmed.length === 0) {
      throw new ValidationError(`Tag at index ${index} cannot be empty`);
    }

    validateMaxLength(trimmed, 50, `Tag at index ${index}`);
    return trimmed.toLowerCase(); // Normalize to lowercase
  });

  // Remove duplicates
  return [...new Set(validatedTags)];
}

/**
 * Validate metadata object
 *
 * @param metadata - Metadata to validate
 * @returns Validated metadata
 * @throws ValidationError if validation fails
 */
export function validateMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    throw new ValidationError('Metadata must be an object');
  }

  // Check for reasonable size (prevent abuse)
  const jsonString = JSON.stringify(metadata);
  if (jsonString.length > 100000) {
    throw new ValidationError('Metadata is too large (max 100KB)');
  }

  return metadata;
}
