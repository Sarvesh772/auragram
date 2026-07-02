import React, { useState } from 'react';
import { supabase } from './supabaseClient';

function Feedback({ user, profileMetadata }) {
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setSubmitting(true);
    const currentUsername = profileMetadata?.username || user?.email?.split('@')[0];

    // Hum feedback ko store karne ke liye messages ya ek dynamic structure insert karenge
    const { error } = await supabase
      .from('posts')
      .insert([
        {
          username: currentUsername,
          avatar: "💬",
          caption: `[SYSTEM FEEDBACK]: ${feedbackText.trim()}`,
          language: "feedback", // 🔥 Safe step database constraints bypass karne ke liye
          likes: 0,
          comments: 0
        }
      ]);

    setSubmitting(false);
    if (error) {
      alert("Feedback send karne me dikkat aayi: " + error.message);
    } else {
      alert("Thank you! Aapka feedback successfully server par bhej diya gaya hai. ❤️");
      setFeedbackText('');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn px-1 sm:px-0">
      <div className="bg-[#162236]/90 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-700/70 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        
        <div className="space-y-2 mb-6">
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">Share Your Feedback</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Help us make Auragram better! Agar aapko koi bug mila hai ya aap koi naya feature chahte hain, toh niche likh kar direct platform dev team ko send kijiye.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2 pl-1">Your Message</label>
            <textarea
              placeholder="Describe your experience or suggestions here..."
              className="w-full bg-[#0f172a] border border-[#334155] p-3 rounded-xl text-sm text-slate-200 outline-none focus:border-purple-500 transition min-h-[120px] resize-none"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-stretch sm:justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !feedbackText.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-black px-6 py-2.5 rounded-xl transition duration-200 shadow-lg disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {submitting ? 'Sending Logs... ⏳' : 'Submit Feedback 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default Feedback;
