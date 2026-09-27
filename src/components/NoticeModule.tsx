import React, { useState } from 'react';
import { Notice } from '../types';
import { Megaphone, Plus, Trash2, Edit, Calendar, BookOpen, Clock, X, MessageSquare, Send } from 'lucide-react';

interface NoticeModuleProps {
  notices: Notice[];
  onAddNotice: (notice: Omit<Notice, 'id'>) => void;
  onUpdateNotice: (notice: Notice) => void;
  onDeleteNotice: (id: string) => void;
  onSendNoticeSMS: (notice: Notice) => void;
  highlightNoticeId?: string | null;
}

export default function NoticeModule({
  notices,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onSendNoticeSMS,
  highlightNoticeId
}: NoticeModuleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [smsNoticeNotification, setSmsNoticeNotification] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);

  // Auto-open highlighted notice if provided
  React.useEffect(() => {
    if (highlightNoticeId) {
      const found = notices.find(n => n.id === highlightNoticeId);
      if (found) {
        setViewingNotice(found);
      }
    }
  }, [highlightNoticeId, notices]);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'জরুরী' | 'পরীক্ষা' | 'ছুটি' | 'সাধারণ'>('সাধারণ');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const openAddModal = () => {
    setEditingNotice(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('সাধারণ');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormCategory(notice.category);
    setFormDate(notice.date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) {
      alert('শ্রেণী বিজ্ঞপ্তি বা নোটিশের টাইটেল ও বিবরণ দিন।');
      return;
    }

    const payload = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      date: formDate
    };

    if (editingNotice) {
      onUpdateNotice({ ...payload, id: editingNotice.id });
    } else {
      onAddNotice(payload);
    }
    handleCloseModal();
  };

  const filteredNotices = notices.filter(n => 
    selectedCategory === 'all' || n.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800">মাদ্রাসার নোটিশ বোর্ড ব্যবস্থাপনা</h2>
          <p className="text-xs text-slate-500 mt-1">জরুরী বিজ্ঞপ্তি, ছুটির ঘোষণা, পরীক্ষার ঘোষণা এবং সাধারণ নীতিমালা প্রকাশের ডিজিটাল বোর্ড</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5"
        >
          <Plus size={18} />
          <span>নতুন নোটিশ তৈরি করুন</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { key: 'all', val: 'সব নোটিশ' },
          { key: 'জরুরী', val: 'জরুরী (Urgent)' },
          { key: 'পরীক্ষা', val: 'পরীক্ষা (Exams)' },
          { key: 'ছুটি', val: 'ছুটি (Holidays)' },
          { key: 'সাধারণ', val: 'সাধারণ (General)' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedCategory(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === tab.key 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {tab.val}
          </button>
        ))}
      </div>

      {/* Notices Grid listing layout */}
      {smsNoticeNotification && (
        <div className="bg-indigo-50 border border-indigo-150 text-indigo-850 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in shadow-xs mb-4">
          <Send size={14} className="text-indigo-600 shrink-0" />
          <span>{smsNoticeNotification}</span>
        </div>
      )}

      {filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNotices.map((notice) => {
            const isUrgent = notice.category === 'জরুরী';
            const isExam = notice.category === 'পরীক্ষা';
            const isHoliday = notice.category === 'ছুটি';

            return (
              <div 
                key={notice.id} 
                onClick={() => setViewingNotice(notice)}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all cursor-pointer ${
                  highlightNoticeId === notice.id
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md'
                    : isUrgent 
                      ? 'bg-red-50/40 border-red-100/80 hover:bg-red-50/70' 
                      : isExam
                        ? 'bg-amber-50/45 border-amber-100/80 hover:bg-amber-50/70'
                        : isHoliday
                          ? 'bg-indigo-50/40 border-indigo-150 hover:bg-indigo-50/75'
                          : 'bg-white border-slate-100 hover:border-emerald-100 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      isUrgent ? 'bg-red-200 text-red-800' :
                      isExam ? 'bg-amber-200 text-amber-800' :
                      isHoliday ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {notice.category}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center space-x-1">
                      <Calendar size={11} />
                      <span>{notice.date}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight leading-snug">{notice.title}</h3>
                  <p className="text-xs text-slate-600 font-normal mt-2 leading-relaxed whitespace-pre-line line-clamp-3">{notice.content}</p>
                </div>

                <div 
                  className="pt-4 mt-6 border-t border-slate-100/60 flex items-center justify-between flex-wrap gap-2 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => {
                      onSendNoticeSMS(notice);
                      setSmsNoticeNotification(`"${notice.title}" নোটিশটি সফলভাবে সকল শিক্ষার্থীর অভিভাবকদের মোবাইলে ব্রডকাস্ট করা হয়েছে!`);
                      setTimeout(() => setSmsNoticeNotification(null), 5000);
                    }}
                    className="p-1 px-2.5 rounded-lg border border-indigo-150 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-900 transition-colors text-xs flex items-center space-x-1 cursor-pointer font-bold shrink-0"
                  >
                    <MessageSquare size={11} />
                    <span>অভিভাবকদের SMS পাঠান</span>
                  </button>
                  <div className="flex items-center space-x-1.5">
                    <button 
                      onClick={() => setViewingNotice(notice)}
                      className="p-1 px-2.5 rounded-lg border border-slate-150 hover:bg-slate-100 text-slate-700 transition-colors text-xs flex items-center space-x-1 font-semibold"
                    >
                      <span>বিস্তারিত</span>
                    </button>
                    <button 
                      onClick={() => openEditModal(notice)}
                      className="p-1 px-2.5 rounded-lg border border-slate-150 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 transition-colors text-xs flex items-center space-x-1"
                    >
                      <Edit size={11} />
                      <span>সম্পাদনা</span>
                    </button>
                    <button 
                      onClick={() => {
                        onDeleteNotice(notice.id);
                      }}
                      className="p-1 px-2.5 rounded-lg border border-slate-150 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 transition-colors text-xs flex items-center space-x-1"
                    >
                      <Trash2 size={11} />
                      <span>মুছে ফেলুন</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white text-center py-12 rounded-2xl border border-slate-100 shadow-sm text-slate-400">
          <Megaphone className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-xs font-medium">এই ক্যাটাগরিতে কোনো নোটিশ খুঁজে পাওয়া যায়নি।</p>
        </div>
      )}

      {/* Modal - Notice Add / Edit Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xs font-sans">
                {editingNotice ? 'নোটিশ তথ্য হালনাগাদ করুন' : 'মাদ্রাসার জন্য নতুন পরিপত্র নোটিশ'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 md:pr-4">
              
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">নোটিশ ক্যাটাগরি *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                >
                  <option value="সাধারণ">সাধারণ (General)</option>
                  <option value="জরুরী">জরুরী (Urgent)</option>
                  <option value="পরীক্ষা">পরীক্ষা (Exams)</option>
                  <option value="ছুটি">ছুটি (Holidays)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">নোটিশ শিরোনাম টাইটেল *</label>
                <input 
                  type="text" 
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="উদা: পবিত্র ঈদুল আযহা উপলক্ষে গ্রীষ্মকালীন ছুটির নোটিশ"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              {/* Notice Publication Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">বিজ্ঞপ্তির তারিখ *</label>
                <input 
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-mono"
                />
              </div>

              {/* Content body */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">বর্ণনা ও নোটিশ বিবরণী *</label>
                <textarea 
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="এখানে নোটিশের পূর্ণ বিবরণ ও নির্দেশনা পেশ করুন..."
                  rows={5}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  {editingNotice ? 'হালনাগাদ সম্পন্ন করুন' : 'নোটিশ বোর্ডে প্রকাশ করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal - Notice View Details */}
      {viewingNotice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="bg-emerald-900 text-white p-5 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-emerald-800 text-emerald-300 rounded-lg">
                    <Megaphone size={16} />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    {viewingNotice.category} নোটিশ
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-white mt-1 leading-snug">
                  {viewingNotice.title}
                </h3>
              </div>
              <button 
                onClick={() => setViewingNotice(null)}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ml-3"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                <span className="flex items-center space-x-1.5 font-mono">
                  <Calendar size={14} className="text-emerald-700" />
                  <span>প্রকাশের তারিখ: <strong>{viewingNotice.date}</strong></span>
                </span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                  আইডি: {viewingNotice.id}
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                  {viewingNotice.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSendNoticeSMS(viewingNotice);
                    setSmsNoticeNotification(`"${viewingNotice.title}" সফলভাবে এসএমএস আকারে পাঠানো হয়েছে!`);
                    setTimeout(() => setSmsNoticeNotification(null), 5000);
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span>সকলকে SMS পাঠান</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const n = viewingNotice;
                      setViewingNotice(null);
                      openEditModal(n);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit size={13} />
                    <span>সম্পাদনা</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingNotice(null)}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    ঠিক আছে
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
