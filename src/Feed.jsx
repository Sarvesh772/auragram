import React, { useState, useEffect, useRef } from 'react';
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

  // 3-Dot Actions States
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const menuRef = useRef(null);

  // Report Modal States
  const [reportingPost, setReportingPost] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  // Delete confirmation modal states (No browser alerts!)
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const [reportSuccess, setReportSuccess] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Close 3-Dot menu when clicking anywhere outside
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
      language: "general",
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

  const handleDeleteExecute = async () => {
    if (!deletingPostId) return;
    
    setIsDeletingLoading(true);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', deletingPostId);
      
    setIsDeletingLoading(false);
    setDeletingPostId(null);
    
    if (error) {
      alert("Delete karne me dikkat aayi: " + error.message);
    }
  };

  const handleCopyLink = (postId) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl);
    alert("Post link clipboard par copy ho gaya hai! 📋");
    setActiveMenuPostId(null);
  };

  const handleShare = (post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Auragram Post by @${post.username}`,
        text: post.caption,
        url: postUrl,
      }).catch(console.error);
    } else {
      alert(`Share this link: ${postUrl}`);
    }
    setActiveMenuPostId(null);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason) return alert("Please select a reason for reporting!");

    setSubmittingReport(true);
    const { error } = await supabase
      .from('reports')
      .insert([
        {
          post_id: reportingPost.id,
          reported_by: profileMetadata?.username || user?.email?.split('@')[0],
          reason: reportReason,
          details: reportDetails.trim() || null
        }
      ]);

    setSubmittingReport(false);

    if (error) {
      alert("Report submit nahi ho payi: " + error.message);
    } else {
      setReportSuccess(true);
    }
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

  const intentUsername = profileMetadata?.username || user?.email?.split('@')[0];

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto px-1 sm:px-0">
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
        <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#334155] shadow-2xl transition-all duration-300">
          <div className="flex gap-3 sm:gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg text-sm select-none">
              {profileMetadata?.avatar || '✨'}
            </div>
            <textarea 
              placeholder="Kuch naya share karo, bhai! What's on your mind?..." 
              className="w-full bg-transparent resize-none outline-none text-sm pt-2 text-slate-100 placeholder-slate-500 min-h-[90px] focus:placeholder-slate-400 transition" 
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
            const isMyPost = intentUsername === post.username;

            return (
              <div 
                key={post.id} 
                className="bg-[#1e293b]/90 backdrop-blur-sm rounded-2xl border border-[#334155]/80 overflow-hidden shadow-xl transition-all duration-200 hover:border-slate-500/60"
              >
                {/* Post Header */}
                <div className="p-4 flex justify-between items-center border-b border-[#334155]/40 bg-slate-900/10 relative">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => setViewingProfile(post.username)} 
                      className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-sm cursor-pointer hover:scale-105 active:scale-95 transition shadow-sm"
                    >
                      {post.avatar || '✨'}
                    </div>
                    <h3 
                      onClick={() => setViewingProfile(post.username)} 
                      className="font-bold text-sm text-slate-200 cursor-pointer hover:text-cyan-400 transition"
                    >
                      @{post.username}
                    </h3>
                  </div>

                  {/* 3-DOT ACTION MENU */}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800/60 transition cursor-pointer active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {/* Expandable Menu Dropdown (Clean Text Only) */}
                    {activeMenuPostId === post.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 mt-1 w-44 bg-[#0f172a] border border-[#334155] rounded-xl shadow-2xl py-1.5 z-30 animate-fadeIn"
                      >
                        {isMyPost ? (
                          <>
                            <button onClick={() => handleShare(post)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-semibold">Share</button>
                            <button onClick={() => handleCopyLink(post.id)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-semibold">Copy Link</button>
                            <div className="border-t border-[#334155]/40 my-1"></div>
                            {/* 🔥 Yeh rahi vahi updated clean state line jo maine integration me fix kar di! */}
                            <button onClick={() => { setDeletingPostId(post.id); setActiveMenuPostId(null); }} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 font-black">Delete Post</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleShare(post)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-semibold">Share</button>
                            <button onClick={() => handleCopyLink(post.id)} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 font-semibold">Copy Link</button>
                            <div className="border-t border-[#334155]/40 my-1"></div>
                            <button 
                              onClick={() => { setReportingPost(post); setActiveMenuPostId(null); }} 
                              className="w-full text-left px-4 py-2 text-xs text-amber-500 hover:bg-amber-500/10 flex items-center gap-2 font-bold"
                            >
                              Report Post
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4 sm:p-5">
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed tracking-wide font-normal">
                    {post.caption}
                  </p>
                </div>

                {/* Post Interactivity Footer */}
                <div className="px-4 py-3 bg-slate-900/30 border-t border-[#334155]/20 flex gap-3 text-xs text-slate-300">
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

                {/* Expandable Comments */}
                {isCommentSectionOpen && (
                  <div className="bg-[#131b2e] border-t border-[#334155]/50 p-4 space-y-4">
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
                    
                    <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2 pt-2 border-t border-[#334155]/30">
                      <input type="text" placeholder="Write a reply..." className="w-full bg-[#0f172a] border border-[#334155] px-3 py-2.5 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500/80 transition" value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} required />
                      <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black px-4 rounded-xl text-xs transition cursor-pointer active:scale-95">Reply</button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* REPORT MODAL */}
      {reportingPost && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            {!reportSuccess ? (
              <>
                <h3 className="text-md font-black text-slate-100 flex items-center gap-2 border-b border-[#334155] pb-3 mb-4">
                  Report Content Publication
                </h3>
                
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Why are you reporting this post?</label>
                    <select 
                      className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      required
                      disabled={submittingReport}
                    >
                      <option value="">-- Choose a standard reason --</option>
                      <option value="spam">Spam or misleading posts</option>
                      <option value="harassment">Hate speech or harassment</option>
                      <option value="abusive">Abusive or offensive language</option>
                      <option value="copyright">Intellectual property violation</option>
                      <option value="other">Other reasons</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Additional Information (Optional)</label>
                    <textarea 
                      placeholder="Provide any additional context or details here..."
                      className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[80px] resize-none"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      disabled={submittingReport}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-[#334155]/40">
                    <button 
                      type="button" 
                      onClick={() => { setReportingPost(null); setReportReason(''); setReportDetails(''); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                      disabled={submittingReport}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50"
                      disabled={submittingReport}
                    >
                      {submittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-xl font-bold">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100">Report Logged Successfully</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">
                    Thank you! The post has been securely flagged and logged into the database. Our core audit pipeline will investigate this shortly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReportingPost(null);
                    setReportSuccess(false);
                    setReportReason('');
                    setReportDetails('');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-6 py-2 rounded-xl transition cursor-pointer mt-2"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREMIUM CUSTOM DELETE MODAL (No Browser Alerts!) */}
      {deletingPostId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 text-lg">
              🗑️
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100">Delete Post</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">
                Sach me ye post delete karni hai? Ek baar delete hone ke baad ise wapas nahi laya ja sakta.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setDeletingPostId(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                disabled={isDeletingLoading}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteExecute}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50"
                disabled={isDeletingLoading}
              >
                {isDeletingLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;