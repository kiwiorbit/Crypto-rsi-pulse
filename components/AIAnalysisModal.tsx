
import React, { useState, useEffect } from 'react';
import type { Coin, AIAnalysis } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { SparklesIcon, XIcon } from './icons';

interface AIAnalysisModalProps {
  coin: Coin | null;
  onClose: () => void;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({ coin, onClose }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coin) {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      getAIAnalysis(coin.name, coin.symbol)
        .then(setAnalysis)
        .catch(() => setError("Failed to fetch AI analysis. Please try again later."))
        .finally(() => setLoading(false));
    }
  }, [coin]);

  if (!coin) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl m-4 bg-gray-900/50 backdrop-blur-2xl border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20 text-gray-200 transform transition-all duration-300 ease-out scale-95 animate-in fade-in-0 zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <XIcon className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="flex items-center mb-6">
            <img src={coin.image} alt={coin.name} className="w-12 h-12 mr-4" />
            <div>
              <h2 className="text-3xl font-bold text-white">{coin.name} Analysis</h2>
              <p className="text-lg text-blue-400">{coin.symbol.toUpperCase()}</p>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center h-48">
                <SparklesIcon className="w-12 h-12 text-blue-500 animate-pulse" />
                <p className="mt-4 text-lg text-gray-400">Thinking...</p>
            </div>
          )}
          {error && <p className="text-red-400">{error}</p>}
          {analysis && (
            <div className="space-y-6">
              <div>
                <h3 className="flex items-center text-xl font-semibold text-white mb-2">
                    <SparklesIcon className="w-5 h-5 mr-2 text-blue-400" />
                    Summary
                </h3>
                <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Key Points</h3>
                <ul className="space-y-2 list-disc list-inside text-gray-300">
                  {analysis.keyPoints.map((point, index) => (
                    <li key={index} className="pl-2">{point}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisModal;
