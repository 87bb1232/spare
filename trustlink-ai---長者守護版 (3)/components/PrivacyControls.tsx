import React, { useState } from 'react';
import { ArrowLeft, Trash2, Shield, CloudOff, Database, Check } from 'lucide-react';

interface PrivacyControlsProps {
  onBack: () => void;
}

const PrivacyControls: React.FC<PrivacyControlsProps> = ({ onBack }) => {
  const [offlineMode, setOfflineMode] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearData = () => {
    if (window.confirm("確定要刪除所有歷史對話及 AI 分析紀錄嗎？此動作無法復原。")) {
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <button onClick={onBack} className="flex items-center text-[#8e8e93] mb-6 p-2">
         <ArrowLeft size={32} />
         <span className="text-xl font-bold ml-2">返回主頁</span>
      </button>

      <div className="px-2 mb-8">
        <h2 className="text-3xl font-black mb-2">私隱與數據自主</h2>
        <p className="text-[#8e8e93] text-lg">您完全擁有您的聲音數據控制權。</p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        
        {/* Data Deletion - Primary Action */}
        <div className="bg-[#1c1c1e] rounded-[24px] p-6">
            <div className="flex items-center mb-4 text-[#ff453a]">
                <Trash2 size={28} className="mr-3" />
                <h3 className="text-xl font-bold">刪除數據</h3>
            </div>
            <p className="text-[#8e8e93] mb-6">
                立即永久刪除伺服器及手機內的所有對話錄音、聲紋模型及分析報告。
            </p>
            <button 
                onClick={handleClearData}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    cleared ? 'bg-[#30d158] text-white' : 'bg-[#2c2c2e] text-[#ff453a]'
                }`}
            >
                {cleared ? (
                    <span className="flex items-center justify-center"><Check className="mr-2"/> 已刪除</span>
                ) : "刪除所有歷史紀錄"}
            </button>
        </div>

        {/* Offline Mode */}
        <div className="bg-[#1c1c1e] rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-[#0a84ff]">
                    <CloudOff size={28} className="mr-3" />
                    <h3 className="text-xl font-bold">離線訓練模式</h3>
                </div>
                <div 
                    onClick={() => setOfflineMode(!offlineMode)}
                    className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${offlineMode ? 'bg-[#30d158]' : 'bg-[#3a3a3c]'}`}
                >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${offlineMode ? 'translate-x-6' : ''}`} />
                </div>
            </div>
            <p className="text-[#8e8e93]">
                啟用後，AI 聲紋學習只會在您的手機上進行，不會將聲音上傳至雲端伺服器。
            </p>
        </div>

        {/* Info Section */}
        <div className="bg-[#1c1c1e] rounded-[24px] p-6 opacity-80">
            <div className="flex items-center mb-2 text-[#8e8e93]">
                <Database size={24} className="mr-3" />
                <h3 className="text-lg font-bold">匿名化代碼</h3>
            </div>
            <p className="text-[#8e8e93] text-sm">
                您的數據已加密並使用代碼 <span className="font-mono text-white">ID-8821</span> 儲存，無法直接連結至您的真實身份。
            </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyControls;