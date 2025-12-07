import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial state (flat line)
    if (!stream || !isRecording) {
        if(requestRef.current) cancelAnimationFrame(requestRef.current);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.strokeStyle = '#3a3a3c'; // iOS Gray 5/6
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current = analyser;

    const draw = () => {
      requestRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Clear with slight transparency for trail effect? No, clean clear for crisp lines.
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      // Center the drawing
      const centerY = canvas.height / 2;

      for (let i = 0; i < bufferLength; i++) {
        // Mirrored waveform style like Voice Memos
        const v = dataArray[i] / 255.0; 
        const barHeight = v * canvas.height * 0.8; 

        // Rounded caps style drawing
        ctx.fillStyle = '#ff453a'; // iOS Red
        
        // Draw centered rounded bars
        if (barHeight > 1) {
            ctx.beginPath();
            ctx.roundRect(x, centerY - barHeight / 2, barWidth - 2, barHeight, 10);
            ctx.fill();
        } else {
            // Draw baseline dots/line
            ctx.fillRect(x, centerY - 1, barWidth - 2, 2);
        }

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      audioCtx.close();
    };
  }, [stream, isRecording]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={120} 
      className="w-full h-32 rounded-xl bg-black"
    />
  );
};

export default VoiceVisualizer;