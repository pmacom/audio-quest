import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import AudioDeviceSelector from "../components/AudioDeviceSelector";
import FlowComponent from "../components/FlowComponent/flow-component";
import { TEST_SHADER } from "../shaders/test-shader";
import { TestShaderMesh } from "../tests/TestShaderMesh";
import { FrameUpdater } from "../canvas/FrameUpdater";

export const BasicCanvas = ({ children }: { children?: React.ReactNode }) => {
  return (
    <>
      {/* <AudioStateView /> */}
      <FlowComponent />
      {/* <AudioDeviceSelector /> */}
      {/* <BasicDebugDisplay /> */}

      <div className="w-full h-full fixed top-0 left-0 z-[-1] bg-black">
        <Canvas>
          <OrthographicCamera makeDefault position={[0, 0, 10]} near={0.1} far={100} />
          <ambientLight />
          <color attach="background" args={["#222200"]} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls />
          
          
          {/* <TweakShaderMaterial
            vertexShader={shader.vertexShader}
            fragmentShader={shader.fragmentShader}
            ranges={shader.ranges}
          /> */}
          {/* {children} */}
        </Canvas>
      </div>
    </>
  )
}
