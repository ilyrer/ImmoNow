import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GeographicalModule from './modules/GeographicalModule';

const CIMGeographical: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Glasmorphism Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cim')}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl
            bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl
            border border-white/50 dark:border-slate-700/50
            shadow-lg hover:shadow-xl
            text-slate-700 dark:text-slate-300
            hover:bg-white dark:hover:bg-slate-700
            transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Zurück zu CIM Overview</span>
        </button>

        <GeographicalModule />
      </div>
    </div>
  );
};

export default CIMGeographical;
