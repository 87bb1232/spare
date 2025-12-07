import React from 'react';
import { Phone, ArrowLeft, Plus, Trash2, Fingerprint, Key } from 'lucide-react';
import { FamilyMember } from '../types';

interface FamilyShieldProps {
  onBack: () => void;
  members: FamilyMember[];
  onDelete: (id: string) => void;
  onUpdateMember: (member: FamilyMember) => void;
  onSetupVoiceID: (member: FamilyMember) => void;
}

const FamilyShield: React.FC<FamilyShieldProps> = ({ onBack, members, onDelete, onUpdateMember, onSetupVoiceID }) => {

  const handleCall = (name: string, phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); 
    if (window.confirm(`確定要刪除 ${name} 嗎？`)) {
      onDelete(id);
    }
  };

  const handleVoiceIDClick = (e: React.MouseEvent, member: FamilyMember) => {
    e.stopPropagation();
    onSetupVoiceID(member);
  };

  const handleKeyClick = (e: React.MouseEvent, member: FamilyMember) => {
      e.stopPropagation();
      const currentFact = member.securityFact || '';
      const fact = window.prompt(
          `設定 ${member.name} 的語音密碼暗號。\n\n請輸入一個只有您們知道的事實 (例如：第一隻狗的名字、去年的旅行地點)：`, 
          currentFact
      );
      if (fact !== null) {
          onUpdateMember({ ...member, securityFact: fact });
      }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <button onClick={onBack} className="flex items-center text-[#8e8e93] mb-6 p-2 active:opacity-60">
         <ArrowLeft size={32} />
         <span className="text-xl font-bold ml-2">返回主頁</span>
      </button>

      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-3xl font-black">我的家人</h2>
        <button className="w-12 h-12 bg-[#2c2c2e] rounded-full flex items-center justify-center text-[#0a84ff] active:bg-[#3a3a3c]">
            <Plus size={32} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-20">
        {members.length === 0 && (
            <div className="text-center py-10 opacity-50">
                <p className="text-[#8e8e93] text-xl">名單是空的</p>
                <p className="text-[#8e8e93] text-sm mt-2">請按右上角 + 號新增</p>
            </div>
        )}

        {members.map(member => (
            <div 
                key={member.id} 
                className="bg-[#1c1c1e] rounded-[24px] p-5 flex flex-col space-y-4 shadow-md active:scale-[0.98] transition-transform"
                onClick={() => handleCall(member.name, member.phone)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${member.photoColor} shadow-inner`}>
                            {member.name[0]}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                            <p className="text-lg text-[#8e8e93]">{member.relation}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                         <button 
                            onClick={(e) => handleKeyClick(e, member)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center bg-[#2c2c2e] ${member.securityFact ? 'text-[#ff9f0a]' : 'text-[#8e8e93]'}`}
                        >
                            <Key size={24} />
                        </button>

                        <button 
                            onClick={(e) => handleDeleteClick(e, member.id, member.name)}
                            className="w-12 h-12 rounded-full flex items-center justify-center text-[#ff453a] bg-[#2c2c2e]"
                        >
                            <Trash2 size={24} />
                        </button>

                        <div className="bg-[#30d158] w-12 h-12 rounded-full flex items-center justify-center text-black shadow-lg">
                            <Phone size={24} fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* Voice ID Status Row */}
                <div className="pt-2 border-t border-[#38383a] flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <Fingerprint size={16} className={member.hasVoiceID ? "text-[#0a84ff]" : "text-[#8e8e93]"} />
                        <span className={`text-sm font-medium ${member.hasVoiceID ? "text-[#0a84ff]" : "text-[#8e8e93]"}`}>
                            {member.hasVoiceID ? "聲紋已保護" : "未設定聲紋"}
                        </span>
                     </div>
                     {!member.hasVoiceID && (
                         <button 
                            onClick={(e) => handleVoiceIDClick(e, member)}
                            className="text-sm bg-[#0a84ff]/20 text-[#0a84ff] px-3 py-1 rounded-full font-bold"
                         >
                            立即學習
                         </button>
                     )}
                     {member.hasVoiceID && member.securityFact && (
                         <span className="text-sm text-[#ff9f0a] font-medium flex items-center">
                             <Key size={12} className="mr-1" />
                             已設暗號
                         </span>
                     )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default FamilyShield;