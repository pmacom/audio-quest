import { useShaderTexture } from '../stores/useFreq530Shaders'
import { ShaderTextureRenderer } from './ShaderTextureRenderer'
import { memo } from 'react'

export const RenderTextures = memo(() => {
  const shaders = useShaderTexture((state) => state.shaders)

  return (
    <>
      {shaders.map((shader) => (
        <ShaderTextureRenderer
          key={shader.id}
          shader={shader}
        />
      ))}
    </>
  )
})
