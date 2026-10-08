import { CropRect, DelogoPatch, ExportPreset, TextOverlay } from '../types';
import fixWebmDuration from 'fix-webm-duration';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface ExportVideoParams {
  videoSrc: string;
  originalWidth: number;
  originalHeight: number;
  trimStart: number;
  trimEnd: number;
  crop: CropRect;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  playbackSpeed: number;
  volume: number;
  textOverlay: TextOverlay;
  delogoPatch: DelogoPatch;
  preset: ExportPreset;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  duration: number;
  sizeBytes: number;
}

interface ExtractedAudioData {
  channels: Float32Array[];
  sampleRate: number;
  numChannels: number;
  numSamples: number;
  durationSec: number;
}

/**
 * Extracts and trims raw audio PCM data via Web Audio API.
 * This guarantees frame-accurate, drift-free audio synchronization and proper volume scaling.
 */
async function extractAudioData(
  videoSrc: string,
  volume: number,
  trimStart: number,
  trimEnd: number
): Promise<ExtractedAudioData | null> {
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;

    const resp = await fetch(videoSrc);
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();

    const actx = new AudioCtxClass();
    const decoded = await actx.decodeAudioData(arrayBuffer);
    actx.close().catch(() => {});

    if (!decoded || decoded.numberOfChannels === 0 || decoded.length === 0) {
      return null;
    }

    const sampleRate = decoded.sampleRate;
    const startSample = Math.max(0, Math.floor(trimStart * sampleRate));
    const endSample = Math.min(decoded.length, Math.ceil(trimEnd * sampleRate));
    const numSamples = Math.max(0, endSample - startSample);

    if (numSamples <= 0) return null;

    const channels: Float32Array[] = [];
    const numChannels = Math.min(2, decoded.numberOfChannels);

    for (let ch = 0; ch < numChannels; ch++) {
      const srcChannel = decoded.getChannelData(ch);
      const destChannel = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        destChannel[i] = (srcChannel[startSample + i] || 0) * volume;
      }
      channels.push(destChannel);
    }

    return {
      channels,
      sampleRate,
      numChannels,
      numSamples,
      durationSec: numSamples / sampleRate,
    };
  } catch (err) {
    console.warn('Direct audio decoding warning (video may be silent or cross-origin):', err);
    return null;
  }
}

/**
 * Draws the current video frame onto the canvas applying all transforms:
 * crop rect, 90/180/270 rotation, horizontal/vertical flip, delogo masks, and text overlays.
 */
function drawFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  outWidth: number,
  outHeight: number,
  crop: CropRect,
  originalWidth: number,
  originalHeight: number,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  delogoPatch: DelogoPatch,
  textOverlay: TextOverlay
) {
  // Clear Canvas with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, outWidth, outHeight);

  // Source crop in video pixel coordinates
  const vWidth = originalWidth || video.videoWidth || outWidth;
  const vHeight = originalHeight || video.videoHeight || outHeight;
  const sx = (crop.x / 100) * vWidth;
  const sy = (crop.y / 100) * vHeight;
  const sw = Math.max(1, (crop.width / 100) * vWidth);
  const sh = Math.max(1, (crop.height / 100) * vHeight);

  // Transform coordinates for rotation & flip
  ctx.save();
  ctx.translate(outWidth / 2, outHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Determine drawing dimensions centered on canvas
  const isSwap = rotation === 90 || rotation === 270;
  const targetW = isSwap ? outHeight : outWidth;
  const targetH = isSwap ? outWidth : outHeight;

  const scale = Math.min(targetW / sw, targetH / sh);
  const dw = sw * scale;
  const dh = sh * scale;

  ctx.drawImage(video, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  // Delogo mask / blur / pixelate filter
  if (delogoPatch.enabled) {
    const logoPxX = Math.round((delogoPatch.x / 100) * outWidth);
    const logoPxY = Math.round((delogoPatch.y / 100) * outHeight);
    const logoPxW = Math.round((delogoPatch.width / 100) * outWidth);
    const logoPxH = Math.round((delogoPatch.height / 100) * outHeight);

    if (delogoPatch.style === 'blur') {
      ctx.save();
      ctx.beginPath();
      ctx.rect(logoPxX, logoPxY, logoPxW, logoPxH);
      ctx.clip();
      ctx.filter = `blur(${delogoPatch.blurStrength || 8}px)`;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(logoPxX, logoPxY, logoPxW, logoPxH);
      ctx.restore();
    } else if (delogoPatch.style === 'pixelate') {
      const sampleBlock = 8;
      const imgData = ctx.getImageData(logoPxX, logoPxY, logoPxW, logoPxH);
      for (let py = 0; py < imgData.height; py += sampleBlock) {
        for (let px = 0; px < imgData.width; px += sampleBlock) {
          const pixelIndex = (py * imgData.width + px) * 4;
          const r = imgData.data[pixelIndex];
          const g = imgData.data[pixelIndex + 1];
          const b = imgData.data[pixelIndex + 2];
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(logoPxX + px, logoPxY + py, sampleBlock, sampleBlock);
        }
      }
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(logoPxX, logoPxY, logoPxW, logoPxH);
    }
  }

  // Text Overlay
  if (textOverlay.enabled && textOverlay.text.trim()) {
    const textX = (textOverlay.x / 100) * outWidth;
    const textY = (textOverlay.y / 100) * outHeight;
    const scaledFontSize = Math.round((textOverlay.fontSize * outWidth) / 1080);
    ctx.font = `bold ${Math.max(16, scaledFontSize)}px ${textOverlay.fontFamily || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(textOverlay.text);
    const padX = 16;
    const padY = 8;
    const boxW = metrics.width + padX * 2;
    const boxH = scaledFontSize + padY * 2;

    if (textOverlay.hasBackground) {
      ctx.fillStyle = textOverlay.backgroundColor || 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(textX - boxW / 2, textY - boxH / 2, boxW, boxH, 8);
      ctx.fill();
    }

    ctx.fillStyle = textOverlay.color || '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(textOverlay.text, textX, textY);
    ctx.shadowBlur = 0;
  }
}

/**
 * Primary Universal MP4 Engine using WebCodecs (VideoEncoder + AudioEncoder) and mp4-muxer.
 * Produces genuine ISO MP4 files with H.264 (AVC) and AAC audio.
 * Places the 'moov' atom at the front (fastStart) so Windows Media Player, QuickTime,
 * Movies & TV, VLC, KMPlayer, Yandex, mobile players, and all platforms can play and seek.
 */
async function exportWithWebCodecsMp4(params: ExportVideoParams): Promise<ExportResult> {
  const {
    videoSrc,
    originalWidth,
    originalHeight,
    trimStart,
    trimEnd,
    crop,
    rotation,
    flipH,
    flipV,
    playbackSpeed,
    volume,
    textOverlay,
    delogoPatch,
    preset,
    onProgress,
    signal,
  } = params;

  // H.264 requires dimensions to be even numbers (multiples of 2)
  const outW = Math.max(2, Math.round(preset.width / 2) * 2);
  const outH = Math.max(2, Math.round(preset.height / 2) * 2);
  const fps = preset.fps || 30;
  const trimmedDuration = Math.max(0.1, trimEnd - trimStart);

  // 1. Determine best supported H.264 AVC Profile
  const is1080pOrHigher = outW >= 1280 || outH >= 720;
  const candidateCodecs = is1080pOrHigher
    ? ['avc1.4d002a', 'avc1.640028', 'avc1.420028', 'avc1.42E01F']
    : ['avc1.42E01F', 'avc1.4d001f', 'avc1.4d002a', 'avc1.640028'];

  let chosenVideoCodec = candidateCodecs[0];
  for (const c of candidateCodecs) {
    try {
      const sup = await VideoEncoder.isConfigSupported({
        codec: c,
        width: outW,
        height: outH,
        bitrate: Math.round((preset.bitrateMb || 3.5) * 1_000_000),
        framerate: fps,
      });
      if (sup.supported) {
        chosenVideoCodec = c;
        break;
      }
    } catch {
      // try next
    }
  }

  // 2. Extract source audio and configure AudioEncoder (AAC-LC preferred for universal playback)
  const audioData = await extractAudioData(videoSrc, volume, trimStart, trimEnd);
  let chosenAudioCodec: 'aac' | 'opus' | null = null;
  let audioEncoderConfig: AudioEncoderConfig | null = null;

  if (audioData && typeof window.AudioEncoder === 'function') {
    // Try AAC-LC first (supported in Windows Media Player, QuickTime, Movies & TV, etc.)
    const aacConfig: AudioEncoderConfig = {
      codec: 'mp4a.40.2',
      sampleRate: audioData.sampleRate,
      numberOfChannels: audioData.numChannels,
      bitrate: 128000,
    };
    try {
      const aacSup = await AudioEncoder.isConfigSupported(aacConfig);
      if (aacSup.supported) {
        chosenAudioCodec = 'aac';
        audioEncoderConfig = aacConfig;
      }
    } catch {
      // AAC not supported
    }

    if (!chosenAudioCodec) {
      const opusConfig: AudioEncoderConfig = {
        codec: 'opus',
        sampleRate: audioData.sampleRate,
        numberOfChannels: audioData.numChannels,
        bitrate: 128000,
      };
      try {
        const opusSup = await AudioEncoder.isConfigSupported(opusConfig);
        if (opusSup.supported) {
          chosenAudioCodec = 'opus';
          audioEncoderConfig = opusConfig;
        }
      } catch {
        // Opus not supported
      }
    }
  }

  // 3. Initialize MP4 Muxer with fastStart: 'in-memory'
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: outW,
      height: outH,
    },
    audio:
      chosenAudioCodec && audioData
        ? {
            codec: chosenAudioCodec,
            numberOfChannels: audioData.numChannels,
            sampleRate: audioData.sampleRate,
          }
        : undefined,
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  // 4. Initialize VideoEncoder
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => {
      console.error('VideoEncoder runtime error:', e);
    },
  });

  videoEncoder.configure({
    codec: chosenVideoCodec,
    width: outW,
    height: outH,
    bitrate: Math.round((preset.bitrateMb || 3.5) * 1_000_000),
    framerate: fps,
  });

  // 5. Initialize AudioEncoder (if audio present)
  let audioEncoder: AudioEncoder | null = null;
  if (chosenAudioCodec && audioEncoderConfig) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => {
        muxer.addAudioChunk(chunk, meta);
      },
      error: (e) => {
        console.warn('AudioEncoder runtime error:', e);
      },
    });
    audioEncoder.configure(audioEncoderConfig);
  }

  // 6. Setup Rendering Canvas and Video Element
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not create 2D canvas context for export');

  const video = document.createElement('video');
  if (videoSrc.startsWith('http://') || videoSrc.startsWith('https://')) {
    video.crossOrigin = 'anonymous';
  }
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.playbackRate = playbackSpeed;

  return new Promise<ExportResult>((resolve, reject) => {
    let animId: number;
    let isAborted = false;

    const cleanup = () => {
      isAborted = true;
      cancelAnimationFrame(animId);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const runRender = async () => {
      try {
        // Seek to trim start
        if (Math.abs(video.currentTime - trimStart) > 0.05) {
          video.currentTime = trimStart;
          await new Promise<void>((r) => {
            let done = false;
            const timer = setTimeout(() => {
              if (!done) {
                done = true;
                video.removeEventListener('seeked', onSeeked);
                r();
              }
            }, 400);

            const onSeeked = () => {
              if (!done) {
                done = true;
                clearTimeout(timer);
                video.removeEventListener('seeked', onSeeked);
                r();
              }
            };
            video.addEventListener('seeked', onSeeked);
          });
        }

        if (signal?.aborted) {
          cleanup();
          return reject(new Error('Export cancelled by user'));
        }

        await video.play();

        let frameIndex = 0;
        let lastRenderTime = -1;

        const loop = async () => {
          if (isAborted) return;

          if (signal?.aborted) {
            cleanup();
            return reject(new Error('Export cancelled by user'));
          }

          const currentVideoTime = video.currentTime;
          const elapsedSec = Math.max(0, currentVideoTime - trimStart);
          const progressPct = Math.min(99, Math.round((elapsedSec / trimmedDuration) * 100));
          if (onProgress) onProgress(progressPct);

          // Finished reaching trimEnd
          if (currentVideoTime >= trimEnd || video.ended) {
            if (onProgress) onProgress(100);
            cleanup();

            try {
              // Encode audio track if present
              if (audioEncoder && audioData) {
                const samplesPerChunk = 1024;
                let sampleOffset = 0;
                while (sampleOffset < audioData.numSamples) {
                  const currentBlock = Math.min(samplesPerChunk, audioData.numSamples - sampleOffset);
                  const planarBuffer = new Float32Array(currentBlock * audioData.numChannels);
                  for (let ch = 0; ch < audioData.numChannels; ch++) {
                    const srcCh = audioData.channels[ch];
                    for (let i = 0; i < currentBlock; i++) {
                      planarBuffer[ch * currentBlock + i] = srcCh[sampleOffset + i];
                    }
                  }
                  const audioTimestampUs = Math.round(
                    (sampleOffset / audioData.sampleRate) * 1_000_000
                  );
                  const aFrame = new AudioData({
                    format: 'f32-planar',
                    sampleRate: audioData.sampleRate,
                    numberOfFrames: currentBlock,
                    numberOfChannels: audioData.numChannels,
                    timestamp: audioTimestampUs,
                    data: planarBuffer,
                  });
                  audioEncoder.encode(aFrame);
                  aFrame.close();
                  sampleOffset += currentBlock;
                }
                await audioEncoder.flush();
              }

              // Flush video encoder
              await videoEncoder.flush();

              // Finalize ISO MP4
              muxer.finalize();
              const buffer = muxer.target.buffer;
              const finalBlob = new Blob([buffer], { type: 'video/mp4' });
              const cleanName = `ClipTrim_${preset.platform}_${Date.now()}.mp4`;
              const url = URL.createObjectURL(finalBlob);

              resolve({
                blob: finalBlob,
                url,
                filename: cleanName,
                duration: trimmedDuration,
                sizeBytes: finalBlob.size,
              });
            } catch (finishErr) {
              reject(finishErr);
            }
            return;
          }

          // Render only when time advances to avoid duplicate frames
          if (currentVideoTime !== lastRenderTime) {
            lastRenderTime = currentVideoTime;
            drawFrameToCanvas(
              ctx,
              video,
              outW,
              outH,
              crop,
              originalWidth,
              originalHeight,
              rotation,
              flipH,
              flipV,
              delogoPatch,
              textOverlay
            );

            const timestampUs = Math.max(0, Math.round(elapsedSec * 1_000_000));
            const frame = new VideoFrame(canvas, { timestamp: timestampUs });
            const isKeyFrame = frameIndex % (fps * 2) === 0;
            videoEncoder.encode(frame, { keyFrame: isKeyFrame });
            frame.close();
            frameIndex++;
          }

          animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for export rendering'));
    };

    video.addEventListener('loadedmetadata', runRender, { once: true });
    video.src = videoSrc;
    if (video.readyState >= 1) {
      runRender();
    }
  });
}

/**
 * Fallback MediaRecorder export engine.
 * Prioritizes standard MP4 container first, and patches WebM with fixWebmDuration if WebM is selected.
 */
async function exportWithMediaRecorder(params: ExportVideoParams): Promise<ExportResult> {
  const {
    videoSrc,
    originalWidth,
    originalHeight,
    trimStart,
    trimEnd,
    crop,
    rotation,
    flipH,
    flipV,
    playbackSpeed,
    volume,
    textOverlay,
    delogoPatch,
    preset,
    onProgress,
    signal,
  } = params;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    if (videoSrc.startsWith('http://') || videoSrc.startsWith('https://')) {
      video.crossOrigin = 'anonymous';
    }
    video.muted = false;
    video.volume = Math.max(0, Math.min(1, volume));
    video.playbackRate = playbackSpeed;
    video.playsInline = true;
    video.preload = 'auto';

    const outWidth = Math.max(2, Math.round(preset.width / 2) * 2);
    const outHeight = Math.max(2, Math.round(preset.height / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d', { alpha: false });

    if (!ctx) {
      return reject(new Error('Canvas context could not be created'));
    }

    let audioCtx: AudioContext | null = null;
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    let audioTracks: MediaStreamTrack[] = [];

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        audioDest = audioCtx.createMediaStreamDestination();
        const audioSource = audioCtx.createMediaElementSource(video);
        const gain = audioCtx.createGain();
        gain.gain.value = volume;
        audioSource.connect(gain);
        gain.connect(audioDest);
      }
    } catch (e) {
      console.warn('Audio graph setup warning:', e);
    }

    try {
      const vStream =
        typeof (video as unknown as { captureStream?: () => MediaStream }).captureStream === 'function'
          ? (video as unknown as { captureStream: () => MediaStream }).captureStream()
          : typeof (video as unknown as { mozCaptureStream?: () => MediaStream }).mozCaptureStream ===
            'function'
          ? (video as unknown as { mozCaptureStream: () => MediaStream }).mozCaptureStream()
          : null;

      if (vStream) {
        const directAudio = vStream.getAudioTracks();
        if (directAudio.length > 0 && (!audioDest || audioDest.stream.getAudioTracks().length === 0)) {
          audioTracks = directAudio;
        }
      }
    } catch {
      // ignore
    }

    if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
      audioTracks = audioDest.stream.getAudioTracks();
    }

    const canvasStream = canvas.captureStream(preset.fps || 30);
    const combinedTracks = [...canvasStream.getVideoTracks(), ...audioTracks];
    const stream = new MediaStream(combinedTracks);

    // Prioritize MP4 (H.264 / AAC) at the TOP for universal player compatibility
    const mimeCandidates =
      preset.format === 'webm'
        ? [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
          ]
        : [
            'video/mp4;codecs=avc1.42E01F,mp4a.40.2',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4;codecs=avc1',
            'video/mp4',
            'video/webm;codecs=h264,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm',
          ];

    let mimeType = 'video/mp4';
    for (const candidate of mimeCandidates) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        mimeType = candidate;
        break;
      }
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: (preset.bitrateMb || 3.5) * 1000000,
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const trimmedDuration = Math.max(0.1, trimEnd - trimStart);
    let isFinished = false;
    let animFrameId: number;

    const cleanup = () => {
      isFinished = true;
      cancelAnimationFrame(animFrameId);
      video.pause();
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      video.removeAttribute('src');
      video.load();
    };

    recorder.onstop = async () => {
      const rawBlob = new Blob(chunks, { type: mimeType });
      const durationMs = Math.max(100, Math.round(trimmedDuration * 1000));

      let finalBlob = rawBlob;
      if (mimeType.includes('webm')) {
        try {
          finalBlob = await fixWebmDuration(rawBlob, durationMs);
        } catch (err) {
          console.warn('Could not inject WebM duration metadata:', err);
          finalBlob = rawBlob;
        }
      }

      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const cleanName = `ClipTrim_${preset.platform}_${Date.now()}.${extension}`;
      const url = URL.createObjectURL(finalBlob);
      cleanup();
      resolve({
        blob: finalBlob,
        url,
        filename: cleanName,
        duration: trimmedDuration,
        sizeBytes: finalBlob.size,
      });
    };

    recorder.onerror = (e) => {
      cleanup();
      reject(new Error('MediaRecorder error: ' + (e as unknown as Error).message));
    };

    const startExport = async () => {
      try {
        if (Math.abs(video.currentTime - trimStart) > 0.05) {
          video.currentTime = trimStart;
          await new Promise<void>((r) => {
            let isDone = false;
            const timer = setTimeout(() => {
              if (!isDone) {
                isDone = true;
                video.removeEventListener('seeked', onSeeked);
                r();
              }
            }, 350);

            const onSeeked = () => {
              if (!isDone) {
                isDone = true;
                clearTimeout(timer);
                video.removeEventListener('seeked', onSeeked);
                r();
              }
            };
            video.addEventListener('seeked', onSeeked);
          });
        }

        if (signal?.aborted) {
          cleanup();
          return reject(new Error('Export cancelled'));
        }

        if (audioCtx && audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        recorder.start(100);
        await video.play();

        const renderLoop = () => {
          if (isFinished) return;

          if (signal?.aborted) {
            cleanup();
            if (recorder.state === 'recording') recorder.stop();
            return reject(new Error('Export cancelled by user'));
          }

          const currentElapsed = Math.max(0, video.currentTime - trimStart);
          const progressPct = Math.min(99, Math.round((currentElapsed / trimmedDuration) * 100));
          if (onProgress) onProgress(progressPct);

          if (video.currentTime >= trimEnd || video.ended) {
            if (onProgress) onProgress(100);
            cleanup();
            if (recorder.state === 'recording') {
              recorder.stop();
            }
            return;
          }

          drawFrameToCanvas(
            ctx,
            video,
            outWidth,
            outHeight,
            crop,
            originalWidth,
            originalHeight,
            rotation,
            flipH,
            flipV,
            delogoPatch,
            textOverlay
          );

          animFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for export rendering'));
    };

    video.addEventListener('loadedmetadata', () => {
      startExport();
    }, { once: true });
    video.src = videoSrc;

    if (video.readyState >= 1) {
      startExport();
    }
  });
}

/**
 * Main export function.
 * Uses the Universal WebCodecs MP4 engine when available to create true H.264/AAC MP4 files
 * compatible with Windows Media Player, QuickTime, Movies & TV, VLC, KMPlayer, Yandex, PotPlayer,
 * iOS, Android, and web players.
 * Falls back to MediaRecorder with MP4 priority if WebCodecs is unavailable.
 */
export async function renderAndExportVideo(params: ExportVideoParams): Promise<ExportResult> {
  const hasWebCodecs =
    typeof window !== 'undefined' &&
    typeof window.VideoEncoder === 'function' &&
    typeof window.VideoFrame === 'function';

  if (hasWebCodecs && params.preset.format !== 'webm') {
    try {
      return await exportWithWebCodecsMp4(params);
    } catch (err) {
      console.warn('WebCodecs MP4 export encountered issue, falling back to MediaRecorder:', err);
    }
  }

  return exportWithMediaRecorder(params);
}
