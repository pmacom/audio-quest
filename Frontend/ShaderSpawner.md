# ShaderSpawner Ecosystem

## Overview

The ShaderSpawner system is a modular architecture for rendering custom shader outputs to textures and sharing those textures across multiple meshes in a React Three Fiber (R3F) scene. It leverages Zustand for global state management, Three.js for rendering, and a set of provider/consumer components to enable efficient, scalable shader-driven workflows.

---

## Key Participants

### 1. Zustand Store (`useFreq530Shaders.tsx`)
- **Purpose:** Central registry for shader settings and texture refs.
- **Responsibilities:**
  - Holds an array of shader settings (e.g., vertex/fragment code, tweakable uniforms).
  - Maintains a map of shader IDs to `THREE.Texture` refs (the output of shader render targets).
  - Provides methods to set and get texture refs by shader ID.

### 2. ShaderTextureProvider (`ShaderTextureProvider.tsx`)
- **Purpose:** Renders a shader to a `THREE.WebGLRenderTarget` and stores the resulting texture ref in the Zustand store.
- **Responsibilities:**
  - Creates an offscreen scene, camera, and mesh with a custom shader material.
  - Renders to a texture every frame.
  - Updates the texture ref in the store so consumers can access the latest output.
  - **Usage:**
    ```tsx
    <ShaderTextureProvider shader={TEST_SHADER} width={512} height={512} />
    ```

### 3. RenderTextures & ShaderTextureRenderer (`RenderTextures.tsx`, `ShaderTextureRenderer.tsx`)
- **Purpose:** (Optional) Dynamically render and manage multiple shader outputs based on the shaders array in the store.
- **Responsibilities:**
  - For each shader in the store, spawns a `ShaderTextureRenderer` (similar to the provider, but can be used for batch management).
  - Useful for systems where shaders are added/removed at runtime.

### 4. DemoShaderTextureConsumer (`DemoShaderTextureConsumer.tsx`)
- **Purpose:** Consumes a texture ref from the store and applies it to its own mesh/material.
- **Responsibilities:**
  - Fetches the texture ref by shader ID from the store.
  - Sets the texture as the `map` of its material.
  - Can be used for any mesh (sphere, box, plane, etc.).
  - **Usage:**
    ```tsx
    <DemoShaderTextureConsumer shaderId="test-shader" position={[2, 0, 0]} />
    <DemoShaderTextureConsumer shaderId="test-shader" position={[-2, 0, 0]} geometry={<boxGeometry args={[1,1,1]} />} />
    ```

### 5. TestSphereRenderer (`TestSphereRenderer.tsx`)
- **Purpose:** Example consumer that demonstrates how to fetch and apply a shader texture from the store to a mesh.
- **Usage:**
    ```tsx
    <TestSphereRenderer />
    ```

### 6. TestUseTexture (`TestUseTexture.tsx`)
- **Purpose:** Example of a custom provider that renders a shader to a texture and stores it in the Zustand store. Shows how to set up a custom render target and update the store.
- **Usage:**
    ```tsx
    <TestUseTexture />
    ```

---

## How It Works

1. **Provider(s) render shader output to a texture** (offscreen, every frame).
2. **Provider stores a ref to the texture in Zustand** under a unique shader ID.
3. **Consumer(s) fetch the texture ref from Zustand** and apply it to their own materials.
4. **All consumers see the latest shader output** in real time, with no redundant rendering.

---

## Best Practices

- **Use a single provider per shader output** to avoid redundant rendering.
- **Consumers should only read from the store** and never mutate the texture.
- **Use `useEffect` to set the material's map** when the texture ref changes, not every frame.
- **Dispose of render targets and materials** when unmounting providers to avoid memory leaks.
- **Keep shader IDs unique** to avoid accidental texture sharing.

---

## Example Usage

```tsx
// In your scene:
<ShaderTextureProvider shader={TEST_SHADER} width={512} height={512} />
<DemoShaderTextureConsumer shaderId="test-shader" position={[2, 0, 0]} />
<DemoShaderTextureConsumer shaderId="test-shader" position={[-2, 0, 0]} geometry={<boxGeometry args={[1,1,1]} />} />
<TestSphereRenderer />
```

---

## Extending the System

- **Add more shaders:** Push new shader settings into the store and spawn new providers.
- **Dynamic consumers:** Any mesh can become a consumer by fetching the texture ref from the store.
- **Advanced workflows:** Use this pattern for post-processing, feedback loops, or multi-pass effects.

---

## Critical Participants
- Zustand store (`useFreq530Shaders.tsx`)
- ShaderTextureProvider (or custom provider)
- RenderTextures/ShaderTextureRenderer (for batch management)
- DemoShaderTextureConsumer (or any consumer mesh)
- TestSphereRenderer (example consumer)
- TestUseTexture (example provider)

---

## Summary

The ShaderSpawner ecosystem enables efficient, scalable, and modular sharing of shader-generated textures across your R3F scene. By separating providers (who render and store textures) from consumers (who use them), you get maximum flexibility and performance for advanced graphics workflows. 