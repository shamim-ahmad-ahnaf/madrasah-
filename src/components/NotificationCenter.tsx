import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  DollarSign, 
  Clock, 
  Megaphone, 
  Award, 
  BookOpen, 
  Home, 
  HeartHandshake, 
  Boxes, 
  Radio, 
  Smartphone,
  Volume2, 
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../types';
import { realtimeSync, playNotificationChime } from '../services/realtimeSync';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
  currentToast: AppNotification | null;
  onDismissToast: () => void;
}

export const formatBengaliTimeAgo = (dateStr: string): string => {
  try {
    const now = Date.now();
    const diff = Math.max(0, now - new Date(dateStr).getTime());
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const banglaNumbers = (n: number) => {
      const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return n.toString().replace(/\d/g, d => bn[parseInt(d, 10)]);
    };

    if (seconds < 10) return 'এইমাত্র';
    if (seconds < 60) return `${banglaNumbers(seconds)} সেকেন্ড আগে`;
    if (minutes < 60) return `${banglaNumbers(minutes)} মিনিট আগে`;
    if (hours < 24) return `${banglaNumbers(hours)} ঘণ্টা আগে`;
    return `${banglaNumbers(days)} দিন আগে`;
  } catch (e) {
    return 'কিছুক্ষণ আগে';
  }
};

export const getModuleIcon = (mod: AppNotification['module']) => {
  switch (mod) {
    case 'student': return <Users size={14} className="text-emerald-700" />;
    case 'teacher': return <GraduationCap size={14} className="text-teal-700" />;
    case 'attendance': return <CalendarCheck size={14} className="text-blue-700" />;
    case 'finance': return <DollarSign size={14} className="text-amber-700" />;
    case 'routine': return <Clock size={14} className="text-purple-700" />;
    case 'notice': return <Megaphone size={14} className="text-rose-700" />;
    case 'exam': return <Award size={14} className="text-indigo-700" />;
    case 'library': return <BookOpen size={14} className="text-cyan-700" />;
    case 'hostel': return <Home size={14} className="text-orange-700" />;
    case 'donation': return <HeartHandshake size={14} className="text-pink-700" />;
    case 'inventory': return <Boxes size={14} className="text-lime-700" />;
    default: return <Bell size={14} className="text-slate-700" />;
  }
};

export const getModuleBadgeColor = (mod: AppNotification['module']) => {
  switch (mod) {
    case 'student': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'teacher': return 'bg-teal-50 text-teal-800 border-teal-200';
    case 'attendance': return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'finance': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'routine': return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'notice': return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'exam': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'library': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'hostel': return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'donation': return 'bg-pink-50 text-pink-800 border-pink-200';
    case 'inventory': return 'bg-lime-50 text-lime-800 border-lime-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const getModuleNameBengali = (mod: AppNotification['module']): string => {
  switch (mod) {
    case 'student': return 'শিক্ষার্থী';
    case 'teacher': return 'শিক্ষক';
    case 'attendance': return 'হাজিরা';
    case 'finance': return 'ফি ও আয়-ব্যয়';
    case 'routine': return 'রুটিন';
    case 'notice': return 'নোটিশ';
    case 'exam': return 'পরীক্ষা';
    case 'library': return 'লাইব্রেরি';
    case 'hostel': return 'হোস্টেল';
    case 'donation': return 'দান-অনুদান';
    case 'inventory': return 'স্টোর';
    default: return 'সিস্টেম';
  }
};

export default function NotificationCenter({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
  currentToast,
  onDismissToast
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Guarantee strict uniqueness of notifications by ID
  const uniqueNotifications = React.useMemo(() => {
    const map = new Map<string, AppNotification>();
    notifications.forEach((n) => {
      if (n && n.id && !map.has(n.id)) {
        map.set(n.id, n);
      }
    });
    return Array.from(map.values());
  }, [notifications]);

  const unreadCount = uniqueNotifications.filter(n => !n.isRead).length;

  const filteredNotifications = uniqueNotifications.filter(n => {
    if (selectedFilter === 'all') return true;
    return n.module === selectedFilter;
  });

  const handleTriggerTest = async () => {
    await realtimeSync.syncChange('madrasah_test_alert', { time: Date.now() }, {
      title: 'লাইভ নোটিফিকেশন টেস্ট সফল! 🔔',
      message: 'সমস্ত ডিভাইসে রিয়েল-টাইম সিঙ্ক ও নোটিফিকেশন সক্রিয় রয়েছে।',
      module: 'general',
      type: 'info'
    });
    if (soundEnabled) {
      playNotificationChime();
    }
  };

  return (
    <>
      {/* Real-time Floating Toast Alert Banner (Positioned perfectly on mobile below navbar & top-right on desktop) */}
      <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-5 sm:top-5 sm:w-96 z-[9999] pointer-events-none font-sans">
        <AnimatePresence>
          {currentToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto bg-slate-900/98 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-500/60 backdrop-blur-md flex items-start space-x-3"
            >
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5 border border-emerald-500/40">
                {getModuleIcon(currentToast.module)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    {getModuleNameBengali(currentToast.module)} নোটিফিকেশন
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">এইমাত্র</span>
                </div>
                <h4 className="text-xs font-black text-white mt-0.5 truncate">{currentToast.title}</h4>
                <p className="text-[11px] text-slate-200 mt-0.5 leading-snug line-clamp-2">
                  {currentToast.message}
                </p>
                {currentToast.senderName && (
                  <span className="text-[9px] text-emerald-300/90 mt-1 inline-block bg-emerald-950/80 px-2 py-0.5 rounded-md font-mono border border-emerald-800/40">
                    উৎস: {currentToast.senderName}
                  </span>
                )}
              </div>
              <button
                onClick={onDismissToast}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                title="বন্ধ করুন"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bell Trigger Button in Header */}
      <div className="relative font-sans">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center ${
            isOpen 
              ? 'bg-emerald-800 text-white border-emerald-700 shadow-md' 
              : 'bg-white/10 hover:bg-white/20 text-white border-emerald-700/50 shadow-2xs'
          }`}
          title="নোটিফিকেশন সেন্টার ও লাইভ সিঙ্ক"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-emerald-900 shadow-xs"
            >
              {unreadCount > 9 ? '৯+' : unreadCount}
            </motion.span>
          )}
        </button>

        {/* Dropdown / Mobile Modal Drawer */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile Dimmed Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 sm:hidden"
              />

              {/* Modal Container: fixed full-width on mobile (left-2 right-2), anchored dropdown on desktop */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.2 }}
                className="fixed left-2.5 right-2.5 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[82vh]"
              >
                {/* Header */}
                <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Radio size={16} className="animate-pulse" />
                    </span>
                    <div>
                      <h3 className="text-xs font-black text-white">লাইভ নোটিফিকেশন সেন্টার</h3>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] text-emerald-300 font-medium">সমস্ত ডিভাইসে লাইভ সিঙ্ক সক্রিয়</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        if (next) playNotificationChime();
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
                    >
                      {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="বন্ধ করুন"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
                  <span className="text-[11px] font-bold text-slate-600">
                    মোট {notifications.length} টি নোটিফিকেশন
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleTriggerTest}
                      className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1 cursor-pointer bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60"
                      title="একটি টেস্ট নোটিফিকেশন পাঠান"
                    >
                      <Radio size={11} className="animate-pulse text-teal-600" />
                      <span>টেস্ট</span>
                    </button>

                    <button
                      onClick={onMarkAllAsRead}
                      disabled={unreadCount === 0}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
                    >
                      <CheckCheck size={13} />
                      <span>সব পঠিত</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={onClearAll}
                      disabled={notifications.length === 0}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>সব মুছুন</span>
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 bg-white">
                  {[
                    { id: 'all', label: 'সকল' },
                    { id: 'student', label: 'শিক্ষার্থী' },
                    { id: 'finance', label: 'ফি/হিসাব' },
                    { id: 'attendance', label: 'হাজিরা' },
                    { id: 'exam', label: 'পরীক্ষা' },
                    { id: 'notice', label: 'নোটিশ' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        selectedFilter === filter.id
                          ? 'bg-emerald-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif, idx) => (
                      <div
                        key={`${notif.id}-${idx}`}
                        onClick={() => onNotificationClick && onNotificationClick(notif)}
                        className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start space-x-3 ${
                          notif.isRead 
                            ? 'bg-white hover:bg-slate-50 opacity-85' 
                            : 'bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 shadow-2xs'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                          {getModuleIcon(notif.module)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getModuleBadgeColor(notif.module)}`}>
                              {getModuleNameBengali(notif.module)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatBengaliTimeAgo(notif.timestamp)}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-800 mt-1 leading-tight">
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {notif.message}
                          </p>

                          {notif.senderName && (
                            <div className="mt-1.5 flex items-center space-x-1 text-[9px] text-slate-400">
                              <Smartphone size={10} />
                              <span>উৎস: {notif.senderName}</span>
                            </div>
                          )}
                        </div>

                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400 space-y-3 px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Bell size={22} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">কোন নোটিফিকেশন নেই</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          অন্য ডিভাইস বা এই ডিভাইসে কোনো তথ্য হালনাগাদ হলে সাথে সাথে এখানে এবং পপআপ হিসেবে দেখা যাবে।
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleTriggerTest}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 mx-auto cursor-pointer"
                      >
                        <Radio size={14} className="animate-pulse" />
                        <span>টেস্ট নোটিফিকেশন পপআপ পাঠান</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                  <span className="text-[10px] text-slate-500 font-medium">
                    স্বয়ংক্রিয় রিয়েল-টাইম সিঙ্ক • কোনো তথ্য বাদ পড়বে না
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
