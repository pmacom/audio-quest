"use client"

import { TestRefTextureCanvas } from "@/Freq531/canvas/TestRefTextureCanvas"
import { FreqTest } from "@/Freq531/FreqTest"
import { BasicTestCanvas } from "@/Freq532/canvas/BasicTestCanvas"
import { PRIMARY_SCENE_CONTENT } from "@/Freq532/PRIMARY_SCENE_CONTENT"

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
