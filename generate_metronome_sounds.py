#!/usr/bin/env python3
"""
Generate metronome sound files
Creates simple WAV files with sine wave tones
"""

import wave
import math
import struct

def generate_sine_wave(frequency, duration, sample_rate=44100, amplitude=0.5):
    """
    Generate a sine wave as bytes

    Args:
        frequency: Frequency in Hz
        duration: Duration in seconds
        sample_rate: Sample rate (default 44100 Hz)
        amplitude: Amplitude 0-1 (default 0.5)

    Returns:
        bytes: PCM audio data
    """
    num_samples = int(sample_rate * duration)
    samples = []

    for i in range(num_samples):
        # Generate sine wave
        t = i / sample_rate
        sample = amplitude * math.sin(2 * math.pi * frequency * t)

        # Apply envelope (fade in/out to prevent clicks)
        envelope = 1.0
        fade_samples = int(sample_rate * 0.005)  # 5ms fade

        if i < fade_samples:
            envelope = i / fade_samples
        elif i > num_samples - fade_samples:
            envelope = (num_samples - i) / fade_samples

        sample *= envelope

        # Convert to 16-bit PCM
        pcm_value = int(sample * 32767)
        samples.append(struct.pack('<h', pcm_value))

    return b''.join(samples)

def create_wav_file(filename, frequency, duration, sample_rate=44100):
    """
    Create a WAV file with a sine wave tone

    Args:
        filename: Output filename
        frequency: Frequency in Hz
        duration: Duration in seconds
        sample_rate: Sample rate (default 44100 Hz)
    """
    # Generate audio data
    audio_data = generate_sine_wave(frequency, duration, sample_rate)

    # Create WAV file
    with wave.open(filename, 'wb') as wav_file:
        # Set parameters: 1 channel (mono), 2 bytes per sample (16-bit), sample rate
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_data)

    print(f"Created: {filename} ({frequency}Hz, {duration*1000:.0f}ms)")

def main():
    """Generate all metronome sounds"""
    output_dir = "frontend/public/sounds"

    print("Generating metronome sound files...")
    print("-" * 50)

    # Click sound - high frequency, very short
    create_wav_file(
        f"{output_dir}/click.wav",
        frequency=1000,  # 1000 Hz
        duration=0.05    # 50ms
    )

    # Beep sound - mid frequency, short
    create_wav_file(
        f"{output_dir}/beep.wav",
        frequency=880,   # A5 note
        duration=0.08    # 80ms
    )

    # Drum sound - low frequency, medium
    create_wav_file(
        f"{output_dir}/drum.wav",
        frequency=150,   # Low frequency
        duration=0.12    # 120ms
    )

    # Snap sound - high frequency, very short
    create_wav_file(
        f"{output_dir}/snap.wav",
        frequency=2000,  # High frequency
        duration=0.04    # 40ms
    )

    # Woodblock sound - mid-high frequency, short
    create_wav_file(
        f"{output_dir}/woodblock.wav",
        frequency=600,   # Mid-high frequency
        duration=0.06    # 60ms
    )

    print("-" * 50)
    print("✓ All metronome sound files created successfully!")
    print(f"\nFiles created in: {output_dir}/")
    print("  - click.wav")
    print("  - beep.wav")
    print("  - drum.wav")
    print("  - snap.wav")
    print("  - woodblock.wav")

if __name__ == "__main__":
    main()
