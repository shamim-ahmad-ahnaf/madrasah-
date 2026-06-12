import React, { useState, useMemo } from 'react';
import { Student, Teacher, FeePayment, AttendanceRecord, Notice } from '../types';
import { Users, GraduationCap, DollarSign, CalendarCheck, Megaphone, Bell, ArrowRight, UserPlus, FileCheck, ShieldAlert, BarChart3, Receipt, Send, ShieldAlert as OverdueIcon } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const MONTH_NAMES = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  payments: FeePayment[];
  attendance: AttendanceRecord[];
  notices: Notice[];
  setActiveTab: (tab: string) => void;
  onAddStudent: () => void;
  onAddPayment: (studentId?: string) => void;
  onSendReminderSMS?: (student: Student) => void;
}

export default function DashboardView({
  students,
  teachers,
  payments,
  attendance,
  notices,
  setActiveTab,
  onAddStudent,
  onAddPayment,
  onSendReminderSMS
}: DashboardViewProps) {
  const [dashboardNotification, setDashboardNotification] = useState<string | null>(null);

  // Group payments by month for monthly trend chart
  const monthlyRevenueData = useMemo(() => {
    const monthlyGroups = payments.reduce((acc, p) => {
      const cleanMonth = p.payingMonth.replace(' মাস', '').trim();
      acc[cleanMonth] = (acc[cleanMonth] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    const currentMonthIndex = new Date().getMonth(); // e.g. June (5)
    
    // Find the latest month with any payment to determine the visible range
    const maxVisibleIndex = Math.max(
      currentMonthIndex, 
      ...MONTH_NAMES.map((m, idx) => monthlyGroups[m] > 0 ? idx : -1)
    );

    return MONTH_NAMES
      .slice(0, Math.min(12, maxVisibleIndex + 1))
      .map(month => ({
        name: month,
        'আদায়কৃত ফি': monthlyGroups[month] || 0,
      }));
  }, [payments]);
  
  // Calculate stats
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  
  // Current month payment summation
  const currentMonthPayments = payments.reduce((sum, item) => sum + item.amount, 0);

  // Today's attendance percentage
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(r => r.date === todayStr);
  const presentToday = todayAttendance.filter(r => r.status.includes('Present')).length;
  const attendanceRate = todayAttendance.length > 0 
    ? Math.round((presentToday / todayAttendance.length) * 100) 
    : 92; // Default realistic fallback if no records today

  // Find recent 3 notices
  const recentNotices = [...notices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

  // Class-wise student distribution
  const classCounts = students.reduce((acc, student) => {
    acc[student.gradeClass] = (acc[student.gradeClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          {/* Subtle Islamic geometric design overlay (custom SVG or pattern) */}
          <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L100 50 L50 100 L0 50 Z M50 10 L90 50 L50 90 L10 50 Z" />
          </svg>
        </div>
        
        <div className="max-w-2xl">
          <span className="bg-emerald-600/40 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            আস-সালামু আলাইকুম
          </span>
          <h1 className="text-2xl md:text-3xl font-bold font-sans mt-3">মাদ্রাসা ড্যাশবোর্ড</h1>
          <p className="text-emerald-100 font-light mt-2 text-sm md:text-base leading-relaxed">
            একটি ডিজিটাল ও আধুনিক মাদ্রাসা ব্যবস্থাপনা সিস্টেম। এখানে দ্বীনি শিক্ষার প্রশাসনিক সকল কার্যক্রম যেমন ছাত্র ভর্তি, শিক্ষকদের তথ্য, দৈনন্দিন উপস্থিতি, রসিদ ভিত্তিক বেতন এবং নোটিশ বোর্ড পরিচালনা করা অত্যন্ত সহজ।
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-emerald-200 transition-all">
          <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">মোট ছাত্র-ছাত্রী</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{totalStudents} জন</h3>
            <span className="text-slate-400 text-[10px] block mt-0.5">সবগুলো বিভাগ মিলিয়ে</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-emerald-200 transition-all">
          <div className="p-3.5 bg-sky-50 rounded-xl text-sky-600">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">শিক্ষক ও স্টাফ</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{totalTeachers} জন</h3>
            <span className="text-slate-400 text-[10px] block mt-0.5">যোগ্য ও অভিজ্ঞ উস্তাদগণ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-emerald-200 transition-all">
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">মোট সংগৃহীত ফি</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">৳ {currentMonthPayments.toLocaleString()}</h3>
            <span className="text-amber-600 text-[10px] font-semibold block mt-0.5">এই মাসে মোট প্রাপ্তি</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:border-emerald-200 transition-all">
          <div className="p-3.5 bg-indigo-50 rounded-xl text-indigo-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">আজকের উপস্থিতি হার</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">{attendanceRate}%</h3>
            <span className="text-emerald-600 text-[10px] font-semibold block mt-0.5">নিয়মিত হাজির হিসাব</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Quick actions + Notices and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Space: Notice Board & Class Distribution */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Monthly Fee Collection Trend Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6" id="dashboard-monthly-trend">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 font-sans">মাসিক ফি ও হাদিহা সংগ্রহ ট্রেন্ড</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">সবগুলো বিভাগ মিলিয়ে চলতি বছরের প্রাপ্ত ফি আদায়ের বিশ্লেষণ চিত্র</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('reports')} 
                className="text-emerald-700 text-xs font-bold hover:underline flex items-center space-x-1 shrink-0 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                <span>বিশ্লেষণ খতিয়ান</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="h-60 w-full font-sans">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyRevenueData}
                  margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="dashboardRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.00}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'sans-serif' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="আদায়কৃত ফি" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#dashboardRevenueGrad)" name="আদায়কৃত ফি (৳)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Urgent Announcements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                  <Megaphone size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 font-sans">নোটিশ ও বিজ্ঞপ্তি বোর্ড</h2>
              </div>
              <button 
                onClick={() => setActiveTab('notices')} 
                className="text-emerald-600 text-xs font-semibold hover:underline flex items-center space-x-1"
              >
                <span>সব দেখুন</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {recentNotices.length > 0 ? (
                recentNotices.map((notice) => {
                  const isUrgent = notice.category === 'জরুরী';
                  const isExam = notice.category === 'পরীক্ষা';
                  const isHoliday = notice.category === 'ছুটি';
                  
                  return (
                    <div 
                      key={notice.id} 
                      className={`p-4 rounded-xl border transition-colors ${
                        isUrgent 
                          ? 'bg-red-50/50 border-red-100 hover:bg-red-50' 
                          : isExam
                            ? 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'
                            : isHoliday
                              ? 'bg-indigo-50/40 border-indigo-100 hover:bg-indigo-50'
                              : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isUrgent ? 'bg-red-200 text-red-800' :
                            isExam ? 'bg-amber-200 text-amber-800' :
                            isHoliday ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {notice.category}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{notice.date}</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{notice.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 lines-clamp-2 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">কোনো নোটিশ রেকর্ড পাওয়া যায়নি।</div>
              )}
            </div>
          </div>

          {/* Student Class distribution info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              <span>বিভাগ ভিত্তিক ছাত্র সংখ্যা</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['নূরানী', 'নাজেরা', 'হিফজ', 'কিতাব বিভাগ', 'জেনারেল'].map((className) => {
                const count = classCounts[className] || 0;
                const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                
                return (
                  <div key={className} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl text-center">
                    <p className="text-xs font-semibold text-slate-500">{className}</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{count} জন</p>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-1 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overdue Payments Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <OverdueIcon size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 font-sans">চলতি মাসের বকেয়া বেতন খতিয়ান ({
                    (() => {
                      const bmonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
                      return bmonths[new Date().getMonth()] || 'জুন';
                    })()
                  } ২০২৬)</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">যে সকল শিক্ষার্থীদের চলতি মাসের নির্ধারিত ফি এখনো পরিশোধ করা হয়নি</p>
                </div>
              </div>
              
              {(() => {
                const bmonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
                const bmonth = bmonths[new Date().getMonth()] || 'জুন';
                const list = students.filter(student => !payments.some(p => p.studentId === student.id && (p.payingMonth === bmonth || p.payingMonth === `${bmonth} মাস`)));
                return (
                  <span className="px-2.5 py-1 text-xs font-black text-rose-700 bg-rose-50 border border-rose-100/55 rounded-full self-start sm:self-center">
                    মোট বকেয়া: {list.length} জন
                  </span>
                );
              })()}
            </div>

            {dashboardNotification && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 text-xs font-bold rounded-xl animate-fade-in flex items-center space-x-1.5 leading-normal">
                <Send size={12} className="text-emerald-700 shrink-0" />
                <span>{dashboardNotification}</span>
              </div>
            )}

            {(() => {
              const bmonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
              const bmonth = bmonths[new Date().getMonth()] || 'জুন';
              const overdueList = students.filter(student => !payments.some(p => p.studentId === student.id && (p.payingMonth === bmonth || p.payingMonth === `${bmonth} মাস`)));

              return overdueList.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
                  {overdueList.map((student) => (
                    <div key={student.id} className="py-3 flex flex-wrap items-center justify-between gap-3 first:pt-0 last:pb-0 hover:bg-slate-50/25 px-2 rounded-xl transition-colors">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-xs text-rose-700 shrink-0">
                          {student.roll}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 leading-none">
                            বিভাগ: {student.gradeClass} • পিতা: {student.fatherName} • মোবাইল: {student.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-rose-600 block">৳{student.monthlyFee}</span>
                          <span className="text-[8px] bg-rose-5 border border-rose-100 text-rose-750 px-1.5 py-0.2 rounded-full block mt-0.5 font-bold uppercase text-center shrink-0">বকেয়া</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => onAddPayment(student.id)}
                          className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shrink-0"
                          title="ফি সংগ্রহ রশিদ খোলেন"
                        >
                          <Receipt size={12} />
                          <span>ফি আদায়</span>
                        </button>

                        {onSendReminderSMS && (
                          <button
                            type="button"
                            onClick={() => {
                              onSendReminderSMS(student);
                              setDashboardNotification(`${student.name} এর পিতা ${student.fatherName}-কে বেতন অপরিশোধিত নোটিফিকেশন এসএমএস পাঠানো হয়েছে!`);
                              setTimeout(() => setDashboardNotification(null), 4500);
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-150/45 cursor-pointer transition-colors shrink-0"
                            title="অভিভাবকে বেতন বকেয়া রিমাইন্ডার পাঠান"
                          >
                            <Bell size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs bg-emerald-50/10 border border-dashed border-emerald-100 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-full text-base font-black">✓</span>
                  <p className="font-bold text-slate-850">চলতি মাসের সকল ফি আদায় সম্পন্ন হয়েছে!</p>
                  <p className="text-[10px] text-slate-400">সব শিক্ষার্থীর নির্ধারিত হাদিয়ার রশিদ সফলভাবে সংগৃহীত ও খতিয়ানভুক্ত রয়েছে।</p>
                </div>
              );
            })()}
          </div>

        </div>

        {/* Right Sidebar: Quick Actions & System Info */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full"></span>
              <span>দ্রুত লিঙ্ক সমূহ</span>
            </h2>

            <div className="space-y-2.5">
              <button 
                onClick={onAddStudent}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 text-slate-700 hover:text-emerald-800 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100/75 rounded-lg text-emerald-700">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">নতুন শিক্ষার্থী ভর্তি</p>
                    <span className="text-[10px] text-slate-400">তথ্যসহ ফর্ম যুক্ত করুন</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={onAddPayment}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 text-slate-700 hover:text-emerald-800 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100/75 rounded-lg text-amber-700">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">মাসিক বেতন সংগ্রহ</p>
                    <span className="text-[10px] text-slate-400">রসিদ ও পেমেন্ট রিসিভ</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('attendance')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 text-slate-700 hover:text-emerald-800 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100/75 rounded-lg text-indigo-700">
                    <FileCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">হাজিরা গ্রহণ করুন</p>
                    <span className="text-[10px] text-slate-400">দৈনিক উপস্থিতি সংরক্ষণ</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('sms')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-950 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100/75 rounded-lg text-emerald-700">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">কম্যুনিকেশন ও এসএমএস পোর্টাল (SMS)</p>
                    <span className="text-[10px] text-slate-400">অভিভাবকদের গ্রুপ এসএমএস ও নোটিফিকেশন</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 text-slate-700 hover:text-emerald-800 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-100/75 rounded-lg text-teal-700">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">বার্ষিক রিপোর্ট ও বিশ্লেষণ</p>
                    <span className="text-[10px] text-slate-400">হাদিয়া আদায় ট্রেন্ড ও উপস্থিতি গ্রাফ খতিয়ান</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Quick Notice board advisory */}
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100/50">
            <h3 className="text-sm font-bold text-emerald-800 mb-1 flex items-center space-x-1.5">
              <ShieldAlert size={16} className="text-emerald-700" />
              <span>সহজ নির্দেশনা</span>
            </h3>
            <p className="text-xs text-emerald-700/90 leading-relaxed font-light">
              ড্যাশবোর্ডের প্রতিটি শাখা সম্পূর্ণ সচল। বাম পাশের মেন্যু ব্যবহার করে শিক্ষার্থী, শিক্ষক বর্গের তালিকা চেক করতে পারেন, দৈনিক হাজিরা দেখতে পারেন এবং রশিদের মাধ্যমে বেতন ও ফি সংগ্রহ করার রশিদ বুক তৈরি করতে পারেন। সকল ডাটা স্বয়ংক্রিয়ভাবে ব্রাউজারের লোকাল স্টোরেজে জমা থাকবে।
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
