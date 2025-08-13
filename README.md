# Grimstad Wind Farm VR Visualization

A Next.js application for visualizing planned windmills in VR, designed for environmental impact assessment in Grimstad, Norway.

## Features

- **3D Windmill Visualization**: Realistic 3D models with configurable parameters
- **GPS Coordinate Mapping**: Converts real GPS coordinates to 3D space
- **VR Support**: WebXR compatibility for immersive VR headset experience
- **Real-time Configuration**: Adjust windmill parameters (height, blade size, rotation speed)
- **Terrain Masking**: Erase parts of windmills to simulate terrain occlusion
- **Noise Level Simulation**: Configurable noise levels at various distances

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

### Desktop/Mobile
- **Navigation**: Click and drag to rotate view, scroll to zoom
- **Controls**: Use the settings panel on the right to modify windmill parameters

### VR Mode
- Click "Enable VR Mode" button (requires WebXR-compatible browser and VR headset)
- Use hand tracking or controllers to navigate the scene

## Configuration

Windmill configurations are stored in `src/data/windmill-config.ts`:

```typescript
export const windmillConfigurations: WindmillConfig[] = [
  {
    id: 'windmill-1',
    position: {
      latitude: 58.3500,    // GPS coordinates
      longitude: 8.6000,
      altitude: 100
    },
    height: 120,            // Tower height in meters
    bladeWidth: 2,          // Blade width in meters
    bladeLength: 40,        // Blade length in meters
    rotationSpeed: 1.5,     // Rotation speed
    noiseLevel: {           // Noise levels in dB at distances
      distance100m: 45,
      distance500m: 35,
      distance1km: 25,
      distance2km: 15
    }
  }
];
```

## Project Structure

```
src/
├── components/
│   ├── SimpleScene.tsx          # Main 3D scene without VR
│   ├── VRScene.tsx             # VR-enabled scene (WebXR)
│   ├── Windmill.tsx            # Basic windmill 3D model
│   ├── MaskedWindmill.tsx      # Windmill with terrain masking
│   └── WindmillControls.tsx    # UI controls for windmill settings
├── types/
│   └── windmill.ts             # TypeScript type definitions
├── utils/
│   └── coordinates.ts          # GPS to 3D coordinate conversion
└── data/
    └── windmill-config.ts      # Default windmill configurations
```

## Technologies Used

- **Next.js 15** - React framework
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for R3F
- **React Three XR** - WebXR support for VR
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## VR Compatibility

The app supports WebXR and works with:
- Meta Quest headsets
- HTC Vive
- Valve Index
- Other WebXR-compatible devices

Requires a WebXR-compatible browser (Chrome, Firefox, Edge with WebXR support enabled).

## Customization

To add new windmills or modify existing ones:

1. Edit `src/data/windmill-config.ts`
2. Update the `grimstadUserLocation` for your viewing location
3. Adjust windmill parameters using the UI controls
4. Implement terrain masking for mountain occlusion

## Development

The project uses modern React patterns with TypeScript for type safety. The 3D scene is rendered using React Three Fiber, making it easy to compose and manage 3D elements as React components.

For VR development, test with a VR headset or use browser developer tools to simulate VR devices.
