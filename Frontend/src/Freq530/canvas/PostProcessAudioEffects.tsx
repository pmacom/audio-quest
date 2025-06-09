import { Bloom } from '@react-three/postprocessing'
import { useControls

 } from 'leva'
import { useFreq530 } from '../audio/store/useFreq530'
export const PostProcessAudioEffects = () => {
  const low = useFreq530(state => state.values.low || 1);
  const { intensity } = useControls({
    intensity: {
      value: 1.0,
      min: 0,
      max: 10,
    }
  })
  return (
    <Bloom
    intensity={low} // The bloom intensity.
    // blurPass={undefined} // A blur pass.
    // kernelSize={KernelSize.LARGE} // blur kernel size
    // luminanceThreshold={0.9} // luminance threshold. Raise this value to mask out darker elements in the scene.
    // luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
    // mipmapBlur={false} // Enables or disables mipmap blur.
    // resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
    // resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
  />
  )
}