import React, { useState, useRef, useEffect } from 'react';
import { X, Video, Circle, Square, Check, AlertCircle } from 'lucide-react';

interface CameraRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoRecorded: (file: File) => void;
}

export const CameraRecordModal: React.FC<CameraRecordModalProps> = ({
  isOpen,
  onClose,
  onVideoRecorded,
}) => {
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsRecording(false);
      setRecordingSeconds(0);
      setRecordedChunks([]);
      setErrorMsg(null);
      return;
    }

    // Start camera stream
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Camera access was denied or not available on this device.');
      }
    };

    initCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen]);

  // Timer while recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        setRecordedChunks(chunks);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (e) {
      setErrorMsg('Recording not supported: ' + (e as Error).message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUseRecording = () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const file = new File([blob], `Camera_Capture_${Date.now()}.webm`, { type: 'video/webm' });
    onVideoRecorded(file);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Camera Quick Recorder</h3>
              <p className="text-xs text-slate-400">Record a clip to trim immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative flex aspect-video w-full items-center justify-center bg-black overflow-hidden">
          <video
            ref={videoPreviewRef}
            muted
            playsInline
            className="h-full w-full object-cover"
          />

          {/* Recording Timer Badge */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 text-xs font-mono font-bold text-white shadow backdrop-blur-sm animate-pulse">
              <Circle className="h-3 w-3 fill-white" />
              <span>
                REC {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                {(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center text-xs text-red-300">
              <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 p-5">
          {!isRecording && recordedChunks.length === 0 && !errorMsg && (
            <button
              onClick={handleStartRecording}
              className="flex min-h-[48px] items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-95"
            >
              <Circle className="h-4 w-4 fill-white" />
              <span>Start Recording</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={handleStopRecording}
              className="flex min-h-[48px] items-center gap-2 rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:bg-white active:scale-95"
            >
              <Square className="h-4 w-4 fill-slate-900" />
              <span>Stop Recording</span>
            </button>
          )}

          {!isRecording && recordedChunks.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleStartRecording}
                className="min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Re-record
              </button>
              <button
                onClick={handleUseRecording}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-blue-500 active:scale-95"
              >
                <Check className="h-4 w-4" />
                <span>Open in ClipTrim</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
