import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, Radio, AlertCircle } from 'lucide-react';

interface LiveVoiceAssistantProps {
  activeCropName: string;
  gpsLocationLabel: string;
}

function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({
  activeCropName,
  gpsLocationLabel,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<{ speaker: 'Farmer' | 'AgriSmart Live'; text: string }[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopAllPlayback = () => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore already stopped
      }
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  };

  const schedulePcm24kPlayback = (base64Pcm: string) => {
    const outCtx = outputAudioCtxRef.current;
    if (!outCtx) return;

    const binary = atob(base64Pcm);
    const sampleCount = Math.floor(binary.length / 2);
    if (sampleCount === 0) return;

    const float32 = new Float32Array(sampleCount);
    const view = new DataView(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) {
      view.setUint8(i, binary.charCodeAt(i));
    }
    for (let i = 0; i < sampleCount; i++) {
      float32[i] = view.getInt16(i * 2, true) / 32768;
    }

    const audioBuffer = outCtx.createBuffer(1, sampleCount, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = outCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outCtx.destination);

    const now = outCtx.currentTime;
    if (nextStartTimeRef.current < now) {
      nextStartTimeRef.current = now;
    }
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
    activeSourcesRef.current.push(source);
  };

  const stopLiveSession = () => {
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    stopAllPlayback();
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsVideoEnabled(false);
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const startLiveSession = async () => {
    setLiveError(null);
    setIsConnecting(true);

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = micStream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            setIsConnected(true);
            setIsConnecting(false);

            // Send initial farm context text
            ws.send(
              JSON.stringify({
                text: `Hello AgriSmart Live! I am speaking from ${gpsLocationLabel} and currently tending to ${activeCropName}. Please greet me briefly.`,
              })
            );

            // Start streaming 16kHz PCM audio chunks
            const source = inputCtx.createMediaStreamSource(micStream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            source.connect(processor);
            processor.connect(inputCtx.destination);

            processor.onaudioprocess = (e) => {
              if (ws.readyState === WebSocket.OPEN) {
                const pcmBase64 = floatTo16BitPCMBase64(e.inputBuffer.getChannelData(0));
                ws.send(JSON.stringify({ audio: pcmBase64 }));
              }
            };
          } else if (msg.type === 'audio' && msg.audio) {
            schedulePcm24kPlayback(msg.audio);
          } else if (msg.type === 'interrupted') {
            stopAllPlayback();
          } else if (msg.type === 'input_transcript' && msg.text) {
            setTranscripts((prev) => [...prev.slice(-14), { speaker: 'Farmer', text: msg.text }]);
          } else if (msg.type === 'output_transcript' && msg.text) {
            setTranscripts((prev) => [...prev.slice(-14), { speaker: 'AgriSmart Live', text: msg.text }]);
          } else if (msg.type === 'error') {
            setLiveError(msg.error || 'Gemini Live voice error.');
            stopLiveSession();
          }
        } catch {
          // ignore parse error
        }
      };

      ws.onerror = () => {
        setLiveError('WebSocket connection to Gemini 3.8 Live voice server failed.');
        stopLiveSession();
      };

      ws.onclose = () => {
        stopLiveSession();
      };
    } catch (err: any) {
      setLiveError(
        err?.message || 'Microphone permission is required for real-time voice conversations.'
      );
      stopLiveSession();
    }
  };

  const toggleLiveCameraStream = async () => {
    if (!isConnected || !wsRef.current) return;

    if (isVideoEnabled) {
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      setIsVideoEnabled(false);
      return;
    }

    try {
      const vStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      videoStreamRef.current = vStream;
      setIsVideoEnabled(true);

      setTimeout(() => {
        if (videoElRef.current) {
          videoElRef.current.srcObject = vStream;
        }
      }, 100);

      // Stream JPEG frames at 1 FPS per Live API rule
      frameIntervalRef.current = window.setInterval(() => {
        const video = videoElRef.current;
        const ws = wsRef.current;
        if (!video || !ws || ws.readyState !== WebSocket.OPEN) return;

        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const jpegBase64 = canvas
            .toDataURL('image/jpeg', 0.7)
            .replace(/^data:image\/jpeg;base64,/, '');
          ws.send(JSON.stringify({ video: jpegBase64 }));
        }
      }, 1000);
    } catch (err: any) {
      setLiveError(`Camera stream unavailable: ${err?.message || 'check permissions'}`);
    }
  };

  return (
    <div className="bg-[#F3EFE6] border border-[#D6CEBE] rounded-md p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D6CEBE] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans-ui uppercase tracking-widest text-[#14532D] font-semibold">
            <Radio className={`w-4 h-4 ${isConnected ? 'animate-pulse text-[#14532D]' : ''}`} />
            <span>Real-Time Field Voice Link · Gemini 3.8 Live API</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917] mt-1">
            Hands-Free Voice & Camera Field Consultation
          </h3>
          <p className="text-base font-serif-prose text-[#57534E] mt-1">
            Speak naturally with AgriSmart AI in real time while walking your fields or inspecting crops.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isConnected && (
            <button
              type="button"
              onClick={toggleLiveCameraStream}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] border border-[#C8BFA8] rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              {isVideoEnabled ? (
                <>
                  <VideoOff className="w-4 h-4 text-[#78350F]" />
                  <span>Stop Camera Feed</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 text-[#14532D]" />
                  <span>Share Live Camera (1 FPS)</span>
                </>
              )}
            </button>
          )}

          {!isConnected ? (
            <button
              type="button"
              disabled={isConnecting}
              onClick={startLiveSession}
              className="inline-flex items-center gap-2.5 px-6 py-3 text-base font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <Mic className="w-5 h-5" />
              <span>{isConnecting ? 'Connecting Voice Session...' : 'Start Live Voice Conversation'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopLiveSession}
              className="inline-flex items-center gap-2.5 px-6 py-3 text-base font-sans-ui font-semibold text-[#FBF9F5] bg-[#991B1B] hover:bg-[#7F1D1D] rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <MicOff className="w-5 h-5" />
              <span>End Voice Session</span>
            </button>
          )}
        </div>
      </div>

      {liveError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xs flex items-start gap-2.5 text-sm font-sans-ui text-[#991B1B]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{liveError}</span>
        </div>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-5 bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#14532D] text-[#FBF9F5] flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-sans-ui font-semibold text-[#14532D]">
                  Live Audio Stream Active (16kHz In / 24kHz Out)
                </p>
                <p className="text-xs font-sans-ui text-[#57534E]">
                  Speak anytime — you can interrupt or ask follow-up questions naturally.
                </p>
              </div>
            </div>

            {isVideoEnabled && (
              <div className="aspect-4/3 w-full rounded-xs overflow-hidden border border-[#C8BFA8] bg-black">
                <video
                  ref={videoElRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="md:col-span-7 bg-[#FBF9F5] border border-[#D6CEBE] rounded-xs p-5 space-y-3 max-h-60 overflow-y-auto">
            <span className="text-xs font-sans-ui uppercase tracking-wider text-[#57534E] font-semibold">
              Live Spoken Transcription Log
            </span>
            {transcripts.length === 0 ? (
              <p className="text-base font-serif-prose italic text-[#57534E]">
                Listening... Ask about expected rain, planting times, soil pH, or leaf symptoms.
              </p>
            ) : (
              <div className="space-y-2">
                {transcripts.map((t, idx) => (
                  <p key={idx} className="text-base font-serif-prose text-[#1C1917]">
                    <strong className="font-sans-ui text-xs uppercase tracking-wider text-[#14532D] mr-2">
                      {t.speaker}:
                    </strong>
                    {t.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
