import React from 'react';

function Sidebar({ currentTab, setCurrentTab, userProfile, onLogout }) {
  // Desktop ke liye saaf text, mobile ke liye premium minimal emojis
  const menuItems = [
    { id: 'feed', label: 'Home Feed', mobileEmoji: '🏠' },
    { id: 'profile', label: 'Your Profile', mobileEmoji: '👑' },
    { id: 'settings', label: 'Settings', mobileEmoji: '⚙️' },
    { id: 'feedback', label: 'Feedback', mobileEmoji: '💬' },
    { id: 'help', label: 'Help & Support', mobileEmoji: '❓' }
  ];

  return (
    <>
      {/* 🖥️ DESKTOP & TABLET SIDEBAR: Edge Fixed & Emoji-Free Clean Look */}
      <div className="hidden md:flex flex-col bg-[#1e293b] border-r border-[#334155] w-64 h-screen fixed top-0 left-0 pt-20 px-4 pb-6 justify-between z-40 shadow-2xl">
        
        <div className="space-y-6">
          {/* User Info Capsule */}
          <div className="flex items-center gap-3 p-3 bg-[#0f172a]/40 rounded-2xl border border-[#334155]/50 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-lg shrink-0 shadow-md select-none">
              {userProfile?.avatar || '✨'}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-black text-slate-100 truncate">@{userProfile?.username || 'user'}</h4>
              <p className="text-[10px] text-slate-400 font-medium truncate">{userProfile?.full_name || 'Auragram Member'}</p>
            </div>
          </div>

          {/* Nav Actions (Laptop view: Plain professional text, NO EMOJIS) */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full text-left text-xs font-bold px-5 py-3.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  currentTab === item.id
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-300 hover:bg-[#0f172a] hover:text-cyan-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Action */}
        <button
          onClick={onLogout}
          className="w-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-extrabold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 cursor-pointer shadow-md"
        >
          Logout Account 🔒
        </button>
      </div>

      {/* 📱 MOBILE VIEW COMPACT BOTTOM NAVIGATION BAR: Emojis only, no text below them */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b]/95 backdrop-blur-md border-t border-[#334155] flex justify-around items-center py-3.5 px-2 z-50 shadow-2xl">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex items-center justify-center p-2.5 rounded-xl text-xl transition-all duration-150 cursor-pointer ${
              currentTab === item.id 
                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 scale-110 px-4' 
                : 'opacity-60 grayscale-[30%] text-slate-400'
            }`}
          >
            <span className="select-none active:scale-95 transition-transform block">{item.mobileEmoji}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default Sidebar;