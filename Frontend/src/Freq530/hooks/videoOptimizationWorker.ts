// WebWorker for offloading video optimization calculations
// This keeps the main thread free for rendering while calculating optimal playback parameters

export interface VideoOptimizationParams {
  videoDuration: number;
  playbackRate: number;
  targetReverseDuration: number;
  bufferHealth: number;
  visibility: number;
  currentTime: number;
}

export interface OptimizationResult {
  stepSize: number;
  intervalTiming: number;
  shouldUpdateTexture: boolean;
  qualityHint: 'high' | 'medium' | 'low';
}

// Worker function (this runs in the worker thread)
const workerFunction = () => {
  self.onmessage = (event: MessageEvent<VideoOptimizationParams>) => {
    const { 
      videoDuration, 
      playbackRate, 
      targetReverseDuration, 
      bufferHealth, 
      visibility,
      currentTime 
    } = event.data;

    // Complex calculations that would otherwise block the main thread
    const baseStepSize = playbackRate * 0.0167;
    const targetSteps = Math.ceil(targetReverseDuration * 60);
    const preComputedStepSize = videoDuration / targetSteps;
    
    // Multi-factor optimization calculation
    let optimizedStepSize;
    if (bufferHealth > 5) {
      optimizedStepSize = preComputedStepSize;
    } else if (bufferHealth > 2) {
      optimizedStepSize = videoDuration > 30 ? baseStepSize * 2 : baseStepSize;
    } else {
      optimizedStepSize = baseStepSize * 4;
    }
    
    // Visibility-based step adjustment
    const visibilityAdjustedStep = visibility > 0.1 ? optimizedStepSize : optimizedStepSize * 2;
    
    // Dynamic interval calculation
    let intervalTiming = 20; // Base 50fps
    if (visibility < 0.1) intervalTiming = 33; // 30fps for low visibility
    if (bufferHealth < 2) intervalTiming = 50; // 20fps for poor buffer
    if (videoDuration > 60) intervalTiming += 10; // Slower for long videos
    
    // Quality hint calculation
    let qualityHint: 'high' | 'medium' | 'low' = 'high';
    if (visibility < 0.3 || bufferHealth < 1) qualityHint = 'low';
    else if (visibility < 0.7 || bufferHealth < 3) qualityHint = 'medium';
    
    // Texture update decision
    const progressRatio = currentTime / videoDuration;
    const shouldUpdateTexture = visibility > 0.1 && (progressRatio % 0.033 < 0.017); // ~30fps updates
    
    const result: OptimizationResult = {
      stepSize: visibilityAdjustedStep,
      intervalTiming,
      shouldUpdateTexture,
      qualityHint
    };
    
    // Send result back to main thread
    self.postMessage(result);
  };
};

// Create worker URL from function
const createWorkerURL = (fn: Function): string => {
  const blob = new Blob([`(${fn.toString()})()`], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
};

// Worker class for easy usage
export class VideoOptimizationWorker {
  private worker: Worker;
  private workerURL: string;

  constructor() {
    this.workerURL = createWorkerURL(workerFunction);
    this.worker = new Worker(this.workerURL);
  }

  calculate(params: VideoOptimizationParams): Promise<OptimizationResult> {
    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent<OptimizationResult>) => {
        this.worker.removeEventListener('message', handleMessage);
        resolve(event.data);
      };
      
      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage(params);
    });
  }

  dispose() {
    this.worker.terminate();
    URL.revokeObjectURL(this.workerURL);
  }
} 