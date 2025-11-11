/**
 * MediaLoaderService Unit Tests
 *
 * Tests for the MediaLoaderService that orchestrates loading video files
 * and their metadata into the database.
 */

import { MediaLoaderService } from '../MediaLoaderService';
import { DatabaseAdapter } from '../../adapters/DatabaseAdapter';
import { FileScanner, ScannedFile } from '../../utils/FileScanner';
import { MetadataReader } from '../../utils/MetadataReader';

// Mock dependencies
jest.mock('../../utils/FileScanner');
jest.mock('../../utils/MetadataReader');

const MockedFileScanner = FileScanner as jest.MockedClass<typeof FileScanner>;
const MockedMetadataReader = MetadataReader as jest.MockedClass<typeof MetadataReader>;

describe('MediaLoaderService', () => {
  let service: MediaLoaderService;
  let mockAdapter: jest.Mocked<DatabaseAdapter>;
  let mockFileScanner: jest.Mocked<FileScanner>;
  let mockMetadataReader: jest.Mocked<MetadataReader>;

  beforeEach(() => {
    // Create mock adapter
    mockAdapter = {
      query: jest.fn(),
      execute: jest.fn(),
      close: jest.fn(),
    } as any;

    // Clear all mock instances
    MockedFileScanner.mockClear();
    MockedMetadataReader.mockClear();

    // Create service
    service = new MediaLoaderService(mockAdapter, {
      videoPath: '/test/videos',
      metadataPath: '/test/metadata',
      verbose: false,
      dryRun: false,
    });

    // Get mocked instances
    mockFileScanner = MockedFileScanner.mock.instances[0] as any;
    mockMetadataReader = MockedMetadataReader.mock.instances[0] as any;
  });

  describe('constructor', () => {
    it('should create service with default options', () => {
      const defaultService = new MediaLoaderService(mockAdapter);
      expect(defaultService).toBeInstanceOf(MediaLoaderService);
    });

    it('should create service with custom options', () => {
      const customService = new MediaLoaderService(mockAdapter, {
        videoPath: '/custom/videos',
        metadataPath: '/custom/metadata',
        batchSize: 50,
        verbose: true,
        dryRun: true,
      });
      expect(customService).toBeInstanceOf(MediaLoaderService);
    });
  });

  describe('loadMedia()', () => {
    it('should process files successfully', async () => {
      const scannedFiles: ScannedFile[] = [
        {
          absolutePath: '/test/videos/550e8400-e29b-41d4-a716-446655440000.mp4',
          relativePath: '550e8400-e29b-41d4-a716-446655440000.mp4',
          fileSize: 1024000,
          extension: '.mp4',
          modifiedAt: new Date(),
        },
      ];

      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);
      mockMetadataReader.getMetadataForUUID = jest.fn().mockResolvedValue({
        exists: true,
        filePath: '/test/metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json',
        content: { title: 'Test Video' },
      });

      // Mock database - no existing record
      mockAdapter.query.mockResolvedValue([]);

      // Mock insert
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 } as any);

      const stats = await service.loadMedia();

      expect(stats.filesScanned).toBe(1);
      expect(stats.filesProcessed).toBe(1);
      expect(stats.filesWithUUID).toBe(1);
      expect(stats.filesWithMetadata).toBe(1);
      expect(stats.recordsInserted).toBe(1);
      expect(stats.errors).toBe(0);
    });

    it('should handle files without UUIDs', async () => {
      const scannedFiles: ScannedFile[] = [
        {
          absolutePath: '/test/videos/no-uuid-file.mp4',
          relativePath: 'no-uuid-file.mp4',
          fileSize: 1024000,
          extension: '.mp4',
          modifiedAt: new Date(),
        },
      ];

      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);

      const stats = await service.loadMedia();

      expect(stats.filesScanned).toBe(1);
      expect(stats.filesProcessed).toBe(1);
      expect(stats.filesWithoutUUID).toBe(1);
      expect(stats.recordsInserted).toBe(0);
    });

    it('should handle files without metadata', async () => {
      const scannedFiles: ScannedFile[] = [
        {
          absolutePath: '/test/videos/550e8400-e29b-41d4-a716-446655440000.mp4',
          relativePath: '550e8400-e29b-41d4-a716-446655440000.mp4',
          fileSize: 1024000,
          extension: '.mp4',
          modifiedAt: new Date(),
        },
      ];

      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);
      mockMetadataReader.getMetadataForUUID = jest.fn().mockResolvedValue({
        exists: false,
        filePath: '',
        error: 'No metadata file found',
      });

      // Mock database - no existing record
      mockAdapter.query.mockResolvedValue([]);

      // Mock insert
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 } as any);

      const stats = await service.loadMedia();

      expect(stats.filesWithoutMetadata).toBe(1);
      expect(stats.recordsInserted).toBe(1); // Should still insert without metadata
    });

    it('should update existing records when changed', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const scannedFiles: ScannedFile[] = [
        {
          absolutePath: `/test/videos/${uuid}.mp4`,
          relativePath: `${uuid}.mp4`,
          fileSize: 2048000, // Different size
          extension: '.mp4',
          modifiedAt: new Date(),
        },
      ];

      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);
      mockMetadataReader.getMetadataForUUID = jest.fn().mockResolvedValue({
        exists: true,
        filePath: `/test/metadata/${uuid}/video.info.json`,
        content: { title: 'Updated Video' },
      });

      // Mock existing record with different metadata
      mockAdapter.query.mockResolvedValue([
        {
          uuid,
          file_path: `${uuid}.mp4`,
          file_name: `${uuid}.mp4`,
          file_size: 1024000, // Different from scanned
          file_extension: '.mp4',
          metadata: JSON.stringify({ title: 'Old Title' }),
          metadata_file_path: `/test/metadata/${uuid}/video.info.json`,
          created_at: new Date(),
          updated_at: new Date(),
          last_scanned_at: new Date(),
        },
      ]);

      // Mock update
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 } as any);

      const stats = await service.loadMedia();

      expect(stats.recordsUpdated).toBe(1);
      expect(stats.recordsInserted).toBe(0);
    });

    it('should not update unchanged records', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const metadata = { title: 'Test Video' };
      const scannedFiles: ScannedFile[] = [
        {
          absolutePath: `/test/videos/${uuid}.mp4`,
          relativePath: `${uuid}.mp4`,
          fileSize: 1024000,
          extension: '.mp4',
          modifiedAt: new Date(),
        },
      ];

      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);
      mockMetadataReader.getMetadataForUUID = jest.fn().mockResolvedValue({
        exists: true,
        filePath: `/test/metadata/${uuid}/video.info.json`,
        content: metadata,
      });

      // Mock existing record with same data
      mockAdapter.query.mockResolvedValue([
        {
          uuid,
          file_path: `${uuid}.mp4`,
          file_name: `${uuid}.mp4`,
          file_size: 1024000,
          file_extension: '.mp4',
          metadata: JSON.stringify(metadata),
          metadata_file_path: `/test/metadata/${uuid}/video.info.json`,
          created_at: new Date(),
          updated_at: new Date(),
          last_scanned_at: new Date(),
        },
      ]);

      // Mock timestamp update only
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 } as any);

      const stats = await service.loadMedia();

      expect(stats.recordsUnchanged).toBe(1);
      expect(stats.recordsUpdated).toBe(0);
    });

    it('should handle dry run mode', async () => {
      const dryRunService = new MediaLoaderService(mockAdapter, {
        videoPath: '/test/videos',
        metadataPath: '/test/metadata',
        dryRun: true,
      });

      // Replace mocked instances for dryRunService
      const dryRunScanner = MockedFileScanner.mock.instances[
        MockedFileScanner.mock.instances.length - 1
      ] as any;
      const dryRunReader = MockedMetadataReader.mock.instances[
        MockedMetadataReader.mock.instances.length - 1
      ] as any;

      const scannedFiles: ScannedFile[] = [
        {
          absolutePath: '/test/videos/550e8400-e29b-41d4-a716-446655440000.mp4',
          relativePath: '550e8400-e29b-41d4-a716-446655440000.mp4',
          fileSize: 1024000,
          extension: '.mp4',
          modifiedAt: new Date(),
        },
      ];

      dryRunScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);
      dryRunReader.getMetadataForUUID = jest.fn().mockResolvedValue({
        exists: true,
        filePath: '/test/metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json',
        content: { title: 'Test Video' },
      });

      mockAdapter.query.mockResolvedValue([]);

      const stats = await dryRunService.loadMedia();

      expect(stats.recordsInserted).toBe(1);
      expect(mockAdapter.execute).not.toHaveBeenCalled(); // No DB writes in dry run
    });

    it('should handle empty directory', async () => {
      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue([]);

      const stats = await service.loadMedia();

      expect(stats.filesScanned).toBe(0);
      expect(stats.filesProcessed).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      const scannedFiles: ScannedFile[] = [
        {
          absolutePath: '/test/videos/550e8400-e29b-41d4-a716-446655440000.mp4',
          relativePath: '550e8400-e29b-41d4-a716-446655440000.mp4',
          fileSize: 1024000,
          extension: '.mp4',
          modifiedAt: new Date(),
        },
      ];

      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);
      mockMetadataReader.getMetadataForUUID = jest.fn().mockResolvedValue({
        exists: true,
        filePath: '/test/metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json',
        content: { title: 'Test Video' },
      });

      // Mock database error
      mockAdapter.query.mockRejectedValue(new Error('Database error'));

      const stats = await service.loadMedia();

      expect(stats.errors).toBe(1);
      expect(stats.errorMessages.length).toBeGreaterThan(0);
    });

    it('should process multiple files in batches', async () => {
      const scannedFiles: ScannedFile[] = Array.from({ length: 150 }, (_, i) => ({
        absolutePath: `/test/videos/file-${i}-550e8400-e29b-41d4-a716-446655440000.mp4`,
        relativePath: `file-${i}-550e8400-e29b-41d4-a716-446655440000.mp4`,
        fileSize: 1024000,
        extension: '.mp4',
        modifiedAt: new Date(),
      }));

      mockFileScanner.scanDirectory = jest.fn().mockResolvedValue(scannedFiles);
      mockMetadataReader.getMetadataForUUID = jest.fn().mockResolvedValue({
        exists: true,
        filePath: '/test/metadata/550e8400-e29b-41d4-a716-446655440000/video.info.json',
        content: { title: 'Test Video' },
      });

      mockAdapter.query.mockResolvedValue([]);
      mockAdapter.execute.mockResolvedValue({ affectedRows: 1 } as any);

      const stats = await service.loadMedia();

      expect(stats.filesScanned).toBe(150);
      expect(stats.filesProcessed).toBe(150);
    });
  });

  describe('getMediaFileByUUID()', () => {
    it('should return media file when found', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockAdapter.query.mockResolvedValue([
        {
          uuid,
          file_path: `${uuid}.mp4`,
          file_name: `${uuid}.mp4`,
          file_size: 1024000,
          file_extension: '.mp4',
          metadata: JSON.stringify({ title: 'Test Video' }),
          metadata_file_path: `/test/metadata/${uuid}/video.info.json`,
          created_at: new Date(),
          updated_at: new Date(),
          last_scanned_at: new Date(),
        },
      ]);

      const result = await service.getMediaFileByUUID(uuid);

      expect(result).not.toBeNull();
      expect(result?.uuid).toBe(uuid);
    });

    it('should return null when not found', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await service.getMediaFileByUUID('non-existent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('getAllMediaFiles()', () => {
    it('should return all media files', async () => {
      mockAdapter.query.mockResolvedValue([
        {
          uuid: '550e8400-e29b-41d4-a716-446655440000',
          file_path: 'file1.mp4',
          file_name: 'file1.mp4',
          file_size: 1024000,
          file_extension: '.mp4',
          metadata: null,
          metadata_file_path: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_scanned_at: new Date(),
        },
      ]);

      const result = await service.getAllMediaFiles();

      expect(result).toHaveLength(1);
    });

    it('should support limit and offset', async () => {
      mockAdapter.query.mockResolvedValue([]);

      await service.getAllMediaFiles(10, 20);

      expect(mockAdapter.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10, 20])
      );
    });
  });

  describe('getMediaFileCount()', () => {
    it('should return count of media files', async () => {
      mockAdapter.query.mockResolvedValue([{ count: 42 }]);

      const result = await service.getMediaFileCount();

      expect(result).toBe(42);
    });

    it('should return 0 when no records', async () => {
      mockAdapter.query.mockResolvedValue([]);

      const result = await service.getMediaFileCount();

      expect(result).toBe(0);
    });
  });
});
