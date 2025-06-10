# Trippy Materials System

## Overview

The Trippy Materials system allows you to apply beautiful procedural patterns to ANY 3D model using the existing `CachedShader` architecture. The system works **with or without audio** - providing time-based animations as a fallback when audio reactivity is disabled.

## How It Works

1. **CachedShader Processing**: The `trip-video-material` shader runs in the background, generating procedural video-like patterns.

2. **Texture Caching**: These patterns are rendered to a texture and cached for performance.

3. **Material Application**: The `TrippyMaterialProvider` automatically applies this cached texture to any 3D model as a material.

4. **Dual Mode Operation**:
   - **Audio Mode**: Patterns respond to audio frequencies (amplitude, beat intensity, bass, etc.)
   - **Time Mode**: Patterns animate using time-based functions (sine waves, oscillations, etc.)

## Quick Start

### Basic Usage (No Audio Required)

```tsx
import { TrippyBirdModel } from '../models/TrippyBirdModel'
import { ShaderManager } from '../Freq530/shaders/ShaderManager'

function MyScene() {
  return (
    <>
      {/* This processes shaders in the background */}
      <ShaderManager />
      
      {/* Your trippy bird - works without audio! */}
      <TrippyBirdModel 
        position={[0, 0, 0]}
        materialStyle="metallic"
        audioReactive={false} // Audio disabled
        timeBasedScaling={{
          enabled: true,
          min: 0.8,
          max: 1.5,
          speed: 1.0,
        }}
      />
    </>
  )
}
```

### Audio-Reactive Usage (Optional)

```tsx
function MyAudioScene() {
  return (
    <>
      <ShaderManager />
      
      {/* Audio-reactive bird - requires useFreq530 */}
      <TrippyBirdModel 
        position={[0, 0, 0]}
        materialStyle="emissive"
        audioReactive={true} // Audio enabled
        amplitudeScaling={{
          enabled: true,
          min: 0.5,
          max: 2.0,
        }}
      />
    </>
  )
}
```

### Manual Material Application

```tsx
import { TripVideoMaterialProvider } from '../Freq530/shaders/TrippyMaterialProvider'

function MyCustomModel() {
  return (
    <TripVideoMaterialProvider
      useAudioReactivity={false} // No audio dependency
      materialProps={{
        metalness: 0.8,
        roughness: 0.1,
        emissiveIntensity: 0.5,
      }}
      timeBasedScale={{ 
        enabled: true, 
        min: 0.8, 
        max: 2.0, 
        speed: 1.5 
      }}
    >
      {/* Any 3D model can go here */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
    </TripVideoMaterialProvider>
  )
}
```

## Material Styles

The system comes with 4 preset material styles:

- **`standard`**: Balanced look with moderate reflectivity
- **`metallic`**: High metalness and low roughness for mirror-like effects
- **`emissive`**: Glowing materials that emit light
- **`glass`**: Transparent materials with high clarity

## Animation Modes

### Time-Based Animation (Default - No Audio Required)
Models animate using mathematical functions:

```tsx
<TrippyBirdModel 
  audioReactive={false}
  timeBasedScaling={{
    enabled: true,
    min: 0.5,    // Smallest scale
    max: 2.0,    // Largest scale
    speed: 1.5,  // Animation speed
  }}
/>
```

### Audio-Reactive Animation (Optional)
Models respond to audio when `audioReactive={true}`:

```tsx
<TrippyBirdModel 
  audioReactive={true}
  amplitudeScaling={{
    enabled: true,
    min: 0.5,    // Smallest scale
    max: 2.0,    // Largest scale
  }}
  audioAnimationSpeed={{
    enabled: true,
    baseSpeed: 1.0,           // Base animation speed
    amplitudeMultiplier: 3.0, // How much audio affects speed
  }}
/>
```

## Architecture Benefits

1. **No Audio Dependency**: Works perfectly without audio system
2. **Performance**: Heavy shader processing happens once and gets cached
3. **Flexibility**: Works with any 3D model, not just planes
4. **Reusability**: Same shader system can power multiple models
5. **Optional Audio Integration**: Can be enhanced with Freq530 audio system
6. **Customizable**: Multiple material presets and custom options

## Migration from Audio-Only Version

If you were using the audio-reactive version, simply add `audioReactive={false}` to disable audio dependency:

```tsx
// Old (audio required)
<TrippyBirdModel materialStyle="metallic" />

// New (audio optional)
<TrippyBirdModel 
  materialStyle="metallic" 
  audioReactive={false} 
/>
```

## Usage in Your Project

1. **Include the ShaderManager** in your main scene component
2. **Wrap your models** with `TripVideoMaterialProvider` or use `TrippyBirdModel`
3. **Choose your mode**: Set `audioReactive={false}` for time-based or `audioReactive={true}` for audio-reactive
4. **Customize as needed**: Material properties, scaling, and animation settings

The system automatically handles material switching, performance optimization, and provides beautiful animations with or without audio!

## Files Created

- `trip-video-material.ts` - The core shader that generates procedural patterns
- `TrippyMaterialProvider.tsx` - Component that applies cached textures to models
- `TrippyBirdModel.tsx` - Enhanced bird model with trippy material support
- `TrippyModelExample.tsx` - Example scene showing various configurations

The system automatically handles material switching, performance optimization, and provides beautiful animations with or without audio! 