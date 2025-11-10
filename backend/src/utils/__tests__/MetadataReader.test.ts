/**
 * MetadataReader Unit Tests
 *
 * Tests for the MetadataReader utility class that finds and reads
 * metadata JSON files associated with video files.
 */

import { MetadataReader } from '../MetadataReader';
import fs from 'fs/promises';
import path from 'path';

// Mock fs/promises
jest.mock('fs/promises');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('MetadataReader', () => {
  let reader: MetadataReader;
  const basePath = '/mnt/Metadata';

  beforeEach(() => {
    reader = new MetadataReader(basePath);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with base path', () => {
      const customReader = new MetadataReader('/custom/path');
      expect(customReader.getBasePath()).toBe('/custom/path');
    });
  });

  describe('findMetadataFile()', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const uuidDir = path.join(basePath, uuid);

    it('should find .info.json file in UUID directory', async () => {
      // Mock directory exists and is a directory
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);

      // Mock readdir returns .info.json file
      mockedFs.readdir.mockResolvedValue(['video.info.json', 'other.txt'] as any);

      const result = await reader.findMetadataFile(uuid);

      expect(result).toBe(path.join(uuidDir, 'video.info.json'));
      expect(mockedFs.stat).toHaveBeenCalledWith(uuidDir);
      expect(mockedFs.readdir).toHaveBeenCalledWith(uuidDir);
    });

    it('should return null when directory does not exist', async () => {
      mockedFs.stat.mockRejectedValue({ code: 'ENOENT' });

      const result = await reader.findMetadataFile(uuid);

      expect(result).toBeNull();
    });

    it('should return null when path exists but is not a directory', async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => false,
      } as any);

      const result = await reader.findMetadataFile(uuid);

      expect(result).toBeNull();
    });

    it('should return null when no .info.json file found', async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);

      mockedFs.readdir.mockResolvedValue(['other.txt', 'data.json'] as any);

      const result = await reader.findMetadataFile(uuid);

      expect(result).toBeNull();
    });

    it('should return first .info.json file when multiple exist', async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);

      mockedFs.readdir.mockResolvedValue([
        'video.info.json',
        'metadata.info.json',
        'other.txt',
      ] as any);

      const result = await reader.findMetadataFile(uuid);

      expect(result).toBe(path.join(uuidDir, 'video.info.json'));
    });

    it('should handle readdir errors gracefully', async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);

      mockedFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const result = await reader.findMetadataFile(uuid);

      expect(result).toBeNull();
    });
  });

  describe('readMetadata()', () => {
    const filePath = '/mnt/Metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json';

    it('should read and parse valid JSON file', async () => {
      const metadata = { title: 'Test Video', duration: 120 };
      mockedFs.readFile.mockResolvedValue(JSON.stringify(metadata));

      const result = await reader.readMetadata(filePath);

      expect(result).toEqual(metadata);
      expect(mockedFs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should throw error when file does not exist', async () => {
      mockedFs.readFile.mockRejectedValue({ code: 'ENOENT' });

      await expect(reader.readMetadata(filePath)).rejects.toThrow('Metadata file not found');
    });

    it('should throw error for invalid JSON', async () => {
      mockedFs.readFile.mockResolvedValue('{ invalid json }');

      await expect(reader.readMetadata(filePath)).rejects.toThrow('Invalid JSON in metadata file');
    });

    it('should throw error for permission denied', async () => {
      mockedFs.readFile.mockRejectedValue({ code: 'EACCES' });

      await expect(reader.readMetadata(filePath)).rejects.toThrow('Permission denied');
    });

    it('should handle empty JSON object', async () => {
      mockedFs.readFile.mockResolvedValue('{}');

      const result = await reader.readMetadata(filePath);

      expect(result).toEqual({});
    });

    it('should handle complex nested JSON', async () => {
      const metadata = {
        title: 'Test Video',
        tags: ['tag1', 'tag2'],
        nested: { field: 'value', array: [1, 2, 3] },
      };
      mockedFs.readFile.mockResolvedValue(JSON.stringify(metadata));

      const result = await reader.readMetadata(filePath);

      expect(result).toEqual(metadata);
    });

    it('should throw error for generic read errors', async () => {
      mockedFs.readFile.mockRejectedValue(new Error('Disk error'));

      await expect(reader.readMetadata(filePath)).rejects.toThrow('Failed to read metadata file');
    });
  });

  describe('getMetadataForUUID()', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const uuidDir = path.join(basePath, uuid);
    const filePath = path.join(uuidDir, 'video.info.json');

    it('should return metadata when file exists and is valid', async () => {
      const metadata = { title: 'Test Video', duration: 120 };

      // Mock findMetadataFile
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdir.mockResolvedValue(['video.info.json'] as any);

      // Mock readMetadata
      mockedFs.readFile.mockResolvedValue(JSON.stringify(metadata));

      const result = await reader.getMetadataForUUID(uuid);

      expect(result.exists).toBe(true);
      expect(result.filePath).toBe(filePath);
      expect(result.content).toEqual(metadata);
      expect(result.error).toBeUndefined();
    });

    it('should return error info when file not found', async () => {
      mockedFs.stat.mockRejectedValue({ code: 'ENOENT' });

      const result = await reader.getMetadataForUUID(uuid);

      expect(result.exists).toBe(false);
      expect(result.filePath).toBe('');
      expect(result.content).toBeUndefined();
      expect(result.error).toBe('No metadata file found');
    });

    it('should return error info when JSON is invalid', async () => {
      // Mock findMetadataFile success
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdir.mockResolvedValue(['video.info.json'] as any);

      // Mock readMetadata failure (invalid JSON)
      mockedFs.readFile.mockResolvedValue('{ invalid json }');

      const result = await reader.getMetadataForUUID(uuid);

      expect(result.exists).toBe(true);
      expect(result.filePath).toBe(filePath);
      expect(result.content).toBeUndefined();
      expect(result.error).toContain('Invalid JSON');
    });

    it('should return error info when permission denied', async () => {
      // Mock findMetadataFile success
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdir.mockResolvedValue(['video.info.json'] as any);

      // Mock readMetadata failure (permission denied)
      mockedFs.readFile.mockRejectedValue({ code: 'EACCES' });

      const result = await reader.getMetadataForUUID(uuid);

      expect(result.exists).toBe(true);
      expect(result.error).toContain('Permission denied');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockedFs.stat.mockRejectedValue(new Error('Unexpected error'));

      const result = await reader.getMetadataForUUID(uuid);

      expect(result.exists).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });

  describe('hasMetadata()', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should return true when metadata file exists', async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdir.mockResolvedValue(['video.info.json'] as any);

      const result = await reader.hasMetadata(uuid);

      expect(result).toBe(true);
    });

    it('should return false when metadata file does not exist', async () => {
      mockedFs.stat.mockRejectedValue({ code: 'ENOENT' });

      const result = await reader.hasMetadata(uuid);

      expect(result).toBe(false);
    });

    it('should return false when directory exists but no .info.json', async () => {
      mockedFs.stat.mockResolvedValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdir.mockResolvedValue(['other.txt'] as any);

      const result = await reader.hasMetadata(uuid);

      expect(result).toBe(false);
    });
  });

  describe('getMetadataDirectory()', () => {
    it('should return expected directory path', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = reader.getMetadataDirectory(uuid);

      expect(result).toBe(path.join(basePath, uuid));
    });

    it('should work with different UUIDs', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000';
      const result = reader.getMetadataDirectory(uuid);

      expect(result).toBe(path.join(basePath, uuid));
    });
  });

  describe('getBasePath()', () => {
    it('should return the base path', () => {
      const result = reader.getBasePath();
      expect(result).toBe(basePath);
    });

    it('should return custom base path', () => {
      const customReader = new MetadataReader('/custom/metadata');
      expect(customReader.getBasePath()).toBe('/custom/metadata');
    });
  });
});
