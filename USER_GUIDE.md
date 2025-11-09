# Media Player User Guide

Complete guide to using the Media Player application for browsing videos, creating clips, and managing playlists.

## Table of Contents

- [Getting Started](#getting-started)
- [User Registration and Login](#user-registration-and-login)
- [Browsing Your Video Library](#browsing-your-video-library)
- [Watching Videos](#watching-videos)
- [Creating Clips](#creating-clips)
- [Managing Clips](#managing-clips)
- [Working with Playlists](#working-with-playlists)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips and Best Practices](#tips-and-best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### What You'll Need

Before you begin:
- Media Player must be deployed and running (see [DEPLOYMENT.md](DEPLOYMENT.md))
- Your administrator should have configured video files in the system
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### First Visit

1. Open your web browser
2. Navigate to your Media Player URL (e.g., `http://localhost` for local deployment)
3. You'll be greeted with the login page

## User Registration and Login

### Creating Your Account

<details>
<summary>Step-by-step registration</summary>

1. **Navigate to the registration page**
   - On the login page, click the "Sign Up" or "Create Account" link

2. **Fill in your details**
   - **Username**: Choose a unique username (alphanumeric characters)
   - **Email**: Provide a valid email address
   - **Password**: Create a strong password (minimum 8 characters recommended)

3. **Submit your registration**
   - Click the "Register" or "Sign Up" button
   - If successful, you'll be automatically logged in

4. **You're ready!**
   - You'll be redirected to the video library

</details>

**Registration Tips**:
- Use a memorable username - you'll need it to log in
- Choose a strong password with a mix of letters, numbers, and symbols
- Keep your credentials secure

### Logging In

1. Enter your username or email
2. Enter your password
3. Click "Log In"

**Stay logged in**: Your session will remain active. You can safely close and reopen your browser.

### Logging Out

Click your username or the "Logout" button in the top navigation bar.

## Browsing Your Video Library

The video library is your main dashboard for discovering and accessing content.

### Video Library Overview

When you first arrive at the video library:

```
┌─────────────────────────────────────────┐
│ Video Library                           │
│ Browse and search your video collection │
├─────────────────────────────────────────┤
│ [Search box]  [Filters ▼]              │
├─────────────────────────────────────────┤
│ Showing 20 of 150 videos                │
├─────────────────────────────────────────┤
│ ┌────┐  ┌────┐  ┌────┐  ┌────┐        │
│ │Vid1│  │Vid2│  │Vid3│  │Vid4│        │
│ └────┘  └────┘  └────┘  └────┘        │
├─────────────────────────────────────────┤
│       [← Previous] Page 1 [Next →]     │
└─────────────────────────────────────────┘
```

### Understanding Video Cards

Each video is displayed as a card showing:
- **Thumbnail**: Preview image (if available)
- **Title**: Video name
- **Duration**: Video length (e.g., "1:45:30")
- **Tags**: Associated keywords (if any)

### Searching for Videos

**Basic Search**:
1. Click in the search box at the top
2. Type your search term (video title, description, etc.)
3. Results update automatically

**Search is not case-sensitive**: Searching for "vacation" will find "Vacation", "VACATION", etc.

### Filtering Videos

Use the filter panel to narrow down results:

**Filter by Tags**:
- Click the "Tags" dropdown
- Select one or more tags
- Videos matching those tags will be displayed

**Filter by Date**:
- Use "Date From" and "Date To" fields
- Enter dates in YYYY-MM-DD format
- Find videos added within a specific timeframe

**Combining Filters**:
You can use search + tags + date filters together for precise results.

**Example**:
```
Search: "conference"
Tags: "work", "presentation"
Date From: 2024-01-01
→ Shows all conference videos tagged with work/presentation from 2024
```

### Pagination

Navigate through large video collections:
- **Next →**: View the next 20 videos
- **← Previous**: Go back to previous page
- Page number is displayed in the center

Videos are loaded 20 at a time to keep the interface fast.

### Opening a Video

Click on any video card to:
- Watch the video
- View detailed metadata
- Create clips
- See existing clips

## Watching Videos

### Video Player Interface

The video player provides full playback controls:

```
┌─────────────────────────────────────────┐
│                                         │
│          [Video Display Area]           │
│                                         │
├─────────────────────────────────────────┤
│ ▶  ⏸  ═══●═════════ 🔊 ⚙ [Fullscreen] │
│    Play  Timeline   Vol Settings        │
└─────────────────────────────────────────┘
```

### Player Controls

**Playback Controls**:
- **Play/Pause**: Click the play button or press `Space` or `K`
- **Seek**: Click anywhere on the timeline to jump to that position
- **Skip**: Use arrow keys for 5-second jumps forward/backward

**Volume Controls**:
- **Volume Slider**: Click and drag the volume control
- **Mute**: Click the speaker icon or press `M`
- **Volume Up/Down**: Press `↑` or `↓` arrow keys

**View Controls**:
- **Fullscreen**: Click the fullscreen button or press `F`
- **Exit Fullscreen**: Press `F` or `Esc`

### Video Information

Below the player, you'll find detailed video metadata:

**Technical Details**:
- Duration (e.g., "1:45:30")
- Resolution (e.g., "1920x1080")
- Codec (e.g., "H.264")
- File Size (e.g., "1.2 GB")

**Descriptive Metadata**:
- Tags: Categorization labels
- Description: Additional information about the video

### Clip Markers Timeline

If the video has clips, you'll see a visual timeline showing where clips are located:

```
Video Timeline:
|──────●───●────────●───────────────|
       ↑   ↑        ↑
    Clip1 Clip2   Clip3
```

**Using Clip Markers**:
- Click on any marker to jump to that clip's start time
- Hover over a marker to see the clip name
- Great for quickly navigating to interesting sections

## Creating Clips

Clips let you extract and save specific segments from any video.

### What is a Clip?

A clip is a defined portion of a video with:
- **Start time**: Where the clip begins
- **End time**: Where the clip ends
- **Name**: A descriptive title
- **Metadata**: Optional tags and descriptions

### Creating Your First Clip

<details>
<summary>Step-by-step clip creation</summary>

**Step 1: Navigate to a video**
- Go to the video library
- Click on the video you want to clip

**Step 2: Find the clip start point**
- Play the video
- Pause or seek to the moment you want the clip to start
- Note the current time (shown in the player)

**Step 3: Set the start time**
- In the "Create Clip" panel below the player
- Click the **"Set Start"** button
- You'll see the timestamp captured (e.g., "2:30")

**Step 4: Find the clip end point**
- Continue playing or seek to where you want the clip to end
- The clip should end before the video ends

**Step 5: Set the end time**
- Click the **"Set End"** button
- You'll see the end timestamp captured (e.g., "3:45")

**Step 6: Name your clip**
- In the "Clip Name" field, enter a descriptive name
- Example: "Important Announcement" or "Highlight Moment"

**Step 7: Create the clip**
- Click the **"Create Clip"** button
- If successful, you'll see a confirmation
- The clip will appear in the clip markers timeline

</details>

### Clip Creation Tips

**Planning Your Clip**:
- Watch the section first to identify exact start/end points
- Include a small buffer before and after the key moment
- Keep clips focused on a single topic or event

**Naming Clips**:
- Use descriptive names that explain what's in the clip
- Include context: "Q&A Session - Question about pricing"
- Avoid generic names like "Clip 1" or "Untitled"

**Common Patterns**:
```
Good clip names:
✓ "Opening Keynote - Product Announcement"
✓ "Tutorial Step 3 - Installing Dependencies"
✓ "Game Highlight - Winning Goal"

Less helpful:
✗ "Clip"
✗ "Part 1"
✗ "Video segment"
```

### Clip Validation

The system validates clips to ensure quality:

**Requirements**:
- Start time must be before end time
- Both start and end must be within video duration
- Clip must have a name
- Minimum duration: 1 second

**Error Messages**:
- "Start time must be before end time" → Adjust your timestamps
- "Clip name is required" → Enter a name
- "End time is outside video duration" → The end time exceeds the video length

### Quick Clip Workflow

For experienced users:

1. **Pause** at start point → **Set Start**
2. **Seek** to end point → **Set End**
3. **Type** clip name → **Create Clip**
4. **Clear** to create another clip from the same video

## Managing Clips

### Viewing All Clips

Navigate to the **"Clips"** section from the main navigation.

**Clips Library Overview**:
```
┌─────────────────────────────────────────┐
│ Clips Library                           │
│ Browse and manage your video clips      │
├─────────────────────────────────────────┤
│ Filter by Source Video: [All Videos ▼] │
│ 47 clips                                │
├─────────────────────────────────────────┤
│ ┌────────┐  ┌────────┐  ┌────────┐     │
│ │ Clip 1 │  │ Clip 2 │  │ Clip 3 │     │
│ │ 2:30   │  │ 1:45   │  │ 3:15   │     │
│ └────────┘  └────────┘  └────────┘     │
└─────────────────────────────────────────┘
```

### Understanding Clip Cards

Each clip card displays:
- **Clip Name**: The title you gave it
- **Source Video**: Which video the clip came from
- **Duration**: Length of the clip (calculated from start/end times)
- **Timestamp**: The clip's position in the source video

### Filtering Clips

**Filter by Source Video**:
1. Click the "Filter by Source Video" dropdown
2. Select a specific video
3. Only clips from that video are shown

**Clear Filter**:
Click the "Clear Filter" button to show all clips again.

### Playing a Clip

Click on any clip card to:
- Watch just that clip segment
- View clip details
- Edit clip metadata
- See the source video information

### Clip Detail View

When viewing a clip, you'll see:

**Clip Information**:
- Clip name
- Source video title
- Start time and end time
- Duration
- Created date

**Clip Player**:
- Plays only the clipped segment
- Loops back to clip start when it reaches the end
- All standard player controls available

**Actions**:
- Edit clip metadata (name, description, tags)
- Delete clip
- Jump to source video

### Editing Clip Metadata

<details>
<summary>How to edit clip details</summary>

1. **Open the clip**
   - Click on the clip card in the clips library

2. **Click "Edit Metadata"** or the edit icon

3. **Update fields**:
   - **Name**: Change the clip title
   - **Description**: Add or modify description
   - **Tags**: Add categorization tags (comma-separated)
   - **Custom Metadata**: Add key-value pairs for additional context

4. **Save changes**
   - Click "Save" to apply changes
   - Changes are immediately saved to the database

5. **Cancel editing**
   - Click "Cancel" to discard changes

</details>

**Custom Metadata Examples**:
```
Key: "Speaker"      Value: "John Smith"
Key: "Topic"        Value: "Product Launch"
Key: "Location"     Value: "Conference Room A"
Key: "Event"        Value: "Annual Meeting 2024"
```

### Deleting Clips

1. Open the clip you want to delete
2. Click the "Delete" button
3. Confirm the deletion
4. The clip is permanently removed

**Note**: Deleting a clip does NOT delete the source video.

## Working with Playlists

> **Note**: Full playlist functionality is currently in development. The features described below will be available in an upcoming release.

### What are Playlists?

Playlists allow you to:
- Group multiple clips together
- Create a custom playback sequence
- Build compilations and highlights
- Share curated content collections

### Creating a Playlist (Coming Soon)

1. Navigate to the "Playlists" section
2. Click "Create New Playlist"
3. Give your playlist a name and description
4. Add clips from your library
5. Arrange clips in your desired order
6. Save the playlist

### Managing Playlists (Coming Soon)

**Playlist Editor Features**:
- Drag-and-drop clip reordering
- Add/remove clips
- Sequential playback
- Playlist metadata editing
- Share playlists with other users

Stay tuned for full playlist functionality!

## Keyboard Shortcuts

Master these shortcuts for efficient navigation and playback.

### Video Player Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` or `K` | Play / Pause |
| `←` | Seek backward 5 seconds |
| `→` | Seek forward 5 seconds |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Toggle mute |
| `F` | Toggle fullscreen |

### Application Navigation

| Shortcut | Action |
|----------|--------|
| `Esc` | Exit fullscreen or close modal |

### Clip Creation Shortcuts

While creating clips, use player shortcuts to:
1. Seek to start → Pause → Set Start
2. Seek to end → Pause → Set End
3. Use keyboard to type clip name
4. Enter to create (when focused on Create button)

## Tips and Best Practices

### Organizing Your Library

**Use Tags Effectively**:
- Be consistent with tag names (e.g., always use "tutorial" not sometimes "tutorials")
- Create a tag hierarchy: "project/client/2024"
- Don't over-tag: 3-5 tags per video is usually sufficient

**Clip Naming Convention**:
```
Format: [Video Name] - [Section] - [Specific Topic]

Examples:
"Annual Meeting 2024 - Q&A - Pricing Questions"
"Product Demo - Part 2 - Advanced Features"
"Training Video - Module 3 - Safety Procedures"
```

### Efficient Clip Creation

**Batch Clip Creation**:
If you need to create multiple clips from one video:
1. Watch the video once, noting timestamps
2. Create all clips in one session
3. Use the "Clear" button between clips instead of reloading

**Precise Timing**:
- Pause the video at the exact moment
- Use arrow keys for fine-tuning (5-second increments)
- Check the timestamp before clicking "Set Start" or "Set End"

### Search Tips

**Effective Searching**:
- Use specific keywords: "quarterly report 2024" vs "report"
- Search by metadata: Tags, descriptions, and titles are all searchable
- Combine search with filters for better results

**Finding Old Content**:
- Use date range filters to narrow down by upload date
- Sort by date (if available) to see newest/oldest first
- Filter by tags for categorized browsing

### Performance Tips

**Smooth Playback**:
- Ensure stable internet connection for network storage
- Close unnecessary browser tabs to free up resources
- Use modern browsers for best performance
- Clear browser cache if videos lag

**Fast Navigation**:
- Bookmark frequently used filters with URL parameters
- Use browser back/forward buttons to navigate history
- Open videos in new tabs to keep your place in the library

## Troubleshooting

### Login and Authentication Issues

**Problem**: Can't log in / "Invalid credentials" error

**Solutions**:
1. **Check your username and password**
   - Usernames are case-sensitive
   - Passwords are case-sensitive
   - Ensure no extra spaces

2. **Clear browser cache and cookies**
   - Go to browser settings
   - Clear site data for Media Player
   - Try logging in again

3. **Reset your password**
   - Contact your administrator to reset password
   - Or use the "Forgot Password" feature if available

**Problem**: Logged out unexpectedly

**Solution**:
- Sessions expire after inactivity
- Log back in to continue
- Your data is saved automatically

### Video Playback Issues

**Problem**: Video won't play / Black screen

**Solutions**:
1. **Check video availability**
   - Video file might be missing from server
   - Contact administrator if video shows as unavailable

2. **Refresh the page**
   - Press `F5` or `Ctrl+R` (Windows) / `Cmd+R` (Mac)
   - Browser might have cached an error

3. **Try a different browser**
   - Some video codecs work better in specific browsers
   - Chrome, Firefox, and Safari all support HLS streaming

4. **Check internet connection**
   - Ensure stable connection for streaming
   - Try lowering video quality if available

**Problem**: Video stutters or buffers frequently

**Solutions**:
- Slow internet connection → Wait for buffering or use lower quality
- Server overload → Try again later
- Close other bandwidth-intensive applications

**Problem**: No sound

**Solutions**:
1. Check video player volume (not muted)
2. Check system volume
3. Try a different video (source might lack audio)
4. Check browser audio permissions

### Clip Creation Issues

**Problem**: Can't create clip / "Create Clip" button disabled

**Reasons**:
- Start and end times not set
- Start time is after end time
- Missing clip name
- Invalid timestamps

**Solution**:
Review the clip creator panel for error messages and fix the indicated issue.

**Problem**: Clip markers don't appear

**Solutions**:
1. Refresh the page after creating a clip
2. Check the clips library to verify the clip was created
3. Ensure the video has clips associated with it

### Search and Filter Issues

**Problem**: Search returns no results

**Solutions**:
1. **Check spelling** → Try broader search terms
2. **Clear filters** → Tags/dates might be excluding all results
3. **Verify content exists** → Ask administrator about available videos

**Problem**: Filters not working

**Solutions**:
- Clear browser cache
- Remove all filters and re-apply one at a time
- Check URL parameters for corruption

### Performance Issues

**Problem**: Slow page loading

**Solutions**:
1. **Clear browser cache**
   - Browser might have outdated cached files

2. **Disable browser extensions**
   - Some extensions interfere with video playback

3. **Check system resources**
   - Close unnecessary applications
   - Restart browser

**Problem**: High memory usage

**Solutions**:
- Close unused tabs
- Refresh the page periodically during long sessions
- Use a modern browser with better memory management

### Getting Additional Help

If you encounter issues not covered here:

1. **Check the deployment documentation**: [DEPLOYMENT.md](DEPLOYMENT.md)
2. **Contact your administrator**: They can check server logs and video file availability
3. **Report bugs**: If you believe you've found a bug, provide:
   - What you were trying to do
   - What you expected to happen
   - What actually happened
   - Any error messages
   - Browser and OS version

---

**Happy Viewing!**

For technical documentation, see:
- [README.md](README.md) - Project overview and setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Installation and deployment
- [API.md](API.md) - API reference for developers
