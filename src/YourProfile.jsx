import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

function YourProfile({ user, profileMetadata }) {
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realProfile, setRealProfile] = useState(null);

  // Profile Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Dropdown & Deletion States
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  
  const menuRef = useRef(null);
  const currentUsername = profileMetadata?.username || user?.email?.split('@')[0] || 'user';

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuPostId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  // 🛡️ CRASH-SAFE DATABASE HANDLER (Blank screen anti-crash protocol)
  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      const defaultUsername = profileMetadata?.username || user?.email?.split('@')[0] || 'user';
      const fallbackObj = {
        id: user.id,
        username: defaultUsername,
        full_name: profileMetadata?.full_name || 'Auragram Member',
        avatar: profileMetadata?.avatar || '',
        bio: profileMetadata?.bio || 'Auragram lives on cloud matrix!'
      };

      if (error || !data || data.length === 0) {
        // Safe Fallback: Agar entry database table me nahi hai, toh blank hone ke bajaye live create karo!
        await supabase.from('profiles').insert([fallbackObj]);
        setRealProfile(fallbackObj);
        initFormStates(fallbackObj);
        fetchMyPosts(defaultUsername);
      } else {
        setRealProfile(data[0]);
        initFormStates(data[0]);
        fetchMyPosts(data[0].username);
      }
    } catch (err) {
      console.error("Anti-crash logging system caught:", err);
    } finally {
      setLoading(false);
    }
  };

  const initFormStates = (profile) => {
    setEditFullName(profile?.full_name || '');
    setEditUsername(profile?.username || '');
    setEditBio(profile?.bio || '');
    setEditAvatar(profile?.avatar || '');
  };

  const fetchMyPosts = async (username) => {
    if (!username) return;
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false });

      if (data) setMyPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Bhai, image size 1.5MB se kam honi chahiye!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!editUsername.trim() || !editFullName.trim()) return alert("Fields khali nahi ho sakte!");

    setIsSavingProfile(true);
    const targetUsername = editUsername.trim().toLowerCase();

    const updatedData = {
      full_name: editFullName.trim(),
      username: targetUsername,
      bio: editBio.trim(),
      avatar: editAvatar,
      updated_at: new Date()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updatedData)
      .eq('id', user.id);

    if (profileError) {
      alert("Error saving profiles metadata: " + profileError.message);
      setIsSavingProfile(false);
      return;
    }

    // Cascade update all older posts real-time
    if (realProfile?.username) {
      await supabase
        .from('posts')
        .update({ username: targetUsername, avatar: editAvatar })
        .eq('username', realProfile.username);
    }

    setIsSavingProfile(false);
    setIsEditModalOpen(false);
    alert("Profile sync completed successfully! 🚀");
    window.location.reload();
  };

  const handleDeleteExecute = async () => {
    if (!deletingPostId) return;
    setIsDeletingLoading(true);
    await supabase.from('posts').delete().eq('id', deletingPostId);
    setIsDeletingLoading(false);
    setDeletingPostId(null);
    if (realProfile) fetchMyPosts(realProfile.username);
  };

  const handleCopyLink = (postId) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    alert("Post link copy ho gaya! 📋");
    setActiveMenuPostId(null);
  };

  const handleShare = (post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: `Post by @${post.username}`, text: post.caption, url: postUrl }).catch(console.error);
    } else {
      alert(`Link: ${postUrl}`);
    }
    setActiveMenuPostId(null);
  };

  const totalLikes = myPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const displayUsername = realProfile?.username || currentUsername;

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-2xl mx-auto px-1 sm:px-0">
      
      {/* 👑 PROFILE HEADER MATRIX */}
      <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-2xl p-6 border border-[#334155] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>
        
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-4 right-4 text-slate-400 hover:text-cyan-400 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition text-xs font-bold flex items-center gap-1 cursor-pointer select-none"
        >
          ✏️ Edit Profile
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
          {/* Avatar frame loader */}
          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-cyan-500/40 flex items-center justify-center shadow-xl shrink-0 overflow-hidden select-none">
            {realProfile?.avatar ? (
              <img src={realProfile.avatar} alt="DP" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs text-slate-500 font-bold uppercase">No DP</div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1 w-full min-w-0">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-slate-100 tracking-wide">@{displayUsername}</h2>
              <p className="text-xs text-slate-400 font-semibold">{realProfile?.full_name || 'Auragram Member'}</p>
            </div>

            <p className="text-xs text-slate-300 font-normal leading-relaxed max-w-md whitespace-pre-wrap">
              {realProfile?.bio || 'Building the next-gen real-time decentralized timeline hub layout nodes.'}
            </p>
            
            <div className="flex gap-3 pt-2 text-[11px] justify-center sm:justify-start">
              <span className="bg-[#0f172a] px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold">
                Content Posts: <span className="text-cyan-400 pl-0.5">{myPosts.length}</span>
              </span>
              <span className="bg-[#0f172a] px-3.5 py-1.5 rounded-xl border border-slate-800 font-bold">
                Aura Generated: <span className="text-purple-400 pl-0.5">{totalLikes}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 pl-1 border-b border-[#334155]/30 pb-2">Your Publications Timeline</h3>

      {/* Publications Content Loop */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 text-xs py-14 bg-[#1e293b]/20 rounded-2xl border border-[#334155]/30 animate-pulse">
            Filtering database records... 🔄
          </div>
        ) : myPosts.length === 0 ? (
          <div className="bg-[#1e293b]/40 border border-[#334155]/40 border-dashed rounded-2xl p-12 text-center text-slate-400 text-xs">
            Timeline khali hai bhai! Home feed par jaakar pehli post kijiye.
          </div>
        ) : (
          myPosts.map((post) => (
            <div key={post.id} className="bg-[#1e293b]/90 backdrop-blur-sm rounded-2xl border border-[#334155]/80 overflow-hidden shadow-xl">
              <div className="p-4 flex justify-between items-center border-b border-[#334155]/40 bg-slate-900/10 relative">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center overflow-hidden shrink-0">
                    {realProfile?.avatar ? (
                      <img src={realProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[9px] text-slate-600 font-bold">U</div>
                    )}
                  </div>
                  <span className="font-bold text-xs text-slate-200">@{post.username}</span>
                </div>

                <div className="relative">
                  <button onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)} className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg cursor-pointer">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                  </button>
                  {activeMenuPostId === post.id && (
                    <div ref={menuRef} className="absolute right-0 mt-1 w-40 bg-[#0f172a] border border-[#334155] rounded-xl shadow-2xl py-1 z-30">
                      <button onClick={() => handleShare(post)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 font-semibold">Share</button>
                      <button onClick={() => handleCopyLink(post.id)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 font-semibold">Copy Link</button>
                      <div className="border-t border-[#334155]/40 my-1"></div>
                      <button onClick={() => { setDeletingPostId(post.id); setActiveMenuPostId(null); }} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 font-black">Delete Post</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-sm text-slate-200 whitespace-pre-wrap font-normal">{post.caption}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL OVERLAY LAYOUT SHEET */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-md font-black text-slate-100 border-b border-[#334155] pb-3">Update Profile Matrix</h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              
              <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155] flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {editAvatar ? (
                    <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[10px] text-slate-600 font-bold uppercase">No DP</div>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upload Real Profile Image</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 file:cursor-pointer w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Full Name</label>
                  <input type="text" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Username</label>
                  <input type="text" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Biography (Bio)</label>
                <textarea className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[70px] resize-none" value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#334155]/40">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition shadow-lg" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPostId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 text-lg">🗑️</div>
            <div className="space-y-1"><h4 className="text-sm font-bold text-slate-100">Delete Post</h4><p className="text-[11px] text-slate-400 leading-normal">Sach me ye post delete karni hai?</p></div>
            <div className="flex justify-center gap-3 pt-2">
              <button type="button" onClick={() => setDeletingPostId(null)} className="bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl" disabled={isDeletingLoading}>Cancel</button>
              <button type="button" onClick={handleDeleteExecute} className="bg-red-500 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg" disabled={isDeletingLoading}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default YourProfile;