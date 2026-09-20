import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-extrabold">YS</span>
              Yojana Saathi
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering Indian citizens to discover eligible welfare schemes using conversational AI and simple voice input.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Supported Languages</h4>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="px-2.5 py-1 bg-slate-800 rounded-md">English</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded-md">हिंदी (Hindi)</span>
              <span className="px-2.5 py-1 bg-slate-800 rounded-md">Hinglish</span>
              <span className="px-2.5 py-1 bg-slate-800/50 text-slate-500 rounded-md">+ More coming soon</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Important Notice</h4>
            <div className="flex items-start gap-2 bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 text-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Yojana Saathi</strong> is an independent AI-powered educational assistant developed for an academic project. It is <em>not</em> an official government website. Always verify scheme details on official portals before applying.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Yojana Saathi. Built with AI/ML & RAG for Citizens.</p>
          <p className="flex items-center gap-1">
            Developed with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> for B.Tech AI/ML Mini Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
