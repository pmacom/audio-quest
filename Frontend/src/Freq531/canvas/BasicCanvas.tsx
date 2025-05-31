import { Canvas, useFrame } from "@react-three/fiber"
import { Circle, Dodecahedron, Float, OrbitControls, Stats, TorusKnot, Tube } from "@react-three/drei"
import { useRef } from "react"
import { Mesh } from "three"
import { useFreq530 } from "../stores/useFreq530"
import { TEST_SHADER } from "../shaders/test-shader"
import { TweakShaderMaterial } from "../shaders/TweakShaderMaterial"
import { TestUseTexture } from "../shaders/TestUseTexture"
import { CachedProvider } from "../shaders/contained/CachedProvider"
import { CachedTest } from "../shaders/contained/CachedTest"
export const BasicCanvas = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="w-screen h-screen fixed top-0 left-0 z-[200] bg-black">
      <Canvas>
        <ambientLight />
        <color attach="background" args={["#000000"]} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />

        <KickSnareHihat />
        <LowMidHigh />
        <AmplitudeCylinder />

        <TestMaterialShader />
        {/* <TestUseTexture />
        <TestSphereRenderer /> */}

        {/* <TestComponent /> */}
        
        {children}
      {/* <RenderTextures /> */}
      </Canvas>
    </div>
  )
}


const TestComponent = () => {
  const ref = useRef<Mesh>(null)
  const audioState = useFreq530(s => s.values)

  useFrame(() => {
    if (ref.current) {
      // ref.current.position.y = audioState.cosNormal
      ref.current.scale.x = audioState.lowDynamic + .3
      ref.current.scale.y = audioState.midDynamic + .3
      ref.current.scale.z = audioState.highDynamic + .3
    }
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
  )
}


const KickSnareHihat = () => {
  const kickRef = useRef<Mesh>(null)
  const snareRef = useRef<Mesh>(null)
  const hihatRef = useRef<Mesh>(null)

  const refs = useFreq530(s => s.refs)

  useFrame(() => {
    if (kickRef.current) {
      kickRef.current.position.y = refs.kickDynamic.current
      kickRef.current.scale.x = refs.kickDynamic.current + .8
      kickRef.current.scale.y = refs.kickDynamic.current + .8
      kickRef.current.scale.z = refs.kickDynamic.current + .8
    }
    if (snareRef.current) {
      snareRef.current.position.y = refs.snareDynamic.current
      snareRef.current.scale.x = refs.snareDynamic.current + .8
      snareRef.current.scale.y = refs.snareDynamic.current + .8
      snareRef.current.scale.z = refs.snareDynamic.current + .8
    }
    if (hihatRef.current) {
      hihatRef.current.position.y = refs.hihatDynamic.current
      hihatRef.current.scale.x = refs.hihatDynamic.current + .8
      hihatRef.current.scale.y = refs.hihatDynamic.current + .8
      hihatRef.current.scale.z = refs.hihatDynamic.current + .8
    }
  })

  return (
    <group position={[0, 0, .1]}>
      <mesh ref={kickRef} position={[-1, 1, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <mesh ref={snareRef} position={[0, 1, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      <mesh ref={hihatRef} position={[1, 1, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="green" />
      </mesh>
    </group>
  )
}

const LowMidHigh = () => {
  const lowRef = useRef<Mesh>(null)
  const midRef = useRef<Mesh>(null)
  const highRef = useRef<Mesh>(null)

  const refs = useFreq530(s => s.refs)

  useFrame(() => {
    if (lowRef.current) {
      lowRef.current.position.y = refs.lowDynamic.current
      lowRef.current.scale.x = refs.lowDynamic.current + 1
      lowRef.current.scale.y = refs.lowDynamic.current + 1
      lowRef.current.scale.z = refs.lowDynamic.current + 1
    }
    if (midRef.current) {
      midRef.current.position.y = refs.midDynamic.current
      midRef.current.scale.x = refs.midDynamic.current + 1
      midRef.current.scale.y = refs.midDynamic.current + 1
      midRef.current.scale.z = refs.midDynamic.current + 1
    }
    if (highRef.current) {
      highRef.current.position.y = refs.highDynamic.current
      highRef.current.scale.x = refs.highDynamic.current + 1
      highRef.current.scale.y = refs.highDynamic.current + 1
      highRef.current.scale.z = refs.highDynamic.current + 1
    }
  })

  const h = 1.2

  return (
    <>
      <mesh ref={lowRef} position={[-1, 1, 1]}>
        <planeGeometry args={[1, h]} />
        <meshBasicMaterial color="orange" />
      </mesh>
      <mesh ref={midRef} position={[0, 1, 1]}>
        <planeGeometry args={[1, h]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh ref={highRef} position={[1, 1, 1]}>
        <planeGeometry args={[1, h]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </>
  )
}

const AmplitudeCylinder = () => {
  const adjustedSinRef = useRef<Mesh>(null)
  const adjustedCosRef = useRef<Mesh>(null)
  const kickDynamicRef = useRef<Mesh>(null)

  const refs = useFreq530(s => s.refs)

  useFrame(() => {
    if (adjustedSinRef.current) {
      adjustedSinRef.current.rotation.y = refs.adjustedSin.current * 1
    }
    if (adjustedCosRef.current) {
      adjustedCosRef.current.rotation.y = refs.adjustedCos.current * -1
      adjustedCosRef.current.scale.x = refs.kickDynamic.current * 2
      adjustedCosRef.current.scale.y = refs.kickDynamic.current * 2
      adjustedCosRef.current.scale.z = refs.kickDynamic.current * 2
    }
  })

  return (
    <>
      <group
        ref={adjustedSinRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, .5, 0]}
      >
        <mesh>
          <cylinderGeometry args={[1, 3, 1]} />
          <meshBasicMaterial color="purple" />
        </mesh>
        <mesh>
          <boxGeometry args={[1, 1, 4]} />
          <meshBasicMaterial color="black" />
        </mesh>
      </group>

      <group
        ref={adjustedCosRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -.5]}
      >
        <mesh>
          <cylinderGeometry args={[1, 3, 1]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        <mesh>
          <boxGeometry args={[1, 1, 4]} />
          <meshBasicMaterial color="silver" />
        </mesh>
      </group>
    </>
  )
}

const shader = TEST_SHADER
export const TestMaterialShader = () => {
  // const planeRef = useRef<Mesh>(null)
  // const sphereRef = useRef<Mesh>(null)
  // const torusRef = useRef<Mesh>(null)
  // const audioState = useFreq530(state => state.values);

  // useFrame(({ clock }) => {
  //   if (torusRef.current) {
  //     torusRef.current.position.z = audioState.amplitudeDynamic
  //   }
  //   if (sphereRef.current) {
  //     sphereRef.current.position.z = audioState.hihatDynamic
  //   }
  // })
  
  return (
    <>
    {/* <mesh ref={torusRef}>
      <torusGeometry args={[1, .5, 16, 64]} />
      <TweakShaderMaterial shader={shader} />
    </mesh> */}

    <Stats />

  {/* <Float rotationIntensity={60}>
    <TorusKnot>
      <torusKnotGeometry args={[1, .5, 100, 64]} />
      <TweakShaderMaterial shader={shader} />
    </TorusKnot>
  </Float> */}


    {/* <mesh>
      <boxGeometry args={[4, 4, 4]} />
      <TweakShaderMaterial shader={shader} />
    </mesh> */}

    <CachedProvider />
    <CachedTest />

    
{/* 
    <Circle>
      <circleGeometry args={[1, 32]} />
      <TweakShaderMaterial shader={shader} />
    </Circle>

    <Circle rotation={[0, Math.PI / 2, 0]}>
      <circleGeometry args={[1, 32]} />
      <TweakShaderMaterial shader={shader} />
    </Circle>

    <Circle rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1, 32]} />
      <TweakShaderMaterial shader={shader} />
    </Circle> */}
    

    {/* <mesh ref={sphereRef}>
      <sphereGeometry args={[.5, 30, 16]} />
      <TweakShaderMaterial shader={shader} />
    </mesh> */}
   

    {/*<mesh ref={planeRef}>
      <planeGeometry args={[10, 10]} />
      <TweakShaderMaterial shader={shader} />
    </mesh> */}
    </>
  )
}