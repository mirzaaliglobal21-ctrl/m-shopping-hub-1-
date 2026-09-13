import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Eye,
  Calendar,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  RefreshCw,
  Clock,
  UserCheck,
  ShieldCheck,
  ShoppingBag,
  PlusCircle,
  Download,
  Filter,
} from 'lucide-react';
import { AnalyticsSummary, VisitorLog, Product } from '../types';
import { subscribeToAnalytics, subscribeToRecentVisitors } from '../lib/visitorTracker';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOpenUploadProduct: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  products,
  onOpenUploadProduct,
}) => {
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    directStoreClicks: 0,
    totalLikes: 0,
    totalComments: 0,
    lastUpdated: new Date().toISOString(),
    todayDate: new Date().toISOString().split('T')[0],
    devices: { mobile: 0, desktop: 0, tablet: 0 },
  });

  const [recentVisitors, setRecentVisitors] = useState<VisitorLog[]>([]);
  const [filterAction, setFilterAction] = useState<'all' | 'clicks' | 'views'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Real-time live listener for summary
    const unsubSummary = subscribeToAnalytics((data) => {
      setSummary(data);
    });

    // Real-time live listener for visitor stream
    const unsubVisitors = subscribeToRecentVisitors((visitors) => {
      setRecentVisitors(visitors);
    }, 40);

    return () => {
      unsubSummary();
      unsubVisitors();
    };
  }, [isOpen]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filter visitor logs based on tab
  const filteredVisitors = recentVisitors.filter((v) => {
    if (filterAction === 'clicks') return v.action.includes('Click');
    if (filterAction === 'views') return v.action.includes('View');
    return true;
  });

  // Device calculations
  const totalDeviceCount =
    (summary.devices?.mobile || 0) +
    (summary.devices?.desktop || 0) +
    (summary.devices?.tablet || 0) || 1;

  const mobilePct = Math.round(((summary.devices?.mobile || 0) / totalDeviceCount) * 100);
  const desktopPct = Math.round(((summary.devices?.desktop || 0) / totalDeviceCount) * 100);
  const tabletPct = Math.max(0, 100 - mobilePct - desktopPct);

  // Export logs to CSV
  const handleExportCSV = () => {
    if (recentVisitors.length === 0) return;
    const headers = 'Time,Visitor ID,User,Device,OS,Browser,Timezone,Page,Action\n';
    const rows = recentVisitors
      .map(
        (v) =>
          `"${new Date(v.timestamp).toLocaleString()}","${v.visitorId}","${v.userName || 'Guest'}","${v.deviceType}","${v.os}","${v.browser}","${v.timeZone}","${v.page}","${v.action}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `visitors-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit',sans-serif]">
                      Visitors & Traffic Dashboard
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Feed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Real-time audience tracking and visitor analytics for M Shopping Hub
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="admin-dashboard-refresh-btn"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Refresh stats"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
                </button>
                <button
                  id="admin-dashboard-close-btn"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
              {/* Metric Highlights (4 Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Total Visits */}
                <div className="bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                      Total Visits
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {summary.totalVisits.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-sky-600 font-medium mt-1">
                    کل پیج ویوز
                  </div>
                </div>

                {/* 2. Unique Visitors */}
                <div className="bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                      Unique Visitors
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {summary.uniqueVisitors.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-1">
                    منفرد وزٹرز
                  </div>
                </div>

                {/* 3. Today's Visits */}
                <div className="bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Today's Visits
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {summary.todayVisits.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    آج کا ٹریفک
                  </div>
                </div>

                {/* 4. Direct Store Clicks */}
                <div className="bg-gradient-to-br from-amber-50 to-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Store Clicks
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {summary.directStoreClicks.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium mt-1">
                    اسٹور پر کلکس
                  </div>
                </div>
              </div>

              {/* Devices Breakdown & Quick Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Device Distribution (2 cols) */}
                <div className="md:col-span-2 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-600" />
                    <span>Device Distribution (آلات کا تناسب)</span>
                  </h3>

                  {/* Visual Multi-Segment Bar */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex mb-3">
                    <div
                      style={{ width: `${mobilePct}%` }}
                      className="bg-sky-500 transition-all duration-500"
                      title={`Mobile: ${mobilePct}%`}
                    />
                    <div
                      style={{ width: `${desktopPct}%` }}
                      className="bg-indigo-500 transition-all duration-500"
                      title={`Desktop: ${desktopPct}%`}
                    />
                    <div
                      style={{ width: `${tabletPct}%` }}
                      className="bg-emerald-400 transition-all duration-500"
                      title={`Tablet: ${tabletPct}%`}
                    />
                  </div>

                  {/* Device Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                      <div className="flex items-center justify-center gap-1 text-sky-600 mb-1">
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs font-bold">Mobile</span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900">{mobilePct}%</div>
                      <div className="text-[10px] text-slate-400">{summary.devices?.mobile || 0} visits</div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                      <div className="flex items-center justify-center gap-1 text-indigo-600 mb-1">
                        <Monitor className="w-4 h-4" />
                        <span className="text-xs font-bold">Desktop</span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900">{desktopPct}%</div>
                      <div className="text-[10px] text-slate-400">{summary.devices?.desktop || 0} visits</div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-2xs">
                      <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                        <Tablet className="w-4 h-4" />
                        <span className="text-xs font-bold">Tablet</span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900">{tabletPct}%</div>
                      <div className="text-[10px] text-slate-400">{summary.devices?.tablet || 0} visits</div>
                    </div>
                  </div>
                </div>

                {/* Quick Management Box (1 col) */}
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Quick Actions</span>
                    </div>
                    <h4 className="text-base font-extrabold font-['Outfit',sans-serif]">
                      Catalog Management
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Currently {products.length} products published and live in your direct store catalog.
                    </p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenUploadProduct();
                      }}
                      className="w-full py-2 px-3 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      disabled={recentVisitors.length === 0}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Visitors CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Recent Visitor Feed */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-sky-600" />
                      <span>Recent Visitor Activity (حالیہ سرگرمیاں)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live stream of visitors accessing M Shopping Hub
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
                    <button
                      onClick={() => setFilterAction('all')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        filterAction === 'all'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({recentVisitors.length})
                    </button>
                    <button
                      onClick={() => setFilterAction('clicks')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        filterAction === 'clicks'
                          ? 'bg-white text-amber-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Store Clicks
                    </button>
                    <button
                      onClick={() => setFilterAction('views')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        filterAction === 'views'
                          ? 'bg-white text-sky-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Page Views
                    </button>
                  </div>
                </div>

                {/* Visitor Log Table / Cards */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {filteredVisitors.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">No visitor activity recorded yet in this category.</p>
                      <p className="text-xs text-slate-400 mt-1">Visitors will automatically appear here as they browse your shop.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {filteredVisitors.map((visitor) => {
                        const isStoreClick = visitor.action.includes('Click');
                        return (
                          <div
                            key={visitor.id}
                            className="p-3 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isStoreClick
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-sky-100 text-sky-700'
                                }`}
                              >
                                {isStoreClick ? (
                                  <ShoppingBag className="w-4 h-4" />
                                ) : visitor.deviceType === 'Mobile' ? (
                                  <Smartphone className="w-4 h-4" />
                                ) : (
                                  <Monitor className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                                    {visitor.userName || 'Guest Visitor'}
                                  </span>
                                  {visitor.userEmail && (
                                    <span className="text-[11px] text-slate-500">
                                      ({visitor.userEmail})
                                    </span>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      isStoreClick
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {visitor.action}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                                  <span>Page: <strong className="text-slate-700">{visitor.page}</strong></span>
                                  <span>•</span>
                                  <span>{visitor.browser} on {visitor.os}</span>
                                  {visitor.timeZone && (
                                    <>
                                      <span>•</span>
                                      <span>Zone: {visitor.timeZone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-xs text-slate-400 flex-shrink-0">
                              <div className="flex items-center gap-1 font-semibold text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatTimeAgo(visitor.timestamp)}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(visitor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>M Shopping Hub Admin Suite • Firebase Realtime Enabled</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
              >
                Close Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
