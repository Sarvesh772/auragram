import React from 'react';

function Profile({ viewingProfile, filteredPosts, totalProfileLikes, profileAvatar, setViewingProfile }) {
  return (
    <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
      
      <button 
        onClick={() => setViewingProfile(null)} 
        className="absolute top-4 right-4 text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full hover:text-cyan-400 transition cursor-pointer"
      >
        ⬅️ Back to Feed
      </button>
      
      <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
        <div className="w-20 h-20 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-3xl shadow-lg shrink-0">
          {profileAvatar}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-bold text-slate-100">@{viewingProfile}</h2>
          <p className="text-xs text-slate-400 italic">Auragram Developer Profile</p>
          
          {/* Stats Counter Row */}
          <div className="flex gap-4 pt-2 text-xs">
            <span className="bg-[#0f172a] px-3 py-1 rounded-md border border-slate-800">
              📝 <strong className="text-cyan-400">{filteredPosts.length}</strong> Posts
            </span>
            <span className="bg-[#0f172a] px-3 py-1 rounded-md border border-slate-800">
              ❤️ <strong className="text-red-400">{totalProfileLikes}</strong> Total Likes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;