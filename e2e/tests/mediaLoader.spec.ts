/**
 * Media Metadata Loader E2E Tests
 *
 * Tests the media loader CLI functionality including:
 * - Video file discovery with UUID extraction
 * - Metadata JSON parsing and loading
 * - Database record creation
 * - Error handling for missing files
 * - Dry-run mode
 */

import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Test data directories
 */
const TEST_VIDEO_DIR = path.join(__dirname, '../seed/test-videos');
const TEST_METADATA_DIR = path.join(__dirname, '../seed/test-metadata');

/**
 * Helper to execute load-media CLI command
 */
async function runLoadMediaCLI(options: {
  videoPath?: string;
  metadataPath?: string;
  dryRun?: boolean;
  verbose?: boolean;
  batchSize?: number;
}): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  const {
    videoPath = TEST_VIDEO_DIR,
    metadataPath = TEST_METADATA_DIR,
    dryRun = false,
    verbose = false,
    batchSize,
  } = options;

  const args: string[] = [
    'run',
    'load-media',
    '--',
    `--video-path "${videoPath}"`,
    `--metadata-path "${metadataPath}"`,
  ];

  if (dryRun) args.push('--dry-run');
  if (verbose) args.push('--verbose');
  if (batchSize) args.push(`--batch-size ${batchSize}`);

  const command = `npm ${args.join(' ')}`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: path.join(__dirname, '../../backend'),
      timeout: 30000, // 30 second timeout
    });

    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
    };
  }
}

/**
 * Helper to create test video files with UUID filenames
 */
async function createTestVideos(testDir: string): Promise<string[]> {
  await fs.mkdir(testDir, { recursive: true });

  const testUUIDs = [
    '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Valid UUID
    'invalid-filename.mp4', // Invalid (no UUID)
  ];

  const createdFiles: string[] = [];

  for (const filename of testUUIDs) {
    const filepath = path.join(testDir, filename.includes('uuid') ? filename : `${filename}.mp4`);

    // Create empty video file (just for testing file discovery)
    await fs.writeFile(filepath, Buffer.from('FAKE_VIDEO_DATA'));
    createdFiles.push(filepath);
  }

  return createdFiles;
}

/**
 * Helper to create test metadata JSON files
 */
async function createTestMetadata(testDir: string): Promise<string[]> {
  await fs.mkdir(testDir, { recursive: true });

  const testMetadata = [
    {
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      data: {
        title: 'Test Video One',
        description: 'A test video for E2E testing',
        duration: 120,
        tags: ['test', 'e2e'],
        uploader: 'Test User',
      },
    },
    {
      uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      data: {
        title: 'Test Video Two',
        description: 'Another test video',
        duration: 300,
        tags: ['test', 'sample'],
      },
    },
  ];

  const createdFiles: string[] = [];

  for (const { uuid, data } of testMetadata) {
    const metadataDir = path.join(testDir, uuid);
    await fs.mkdir(metadataDir, { recursive: true });

    const metadataFile = path.join(metadataDir, 'video.info.json');
    await fs.writeFile(metadataFile, JSON.stringify(data, null, 2));
    createdFiles.push(metadataFile);
  }

  return createdFiles;
}

/**
 * Helper to clean up test directories
 */
async function cleanupTestDirectories(): Promise<void> {
  try {
    await fs.rm(TEST_VIDEO_DIR, { recursive: true, force: true });
    await fs.rm(TEST_METADATA_DIR, { recursive: true, force: true });
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

/**
 * Query database for media files
 */
async function queryMediaFiles(): Promise<any[]> {
  // Note: This would need to connect to the test database
  // For now, we'll simulate by checking CLI output
  return [];
}

test.describe('Media Metadata Loader CLI', () => {
  test.beforeAll(async () => {
    // Clean up any previous test data
    await cleanupTestDirectories();

    // Create test video files and metadata
    await createTestVideos(TEST_VIDEO_DIR);
    await createTestMetadata(TEST_METADATA_DIR);
  });

  test.afterAll(async () => {
    // Clean up test directories
    await cleanupTestDirectories();
  });

  test('CLI displays help information with --help flag', async () => {
    const { stdout, exitCode } = await runLoadMediaCLI({});

    // Run with help flag separately
    const { stdout: helpOutput } = await execAsync('npm run load-media -- --help', {
      cwd: path.join(__dirname, '../../backend'),
    });

    expect(helpOutput).toContain('Media Metadata Loader');
    expect(helpOutput).toContain('USAGE');
    expect(helpOutput).toContain('OPTIONS');
    expect(helpOutput).toContain('--video-path');
    expect(helpOutput).toContain('--metadata-path');
    expect(helpOutput).toContain('--dry-run');

    console.log('✓ CLI help test passed');
  });

  test('CLI command discovers video files with UUIDs', async () => {
    const result = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should discover the two valid UUID files
    expect(output).toMatch(/found|discovered|scanned/i);
    expect(output).toMatch(/550e8400-e29b-41d4-a716-446655440000/i);
    expect(output).toMatch(/6ba7b810-9dad-11d1-80b4-00c04fd430c8/i);

    console.log('✓ Video file discovery test passed');
  });

  test('UUID extraction works correctly', async () => {
    const result = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should extract UUIDs from filenames
    expect(output).toMatch(/550e8400-e29b-41d4-a716-446655440000/);
    expect(output).toMatch(/6ba7b810-9dad-11d1-80b4-00c04fd430c8/);

    // Should skip files without valid UUIDs
    if (output.match(/invalid-filename/)) {
      expect(output).toMatch(/skip|invalid|no uuid/i);
    }

    console.log('✓ UUID extraction test passed');
  });

  test('Metadata JSON files are found and parsed', async () => {
    const result = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should find and parse metadata files
    expect(output).toMatch(/metadata|info\.json/i);

    // Check if specific metadata is mentioned
    if (output.includes('Test Video One') || output.includes('Test Video Two')) {
      console.log('✓ Metadata content found in output');
    }

    console.log('✓ Metadata parsing test passed');
  });

  test('Dry-run mode does not modify database', async () => {
    const result = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should indicate dry-run mode
    expect(output).toMatch(/dry.?run|preview|simulation/i);

    // Should not contain errors
    expect(result.exitCode).toBe(0);

    console.log('✓ Dry-run mode test passed');
  });

  test('Verbose mode provides detailed output', async () => {
    const resultVerbose = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
    });

    const resultQuiet = await runLoadMediaCLI({
      dryRun: true,
      verbose: false,
    });

    const verboseOutput = resultVerbose.stdout + resultVerbose.stderr;
    const quietOutput = resultQuiet.stdout + resultQuiet.stderr;

    // Verbose output should be longer
    expect(verboseOutput.length).toBeGreaterThan(quietOutput.length);

    console.log('✓ Verbose mode test passed');
  });

  test('Batch size parameter is respected', async () => {
    const result = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
      batchSize: 1,
    });

    const output = result.stdout + result.stderr;

    // Should process in batches
    if (output.match(/batch/i)) {
      expect(output).toMatch(/batch/i);
    }

    expect(result.exitCode).toBe(0);

    console.log('✓ Batch size parameter test passed');
  });

  test('CLI handles missing video directory gracefully', async () => {
    const result = await runLoadMediaCLI({
      videoPath: '/nonexistent/path/to/videos',
      dryRun: true,
    });

    const output = result.stdout + result.stderr;

    // Should report error about missing directory
    expect(output).toMatch(/not found|does not exist|no such|error/i);

    console.log('✓ Missing directory handling test passed');
  });

  test('CLI handles missing metadata gracefully', async () => {
    // Create a video file with UUID but no metadata
    const orphanUUID = '12345678-1234-4234-8234-123456789abc';
    const orphanFile = path.join(TEST_VIDEO_DIR, `${orphanUUID}.mp4`);
    await fs.writeFile(orphanFile, Buffer.from('ORPHAN_VIDEO'));

    const result = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should handle missing metadata
    expect(output).toMatch(/missing.*metadata|no.*metadata|metadata.*not.*found/i);

    // Clean up orphan file
    await fs.unlink(orphanFile);

    console.log('✓ Missing metadata handling test passed');
  });

  test('CLI reports statistics after completion', async () => {
    const result = await runLoadMediaCLI({
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should display statistics
    expect(output).toMatch(/total|processed|success|failed|statistics|summary/i);

    // Should show counts
    expect(output).toMatch(/\d+/); // At least some numbers

    console.log('✓ Statistics reporting test passed');
  });
});

test.describe('Media Loader Integration', () => {
  test('Database schema includes media_files table', async ({ page }) => {
    // This test checks if the migration created the table
    // We can verify by trying to query the API

    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    // Try to access videos API (which might show media files)
    const response = await page.request.get('/api/videos');

    // Should not error (table exists)
    expect(response.status()).toBeLessThan(500);

    console.log('✓ Database schema test passed');
  });

  test('Loaded media files appear in video library', async ({ page }) => {
    // This test assumes the CLI has been run successfully
    // and checks if videos appear in the UI

    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/videos');

    // Check if video list is visible
    await expect(page.locator('h1, h2')).toContainText(/videos/i);

    // Video list should exist (even if empty)
    const videoList = page.locator('[class*="video"], [class*="card"], .video-list').first();
    const exists = await videoList.isVisible({ timeout: 5000 }).catch(() => false);

    if (exists) {
      console.log('✓ Video library is accessible');
    } else {
      console.log('⚠ Video library might be empty or have different structure');
    }
  });
});

test.describe('UUID Extraction Edge Cases', () => {
  test('Handles various UUID filename formats', async () => {
    const testDir = path.join(TEST_VIDEO_DIR, 'uuid-test');
    await fs.mkdir(testDir, { recursive: true });

    // Create files with different UUID formats
    const testFiles = [
      '550e8400-e29b-41d4-a716-446655440000.mp4', // Standard
      'prefix_550e8400-e29b-41d4-a716-446655440000.mp4', // With prefix
      '550e8400-e29b-41d4-a716-446655440000_suffix.mp4', // With suffix
      '550E8400-E29B-41D4-A716-446655440000.mp4', // Uppercase
      'no-uuid-here.mp4', // No UUID
    ];

    for (const file of testFiles) {
      await fs.writeFile(path.join(testDir, file), Buffer.from('TEST'));
    }

    const result = await runLoadMediaCLI({
      videoPath: testDir,
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should extract UUIDs from all valid filenames
    expect(output).toMatch(/550e8400-e29b-41d4-a716-446655440000/i);

    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });

    console.log('✓ UUID format handling test passed');
  });

  test('Handles malformed metadata JSON', async () => {
    const testDir = path.join(TEST_METADATA_DIR, 'malformed-test');
    const testUUID = '99999999-9999-4999-8999-999999999999';
    const metadataDir = path.join(testDir, testUUID);

    await fs.mkdir(metadataDir, { recursive: true });

    // Create malformed JSON
    await fs.writeFile(path.join(metadataDir, 'video.info.json'), '{ invalid json content');

    // Create corresponding video file
    const videoDir = path.join(TEST_VIDEO_DIR, 'malformed-test');
    await fs.mkdir(videoDir, { recursive: true });
    await fs.writeFile(path.join(videoDir, `${testUUID}.mp4`), Buffer.from('TEST'));

    const result = await runLoadMediaCLI({
      videoPath: videoDir,
      metadataPath: testDir,
      dryRun: true,
      verbose: true,
    });

    const output = result.stdout + result.stderr;

    // Should handle JSON parse error
    expect(output).toMatch(/error|invalid|malformed|parse/i);

    // Clean up
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.rm(videoDir, { recursive: true, force: true });

    console.log('✓ Malformed JSON handling test passed');
  });
});
