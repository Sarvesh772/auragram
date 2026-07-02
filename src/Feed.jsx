import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Profile from './Profile';

function Feed({ user, profileMetadata }) {
  const [captionInput, setCaptionInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState([]);
  
  const [viewingProfile, setViewingProfile] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    fetchPosts();
    const savedLikes = JSON.parse(localStorage.getItem('auragram_liked_posts')) || [];
    setLikedPosts(savedLikes);

    const postsChannel = supabase
      .channel('realtime-posts-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPosts((prevPosts) => {
              const exists = prevPosts.some(p => p.id === payload.new.id);
              if (exists) return prevPosts;
              return [payload.new, ...prevPosts];
            });
          } else if (payload.eventType === 'UPDATE') {
            setPosts((prevPosts) =>
              prevPosts.map((post) => (post.id === payload.new.id ? payload.new : post))
            );
          } else if (payload.eventType === 'DELETE') {
            setPosts((prevPosts) => prevPosts.filter((post) => post.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error("Error loading posts:", error.message);
    else setPosts(data || []);
    setLoading(false);
  };

  const handlePostSubmit = async () => {
    if (!captionInput.trim()) return alert("Bhai, kuch toh likho post karne ke liye!");

    const newPostData = {
      username: profileMetadata?.username || user.email.split('@')[0],
      avatar: profileMetadata?.avatar || "✨",
      caption: captionInput,
      language: "general", // 🔥 Yeh line add ki taaki database ka NOT NULL constraint pass ho jaye!
      likes: 0,
      comments: 0
    };

    const { error } = await supabase.from('posts').insert([newPostData]);
    if (error) alert("Database error: " + error.message);
    else setCaptionInput('');
  };

  
  const handleLike = async (postId, currentLikes) => {
    const hasLiked = likedPosts.includes(postId);
    let newLikesCount = hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    const { error } = await supabase.from('posts').update({ likes: newLikesCount }).eq('id', postId);
    if (error) return;

    let updatedLikes = hasLiked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId];
    setLikedPosts(updatedLikes);
    localStorage.setItem('auragram_liked_posts', JSON.stringify(updatedLikes));
  };

  const handleDelete = async (postId, postUsername) => {
    const currentUsername = profileMetadata?.username || user?.email?.split('@')[0];
    if (postUsername !== currentUsername) return alert("Aap sirf apni post delete kar sakte ho! ❌");
    if (!window.confirm("Sach me ye post delete karni hai?")) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) alert("Delete error: " + error.message);
  };

  const toggleCommentsSection = async (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }
    setActiveCommentPostId(postId);
    setLoadingComments(true);

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setPostComments({ ...postComments, [postId]: data });
    }
    setLoadingComments(false);
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const currentUsername = profileMetadata?.username || user.email.split('@')[0];
    const newCommentData = {
      post_id: postId,
      username: currentUsername,
      avatar: profileMetadata?.avatar || "💬",
      comment_text: newCommentText.trim()
    };

    const { data, error } = await supabase.from('comments').insert([newCommentData]).select();

    if (error) {
      alert("Comment save nahi ho paya: " + error.message);
    } else if (data && data.length > 0) {
      const currentPostComments = postComments[postId] || [];
      setPostComments({ ...postComments, [postId]: [...currentPostComments, data[0]] });

      const targetPost = posts.find(p => p.id === postId);
      const updatedCommentCount = (targetPost?.comments || 0) + 1;
      
      await supabase.from('posts').update({ comments: updatedCommentCount }).eq('id', postId);
      setNewCommentText('');
    }
  };

  const filteredPosts = viewingProfile ? posts.filter(p => p.username === viewingProfile) : posts;
  const totalProfileLikes = filteredPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const profileAvatar = filteredPosts[0]?.avatar || "✨";

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-3xl mx-auto">
      {viewingProfile && (
        <Profile 
          viewingProfile={viewingProfile}
          filteredPosts={filteredPosts}
          totalProfileLikes={totalProfileLikes}
          profileAvatar={profileAvatar}
          setViewingProfile={setViewingProfile}
        />
      )}

      {/* Premium Dynamic Posting Box */}
      {!viewingProfile && (
        <div className="bg-[#162236]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-700/70 shadow-xl shadow-black/10 transition-all duration-300">
          <div className="flex gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg text-sm select-none">
              {profileMetadata?.avatar || '✨'}
            </div>
            <textarea 
              placeholder="Kuch naya share karo, bhai! What's on your mind?..." 
              className="w-full bg-transparent resize-none outline-none text-sm sm:text-[15px] pt-2 text-slate-100 placeholder-slate-500 min-h-[88px] sm:min-h-[110px] focus:placeholder-slate-400 transition" 
              value={captionInput} 
              onChange={(e) => setCaptionInput(e.target.value)} 
            />
          </div>
          <div className="flex justify-end items-center border-t border-[#334155]/30 pt-3">
            <button 
              onClick={handlePostSubmit} 
              className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition duration-200 shadow-lg hover:shadow-cyan-500/10 cursor-pointer active:scale-95"
            >
              Share Post ✨
            </button>
          </div>
        </div>
      )}

      {/* Premium Content Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-400 text-xs py-14 bg-[#1e293b]/20 rounded-2xl border border-[#334155]/30 animate-pulse">
            Syncing timeline nodes... 🔄
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-14 bg-[#1e293b]/20 rounded-2xl border border-dashed border-[#334155]/40">
            No dynamic posts here yet! 🚀
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isPostLiked = likedPosts.includes(post.id);
            const isCommentSectionOpen = activeCommentPostId === post.id;

            return (
              <div 
                key={post.id} 
                className="bg-[#162236]/90 backdrop-blur-sm rounded-2xl border border-slate-700/70 overflow-hidden shadow-lg shadow-black/10 transition-all duration-200 hover:border-slate-500/70"
              >
                {/* Post Header */}
                <div className="p-3.5 sm:p-4 flex justify-between items-center gap-3 border-b border-[#334155]/40 bg-slate-900/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      onClick={() => setViewingProfile(post.username)} 
                      className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-sm cursor-pointer hover:scale-105 active:scale-95 transition shadow-sm"
                    >
                      {post.avatar || '✨'}
                    </div>
                    <h3 
                      onClick={() => setViewingProfile(post.username)} 
                      className="font-bold text-sm text-slate-200 cursor-pointer hover:text-cyan-400 transition truncate"
                    >
                      @{post.username}
                    </h3>
                  </div>
                  {user && (profileMetadata?.username === post.username || user.email.split('@')[0] === post.username) && (
                    <button 
                      onClick={() => handleDelete(post.id, post.username)} 
                      className="shrink-0 text-[10px] sm:text-[11px] text-red-400 font-medium bg-red-500/5 px-2 sm:px-2.5 py-1 rounded-lg border border-red-500/10 hover:bg-red-500 hover:text-white transition cursor-pointer"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <div className="p-4 sm:p-5 min-h-20">
                  <p className="text-sm sm:text-[15px] text-slate-200 whitespace-pre-wrap break-words leading-relaxed font-normal">
                    {post.caption}
                  </p>
                </div>

                {/* Post Interactivity Footer */}
                <div className="px-3 sm:px-4 py-3 bg-slate-900/30 border-t border-[#334155]/20 flex flex-wrap gap-2 sm:gap-3 text-xs text-slate-300">
                  <button 
                    onClick={() => handleLike(post.id, post.likes)} 
                    className={`flex items-center gap-1.5 transition px-3 py-1.5 rounded-xl font-bold border cursor-pointer active:scale-95 ${
                      isPostLiked 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-sm shadow-red-500/5' 
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:text-red-400 hover:border-red-500/20'
                    }`}
                  >
                    ❤️ {post.likes}
                  </button>
                  <button 
                    onClick={() => toggleCommentsSection(post.id)} 
                    className={`flex items-center gap-1.5 transition px-3 py-1.5 rounded-xl font-bold border cursor-pointer active:scale-95 ${
                      isCommentSectionOpen 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/20'
                    }`}
                  >
                    💬 {post.comments || 0} Comments
                  </button>
                </div>

                {/* Premium Animated Expandable Comments Compartment */}
                {isCommentSectionOpen && (
                  <div className="bg-[#131b2e] border-t border-[#334155]/50 p-4 space-y-4 transition-all duration-300">
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {loadingComments ? (
                        <div className="text-xs text-slate-500 italic py-2 animate-pulse pl-1">Fetching discussion nodes... 🔄</div>
                      ) : !postComments[post.id] || postComments[post.id].length === 0 ? (
                        <div className="text-xs text-slate-500 italic py-3 pl-1">No replies yet. Start the conversation! 🗣️</div>
                      ) : (
                        postComments[post.id].map((comm) => (
                          <div key={comm.id} className="flex gap-2.5 bg-[#1e293b]/70 p-3 rounded-xl border border-slate-800/80 text-xs shadow-inner">
                            <span className="shrink-0 select-none">{comm.avatar}</span>
                            <div className="space-y-0.5">
                              <span className="font-bold text-cyan-400 block sm:inline sm:mr-2">@{comm.username}</span>
                              <span className="text-slate-200 leading-normal">{comm.comment_text}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Add Comment Field */}
                    <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#334155]/30">
                      <input 
                        type="text" 
                        placeholder="Write a reply..." 
                        className="w-full bg-[#0f172a] border border-[#334155] px-3 py-2.5 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500/80 transition shadow-inner" 
                        value={newCommentText} 
                        onChange={(e) => setNewCommentText(e.target.value)} 
                        required 
                      />
                      <button 
                        type="submit" 
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer active:scale-95"
                      >
                        Reply
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Feed;
