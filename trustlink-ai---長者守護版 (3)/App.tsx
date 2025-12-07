import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Users, ShieldCheck, Activity, Phone, Lock, Fingerprint, HelpCircle, Bot, AlertTriangle, Settings } from 'lucide-react';
import FamilyShield from './components/FamilyShield';
import PrivacyControls from './components/PrivacyControls';
import VoiceIDSetup from './components/VoiceIDSetup';
import { AppView, RiskAnalysis, FamilyMember, ThreatType } from './types';
import { analyzeAudioForScam, generateVoicePasswordChallenge } from './services/geminiService';

const INITIAL_FAMILY: FamilyMember[] = [
  { id: '1', name: '兒子 (大文)', relation: '兒子', phone: '91234567', photoColor: 'bg-blue-500', hasVoiceID: true, securityFact: '小時候最喜歡吃麥當勞' },
  { id: '2', name: '孫女 (小敏)', relation: '孫女', phone: '98765432', photoColor: 'bg-pink-500', hasVoiceID: false },
  { id: '3', name: '李姑娘', relation: '社工', phone: '23456789', photoColor: 'bg-green-500', hasVoiceID: false },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_FAMILY);
  const [selectedMemberForVoiceID, setSelectedMemberForVoiceID] = useState<FamilyMember | null>(null);
  
  // --- Global Smart Guard State ---
  const [isProtecting, setIsProtecting] = useState(false);
  const [backgroundRisk, setBackgroundRisk] = useState<RiskAnalysis | null>(null);
  
  // --- Background Monitoring Logic ---
  // Fix: Explicitly type as number | null for browser window.setInterval compatibility
  const intervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMember = (updatedMember: FamilyMember) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleVoiceIDComplete = (id: string) => {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, hasVoiceID: true } : m));
      setView(AppView.FAMILY);
  };

  // Toggle Protection
  const toggleProtection = async () => {
    if (isProtecting) {
        stopProtection();
    } else {
        await startProtection();
    }
  };

  const startProtection = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setIsProtecting(true);
        startMonitoringLoop(stream);
    } catch (e) {
        alert("無法啟動保護模式：請允許麥克風權限");
        setIsProtecting(false);
    }
  };

  const stopProtection = () => {
    setIsProtecting(false);
    if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    streamRef.current = null;
    mediaRecorderRef.current = null;
  };

  // The Loop: Record Short Chunk -> Analyze -> Repeat
  const startMonitoringLoop = (stream: MediaStream) => {
    const recordAndAnalyze = () => {
        if (!stream.active) return;
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            // Send to Gemini
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const result = await analyzeAudioForScam(base64);
                
                // Alert on HIGH risk
                if (result.riskLevel === 'HIGH' || result.riskLevel === 'MEDIUM') {
                    // Only interrupt for actual identified threats
                    if (result.threatType !== 'SAFE' && result.threatType !== 'UNKNOWN') {
                        setBackgroundRisk(result);
                        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
                    }
                }
            };
        };

        mediaRecorder.start();
        // Record for 6 seconds then stop
        setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        }, 6000);
    };

    // Initial run
    recordAndAnalyze();
    // Loop
    intervalRef.current = window.setInterval(recordAndAnalyze, 8000); 
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopProtection();
  }, []);

  // --- Render ---

  const renderContent = () => {
    if (backgroundRisk) {
        return (
            <DangerOverlay 
                risk={backgroundRisk} 
                onDismiss={() => setBackgroundRisk(null)} 
                members={members}
            />
        );
    }

    switch (view) {
      case AppView.PRIVACY:
        return <PrivacyControls onBack={() => setView(AppView.HOME)} />;
      case AppView.VOICE_ID:
        if (selectedMemberForVoiceID) {
            return (
                <VoiceIDSetup 
                    member={selectedMemberForVoiceID} 
                    onBack={() => setView(AppView.FAMILY)}
                    onComplete={handleVoiceIDComplete}
                />
            );
        }
        return (
            <FamilyShield 
                onBack={() => setView(AppView.HOME)} 
                members={members} 
                onDelete={handleDeleteMember} 
                onUpdateMember={handleUpdateMember}
                onSetupVoiceID={() => {}} 
            />
        );
      case AppView.FAMILY:
        return (
            <FamilyShield 
                onBack={() => setView(AppView.HOME)} 
                members={members}
                onDelete={handleDeleteMember}
                onUpdateMember={handleUpdateMember}
                onSetupVoiceID={(m) => {
                    setSelectedMemberForVoiceID(m);
                    setView(AppView.VOICE_ID);
                }}
            />
        );
      case AppView.HOME:
      default:
        return (
            <HomeView 
                setView={setView} 
                isProtecting={isProtecting} 
                toggleProtection={toggleProtection}
                members={members}
            />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0a84ff] selection:text-white">
      <main className="h-screen max-w-lg mx-auto p-6 flex flex-col relative overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

// --- Sub Components ---

const DangerOverlay: React.FC<{ 
    risk: RiskAnalysis, 
    onDismiss: () => void,
    members: FamilyMember[]
}> = ({ risk, onDismiss, members }) => {
    const [challengeQuestion, setChallengeQuestion] = useState<string | null>(null);
    const [loadingChallenge, setLoadingChallenge] = useState(false);
    const [verifyingIdentity, setVerifyingIdentity] = useState(false);

    const callFamily = (m: FamilyMember) => {
        window.location.href = `tel:${m.phone}`;
        onDismiss(); 
    };

    const handleGenerateClick = () => {
        if (members.length > 0) {
            setVerifyingIdentity(true);
        } else {
            generateChallenge("Unknown");
        }
    };

    const generateChallenge = async (relation: string, fact?: string) => {
        setVerifyingIdentity(false);
        setLoadingChallenge(true);
        const q = await generateVoicePasswordChallenge(relation, fact);
        setChallengeQuestion(q.question);
        setLoadingChallenge(false);
    };

    // Determine UI based on Threat Type
    const getThreatUI = () => {
        switch (risk.threatType) {
            case 'DEEPFAKE':
                return {
                    icon: <Bot size={80} className="text-white" />,
                    title: "發現 AI 偽造聲音",
                    colorClass: "bg-[#ff9f0a]" // Orange for tech warning
                };
            case 'SCAM_CONTENT':
                return {
                    icon: <ShieldAlert size={80} className="text-white" />,
                    title: "偵測到詐騙話術",
                    colorClass: "bg-[#ff453a]" // Red for content danger
                };
            case 'BOTH':
                return {
                    icon: <AlertTriangle size={80} className="text-white" />,
                    title: "極度危險：AI 詐騙",
                    colorClass: "bg-[#ff453a]" // Red
                };
            default:
                return {
                    icon: <ShieldAlert size={80} className="text-white" />,
                    title: "可疑通話",
                    colorClass: "bg-[#ff453a]"
                };
        }
    };

    const ui = getThreatUI();

    return (
        <div className={`absolute inset-0 z-50 ${ui.colorClass} flex flex-col items-center p-6 animate-fade-in overflow-y-auto`}>
            <div className="flex-1 flex flex-col items-center justify-center text-center w-full max-w-sm">
                <div className="bg-white/20 p-6 rounded-full mb-6 animate-pulse">
                    {ui.icon}
                </div>
                <h1 className="text-4xl font-black mb-2 tracking-tight">
                    {ui.title}
                </h1>
                <p className="text-2xl font-bold mb-8 drop-shadow-md text-white/90">{risk.advice}</p>
                
                {/* Voice Password Challenge Section */}
                {!challengeQuestion && !verifyingIdentity && (
                    <button 
                        onClick={handleGenerateClick}
                        className="w-full bg-[#0a84ff] text-white py-5 rounded-[24px] text-xl font-bold shadow-xl flex items-center justify-center active:scale-95 transition-transform mb-4 border-2 border-white/50"
                    >
                        {loadingChallenge ? (
                            "生成中..."
                        ) : (
                            <>
                                <HelpCircle size={28} className="mr-2" />
                                啟動語音密碼 (Voice Password)
                            </>
                        )}
                    </button>
                )}

                {verifyingIdentity && (
                    <div className="w-full bg-black/80 backdrop-blur-md p-6 rounded-[24px] mb-6 animate-slide-up">
                        <p className="text-white font-bold mb-4 text-lg">對方自稱是誰？</p>
                        <div className="grid grid-cols-2 gap-3">
                            {members.map(m => (
                                <button 
                                    key={m.id}
                                    onClick={() => generateChallenge(m.relation, m.securityFact)}
                                    className="bg-[#1c1c1e] p-4 rounded-xl flex flex-col items-center border border-white/20 active:bg-[#0a84ff]"
                                >
                                    <div className={`w-8 h-8 rounded-full ${m.photoColor} flex items-center justify-center text-xs mb-2`}>
                                        {m.name[0]}
                                    </div>
                                    <span className="text-sm font-bold">{m.name.split(' ')[0]}</span>
                                </button>
                            ))}
                            <button 
                                onClick={() => generateChallenge("陌生人")}
                                className="bg-[#1c1c1e] p-4 rounded-xl flex flex-col items-center border border-white/20 active:bg-gray-700"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs mb-2">?</div>
                                <span className="text-sm font-bold">其他人</span>
                            </button>
                        </div>
                    </div>
                )}

                {challengeQuestion && (
                    <div className="w-full bg-white text-black p-6 rounded-[24px] mb-6 animate-slide-up shadow-2xl">
                        <p className="text-[#8e8e93] text-sm font-bold mb-2 uppercase">請立即問對方：</p>
                        <p className="text-2xl font-black text-[#0a84ff] leading-tight">「{challengeQuestion}」</p>
                        <p className="text-sm mt-3 text-gray-500">如果對方答不出或猶豫，請立即掛斷。</p>
                        <button onClick={() => setChallengeQuestion(null)} className="text-[#0a84ff] text-sm font-bold mt-4">
                            重試 / 選擇其他人
                        </button>
                    </div>
                )}

                <div className="w-full space-y-4 mb-8">
                     <button 
                        onClick={onDismiss}
                        className="w-full bg-white text-[#ff453a] py-5 rounded-[24px] text-2xl font-bold shadow-xl flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <Phone size={28} className="mr-2" fill="currentColor" />
                        馬上掛斷
                    </button>
                    
                    {/* Trusted Contacts Section */}
                    {members.length > 0 && !verifyingIdentity && !challengeQuestion && (
                        <div className="mt-8 w-full">
                            <p className="text-white/90 text-xl font-bold mb-4">或者打給家人確認：</p>
                            <div className="flex flex-col space-y-3">
                                {members.slice(0, 2).map(m => (
                                    <button 
                                        key={m.id}
                                        onClick={() => callFamily(m)}
                                        className="w-full bg-[#1c1c1e] border-2 border-white/30 text-white py-5 rounded-[24px] text-xl font-bold flex items-center px-6 shadow-lg active:bg-white active:text-black transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-full ${m.photoColor} text-white flex items-center justify-center text-sm mr-4 shrink-0`}>
                                            {m.name[0]}
                                        </div>
                                        <span className="truncate">致電 {m.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={onDismiss}
                    className="text-white/70 text-lg underline py-4"
                >
                    誤報 (忽略)
                </button>
            </div>
        </div>
    );
};

const HomeView: React.FC<{ 
    setView: (v: AppView) => void;
    isProtecting: boolean;
    toggleProtection: () => void;
    members: FamilyMember[];
}> = ({ setView, isProtecting, toggleProtection, members }) => {
    const handleSOS = () => {
        alert("已發出家庭聯動警報！\n\n系統已通知：\n- 兒子 (大文)\n- 孫女 (小敏)\n\n正在錄音存證...");
    };

    const callMember = (m: FamilyMember) => {
        window.location.href = `tel:${m.phone}`;
    };

    return (
        <div className="flex flex-col h-full animate-fade-in pb-4">
            {/* Header */}
            <div className="mt-4 mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black mb-1">早晨，陳伯</h1>
                    <p className="text-xl text-[#8e8e93]">守聲守心與您同行。</p>
                </div>
                <div onClick={() => setView(AppView.PRIVACY)} className="p-2 bg-[#2c2c2e] rounded-full cursor-pointer">
                    <Settings size={24} className="text-[#0a84ff]" />
                </div>
            </div>

            {/* Smart Guard Toggle Card */}
            <div 
                onClick={toggleProtection}
                className={`
                w-full rounded-[32px] p-8 mb-6 transition-all duration-300 border cursor-pointer active:scale-[0.98]
                ${isProtecting ? 'bg-[#1c1c1e] border-[#30d158] shadow-[0_0_20px_rgba(48,209,88,0.2)]' : 'bg-[#1c1c1e] border-[#38383a]'}
            `}>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`
                        w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300
                        ${isProtecting ? 'bg-[#30d158] text-white' : 'bg-[#3a3a3c] text-[#8e8e93]'}
                    `}>
                        {isProtecting ? (
                            <Activity size={40} className="animate-pulse" />
                        ) : (
                            <ShieldCheck size={40} />
                        )}
                    </div>
                    
                    <div>
                        <h2 className={`text-3xl font-black mb-2 ${isProtecting ? 'text-[#30d158]' : 'text-[#8e8e93]'}`}>
                            {isProtecting ? "守聲防護中" : "已暫停保護"}
                        </h2>
                        <p className="text-[#8e8e93] text-lg font-medium">
                            {isProtecting 
                                ? "AI 正在監聽 Deepfake 及詐騙特徵。" 
                                : "點擊開啟 AI 聲紋防詐偵測。"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Dial Section */}
            {members.length > 0 && (
                <div className="mb-6">
                    <p className="text-[#8e8e93] font-bold mb-3 ml-2 uppercase text-sm tracking-wide">常用聯絡人</p>
                    <div className="flex space-x-4 overflow-x-auto pb-4 pl-2 no-scrollbar">
                        {members.map(member => (
                             <div 
                                key={member.id} 
                                onClick={() => callMember(member)}
                                className="flex flex-col items-center space-y-2 cursor-pointer active:opacity-70 group"
                             >
                                <div className={`w-16 h-16 rounded-full ${member.photoColor} flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-[#1c1c1e] group-hover:scale-105 transition-transform relative`}>
                                    {member.name[0]}
                                    {member.hasVoiceID && (
                                        <div className="absolute bottom-0 right-0 bg-[#0a84ff] rounded-full p-1 border border-black">
                                            <Fingerprint size={10} className="text-white"/>
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-white max-w-[70px] truncate text-center leading-tight">
                                    {member.name.split(' ')[0]}
                                </span>
                             </div>
                        ))}
                         <div 
                            onClick={() => setView(AppView.FAMILY)}
                            className="flex flex-col items-center space-y-2 cursor-pointer active:opacity-70 group"
                         >
                            <div className="w-16 h-16 rounded-full bg-[#2c2c2e] flex items-center justify-center text-[#0a84ff] border-2 border-[#1c1c1e] group-hover:bg-[#3a3a3c] transition-colors">
                                <Users size={24} />
                            </div>
                            <span className="text-sm font-medium text-[#8e8e93]">管理</span>
                         </div>
                    </div>
                </div>
            )}

            {/* SOS Button */}
            <button 
                onClick={handleSOS}
                className="w-full bg-[#ff453a] rounded-[32px] p-6 mb-4 flex items-center justify-between shadow-2xl shadow-red-900/30 active:scale-95 transition-transform ios-btn mt-auto"
            >
                <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                        <ShieldAlert size={40} className="text-white" />
                    </div>
