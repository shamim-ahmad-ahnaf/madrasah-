import React, { useState } from 'react';
import { Student, SMSLog, MadrasahClass, Notice, isClassMatch } from '../types';
import { 
  MessageSquare, 
  Send, 
  Smartphone, 
  Search, 
  Trash2, 
  Coins, 
  CheckCheck, 
  AlertCircle,
  Bell, 
  Bookmark, 
  Clock, 
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface SmsModuleProps {
  students: Student[];
  notices: Notice[];
  smsLogs: SMSLog[];
  onAddSmsLogs: (logs: SMSLog[]) => void;
  onClearSmsLogs: () => void;
}

export default function SmsModule({
  students,
  notices,
  smsLogs,
  onAddSmsLogs,
  onClearSmsLogs
}: SmsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  
  // Custom SMS Form
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessAlert, setSendSuccessAlert] = useState<string | null>(null);

  // Phone Emulator state
  const [selectedReceiptLog, setSelectedReceiptLog] = useState<SMSLog | null>(
    smsLogs.length > 0 ? smsLogs[0] : null
  );

  // Quick template messages
  const templates = [
    { 
      id: 'meeting', 
      label: 'জরুরী অভিভাবক সভা', 
      text: 'আস-সালামু আলাইকুম। আগামী শুক্রবার বাদ আছর মাদ্রাসার মিলনায়তনে জরুরী অভিভাবক সভার আয়োজন করা হয়েছে। সকল অভিভাবকের উপস্থিতি কাম্য। - দারুল উলুম মাদ্রাসা'
    },
    { 
      id: 'ramadan', 
      label: 'রমজান ও ঈদের ছুটি', 
      text: 'সম্মানিত অভিভাবক, পবিত্র মাহে রমজান ও ঈদুল ফিতর উপলক্ষে আগামী ১৫ রমজান হতে শাওয়াল মাসের ৫ তারিখ পর্যন্ত মাদ্রাসার সকল ক্লাস বন্ধ থাকবে। - দারুল উলুম মাদ্রাসা'
    },
    { 
      id: 'exam', 
      label: 'পরীক্ষার নোটিশ', 
      text: 'শ্রদ্ধেয় অভিভাবক, আপনার অবগতির জন্য জানানো যাচ্ছে যে আগামী ১০ তারিখ হইতে অর্ধবার্ষিক পরীক্ষা শুরু হবে। ছাত্রদের উপস্থিতি ও প্রস্তুতি নিশ্চিত করুন। - দারুল উলুম মাদ্রাসা'
    },
    { 
      id: 'general', 
      label: 'হাদিয়া পরিশোধ অনুরোধ', 
      text: 'আস-সালামু আলাইকুম। মাদ্রাসার শিক্ষা কার্যক্রম সুষ্ঠুভাবে পরিচালনার লক্ষে চলতি মাসের নির্ধারিত ফি সময়মত পরিশোধ করার জন্য বিনীত অনুরোধ করা হলো। - দারুল উলুম মাদ্রাসা'
    },
  ];

  // Set message when template changes
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    if (val === 'custom') {
      setCustomMessage('');
    } else {
      const match = templates.find(t => t.id === val);
      if (match) {
        setCustomMessage(match.text);
      }
    }
  };

  // Broadcast manual SMS
  const handleBroadcastSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) {
      alert('অনুগ্রহ করে এসএমএস এর মূল বার্তাটি লিখুন।');
      return;
    }

    // Filter students targeting
    let targetStudents = [...students];
    if (selectedClass !== 'all') {
      targetStudents = students.filter(s => isClassMatch(s.gradeClass, selectedClass));
    }

    if (targetStudents.length === 0) {
      alert('নির্বাচিত বিভাগে কোনো শিক্ষার্থী পাওয়া যায়নি!');
      return;
    }

    setIsSending(true);

    // Simulate sending network latency
    setTimeout(() => {
      const newLogs: SMSLog[] = targetStudents.map(student => {
        // Substitute name if template supports it
        let messageBody = customMessage;
        // Basic merge tag support
        messageBody = messageBody.replace(/{student}/g, student.name)
                                 .replace(/{roll}/g, student.roll.toString())
                                 .replace(/{class}/g, student.gradeClass);

        return {
          id: 'sms-' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
          studentId: student.id,
          studentName: student.name,
          gradeClass: student.gradeClass,
          phone: student.phone || '01700-000000',
          type: 'ঘোষণা ও নোটিশ (Announcement)',
          message: messageBody,
          status: 'সফল (Success)'
        };
      });

      onAddSmsLogs(newLogs);
      setIsSending(false);
      setCustomMessage('');
      setSelectedTemplate('custom');
      
      const successMsg = `${selectedClass === 'all' ? 'সকল' : selectedClass} বিভাগের ${targetStudents.length} জন শিক্ষার্থীর অভিভাবকদের ফোনে সফলভাবে বার্তা পাঠানো হয়েছে!`;
      setSendSuccessAlert(successMsg);
      
      // Auto highlight first newly sent in the phone explorer
      if (newLogs.length > 0) {
        setSelectedReceiptLog(newLogs[0]);
      }

      setTimeout(() => setSendSuccessAlert(null), 5000);
    }, 1500);
  };

  // Filter logs for rendering
  const filteredLogs = smsLogs.filter(log => {
    const matchesSearch = 
      (log.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      log.phone.includes(searchTerm) || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = true;
    if (selectedTypeFilter !== 'all') {
      matchesType = log.type.includes(selectedTypeFilter);
    }
    return matchesSearch && matchesType;
  });

  // Calculate quick stats
  const totalSMS = smsLogs.length;
  const attendanceSMS = smsLogs.filter(l => l.type.includes('হাজিরা')).length;
  const financeSMS = smsLogs.filter(l => l.type.includes('বেতন') || l.type.includes('পেমেন্ট')).length;
  const noticeSMS = smsLogs.filter(l => l.type.includes('ঘোষণা')).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-full tracking-wider">সিমুলেশন একটিভ</span>
            <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full">স্মার্ট অভিভাবক কানেক্ট</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2">কম্যুনিকেশন ও অভিভাবক এসএমএস সেন্টার (SMS Suite)</h2>
          <p className="text-xs text-slate-500 mt-1">মাদ্রাসার শিক্ষার্থীদের দৈনন্দিন হাজিরার তথ্য, বকেয়া বেতন সতর্কতা এবং জরুরী নোটিশ বাংলা এসএমএস আকারে সরাসরি অভিভাবকদের মোবাইলে সিমুলেশন করুন।</p>
        </div>
        
        {/* SMS gateway status widget */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex items-center space-x-3 text-right">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Coins size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">গেটওয়ে ব্যালেন্স</span>
            <span className="text-sm font-extrabold text-slate-800 font-mono">৳ ৪৫০.২৫</span>
            <span className="text-[9px] text-emerald-600 block font-bold">AL-NOOR_SMS (অনুমোদিত)</span>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">মোট প্রেরিত এসএমএস</span>
          <span className="text-2xl font-extrabold text-indigo-800 font-mono mt-1">{totalSMS} টি</span>
          <p className="text-[9px] text-slate-400 mt-1">সর্বমোট ডেলিভারি নিশ্চিত</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">হাজিরা উপস্থিতি বার্তা</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">{attendanceSMS} টি</span>
          <p className="text-[9px] text-emerald-600 mt-1">উপস্থিতি ও অনুপস্থিতি ভিত্তিক</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">বেতন বকেয়া ও রিসিপ্ট</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono mt-1">{financeSMS} টি</span>
          <p className="text-[9px] text-slate-400 mt-1">পরিশোধ রসিদ নিশ্চিতকরণ</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold block">সাধারণ নোটিশ ও পরিপত্র</span>
          <span className="text-2xl font-extrabold text-sky-700 font-mono mt-1">{noticeSMS} টি</span>
          <p className="text-[9px] text-sky-600 mt-1">ছুটি ও পরীক্ষা সংক্রান্ত</p>
        </div>
      </div>

      {/* Main Split: Left Form and Logs, Right Phone Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Interactive broadcast forms & Logs search: 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          
          {sendSuccessAlert && (
            <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold animate-fade-in shadow-xs">
              <CheckCheck className="text-emerald-600 shrink-0" size={18} />
              <span>{sendSuccessAlert}</span>
            </div>
          )}

          {/* SMS Broadcast Generator Block */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Sparkles className="text-emerald-700" size={18} />
              <h3 className="text-sm font-bold text-slate-800 font-sans">নতুন গ্রুপ নোটিশ এসএমএস ব্রডকাস্ট (Custom Broadcast Portal)</h3>
            </div>

            <form onSubmit={handleBroadcastSend} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Choose target Class */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">গ্রাহক শ্রেণী / বিভাগ নির্ধারণ</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-600"
                  >
                    <option value="all">মাদ্রাসার সকল অভিভাবক ({students.length} জন)</option>
                    <option value="নূরানী">নূরানী বিভাগ</option>
                    <option value="নাজেরা">নাজেরা বিভাগ</option>
                    <option value="হিফজ">হিফজ বিভাগ</option>
                    <option value="কিতাব বিভাগ">কিতাব বিভাগ</option>
                    <option value="জেনারেল">জেনারেল বিভাগ</option>
                  </select>
                </div>

                {/* Choose pre-made template */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">প্রি-মেড বাংলা এসএমএস টেমপ্লেটসমূহ</label>
                  <select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-600"
                  >
                    <option value="custom">নিজের মতো লিখুন (Custom Message)</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Message text body area */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600">এসএমএস এর মূল টেক্সট বার্তা (বাংলা)</label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {customMessage.length} অক্ষর • {Math.ceil(customMessage.length / 160) || 1} পার্ট এসএমএস
                  </span>
                </div>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="বাংলায় এসএমএসের বর্ণনা সংক্ষেপে পেশ করুন... উদা: আস-সালামু আলাইকুম। মাদ্রাসার উন্নয়নকল্পে একটি মতবিনিময় সভার আহবান..."
                  rows={3}
                  maxLength={400}
                  className="w-full text-xs font-medium border border-slate-150 rounded-xl p-3 outline-none focus:border-indigo-600 transition-colors text-slate-700 bg-slate-50/20"
                />
                
                <p className="text-[9px] text-slate-400 leading-normal mt-1 bg-yellow-50/50 p-2 rounded border border-yellow-100">
                  💡 <strong>টিপস:</strong> আপনি লিখার মাঝে <code>{`{student}`}</code>, <code>{`{roll}`}</code> বা <code>{`{class}`}</code> ব্যবহার করতে পারেন। সিস্টেম এগুলোকে শিক্ষার্থীর প্রকৃত নাম, রোল এবং বিভাগ দিয়ে প্রতিস্থাপন করে পাঠাবে!
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-50 gap-2">
                <button
                  type="submit"
                  disabled={isSending || students.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center space-x-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>বার্তা সিমুলেশন হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>সিমেলেটেড গ্রুপ এসএমএস পাঠান</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Historical Logs Listing Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800">প্রেরিত এসএমএস এর রেকর্ড বুক ও লগ তালিকা</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">সবগুলো সফল ও সিমেলেটেড বার্তার বিবরণী</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onClearSmsLogs();
                    setSelectedReceiptLog(null);
                  }}
                  className="text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100/60 p-1.5 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1"
                >
                  <Trash2 size={11} />
                  <span>লগ ক্লিয়ার করুন</span>
                </button>
              </div>
            </div>

            {/* Filter and Search controls */}
            <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search log field */}
              <div className="relative md:col-span-2">
                <Search size={14} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="শিক্ষার্থীর নাম, মোবাইল নম্বর বা বার্তা দিয়ে লগ খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-700"
                />
              </div>

              {/* Category selector */}
              <div>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-600"
                >
                  <option value="all">সকল ধরন (All Types)</option>
                  <option value="হাজিরা">হাজিরা বার্তা (Attendance)</option>
                  <option value="বেতন">বেতন সক্রান্ত (Finance)</option>
                  <option value="পেমেন্ট">পেমেন্ট রশিদ (Receipts)</option>
                  <option value="ঘোষণা">ঘোষণা ও নোটিশ (News)</option>
                </select>
              </div>
            </div>

            {/* Logs list table */}
            {filteredLogs.length > 0 ? (
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[360px]">
                {filteredLogs.map((log) => {
                  const isSelected = selectedReceiptLog?.id === log.id;
                  
                  // Style based on Category
                  const isAttendance = log.type.includes('হাজিরা');
                  const isFinance = log.type.includes('বেতন') || log.type.includes('পেমেন্ট');

                  return (
                    <div 
                      key={log.id}
                      onClick={() => setSelectedReceiptLog(log)}
                      className={`p-3.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-indigo-50/60 border-l-4 border-indigo-600 font-medium' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isAttendance 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : isFinance 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-sky-50 text-sky-700'
                        }`}>
                          <MessageSquare size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1 flex-wrap">
                            <span className="font-extrabold text-slate-800">{log.studentName || 'সাধারণ'}</span>
                            <span className="text-[10px] text-slate-400">• Roll {log.gradeClass || 'Notice'}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">ফোনে: {log.phone} • {log.type}</p>
                          <p className="text-[11px] text-slate-600 mt-1 italic truncate max-w-xs md:max-w-md">"{log.message}"</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 block">{log.timestamp}</span>
                        <span className="inline-flex items-center space-x-1 text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded mt-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>বিতরণ সফল</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-xs">কোনো এসএমএস নোটিফিকেশন লগ পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Phone Emulator Side Panel: 4 cols */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <div className="bg-slate-900 rounded-3xl p-3 border-4 border-slate-850 shadow-2xl relative w-full max-w-[280px] mx-auto overflow-hidden">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-20 flex items-center justify-center">
                {/* iPhone Dynamic Island */}
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2 border border-slate-800/40"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
              </div>

              {/* Simulated Mobile Phone Screen Container */}
              <div className="bg-slate-950 rounded-[22px] min-h-[460px] max-h-[500px] text-white overflow-hidden relative flex flex-col select-none">
                
                {/* Phone Status bar */}
                <div className="h-9 px-4 pt-4 flex justify-between items-center text-[9px] font-semibold text-slate-300 font-mono tracking-tighter">
                  <span>১০:১৯</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[8px]">LTE 4G</span>
                    <div className="w-4.5 h-2.2 bg-emerald-600 rounded-xs relative flex items-center p-0.5">
                      <div className="bg-white w-full h-full rounded-2xs"></div>
                    </div>
                  </div>
                </div>

                {/* Receiver Custom Header */}
                <div className="bg-slate-900 border-b border-slate-850 p-2.5 pt-1.5 text-center shrink-0">
                  <div className="w-9 h-9 rounded-full bg-cyan-700 mx-auto flex items-center justify-center font-bold text-xs shadow-sm mb-1">
                    মো
                  </div>
                  <h4 className="text-[10px] font-extrabold text-slate-200">
                    {selectedReceiptLog ? `${selectedReceiptLog.studentName} এর অভিভাবক` : 'মোবাইল সিমুলেটর'}
                  </h4>
                  <p className="text-[8px] text-slate-400 mt-0.5">{selectedReceiptLog ? selectedReceiptLog.phone : '017xx-xxxxxx'}</p>
                </div>

                {/* SMS Text Messages Flow Feed */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-slate-925 text-[10px] leading-relaxed relative">
                  
                  <div className="text-center">
                    <span className="bg-slate-900 text-slate-550 py-0.5 px-2 rounded-md text-[8px] tracking-wide uppercase font-bold">আজকে প্রাপ্ত নোটিশ</span>
                  </div>

                  {selectedReceiptLog ? (
                    <div className="space-y-4 animate-fade-in">
                      
                      {/* Notice Header details preview */}
                      <div className="bg-slate-900/60 border border-slate-850 p-2 rounded-xl">
                        <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider block">বার্তা ক্যাটাগরি</p>
                        <p className="text-[9px] font-bold text-cyan-400 mt-0.5">{selectedReceiptLog.type}</p>
                        <span className="text-[8px] text-slate-400 block mt-1">প্রেরিত: {selectedReceiptLog.timestamp}</span>
                      </div>

                      {/* Actual bubble block */}
                      <div className="flex items-start flex-col">
                        <span className="text-[8px] text-slate-400 ml-1.5 mb-1 bg-slate-900 py-0.5 px-1.5 rounded-full font-semibold">Al-Noor Madrasah</span>
                        <div className="bg-slate-850 text-slate-200 p-3 rounded-2xl rounded-tl-sm border border-slate-800 shadow-md max-w-[90%] whitespace-pre-wrap leading-relaxed">
                          {selectedReceiptLog.message}
                        </div>
                        <span className="text-[7px] text-slate-500 mt-1 ml-2 font-mono flex items-center space-x-0.5">
                          <span>✓✓ বিতরণ সম্পন্ন</span>
                        </span>
                      </div>

                      {/* Option to send real SMS via phone native client without API */}
                      <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl mt-2 w-full text-center">
                        <a
                          href={`sms:${selectedReceiptLog.phone}?body=${encodeURIComponent(selectedReceiptLog.message)}`}
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] rounded-lg tracking-wide shadow-xs transition-all flex items-center justify-center space-x-1"
                        >
                          <Send size={10} />
                          <span>বাস্তবে মোবাইল দিয়ে পাঠান</span>
                        </a>
                        <p className="text-[7.5px] text-slate-400 leading-normal mt-1 flex items-center justify-center space-x-1">
                          <span>📱 মোবাইল ফোনে মেসেজটি এভাবে পাঠাতে পারেন</span>
                        </p>
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-20 px-4">
                      <Smartphone className="text-slate-700 animate-bounce mb-2" size={32} />
                      <p className="text-[10px] font-bold">এসএমএস দেখতে বামে কোনো লগে ক্লিক করুন!</p>
                      <p className="text-[8px] text-slate-500 mt-1">নতুন বার্তা পাঠালে তা এখানে সরাসরি দেখা যাবে।</p>
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Screen Home Indicator */}
                <div className="h-6 shrink-0 flex items-center justify-center">
                  <div className="w-20 h-1 bg-slate-700 rounded-full"></div>
                </div>

              </div>
            </div>

            {/* Information tips card underneath phone */}
            <div className="mt-4 bg-white rounded-xl border border-slate-100 shadow-xs p-4 text-[11px] text-slate-500 leading-relaxed font-light">
              <span className="font-bold text-slate-800 block mb-1">সিমুলেশন সিস্টেমের বৈশিষ্ট্য</span>
              মাদ্রাসার দৈনিক হাজিরা মডিউল, বেতন আদায় মডিউল এবং নতুন নোটিশ মডিউলগুলোর সাথে এই এসএমএস সিস্টেমটি সংযুক্ত। আপনি যখনই ঐ মডিউলগুলোতে কোনো নতুন এন্ট্রি বা পরিবর্তন সংরক্ষণ করবেন, তার জন্য একটি করে সিমেলেটেড এসএমএস সফলভাবে তৈরি হয়ে সেন্টারে জমা হয়ে যাবে।
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
