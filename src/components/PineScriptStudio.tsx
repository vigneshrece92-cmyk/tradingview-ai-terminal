'use client';

import React, { useState } from 'react';
import { PINESCRIPT_TEMPLATES } from '@/data/pinescriptTemplates';
import { Check, Code2, Copy, FileCode2, Sparkles, Terminal } from 'lucide-react';

export default function PineScriptStudio() {
  const [selectedScriptId, setSelectedScriptId] = useState(PINESCRIPT_TEMPLATES[0].id);
  const [codeType, setCodeType] = useState<'pinescript' | 'python'>('pinescript');
  const [copied, setCopied] = useState(false);

  const activeScript = PINESCRIPT_TEMPLATES.find((s) => s.id === selectedScriptId) || PINESCRIPT_TEMPLATES[0];
  const activeCode = codeType === 'pinescript' ? activeScript.code : (activeScript.pythonCode || activeScript.code);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#111723] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-[#131b29] border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Code2 size={16} className="text-emerald-400" />
          <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
            Algo Lab: Pine Script & Python Code Generator
          </h3>
        </div>

        {/* Format Selector & Copy Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#090d14] p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setCodeType('pinescript')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                codeType === 'pinescript' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode2 size={12} /> Pine Script v5
            </button>
            <button
              onClick={() => setCodeType('python')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                codeType === 'python' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal size={12} /> Python Bot (CCXT)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : `Copy ${codeType === 'pinescript' ? 'Pine Script' : 'Python Code'}`}</span>
          </button>
        </div>
      </div>

      {/* Script Selector Tabs */}
      <div className="flex items-center gap-1.5 p-2 bg-[#0f1420] border-b border-slate-800 overflow-x-auto">
        {PINESCRIPT_TEMPLATES.map((script) => (
          <button
            key={script.id}
            onClick={() => setSelectedScriptId(script.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedScriptId === script.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {script.name}
          </button>
        ))}
      </div>

      {/* Script Info Banner */}
      <div className="p-3 bg-[#0d111a] border-b border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100">{activeScript.name}</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
              {codeType === 'pinescript' ? activeScript.version : 'Python 3.10+'}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">
              {activeScript.category}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-2xl">{activeScript.description}</p>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Curated from: {activeScript.author}</span>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 p-3.5 overflow-y-auto bg-[#080b11] font-mono text-[11px] text-emerald-300/90 leading-relaxed select-all">
        <pre className="whitespace-pre">{activeCode}</pre>
      </div>

      {/* Bottom Help Instructions */}
      <div className="p-2.5 bg-[#131b29] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        {codeType === 'pinescript' ? (
          <span>💡 <b>TradingView:</b> Open Pine Editor on TradingView &rarr; Paste code &rarr; Click <b>Add to chart</b>.</span>
        ) : (
          <span>⚡ <b>Python Bot:</b> Run <code>pip install ccxt pandas pandas_ta</code> &rarr; Execute <code>python bot.py</code>.</span>
        )}
      </div>
    </div>
  );
}
