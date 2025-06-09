import React, { useState, useRef } from 'react';
import { gsap } from 'gsap';
import TripVideoPlane from './TripVideoPlane';
import { useInterval } from 'usehooks-ts';
import { shuffle } from 'fast-shuffle';
import { VideoSourceEntry, MaskSourceEntry } from './types';

async function preloadVideo(src: string): Promise<void> {
  return new Promise(res => {
    const vid = document.createElement('video');
    vid.preload = 'auto';
    vid.muted = true;
    vid.src = src;
    const done = () => {
      vid.removeEventListener('canplaythrough', done);
      vid.removeEventListener('loadedmetadata', done);
      vid.removeEventListener('error', done);
      res();
    };
    vid.addEventListener('canplaythrough', done);
    vid.addEventListener('loadedmetadata', done);
    vid.addEventListener('error', done);
  });
}

interface TripSequenceShufflerProps {
  videos: VideoSourceEntry[];
  masks: MaskSourceEntry[];
  videoHoldDuration?: number;
  videoTransitionDuration?: number;
  maskHoldDuration?: number;
  maskTransitionDuration?: number;
}

const TripSequenceShuffler: React.FC<TripSequenceShufflerProps> = ({
  videos : _videos,
  masks : _masks,
  videoHoldDuration = 60,
  videoTransitionDuration = 10,
  maskHoldDuration = 30,
  maskTransitionDuration = 5,
}) => {
  // Filter out disabled clips before shuffling
  const enabledVideos = (_videos || []).filter(v => v.enabled !== false)
  const enabledMasks = (_masks || []).filter(m => m.enabled !== false)
  
  // Show which clips are being disabled
  const disabledVideos = (_videos || []).filter(v => v.enabled === false)
  const disabledMasks = (_masks || []).filter(m => m.enabled === false)
  
  console.log('VideoSequencer filtering:', {
    totalVideos: _videos?.length || 0,
    enabledVideos: enabledVideos.length,
    disabledVideos: disabledVideos.length,
    totalMasks: _masks?.length || 0,
    enabledMasks: enabledMasks.length,
    disabledMasks: disabledMasks.length
  });
  
  if (disabledVideos.length > 0) {
    console.log('Disabled videos excluded from cycle:', disabledVideos.map(v => v.title || v.clipSrc.split('/').pop()));
  }
  if (disabledMasks.length > 0) {
    console.log('Disabled masks excluded from cycle:', disabledMasks.map(m => m.title || m.clipSrc.split('/').pop()));
  }

  // Always shuffle, even if empty (for hooks consistency)
  const videos = shuffle(enabledVideos)
  const masks = shuffle(enabledMasks)

  // Default to first items or null if empty
  const [videoA, setVideoA] = useState<VideoSourceEntry | null>(videos[0] || null);
  const [videoB, setVideoB] = useState<VideoSourceEntry | null>(videos[1] || videos[0] || null);
  const [maskA, setMaskA] = useState<MaskSourceEntry | null>(masks[0] || null);
  const [maskB, setMaskB] = useState<MaskSourceEntry | null>(masks[1] || masks[0] || null);

  const [videoDirection, setVideoDirection] = useState(1); // Start with videoB active
  const [maskDirection, setMaskDirection] = useState(1); // Start with maskB active

  const videoIndexRef = useRef(1); // Start with the second video
  const maskIndexRef = useRef(1);  // Start with the second mask

  // Only proceed with intervals if we have valid data
  const shouldAnimate = videos.length > 0 && masks.length > 0 && videoA && videoB && maskA && maskB

  // Debug initial state
  console.log('VideoSequencer State:', {
    videoA: videoA?.clipSrc,
    videoB: videoB?.clipSrc,
    videoDirection,
    maskDirection,
    shouldAnimate,
    videoHoldDuration,
    videoTransitionDuration
  });

  // Helper function to get the correct video source based on mode setting
  const getVideoSrc = (entry: VideoSourceEntry | MaskSourceEntry | null): string => {
    if (!entry) return '';
    
    // If bounce mode and bounceSrc exists, use it
    if (entry.mode === "bounce" && entry.bounceSrc) {
      return entry.bounceSrc
    }
    
    // If bounce mode but no bounceSrc, construct the bounce_ prefixed path
    if (entry.mode === "bounce") {
      const pathParts = entry.clipSrc.split('/')
      const filename = pathParts[pathParts.length - 1]
      const directory = pathParts.slice(0, -1).join('/')
      const bounceFilename = `bounce_${filename}`
      return `${directory}/${bounceFilename}`
    }
    
    // Otherwise use original clipSrc
    return entry.clipSrc
  }

  useInterval(async () => {
    if (!shouldAnimate) return

    console.log('=== VIDEO TRANSITION STARTING ===');
    console.log('Current videoDirection:', videoDirection);
    console.log('videoHoldDuration:', videoHoldDuration, 'seconds');
    console.log('videoTransitionDuration:', videoTransitionDuration, 'seconds');

    let nextVideo: VideoSourceEntry;
    
    if (videoDirection === 0) {
      const nextIndex = (videoIndexRef.current + 1) % videos.length;
      nextVideo = videos[nextIndex];
      console.log('Switching to videoB, loading index:', nextIndex, 'video:', nextVideo.clipSrc);
      await preloadVideo(getVideoSrc(nextVideo));
      setVideoB(nextVideo);
      videoIndexRef.current = nextIndex;
    } else {
      const nextIndex = (videoIndexRef.current + 1) % videos.length;
      nextVideo = videos[nextIndex];
      console.log('Switching to videoA, loading index:', nextIndex, 'video:', nextVideo.clipSrc);
      await preloadVideo(getVideoSrc(nextVideo));
      setVideoA(nextVideo);
      videoIndexRef.current = nextIndex;
    }

    console.log('Starting GSAP transition from direction', videoDirection, 'to', videoDirection === 0 ? 1 : 0);
    console.log('New video details:', {
      title: nextVideo.title,
      src: nextVideo.clipSrc,
      ratio: nextVideo.ratio,
      dimensions: nextVideo.ratio ? `${nextVideo.ratio[0]}x${nextVideo.ratio[1]}` : 'unknown',
      aspectRatio: nextVideo.ratio ? (nextVideo.ratio[0] / nextVideo.ratio[1]).toFixed(2) : 'unknown'
    });
    
    gsap.to({ direction: videoDirection }, {
      direction: videoDirection === 0 ? 1 : 0,
      duration: videoTransitionDuration,
      onUpdate: function () {
        const newDirection = this.targets()[0].direction;
        console.log('GSAP updating videoDirection to:', newDirection);
        setVideoDirection(newDirection);
      },
      onComplete: function () {
        console.log('=== VIDEO TRANSITION COMPLETED ===');
        console.log('Final videoDirection:', this.targets()[0].direction);
      },
      overwrite: true,
    });
  }, videoHoldDuration * 1000);

  useInterval(() => {
    if (!shouldAnimate) return

    if (maskDirection === 0) {
      const nextIndex = (maskIndexRef.current + 1) % masks.length;
      preloadVideo(getVideoSrc(masks[nextIndex])).then(() => {
        setMaskB(masks[nextIndex]);
      });
      maskIndexRef.current = nextIndex;
    } else {
      const nextIndex = (maskIndexRef.current + 1) % masks.length;
      preloadVideo(getVideoSrc(masks[nextIndex])).then(() => {
        setMaskA(masks[nextIndex]);
      });
      maskIndexRef.current = nextIndex;
    }

    // GSAP animation to transition maskDirection
    gsap.to({ direction: maskDirection }, {
      direction: maskDirection === 0 ? 1 : 0,
      duration: maskTransitionDuration,
      onUpdate: function () {
        setMaskDirection(this.targets()[0].direction);  // Update maskDirection directly
      },
      overwrite: true,
    });
  }, maskHoldDuration * 1000);

  // Safety check: don't render if we don't have the necessary data
  if (!videoA || !videoB || !maskA || !maskB) {
    console.warn('VideoSequencer: Missing video or mask sources')
    return null
  }

  // Validate and log ratio data to ensure proper [width, height] format
  const validateRatio = (entry: VideoSourceEntry, name: string): [number, number] | undefined => {
    // First, try to use the ratio if it exists
    if (entry.ratio) {
      if (!Array.isArray(entry.ratio) || entry.ratio.length !== 2) {
        console.error(`VideoSequencer: Invalid ratio format for ${name}:`, entry.ratio, 'Expected [width, height] array');
        return undefined;
      }
      
      // SWAP: The incoming data appears to be [height, width], so we swap to get [width, height]
      const [height, width] = entry.ratio; // Swapped: first value is height, second is width
      if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
        console.error(`VideoSequencer: Invalid ratio values for ${name}:`, entry.ratio, 'Expected positive numbers');
        return undefined;
      }
      
      const swappedRatio: [number, number] = [width, height]; // Now properly [width, height]
      console.log(`VideoSequencer: Swapped ratio for ${name}:`, {
        original: entry.ratio,
        swapped: swappedRatio,
        dimensions: `${width}x${height}`,
        aspect: (width/height).toFixed(2)
      });
      return swappedRatio;
    }
    
    // Fallback: try to construct ratio from width/height if available
    if (entry.width && entry.height && entry.width > 0 && entry.height > 0) {
      const constructedRatio: [number, number] = [entry.width, entry.height];
      console.log(`VideoSequencer: Constructed ratio for ${name} from dimensions:`, constructedRatio, `(${entry.width}x${entry.height}, aspect: ${(entry.width/entry.height).toFixed(2)})`);
      return constructedRatio;
    }
    
    console.warn(`VideoSequencer: No ratio or dimension data available for ${name}`);
    return undefined;
  };

  // Validate ratios before passing to TripVideoPlane
  const validVideoARatio = validateRatio(videoA, 'videoA');
  const validVideoBRatio = validateRatio(videoB, 'videoB');

  // Log transition information for debugging
  console.log('VideoSequencer passing to TripVideoPlane:', {
    videoA: {
      src: getVideoSrc(videoA),
      ratio: validVideoARatio,
      title: videoA.title
    },
    videoB: {
      src: getVideoSrc(videoB),
      ratio: validVideoBRatio,
      title: videoB.title
    },
    videoDirection: videoDirection.toFixed(3),
    videoTransitionDuration
  });

  return (
    <TripVideoPlane
      videoA={getVideoSrc(videoA)}
      videoB={getVideoSrc(videoB)}
      maskA={getVideoSrc(maskA)}
      maskB={getVideoSrc(maskB)}
      videoDirection={videoDirection}
      maskDirection={maskDirection}
      // Pass validated ratio information for scale animation - [width, height] arrays
      videoARatio={validVideoARatio}
      videoBRatio={validVideoBRatio}
      // Pass transition duration for scale animation timing
      videoTransitionDuration={videoTransitionDuration}
      // 🎵 Pass speed settings for amplitude-based video control
      videoASpeedMin={videoA.customSpeedMin || videoA.speedMin || 0.3}
      videoASpeedMax={videoA.customSpeedMax || videoA.speedMax || 1.5}
      videoBSpeedMin={videoB.customSpeedMin || videoB.speedMin || 0.3}
      videoBSpeedMax={videoB.customSpeedMax || videoB.speedMax || 1.5}
      // Legacy props (keeping for compatibility)
      videoASpeed={videoA.customSpeedMin || videoA.speedMin || 1.0}
      videoBSpeed={videoB.customSpeedMin || videoB.speedMin || 1.0}
    />
  )
}

export default TripSequenceShuffler;


{/* <TripSequenceShuffler 
            videos={VIDEO_PATHS} 
            masks={MASK_PATHS} 
            videoHoldDuration={8}
            videoTransitionDuration={4}
          /> */}
