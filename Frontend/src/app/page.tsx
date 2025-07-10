"use client"


import { BasicTestCanvas } from "@/Freq530/canvas/BasicTestCanvas"
import { PRIMARY_SCENE_CONTENT } from "@/Freq530/PRIMARY_SCENE_CONTENT"

export default function Home() {

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* <FreqTest /> */}

      {/* <TestRefTextureCanvas></TestRefTextureCanvas> */}

      <BasicTestCanvas debug={true} >
        <PRIMARY_SCENE_CONTENT />
      </BasicTestCanvas>
    </div>
  )
}
