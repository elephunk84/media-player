/**
 * Utilities Module
 *
 * This module exports utility functions and classes.
 */

export {
  FileScanner,
  VIDEO_EXTENSIONS,
  type ScannedFile,
  type FileScannerOptions,
} from './FileScanner';

export {
  ValidationError,
  validatePositiveInteger,
  validateNonNegativeInteger,
  validateNonEmptyString,
  validateMaxLength,
  validateNonEmptyArray,
  sanitizeFilePath,
  validateVideoTitle,
  validateVideoDescription,
  validateTags,
  validateMetadata,
} from './validation';
