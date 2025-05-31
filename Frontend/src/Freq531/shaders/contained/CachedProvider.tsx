import { CachedShaderTexture } from "./CachedShaderTexture"
import { TEST_SHADER } from "../test-shader"

export const CachedProvider = () => {
  return (
    <mesh>
      <boxGeometry args={[4, 4, 4]} />
      <CachedShaderTexture shader={TEST_SHADER} />
    </mesh>
  )
}