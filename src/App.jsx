import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Prism from 'prismjs'

// PrismJS themes and languages
import 'prismjs/themes/prism-tomorrow.css' 
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-markup'

function App() {
  // Database & Feed States
  const [captionInput, setCaptionInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [langInput, setLangInput] = useState('javascript');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState([]);

  // Comments States
  const [activeCommentPostId, setActiveCommentPostId] = useState(null); // Kaunsa comment box khula hai
  const [postComments, setPostComments] = useState({}); // { [postId]: [comments_array] }
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Authentication States
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [profileMetadata, setProfileMetadata] = useState(null);

  // Highlight blocks dynamically
  useEffect(() => {
    Prism.highlightAll();
  }, [posts, loading, activeCommentPostId, postComments]);

  // Session Checker, Initial Fetch & REAL-TIME LISTENERS
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setProfileMetadata(session.user.user_metadata);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setProfileMetadata(session.user.user_metadata);
      } else {
        setUser(null);
        setProfileMetadata(null);
      }
    });

    fetchPosts();

    const savedLikes = JSON.parse(localStorage.getItem('auragram_liked_posts')) || [];
    setLikedPosts(savedLikes);

    // 🔥 REAL-TIME ENGINE FOR POSTS
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
      subscription.unsubscribe();
      supabase.removeChannel(postsChannel);
    };
  }, []);

  // Fetch All Posts
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

  // Fetch Comments for a specific post
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
      setPostComments({
        ...postComments,
        [postId]: data
      });
    }
    setLoadingComments(false);
  };

  // Submit a new comment
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!user) {
      alert("Bhai, comment karne ke liye pehle login karo!");
      return;
    }
    if (!newCommentText.trim()) return;

    const currentUsername = profileMetadata?.username || user.email.split('@')[0];
    const newCommentData = {
      post_id: postId,
      username: currentUsername,
      avatar: profileMetadata?.avatar || "💬",
      comment_text: newCommentText.trim()
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([newCommentData])
      .select();

    if (error) {
      alert("Comment save nahi ho paya: " + error.message);
    } else if (data && data.length > 0) {
      const currentPostComments = postComments[postId] || [];
      setPostComments({
        ...postComments,
        [postId]: [...currentPostComments, data[0]]
      });

      const targetPost = posts.find(p => p.id === postId);
      const updatedCommentCount = (targetPost?.comments || 0) + 1;
      
      await supabase.from('posts').update({ comments: updatedCommentCount }).eq('id', postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: updatedCommentCount } : p));
      
      setNewCommentText('');
    }
  };

  // Auth Submit Handlers
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !username || !fullName) {
      alert("Bhai, saari details bharna zaroori hai!");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase().trim(),
          full_name: fullName.trim(),
          avatar: "👑"
        }
      }
    });

    if (error) alert("Signup failed: " + error.message);
    else {
      alert("Account successfully created! Welcome to Auragram 🚀");
      setUsername('');
      setFullName('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Email aur Password dono daalo bhai!");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login error: " + error.message);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) return alert("Apna registered Gmail address likho!");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) alert("Error: " + error.message);
    else alert("Password reset link aapke Gmail par bhej diya gaya hai! 📬");
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Create Post
  const handlePostSubmit = async () => {
    if (!user) return alert("Pehle login karo bhai!");
    if (!captionInput.trim() && !codeInput.trim()) return alert("Bhai, thoda text ya code toh likho!");

    const newPostData = {
      username: profileMetadata?.username || user.email.split('@')[0],
      avatar: profileMetadata?.avatar || "💻",
      language: langInput,
      caption: captionInput,
      code: codeInput,
      likes: 0,
      comments: 0
    };

    const { data, error } = await supabase.from('posts').insert([newPostData]).select();
    if (error) alert("Database error: " + error.message);
    else {
      setCaptionInput('');
      setCodeInput('');
    }
  };

  // Likes Counter
  const handleLike = async (postId, currentLikes) => {
    const hasLiked = likedPosts.includes(postId);
    let newLikesCount = hasLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    const { error } = await supabase.from('posts').update({ likes: newLikesCount }).eq('id', postId);
    if (error) return;

    let updatedLikes = hasLiked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId];
    setLikedPosts(updatedLikes);
    localStorage.setItem('auragram_liked_posts', JSON.stringify(updatedLikes));
  };

  // Delete Post
  const handleDelete = async (postId, postUsername) => {
    const currentUsername = profileMetadata?.username || user?.email?.split('@')[0];
    if (postUsername !== currentUsername) return alert("Aap sirf apni post delete kar sakte ho! ❌");

    if (!window.confirm("Sach me ye post delete karni hai?")) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) alert("Delete error: " + error.message);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans">
      
      {/* Header */}
      <header className="sticky top-0 bg-[#1e293b] border-b border-[#334155] py-4 px-6 flex justify-between items-center z-50 shadow-md">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400 flex items-center gap-2">Auragram</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300 font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                Hi, <span className="text-cyan-400">@{profileMetadata?.username || 'user'}</span> 👋
              </span>
              <button onClick={handleLogout} className="bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-red-500 hover:text-white transition cursor-pointer">Logout</button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">🔐 Secure Cloud Session</span>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className={`max-w-4xl mx-auto py-6 px-4 ${!user ? 'grid grid-cols-1 md:grid-cols-4 gap-6' : 'space-y-6'}`}>
        
        {/* Left Column Forms */}
        {!user && (
          <div className="md:col-span-1">
            <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155] shadow-xl sticky top-24">
              <div className="flex justify-between border-b border-[#334155] pb-3 mb-4 text-xs font-semibold gap-1">
                <button onClick={() => setAuthMode('login')} className={`pb-1 cursor-pointer ${authMode === 'login' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Login</button>
                <button onClick={() => setAuthMode('signup')} className={`pb-1 cursor-pointer ${authMode === 'signup' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Sign Up</button>
                <button onClick={() => setAuthMode('reset')} className={`pb-1 cursor-pointer ${authMode === 'reset' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>Reset</button>
              </div>

              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3">
                  <input type="email" placeholder="Gmail address" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm text-slate-200 outline-none focus:border-cyan-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <input type="password" placeholder="Password" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm text-slate-200 outline-none focus:border-cyan-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 text-sm font-bold py-2.5 rounded-lg transition mt-2 shadow-md cursor-pointer">Let me in 🚀</button>
                </form>
              )}

              {authMode === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <input type="text" placeholder="Full Name" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm text-slate-200 outline-none focus:border-cyan-500" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  <input type="text" placeholder="Unique Username" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm text-slate-200 outline-none focus:border-cyan-500" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  <input type="email" placeholder="Gmail Address" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm text-slate-200 outline-none focus:border-cyan-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <input type="password" placeholder="Password" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm text-slate-200 outline-none focus:border-cyan-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-sm font-bold py-2.5 rounded-lg transition mt-2 shadow-md cursor-pointer">Register Account ✨</button>
                </form>
              )}

              {authMode === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <input type="email" placeholder="Enter your Gmail" className="w-full bg-[#0f172a] border border-[#334155] p-2.5 rounded-lg text-sm text-slate-200 outline-none focus:border-cyan-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-bold py-2.5 rounded-lg transition mt-2 shadow-md cursor-pointer">Send Recovery Link 📬</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Right Content / Full Feed Area */}
        <div className={!user ? 'md:col-span-3 space-y-6' : 'space-y-6'}>
          
          {/* Create Post Section */}
          {user ? (
            <div className="bg-[#1e293b] rounded-xl p-5 border border-[#334155] shadow-xl">
              <div className="flex gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-md shrink-0 shadow-md">
                  {profileMetadata?.avatar || '👑'}
                </div>
                <textarea placeholder="What's your error or cool code snippet, bro?" className="w-full bg-transparent resize-none outline-none text-sm pt-2 text-slate-200 placeholder-slate-500" rows="2" value={captionInput} onChange={(e) => setCaptionInput(e.target.value)} />
              </div>
              <textarea placeholder="// Paste your code block here..." className="w-full bg-[#0f172a] font-mono text-xs p-3 rounded-lg border border-[#334155] text-cyan-300 outline-none mb-3 focus:border-cyan-500 transition shadow-inner" rows="4" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
              <div className="flex justify-between items-center">
                <select className="bg-[#0f172a] text-xs text-slate-300 border border-[#334155] rounded-md px-3 py-2 outline-none cursor-pointer hover:border-slate-500 transition" value={langInput} onChange={(e) => setLangInput(e.target.value)}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="markup">HTML/CSS</option>
                </select>
                <button onClick={handlePostSubmit} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 text-xs font-bold px-6 py-2 rounded-md transition shadow-md cursor-pointer">Post Code</button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1e293b]/30 rounded-xl p-6 border border-[#334155] border-dashed text-center text-slate-400 text-sm">
              🔒 Code Post karne ke liye side box se **Login** ya **Sign Up** kijiye bhai!
            </div>
          )}

          {/* Posts Feed Area */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-slate-400 text-sm py-10 animate-pulse">Database se posts laa raha hoon... 🔄</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-10">Feed khali hai. Kuch pehli post dalo! 🚀</div>
            ) : (
              posts.map((post) => {
                const intentUsername = profileMetadata?.username || user?.email?.split('@')[0];
                const isPostLiked = likedPosts.includes(post.id);
                const isCommentSectionOpen = activeCommentPostId === post.id;
                const displayLang = post.language === 'cpp' ? 'C++' : post.language === 'markup' ? 'HTML/CSS' : post.language;

                return (
                  <div key={post.id} className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden shadow-lg transition duration-200 hover:border-slate-600">
                    
                    {/* Post Card Header */}
                    <div className="p-4 flex justify-between items-center border-b border-[#334155]/50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-sm">{post.avatar || '💻'}</div>
                        <div>
                          <h3 className="font-semibold text-sm">@{post.username}</h3>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full capitalize">{displayLang}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(post.code); alert("Code copied to clipboard! 📋"); }} className="text-xs text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 rounded-md hover:bg-cyan-500 hover:text-slate-900 transition cursor-pointer">Copy Code</button>
                        {user && (intentUsername === post.username) && (
                          <button onClick={() => handleDelete(post.id, post.username)} className="text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-2.5 py-1 rounded-md hover:bg-red-500 hover:text-white transition cursor-pointer">🗑️</button>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{post.caption}</p>
                      {post.code && (
                        <div className="rounded-lg overflow-hidden border border-slate-800 shadow-inner max-h-60">
                          <pre className={`language-${post.language} !margin-0 !rounded-none`}>
                            <code className={`language-${post.language}`}>{post.code}</code>
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Buttons */}
                    <div className="px-4 py-3 bg-slate-900/40 border-t border-[#334155]/30 flex gap-4 text-xs text-slate-400">
                      <button 
                        onClick={() => handleLike(post.id, post.likes)}
                        className={`flex items-center gap-1.5 transition cursor-pointer px-3 py-1 rounded-md font-semibold ${isPostLiked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800/50 text-slate-300 hover:text-red-400'}`}
                      >
                        ❤️ {post.likes}
                      </button>
                      <button 
                        onClick={() => toggleCommentsSection(post.id)}
                        className={`flex items-center gap-1.5 transition cursor-pointer px-3 py-1 rounded-md font-semibold ${isCommentSectionOpen ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800/50 text-slate-300 hover:text-cyan-400'}`}
                      >
                        💬 {post.comments || 0} Comments
                      </button>
                    </div>

                    {/* LIVE COMMENTS DROP-DOWN DRAWER */}
                    {isCommentSectionOpen && (
                      <div className="bg-[#151f32] border-t border-[#334155]/60 p-4 space-y-4 animate-fadeIn">
                        <h4 className="text-xs font-bold text-slate-400 tracking-wide uppercase">Discussion Feed</h4>
                        
                        {/* List of Comments */}
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {loadingComments ? (
                            <div className="text-xs text-slate-500 italic py-2">Comments load ho rahe hain... 🔄</div>
                          ) : !postComments[post.id] || postComments[post.id].length === 0 ? (
                            <div className="text-xs text-slate-500 italic py-2">Yahan koi comment nahi hai. Kuch toh bolo bhai! 🗣️</div>
                          ) : (
                            postComments[post.id].map((comm) => (
                              <div key={comm.id} className="flex gap-2 bg-[#1e293b]/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                                <span className="shrink-0">{comm.avatar}</span>
                                <div>
                                  <span className="font-bold text-cyan-400 mr-2">@{comm.username}:</span>
                                  <span className="text-slate-300">{comm.comment_text}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Input Form for New Comment */}
                        {user ? (
                          <form onSubmit={(e) => handleCommentSubmit(e, post.id)} className="flex gap-2 pt-2 border-t border-[#334155]/30">
                            <input 
                              type="text" 
                              placeholder="Write a helpful reply or feedback..." 
                              className="w-full bg-[#0f172a] border border-[#334155] px-3 py-2 rounded-lg text-xs text-slate-200 outline-none focus:border-cyan-500"
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              required
                            />
                            <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold px-4 rounded-lg text-xs transition cursor-pointer">Reply</button>
                          </form>
                        ) : (
                          <div className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 text-center">
                            🔒 Comments likhne ke liye aapka logged-in hona zaroori hai.
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )
              })
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default App