#!/bin/bash
# Create test video files for E2E testing

set -e

OUTPUT_DIR="/home/user/media-player/e2e/test-videos"
mkdir -p "$OUTPUT_DIR"

echo "Creating test video files..."

# Create test-video-1.mp4 (120 seconds, 1920x1080)
ffmpeg -f lavfi -i testsrc=duration=120:size=1920x1080:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=120 \
  -c:v libx264 -preset ultrafast -c:a aac \
  -y "$OUTPUT_DIR/test-video-1.mp4" 2>/dev/null

echo "Created test-video-1.mp4"

# Create test-video-2.mp4 (180 seconds, 1280x720)
ffmpeg -f lavfi -i testsrc=duration=180:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=800:duration=180 \
  -c:v libx264 -preset ultrafast -c:a aac \
  -y "$OUTPUT_DIR/test-video-2.mp4" 2>/dev/null

echo "Created test-video-2.mp4"

# Create test-video-3.mp4 (300 seconds, 1920x1080)
ffmpeg -f lavfi -i testsrc=duration=300:size=1920x1080:rate=30 \
  -f lavfi -i sine=frequency=600:duration=300 \
  -c:v libx264 -preset ultrafast -c:a aac \
  -y "$OUTPUT_DIR/test-video-3.mp4" 2>/dev/null

echo "Created test-video-3.mp4"

echo "All test video files created successfully!"
