import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('M Shopping Hub caught an unhandled error:', error, errorInfo);
    if (error?.message && error.message.toLowerCase().includes('quota')) {
      try {
        localStorage.removeItem('m_shopping_hub_products_v1');
      } catch {
        // ignore
      }
    }
    this.setState({ errorInfo });
  }

  private handleResetCacheAndReload = () => {
    try {
      localStorage.removeItem('m_shopping_hub_products_v1');
      localStorage.removeItem('m_shopping_hub_comments_v1');
      localStorage.removeItem('m_shopping_hub_likes_v1');
      localStorage.removeItem('m_shopping_hub_saves_v1');
      localStorage.removeItem('m_shopping_hub_user_v1');
      localStorage.removeItem('m_shopping_hub_admin_v1');
      sessionStorage.clear();
    } catch {
      // Ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleReload = () => {
    try {
      localStorage.removeItem('m_shopping_hub_products_v1');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-100 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="M Shopping Hub Logo"
                  className="w-16 h-16 rounded-full object-cover shadow-lg shadow-sky-500/15 border-2 border-white bg-white"
                  onError={(e) => {
                    // Fallback to text icon if image fails
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full mb-3 border border-amber-200/80">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Page Recovery System
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Outfit',sans-serif] mb-2">
              Page Load Recovery
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              A temporary browser error or cached script mismatch occurred. Click below to reload cleanly.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                id="error-boundary-reload-btn"
                onClick={this.handleReload}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                id="error-boundary-reset-cache-btn"
                onClick={this.handleResetCacheAndReload}
                className="flex-1 py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Cache & Fix</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>M Shopping Hub Secure Platform</span>
            </div>

            {/* Optional technical detail expander */}
            {this.state.error && (
              <details className="mt-4 text-left text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">
                  Technical diagnostic info
                </summary>
                <p className="mt-2 font-mono text-[11px] text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
