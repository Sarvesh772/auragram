import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

function YourProfile({ user, profileMetadata }) {
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(profileMetadata?.full_name || '');
  const [editUsername, setEditUsername] = useState(profileMetadata?.username || '');
  const [editBio, setEditBio] = useState(profileMetadata?.bio || 'Auragram lives on cloud matrix!');
  const [editAvatar, setEditAvatar] = useState(profileMetadata?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Dropdown & Deletion States
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  
  const menuRef = useRef(null);
  const currentUsername = profileMetadata?.username || user?.email?.split('@')[0];

  useEffect(() => {
    if (profileMetadata) {
      setEditFullName(profileMetadata.full_name || '');
      setEditUsername(profileMetadata.username || '');
      setEditBio(profileMetadata.bio || 'Auragram lives on cloud matrix!');
      setEditAvatar(profileMetadata.avatar || '');
    }
  }, [profileMetadata]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuPostId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchMyPosts();
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

  // 📸 REAL IMAGE UPLOAD BUFFER CONVERTER
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Bhai, image size 2MB se kam honi chahiye!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result); // Base64 raw graphic dynamic string
    };
    reader.readAsDataURL(file);
  };

  // 🔥 SECURE AUTH ACCOUNT METADATA STORAGE SYSTEM (Zero SQL Error Guarantee)
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!editUsername.trim() || !editFullName.trim()) return alert("Fields khali nahi ho sakte!");

    setIsSavingProfile(true);

    // Dynamic metadata update pipeline that scales automatically per user
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: editFullName.trim(),
        username: editUsername.trim().toLowerCase(),
        bio: editBio.trim(),
        avatar: editAvatar
      }
    });

    setIsSavingProfile(false);

    if (error) {
      alert("Profile update error: " + error.message);
    } else {
      setIsEditModalOpen(false);
      alert("Profile picture aur data permanently cloud par sync ho gaya hai! 🎉");
      window.location.reload(); 
    }
  };

  const handleDeleteExecute = async () => {
    if (!deletingPostId) return;
    setIsDeletingLoading(true);
    const { error } = await supabase.from('posts').delete().eq('id', deletingPostId);
    setIsDeletingLoading(false);
    setDeletingPostId(null);
    fetchMyPosts();
    if (error) alert("Error: " + error.message);
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

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-2xl mx-auto px-1 sm:px-0">
      
      {/* 👑 PROFILE CARD CONTAINER */}
      <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-2xl p-6 border border-[#334155] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>
        
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-4 right-4 text-slate-400 hover:text-cyan-400 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
        >
          ✏️ Edit Profile
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
          {/* Real Uploaded DP View node */}
          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-cyan-500/40 flex items-center justify-center shadow-xl shrink-0 overflow-hidden select-none">
            {profileMetadata?.avatar ? (
              <img src={profileMetadata.avatar} alt="DP" className="w-full h-full object-cover" />
            ) : (
              <div className="text-xl font-bold text-slate-500">U</div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1 w-full min-w-0">
            <div className="space-y-0.5">
              <h2 className="text-xl font-black text-slate-100 tracking-wide">@{currentUsername}</h2>
              <p className="text-xs text-slate-400 font-semibold">{profileMetadata?.full_name || 'Auragram Member'}</p>
            </div>

            <p className="text-xs text-slate-300 font-normal leading-relaxed max-w-md whitespace-pre-wrap">
              {profileMetadata?.bio || 'Building the next-gen real-time decentralized timeline hub layout nodes. Auragram lives on cloud matrix!'}
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

      {/* Publications Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 text-xs py-14 bg-[#1e293b]/20 rounded-2xl border border-[#334155]/30 animate-pulse">
            Filtering database publications... 🔄
          </div>
        ) : myPosts.length === 0 ? (
          <div className="bg-[#1e293b]/40 border border-[#334155]/40 border-dashed rounded-2xl p-12 text-center text-slate-400 text-xs">
            Aapki timeline khali hai. Home feed par jaakar pehli post kijiye bhai!
          </div>
        ) : (
          myPosts.map((post) => (
            <div key={post.id} className="bg-[#1e293b]/90 backdrop-blur-sm rounded-2xl border border-[#334155]/80 overflow-hidden shadow-xl">
              <div className="p-4 flex justify-between items-center border-b border-[#334155]/40 bg-slate-900/10 relative">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
                    {profileMetadata?.avatar ? (
                      <img src={profileMetadata.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] text-slate-600 font-bold">U</div>
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

              <div className="px-4 py-2.5 bg-slate-900/30 border-t border-[#334155]/20 flex gap-4 text-[11px] text-slate-400 font-medium">
                <span>Likes: {post.likes}</span>
                <span>Replies: {post.comments || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 📝 REAL IMAGE UPLOADER PROTOCOL MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-md font-black text-slate-100 border-b border-[#334155] pb-3">
              Update Profile Matrix
            </h3>
            
            <form onSubmit={handleProfileSave} className="space-y-4">
              
              {/* 📸 REAL CHOOSE IMAGE COMPONENT */}
              <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155] flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                  {editAvatar ? (
                    <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">No Img</div>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upload Profile Picture</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 file:cursor-pointer w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Username</label>
                  <input 
                    type="text"
                    className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Personal Biography (Bio)</label>
                <textarea 
                  className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500 min-h-[70px] resize-none"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#334155]/40">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPostId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 text-lg">🗑️</div>
            <div className="space-y-1"><h4 className="text-sm font-bold text-slate-100">Delete Post</h4><p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">Sach me ye post delete karni hai?</p></div>
            <div className="flex justify-center gap-3 pt-2">
              <button type="button" onClick={() => setDeletingPostId(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition" disabled={isDeletingLoading}>Cancel</button>
              <button type="button" onClick={handleDeleteExecute} className="bg-red-500 hover:bg-red-600 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-lg" disabled={isDeletingLoading}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default YourProfile;