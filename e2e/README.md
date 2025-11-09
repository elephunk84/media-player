# E2E Testing Guide

This directory contains end-to-end tests for the Media Player application using Playwright.

## Overview

The E2E test suite covers critical user workflows including:

- **Authentication**: Login, logout, session persistence
- **Video Browsing**: Library navigation, search, filtering, playback
- **Clip Creation**: Creating clips from videos using UI controls
- **Playlist Management**: Creating playlists, adding/removing clips, drag-and-drop reordering
- **Complete User Journeys**: Full workflows from login to content consumption

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ installed
- FFmpeg installed (for creating test videos)

## Quick Start

### 1. Create Test Videos

```bash
npm run e2e:setup
```

This creates small test video files in `e2e/test-videos/`.

### 2. Start Test Environment

```bash
npm run e2e:start
```

This starts the test environment with:
- MySQL test database (port 3307)
- Backend API (port 3001)
- Frontend (port 80)

### 3. Run E2E Tests

```bash
npm run test:e2e
```

## Test Scripts

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run all E2E tests headlessly |
| `npm run test:e2e:ui` | Run tests with Playwright UI mode |
| `npm run test:e2e:headed` | Run tests in headed browser (visible) |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:report` | Show HTML test report |
| `npm run e2e:setup` | Create test video files |
| `npm run e2e:start` | Start test environment |
| `npm run e2e:stop` | Stop test environment |
| `npm run e2e:logs` | View test environment logs |

## Test Structure

```
e2e/
├── tests/
│   ├── auth.spec.ts           # Authentication tests
│   ├── videos.spec.ts          # Video browsing and playback tests
│   ├── clips.spec.ts           # Clip creation and management tests
│   ├── playlists.spec.ts       # Playlist management and drag-drop tests
│   └── user-journey.spec.ts    # Complete user workflow tests
├── helpers/
│   └── auth.ts                 # Authentication helper utilities
├── seed/
│   ├── init-db.sql            # Test database seed data
│   └── create-test-videos.sh  # Script to create test videos
└── test-videos/                # Test video files (created by setup script)
```

## Test Data

The test database is seeded with:

- **User**: `testuser` / `testpass123`
- **Videos**: 3 test videos (Test Video 1, Test Video 2, Sample Documentary)
- **Clips**: 3 test clips from the videos
- **Playlists**: 2 test playlists with clips

## Writing New Tests

### Using Auth Helper

```typescript
import { test, expect } from '@playwright/test';
import { login, logout } from '../helpers/auth';

test('my test', async ({ page }) => {
  await login(page);
  // Your test code here
  await logout(page);
});
```

### Test Best Practices

1. **Use Accessible Selectors**: Prefer role-based and text-based selectors
   ```typescript
   page.locator('button:has-text("Login")')
   page.locator('input[name="username"]')
   ```

2. **Wait for Elements**: Use Playwright's auto-waiting
   ```typescript
   await expect(page.locator('text=Videos')).toBeVisible();
   ```

3. **Test Real User Behavior**: Simulate actual user interactions
   ```typescript
   await page.fill('input[name="username"]', 'testuser');
   await page.click('button[type="submit"]');
   ```

4. **Verify UI State**: Check that UI elements are visible and interactive
   ```typescript
   await expect(videoPlayer).toBeVisible();
   await expect(playButton).not.toBeDisabled();
   ```

5. **Clean Up**: Tests should be independent and not affect each other
   - Database is reset between test runs via tmpfs volume
   - Each test should clean up any created data

## Test Environment Details

### Docker Compose Configuration

The `docker-compose.e2e.yml` file sets up:

- **mysql-test**: MySQL 8 database with seed data
  - Uses tmpfs for faster tests
  - Seeds data from `e2e/seed/init-db.sql`
  - Port: 3307 (to avoid conflicts)

- **backend-test**: Backend API in test mode
  - Connected to test database
  - Port: 3001
  - Test video files mounted from `e2e/test-videos/`

- **frontend-test**: Frontend application
  - Configured to use backend-test API
  - Port: 80

### Database Schema

Tables created and seeded:
- `users` - User accounts
- `videos` - Video library
- `clips` - Video clips
- `playlists` - Playlist metadata
- `playlist_clips` - Playlist-clip relationships

## Continuous Integration

### Running in CI/CD

```bash
# In CI environment
docker-compose -f docker-compose.e2e.yml up -d
npx playwright install --with-deps chromium
npm run test:e2e
docker-compose -f docker-compose.e2e.yml down
```

### CI Configuration Example (GitHub Actions)

```yaml
- name: Setup test videos
  run: npm run e2e:setup

- name: Start test environment
  run: npm run e2e:start

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging Tests

### Visual Debugging

```bash
npm run test:e2e:headed
```

### Step-by-Step Debugging

```bash
npm run test:e2e:debug
```

### View Test Report

```bash
npm run test:e2e:report
```

### Check Test Environment Logs

```bash
npm run e2e:logs
```

## Troubleshooting

### Tests Timeout

- Increase timeout in `playwright.config.ts`
- Check if test environment is healthy: `docker ps`
- View logs: `npm run e2e:logs`

### Database Connection Issues

```bash
# Check if MySQL is running
docker ps | grep mysql-test

# View MySQL logs
docker logs media-player-mysql-test
```

### Frontend Not Loading

```bash
# Check frontend logs
docker logs media-player-frontend-test

# Check if port 80 is available
lsof -i :80
```

### Backend API Issues

```bash
# Check backend logs
docker logs media-player-backend-test

# Test API directly
curl http://localhost:3001/health
```

## Test Coverage

Current test coverage includes:

- ✅ User authentication (login, logout, session)
- ✅ Video library browsing
- ✅ Video search and filtering
- ✅ Video playback
- ✅ Clip creation from videos
- ✅ Clip metadata editing
- ✅ Playlist creation and management
- ✅ Playlist clip reordering (drag-and-drop)
- ✅ Complete user journeys (5 scenarios)
- ✅ Protected route access control
- ✅ Error handling

## Performance

Test execution time: ~2-3 minutes for full suite

- Setup: ~30 seconds (container startup)
- Test execution: ~90-120 seconds
- Teardown: ~10 seconds

## Maintenance

### Updating Seed Data

Edit `e2e/seed/init-db.sql` to modify test data.

### Adding New Test Videos

Edit `e2e/seed/create-test-videos.sh` to add more test videos.

### Cleaning Up

```bash
# Stop and remove test environment
npm run e2e:stop

# Remove test videos
rm -rf e2e/test-videos/*

# Clean up Docker volumes
docker volume prune
```

## References

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
