import { SceneCut } from '../types';

export interface SceneDetectionOptions {
  threshold?: number; // 0.15 - 0.45, default 0.22
  sampleInterval?: number; // seconds, default 0.4s
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

/**
 * Computer-vision based frame difference algorithm to automatically detect scene changes.
 */
export async function detectVideoScenes(
  videoSourceUrl: string,
  duration: number,
  options: SceneDetectionOptions = {}
): Promise<SceneCut[]> {
  const { threshold = 0.22, sampleInterval = 0.4, onProgress, signal } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    if (videoSourceUrl.startsWith('http://') || videoSourceUrl.startsWith('https://')) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 36;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = 90;
    const thumbCtx = thumbCanvas.getContext('2d');

    if (!sampleCtx || !thumbCtx) {
      return reject(new Error('Canvas context not available for scene detection'));
    }

    const cuts: SceneCut[] = [
      {
        id: 'scene-0',
        timestamp: 0,
        label: 'Scene 1: Intro',
        confidence: 1.0,
      },
    ];

    let prevImageData: ImageData | null = null;
    let currentTime = 0;
    let sceneIndex = 2;

    const cleanup = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const seekTo = (targetTime: number): Promise<void> => {
      return new Promise((res) => {
        if (Math.abs(video.currentTime - targetTime) < 0.05) {
          return res();
        }

        let isDone = false;
        const timer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            video.removeEventListener('seeked', onSeeked);
            res();
          }
        }, 300);

        const onSeeked = () => {
          if (!isDone) {
            isDone = true;
            clearTimeout(timer);
            video.removeEventListener('seeked', onSeeked);
            res();
          }
        };

        video.addEventListener('seeked', onSeeked, { once: true });
        try {
          video.currentTime = targetTime;
        } catch {
          res();
        }
      });
    };

    const processScenes = async () => {
      try {
        const totalSamples = Math.floor(duration / sampleInterval);
        let sampleCount = 0;

        while (currentTime < duration) {
          if (signal?.aborted) {
            cleanup();
            return reject(new Error('Scene detection aborted'));
          }

          await seekTo(currentTime);

          // Draw low-res sample for histogram comparison
          sampleCtx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
          const currentImg = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);

          if (prevImageData) {
            let totalDelta = 0;
            const pixels = currentImg.data.length / 4;

            for (let i = 0; i < currentImg.data.length; i += 4) {
              const rDiff = Math.abs(currentImg.data[i] - prevImageData.data[i]);
              const gDiff = Math.abs(currentImg.data[i + 1] - prevImageData.data[i + 1]);
              const bDiff = Math.abs(currentImg.data[i + 2] - prevImageData.data[i + 2]);
              totalDelta += (rDiff + gDiff + bDiff) / (3 * 255);
            }

            const frameDiffScore = totalDelta / pixels;

            if (frameDiffScore >= threshold) {
              // Capture thumbnail for the new scene
              thumbCtx.drawImage(video, 0, 0, thumbCanvas.width, thumbCanvas.height);
              const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

              cuts.push({
                id: `scene-${cuts.length}`,
                timestamp: Math.max(0, currentTime - sampleInterval / 2),
                label: `Scene ${sceneIndex}: Cut @ ${currentTime.toFixed(1)}s`,
                confidence: Math.min(1, frameDiffScore * 2),
                thumbnailUrl: thumbUrl,
              });
              sceneIndex++;
            }
          } else {
            // First scene thumbnail
            thumbCtx.drawImage(video, 0, 0, thumbCanvas.width, thumbCanvas.height);
            cuts[0].thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);
          }

          prevImageData = currentImg;
          sampleCount++;
          currentTime += sampleInterval;

          if (onProgress) {
            onProgress(Math.min(99, Math.round((sampleCount / totalSamples) * 100)));
          }
        }

        cleanup();
        if (onProgress) onProgress(100);
        resolve(cuts);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for scene detection'));
    };

    video.addEventListener('loadedmetadata', () => {
      processScenes();
    }, { once: true });
    video.src = videoSourceUrl;

    if (video.readyState >= 1) {
      processScenes();
    }
  });
}
