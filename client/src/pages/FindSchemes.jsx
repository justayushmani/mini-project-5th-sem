import React from 'react';
import { Mic, Edit3 } from 'lucide-react';

const FindSchemes = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Find Government Schemes</h1>
        <p className="mt-2 text-slate-600">
          Provide your profile information via voice input or form submission to discover eligible schemes.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center max-w-xl mx-auto">
        <p className="text-sm font-semibold text-amber-900">
          🚧 Phase 1 Setup Complete: Voice & Profile recommendation forms will be activated in upcoming phases.
        </p>
      </div>
    </div>
  );
};

export default FindSchemes;
