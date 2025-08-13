# Audio Files Setup

## Wind Turbine Sound

To enable spatial audio in the VR experience, you need to add a wind turbine sound file:

1. Download a wind turbine sound file (MP3 format) from a royalty-free source such as:
   - [freesound.org](https://freesound.org)
   - [zapsplat.com](https://zapsplat.com)
   - YouTube Audio Library

2. Save the file as `/public/wind-turbine-sound.mp3`

3. The sound should ideally be:
   - A looping wind turbine sound
   - Around 10-30 seconds long
   - Good quality (44.1kHz, stereo preferred)

## How It Works

The spatial audio system will:
- Play wind turbine sounds based on your distance from each turbine
- Adjust volume according to the turbine's noise level configuration
- Create an immersive 3D audio experience in VR mode

Without the sound file, the VR experience will work but without audio.