import React from 'react';

function Sidebar({ currentTab, setCurrentTab, userProfile, onLogout }) {
  const menuItems = [
    { 
      id: 'feed', 
      label: 'Home Feed', 
      // Premium Threads-Style Home SVG Icon
      svgIcon: (
        <svg className="w-6 h-6 transition-transform duration-150 group-active:scale-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    { 
      id: 'profile', 
      label: 'Your Profile', 
      // Clean Outline Profile/User Crown SVG Icon
      svgIcon: (
        <svg className="w-6 h-6 transition-transform duration-150 group-active:scale-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      // Smooth Engineering Gear Outline SVG
      svgIcon: (
        <svg className="w-6 h-6 transition-transform duration-150 group-active:scale-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.6 1z" />
        </svg>
      )
    },
    { 
      id: 'feedback', 
      label: 'Feedback', 
      // Premium Micro-discussion Chat bubble SVG Icon
      svgIcon: (
        <svg className="w-6 h-6 transition-transform duration-150 group-active:scale-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    { 
      id: 'help', 
      label: 'Help & Support', 
      // Perfect Help Circle Outline SVG
      svgIcon: (
        <svg className="w-6 h-6 transition-transform duration-150 group-active:scale-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* 🖥️ DESKTOP & TABLET SIDEBAR: Edge Fixed Plain Text View */}
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

          {/* Nav Actions (Laptop View: Plain Premium Text only) */}
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

      {/* 📱 SMARTPHONE VIEW: High-Quality Vector Icons Bar, No Text Below */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b]/95 backdrop-blur-md border-t border-[#334155] flex justify-around items-center py-4 px-2 z-50 shadow-2xl">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`group flex items-center justify-center p-2 rounded-xl transition-all duration-150 cursor-pointer ${
              currentTab === item.id 
                ? 'text-cyan-400 scale-110' 
                : 'text-slate-400/80 hover:text-slate-200'
            }`}
          >
            {item.svgIcon}
          </button>
        ))}
      </div>
    </>
  );
}

export default Sidebar;