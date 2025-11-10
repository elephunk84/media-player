# Requirements Document

## Introduction

The Metronome Overlay feature provides users with a synchronized audio and visual metronome that overlays on top of video playback. This feature enables users to add rhythmic guidance during video viewing, with fully customizable timing patterns, visual effects, and audio feedback. The metronome is designed to work seamlessly with local videos, clips, and playlists, providing an immersive and interactive viewing experience.

### Purpose
To enhance the video viewing experience by providing synchronized rhythmic feedback through configurable audio beats and visual overlays that adapt to user-defined patterns and preferences.

### Value to Users
- **Rhythmic Training**: Users can practice timing and rhythm while watching instructional videos
- **Enhanced Viewing Experience**: Synchronized visual and audio feedback creates a more engaging experience
- **Full Customization**: Complete control over timing, patterns, visual effects, and audio settings
- **Local Content Focus**: Works exclusively with user's local media library without external dependencies

## Alignment with Product Vision

This feature extends the Media Player's core mission of providing a comprehensive, self-hosted video management platform by adding interactive overlay capabilities. It maintains the privacy-first approach by working exclusively with local media (no remote sources), and follows the existing architecture patterns for React components and TypeScript type safety.

The metronome overlay supports the product's goal of being feature-rich while maintaining clean architecture and modularity through isolated, reusable components.

## Requirements

### Requirement 1: Basic Metronome Functionality

**User Story:** As a video viewer, I want a metronome that plays audio beats in sync with configurable timing, so that I can maintain rhythm while watching videos.

#### Acceptance Criteria

1. WHEN the user enables the metronome THEN the system SHALL play audio beats at the configured BPM (beats per minute)
2. WHEN the user adjusts the BPM slider THEN the system SHALL update the beat frequency in real-time without interruption
3. WHEN the video is paused THEN the metronome SHALL pause automatically
4. WHEN the video resumes playback THEN the metronome SHALL resume in sync
5. IF the user sets BPM to a value between 30-300 THEN the system SHALL accept and apply the value
6. WHEN the metronome is active THEN the system SHALL maintain accurate timing within ±5ms per beat

### Requirement 2: Visual Beat Overlay

**User Story:** As a video viewer, I want visual indicators that sync with the metronome beats, so that I can follow the rhythm visually as well as aurally.

#### Acceptance Criteria

1. WHEN a beat occurs THEN the system SHALL display a visual indicator overlay on the video
2. WHEN the user selects a visual style THEN the system SHALL apply that style (flash, pulse, border, custom shape)
3. IF the user chooses "flash" style THEN the system SHALL display a full-screen flash with configurable opacity
4. IF the user chooses "pulse" style THEN the system SHALL display an expanding/contracting circle or shape
5. IF the user chooses "border" style THEN the system SHALL display a border highlight around the video
6. WHEN a beat occurs THEN the visual effect SHALL complete within the beat duration without overlap
7. WHEN the user adjusts visual intensity THEN the system SHALL update the visual effect brightness/opacity in real-time

### Requirement 3: Pattern Customization

**User Story:** As a video viewer, I want to create custom beat patterns with varying intensities, so that I can match complex rhythms and sequences.

#### Acceptance Criteria

1. WHEN the user enables pattern mode THEN the system SHALL allow defining beats with different intensities
2. WHEN the user creates a pattern THEN the system SHALL support at least 3 intensity levels (light, medium, strong)
3. WHEN a pattern is defined THEN the system SHALL repeat the pattern continuously during playback
4. IF the user sets a pattern of [strong, medium, medium, light] THEN the system SHALL play that sequence repeatedly
5. WHEN the user adjusts pattern length THEN the system SHALL support patterns from 2 to 32 beats
6. WHEN different intensities are used THEN the system SHALL vary both audio volume and visual intensity accordingly
7. WHEN the user saves a pattern THEN the system SHALL persist it in browser storage for future use

### Requirement 4: Timing and Randomization Controls

**User Story:** As a video viewer, I want to control the timing variations and randomization of beats, so that I can create unpredictable and dynamic experiences.

#### Acceptance Criteria

1. WHEN the user enables randomization THEN the system SHALL allow random variation in beat timing
2. WHEN the user sets a randomization percentage THEN the system SHALL vary beat timing within that range (0-50%)
3. IF randomization is set to 20% with 60 BPM THEN beats SHALL occur within ±200ms of expected time
4. WHEN the user enables tempo changes THEN the system SHALL allow gradual BPM increases/decreases over time
5. WHEN tempo change is configured THEN the system SHALL smoothly transition BPM without abrupt jumps
6. WHEN the user sets acceleration/deceleration THEN the system SHALL change BPM by configured amount per minute
7. IF the user sets min/max BPM bounds THEN the system SHALL not exceed those limits during tempo changes

### Requirement 5: Visual Customization Options

**User Story:** As a video viewer, I want to customize the appearance of visual overlays, so that I can personalize the viewing experience to my preferences.

#### Acceptance Criteria

1. WHEN the user opens visual settings THEN the system SHALL provide color picker for overlay color
2. WHEN the user selects a color THEN the system SHALL apply it to all visual beat indicators
3. WHEN the user adjusts opacity THEN the system SHALL update overlay transparency (0-100%)
4. WHEN the user selects shape type THEN the system SHALL support circle, square, diamond, and custom shapes
5. WHEN the user adjusts size THEN the system SHALL scale visual overlays (10-100% of screen)
6. WHEN the user sets position THEN the system SHALL allow center, corner, or custom placement
7. WHEN the user enables multi-overlay THEN the system SHALL support displaying multiple visual indicators simultaneously

### Requirement 6: Audio Customization Options

**User Story:** As a video viewer, I want to customize the metronome sound and volume, so that I can match the audio to my preferences and environment.

#### Acceptance Criteria

1. WHEN the user opens audio settings THEN the system SHALL provide volume control (0-100%)
2. WHEN the user selects a sound type THEN the system SHALL support at least 5 different beat sounds (click, beep, drum, snap, woodblock)
3. WHEN the user loads a custom sound file THEN the system SHALL support WAV, MP3, and OGG formats
4. WHEN different intensities are played THEN the system SHALL vary volume proportionally (25%, 50%, 75%, 100%)
5. WHEN the user adjusts master volume THEN the system SHALL not affect video audio volume
6. WHEN the user enables accent beats THEN the system SHALL play louder/different sounds on specified beats (e.g., every 4th beat)
7. IF the user mutes the metronome THEN visual overlays SHALL continue without audio

### Requirement 7: Playlist and Clip Integration

**User Story:** As a video viewer, I want the metronome settings to persist across playlist items and clips, so that I can maintain consistent timing throughout sequences.

#### Acceptance Criteria

1. WHEN a playlist is playing THEN the metronome SHALL continue seamlessly between playlist items
2. WHEN the user enables "sync to clips" THEN the system SHALL maintain beat alignment across clip boundaries
3. WHEN transitioning between clips THEN the system SHALL maintain BPM and pattern without reset
4. WHEN the user enables "per-clip settings" THEN the system SHALL allow saving different metronome configurations per clip
5. IF per-clip settings are enabled THEN the system SHALL load stored settings when each clip begins
6. WHEN the user disables per-clip settings THEN the system SHALL use global metronome configuration
7. WHEN a clip or playlist ends THEN the metronome SHALL stop automatically unless continuous mode is enabled

### Requirement 8: Preset Management

**User Story:** As a video viewer, I want to save and load metronome configuration presets, so that I can quickly switch between different setups.

#### Acceptance Criteria

1. WHEN the user creates a preset THEN the system SHALL save all current metronome settings (BPM, pattern, visual, audio)
2. WHEN the user loads a preset THEN the system SHALL apply all saved settings immediately
3. WHEN the user names a preset THEN the system SHALL accept alphanumeric names up to 50 characters
4. WHEN the user deletes a preset THEN the system SHALL remove it from storage with confirmation
5. WHEN the user exports presets THEN the system SHALL generate a JSON file with all settings
6. WHEN the user imports presets THEN the system SHALL validate and load settings from JSON file
7. WHEN presets are saved THEN the system SHALL store them in browser localStorage with 5MB limit check

### Requirement 9: Controls and UI Integration

**User Story:** As a video viewer, I want intuitive controls for the metronome that integrate seamlessly with the video player, so that I can easily enable and configure settings.

#### Acceptance Criteria

1. WHEN the user opens the video player THEN the system SHALL display a metronome toggle button in the control bar
2. WHEN the user clicks the metronome button THEN the system SHALL open a settings panel as an overlay or sidebar
3. WHEN the settings panel is open THEN the system SHALL not interfere with video playback controls
4. WHEN the user adjusts settings THEN changes SHALL apply in real-time without requiring "save" or "apply" buttons
5. WHEN the metronome is active THEN the toggle button SHALL show active state (different color/icon)
6. WHEN the user closes the settings panel THEN the metronome SHALL continue with current settings
7. WHEN the user enables keyboard shortcuts THEN the system SHALL support hotkeys for common actions (space = toggle, arrow keys = BPM adjust)

### Requirement 10: Performance and Synchronization

**User Story:** As a video viewer, I want the metronome to maintain accurate timing and synchronization, so that beats align perfectly with the rhythm I expect.

#### Acceptance Criteria

1. WHEN the metronome is running THEN the system SHALL maintain timing accuracy within ±5ms per beat
2. WHEN the video playback rate changes THEN the metronome SHALL adjust BPM proportionally (e.g., 2x speed = 2x BPM)
3. WHEN the system is under load THEN the metronome SHALL prioritize timing accuracy over visual effects
4. WHEN the user seeks in the video THEN the metronome SHALL re-sync to the current beat position
5. WHEN multiple tabs are open THEN each tab's metronome SHALL operate independently
6. WHEN the browser tab is backgrounded THEN the metronome SHALL continue accurately using Web Workers or AudioContext
7. WHEN system performance degrades THEN the system SHALL gracefully reduce visual complexity while maintaining audio timing

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**:
  - Separate components for metronome engine, visual overlay renderer, audio player, pattern manager, and UI controls
  - Each component should have a single, well-defined purpose

- **Modular Design**:
  - Metronome core logic isolated from React components
  - Visual effects as pluggable renderers (factory pattern)
  - Audio engine independent of timing engine
  - Settings management separate from playback logic

- **Dependency Management**:
  - Minimize coupling between metronome and video player components
  - Use React Context for global metronome state
  - Dependency injection for audio and visual renderers

- **Clear Interfaces**:
  - TypeScript interfaces for all metronome configurations
  - Defined contracts between timing engine and renderers
  - Clear API for preset import/export

### Performance

- **Timing Accuracy**: Metronome beats must maintain ±5ms precision using Web Audio API for scheduling
- **Visual Rendering**: Visual overlays must render at 60fps without dropping frames
- **Memory Usage**: Metronome state and presets must not exceed 5MB in localStorage
- **CPU Usage**: Metronome should use <5% CPU on modern devices during normal operation
- **Startup Time**: Metronome initialization should complete within 100ms
- **Pattern Processing**: Pattern sequences up to 32 beats should process within 10ms

### Security

- **Input Validation**: All user inputs (BPM, patterns, preset names) must be validated and sanitized
- **File Upload Security**: Custom audio files must be validated for type and size (max 5MB)
- **XSS Prevention**: Preset names and descriptions must be escaped to prevent XSS
- **Storage Limits**: Enforce localStorage quota limits with error handling
- **Content Security Policy**: Audio files must be loaded with appropriate CSP headers

### Reliability

- **Error Handling**: Graceful degradation if Web Audio API is unavailable (fallback to setTimeout)
- **Browser Compatibility**: Must work on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **State Recovery**: Metronome state should persist across page reloads
- **Crash Recovery**: If metronome crashes, video playback should continue unaffected
- **Audio Failure**: If audio context fails, visual overlays should continue independently

### Usability

- **Intuitive Controls**: Settings panel must be accessible within 2 clicks from video player
- **Real-time Feedback**: All setting changes must apply immediately with visual confirmation
- **Responsive Design**: Controls must work on desktop (1920x1080) and tablet (768x1024) minimum
- **Accessibility**: Controls must be keyboard navigable with ARIA labels
- **Visual Clarity**: Beat overlays must be visible on both light and dark video content
- **Help Documentation**: Tooltips for all controls with brief explanations
- **Mobile Considerations**: Touch-friendly controls with minimum 44x44px touch targets (future consideration)

### Testability

- **Unit Testing**: All timing, pattern, and calculation logic must be unit testable
- **Component Testing**: React components must have test coverage >80%
- **Integration Testing**: Metronome integration with VideoPlayer component must be tested
- **Performance Testing**: Timing accuracy and frame rate must be measurable and monitored
- **E2E Testing**: Complete user workflows must be covered by Playwright tests

### Maintainability

- **Code Documentation**: All public methods and interfaces must have JSDoc comments
- **Type Safety**: Full TypeScript coverage with strict mode enabled
- **Configuration Management**: All magic numbers must be extracted to constants file
- **Logging**: Debug logging for timing events and state changes (development only)
- **Version Compatibility**: Settings format must support backward compatibility for future updates
