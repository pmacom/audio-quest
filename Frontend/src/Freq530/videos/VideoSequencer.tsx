import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import TripVideoPlane from './TripVideoPlane';
import { useInterval } from 'usehooks-ts';
import { shuffle } from 'fast-shuffle';
import { VideoSourceEntry } from './videoList';

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
  masks: string[];
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
  const videos = shuffle(_videos)
  const masks = shuffle(_masks)

  const [videoA, setVideoA] = useState<VideoSourceEntry>(videos[0]);
  const [videoB, setVideoB] = useState<VideoSourceEntry>(videos[1]);
  const [maskA, setMaskA] = useState(masks[0]);
  const [maskB, setMaskB] = useState(masks[1]);

  const [videoDirection, setVideoDirection] = useState(1); // Start with videoB active
  const [maskDirection, setMaskDirection] = useState(1); // Start with maskB active

  const videoIndexRef = useRef(1); // Start with the second video
  const maskIndexRef = useRef(1);  // Start with the second mask


  useInterval(async () => {
    if (videoDirection === 0) {
      const nextIndex = (videoIndexRef.current + 1) % videos.length;
      await preloadVideo(videos[nextIndex].src);
      setVideoB(videos[nextIndex]);
      videoIndexRef.current = nextIndex;
    } else {
      const nextIndex = (videoIndexRef.current + 1) % videos.length;
      await preloadVideo(videos[nextIndex].src);
      setVideoA(videos[nextIndex]);
      videoIndexRef.current = nextIndex;
    }

    gsap.to({ direction: videoDirection }, {
      direction: videoDirection === 0 ? 1 : 0,
      duration: videoTransitionDuration,
      onUpdate: function () {
        setVideoDirection(this.targets()[0].direction);
      },
      overwrite: true,
    });
  }, videoHoldDuration * 1000);

  useInterval(() => {
    if (maskDirection === 0) {
      const nextIndex = (maskIndexRef.current + 1) % masks.length;
      setMaskB(masks[nextIndex]);
      maskIndexRef.current = nextIndex;
    } else {
      const nextIndex = (maskIndexRef.current + 1) % masks.length;
      setMaskA(masks[nextIndex]);
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


  return (
    <TripVideoPlane
      videoA={videoA.src}
      videoB={videoB.src}
      bounceVideoA={videoA.bounce}
      bounceVideoB={videoB.bounce}
      maskA={maskA}
      maskB={maskB}
      videoDirection={videoDirection}
      maskDirection={maskDirection}
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
