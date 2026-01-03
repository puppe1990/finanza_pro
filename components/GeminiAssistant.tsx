
import React, { useState } from 'react';
import { getFinancialInsights } from '../geminiService';
import { Transaction } from '../types';

interface GeminiAssistantProps {
  transactions: Transaction[];
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ transactions }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    setIsOpen(true);
    const text = await getFinancialInsights(transactions);
    setInsight(text);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white border border-indigo-100 rounded-2xl md:rounded-3xl shadow-2xl mb-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span className="font-bold text-xs uppercase tracking-wider">Consultor IA</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-3 bg-slate-100 rounded-full animate-pulse w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-full animate-pulse w-full"></div>
                <div className="h-3 bg-slate-100 rounded-full animate-pulse w-2/3"></div>
              </div>
            ) : insight ? (
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line prose prose-slate">
                {insight}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-4">Clique para analisar seus gastos.</p>
            )}
          </div>
          
          {!insight && !isLoading && (
            <div className="px-5 pb-5">
              <button 
                onClick={fetchInsights}
                className="w-full py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-all"
              >
                Gerar Analise
              </button>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={() => (insight || isLoading ? setIsOpen(!isOpen) : fetchInsights())}
        className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
      >
        <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-brain'} text-xl md:text-2xl`}></i>
      </button>
    </div>
  );
};

export default GeminiAssistant;
