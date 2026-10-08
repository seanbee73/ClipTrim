import fixWebmDuration from 'fix-webm-duration';

/**
 * Generates an instant high-quality sample video with distinct scene transitions
 * so users can test scene detection, trimming, frame precision, and export immediately.
 */
export async function generateDemoVideo(type: 'showcase' | 'mobile_story' = 'showcase'): Promise<{ file: File; url: string }> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const isMobileStory = type === 'mobile_story';
      canvas.width = isMobileStory ? 720 : 1280;
      canvas.height = isMobileStory ? 1280 : 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context');

      // Audio context for procedural audio beep/pulse
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        osc.stop();
        audioCtx.close().catch(() => {});
        const rawBlob = new Blob(chunks, { type: 'video/webm' });
        let finalBlob = rawBlob;
        try {
          finalBlob = await fixWebmDuration(rawBlob, 12000);
        } catch {
          finalBlob = rawBlob;
        }

        const file = new File([finalBlob], isMobileStory ? 'Mobile_Story_Sample.webm' : 'Cinematic_Urban_Clip.webm', {
          type: 'video/webm',
        });
        const url = URL.createObjectURL(finalBlob);
        resolve({ file, url });
      };

      recorder.start();

      const totalDuration = 12; // 12 seconds
      const fps = 30;
      const totalFrames = totalDuration * fps;
      let frame = 0;

      const drawFrame = () => {
        const timeSec = frame / fps;
        const width = canvas.width;
        const height = canvas.height;

        // Scene 1: 0 - 4s: Cyber Midnight / Deep Blue
        // Scene 2: 4 - 8s: Golden Sun Flare / Orange Sunset
        // Scene 3: 8 - 12s: Emerald Matrix Grid / Aurora
        let bgGradient: CanvasGradient;
        let sceneName = '';

        if (timeSec < 4.0) {
          sceneName = 'SCENE 1: Midnight Cyber Sky';
          bgGradient = ctx.createLinearGradient(0, 0, width, height);
          bgGradient.addColorStop(0, '#0b132b');
          bgGradient.addColorStop(0.5, '#1c2541');
          bgGradient.addColorStop(1, '#3a506b');
          osc.frequency.setValueAtTime(220 + Math.sin(timeSec * 3) * 30, audioCtx.currentTime);
        } else if (timeSec < 8.0) {
          sceneName = 'SCENE 2: Golden Horizon Flare';
          bgGradient = ctx.createLinearGradient(0, 0, width, height);
          bgGradient.addColorStop(0, '#780000');
          bgGradient.addColorStop(0.4, '#c1121f');
          bgGradient.addColorStop(0.8, '#fdf0d5');
          bgGradient.addColorStop(1, '#669bbc');
          osc.frequency.setValueAtTime(440 + Math.sin(timeSec * 4) * 50, audioCtx.currentTime);
        } else {
          sceneName = 'SCENE 3: Emerald Aurora Grid';
          bgGradient = ctx.createLinearGradient(0, 0, width, height);
          bgGradient.addColorStop(0, '#001219');
          bgGradient.addColorStop(0.5, '#0a9396');
          bgGradient.addColorStop(1, '#94d2bd');
          osc.frequency.setValueAtTime(330 + Math.sin(timeSec * 2) * 40, audioCtx.currentTime);
        }

        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Animated grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        const offset = (timeSec * 40) % gridSize;
        for (let x = offset; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = offset; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Animated rotating central geometric element
        ctx.save();
        ctx.translate(width / 2, height / 2 - 20);
        ctx.rotate(timeSec * 1.2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const boxSize = isMobileStory ? 140 : 160;
        ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, 20);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Moving orb with glow
        const orbX = width / 2 + Math.cos(timeSec * 2.5) * (width * 0.28);
        const orbY = height / 2 + Math.sin(timeSec * 2.5) * (height * 0.18);
        ctx.save();
        ctx.beginPath();
        ctx.arc(orbX, orbY, 28, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.restore();

        // Mock watermark logo in top-right for Delogo testing!
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const logoW = 120;
        const logoH = 34;
        const logoX = width - logoW - 24;
        const logoY = 24;
        ctx.roundRect(logoX, logoY, logoW, logoH, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SAMPLE LOGO', logoX + logoW / 2, logoY + logoH / 2);
        ctx.restore();

        // Cinematic HUD text overlay & frame counter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sceneName, width / 2, height - 120);

        ctx.font = '16px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        const minStr = Math.floor(timeSec / 60).toString().padStart(2, '0');
        const secStr = Math.floor(timeSec % 60).toString().padStart(2, '0');
        const frameStr = (frame % fps).toString().padStart(2, '0');
        ctx.fillText(`TIMECODE: 00:${minStr}:${secStr}.${frameStr} | FRAME ${frame}/${totalFrames}`, width / 2, height - 80);

        // Progress bar at bottom
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(40, height - 40, width - 80, 8);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(40, height - 40, ((width - 80) * frame) / totalFrames, 8);

        frame++;
        if (frame < totalFrames) {
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };

      drawFrame();
    } catch (err) {
      reject(err);
    }
  });
}
