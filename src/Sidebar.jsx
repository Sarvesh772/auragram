import React from 'react';

function Sidebar({ currentTab, setCurrentTab, userProfile, onLogout }) {
  const menuItems = [
    { id: 'feed', label: '🏠 Home Feed' },
    { id: 'profile', label: '👑 Your Profile' },
    { id: 'settings', label: '⚙️ Settings' },
    { id: 'feedback', label: '💬 Feedback' },
    { id: 'help', label: '❓ Help & Support' }
  ];

  return (
    <div className="bg-[#1e293b] rounded-2xl p-4 border border-[#334155] shadow-xl space-y-6 sticky top-24">
      {/* Mini Profile Section inside Sidebar */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#334155]/50">
        <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-lg shadow-inner">
          {userProfile?.avatar || '✨'}
        </div>
        <div className="truncate">
          <h4 className="text-xs font-bold text-slate-200">@{userProfile?.username || 'user'}</h4>
          <p className="text-[10px] text-slate-400 truncate">{userProfile?.full_name || 'Auragram Member'}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`w-full text-left text-xs font-semibold px-4 py-3 rounded-xl transition duration-200 cursor-pointer active:scale-[0.98] ${
              currentTab === item.id
                ? 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/10 font-bold'
                : 'text-slate-300 hover:bg-[#0f172a] hover:text-cyan-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout button at bottom of sidebar */}
      <div className="pt-4 border-t border-[#334155]/50">
        <button
          onClick={onLogout}
          className="w-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold py-2.5 rounded-xl hover:bg-red-500 hover:text-white transition cursor-pointer active:scale-[0.98]"
        >
          Logout Account 🔒
        </button>
      </div>
    </div>
  );
}

export default Sidebar;