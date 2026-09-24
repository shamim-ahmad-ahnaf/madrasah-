import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { realtimeSync } from '../services/realtimeSync';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  actionButtonText?: string;
}

export default function OwnerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'মালিক / মুহতামিমের অনুমোদন আবশ্যক',
  description = 'তথ্য পরিবর্তন নিশ্চিত ও ফাইনাল করার জন্য মালিকের পাসওয়ার্ড দিন।',
  actionButtonText = 'অনুমোদন ও ফাইনাল করুন'
}: OwnerAuthModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authMode, setAuthMode] = useState<'permanent' | 'temporary' | 'once'>('permanent');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('দয়া করে মালিকের পাসওয়ার্ড লিখুন!');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await realtimeSync.verifyOwnerPassword(password);
      if (isValid) {
        if (authMode === 'permanent') {
          realtimeSync.setOwnerDevice(true);
        } else if (authMode === 'temporary') {
          realtimeSync.setTemporaryOwnerAuth(15);
        } else {
          // once: do not save persistent token
          localStorage.removeItem('madrasah_owner_auth_expire');
        }
        setPassword('');
        setError('');
        onSuccess();
        onClose();
      } else {
        setError('পাসওয়ার্ড সঠিক নয়! শুধুমাত্র মাদরাসার মালিক/মুহতামিম এই পরিবর্তন করতে পারবেন।');
      }
    } catch (err) {
      setError('পাসওয়ার্ড যাচাই করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-xl text-emerald-300 border border-emerald-700">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide text-white">{title}</h3>
              <span className="text-[10px] text-emerald-300 block font-medium">নিরাপত্তা ও অ্যাক্সেস নিয়ন্ত্রণ</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/50 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-start space-x-3 bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl text-xs text-amber-900">
            <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {description} যেকেউ যেন ডেটা পরিবর্তন বা নষ্ট করতে না পারে, সেজন্য শুধুমাত্র মালিকের অনুমোদনে তথ্য ফাইনাল হবে।
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              মালিকের সিকিউরিটি পাসওয়ার্ড:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="পাসওয়ার্ড লিখুন..."
                autoFocus
                className="w-full text-sm font-medium border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-slate-50/50 focus:bg-white transition-all text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-1.5 text-[11px] text-rose-600 font-bold mt-1.5 bg-rose-50 p-2 rounded-xl border border-rose-100"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span className="italic">ডিফল্ট পাসওয়ার্ড: admin123 (সেটিংস থেকে পরিবর্তনযোগ্য)</span>
            </div>
          </div>

          {/* Auth Duration and Device Recognition Options */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-700">
              অনুমোদনের ধরণ ও ডিভাইসের মর্যাদা নির্ধারণ করুন:
            </label>

            <div className="space-y-1.5">
              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                authMode === 'permanent' 
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs' 
                  : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="authModeOption"
                  checked={authMode === 'permanent'}
                  onChange={() => setAuthMode('permanent')}
                  className="mt-0.5 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-[11px] leading-tight">
                  <div className="flex items-center space-x-1">
                    <span className="font-extrabold text-emerald-900">👑 স্থায়ী মালিক ডিভাইস হিসেবে সংরক্ষণ করুন</span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">প্রস্তাবিত</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                    এই ডিভাইসে আর কখনো পাসওয়ার্ড চাইবে না। সরাসরি সকল পরিবর্তন ফাইনাল হবে।
                  </p>
                </div>
              </label>

              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                authMode === 'temporary' 
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs' 
                  : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="authModeOption"
                  checked={authMode === 'temporary'}
                  onChange={() => setAuthMode('temporary')}
                  className="mt-0.5 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800">⏱️ পরবর্তী ১৫ মিনিটের জন্য সক্রিয় রাখুন</span>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                    ১৫ মিনিট পর স্বয়ংক্রিয়ভাবে পুনরায় লক হয়ে যাবে।
                  </p>
                </div>
              </label>

              <label className={`flex items-start space-x-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                authMode === 'once' 
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs' 
                  : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="authModeOption"
                  checked={authMode === 'once'}
                  onChange={() => setAuthMode('once')}
                  className="mt-0.5 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-slate-700">🔒 শুধুমাত্র এই কাজের জন্য অনুমোদন দিন</span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Check size={15} />
              <span>{isVerifying ? 'যাচাই হচ্ছে...' : actionButtonText}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
