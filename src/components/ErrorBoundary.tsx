'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary captured client error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[350px] p-6 bg-[#0d111a] rounded-xl border border-rose-500/30 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-3 border border-rose-500/30">
            <AlertTriangle className="text-rose-400" size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-100 mb-1">
            {this.props.fallbackTitle || 'Component Recovered from Chart Error'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4 font-mono">
            {this.state.error?.message || 'A transient chart rendering collision occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Reload Component</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
