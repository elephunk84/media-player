# Media Metadata Loader

## Overview

The Media Metadata Loader is a CLI tool that automatically imports video files and their associated metadata into the database. It discovers video files with UUID-based filenames and matches them with corresponding JSON metadata files.

## Key Features

- **UUID-Based File Discovery**: Automatically extracts UUIDs from video filenames
- **Metadata Matching**: Links video files with their `.info.json` metadata files
- **Batch Processing**: Processes files in configurable batches for efficiency
- **Idempotent**: Safe to re-run multiple times without duplicating data
- **Dry-Run Mode**: Preview changes before applying them to the database
- **Transaction Safety**: Uses database transactions to ensure data integrity

## File Structure

The loader expects the following directory structure:

```
/mnt/Videos/
  550e8400-e29b-41d4-a716-446655440000.mp4
  6ba7b810-9dad-11d1-80b4-00c04fd430c8.mkv
  ...

/mnt/Metadata/
  550e8400-e29b-41d4-a716-446655440000/
    video.info.json
  6ba7b810-9dad-11d1-80b4-00c04fd430c8/
    video.info.json
  ...
```

### Supported Video File Formats

- `.mp4` - MPEG-4 Video
- `.mkv` - Matroska Video
- `.avi` - Audio Video Interleave
- `.mov` - QuickTime Movie
- `.webm` - WebM Video
- `.m4v` - MPEG-4 Video (Apple)

### UUID Filename Requirements

Video files must include a valid UUID v4 in the filename. The UUID can appear anywhere in the filename:

**Valid examples:**
- `550e8400-e29b-41d4-a716-446655440000.mp4`
- `prefix_550e8400-e29b-41d4-a716-446655440000.mp4`
- `550e8400-e29b-41d4-a716-446655440000_suffix_1080p.mkv`
- `video-550E8400-E29B-41D4-A716-446655440000.mp4` (case-insensitive)

**Invalid examples:**
- `my-video.mp4` (no UUID)
- `550e8400-e29b-11d4-a716-446655440000.mp4` (not UUID v4 - wrong version)

## Metadata JSON Format

Metadata files should be named `*.info.json` and placed in a directory named after the video's UUID:

```json
{
  "title": "Video Title",
  "description": "Video description text",
  "duration": 120,
  "uploader": "Channel Name",
  "upload_date": "2024-01-15",
  "tags": ["tag1", "tag2", "tag3"],
  "thumbnail": "thumbnail.jpg",
  "resolution": "1920x1080",
  "fps": 30,
  "format": "mp4",
  "filesize": 52428800
}
```

All fields are optional. The loader will store the entire JSON object in the database.

## Usage

### Basic Usage

```bash
# From backend directory
npm run load-media
```

This uses default paths:
- Videos: `/mnt/Videos`
- Metadata: `/mnt/Metadata`

### Command-Line Options

```bash
npm run load-media -- [options]
```

#### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--video-path <path>` | Path to video files directory | `/mnt/Videos` |
| `--metadata-path <path>` | Path to metadata directory | `/mnt/Metadata` |
| `--batch-size <number>` | Files to process per batch | `100` |
| `--dry-run` | Preview without database changes | `false` |
| `--verbose` | Enable detailed logging | `false` |
| `--help`, `-h` | Display help information | - |

### Examples

**Load from custom directories:**
```bash
npm run load-media -- --video-path /data/videos --metadata-path /data/metadata
```

**Dry run to preview changes:**
```bash
npm run load-media -- --dry-run --verbose
```

**Process in smaller batches:**
```bash
npm run load-media -- --batch-size 50
```

**Verbose logging for debugging:**
```bash
npm run load-media -- --verbose
```

## How It Works

### Process Flow

1. **File Discovery**
   - Scans the video directory recursively
   - Finds all supported video file formats
   - Extracts UUIDs from filenames using regex pattern matching

2. **Metadata Matching**
   - For each UUID, looks for corresponding metadata directory
   - Searches for `*.info.json` files in the UUID directory
   - Parses and validates JSON content

3. **Database Operations**
   - Checks if record already exists (by UUID)
   - Inserts new records or updates existing ones
   - Uses transactions for data integrity
   - Reports statistics after completion

4. **Batch Processing**
   - Processes files in configurable batches (default: 100)
   - Each batch runs in a transaction
   - Failed batches are retried individually
   - Progress logging every 10 files or per batch

### UUID Extraction

The loader uses a strict UUID v4 pattern:

```
[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}
```

- **Version**: Must be version 4 (random UUID)
- **Case**: Case-insensitive (normalized to lowercase)
- **Position**: Can appear anywhere in filename
- **Multiple**: If multiple UUIDs exist, first one is used

### Idempotency

The loader is safe to run multiple times:

- Uses UUID as unique identifier
- Updates existing records if metadata has changed
- Skips unchanged records
- No duplicate insertions

## Output and Statistics

After completion, the loader displays statistics:

```
=== Media Loading Statistics ===
Files scanned:        150
Files processed:      145
  - With UUID:        145
  - Without UUID:     5

Metadata status:
  - Found:            140
  - Missing:          5

Database operations:
  - Inserted:         100
  - Updated:          40
  - Unchanged:        5

Processing time:      15.3 seconds
Success rate:         96.7%
```

## Error Handling

The loader handles various error scenarios:

### Missing Video Directory
```
Error: Video directory not found: /mnt/Videos
Please check the path and try again.
```

**Solution**: Verify the directory path exists and is accessible

### Missing Metadata
```
Warning: No metadata found for UUID: 550e8400-e29b-41d4-a716-446655440000
File will be imported without metadata.
```

**Solution**: This is not an error - files without metadata are still imported

### Malformed JSON
```
Error: Failed to parse metadata for UUID: 550e8400-e29b-41d4-a716-446655440000
Invalid JSON in file: /mnt/Metadata/550e8400.../video.info.json
```

**Solution**: Validate and fix the JSON file syntax

### Permission Denied
```
Error: Permission denied reading directory: /mnt/Videos
```

**Solution**: Check file system permissions

## Database Schema

The loader creates/updates records in the `media_files` table:

```sql
CREATE TABLE media_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  absolute_path VARCHAR(1024) NOT NULL,
  file_size BIGINT,
  extension VARCHAR(10),
  metadata_file_path VARCHAR(1024),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_available BOOLEAN DEFAULT TRUE,
  INDEX idx_uuid (uuid),
  INDEX idx_created_at (created_at)
);
```

## Integration with Video Service

Media files loaded by this tool are automatically available in the video library:

1. **API Access**: `/api/media-files` endpoint lists all loaded files
2. **Video Player**: Files can be played directly through the video player
3. **Search**: Metadata is indexed and searchable
4. **Playlists**: Media files can be added to playlists and clips

## Troubleshooting

### No files found

**Check:**
1. Video directory path is correct
2. Files have supported extensions (`.mp4`, `.mkv`, etc.)
3. Filenames contain valid UUID v4

**Debug:**
```bash
npm run load-media -- --verbose --dry-run
```

### Database connection errors

**Check:**
1. Database is running (`docker-compose ps`)
2. Environment variables are set (`.env` file)
3. Database credentials are correct

**Test connection:**
```bash
npm run test:integration
```

### Permission issues

**Check:**
1. Video/metadata directories are readable
2. User has database write permissions

**Fix permissions:**
```bash
chmod -R 755 /mnt/Videos
chmod -R 755 /mnt/Metadata
```

## Performance Considerations

### Large Datasets

For large video libraries (>10,000 files):

1. **Increase batch size:**
   ```bash
   npm run load-media -- --batch-size 500
   ```

2. **Run during off-peak hours** to avoid impacting application performance

3. **Monitor database** for table locks and slow queries

### Network Storage

If videos are on network storage (NFS, SMB):

1. **Use local metadata** directory for better performance
2. **Increase timeout** values in database connection
3. **Consider parallel** processing (future enhancement)

## Advanced Usage

### Production Deployment

Add to crontab for automatic daily imports:

```cron
# Run at 3 AM daily
0 3 * * * cd /app/backend && npm run load-media:prod >> /var/log/media-loader.log 2>&1
```

### Docker Usage

```bash
docker exec media-player-backend npm run load-media:prod
```

### Monitoring

Monitor the log file for errors:

```bash
tail -f /var/log/media-loader.log | grep -i error
```

## API Reference

For programmatic usage, import the service:

```typescript
import { MediaLoaderService } from './services/MediaLoaderService';
import { createDatabaseAdapter } from './adapters/DatabaseAdapter';

const adapter = createDatabaseAdapter();
const service = new MediaLoaderService(adapter, {
  videoPath: '/custom/path',
  metadataPath: '/custom/metadata',
  verbose: true,
  dryRun: false
});

const stats = await service.loadMedia();
console.log('Loaded:', stats.recordsInserted, 'files');
```

## Related Documentation

- [Database Schema](../backend/src/migrations/README.md)
- [File Scanner Utility](../backend/src/utils/FileScanner.ts)
- [UUID Extractor](../backend/src/utils/UUIDExtractor.ts)
- [API Documentation](../API.md)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs with `--verbose` flag
3. Open an issue on GitHub
