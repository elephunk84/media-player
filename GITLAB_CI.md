# GitLab CI/CD Pipeline Documentation

This document explains how to use the GitLab CI/CD pipeline to build and publish Docker images for the Media Player application.

## Overview

The pipeline automatically builds and publishes Docker images to your GitLab Container Registry whenever you push code or create tags. The pipeline consists of four stages:

1. **Test** - Run linting and unit tests
2. **Build** - Build Docker images
3. **Publish** - Push images to GitLab Container Registry
4. **Deploy** - (Optional) Deploy to production

## Prerequisites

### 1. Enable Container Registry

Ensure the Container Registry is enabled for your GitLab project:

1. Go to **Settings** → **General** → **Visibility, project features, permissions**
2. Enable **Container Registry**

### 2. Configure GitLab Runner

Your GitLab instance needs a runner with Docker-in-Docker (dind) support:

- The runner should have the `docker:24-dind` service available
- For self-hosted GitLab, ensure Docker is installed on the runner machine

### 3. Built-in Variables

The pipeline uses GitLab's built-in CI/CD variables (no configuration needed):

- `CI_REGISTRY` - GitLab Container Registry URL
- `CI_REGISTRY_IMAGE` - Full path to your project's registry
- `CI_REGISTRY_USER` - Username for registry authentication
- `CI_REGISTRY_PASSWORD` - Password for registry authentication
- `CI_COMMIT_REF_SLUG` - Branch name (sanitized for use in URLs)
- `CI_COMMIT_SHORT_SHA` - Short commit SHA
- `CI_COMMIT_TAG` - Git tag (if exists)

## Pipeline Behavior

### Branch-based Builds

#### Main/Master Branch
When you push to `main` or `master`:

```bash
git push origin main
```

Images are built and published with tags:
- `latest` - Always points to the most recent main branch build
- `main` - Branch name tag
- `<commit-sha>` - Specific commit identifier

**Registry URLs:**
```
registry.gitlab.com/your-group/media-player/backend:latest
registry.gitlab.com/your-group/media-player/backend:main
registry.gitlab.com/your-group/media-player/backend:a1b2c3d

registry.gitlab.com/your-group/media-player/frontend:latest
registry.gitlab.com/your-group/media-player/frontend:main
registry.gitlab.com/your-group/media-player/frontend:a1b2c3d
```

#### Develop Branch
When you push to `develop`:

```bash
git push origin develop
```

Images are built and published with tags:
- `develop` - Branch name tag
- `<commit-sha>` - Specific commit identifier

**Registry URLs:**
```
registry.gitlab.com/your-group/media-player/backend:develop
registry.gitlab.com/your-group/media-player/backend:a1b2c3d

registry.gitlab.com/your-group/media-player/frontend:develop
registry.gitlab.com/your-group/media-player/frontend:a1b2c3d
```

### Git Tag Releases

To create a versioned release:

```bash
# Create and push a git tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Images are built and published with tags:
- `v1.0.0` - The git tag version
- `<commit-sha>` - Specific commit identifier

**Registry URLs:**
```
registry.gitlab.com/your-group/media-player/backend:v1.0.0
registry.gitlab.com/your-group/media-player/backend:a1b2c3d

registry.gitlab.com/your-group/media-player/frontend:v1.0.0
registry.gitlab.com/your-group/media-player/frontend:a1b2c3d
```

### Merge Requests

For merge requests:
- Tests run automatically
- Images are built but **NOT published** to the registry
- This validates the code without polluting the registry

## Using Published Images

### Pull Images from Registry

First, authenticate with the GitLab Container Registry:

```bash
# Using personal access token (recommended)
docker login registry.gitlab.com
# Username: your-gitlab-username
# Password: your-personal-access-token

# Or using deploy token
docker login registry.gitlab.com -u <deploy-token-username> -p <deploy-token>
```

Then pull images:

```bash
# Pull latest version
docker pull registry.gitlab.com/your-group/media-player/backend:latest
docker pull registry.gitlab.com/your-group/media-player/frontend:latest

# Pull specific version
docker pull registry.gitlab.com/your-group/media-player/backend:v1.0.0
docker pull registry.gitlab.com/your-group/media-player/frontend:v1.0.0

# Pull by commit SHA
docker pull registry.gitlab.com/your-group/media-player/backend:a1b2c3d
docker pull registry.gitlab.com/your-group/media-player/frontend:a1b2c3d
```

### Update Docker Compose for Registry

Create a `docker-compose.registry.yml` to use images from the registry:

```yaml
version: '3.8'

services:
  backend:
    image: registry.gitlab.com/your-group/media-player/backend:latest
    # Remove the 'build' section
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      # ... your environment variables ...
    volumes:
      # ... your volumes ...

  frontend:
    image: registry.gitlab.com/your-group/media-player/frontend:latest
    # Remove the 'build' section
    ports:
      - "${FRONTEND_PORT:-80}:80"
    environment:
      # ... your environment variables ...
```

Run with:

```bash
docker-compose -f docker-compose.registry.yml up -d
```

## Personal Access Tokens

To pull images from the registry, you need authentication. Create a Personal Access Token:

1. Go to **GitLab** → **User Settings** → **Access Tokens**
2. Create a new token with `read_registry` scope
3. Save the token securely

Use it to login:

```bash
docker login registry.gitlab.com -u your-username -p your-token
```

## Deploy Tokens (Recommended for Production)

For production deployments, use deploy tokens instead of personal access tokens:

1. Go to **Settings** → **Repository** → **Deploy tokens**
2. Create a token with `read_registry` scope
3. Save the username and token

Use it to login:

```bash
docker login registry.gitlab.com -u <deploy-token-username> -p <deploy-token>
```

## Viewing Pipeline Status

Monitor your pipeline:

1. Go to **CI/CD** → **Pipelines** in your GitLab project
2. Click on a pipeline to see individual jobs
3. Click on a job to see its logs

## Viewing Published Images

View your published images:

1. Go to **Packages & Registries** → **Container Registry**
2. You'll see all published images with their tags
3. Click on an image to see available tags and pull commands

## Troubleshooting

### Pipeline Fails During Build

Check the job logs:
1. Go to **CI/CD** → **Pipelines**
2. Click on the failed pipeline
3. Click on the failed job to see error logs

Common issues:
- **Runner not available**: Configure a GitLab Runner for your project
- **Docker daemon not available**: Runner needs Docker-in-Docker support
- **Build errors**: Fix code issues in backend/frontend

### Cannot Pull Images

Common solutions:
- Ensure you're logged in: `docker login registry.gitlab.com`
- Verify your token has `read_registry` scope
- Check the image name and tag exist in the Container Registry
- Ensure Container Registry is enabled for the project

### Permission Denied

If you get "permission denied" errors:
- Your token may have expired - create a new one
- Your user may not have access to the project - check project permissions
- For deploy tokens, ensure they haven't expired

## Advanced Configuration

### Custom Pipeline Triggers

You can manually trigger pipelines:

1. Go to **CI/CD** → **Pipelines**
2. Click **Run pipeline**
3. Select the branch or tag
4. Optionally add custom variables

### Deployment Stage

The pipeline includes a commented-out deployment stage. To enable it:

1. Uncomment the `deploy:production` job in `.gitlab-ci.yml`
2. Add required CI/CD variables in **Settings** → **CI/CD** → **Variables**:
   - `SSH_PRIVATE_KEY` - SSH key for deployment server
   - `DEPLOY_SERVER` - Server hostname/IP
   - `DEPLOY_USER` - SSH username
3. Customize the deployment script for your infrastructure

### Environment-specific Builds

To build for different environments, add variables to the pipeline:

```yaml
build:backend:staging:
  extends: .build_backend
  variables:
    BUILD_ENV: staging
  only:
    - develop
```

## Best Practices

1. **Use Git Tags for Releases**: Create semantic version tags (`v1.0.0`, `v1.1.0`) for production releases
2. **Never Use :latest in Production**: Always pin to specific versions (`v1.0.0`) or commit SHAs
3. **Protect Main Branch**: Configure branch protection to require merge requests
4. **Use Deploy Tokens**: For production, use deploy tokens instead of personal tokens
5. **Monitor Registry Size**: Regularly clean up old unused images to save space
6. **Review Before Merge**: Always review merge request pipelines before merging

## Registry Cleanup

GitLab automatically runs cleanup policies for Container Registry. Configure them:

1. Go to **Settings** → **Packages & Registries** → **Container Registry**
2. Set cleanup rules (e.g., keep last 10 tags, delete tags older than 90 days)

Manual cleanup:

```bash
# List all tags for an image
curl -u username:token \
  "https://registry.gitlab.com/v2/your-group/media-player/backend/tags/list"

# Delete a specific tag (requires maintainer role)
curl -X DELETE -u username:token \
  "https://registry.gitlab.com/v2/your-group/media-player/backend/manifests/<tag-digest>"
```

## Additional Resources

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [GitLab Container Registry Documentation](https://docs.gitlab.com/ee/user/packages/container_registry/)
- [Docker-in-Docker Service](https://docs.gitlab.com/ee/ci/docker/using_docker_build.html)
- [Deploy Tokens](https://docs.gitlab.com/ee/user/project/deploy_tokens/)
