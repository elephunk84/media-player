/**
 * UUIDExtractor Unit Tests
 *
 * Tests for the UUIDExtractor utility class that extracts and validates
 * UUID v4 identifiers from filenames.
 */

import { UUIDExtractor } from '../UUIDExtractor';

describe('UUIDExtractor', () => {
  describe('extract()', () => {
    it('should extract valid UUID v4 from simple filename', () => {
      const filename = '550e8400-e29b-41d4-a716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract UUID v4 from complex filename', () => {
      const filename = 'video-550e8400-e29b-41d4-a716-446655440000-1080p.mkv';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract UUID with uppercase letters and normalize to lowercase', () => {
      const filename = '550E8400-E29B-41D4-A716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract UUID from path with directories', () => {
      const filename = '/mnt/Videos/550e8400-e29b-41d4-a716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return first UUID when multiple UUIDs present', () => {
      const filename =
        '550e8400-e29b-41d4-a716-446655440000-123e4567-e89b-42d3-a456-426614174000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return null when no UUID present', () => {
      const filename = 'no-uuid-here.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = UUIDExtractor.extract('');
      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const result = UUIDExtractor.extract(null as any);
      expect(result).toBeNull();
    });

    it('should not match UUID v1 (time-based)', () => {
      // UUID v1 has '1' in version position
      const filename = '550e8400-e29b-11d4-a716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBeNull();
    });

    it('should not match UUID v3 (MD5 hash)', () => {
      // UUID v3 has '3' in version position
      const filename = '550e8400-e29b-31d4-a716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBeNull();
    });

    it('should not match UUID v5 (SHA-1 hash)', () => {
      // UUID v5 has '5' in version position
      const filename = '550e8400-e29b-51d4-a716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBeNull();
    });

    it('should not match invalid variant bits', () => {
      // Variant bits should be [89ab], not [cdef]
      const filename = '550e8400-e29b-41d4-c716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBeNull();
    });

    it('should handle UUID with special characters around it', () => {
      const filename = 'prefix_550e8400-e29b-41d4-a716-446655440000_suffix.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract UUID with variant bit "8"', () => {
      const filename = '550e8400-e29b-41d4-8716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-8716-446655440000');
    });

    it('should extract UUID with variant bit "9"', () => {
      const filename = '550e8400-e29b-41d4-9716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-9716-446655440000');
    });

    it('should extract UUID with variant bit "a"', () => {
      const filename = '550e8400-e29b-41d4-a716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract UUID with variant bit "b"', () => {
      const filename = '550e8400-e29b-41d4-b716-446655440000.mp4';
      const result = UUIDExtractor.extract(filename);
      expect(result).toBe('550e8400-e29b-41d4-b716-446655440000');
    });
  });

  describe('isValidUUID()', () => {
    it('should return true for valid UUID v4', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(true);
    });

    it('should return true for valid UUID v4 with uppercase', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(true);
    });

    it('should return false for UUID v1', () => {
      const uuid = '550e8400-e29b-11d4-a716-446655440000';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(false);
    });

    it('should return false for UUID with invalid variant bits', () => {
      const uuid = '550e8400-e29b-41d4-c716-446655440000';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(false);
    });

    it('should return false for string with UUID plus extra characters', () => {
      const uuid = 'prefix-550e8400-e29b-41d4-a716-446655440000';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(UUIDExtractor.isValidUUID('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(UUIDExtractor.isValidUUID(null as any)).toBe(false);
      expect(UUIDExtractor.isValidUUID(undefined as any)).toBe(false);
    });

    it('should return false for UUID without dashes', () => {
      const uuid = '550e8400e29b41d4a716446655440000';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(false);
    });

    it('should return false for malformed UUID (wrong segment lengths)', () => {
      const uuid = '550e8400-e29b-41d4-a716-4466554400';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(false);
    });

    it('should return false for UUID with non-hex characters', () => {
      const uuid = '550e8400-e29b-41d4-a716-44665544000g';
      expect(UUIDExtractor.isValidUUID(uuid)).toBe(false);
    });
  });

  describe('extractAll()', () => {
    it('should extract multiple UUIDs from text', () => {
      const text =
        'File 550e8400-e29b-41d4-a716-446655440000 and 123e4567-e89b-42d3-a456-426614174000';
      const result = UUIDExtractor.extractAll(text);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result[1]).toBe('123e4567-e89b-42d3-a456-426614174000');
    });

    it('should return empty array when no UUIDs present', () => {
      const text = 'No UUIDs in this text';
      const result = UUIDExtractor.extractAll(text);
      expect(result).toEqual([]);
    });

    it('should extract single UUID', () => {
      const text = 'Only one: 550e8400-e29b-41d4-a716-446655440000';
      const result = UUIDExtractor.extractAll(text);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return empty array for empty string', () => {
      const result = UUIDExtractor.extractAll('');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-string input', () => {
      const result = UUIDExtractor.extractAll(null as any);
      expect(result).toEqual([]);
    });

    it('should handle UUIDs on multiple lines', () => {
      const text = `Line 1: 550e8400-e29b-41d4-a716-446655440000
Line 2: 123e4567-e89b-42d3-a456-426614174000
Line 3: no uuid`;
      const result = UUIDExtractor.extractAll(text);
      expect(result).toHaveLength(2);
    });

    it('should normalize all UUIDs to lowercase', () => {
      const text = '550E8400-E29B-41D4-A716-446655440000 and 123E4567-E89B-42D3-A456-426614174000';
      const result = UUIDExtractor.extractAll(text);
      expect(result[0]).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result[1]).toBe('123e4567-e89b-42d3-a456-426614174000');
    });
  });

  describe('getPattern()', () => {
    it('should return a RegExp instance', () => {
      const pattern = UUIDExtractor.getPattern();
      expect(pattern).toBeInstanceOf(RegExp);
    });

    it('should return a global and case-insensitive regex', () => {
      const pattern = UUIDExtractor.getPattern();
      expect(pattern.global).toBe(true);
      expect(pattern.ignoreCase).toBe(true);
    });

    it('should match valid UUID v4', () => {
      const pattern = UUIDExtractor.getPattern();
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(pattern.test(uuid)).toBe(true);
    });

    it('should not match invalid UUIDs', () => {
      const pattern = UUIDExtractor.getPattern();
      const uuid = '550e8400-e29b-11d4-a716-446655440000'; // v1
      expect(pattern.test(uuid)).toBe(false);
    });
  });
});
