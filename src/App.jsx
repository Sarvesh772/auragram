import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Feed from './Feed'
import Sidebar from './Sidebar' // Sidebar import kiya
import YourProfile from './YourProfile'
import Feedback from './Feedback'
import Settings from './Settings'
import Help from './Help'


function App() {
  const [user, setUser] = useState(null);
  const [profileMetadata, setProfileMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🔥 Navigation State for Sub-Files System
  const [currentTab, setCurrentTab] = useState('feed'); // 'feed', 'profile', 'settings', etc.

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setProfileMetadata(session.user.user_metadata);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setProfileMetadata(session.user.user_metadata);
      } else {
        setUser(null);
        setProfileMetadata(null);
        setCurrentTab('feed');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex items-center justify-center font-sans animate-pulse">
        Auragram initialization... 🔄
      </div>
    );
  }

return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans antialiased selection:bg-cyan-500/30">
      
      {/* Premium Top Navigation Layer */}
      <header className="sticky top-0 bg-[#1e293b]/80 backdrop-blur-md border-b border-[#334155] py-4 px-6 flex justify-between items-center z-50 shadow-md">
        <h1 onClick={() => setCurrentTab('feed')} className="text-2xl font-black tracking-wider text-cyan-400 select-none cursor-pointer active:scale-95 transition">
          Auragram
        </h1>
        {user && (
          <div className="text-xs font-bold text-slate-400 bg-[#0f172a] border border-[#334155] px-3 py-1.5 rounded-full tracking-wide">
            🌐 Network Connected
          </div>
        )}
      </header>

      {/* Main Structural Framework */}
      <main className="w-full">
        {!user ? (
          <div className="max-w-6xl mx-auto py-6 px-4">
            <Auth onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
          </div>
        ) : (
          // Authenticated Application Pipeline Layout
          <div className="w-full min-h-screen">
            
            {/* Sidebar Inject Box (Desktop: Fixed Left Edge, Mobile: Sticky Bottom Bar) */}
            <Sidebar 
              currentTab={currentTab} 
              setCurrentTab={setCurrentTab} 
              userProfile={profileMetadata} 
              onLogout={handleLogout} 
            />

            {/* 💎 RESPONSIVE DYNAMIC FEED SHELF (Left Margin adds padding on desktop only) */}
            <div className="w-full md:pl-64 pb-24 md:pb-8 pt-6 px-4 sm:px-6">
              <div className="max-w-3xl mx-auto">
                {currentTab === 'feed' && (
                  <Feed user={user} profileMetadata={profileMetadata} />
                )}
                
                {currentTab === 'profile' && (
                  <YourProfile user={user} profileMetadata={profileMetadata} />
                )}

                {currentTab === 'settings' && (
                  <Settings user={user} profileMetadata={profileMetadata} />
                )}

                {currentTab === 'feedback' && (
                  <Feedback user={user} profileMetadata={profileMetadata} />
                )}

                {currentTab === 'help' && (
                  <Help />
                )}
              </div>
            </div>

          </div>
        )}
      </main>
      
    </div>
  )
}

export default App
