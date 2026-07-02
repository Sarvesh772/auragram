import React, { useState } from 'react';
import { supabase } from './supabaseClient';

function Settings({ user, profileMetadata }) {
  const [loading, setLoading] = useState(false);
  const currentUsername = profileMetadata?.username || user?.email?.split('@')[0];

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Security crypt link aapke Gmail par bhej diya gaya hai! 📬 Apni inbox check karke password update kar lijiye.");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn px-1 sm:px-0">
      
      {/* SECTION 1: Account Profile Metadata */}
      <div className="bg-[#162236]/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-700/70 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-cyan-500"></div>
        
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4 pl-1">
          👤 Account Information
        </h3>
        
        <div className="space-y-3">
          <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center text-xs">
            <span className="text-slate-400 font-medium">Full Name</span>
            <span className="text-slate-200 font-bold">{profileMetadata?.full_name || 'Auragram Member'}</span>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center text-xs">
            <span className="text-slate-400 font-medium">Username</span>
            <span className="text-cyan-400 font-bold">@{currentUsername}</span>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:justify-between gap-1 sm:items-center text-xs">
            <span className="text-slate-400 font-medium">Registered Email</span>
            <span className="text-slate-200 font-mono text-[11px] break-all">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Security Crypt Credentials */}
      <div className="bg-[#162236]/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-700/70 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
        
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-2 pl-1">
          🔐 Security & Privacy
        </h3>
        <p className="text-[11px] text-slate-400 pl-1 mb-4 leading-normal">
          Apne account ke access cryptographic credentials ko yahan se safe aur refresh rakhein.
        </p>

        <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
          <div>
            <h4 className="font-bold text-slate-200 mb-0.5">Change Account Password</h4>
            <p className="text-[10px] text-slate-500">Ek secure recovery code token aapke email standard address par bheja jayega.</p>
          </div>
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-black px-4 py-2 rounded-xl transition duration-200 shrink-0 shadow-md disabled:opacity-50 text-[11px] cursor-pointer active:scale-95"
          >
            {loading ? 'Sending Request... ⏳' : 'Reset via Email 📬'}
          </button>
        </div>
      </div>

    </div>
  );
}

export default Settings;
