'use client';

import React, { useState } from 'react';
import { TechnicalAnalysis } from '@/types/trading';
import { Bot, Check, Copy, Key, Send, Sparkles, Terminal } from 'lucide-react';

interface AICopilotProps {
  symbol: string;
  timeframe: string;
  technicalAnalysis: TechnicalAnalysis | null;
}

export default function AICopilot({
  symbol,
  timeframe,
  technicalAnalysis,
}: AICopilotProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('Quant Engine (Built-in)');
  const [copied, setCopied] = useState(false);

  const runAnalysis = async (customPrompt?: string) => {
    if (!technicalAnalysis) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          technicalAnalysis,
          userPrompt: customPrompt || prompt,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
        if (data.model) setModelUsed(data.model);
      } else {
        setAnalysisResult(`❌ Analysis Error: ${data.error || 'Failed to complete analysis'}`);
      }
    } catch (err: any) {
      setAnalysisResult(`❌ Error connecting to AI backend: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#111723] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#131b29] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-purple-400" />
          <h3 className="font-semibold text-xs text-white uppercase tracking-wider">AI Chart Copilot</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            Model: <b className="text-purple-400">{modelUsed}</b>
          </span>
          <button
            onClick={() => setShowKeyModal(!showKeyModal)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            <Key size={11} className={apiKey ? 'text-emerald-400' : 'text-slate-400'} />
            <span>{apiKey ? 'API Key Set' : 'Custom Key'}</span>
          </button>
        </div>
      </div>

      {/* API Key Modal / Dropdown */}
      {showKeyModal && (
        <div className="p-3 bg-[#0d111a] border-b border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold">Google Gemini API Key (Optional)</span>
            <button
              onClick={() => setShowKeyModal(false)}
              className="text-slate-500 hover:text-slate-300 text-[11px]"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Leave blank to use the built-in free quantitative engine, or paste a free Gemini 2.0 Flash API key from Google AI Studio.
          </p>
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#080b11] border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
          />
        </div>
      )}

      {/* Quick Action Prompt Chips */}
      <div className="p-2.5 bg-[#0f1420] border-b border-slate-800 flex flex-wrap gap-1.5">
        <button
          onClick={() => runAnalysis('Perform an in-depth market structure and confluence audit on this chart.')}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-purple-900/40 text-slate-300 hover:text-purple-200 text-[11px] font-medium border border-slate-700 hover:border-purple-500/50 transition-all"
        >
          <Sparkles size={11} className="text-purple-400" /> Audit Chart Setup
        </button>

        <button
          onClick={() => runAnalysis('Calculate key Support, Resistance, Stop-Loss, and Target levels with Risk/Reward.')}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-blue-900/40 text-slate-300 hover:text-blue-200 text-[11px] font-medium border border-slate-700 hover:border-blue-500/50 transition-all"
        >
          🎯 Levels & SL/TP
        </button>

        <button
          onClick={() => runAnalysis('Check for volatility compression (Bollinger squeeze), momentum exhaustion, and breakout direction.')}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-emerald-900/40 text-slate-300 hover:text-emerald-200 text-[11px] font-medium border border-slate-700 hover:border-emerald-500/50 transition-all"
        >
          ⚡ Squeeze Check
        </button>
      </div>

      {/* Analysis Output Screen */}
      <div className="flex-1 p-3 overflow-y-auto bg-[#0d111a] text-xs font-sans text-slate-300 leading-relaxed space-y-2">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="font-mono text-xs">Analyzing live chart indicators for {symbol}...</p>
          </div>
        ) : analysisResult ? (
          <div className="relative group">
            <button
              onClick={copyToClipboard}
              className="absolute top-0 right-0 p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Copy analysis"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
            <div className="prose prose-invert prose-xs max-w-none whitespace-pre-line text-slate-300">
              {analysisResult}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 gap-2">
            <Terminal size={24} className="text-slate-600" />
            <p>Click a quick action above or enter a question below to analyze {symbol} {timeframe}.</p>
          </div>
        )}
      </div>

      {/* Bottom Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (prompt.trim()) {
            runAnalysis(prompt);
            setPrompt('');
          }
        }}
        className="p-2.5 bg-[#131b29] border-t border-slate-800 flex gap-2"
      >
        <input
          type="text"
          placeholder={`Ask AI about ${symbol} chart or setup...`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isAnalyzing}
          className="flex-1 px-3 py-1.5 bg-[#0b0e14] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isAnalyzing || !prompt.trim()}
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
