# Metronome Audio Files Setup Guide

## Quick Start

The metronome requires audio files in `public/sounds/`. You have several options:

## Option 1: Use Placeholder Silence (Fastest)

For testing purposes, create silent audio files:

```bash
# Create the sounds directory
mkdir -p public/sounds

# Create 1-second silent WAV files (requires ffmpeg)
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 -acodec pcm_s16le public/sounds/click.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 -acodec pcm_s16le public/sounds/beep.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 -acodec pcm_s16le public/sounds/drum.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 -acodec pcm_s16le public/sounds/snap.wav
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 -acodec pcm_s16le public/sounds/woodblock.wav
```

## Option 2: Generate Simple Tones with Audacity

1. **Install Audacity** (free)
   - Download from [audacityteam.org](https://www.audacityteam.org/)

2. **Create Click Sound**
   ```
   Generate → Tone
   - Waveform: Square
   - Frequency: 1000 Hz
   - Duration: 0.05 seconds (50ms)
   File → Export → Export as WAV
   Save as: public/sounds/click.wav
   ```

3. **Create Beep Sound**
   ```
   Generate → Tone
   - Waveform: Sine
   - Frequency: 880 Hz
   - Duration: 0.1 seconds (100ms)
   Export as: public/sounds/beep.wav
   ```

4. **Create Drum Sound**
   ```
   Generate → Tone
   - Waveform: Square
   - Frequency: 100 Hz
   - Duration: 0.08 seconds (80ms)
   Export as: public/sounds/drum.wav
   ```

5. **Create Snap Sound**
   ```
   Generate → Tone
   - Waveform: Sawtooth
   - Frequency: 2000 Hz
   - Duration: 0.03 seconds (30ms)
   Export as: public/sounds/snap.wav
   ```

6. **Create Woodblock Sound**
   ```
   Generate → Tone
   - Waveform: Square
   - Frequency: 600 Hz
   - Duration: 0.06 seconds (60ms)
   Export as: public/sounds/woodblock.wav
   ```

## Option 3: Download Free Sounds

### From Freesound.org

1. Visit [freesound.org](https://freesound.org)
2. Search for "metronome click" or "beep"
3. Download sounds with Creative Commons license
4. Rename and place in `public/sounds/`

**Recommended searches:**
- "metronome click"
- "wood block"
- "snap finger"
- "beep short"
- "drum hit"

### From Zapsplat.com

1. Visit [zapsplat.com](https://zapsplat.com)
2. Search for "metronome" or "beep"
3. Download free sounds
4. Place in `public/sounds/`

## Option 4: Use Online Tone Generators

### Using Sox (Command Line)

If you have Sox installed:

```bash
mkdir -p public/sounds

# Click (high frequency, short)
sox -n public/sounds/click.wav synth 0.05 sine 1000

# Beep (mid frequency, medium)
sox -n public/sounds/beep.wav synth 0.1 sine 880

# Drum (low frequency, short)
sox -n public/sounds/drum.wav synth 0.08 sine 100

# Snap (high frequency, very short)
sox -n public/sounds/snap.wav synth 0.03 sine 2000

# Woodblock (mid-low frequency, short)
sox -n public/sounds/woodblock.wav synth 0.06 sine 600
```

## Verification

After creating the files, verify they exist:

```bash
ls -lh public/sounds/

# Should output:
# -rw-r--r-- 1 user user  8.8K ... click.wav
# -rw-r--r-- 1 user user  8.8K ... beep.wav
# -rw-r--r-- 1 user user  8.8K ... drum.wav
# -rw-r--r-- 1 user user  8.8K ... snap.wav
# -rw-r--r-- 1 user user  8.8K ... woodblock.wav
```

## File Specifications

**Requirements:**
- Format: WAV, MP3, or OGG
- Sample rate: 44.1kHz or 48kHz recommended
- Bit depth: 16-bit or 24-bit
- Duration: 30-200ms (shorter is better)
- Size: Under 1MB each

**Optimal Settings:**
- Duration: 50-100ms
- Sample rate: 44.1kHz
- Bit depth: 16-bit
- Mono (1 channel)

## Testing

Test the sounds in the browser:

```javascript
// Open browser console on the video player page
const audio = new Audio('/sounds/click.wav');
audio.play(); // Should hear the click sound
```

## Troubleshooting

### Files not loading

1. **Check file path**
   ```bash
   # From project root
   ls public/sounds/click.wav
   ```

2. **Check file permissions**
   ```bash
   chmod 644 public/sounds/*.wav
   ```

3. **Check browser console** for errors:
   - Open DevTools (F12)
   - Look for 404 errors on sound files

### No sound playing

1. **Check volume** - Ensure master volume is not 0
2. **Check mute** - Ensure metronome is not muted
3. **Check browser** - Some browsers block auto-play audio
4. **Try manual play** - Click on video first to allow audio

### Poor quality sound

1. **Increase sample rate** - Use 48kHz instead of 44.1kHz
2. **Increase bit depth** - Use 24-bit instead of 16-bit
3. **Use WAV format** - Better quality than MP3

## Production Recommendations

For production use:
1. Use professionally recorded metronome sounds
2. Normalize audio levels across all sounds
3. Remove any DC offset
4. Add slight fade-in/out to prevent clicks
5. Optimize file size (use OGG or MP3 for smaller sizes)

## Custom Sounds

Users can upload custom sounds via the metronome settings panel:
- Click Settings → Audio → Upload Custom Sound
- File size limit: 5MB
- Supported formats: WAV, MP3, OGG
- Stored in browser localStorage as data URL

## Notes

- Audio files are loaded on-demand when metronome is enabled
- Files are cached by the browser for performance
- Custom uploaded sounds override built-in sounds
- Audio files are NOT committed to git (add to .gitignore)
