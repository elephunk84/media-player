# Docker Secrets Directory

This directory contains sensitive configuration files used by Docker Compose secrets.

## Required Files

Create the following files in this directory before deploying to production:

### 1. db_root_password.txt
MySQL root password (single line, no newline)

```bash
echo -n "your-strong-root-password" > db_root_password.txt
```

### 2. db_password.txt
MySQL user password (single line, no newline)

```bash
echo -n "your-strong-user-password" > db_password.txt
```

### 3. jwt_secret.txt
JWT signing secret (single line, no newline)

```bash
echo -n "your-long-random-jwt-secret" > jwt_secret.txt
```

## Quick Setup Script

Run this script to generate strong random secrets:

```bash
# Generate random secrets
openssl rand -base64 32 | tr -d '\n' > db_root_password.txt
openssl rand -base64 32 | tr -d '\n' > db_password.txt
openssl rand -base64 64 | tr -d '\n' > jwt_secret.txt

# Set proper permissions
chmod 600 db_root_password.txt db_password.txt jwt_secret.txt
```

## Security Notes

- **NEVER** commit these files to git (they're in .gitignore)
- Use strong, random passwords (at least 32 characters)
- Restrict file permissions to 600 (owner read/write only)
- Rotate secrets periodically
- Use different secrets for each environment (dev, staging, prod)
- Back up secrets securely (encrypted storage)

## File Format

All secret files should:
- Contain a single line
- Have no trailing newline
- Use strong random values
- Have 600 permissions (read/write for owner only)

## Verification

Verify your secrets are formatted correctly:

```bash
# Check for trailing newlines (should show no output)
od -An -tx1 db_root_password.txt | tail -1 | grep -o '0a'

# Verify length (should be at least 32 characters for passwords)
wc -c < db_root_password.txt
```

## Using in Backend Code

The backend reads secrets from files specified in environment variables:

```typescript
const dbPassword = fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim();
const jwtSecret = fs.readFileSync(process.env.JWT_SECRET_FILE, 'utf8').trim();
```

## Production Deployment Checklist

- [ ] Generate strong random secrets
- [ ] Set file permissions to 600
- [ ] Verify no trailing newlines
- [ ] Test database connection with secrets
- [ ] Verify JWT token generation
- [ ] Back up secrets securely
- [ ] Document secret rotation procedure
