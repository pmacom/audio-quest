import { useFrame } from '@react-three/fiber';
import { useFreq530 } from '../stores/useFreq530'; // Zustand store
import { useVideoStore } from '../stores/useVideoStore'; // Video state management
import { useRef } from 'react';

export const VideoUpdater = () => {
  const { updateVideos } = useVideoStore();

  useFrame((state) => {
    const deltaTime = state.clock.getDelta();
    updateVideos(deltaTime);
  });

  return null; // No rendering needed
};

export interface VideoSetting {
  name: string;
  src: string;
  isMirror?: boolean;
  speedMultiplier?: number;
}

export const DEBUG_VideoList: VideoSetting[] = [
  // VIDEO LIST SHORTENED TO 4 for testing
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/zcK3rihY3BcDpBtA.mp4' },
  {name: "V2", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/yHI3qPVuno7eBVW2.mp4' },
  {name: "V3", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/xO0bI3kw5wIj1e7e.mp4' },
  {name: "V4", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/xL3MJE0NmIR0Jkhx.mp4' },
  {name: "V5", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/sXHJMpzbF7Vxa9BH.mp4' },
  {name: "V6", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/q2TViYgCqqJZ3Zto.mp4' },
  {name: "V7", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/oACo-KJIzd7F00Xv.mp4' },
  {name: "V8", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/mzKYyGSGqNfiKhix.mp4' },
  {name: "V9", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/h2S_ZTpRejhudjrB.mp4' },
]


/* OTHER VIDEOS WE MIGHT USE
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/gyVop7DX9A_cT6-h.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/gRl2ZYH0tglzVYZ7.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/eKRnec7g-bp1z1gp.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/Wdx0WPG4riOnHPzJ.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/WXUFYVWLXTE8d_f8.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/VvTaml2CBFKTO5w4.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/SagZTALgNGJr6DtD.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/RHjlUnYVOZaJuM88.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/GPb-uIxXcAAWQcB.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/FoZuBgxxBUkNu43l.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/E2jrpnuRqWNDn_XT.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/D1M6N1ktcCEGwwXZ.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/4xLLjHaCCODWel7T.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/2Z75IH7UF4IHObBD.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/1Oh8K3CXAG1s0hmh.mp4' },
  {name: "V1", isMirror: false, speedMultiplier: 1,  src:'/videos/group_1/0YEeB5CHuW-S0koX.mp4' }
*/
