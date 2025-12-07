import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mic, CheckCircle, Fingerprint } from 'lucide-react';
import { FamilyMember } from '../types';

interface VoiceIDSetupProps {
  member: FamilyMember;
  onBack: () => void;
  onComplete: (id: string) => void;
}

const VoiceIDSetup: React.FC<VoiceIDSetupProps> = ({ member, onBack, onComplete }) => {
  const [step, setStep] = useState<'INTRO' | 'RECORDING' | 'ANALYZING' | 'DONE'>('INTRO');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === 'RECORDING') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setStep('ANALYZING');
            return 100;
          }
          return p + 2; // 5 seconds approx
        });
      }, 100);
      return () => clearInterval(interval);
    }

    if (step === 'ANALYZING') {
      const timeout = setTimeout(() => {
        setStep('DONE');
        onComplete(member.id);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [step, member.id, onComplete]);

  return (
    <div className="flex flex-col h-full animate-fade-in text-center">
      <button onClick={onBack} className="absolute top-6 left-2 flex items-center text-[#8e8e93] p-2 z-10">
         <ArrowLeft size={32} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        
        {step === 'INTRO' && (
           <>
              <div className={`w-32 h-32 rounded-full ${member.photoColor} flex items-center justify-center mb-6 shadow-2xl`}>
                  <span className="text-5xl font-bold text-white">{member.name[0]}</span>
              </div>
              <h2 className="text-3xl font-black mb-4">建立聲紋檔案</h2>
              <p className="text-xl text-[#8e8e93] mb-8">
                  我們會學習 <span className="text-white font-bold">{member.name}</span> 的聲音特徵，以防範 AI 假冒語音。
              </p>
              <button 
                  onClick={() => setStep('RECORDING')}
                  className="w-full bg-[#0a84ff] py-5 rounded-[24px] text-2xl font-bold shadow-lg shadow-blue-900/30 ios-btn"
              >
                  開始錄音學習
              </button>
           </>
        )}

        {step === 'RECORDING' && (
            <>
               <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                   <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                       <circle cx="96" cy="96" r="90" stroke="#1c1c1e" strokeWidth="8" fill="none" />
                       <circle 
                          cx="96" cy="96" r="90" 
                          stroke="#ff453a" strokeWidth="8" fill="none" 
                          strokeDasharray={565}
                          strokeDashoffset={565 - (565 * progress) / 100}
                          className="transition-all duration-100 ease-linear"
                       />
                   </svg>
                   <Mic size={64} className="text-[#ff453a] animate-pulse" />
               </div>
               <h3 className="text-2xl font-bold mb-2">正在聆聽...</h3>
               <p className="text-[#8e8e93]">請 {member.name} 說一句話，<br/>例如：「早晨，身體健康。」</p>
            </>
        )}

        {step === 'ANALYZING' && (
            <>
               <div className="w-32 h-32 rounded-full bg-[#1c1c1e] flex items-center justify-center mb-8 animate-bounce">
                  <Fingerprint size={64} className="text-[#0a84ff]" />
               </div>
               <h3 className="text-2xl font-bold mb-2">AI 正在分析聲紋...</h3>
               <p className="text-[#8e8e93]">提取語速、音調及情感特徵</p>
            </>
        )}

        {step === 'DONE' && (
            <>
               <CheckCircle size={100} className="text-[#30d158] mb-6" />
               <h3 className="text-3xl font-black mb-4">學習完成！</h3>
               <p className="text-xl text-[#8e8e93] mb-8">
                   已建立 {member.name} 的專屬聲紋 ID。<br/>日後若有假冒聲音，我們會立即通知您。
               </p>
               <button 
                  onClick={onBack}
                  className="w-full bg-[#30d158] text-black py-5 rounded-[24px] text-2xl font-bold shadow-lg ios-btn"
              >
                  完成
              </button>
            </>
        )}
      </div>
    </div>
  );
};

export default VoiceIDSetup;