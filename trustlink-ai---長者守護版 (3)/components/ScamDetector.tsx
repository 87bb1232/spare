import React, { useState, useRef, useEffect } from 'react';
import { analyzeAudioForScam } from '../services/geminiService';
import VoiceVisualizer from './VoiceVisualizer';
import { ShieldAlert, ShieldCheck, Shield, PhoneOff, ArrowLeft, Mic } from 'lucide-react';
import { RiskAnalysis, ThreatType } from '../types';

const ScamDetector: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Start recording automatically for ease of use? No, explicit is better for "Manual Check"
  // But let's ask for permission immediately.

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        // Don't stop tracks immediately if we want to restart easily? 
        // For security, stop them.
        audioStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAnalysis(null);
    } catch (err) {
      alert("請允許使用麥克風");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const result = await analyzeAudioForScam(base64Audio);
        setAnalysis(result);
        setLoading(false);
      };
    } catch (e) {
      setLoading(false);
      setAnalysis({
          riskLevel: "MEDIUM",
          score: 0,
          advice: "分析失敗，請再試一次",
          threatType: ThreatType.UNKNOWN
      })
    }
  };

  useEffect(() => {
      // Cleanup on unmount
      return () => {
          if (stream) {
              stream.getTracks().forEach(t => t.stop());
          }
      }
  }, [stream]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <button onClick={onBack} className="flex items-center text-[#8e8e93] mb-6 p-2">
         <ArrowLeft size={32} />
         <span className="text-xl font-bold ml-2">返回主頁</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        
        {/* Title */}
        {!analysis && !isRecording && !loading && (
           <div className="text-center space-y-4 mb-8">
              <Shield size={80} className="mx-auto text-[#0a84ff]" />
              <h2 className="text-3xl font-black">手動檢查</h2>
              <p className="text-xl text-[#8e8e93]">請按紅色按鈕開始錄音，<br/>我們會為您分析。</p>
              <div className="bg-[#2c2c2e] p-4 rounded-xl">
                  <p className="text-[#8e8e93] text-sm">注意：進入此模式會暫停背景保護</p>
              </div>
           </div>
        )}

        {/* Visualizer - Only show when active */}
        {(isRecording || loading) && (
            <div className="w-full bg-[#1c1c1e] rounded-3xl p-6 border-2 border-[#0a84ff]/30">
               <p className="text-center text-xl font-bold text-[#0a84ff] mb-4">
                  {loading ? "正在分析..." : "正在聆聽..."}
               </p>
               <VoiceVisualizer stream={stream} isRecording={isRecording} />
            </div>
        )}

        {/* Main Interaction Button */}
        {!analysis && (
            <div className="flex flex-col items-center">
                {!isRecording && !loading ? (
                    <button
                        onClick={startRecording}
                        className="w-48 h-48 rounded-full bg-[#ff453a] border-4 border-[#ff453a]/30 shadow-2xl flex items-center justify-center ios-btn active:scale-95 transition-transform"
                    >
                        <Mic size={80} className="text-white" />
                    </button>
                ) : isRecording ? (
                     <button
                        onClick={stopRecording}
                        className="w-48 h-48 rounded-full bg-[#1c1c1e] border-4 border-white flex items-center justify-center ios-btn"
                    >
                        <div className="w-16 h-16 bg-[#ff453a] rounded-lg animate-pulse" />
                    </button>
                ) : null}
                
                {!loading && (
                    <p className="mt-6 text-2xl font-bold">
                        {isRecording ? "按此停止" : "按紅色掣開始"}
                    </p>
                )}
            </div>
        )}

        {/* Analysis Result - BIG and CLEAR */}
        {analysis && (
            <div className="w-full animate-[slideUp_0.3s_ease-out]">
                <div className={`
                    rounded-[32px] p-8 text-center border-4
                    ${analysis.riskLevel === 'HIGH' ? 'bg-red-900/30 border-[#ff453a]' : 'bg-green-900/30 border-[#30d158]'}
                `}>
                    {analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'MEDIUM' ? (
                        <>
                           <ShieldAlert size={100} className="mx-auto text-[#ff453a] mb-6" />
                           <h3 className="text-4xl font-black text-[#ff453a] mb-4">有危險！</h3>
                           <p className="text-3xl font-bold text-white mb-8">{analysis.advice}</p>
                           
                           <button onClick={onBack} className="w-full py-6 bg-[#ff453a] rounded-2xl text-2xl font-bold text-white mb-4">
                               <div className="flex items-center justify-center">
                                   <PhoneOff className="mr-3" size={32} />
                                   掛斷電話
                               </div>
                           </button>
                        </>
                    ) : (
                        <>
                           <ShieldCheck size={100} className="mx-auto text-[#30d158] mb-6" />
                           <h3 className="text-4xl font-black text-[#30d158] mb-4">安全的</h3>
                           <p className="text-2xl font-bold text-white mb-8">這似乎是正常通話。</p>
                        </>
                    )}
                </div>
                
                <button 
                    onClick={() => setAnalysis(null)}
                    className="mt-6 w-full py-4 bg-[#2c2c2e] rounded-2xl text-xl font-bold text-[#8e8e93]"
                >
                    再檢查一次
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default ScamDetector;