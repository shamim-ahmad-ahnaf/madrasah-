import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, MadrasahClass, isClassMatch } from '../types';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  X, 
  Printer, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Layers, 
  UserCheck, 
  UserX, 
  FileText,
  Clock
} from 'lucide-react';

interface AttendanceDailyReportProps {
  students: Student[];
  attendance: AttendanceRecord[];
  reportDate: string;
  reportClass: MadrasahClass | 'সকল';
  onDateChange: (date: string) => void;
  onClassChange: (cls: MadrasahClass | 'সকল') => void;
  onGoToTakeAttendance: (date: string, cls: MadrasahClass) => void;
  madrasahName?: string;
  madrasahSlogan?: string;
}

export const convertToBanglaNumber = (num: number | string): string => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return (num ?? '').toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
};

export const banglaMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const formatBengaliDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = banglaMonths[monthIdx] || parts[1];
  return `${convertToBanglaNumber(day)} ${monthName} ${convertToBanglaNumber(year)}`;
};

export const getBengaliDayName = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  return days[d.getDay()] || '';
};

export default function AttendanceDailyReport({
  students,
  attendance,
  reportDate,
  reportClass,
  onDateChange,
  onClassChange,
  onGoToTakeAttendance,
  madrasahName = 'মারকাযুল কুরআন আল ইসলামিয়া মাদরাসা',
  madrasahSlogan = 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং'
}: AttendanceDailyReportProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'উপস্থিত' | 'অনুপস্থিত'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Available classes list
  const availableClasses = useMemo(() => {
    const defaultClasses: MadrasahClass[] = ['নূরানী', 'নাজেরা', 'হিফজ', 'কিতাব বিভাগ', 'জেনারেল'];
    const fromStudents = Array.from(new Set(students.map(s => s.gradeClass).filter(Boolean)));
    return Array.from(new Set([...defaultClasses, ...fromStudents]));
  }, [students]);

  // Quick date navigation
  const shiftDate = (days: number) => {
    const d = new Date(reportDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      onDateChange(d.toISOString().split('T')[0]);
    }
  };

  const setDateToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const setDateYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Process attendance for this specific date and class
  const reportData = useMemo(() => {
    // 1. Target students according to class filter
    const targetStudents = reportClass === 'সকল'
      ? students
      : students.filter(s => isClassMatch(s.gradeClass, reportClass));

    // 2. Attendance records for reportDate
    const dateRecords = attendance.filter(r => r.date === reportDate);
    const dateRecordMap = new Map<string, AttendanceRecord>();
    dateRecords.forEach(r => dateRecordMap.set(r.studentId, r));

    // Check which classes have saved records for reportDate
    const classesWithRecords = new Set(dateRecords.map(r => r.gradeClass));
    const isClassRecorded = (cls: string) => {
      return Array.from(classesWithRecords).some(recCls => isClassMatch(cls, recCls));
    };

    const hasAnySavedRecord = reportClass === 'সকল'
      ? dateRecords.length > 0
      : targetStudents.some(s => dateRecordMap.has(s.id));

    // 3. Map status for each student
    const studentItems = targetStudents.map(student => {
      const rec = dateRecordMap.get(student.id);
      let status: 'উপস্থিত' | 'অনুপস্থিত' | 'অনির্ধারিত' = 'অনির্ধারিত';
      if (rec) {
        status = rec.status;
      } else if (isClassRecorded(student.gradeClass)) {
        status = 'অনুপস্থিত';
      }

      return {
        student,
        status,
        record: rec || null
      };
    });

    // Counts & rates
    const totalCount = studentItems.length;
    const presentCount = studentItems.filter(i => i.status === 'উপস্থিত').length;
    const absentCount = studentItems.filter(i => i.status === 'অনুপস্থিত').length;
    const unrecordedCount = studentItems.filter(i => i.status === 'অনির্ধারিত').length;
    const recordedTotal = presentCount + absentCount;
    const presentRate = recordedTotal > 0
      ? Math.round((presentCount / recordedTotal) * 100)
      : (totalCount > 0 && presentCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0);

    // Apply status filter
    let filtered = studentItems;
    if (statusFilter === 'উপস্থিত') {
      filtered = filtered.filter(i => i.status === 'উপস্থিত');
    } else if (statusFilter === 'অনুপস্থিত') {
      filtered = filtered.filter(i => i.status === 'অনুপস্থিত');
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.student.name.toLowerCase().includes(q) ||
        item.student.roll.toString().includes(q) ||
        item.student.gradeClass.toLowerCase().includes(q) ||
        (item.student.fatherName && item.student.fatherName.toLowerCase().includes(q)) ||
        (item.student.phone && item.student.phone.includes(q))
      );
    }

    // Sort by class then roll
    filtered.sort((a, b) => {
      if (a.student.gradeClass !== b.student.gradeClass) {
        return a.student.gradeClass.localeCompare(b.student.gradeClass);
      }
      return a.student.roll - b.student.roll;
    });

    // Class-by-class summary breakdown
    const classBreakdown = availableClasses.map(cls => {
      const clsStudents = students.filter(s => isClassMatch(s.gradeClass, cls));
      const clsItems = clsStudents.map(s => {
        const rec = dateRecordMap.get(s.id);
        const status = rec ? rec.status : (isClassRecorded(s.gradeClass) ? 'অনুপস্থিত' : 'অনির্ধারিত');
        return { status };
      });
      const clsTotal = clsStudents.length;
      const clsPresent = clsItems.filter(i => i.status === 'উপস্থিত').length;
      const clsAbsent = clsItems.filter(i => i.status === 'অনুপস্থিত').length;
      const clsSaved = isClassRecorded(cls);
      const clsRate = clsTotal > 0 ? Math.round((clsPresent / clsTotal) * 100) : 0;

      return {
        className: cls,
        total: clsTotal,
        present: clsPresent,
        absent: clsAbsent,
        rate: clsRate,
        isSaved: clsSaved
      };
    });

    return {
      totalCount,
      presentCount,
      absentCount,
      unrecordedCount,
      presentRate,
      hasAnySavedRecord,
      studentItems: filtered,
      allStudentItems: studentItems,
      classBreakdown
    };
  }, [students, attendance, reportDate, reportClass, statusFilter, searchQuery, availableClasses]);

  const handlePrint = () => {
    const printable = document.getElementById('daily-attendance-report-print')?.innerHTML;
    if (printable) {
      const original = document.body.innerHTML;
      document.body.innerHTML = printable;
      window.print();
      document.body.innerHTML = original;
      window.location.reload();
    }
  };

  const isToday = reportDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Filter & Control Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        
        {/* Header with Title and Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center space-x-2">
              <FileText className="text-emerald-700" size={18} />
              <span>দৈনিক ছাত্র হাজিরা রিপোর্ট ও ফিল্টার</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              তারিখ এবং নির্দিষ্ট শ্রেণী নির্বাচন করে শুধুমাত্র সেই দিনের হাজিরার সার্বিক রিপোর্ট দেখুন বা প্রিন্ট করুন।
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              title="এই দিনের রিপোর্ট প্রিন্ট বা পিডিএফ করুন"
            >
              <Printer size={14} />
              <span>রিপোর্ট প্রিন্ট</span>
            </button>

            <button
              onClick={() => {
                const targetCls = reportClass === 'সকল' ? 'হিফজ' : reportClass;
                onGoToTakeAttendance(reportDate, targetCls as MadrasahClass);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              title="এই তারিখের হাজিরা গ্রহণ করতে যান"
            >
              <Edit3 size={13} />
              <span>হাজিরা এডিট</span>
            </button>
          </div>
        </div>

        {/* Primary Controls: Date Selector and Specific Class Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          
          {/* 1. Date Selector with Shortcuts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <CalendarDays size={14} className="text-emerald-700" />
                <span>তারিখ নির্বাচন</span>
              </label>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={setDateToday}
                  className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    isToday
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  আজ
                </button>
                <button
                  type="button"
                  onClick={setDateYesterday}
                  className="text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  গতকাল
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 cursor-pointer transition-colors"
                title="পূর্ববর্তী দিন"
              >
                <ChevronLeft size={14} />
              </button>

              <input
                type="date"
                value={reportDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="flex-1 text-xs font-bold font-mono bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-slate-700 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
              />

              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 cursor-pointer transition-colors"
                title="পরবর্তী দিন"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="text-[11px] text-emerald-800 font-semibold px-1 flex items-center justify-between">
              <span>{formatBengaliDate(reportDate)}</span>
              <span className="text-slate-500 font-medium">{getBengaliDayName(reportDate)}</span>
            </div>
          </div>

          {/* 2. Specific Class Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Filter size={14} className="text-emerald-700" />
              <span>নির্দিষ্ট শ্রেণী / বিভাগ নির্বাচন</span>
            </label>

            <select
              value={reportClass}
              onChange={(e) => onClassChange(e.target.value as MadrasahClass | 'সকল')}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3.5 text-slate-700 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
            >
              <option value="সকল">সকল শ্রেণী / বিভাগ (মাদরাসা সার্বিক)</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls} বিভাগ</option>
              ))}
            </select>

            <div className="text-[11px] text-slate-500 px-1 flex items-center justify-between">
              <span>
                {reportClass === 'সকল' 
                  ? 'সকল বিভাগের মোট শিক্ষার্থী' 
                  : `${reportClass} বিভাগের উপস্থিতি`}
              </span>
              <span className="font-semibold text-slate-600">
                {convertToBanglaNumber(reportData.totalCount)} জন তালিকাভুক্ত
              </span>
            </div>
          </div>

        </div>

        {/* Secondary Filter Strip: Attendance Status Filter & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Status Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              সকল ({convertToBanglaNumber(reportData.totalCount)})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('উপস্থিত')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'উপস্থিত'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <UserCheck size={13} />
              <span>উপস্থিত ({convertToBanglaNumber(reportData.presentCount)})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('অনুপস্থিত')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'অনুপস্থিত'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <UserX size={13} />
              <span>অনুপস্থিত ({convertToBanglaNumber(reportData.absentCount)})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="ছাত্রের নাম, রোল বা পিতা দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-7 py-2 outline-none focus:border-emerald-600 focus:bg-white text-slate-700 transition-all font-sans"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">মোট তালিকাভুক্ত</span>
          <span className="text-xl font-extrabold text-slate-800 font-mono mt-0.5 block">
            {convertToBanglaNumber(reportData.totalCount)} <span className="text-xs font-normal text-slate-400">জন</span>
          </span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 block">উপস্থিত শিক্ষার্থী</span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
              {convertToBanglaNumber(reportData.presentRate)}%
            </span>
          </div>
          <span className="text-xl font-extrabold text-emerald-800 font-mono mt-0.5 block">
            {convertToBanglaNumber(reportData.presentCount)} <span className="text-xs font-normal text-emerald-700">জন</span>
          </span>
        </div>

        <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-800 block">অনুপস্থিত শিক্ষার্থী</span>
            <span className="text-[10px] font-bold bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-mono">
              {convertToBanglaNumber(100 - reportData.presentRate)}%
            </span>
          </div>
          <span className="text-xl font-extrabold text-red-700 font-mono mt-0.5 block">
            {convertToBanglaNumber(reportData.absentCount)} <span className="text-xs font-normal text-red-600">জন</span>
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 block">হাজিরার স্থিতি</span>
          {reportData.hasAnySavedRecord ? (
            <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-bold">
              <CheckCircle size={14} className="text-emerald-600" />
              <span>সংরক্ষিত</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-amber-600 text-xs font-bold">
              <AlertCircle size={14} className="text-amber-500" />
              <span>গৃহীত হয়নি</span>
            </div>
          )}
        </div>
      </div>

      {/* When 'সকল শ্রেণী' is selected: Class-by-Class Breakdown Cards */}
      {reportClass === 'সকল' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center space-x-1.5">
            <Layers size={14} className="text-emerald-700" />
            <span>বিভাগভিত্তিক হাজিরার সারসংক্ষেপ ({formatBengaliDate(reportDate)})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {reportData.classBreakdown.map(item => (
              <button
                key={item.className}
                onClick={() => onClassChange(item.className as MadrasahClass)}
                className="text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer bg-slate-50/50 group"
                title={`${item.className} বিভাগের একক রিপোর্ট দেখুন`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-800">{item.className} বিভাগ</span>
                  <span className="text-[10px] font-bold bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                    {convertToBanglaNumber(item.rate)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>মোট: {convertToBanglaNumber(item.total)} জন</span>
                  <span className="text-emerald-700 font-semibold">{convertToBanglaNumber(item.present)} উপস্থিত</span>
                  <span className="text-red-600 font-semibold">{convertToBanglaNumber(item.absent)} অনুপস্থিত</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Student Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Table Title Bar */}
        <div className="bg-emerald-800/5 p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div>
            <span className="font-bold text-slate-800 font-sans">
              {reportClass === 'সকল' ? 'সকল বিভাগের' : `${reportClass} বিভাগের`} হাজিরার বিস্তারিত প্রতিবেদন
            </span>
            <span className="text-slate-500 text-[11px] block mt-0.5">
              তারিখ: {formatBengaliDate(reportDate)} ({getBengaliDayName(reportDate)}) • মোট {convertToBanglaNumber(reportData.studentItems.length)} জন শিক্ষার্থী প্রদর্শিত
            </span>
          </div>

          {!reportData.hasAnySavedRecord && (
            <button
              onClick={() => {
                const targetCls = reportClass === 'সকল' ? 'হিফজ' : reportClass;
                onGoToTakeAttendance(reportDate, targetCls as MadrasahClass);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl transition-all text-xs flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <Edit3 size={13} />
              <span>এখনই হাজিরা গ্রহণ করুন</span>
            </button>
          )}
        </div>

        {reportData.studentItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-[11px] font-bold">
                <tr>
                  <th className="py-2.5 px-4">রোল</th>
                  <th className="py-2.5 px-4">শিক্ষার্থীর নাম</th>
                  <th className="py-2.5 px-4">বিভাগ / শ্রেণী</th>
                  <th className="py-2.5 px-4">পিতার নাম ও অভিভাবকের ফোন</th>
                  <th className="py-2.5 px-4 text-center">আজকের অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reportData.studentItems.map(({ student, status }) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                        {convertToBanglaNumber(student.roll)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div>{student.name}</div>
                      {student.isResidential && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-medium inline-block mt-0.5">
                          আবাসিক
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">
                      {student.gradeClass}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div className="text-[11px] text-slate-700 font-medium">{student.fatherName || 'উল্লেখ নেই'}</div>
                      {student.phone && (
                        <a href={`tel:${student.phone}`} className="text-[10px] text-emerald-700 hover:underline flex items-center space-x-1 mt-0.5">
                          <Phone size={10} />
                          <span>{student.phone}</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {status === 'উপস্থিত' ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle size={12} className="text-emerald-600" />
                          <span>উপস্থিত</span>
                        </span>
                      ) : status === 'অনুপস্থিত' ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                          <AlertCircle size={12} className="text-red-600" />
                          <span>অনুপস্থিত</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <span>রেকর্ড নেই</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-xs font-medium">নির্বাচিত তারিখ বা শ্রেণীর জন্য কোনো শিক্ষার্থীর তথ্য মেলেনি।</p>
          </div>
        )}

      </div>

      {/* Official Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6">
            
            {/* Modal Actions Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer size={16} className="text-emerald-700" />
                <span className="font-bold text-slate-800 text-sm">হাজিরা রিপোর্ট প্রিন্ট প্রিভিউ</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>প্রিন্ট / পিডিএফ ডাউনলোড</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto" id="daily-attendance-report-print">
              
              {/* Institution Header */}
              <div className="text-center border-b-2 border-emerald-800/20 pb-4 space-y-1">
                <h1 className="text-xl font-black text-slate-900 font-sans tracking-wide">{madrasahName}</h1>
                <p className="text-xs text-slate-600 font-medium">{madrasahSlogan}</p>
                <div className="inline-block bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold px-4 py-1 rounded-full mt-2">
                  দৈনিক ছাত্র হাজিরা ও অনুপস্থিতি প্রতিবেদন
                </div>
              </div>

              {/* Report Meta Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">প্রতিবেদনের তারিখ:</span>
                  <strong className="text-slate-800 font-mono">{formatBengaliDate(reportDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">বার / দিবস:</span>
                  <strong className="text-slate-800">{getBengaliDayName(reportDate)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">নির্বাচিত বিভাগ:</span>
                  <strong className="text-slate-800">{reportClass === 'সকল' ? 'সকল বিভাগ' : `${reportClass} বিভাগ`}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">উপস্থিতির শতকরা হার:</span>
                  <strong className="text-emerald-700 font-bold font-mono">{convertToBanglaNumber(reportData.presentRate)}%</strong>
                </div>
              </div>

              {/* Stats Highlight Bar */}
              <div className="flex items-center justify-around bg-emerald-800/5 border border-emerald-800/15 p-2.5 rounded-xl text-xs font-semibold text-slate-700">
                <div>মোট ছাত্র: <strong className="font-mono text-slate-900">{convertToBanglaNumber(reportData.totalCount)}</strong> জন</div>
                <div>উপস্থিত: <strong className="font-mono text-emerald-800">{convertToBanglaNumber(reportData.presentCount)}</strong> জন</div>
                <div>অনুপস্থিত: <strong className="font-mono text-red-700">{convertToBanglaNumber(reportData.absentCount)}</strong> জন</div>
              </div>

              {/* Print Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-3 border-r border-slate-200 w-12 text-center">রোল</th>
                      <th className="py-2 px-3 border-r border-slate-200">শিক্ষার্থীর নাম</th>
                      <th className="py-2 px-3 border-r border-slate-200">শ্রেণী / বিভাগ</th>
                      <th className="py-2 px-3 border-r border-slate-200">পিতার নাম</th>
                      <th className="py-2 px-3 border-r border-slate-200">মোবাইল</th>
                      <th className="py-2 px-3 text-center w-24">হাজিরা অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.studentItems.map(({ student, status }, idx) => (
                      <tr key={student.id} className={`border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                        <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold">{convertToBanglaNumber(student.roll)}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{student.name}</td>
                        <td className="py-2 px-3 border-r border-slate-200">{student.gradeClass}</td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{student.fatherName || '-'}</td>
                        <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px]">{student.phone || '-'}</td>
                        <td className="py-2 px-3 text-center font-bold">
                          {status === 'উপস্থিত' ? (
                            <span className="text-emerald-700">উপস্থিত</span>
                          ) : status === 'অনুপস্থিত' ? (
                            <span className="text-red-600">অনুপস্থিত</span>
                          ) : (
                            <span className="text-slate-400">রেকর্ড নেই</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-12 flex justify-between items-end text-xs text-slate-600 font-medium">
                <div className="text-center">
                  <div className="w-36 border-t border-slate-400 pt-1">শ্রেণি শিক্ষকের স্বাক্ষর</div>
                </div>
                <div className="text-center">
                  <div className="w-36 border-t border-slate-400 pt-1">নাজেমে তালিমাত</div>
                </div>
                <div className="text-center">
                  <div className="w-40 border-t border-slate-400 pt-1">মুহতামিম সাহেবের স্বাক্ষর ও সিল</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-right pt-2 border-t border-slate-100">
                মুদ্রণ তারিখ ও সময়: {new Date().toLocaleString('bn-BD')}
              </div>

            </div>

            {/* Modal Bottom Close */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
