import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Edit3, Sparkles, CheckCircle2, XCircle, RefreshCw, ArrowRight, ShieldAlert } from 'lucide-react';
import { checkBackendHealth } from '../services/api';

const Home = () => {
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    connected: false,
    message: ''
  });

  const verifyHealth = async () => {
    setHealthStatus({ loading: true, connected: false, message: '' });
    const res = await checkBackendHealth();
    if (res && res.success) {
      setHealthStatus({
        loading: false,
        connected: true,
        message: res.message || 'Express backend is online'
      });
    } else {
      setHealthStatus({
        loading: false,
        connected: false,
        message: res.message || 'Unable to connect to Express backend'
      });
    }
  };

  useEffect(() => {
    verifyHealth();
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-amber-50/60 via-slate-50 to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 text-amber-900 border border-amber-200/80 text-xs font-semibold mb-6 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Multilingual AI Government Scheme Recommendation</span>
            </div>

            {/* Main Titles */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Yojana Saathi
            </h1>
            <p className="mt-4 text-xl sm:text-2xl font-medium text-slate-700">
              Your AI-powered Government Scheme Assistant
            </p>
            <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
              Discover welfare schemes, loans, scholarships, and subsidies tailored to your demographic profile through simple natural voice or text in your native language.
            </p>

            {/* Primary CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/find-schemes"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <span>Find Schemes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/chat"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Talk to Yojana Saathi</span>
              </Link>
            </div>

            {/* Health Check Status Card */}
            <div className="mt-12 max-w-md mx-auto p-4 rounded-xl glass-panel shadow-sm text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Backend System Status
                </span>
                <button
                  onClick={verifyHealth}
                  disabled={healthStatus.loading}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${healthStatus.loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {healthStatus.loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0"></div>
                ) : healthStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {healthStatus.loading
                      ? 'Checking connection to Express API...'
                      : healthStatus.connected
                      ? 'Express Backend API Reachable'
                      : 'Express Backend API Unreachable'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {healthStatus.message}
                  </p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    healthStatus.connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {healthStatus.connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How Would You Like to Search?
          </h2>
          <p className="mt-2 text-slate-600">
            Choose your preferred method to provide demographic details for personalized recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Voice Input */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              🎙️ Tell Us About Yourself
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Simply speak in Hindi, English, or Hinglish. Our AI automatically extracts your age, state, occupation, and income details.
            </p>
            <Link
              to="/find-schemes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              Try Voice Search <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Manual Input */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Edit3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              📝 Enter Details Manually
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Fill out a simple form specifying your state, age criteria, category, and student/farmer status for exact matching.
            </p>
            <Link
              to="/find-schemes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Fill Eligibility Form <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
