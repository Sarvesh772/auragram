import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function YourProfile({ user, profileMetadata }) {
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUsername = profileMetadata?.username || user?.email?.split('@')[0];

  useEffect(() => {
    fetchMyPosts();

    // Realtime update custom filter for self posts
    const profileChannel = supabase
      .channel('realtime-my-profile')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `username=eq.${currentUsername}` },
        () => {
          fetchMyPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [currentUsername]);

  const fetchMyPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('username', currentUsername)
      .order('created_at', { ascending: false });

    if (!error && data) setMyPosts(data);
    setLoading(false);
  };

  const totalLikes = myPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dynamic Instagram Vibe Profile Card */}
      <div className="bg-[#162236]/90 rounded-2xl p-4 sm:p-6 border border-slate-700/70 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>
        <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
          <div className="w-20 h-20 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-3xl shadow-lg shrink-0 select-none">
            {profileMetadata?.avatar || '👑'}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-slate-100">@{currentUsername}</h2>
            <p className="text-xs text-slate-400 font-medium">{profileMetadata?.full_name || 'Auragram Member'}</p>
            
            <div className="flex flex-wrap gap-2 sm:gap-4 pt-3 text-xs justify-center sm:justify-start">
              <span className="bg-[#0f172a] px-3 py-1.5 rounded-xl border border-slate-800 font-semibold">
                📝 <span className="text-cyan-400">{myPosts.length}</span> Content Posts
              </span>
              <span className="bg-[#0f172a] px-3 py-1.5 rounded-xl border border-slate-800 font-semibold">
                ❤️ <span className="text-red-400">{totalLikes}</span> Aura Generated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid List Title */}
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 pl-1">Your Publications Timeline</h3>

      {/* Grid / List Layout for posts */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 text-xs py-10 animate-pulse">Filtering your database posts... 🔄</div>
        ) : myPosts.length === 0 ? (
          <div className="bg-[#1e293b]/40 border border-[#334155]/40 border-dashed rounded-2xl p-10 text-center text-slate-400 text-xs">
            📸 Aapki timeline khali hai. Home feed par jaakar pehli post kijiye bhai!
          </div>
        ) : (
          myPosts.map((post) => (
            <div key={post.id} className="bg-[#162236]/90 rounded-xl p-4 sm:p-5 border border-slate-700/70 shadow-md">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
              <div className="flex flex-wrap justify-between items-center gap-2 border-t border-[#334155]/30 mt-4 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 bg-[#0f172a] px-2.5 py-1 rounded-lg">❤️ {post.likes} Likes</span>
                <span className="flex items-center gap-1 bg-[#0f172a] px-2.5 py-1 rounded-lg">💬 {post.comments || 0} Replies</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default YourProfile;
