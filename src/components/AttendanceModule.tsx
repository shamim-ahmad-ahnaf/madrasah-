import React, { useState } from 'react';
import { Student, Teacher, AttendanceRecord, MadrasahClass } from '../types';
import { Calendar, Check, AlertCircle, CheckCircle, Search, RefreshCw, Layers, ChevronLeft, ChevronRight, CalendarDays, Clock, X } from 'lucide-react';

export interface TeacherAttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  teacherName: string;
  designation: string;
  status: 'উপস্থিত' | 'অনুপস্থিত' | 'ছুটি';
  signInTime: string; // e.g. "08:30"
  signOutTime: string; // e.g. "16:30"
}

interface AttendanceModuleProps {
  students: Student[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (records: Omit<AttendanceRecord, 'id'>[], sendSMS: boolean) => void;
}

export default function AttendanceModule({
  students,
  teachers,
  attendance,
  onSaveAttendance
}: AttendanceModuleProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [selectedClass, setSelectedClass] = useState<MadrasahClass>('হিফজ');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Local active roster state for students
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'উপস্থিত' | 'অনুপস্থিত'>>({});
  const [notification, setNotification] = useState<string | null>(null);
  const [sendSMS, setSendSMS] = useState<boolean>(true);

  // Teachers Attendance State & Seed Data
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendanceRecord[]>(() => {
    const stored = localStorage.getItem('madrasah_teacher_attendance');
    if (stored) {
      return JSON.parse(stored);
    } else {
      // Prepopulate mock teacher attendance records for today and yesterday
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const mockRecords: TeacherAttendanceRecord[] = [];
      const staffList = [
        { id: 't1', name: 'মুফতি শফীকুল ইসলাম', designation: 'মুহতামিম ও শায়খুল হাদীস' },
        { id: 't2', name: 'maulانہ আব্দুর রহমান', designation: 'প্রধান হিফজ শিক্ষক' },
        { id: 't3', name: 'ক্বারী উসমান গণী', designation: 'তাজবিদ শিক্ষক' },
        { id: 't4', name: 'হাফেজ সাঈদ আহমদ', designation: 'সহকারী শিক্ষক' }
      ];

      // Yesterday records
      staffList.forEach((t, i) => {
        mockRecords.push({
          id: `t-att-yesterday-${t.id}`,
          date: yesterdayStr,
          teacherId: t.id,
          teacherName: t.name,
          designation: t.designation,
          status: i === 3 ? 'ছুটি' : 'উপস্থিত',
          signInTime: i === 3 ? '' : '08:15',
          signOutTime: i === 3 ? '' : '16:30'
        });
      });

      // Today records
      staffList.forEach((t, i) => {
        mockRecords.push({
          id: `t-att-today-${t.id}`,
          date: todayStr,
          teacherId: t.id,
          teacherName: t.name,
          designation: t.designation,
          status: i === 2 ? 'অনুপস্থিত' : 'উপস্থিত',
          signInTime: i === 2 ? '' : '08:20',
          signOutTime: i === 2 ? '' : '16:45'
        });
      });

      localStorage.setItem('madrasah_teacher_attendance', JSON.stringify(mockRecords));
      return mockRecords;
    }
  });

  // Local state for current date teachers attendance editing
  const [localTeacherAttendance, setLocalTeacherAttendance] = useState<Record<string, {
    status: 'উপস্থিত' | 'অনুপস্থিত' | 'ছুটি';
    signInTime: string;
    signOutTime: string;
  }>>({});

  // Bengali localization utilities
  const convertToBanglaNumber = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
  };

  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  // Calendar State: initially matching selectedDate
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    const parsed = Date.parse(selectedDate);
    return isNaN(parsed) ? new Date() : new Date(parsed);
  });

  // Keep calendar viewed month in sync when selectedDate gets updated by date input
  React.useEffect(() => {
    const parsed = Date.parse(selectedDate);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      setCalendarDate(d);
    }
  }, [selectedDate]);

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  // Days in calendarMonth
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  // Index of first day of the week (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();

  // Days array for rendering 7x5 or 7x6 grid
  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push(d);
  }

  // Helper to obtain attendance overview for any day in standard format
  const getDayAttendanceSummary = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (activeTab === 'students') {
      const records = attendance.filter(r => r.date === dateStr);
      if (records.length === 0) return null;
      const present = records.filter(r => r.status === 'উপস্থিত').length;
      const rate = Math.round((present / records.length) * 100);
      return { present, total: records.length, rate };
    } else {
      const records = teacherAttendance.filter(r => r.date === dateStr);
      if (records.length === 0) return null;
      const present = records.filter(r => r.status === 'উপস্থিত').length;
      const rate = Math.round((present / records.length) * 100);
      return { present, total: records.length, rate };
    }
  };

  const handlePrevMonth = () => {
    setCalendarDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    setCalendarDate(today);
  };

  // Load or generate initial state for students when Class or Date changes
  React.useEffect(() => {
    const classStudents = students.filter(s => s.gradeClass === selectedClass);
    
    // Check if there are already existing records in system for this date/class
    const existingRecords = attendance.filter(r => r.date === selectedDate && r.gradeClass === selectedClass);
    
    const initialPresenceState: Record<string, 'উপস্থিত' | 'অনুপস্থিত'> = {};
    
    classStudents.forEach(student => {
      initialPresenceState[student.id] = 'উপস্থিত'; // Default
    });

    existingRecords.forEach(match => {
      initialPresenceState[match.studentId] = match.status;
    });
    
    setLocalAttendance(initialPresenceState);
  }, [selectedClass, selectedDate, students, attendance]);

  // Load or generate initial state for teachers when selectedDate changes
  React.useEffect(() => {
    const existingRecords = teacherAttendance.filter(r => r.date === selectedDate);
    const initialTeachersState: Record<string, {
      status: 'উপস্থিত' | 'অনুপস্থিত' | 'ছুটি';
      signInTime: string;
      signOutTime: string;
    }> = {};

    teachers.forEach(teacher => {
      const match = existingRecords.find(r => r.teacherId === teacher.id);
      if (match) {
        initialTeachersState[teacher.id] = {
          status: match.status,
          signInTime: match.signInTime || '',
          signOutTime: match.signOutTime || ''
        };
      } else {
        initialTeachersState[teacher.id] = {
          status: 'উপস্থিত',
          signInTime: '08:30',
          signOutTime: '16:30'
        };
      }
    });

    setLocalTeacherAttendance(initialTeachersState);
  }, [selectedDate, teachers, teacherAttendance]);

  const classStudents = students.filter(s => s.gradeClass === selectedClass);

  // Student action helpers
  const toggleAttendance = (studentId: string) => {
    setLocalAttendance(prev => {
      const current = prev[studentId] || 'উপস্থিত';
      const next: 'উপস্থিত' | 'অনুপস্থিত' = current === 'উপস্থিত' ? 'অনুপস্থিত' : 'উপস্থিত';
      return { ...prev, [studentId]: next };
    });
  };

  const handleAllPresent = () => {
    const nextState: Record<string, 'উপস্থিত' | 'অনুপস্থিত'> = {};
    classStudents.forEach(s => {
      nextState[s.id] = 'উপস্থিত';
    });
    setLocalAttendance(nextState);
  };

  const handleAllAbsent = () => {
    const nextState: Record<string, 'উপস্থিত' | 'অনুপস্থিত'> = {};
    classStudents.forEach(s => {
      nextState[s.id] = 'অনুপস্থিত';
    });
    setLocalAttendance(nextState);
  };

  const handleSave = () => {
    if (classStudents.length === 0) {
      alert('সংশ্লিষ্ট বিভাগে কোনো শিক্ষার্থী নেই।');
      return;
    }

    const recordsToSave = classStudents.map(student => ({
      date: selectedDate,
      studentId: student.id,
      studentName: student.name,
      roll: student.roll,
      gradeClass: selectedClass,
      status: localAttendance[student.id] || 'উপস্থিত'
    }));

    onSaveAttendance(recordsToSave, sendSMS);
    setNotification('আজকের হাজিরা সফলভাবে সংরক্ষিত হয়েছে এবং অভিভাবকদের মোবাইলে প্রেরিত হয়েছে!');
    setTimeout(() => setNotification(null), 4050);
  };

  // Student stats
  const totalInClass = classStudents.length;
  const presentCount = classStudents.filter(s => (localAttendance[s.id] || 'উপস্থিত') === 'উপস্থিত').length;
  const absentCount = totalInClass - presentCount;
  const presentRate = totalInClass > 0 ? Math.round((presentCount / totalInClass) * 100) : 0;

  // Teacher action helpers
  const updateTeacherStatus = (teacherId: string, status: 'উপস্থিত' | 'অনুপস্থিত' | 'ছুটি') => {
    setLocalTeacherAttendance(prev => {
      const current = prev[teacherId] || { status: 'উপস্থিত', signInTime: '08:30', signOutTime: '16:30' };
      return { 
        ...prev, 
        [teacherId]: { 
          ...current, 
          status,
          signInTime: status === 'অনুপস্থিত' ? '' : (current.signInTime || '08:30'),
          signOutTime: status === 'অনুপস্থিত' ? '' : (current.signOutTime || '16:30')
        } 
      };
    });
  };

  const updateTeacherTimes = (teacherId: string, key: 'signInTime' | 'signOutTime', value: string) => {
    setLocalTeacherAttendance(prev => {
      const current = prev[teacherId] || { status: 'উপস্থিত', signInTime: '08:30', signOutTime: '16:30' };
      return { 
        ...prev, 
        [teacherId]: { ...current, [key]: value } 
      };
    });
  };

  const handleAllTeachersPresent = () => {
    const nextState: Record<string, { status: 'উপস্থিত' | 'অনুপস্থিত' | 'ছুটি'; signInTime: string; signOutTime: string }> = {};
    teachers.forEach(t => {
      nextState[t.id] = {
        status: 'উপস্থিত',
        signInTime: '08:30',
        signOutTime: '16:30'
      };
    });
    setLocalTeacherAttendance(nextState);
  };

  const handleAllTeachersLeave = () => {
    const nextState: Record<string, { status: 'উপস্থিত' | 'অনুপস্থিত' | 'ছুটি'; signInTime: string; signOutTime: string }> = {};
    teachers.forEach(t => {
      nextState[t.id] = {
        status: 'ছুটি',
        signInTime: '',
        signOutTime: ''
      };
    });
    setLocalTeacherAttendance(nextState);
  };

  const handleSaveTeachers = () => {
    if (teachers.length === 0) {
      alert('সংশ্লিষ্ট কোনো শিক্ষক বা স্টাফ সদস্য যুক্ত নেই।');
      return;
    }

    const recordsToSave: TeacherAttendanceRecord[] = teachers.map(teacher => {
      const entry = localTeacherAttendance[teacher.id] || { status: 'উপস্থিত', signInTime: '08:30', signOutTime: '16:30' };
      return {
        id: 'tc-att-' + Math.random().toString(36).substr(2, 9),
        date: selectedDate,
        teacherId: teacher.id,
        teacherName: teacher.name,
        designation: teacher.designation,
        status: entry.status,
        signInTime: entry.signInTime,
        signOutTime: entry.signOutTime
      };
    });

    // Remove old records for this date and merge
    const updatedTeacherAttendance = [
      ...recordsToSave,
      ...teacherAttendance.filter(r => r.date !== selectedDate)
    ];

    setTeacherAttendance(updatedTeacherAttendance);
    localStorage.setItem('madrasah_teacher_attendance', JSON.stringify(updatedTeacherAttendance));

    setNotification('উস্তাদ ও হাফেজদের কাজের হাজিরা এবং প্রস্থান-প্রবেশ সময় সফলভাবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setNotification(null), 4000);
  };

  // Teachers Stats
  const totalTeachersCount = teachers.length;
  const teachersPresentCount = teachers.filter(t => (localTeacherAttendance[t.id]?.status || 'উপস্থিত') === 'উপস্থিত').length;
  const teachersLeaveCount = teachers.filter(t => (localTeacherAttendance[t.id]?.status || 'উপস্থিত') === 'ছুটি').length;
  const teachersAbsentCount = totalTeachersCount - teachersPresentCount - teachersLeaveCount;
  const teachersPresentRate = totalTeachersCount > 0 ? Math.round((teachersPresentCount / totalTeachersCount) * 100) : 0;

  // Student past logs
  const pastRecordsGrouped = attendance.reduce((acc, current) => {
    const key = `${current.date} | ${current.gradeClass}`;
    if (!acc[key]) {
      acc[key] = { date: current.date, class: current.gradeClass, present: 0, total: 0 };
    }
    const target = acc[key];
    target.total += 1;
    if (current.status === 'উপস্থিত') {
      target.present += 1;
    }
    return acc;
  }, {} as Record<string, { date: string, class: MadrasahClass, present: number, total: number }>);

  const pastRecordsList = (Object.values(pastRecordsGrouped) as { date: string, class: MadrasahClass, present: number, total: number }[])
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Teachers past logs
  interface HistoryLog {
    date: string;
    present: number;
    total: number;
  }
  const pastTeacherRecordsGrouped = teacherAttendance.reduce((acc: Record<string, HistoryLog>, current: TeacherAttendanceRecord) => {
    const key = current.date;
    if (!acc[key]) {
      acc[key] = { date: current.date, present: 0, total: 0 };
    }
    const target = acc[key];
    target.total += 1;
    if (current.status === 'উপস্থিত') {
      target.present += 1;
    }
    return acc;
  }, {} as Record<string, HistoryLog>);

  const pastTeacherRecordsList = (Object.values(pastTeacherRecordsGrouped) as HistoryLog[])
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:max-w-md shadow-2xs border border-slate-200/50 animate-fade-in">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 text-center font-bold text-xs py-2.5 px-4 rounded-lg transition-all cursor-pointer select-none ${
              activeTab === 'students'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            ছাত্রদের হাজিরা খাতা
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 text-center font-bold text-xs py-2.5 px-4 rounded-lg transition-all cursor-pointer select-none ${
              activeTab === 'teachers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            উস্তাদ ও হাফেজ হাজিরা (স্টাফ)
          </button>
        </div>
        
        {notification && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl flex items-center space-x-2 text-xs font-semibold animate-fade-in shrink-0 shadow-2xs">
            <CheckCircle size={14} className="text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}
      </div>

      {/* Roster Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        {activeTab === 'students' ? (
          <>
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center space-x-2">
              <CalendarDays className="text-emerald-700" size={18} />
              <span>ছাত্রদের দৈনিক হাজিরা খাতা (Student Attendance)</span>
            </h2>
            <p className="text-xs text-slate-400">শ্রেণিভিত্তিক বা দৈনিক তারিখ নির্বাচন করে ছাত্রদের হাজিরা ও অনুপস্থিতি ট্র্যাক করুন।</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center space-x-2">
              <Clock className="text-emerald-700" size={18} />
              <span>উস্তাদ ও স্টাফ শিফট এবং হাজিরা খাতা (Staff Duty Log)</span>
            </h2>
            <p className="text-xs text-slate-400">মাদ্রাসার সমস্ত উস্তাদ, মুফতি ও স্টাফ সদস্যদের আগমন (Sign-in), প্রস্থান (Sign-out) সময় ও হাজিরা ট্র্যাক করুন।</p>
          </>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          {/* Choose Class / Staff Label */}
          {activeTab === 'students' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">শ্রেণী / বিভাগ নির্ধারণ</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as MadrasahClass)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-600"
              >
                <option value="নূরানী">নূরানী বিভাগ</option>
                <option value="নাজেরা">নাজেরা বিভাগ</option>
                <option value="হিফজ">হিফজ বিভাগ</option>
                <option value="কিতাব বিভাগ">কিতাব বিভাগ</option>
                <option value="জেনারেল">জেনারেল বিভাগ</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">স্টাফ ক্যাটাগরি</label>
              <div className="w-full text-xs font-bold bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-slate-500 flex items-center space-x-2 cursor-not-allowed">
                <span>মাদ্রাসার সকল শিক্ষক ও কর্মচারী ({convertToBanglaNumber(teachers.length)} জন)</span>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">হাজিরার তারিখ</label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-600 font-mono"
            />
          </div>

          {/* Real-time Counter status badge inside filter */}
          {activeTab === 'students' ? (
            <div className="flex items-end justify-between border border-emerald-100/50 bg-emerald-50/35 p-2.5 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-500 block">উপস্থিতি পার্সেন্টেজ</span>
                <span className="text-xl font-extrabold text-emerald-800 font-mono">{convertToBanglaNumber(presentRate)}%</span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-600 font-bold block">{convertToBanglaNumber(presentCount)} / {convertToBanglaNumber(totalInClass)} উপস্থিত</span>
                <span className="text-red-600 text-[10px] block font-semibold">{convertToBanglaNumber(absentCount)} অনুপস্থিত</span>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between border border-teal-100/50 bg-teal-50/35 p-2.5 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-500 block">কর্ম দিবস উপস্থিতি</span>
                <span className="text-xl font-extrabold text-teal-800 font-mono">{convertToBanglaNumber(teachersPresentRate)}%</span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-600 font-bold block">{convertToBanglaNumber(teachersPresentCount)} / {convertToBanglaNumber(totalTeachersCount)} উপস্থিত</span>
                <span className="text-amber-600 text-[10px] block font-semibold">{convertToBanglaNumber(teachersLeaveCount)} জন ছুটি • {convertToBanglaNumber(teachersAbsentCount)} অনুপস্থিত</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Roster Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Checklist */}
        <div className="lg:col-span-2 space-y-4 animate-fade-in">
          
          {activeTab === 'students' ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-emerald-800/5 p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800 font-sans">{selectedClass} বিভাগ আর হাযিরার তালিকা</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">রোল নাম্বার অনুসারে সাজানো</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleAllPresent} 
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg transition-colors border border-emerald-100 cursor-pointer text-[11px]"
                  >
                    সবাই উপস্থিত
                  </button>
                  <button 
                    onClick={handleAllAbsent}
                    className="bg-red-50 hover:bg-red-100 text-red-800 font-semibold px-2.5 py-1 rounded-lg transition-colors border border-red-100 cursor-pointer text-[11px]"
                  >
                    সবাই অনুপস্থিত
                  </button>
                </div>
              </div>

              {classStudents.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {classStudents.sort((a,b)=>a.roll-b.roll).map((student) => {
                    const status = localAttendance[student.id] || 'উপস্থিত';
                    const isPresent = status === 'উপস্থিত';
                    
                    return (
                      <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50/55 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold font-mono text-xs flex items-center justify-center">
                            {convertToBanglaNumber(student.roll)}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-none">{student.name}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">পিতা: {student.fatherName} • মোবাইল: {student.phone}</span>
                          </div>
                        </div>

                        {/* Attend Button Toggle */}
                        <button 
                          onClick={() => toggleAttendance(student.id)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold font-sans transition-all flex items-center space-x-1.5 shadow-xs border cursor-pointer select-none ${
                            isPresent 
                              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' 
                              : 'bg-red-50 text-red-800 border-red-100 hover:bg-red-100'
                          }`}
                        >
                          <Check size={12} className={isPresent ? 'opacity-100' : 'opacity-0'} />
                          <span>{isPresent ? 'উপস্থিত' : 'অনুপস্থিত'}</span>
                        </button>
                      </div>
                    );
                  })}

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={sendSMS}
                        onChange={(e) => setSendSMS(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4.5 h-4.5 cursor-pointer accent-emerald-600"
                      />
                      <span>অনুপস্থিতি/উপস্থিতি সম্পর্কে অভিভাবকদের মোবাইলে নিশ্চিতকরণ এসএমএস (SMS Alert) পাঠান</span>
                    </label>
                    <button 
                      onClick={handleSave}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      হাজিরা সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle className="mx-auto text-slate-300 mb-2" size={36} />
                  <p className="text-xs font-medium">এই বিভাগে এখনো কোনো শিক্ষার্থী যুক্ত করা হয়নি।</p>
                </div>
              )}
            </div>
          ) : (
            // TEACHERS ATTENDANCE ROSTER PANEL
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-emerald-800/5 p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-800 font-sans">সকল উস্তাদ ও হাফেজদের নামের তালিকা</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">পদবী ও প্রাত্যহিক কার্য দিবস হাজিরা</span>
                </div>
                
                <div className="flex items-center space-x-2 font-semibold font-sans">
                  <button 
                    onClick={handleAllTeachersPresent} 
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg transition-colors border border-emerald-100 cursor-pointer text-[11px]"
                  >
                    সবাইকে উপস্থিত ধরুন
                  </button>
                  <button 
                    onClick={handleAllTeachersLeave}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg transition-colors border border-amber-100 cursor-pointer text-[11px]"
                  >
                    সবাই ছুটিতে
                  </button>
                </div>
              </div>

              {teachers.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {teachers.map((teacher, idx) => {
                    const entry = localTeacherAttendance[teacher.id] || { status: 'উপস্থিত', signInTime: '08:30', signOutTime: '16:30' };
                    const status = entry.status;
                    const isPresent = status === 'উপস্থিত';
                    const isLeave = status === 'ছুটি';
                    const isAbsent = status === 'অনুপস্থিত';

                    return (
                      <div key={teacher.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/55 transition-colors">
                        
                        {/* Title, avatar & details */}
                        <div className="flex items-center space-x-3">
                          <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 font-sans">
                            {convertToBanglaNumber(idx + 1)}
                          </span>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 leading-tight">{teacher.name}</p>
                            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">{teacher.designation}</p>
                            <span className="text-[9px] text-slate-400 block">বিষয়: {teacher.subject} • মোবা: {teacher.phone}</span>
                          </div>
                        </div>

                        {/* Attendance State Actions & Input Times */}
                        <div className="flex flex-wrap items-center gap-4">
                          
                          {/* Attendance Status Selector Buttons */}
                          <div className="flex bg-slate-50 border border-slate-100 p-0.5 rounded-lg font-sans">
                            <button
                              onClick={() => updateTeacherStatus(teacher.id, 'উপস্থিত')}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                isPresent 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'text-slate-600 hover:text-slate-800'
                              }`}
                            >
                              উপস্থিত
                            </button>
                            <button
                              onClick={() => updateTeacherStatus(teacher.id, 'ছুটি')}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                isLeave 
                                  ? 'bg-amber-500 text-white shadow-xs' 
                                  : 'text-slate-600 hover:text-slate-800'
                              }`}
                            >
                              ছুটি
                            </button>
                            <button
                              onClick={() => updateTeacherStatus(teacher.id, 'অনুপস্থিত')}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                isAbsent 
                                  ? 'bg-red-500 text-white shadow-xs' 
                                  : 'text-slate-600 hover:text-slate-800'
                              }`}
                            >
                              অনুপস্থিত
                            </button>
                          </div>

                          {/* Shift checkin checkout time inputs (only enabled if present/leave) */}
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-slate-400 font-bold block mb-0.5">প্রবেশ সময়</span>
                              <input 
                                type="time"
                                disabled={isAbsent}
                                value={entry.signInTime || ''}
                                onChange={(e) => updateTeacherTimes(teacher.id, 'signInTime', e.target.value)}
                                className="text-[10px] font-bold font-mono bg-slate-50 border border-slate-100/80 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 animate-fade-in"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] text-slate-400 font-bold block mb-0.5">প্রস্থান সময়</span>
                              <input 
                                type="time"
                                disabled={isAbsent}
                                value={entry.signOutTime || ''}
                                onChange={(e) => updateTeacherTimes(teacher.id, 'signOutTime', e.target.value)}
                                className="text-[10px] font-bold font-mono bg-slate-50 border border-slate-100/80 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 animate-fade-in"
                              />
                            </div>
                          </div>

                        </div>

                      </div>
                    );
                  })}

                  {/* Teachers Save Footer container */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                    <p className="text-[10px] text-slate-500 font-semibold max-w-sm">
                      * আজকের উস্তাদ হাজিরা সাবমিট করলে এটি বেতন এবং শিক্ষক বোনাস মডিউলের জন্য স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে।
                    </p>
                    <button 
                      onClick={handleSaveTeachers}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      শিক্ষকদের হাজিরা সংরক্ষণ করুন
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <AlertCircle className="mx-auto text-slate-300 mb-2" size={36} />
                  <p className="text-xs font-medium">কোন উস্তাদ বা স্টাফ সদস্য সিস্টেমে তালিকাভুক্ত নেই।</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: History & Calendar */}
        <div className="space-y-4 font-sans text-xs">
          
          {/* Monthly Calendar View Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                <CalendarDays size={14} className="text-emerald-700" />
                <span>মাসিক হাজিরা ক্যালেন্ডার</span>
              </h3>
              <button 
                onClick={handleGoToToday}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.1 py-0.5 rounded-md transition-all cursor-pointer"
              >
                আজ
              </button>
            </div>

            {/* Calendar Month Selector Navigation */}
            <div className="flex items-center justify-between px-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="text-center">
                <span className="text-xs font-bold text-slate-800 font-sans">
                  {banglaMonths[calendarMonth]} {convertToBanglaNumber(calendarYear)}
                </span>
              </div>

              <button 
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'].map((d) => (
                <span key={d} className="text-[9px] font-bold text-slate-400">{d}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysGrid.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-8.5"></div>;
                }

                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const summary = getDayAttendanceSummary(day);
                
                // Helper to check if actual today
                const realTodayStr = new Date().toISOString().split('T')[0];
                const isRealToday = dateStr === realTodayStr;

                let cellBg = 'bg-transparent text-slate-700 hover:bg-slate-50';
                let borderStyle = 'border border-transparent';

                if (isSelected) {
                   cellBg = 'bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold';
                   borderStyle = 'border border-emerald-700';
                } else if (summary) {
                  // has attendance recorded
                  cellBg = 'bg-emerald-50/85 text-emerald-800 hover:bg-emerald-100 font-semibold';
                  borderStyle = 'border border-emerald-100';
                }

                if (isRealToday && !isSelected) {
                  borderStyle = 'border border-dashed border-emerald-500';
                }

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-8.5 flex flex-col items-center justify-center rounded-lg transition-all relative ${cellBg} ${borderStyle} cursor-pointer`}
                    title={summary ? `${convertToBanglaNumber(summary.present)}/${convertToBanglaNumber(summary.total)} উপস্থিত (${convertToBanglaNumber(summary.rate)}%)` : 'কোন রেকর্ড নেই'}
                  >
                    <span className="text-[10px] select-none leading-none font-sans font-semibold">{convertToBanglaNumber(day)}</span>
                    {summary ? (
                      <span className={`text-[7px] leading-none mt-0.5 ${isSelected ? 'text-emerald-200' : 'text-emerald-700'} font-bold font-sans`}>
                        {convertToBanglaNumber(summary.rate)}%
                      </span>
                    ) : (
                      <span className="h-1"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend / Visual explanation */}
            <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400">
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-150 border border-emerald-200"></span>
                <span>রেকর্ড আছে</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                <span>নির্বাচিত দিন</span>
              </div>
            </div>
          </div>

          {/* Recent Attendance Log (Conditional on active tab) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 flex items-center space-x-1.5">
              <Layers size={14} className="text-emerald-700" />
              <span>সাম্প্রতিক {activeTab === 'students' ? 'ছাত্র' : 'শিক্ষক'} হাযিরা কার্যক্রম</span>
            </h3>

            {activeTab === 'students' ? (
              pastRecordsList.length > 0 ? (
                <div className="space-y-2.5">
                  {pastRecordsList.map((log, idx) => {
                    const rate = Math.round((log.present / log.total) * 100);
                    const isCurrentLogDateSelected = selectedDate === log.date;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(log.date)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isCurrentLogDateSelected 
                            ? 'bg-emerald-50 border-emerald-200 shadow-2xs' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-100/60'
                        }`}
                      >
                        <div className="text-left font-sans">
                          <span className="text-[10px] font-bold text-slate-700 font-mono block">{convertToBanglaNumber(log.date)}</span>
                          <span className="text-xs text-slate-500 mt-0.5 inline-block">{log.class} বিভাগ</span>
                        </div>
                        <div className="text-right font-sans">
                          <span className="text-[10px] bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {convertToBanglaNumber(rate)}% উপস্থিত
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-1">{convertToBanglaNumber(log.present)}/{convertToBanglaNumber(log.total)} শিক্ষার্থী</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-4">বর্তমানে কোনো পূর্ববর্তী রেকর্ড নেই।</p>
              )
            ) : (
              // TEACHERS RECENT WORK HISTORY LOG LIST
              pastTeacherRecordsList.length > 0 ? (
                <div className="space-y-2.5">
                  {pastTeacherRecordsList.map((log, idx) => {
                    const rate = Math.round((log.present / log.total) * 100);
                    const isCurrentLogDateSelected = selectedDate === log.date;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(log.date)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isCurrentLogDateSelected 
                            ? 'bg-emerald-50 border-emerald-200 shadow-2xs' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-100/60'
                        }`}
                      >
                        <div className="text-left font-sans">
                          <span className="text-[10px] font-bold text-slate-700 font-mono block">{convertToBanglaNumber(log.date)}</span>
                          <span className="text-xs text-slate-500 mt-0.5 inline-block font-sans font-semibold">উস্তাদ শিফট লোগ</span>
                        </div>
                        <div className="text-right font-sans">
                          <span className="text-[10px] bg-teal-100/70 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                            {convertToBanglaNumber(rate)}% ডিউটি
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-1">{convertToBanglaNumber(log.present)}/{convertToBanglaNumber(log.total)} শিক্ষক উপস্থিত</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-4">বর্তমানে কোনো পূর্ববর্তী রেকর্ড নেই।</p>
              )
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
