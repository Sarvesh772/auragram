import React, { useState } from 'react';
import { supabase } from './supabaseClient';

function Auth({ onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Email aur Password dono daalo bhai!");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) alert("Login error: " + error.message);
    else if (data?.user) onAuthSuccess(data.user);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !username || !fullName) {
      alert("Bhai, saari details bharna zaroori hai!");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase().trim(),
          full_name: fullName.trim(),
          avatar: "✨"
        }
      }
    });
    setLoading(false);

    if (error) alert("Signup failed: " + error.message);
    else {
      alert("Account successfully created! Welcome to Auragram 🚀");
      setAuthMode('login');
      setUsername('');
      setFullName('');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) return alert("Apna registered Gmail address likho!");
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setLoading(false);
    
    if (error) alert("Error: " + error.message);
    else alert("Password reset link aapke Gmail par bhej diya gaya hai! 📬");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(100vh-8rem)] py-4">
      
      {/* LEFT COLUMN: Premium Login/Sign Up Box */}
      <div className="md:col-span-5 w-full max-w-md mx-auto order-2 md:order-1">
        <div className="bg-[#162236]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-7 border border-slate-700/70 shadow-2xl transition-all duration-300">
          
          {/* Toggle Tab Navigation */}
          <div className="flex justify-between border-b border-[#334155]/60 pb-3 mb-6 text-sm font-semibold">
            <button onClick={() => setAuthMode('login')} className={`pb-2 px-3 cursor-pointer transition-all duration-200 ${authMode === 'login' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>Login</button>
            <button onClick={() => setAuthMode('signup')} className={`pb-2 px-3 cursor-pointer transition-all duration-200 ${authMode === 'signup' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>Sign Up</button>
            <button onClick={() => setAuthMode('reset')} className={`pb-2 px-3 cursor-pointer transition-all duration-200 ${authMode === 'reset' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}>Reset</button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 font-medium animate-pulse mb-4 bg-cyan-500/10 py-2 rounded-lg border border-cyan-500/20">
              <span>Securing tunnel connection... ⏳</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 pl-1">Email Address</label>
                <input type="email" placeholder="name@gmail.com" className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 pl-1">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-900 text-sm font-extrabold py-3.5 rounded-xl transition duration-200 mt-4 shadow-lg hover:shadow-cyan-500/10 cursor-pointer active:scale-[0.99]">Let me in 🚀</button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 pl-1">Full Name</label>
                <input type="text" placeholder="John Doe" className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 pl-1">Username</label>
                <input type="text" placeholder="johndoe" className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 pl-1">Email Address</label>
                <input type="email" placeholder="name@gmail.com" className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 pl-1">Password</label>
                <input type="password" placeholder="Minimum 6 characters" className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-900 text-sm font-extrabold py-3.5 rounded-xl transition duration-200 mt-4 shadow-lg cursor-pointer active:scale-[0.99]">Register Account ✨</button>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 pl-1">Registered Gmail</label>
                <input type="email" placeholder="name@gmail.com" className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 text-sm font-extrabold py-3.5 rounded-xl transition duration-200 mt-4 shadow-lg cursor-pointer active:scale-[0.99]">Send Recovery Link 📬</button>
            </form>
          )}
          
        </div>
      </div>

      {/* RIGHT COLUMN: Premium Trust-Building Copywriting */}
      <div className="md:col-span-7 space-y-4 sm:space-y-6 lg:pl-10 order-1 md:order-2 text-center md:text-left">
        <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs text-cyan-400 font-medium tracking-wide">
          ⚡ Experience Next-Gen Socializing
        </div>
        
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05]">
          Connect, Share, and <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
            Build Your Aura.
          </span>
        </h2>
        
        <p className="text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed font-light">
          Auragram brings together the seamless expression of modern social micro-blogging and rich multimedia streams. Join a global decentralized micro-community designed explicitly for creators.
        </p>

        {/* Professional Trust Feature Bullets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-xl text-left">
          <div className="bg-[#1e293b]/40 border border-[#334155]/40 rounded-xl p-3 flex gap-3 items-start">
            <span className="text-base">🚀</span>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Real-time Stream Engine</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Every comment, post, and pulse updates instantly with zero latency.</p>
            </div>
          </div>
          
          <div className="bg-[#1e293b]/40 border border-[#334155]/40 rounded-xl p-3 flex gap-3 items-start">
            <span className="text-base">🛡️</span>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Cloud Encryption Crypt</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Powered by Supabase secure backend protocols keeping database sessions safe.</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Auth;
