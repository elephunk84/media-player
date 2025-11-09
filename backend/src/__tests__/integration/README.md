# Integration Tests

This directory contains integration tests for the Media Player API. These tests use **real database connections** (not mocks) and test the complete HTTP request/response cycle through Express.

## Test Structure

- **auth.integration.test.ts** - Authentication endpoints (register, login, token validation)
- **videos.integration.test.ts** - Video CRUD and search operations
- **clips.integration.test.ts** - Clip creation, metadata management
- **playlists.integration.test.ts** - Playlist CRUD, clip management, reordering
- **userFlow.integration.test.ts** - End-to-end user workflows combining multiple endpoints

## Prerequisites

### Database Setup

Integration tests require a running MySQL or PostgreSQL database. Choose one of the following options:

#### Option 1: Using Docker (Recommended)

```bash
# Start MySQL container
docker run -d \
  --name media-player-test-db \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=media_player_test \
  -p 3306:3306 \
  mysql:8

# Wait for MySQL to be ready
docker exec media-player-test-db mysqladmin ping -h localhost -u root -prootpassword
```

#### Option 2: Using Docker Compose

```bash
# From project root
docker-compose up -d mysql
```

#### Option 3: Local MySQL Installation

Ensure MySQL is running locally and create the test database:

```sql
CREATE DATABASE media_player_test;
```

### Environment Variables

Create a `.env.test` file in the backend directory (already exists):

```env
TEST_DB_TYPE=mysql
TEST_DB_HOST=localhost
TEST_DB_PORT=3306
TEST_DB_NAME=media_player_test
TEST_DB_USER=root
TEST_DB_PASSWORD=rootpassword
JWT_SECRET=test-jwt-secret
NODE_ENV=test
```

## Running Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Test File

```bash
npm test -- auth.integration.test.ts
```

### Run with Coverage

```bash
npm run test:integration:coverage
```

### Run in Watch Mode

```bash
npm run test:integration:watch
```

## Test Features

### Real Database Operations

- Tests connect to actual database (MySQL or PostgreSQL)
- Database schema is created via migrations
- Data is cleaned between tests to ensure isolation

### HTTP Layer Testing

- Tests use Supertest to make real HTTP requests
- Full Express middleware stack is tested
- Request/response validation included

### Authentication Testing

- Tests verify JWT token generation and validation
- Protected routes return 401 without valid token
- Token is passed via Authorization header

### Status Code Verification

- **200 OK** - Successful GET/PATCH/DELETE
- **201 Created** - Successful POST
- **400 Bad Request** - Validation errors
- **401 Unauthorized** - Missing/invalid authentication
- **404 Not Found** - Resource doesn't exist

### Data Cleanup

Each test suite:
1. Connects to test database before all tests
2. Cleans all data between tests (preserves schema)
3. Disconnects after all tests complete

## Test Database

The test database is automatically set up with:
- All tables from the main schema (via migrations)
- Clean state before each test
- Proper foreign key constraints
- Indexes and constraints

### Database Cleanup Strategy

```typescript
// Before each test
beforeEach(async () => {
  await cleanTestDatabase(getTestAdapter());
  // Create fresh test user
  const user = await createTestUser(app);
  authToken = user.token!;
});
```

This ensures:
- No data pollution between tests
- Tests can run in any order
- Parallel execution is safe (with separate databases)

## Helper Utilities

### Test Setup

- `setupTestDatabase()` - Initialize connection and run migrations
- `cleanTestDatabase()` - Remove all data, preserve schema
- `teardownTestDatabase()` - Close connection
- `getTestAdapter()` - Get current database adapter

### Test Data Creation

- `createTestUser()` - Create and authenticate user
- `createTestVideo()` - Insert video directly to database
- `createTestClip()` - Insert clip directly to database
- `createTestPlaylist()` - Insert playlist directly to database
- `authenticatedRequest()` - Make HTTP request with auth token

## Troubleshooting

### Database Connection Issues

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**: Ensure MySQL is running and accessible on configured port

### Migration Errors

```
Error: Table 'users' already exists
```

**Solution**: Drop and recreate the test database:
```bash
mysql -u root -prootpassword -e "DROP DATABASE IF EXISTS media_player_test; CREATE DATABASE media_player_test;"
```

### Timeout Errors

```
Timeout - Async callback was not invoked within the 10000ms timeout
```

**Solution**: Increase Jest timeout in jest.config.js or individual tests:
```typescript
jest.setTimeout(30000); // 30 seconds
```

## CI/CD Integration

For continuous integration environments:

```yaml
# .github/workflows/test.yml
services:
  mysql:
    image: mysql:8
    env:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: media_player_test
    ports:
      - 3306:3306
    options: >-
      --health-cmd="mysqladmin ping"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=5

steps:
  - name: Run Integration Tests
    run: npm run test:integration
    env:
      TEST_DB_HOST: 127.0.0.1
      TEST_DB_PORT: 3306
      TEST_DB_NAME: media_player_test
      TEST_DB_USER: root
      TEST_DB_PASSWORD: rootpassword
```

## Coverage Goals

Integration tests aim for:
- **API endpoint coverage**: 100% of defined routes
- **HTTP status codes**: All success and error scenarios
- **Authentication**: All protected routes tested
- **Data validation**: All input validation rules tested
- **User workflows**: Complete multi-step scenarios

## Best Practices

1. **Use real database** - Don't mock database adapter
2. **Clean between tests** - Ensure test isolation
3. **Test status codes** - Verify HTTP responses
4. **Test authentication** - Check 401 for protected routes
5. **Test validation** - Verify 400 for invalid input
6. **Test workflows** - Include end-to-end scenarios
7. **Use descriptive names** - Clear test descriptions
8. **Verify response structure** - Check response body format
