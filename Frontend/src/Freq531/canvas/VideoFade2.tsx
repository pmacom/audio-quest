// import { useMemo, useEffect, useRef } from 'react';
// import { useFrame } from '@react-three/fiber';
// import * as THREE from 'three';
// import { useVideoStore } from '../stores/useVideoStore';
// import { useVideoSequencer } from '../stores/useVideoSequencer';
// import { DEBUG_VideoList } from './VideoUpdater';
// import { ALPHA_MASK_PATHS, VIDEO_PATHS } from '../VIDEO_PATHS';

// interface VideoFade2Props {
//   videoSettings: { name: string; src: string; isMirror?: boolean; speedMultiplier?: number }[];
//   alphaSettings: { name: string; src: string; isMirror?: boolean; speedMultiplier?: number }[];
// }

// export const VideoFade2 = ({ videoSettings, alphaSettings }: VideoFade2Props) => {
//   const videos = useVideoStore((state) => state.videos);
//   const {
//     currentVideoIndex,
//     nextVideoIndex,
//     currentAlphaIndex,
//     nextAlphaIndex,
//     fade,
//     maskFade,
//     setVideoSettings,
//     setAlphaSettings,
//     updateAnimation,
//   } = useVideoSequencer();
//   const materialRef = useRef<THREE.ShaderMaterial | null>(null);

//   // Set video and alpha settings on mount
//   useEffect(() => {
//     setVideoSettings(videoSettings);
//     setAlphaSettings(alphaSettings);
//   }, [videoSettings, alphaSettings, setVideoSettings, setAlphaSettings]);

//   // Load and synchronize videos
//   useEffect(() => {
//     const loadAndSyncVideo = async (videoConfig, syncTime = 0, retryCount = 0) => {
//       if (!videoConfig) return;
//       try {
//         await useVideoStore.getState().loadVideo(videoConfig, (videoElement) => {
//           videoElement.currentTime = syncTime;
//           videoElement.loop = true;
//           videoElement.play().catch((e) => {
//             console.error(`Video play failed for ${videoConfig.name}:`, e);
//             if (retryCount < 3) {
//               setTimeout(() => loadAndSyncVideo(videoConfig, syncTime, retryCount + 1), 1000);
//             }
//           });
//         });
//       } catch (e) {
//         console.error(`Video loading failed for ${videoConfig.name}:`, e);
//       }
//     };

//     const video1 = videoSettings[currentVideoIndex];
//     const video2 = videoSettings[nextVideoIndex];
//     const video3 = alphaSettings[currentAlphaIndex];
//     const video4 = alphaSettings[nextAlphaIndex];

//     // Preload next videos
//     const nextVideo = videoSettings[(nextVideoIndex + 1) % videoSettings.length];
//     const nextAlpha = alphaSettings[(nextAlphaIndex + 1) % alphaSettings.length];

//     Promise.all([
//       loadAndSyncVideo(video1, 0),
//       loadAndSyncVideo(video2, 0),
//       loadAndSyncVideo(video3, 0),
//       loadAndSyncVideo(video4, 0),
//       loadAndSyncVideo(nextVideo, 0),
//       loadAndSyncVideo(nextAlpha, 0),
//     ]).catch((e) => console.error('Video loading batch failed:', e));
//   }, [currentVideoIndex, nextVideoIndex, currentAlphaIndex, nextAlphaIndex, videoSettings, alphaSettings]);

//   // Create a fallback texture
//   const fallbackTexture = useMemo(() => {
//     const canvas = document.createElement('canvas');
//     canvas.width = 1;
//     canvas.height = 1;
//     const ctx = canvas.getContext('2d');
//     ctx.fillStyle = 'gray';
//     ctx.fillRect(0, 0, 1, 1);
//     return new THREE.CanvasTexture(canvas);
//   }, []);

//   // Shader material with fixed layering
//   const material = useMemo(() => {
//     const mat = new THREE.ShaderMaterial({
//       uniforms: {
//         texture1: { value: null },
//         texture2: { value: null },
//         texture3: { value: null },
//         texture4: { value: null },
//         fade: { value: 0 },
//         maskFade: { value: 0 },
//       },
//       vertexShader: `
//         varying vec2 vUv;
//         void main() {
//           vUv = uv;
//           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//       `,
//       fragmentShader: `
//         uniform sampler2D texture1;
//         uniform sampler2D texture2;
//         uniform sampler2D texture3;
//         uniform sampler2D texture4;
//         uniform float fade;
//         uniform float maskFade;
//         varying vec2 vUv;

//         void main() {
//           // Sample color textures
//           vec4 color1 = texture2D(texture1, vUv);
//           vec4 color2 = texture2D(texture2, vUv);
          
//           // Blend colors: texture1 always fades in over texture2
//           vec4 baseColor = mix(color2, color1, clamp(fade, 0.0, 1.0));

//           // Sample mask textures (assuming grayscale)
//           float alpha1 = texture2D(texture3, vUv).r;
//           float alpha2 = texture2D(texture4, vUv).r;
          
//           // Blend alpha: texture3 always fades in over texture4
//           float alpha = mix(alpha2, alpha1, clamp(maskFade, 0.0, 1.0));
          
//           // Apply mask as alpha
//           gl_FragColor = vec4(baseColor.rgb, baseColor.a * alpha);
          
//           // Debug: Visualize alpha
//           // gl_FragColor = vec4(vec3(alpha), 1.0);
//         }
//       `,
//       transparent: true,
//       blending: THREE.NormalBlending,
//       depthWrite: false,
//     });
//     return mat;
//   }, []);

//   // Attach material ref
//   useEffect(() => {
//     materialRef.current = material;
//   }, [material]);

//   // Update animation and uniforms
//   useFrame((state, delta) => {
//     updateAnimation(delta * 1000);

//     const videoData1 = videos[videoSettings[currentVideoIndex]?.name]?.current;
//     const videoData2 = videos[videoSettings[nextVideoIndex]?.name]?.current;
//     const videoData3 = videos[alphaSettings[currentAlphaIndex]?.name]?.current;
//     const videoData4 = videos[alphaSettings[nextAlphaIndex]?.name]?.current;
//     if (materialRef.current) {
//       materialRef.current.uniforms.texture1.value = videoData1?.texture || fallbackTexture;
//       materialRef.current.uniforms.texture2.value = videoData2?.texture || fallbackTexture;
//       materialRef.current.uniforms.texture3.value = videoData3?.texture || fallbackTexture;
//       materialRef.current.uniforms.texture4.value = videoData4?.texture || fallbackTexture;
//       materialRef.current.uniforms.fade.value = fade;
//       materialRef.current.uniforms.maskFade.value = maskFade;

//       // Debug logging
//       if (!videoData1?.texture || !videoData2?.texture) {
//         console.warn('Color texture missing:', { video1: videoData1?.texture, video2: videoData2?.texture });
//       }
//       if (!videoData3?.texture || !videoData4?.texture) {
//         console.warn('Alpha texture missing:', { video3: videoData3?.texture, video4: videoData4?.texture });
//       }
//       if (videoData1?.video.paused || videoData2?.video.paused) {
//         console.warn('Color video paused:', {
//           video1: videoData1?.video.paused,
//           video2: videoData2?.video.paused,
//         });
//       }
//     }
//   });

//   return (
//     <mesh position={[0, 3, 0]} renderOrder={1}>
//       <planeGeometry args={[16, 9]} />
//       <primitive object={material} transparent={true} />
//     </mesh>
//   );
// };

// // Test component
// export const TestVideoFade2 = () => {
//   return (
//     <VideoFade2
//       videoSettings={VIDEO_PATHS}
//       alphaSettings={ALPHA_MASK_PATHS}
//     />
//   );
// };

// export default TestVideoFade2;