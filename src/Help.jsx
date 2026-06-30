import React from 'react';

function Help() {
  const faqs = [
    {
      q: "🚀 What is Auragram?",
      a: "Auragram is a next-generation hybrid social platform that combines the rich layout experience of Instagram streams with the lightning-fast micro-blogging nature of Twitter."
    },
    {
      q: "⚡ Is the feed really real-time?",
      a: "Yes, fully! Powered by the Supabase Postgres changes replication engine, every post, comment, and count updates automatically on your screen without requiring page refreshes."
    },
    {
      q: "🔐 How secure is my data?",
      a: "Your data is entirely guarded by industry-grade row-level security cryptography via Supabase cloud sessions. Your credentials and privacy are our top layer protocol."
    }
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn px-1 sm:px-0">
      <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-2xl p-6 border border-[#334155] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>
        
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-2 pl-1">
          ❓ Help & Support Center
        </h3>
        <p className="text-[11px] text-slate-400 pl-1 mb-5 leading-normal">
          Frequently asked questions aur system logs guidance parameters.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800/80 space-y-1.5">
              <h4 className="text-xs font-black text-cyan-400">{faq.q}</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-light">{faq.a}</p>
            </div>
          ))}
        </div>
        
        {/* Footer info within Help */}
        <div className="mt-6 pt-4 border-t border-[#334155]/40 text-center">
          <p className="text-[10px] text-slate-500">Auragram Core Platform Engine • Version 1.2.0 (Stable)</p>
        </div>
      </div>
    </div>
  );
}

export default Help;