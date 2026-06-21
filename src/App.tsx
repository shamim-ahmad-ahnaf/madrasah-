import React, { useState, useEffect } from 'react';
import { 
  initialStudents, 
  initialTeachers, 
  initialPayments, 
  initialSchedules, 
  initialNotices 
} from './initialData';
import { 
  Student, 
  Teacher, 
  AttendanceRecord, 
  FeePayment, 
  ClassSchedule, 
  Notice,
  SMSLog
} from './types';

// Component imports
import DashboardView from './components/DashboardView';
import StudentModule from './components/StudentModule';
import TeacherModule from './components/TeacherModule';
import AttendanceModule from './components/AttendanceModule';
import FinanceModule from './components/FinanceModule';
import RoutineModule from './components/RoutineModule';
import NoticeModule from './components/NoticeModule';
import SmsModule from './components/SmsModule';
import ReportsModule from './components/ReportsModule';
import LibraryModule from './components/LibraryModule';
import ExamModule from './components/ExamModule';
import HostelModule from './components/HostelModule';
import DonationModule from './components/DonationModule';
import StoreInventoryModule from './components/StoreInventoryModule';

// Icon imports
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  DollarSign, 
  Clock, 
  Megaphone, 
  Menu, 
  X,
  MessageSquare,
  BarChart3,
  BookOpen,
  Settings,
  Trash2,
  Home,
  HeartHandshake,
  Award,
  Boxes,
  Smartphone,
  Plus,
  Download
} from 'lucide-react';

export default function App() {
  // Madrasah Profile Settings State
  const [madrasahName, setMadrasahName] = useState(() => {
    return localStorage.getItem('madrasah_profile_name') || 'দারুল উলুম মাদ্রাসা';
  });
  const [madrasahSlogan, setMadrasahSlogan] = useState(() => {
    return localStorage.getItem('madrasah_profile_slogan') || 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং';
  });
  const [madrasahLogoType, setMadrasahLogoType] = useState(() => {
    return localStorage.getItem('madrasah_profile_logo_type') || 'emblem';
  });
  const [madrasahEmoji, setMadrasahEmoji] = useState(() => {
    return localStorage.getItem('madrasah_profile_emoji') || '🕌';
  });
  const [madrasahInitialText, setMadrasahInitialText] = useState(() => {
    return localStorage.getItem('madrasah_profile_initial') || 'م';
  });
  const [adminName, setAdminName] = useState(() => {
    return localStorage.getItem('madrasah_admin_name') || 'আহমেদ হাসান';
  });
  const [adminTitle, setAdminTitle] = useState(() => {
    return localStorage.getItem('madrasah_admin_title') || 'মুহতামিম / সুপারিন্টেন্ডেন্ট';
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('madrasah_admin_password') || 'admin123';
  });

  const handleOpenSettings = () => {
    setIsPasswordPromptOpen(true);
    setPasswordInput('');
    setPasswordError('');
  };

  // Mobile menu control
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Direct modal trigger states (from Dashboard quick links)
  const [triggerStudentModal, setTriggerStudentModal] = useState(false);
  const [triggerPaymentModal, setTriggerPaymentModal] = useState(false);

  // Core Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);

  // PWA & Home Screen shortcut state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isSuccessfullyInstalled, setIsSuccessfullyInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsSuccessfullyInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Initial load effect
  useEffect(() => {
    // One-time clear of old default data keys to ensure a clean slate immediately
    const cleanSlateActive = localStorage.getItem('madrasah_clean_slate_active_v4');
    if (!cleanSlateActive) {
      localStorage.removeItem('madrasah_students');
      localStorage.removeItem('madrasah_teachers');
      localStorage.removeItem('madrasah_attendance');
      localStorage.removeItem('madrasah_payments');
      localStorage.removeItem('madrasah_schedules');
      localStorage.removeItem('madrasah_notices');
      localStorage.removeItem('madrasah_sms_logs');
      localStorage.removeItem('madrasah_books');
      localStorage.removeItem('madrasah_borrow_records');
      localStorage.setItem('madrasah_clean_slate_active_v4', 'yes');
    }

    // Students
    const storedStudents = localStorage.getItem('madrasah_students');
    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    } else {
      setStudents(initialStudents);
      localStorage.setItem('madrasah_students', JSON.stringify(initialStudents));
    }

    // Teachers
    const storedTeachers = localStorage.getItem('madrasah_teachers');
    if (storedTeachers) {
      setTeachers(JSON.parse(storedTeachers));
    } else {
      setTeachers(initialTeachers);
      localStorage.setItem('madrasah_teachers', JSON.stringify(initialTeachers));
    }

    // Attendance
    const storedAttendance = localStorage.getItem('madrasah_attendance');
    if (storedAttendance) {
      setAttendance(JSON.parse(storedAttendance));
    } else {
      setAttendance([]);
    }

    // Payments
    const storedPayments = localStorage.getItem('madrasah_payments');
    if (storedPayments) {
      setPayments(JSON.parse(storedPayments));
    } else {
      setPayments(initialPayments);
      localStorage.setItem('madrasah_payments', JSON.stringify(initialPayments));
    }

    // Schedules
    const storedSchedules = localStorage.getItem('madrasah_schedules');
    if (storedSchedules) {
      setSchedules(JSON.parse(storedSchedules));
    } else {
      setSchedules(initialSchedules);
      localStorage.setItem('madrasah_schedules', JSON.stringify(initialSchedules));
    }

    // Notices
    const storedNotices = localStorage.getItem('madrasah_notices');
    if (storedNotices) {
      setNotices(JSON.parse(storedNotices));
    } else {
      setNotices(initialNotices);
      localStorage.setItem('madrasah_notices', JSON.stringify(initialNotices));
    }

    // SMS Logs
    const storedSms = localStorage.getItem('madrasah_sms_logs');
    if (storedSms) {
      setSmsLogs(JSON.parse(storedSms));
    } else {
      const initialSms: SMSLog[] = [];
      setSmsLogs(initialSms);
      localStorage.setItem('madrasah_sms_logs', JSON.stringify(initialSms));
    }
  }, []);

  // Sync state helpers
  const saveAndSetStudents = (updatedList: Student[]) => {
    setStudents(updatedList);
    localStorage.setItem('madrasah_students', JSON.stringify(updatedList));
  };

  const saveAndSetTeachers = (updatedList: Teacher[]) => {
    setTeachers(updatedList);
    localStorage.setItem('madrasah_teachers', JSON.stringify(updatedList));
  };

  const saveAndSetPayments = (updatedList: FeePayment[]) => {
    setPayments(updatedList);
    localStorage.setItem('madrasah_payments', JSON.stringify(updatedList));
  };

  const saveAndSetSchedules = (updatedList: ClassSchedule[]) => {
    setSchedules(updatedList);
    localStorage.setItem('madrasah_schedules', JSON.stringify(updatedList));
  };

  const saveAndSetNotices = (updatedList: Notice[]) => {
    setNotices(updatedList);
    localStorage.setItem('madrasah_notices', JSON.stringify(updatedList));
  };

  // CRUD Operations handler
  // 1. Students
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: 'st-' + Math.random().toString(36).substr(2, 9)
    };
    saveAndSetStudents([newStudent, ...students]);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    saveAndSetStudents(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    saveAndSetStudents(updated);
  };

  // 2. Teachers
  const handleAddTeacher = (teacherData: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      ...teacherData,
      id: 'tc-' + Math.random().toString(36).substr(2, 9)
    };
    saveAndSetTeachers([newTeacher, ...teachers]);
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    const updated = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
    saveAndSetTeachers(updated);
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter(t => t.id !== id);
    saveAndSetTeachers(updated);
  };

  // Core SMS helpers
  const handleAddSmsLogs = (newLogs: SMSLog[]) => {
    const updated = [...newLogs, ...smsLogs];
    setSmsLogs(updated);
    localStorage.setItem('madrasah_sms_logs', JSON.stringify(updated));
  };

  const handleClearSmsLogs = () => {
    setSmsLogs([]);
    localStorage.setItem('madrasah_sms_logs', JSON.stringify([]));
  };

  const handleSendReminderSMS = (student: Student) => {
    const bkBDate = new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const reminderSms: SMSLog = {
      id: 'sms-' + Math.random().toString(36).substr(2, 9),
      timestamp: bkBDate,
      studentId: student.id,
      studentName: student.name,
      gradeClass: student.gradeClass,
      phone: student.phone || '01700-000000',
      type: 'বেতন রিমাইন্ডার (Fee Reminder)',
      message: `আস-সালামু আলাইকুম। শ্রদ্ধেয় অভিভাবক ${student.fatherName}, আপনার সন্তান ${student.name} (রোল: ${student.roll}, বিভাগ: ${student.gradeClass}) এর মাসিক ফি বাবদ মোট ৳${student.monthlyFee} টাকা পরিশোধ করার জন্য অনুরোধ করা হলো। - দারুল উলুম মাদ্রাসা`,
      status: 'সফল (Success)'
    };
    // Direct array update because setSmsLogs/localStorage can have state delays inside immediate handler
    const updated = [reminderSms, ...smsLogs];
    setSmsLogs(updated);
    localStorage.setItem('madrasah_sms_logs', JSON.stringify(updated));
  };

  const handleSendNoticeSMS = (notice: Notice) => {
    const bkBDate = new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const noticeLogs: SMSLog[] = students.map(student => {
      return {
        id: 'sms-' + Math.random().toString(36).substr(2, 9),
        timestamp: bkBDate,
        studentId: student.id,
        studentName: student.name,
        gradeClass: student.gradeClass,
        phone: student.phone || '01700-000000',
        type: 'ঘোষণা ও নোটিশ (Announcement)',
        message: `মাদ্রাসার নোটিশ: ${notice.title}। বিস্তারিত: ${notice.content} - দারুল উলুম মাদ্রাসা`,
        status: 'সফল (Success)'
      };
    });
    const updated = [...noticeLogs, ...smsLogs];
    setSmsLogs(updated);
    localStorage.setItem('madrasah_sms_logs', JSON.stringify(updated));
  };

  // 3. Attendance Save/Override
  const handleSaveAttendance = (newRecords: Omit<AttendanceRecord, 'id'>[], sendSMS: boolean) => {
    // Generate fresh ids and merge
    const incomingWithIds: AttendanceRecord[] = newRecords.map(rec => ({
      ...rec,
      id: 'att-' + Math.random().toString(36).substr(2, 9)
    }));

    // Filter out previous records of selected date/class to prevent dupes
    const firstRec = newRecords[0];
    let filteredPrev = [...attendance];
    if (firstRec) {
      filteredPrev = attendance.filter(
        rec => !(rec.date === firstRec.date && rec.gradeClass === firstRec.gradeClass)
      );
    }

    const merged = [...incomingWithIds, ...filteredPrev];
    setAttendance(merged);
    localStorage.setItem('madrasah_attendance', JSON.stringify(merged));

    if (sendSMS) {
      const bkBDate = new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      const createdSmsLogs: SMSLog[] = newRecords.map(rec => {
        const studentObj = students.find(s => s.id === rec.studentId);
        const parentPhone = studentObj?.phone || '01700-000000';
        return {
          id: 'sms-' + Math.random().toString(36).substr(2, 9),
          timestamp: bkBDate,
          studentId: rec.studentId,
          studentName: rec.studentName,
          gradeClass: rec.gradeClass,
          phone: parentPhone,
          type: 'হাজিরা (Attendance)',
          message: `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${rec.studentName} (শ্রেণী: ${rec.gradeClass}, রোল: ${rec.roll}) আজ ${rec.status} রয়েছে। - দারুল উলুম মাদ্রাসা`,
          status: 'সফল (Success)'
        };
      });
      const updated = [...createdSmsLogs, ...smsLogs];
      setSmsLogs(updated);
      localStorage.setItem('madrasah_sms_logs', JSON.stringify(updated));
    }
  };

  // 4. Payments Finance Book
  const handleAddPayment = (paymentData: Omit<FeePayment, 'id'> & { id?: string }, sendSMS: boolean) => {
    const isEdit = paymentData.id ? payments.some(p => p.id === paymentData.id) : false;
    const newPayment: FeePayment = {
      ...paymentData,
      id: paymentData.id || ('py-' + Math.random().toString(36).substr(2, 9))
    };
    
    if (isEdit) {
      const updatedList = payments.map(p => p.id === newPayment.id ? newPayment : p);
      saveAndSetPayments(updatedList);
    } else {
      saveAndSetPayments([newPayment, ...payments]);
    }

    if (sendSMS) {
      const bkBDate = new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      const studentObj = students.find(s => s.id === paymentData.studentId);
      const parentPhone = studentObj?.phone || '01700-000000';
      const paymentSms: SMSLog = {
        id: 'sms-' + Math.random().toString(36).substr(2, 9),
        timestamp: bkBDate,
        studentId: paymentData.studentId,
        studentName: paymentData.studentName,
        gradeClass: paymentData.gradeClass,
        phone: parentPhone,
        type: 'পেমেন্ট রশিদ (Payment Receipt)',
        message: `শ্রদ্ধেয় অভিভাবক, আপনার সন্তান ${paymentData.studentName} এর ${paymentData.payingMonth} মাসের হাদিয়ার মোট ৳${paymentData.amount} সফলভাবে সংগৃহীত হয়েছে। রশিদ নং: ${newPayment.id}। - দারুল উলুম মাদ্রাসা`,
        status: 'সফল (Success)'
      };
      const updated = [paymentSms, ...smsLogs];
      setSmsLogs(updated);
      localStorage.setItem('madrasah_sms_logs', JSON.stringify(updated));
    }
  };

  const handleDeletePayment = (id: string) => {
    const updated = payments.filter(p => p.id !== id);
    saveAndSetPayments(updated);
  };

  // 5. Schedules Routines
  const handleAddSchedule = (scheduleData: Omit<ClassSchedule, 'id'>) => {
    const newSchedule: ClassSchedule = {
      ...scheduleData,
      id: 'sch-' + Math.random().toString(36).substr(2, 9)
    };
    saveAndSetSchedules([newSchedule, ...schedules]);
  };

  const handleUpdateSchedule = (updatedSchedule: ClassSchedule) => {
    const updated = schedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
    saveAndSetSchedules(updated);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    saveAndSetSchedules(updated);
  };

  // Database actions: Wiping and restoring
  const handleWipeDatabase = () => {
    localStorage.setItem('madrasah_students', '[]');
    localStorage.setItem('madrasah_teachers', '[]');
    localStorage.setItem('madrasah_attendance', '[]');
    localStorage.setItem('madrasah_payments', '[]');
    localStorage.setItem('madrasah_schedules', '[]');
    localStorage.setItem('madrasah_notices', '[]');
    localStorage.setItem('madrasah_sms_logs', '[]');
    localStorage.setItem('madrasah_books', '[]');
    localStorage.setItem('madrasah_borrow_records', '[]');
    
    setStudents([]);
    setTeachers([]);
    setAttendance([]);
    setPayments([]);
    setSchedules([]);
    setNotices([]);
    setSmsLogs([]);
    
    window.location.reload();
  };

  const handleRestoreDemoDatabase = () => {
    localStorage.removeItem('madrasah_students');
    localStorage.removeItem('madrasah_teachers');
    localStorage.removeItem('madrasah_attendance');
    localStorage.removeItem('madrasah_payments');
    localStorage.removeItem('madrasah_schedules');
    localStorage.removeItem('madrasah_notices');
    localStorage.removeItem('madrasah_sms_logs');
    localStorage.removeItem('madrasah_books');
    localStorage.removeItem('madrasah_borrow_records');
    window.location.reload();
  };

  // 6. Public Notices
  const handleAddNotice = (noticeData: Omit<Notice, 'id'>) => {
    const newNotice: Notice = {
      ...noticeData,
      id: 'nt-' + Math.random().toString(36).substr(2, 9)
    };
    saveAndSetNotices([newNotice, ...notices]);
  };

  const handleUpdateNotice = (updatedNotice: Notice) => {
    const updated = notices.map(n => n.id === updatedNotice.id ? updatedNotice : n);
    saveAndSetNotices(updated);
  };

  const handleDeleteNotice = (id: string) => {
    const updated = notices.filter(n => n.id !== id);
    saveAndSetNotices(updated);
  };

  // Quick Navigator modal triggers
  const handleDashboardAddStudentTrigger = () => {
    setActiveTab('students');
    setTriggerStudentModal(true);
  };

  const handleDashboardAddPaymentTrigger = (studentId?: string) => {
    setActiveTab('finance');
    setTriggerPaymentModal(studentId || true);
  };

  // Render correct panel component
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            students={students}
            teachers={teachers}
            payments={payments}
            attendance={attendance}
            notices={notices}
            setActiveTab={setActiveTab}
            onAddStudent={handleDashboardAddStudentTrigger}
            onAddPayment={handleDashboardAddPaymentTrigger}
            onSendReminderSMS={handleSendReminderSMS}
          />
        );
      case 'students':
        return (
          <StudentModule 
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            showAddModalDirectly={triggerStudentModal}
            onCloseModalDirectly={() => setTriggerStudentModal(false)}
          />
        );
      case 'teachers':
        return (
          <TeacherModule 
            teachers={teachers}
            onAddTeacher={handleAddTeacher}
            onUpdateTeacher={handleUpdateTeacher}
            onDeleteTeacher={handleDeleteTeacher}
          />
        );
      case 'attendance':
        return (
          <AttendanceModule 
            students={students}
            teachers={teachers}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
          />
        );
      case 'finance':
        return (
          <FinanceModule 
            students={students}
            payments={payments}
            onAddPayment={handleAddPayment}
            onSendReminderSMS={handleSendReminderSMS}
            onDeletePayment={handleDeletePayment}
            madrasahName={madrasahName}
            madrasahSlogan={madrasahSlogan}
            showAddPaymentDirectly={triggerPaymentModal}
            onClearAddPaymentDirectly={() => setTriggerPaymentModal(false)}
          />
        );
      case 'routines':
        return (
          <RoutineModule 
            teachers={teachers}
            schedules={schedules}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onUpdateSchedule={handleUpdateSchedule}
          />
        );
      case 'notices':
        return (
          <NoticeModule 
            notices={notices}
            onAddNotice={handleAddNotice}
            onUpdateNotice={handleUpdateNotice}
            onDeleteNotice={handleDeleteNotice}
            onSendNoticeSMS={handleSendNoticeSMS}
          />
        );
      case 'sms':
        return (
          <SmsModule 
            students={students}
            notices={notices}
            smsLogs={smsLogs}
            onAddSmsLogs={handleAddSmsLogs}
            onClearSmsLogs={handleClearSmsLogs}
          />
        );
      case 'reports':
        return (
          <ReportsModule 
            students={students}
            attendance={attendance}
            payments={payments}
            teachers={teachers}
          />
        );
      case 'library':
        return (
          <LibraryModule 
            students={students}
            teachers={teachers}
          />
        );
      case 'exams':
        return (
          <ExamModule 
            students={students}
          />
        );
      case 'hostel':
        return (
          <HostelModule 
            students={students}
          />
        );
      case 'donations':
        return (
          <DonationModule />
        );
      case 'store_inventory':
        return (
          <StoreInventoryModule />
        );
      default:
        return <div className="text-center py-10">অনুপলব্ধ বিভাগ!</div>;
    }
  };

  // Nav categories meta array
  const navigationItems = [
    { key: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { key: 'students', label: 'শিক্ষার্থী তালিকা', icon: Users },
    { key: 'teachers', label: 'উস্তাদ / শিক্ষকগণ', icon: GraduationCap },
    { key: 'attendance', label: 'হাজিরা খাতা', icon: CalendarCheck },
    { key: 'finance', label: 'আয়-ব্যয় ও ফি হিসাব', icon: DollarSign },
    { key: 'routines', label: 'শ্রেণী রুটিন', icon: Clock },
    { key: 'notices', label: 'বিজ্ঞপ্তি বোর্ড', icon: Megaphone },
    { key: 'sms', label: 'এসএমএস পোর্টাল', icon: MessageSquare },
    { key: 'library', label: 'লাইব্রেরি ও কুতুবখানা', icon: BookOpen },
    { key: 'exams', label: 'পরীক্ষা ও ফলাফল', icon: Award },
    { key: 'hostel', label: 'আবাসিক হোস্টেল ও ডাইনিং', icon: Home },
    { key: 'donations', label: 'দান-সদকা ও লিল্লাহ তহবিল', icon: HeartHandshake },
    { key: 'store_inventory', label: 'স্টোর ও ডাইনিং ইনভেন্টরি', icon: Boxes },
    { key: 'reports', label: 'রিপোর্ট ও বিশ্লেষণ', icon: BarChart3 }
  ];

  const getTabLabelBangla = (tab: string) => {
    const found = navigationItems.find(item => item.key === tab);
    return found ? found.label : 'মাদ্রাসা';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-emerald-900 text-white flex flex-col border-r border-emerald-800/50 shrink-0 hidden lg:flex">
        <div className="p-5 border-b border-emerald-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {madrasahLogoType === 'emblem' ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-700 border border-emerald-500/35 flex items-center justify-center font-bold text-base text-emerald-100 select-none shrink-0 font-serif">
                  {madrasahInitialText}
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-700/30 flex items-center justify-center text-xl select-none shrink-0">
                  {madrasahEmoji}
                </div>
              )}
              <div className="overflow-hidden">
                <h1 className="text-xs font-extrabold tracking-tight truncate text-emerald-50" title={madrasahName}>{madrasahName}</h1>
                <p className="text-[9px] text-emerald-350 uppercase tracking-widest font-bold">ম্যানেজমেন্ট পোর্টাল</p>
              </div>
            </div>
            <button 
              onClick={handleOpenSettings}
              className="p-1.5 rounded-lg bg-emerald-800/50 hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors cursor-pointer shrink-0"
              title="মডেল সেটিংস"
              id="desktop-settings-trigger"
            >
              <Settings size={13} className="animate-spin-hover" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  if (item.key !== 'students') setTriggerStudentModal(false);
                  if (item.key !== 'finance') setTriggerPaymentModal(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-800 text-white shadow-md font-bold' 
                    : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                }`}
              >
                <IconComponent size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer profile & server state details */}
        <div className="p-4 border-t border-emerald-800/50 space-y-2.5">
          {/* Add to Home Screen shortcut banner with Dynamic Logo */}
          <button
            onClick={() => setIsShortcutModalOpen(true)}
            className="w-full flex items-center space-x-2.5 bg-gradient-to-r from-amber-500/15 via-emerald-800/20 to-emerald-800/40 hover:from-amber-500/25 hover:to-emerald-800/50 text-white rounded-xl p-2.5 border border-amber-500/30 transition-all text-left cursor-pointer group shadow-sm hover:shadow-md"
            title="হোম স্ক্রিনে লোগো সহ অ্যাপ যুক্ত করুন"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-amber-400/50 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
               <img src="/public/logo.svg" className="w-6 h-6 object-contain" alt="logo" referrerPolicy="no-referrer" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-extrabold text-amber-300 group-hover:text-amber-200 transition-colors leading-tight flex items-center gap-1">
                হোম স্ক্রিনে শর্টকাট <Plus size={10} strokeWidth={3} className="text-amber-300 animate-pulse" />
              </p>
              <p className="text-[8px] text-emerald-200/85 mt-0.5 leading-none font-medium truncate">সুন্দর লোগো সহ ইনস্টল ট্র্যাকার</p>
            </div>
          </button>

          <div className="flex items-center space-x-2 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[9px] font-medium text-emerald-250">সিস্টেম অনলাইন (লোকাল স্টোরেজ)</span>
          </div>

          <div className="flex items-center space-x-3 px-3 py-2 bg-emerald-950 rounded-lg">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-sm font-sans select-none shrink-0">
              {adminName ? adminName.charAt(0) : 'এ'}
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-semibold text-white leading-none truncate" title={adminName}>{adminName}</p>
              <p className="text-emerald-400 opacity-70 mt-1 text-[10px] truncate" title={adminTitle}>{adminTitle}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile nav header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-emerald-900 border-b border-emerald-800 text-white flex items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {madrasahLogoType === 'emblem' ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-sm text-emerald-100 select-none shrink-0 font-serif">
              {madrasahInitialText}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-base select-none shrink-0">
              {madrasahEmoji}
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="text-xs font-bold leading-tight truncate text-emerald-50">{madrasahName}</h1>
            <p className="text-[9px] text-emerald-350 font-semibold uppercase leading-none">ম্যানেজমেন্ট পোর্টাল</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button 
            onClick={handleOpenSettings}
            className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition-colors"
            title="সেটিংস"
            id="mobile-settings-trigger"
          >
            <Settings size={15} />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 transition-colors"
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        ></div>
      )}

      {/* Mobile Navigation Drawer Panel */}
      <div className={`fixed top-14 bottom-0 left-0 w-64 bg-emerald-900 text-white border-r border-emerald-800/40 z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="py-6 px-4 space-y-6 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold text-emerald-200/75 tracking-widest pl-3 block">
              মূল নেভিগেশন (মোবাইল)
            </span>
            
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.key;
                
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsMobileMenuOpen(false);
                      if (item.key !== 'students') setTriggerStudentModal(false);
                      if (item.key !== 'finance') setTriggerPaymentModal(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-emerald-800 text-white font-bold shadow-md' 
                        : 'text-emerald-100 hover:bg-emerald-800/40'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="px-3 py-1">
            <button
              onClick={() => {
                setIsShortcutModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 bg-gradient-to-r from-amber-500/20 via-emerald-850 to-emerald-800/50 hover:from-amber-500/30 text-white rounded-xl p-3 border border-amber-500/30 transition-all text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-amber-400/50 flex items-center justify-center shrink-0">
                <img src="/public/logo.svg" className="w-6 h-6" alt="logo" referrerPolicy="no-referrer" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5 select-none text-[11px] !leading-normal">
                  আজই হোম স্ক্রিনে যোগ করুন <Plus size={11} className="text-amber-300 shrink-0" />
                </p>
                <p className="text-[9px] text-emerald-250 mt-0.5 leading-none font-medium text-[9px]">সুন্দর ও ঐতিহ্যবাহী লোগো সহ অ্যাপ</p>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-emerald-800/40 text-[10px] text-emerald-300 text-center select-none font-sans">
            {madrasahName} • সংস্করণ ৪.৩.০
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0">
        
        {/* Real Breadcrumb Header */}
        <header className="h-16 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between px-6 lg:px-8 shadow-xs z-30">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
            <span>মূল পাতা</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md">
              {getTabLabelBangla(activeTab)} ওভারভিউ
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={handleOpenSettings}
              className="bg-slate-100 hover:bg-slate-200 text-slate-750 text-slate-750 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer text-slate-705 text-slate-700"
              title="মাদ্রাসা কন্ট্রোল প্যানেল"
              id="header-settings-trigger"
            >
              <Settings size={13} />
              <span className="hidden md:inline">সেটিংস ও কন্ট্রোল</span>
            </button>

            <button 
              onClick={handleDashboardAddStudentTrigger}
              className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Users size={12} />
              <span className="hidden sm:inline">নতুন ছাত্র ভর্তি</span>
              <span className="sm:hidden">ভর্তি</span>
            </button>
            <div className="text-right hidden lg:block border-l pl-4 border-slate-200">
              <p className="text-[9px] text-slate-400">আজকের তারিখ</p>
              <p className="text-xs font-bold text-slate-700">
                {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic Interactive Workspace */}
        <div className="flex-1 bg-slate-50 overflow-y-auto px-4 py-6 md:p-6 lg:p-8">
          {renderActiveTabContent()}
        </div>
      </main>

      {/* Password Verification Modal */}
      {isPasswordPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="password-prompt-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-sm overflow-hidden flex flex-col animate-scale-up animate-fade-in">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Settings size={18} className="text-emerald-300 animate-spin-hover" />
                <h3 className="font-bold text-sm font-sans">অ্যাডমিন প্রবেশাধিকার নিয়ন্ত্রণ</h3>
              </div>
              <button 
                onClick={() => setIsPasswordPromptOpen(false)}
                className="text-white/80 hover:text-white bg-emerald-800 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (passwordInput === adminPassword) {
                setIsPasswordPromptOpen(false);
                setIsSettingsModalOpen(true);
                setPasswordError('');
              } else {
                setPasswordError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
              }
            }} className="p-6 space-y-4 text-slate-700 text-xs font-sans">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Settings size={22} />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">মাস্টার কন্ট্রোল অ্যাক্সেস লক</h4>
                <p className="text-[10px] text-slate-500 mt-1">মাদ্রাসার প্রাথমিক বিবরণী, লোগো বা ডেমো ডাটা সাফ করার সেটিংস অ্যাক্সেস করতে পাসওয়ার্ড দিন।</p>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">অ্যাডমিন পাসওয়ার্ড লিখুন:</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-center outline-none focus:border-emerald-600 transition-colors tracking-widest text-slate-800 font-bold font-mono text-sm"
                  placeholder="••••••••"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-600 font-bold mt-1.5 text-center text-[10px] animate-bounce">{passwordError}</p>
                )}
                <p className="text-[9px] text-slate-400 mt-2.5 text-center leading-relaxed">
                  পরীক্ষার জন্য ডিফল্ট পাসওয়ার্ড: <span className="font-mono bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">admin123</span>
                </p>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordPromptOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Madrasah Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="madrasah-settings-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Settings size={18} className="text-emerald-300" />
                <h3 className="font-bold text-sm font-sans">মাদ্রাসা প্রোফাইল ও মাস্টার সেটিংস</h3>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-white/80 hover:text-white bg-emerald-800 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs font-sans">
              
              {/* Section 1: Name and Slogan */}
              <div className="space-y-3.5">
                <h4 className="font-extrabold text-emerald-800 border-b border-slate-100 pb-1.5 flex items-center shrink-0">
                  <span>মাদ্রাসার প্রাথমিক বিবরণ</span>
                </h4>
                
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">মাদ্রাসার অফিসিয়াল নাম *</label>
                  <input 
                    type="text" 
                    value={madrasahName}
                    onChange={(e) => {
                      setMadrasahName(e.target.value);
                      localStorage.setItem('madrasah_profile_name', e.target.value);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-800 font-bold"
                    placeholder="যেমন: দারুল উলুম মাদ্রাসা"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">স্লোগান / ঠিকানা / প্রতিষ্ঠিত সাল *</label>
                  <input 
                    type="text" 
                    value={madrasahSlogan}
                    onChange={(e) => {
                      setMadrasahSlogan(e.target.value);
                      localStorage.setItem('madrasah_profile_slogan', e.target.value);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                    placeholder="যেমন: মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং"
                  />
                </div>
              </div>

              {/* Section 2: Custom beautiful Logo config */}
              <div className="space-y-3.5">
                <h4 className="font-extrabold text-emerald-800 border-b border-slate-100 pb-1.5 shrink-0">
                  লোগো ও ক্যালিগ্রাফি সিল
                </h4>

                <div className="grid grid-cols-2 gap-3 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMadrasahLogoType('emblem');
                      localStorage.setItem('madrasah_profile_logo_type', 'emblem');
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      madrasahLogoType === 'emblem' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-emerald-50 flex items-center justify-center font-bold text-base font-serif">
                      {madrasahInitialText}
                    </div>
                    <span className="text-[10px]">ক্যালিগ্রাফি হরফ সিল</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMadrasahLogoType('emoji');
                      localStorage.setItem('madrasah_profile_logo_type', 'emoji');
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                      madrasahLogoType === 'emoji' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' 
                        : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="text-2xl select-none">{madrasahEmoji}</div>
                    <span className="text-[10px]">মনোগ্রাম মার্কার ইমোজি</span>
                  </button>
                </div>

                {madrasahLogoType === 'emblem' ? (
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">হরফ সিলের আরবি অক্ষর বা সংক্ষেপ রূপ</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      value={madrasahInitialText}
                      onChange={(e) => {
                        setMadrasahInitialText(e.target.value);
                        localStorage.setItem('madrasah_profile_initial', e.target.value);
                      }}
                      className="w-1/3 border border-slate-200 rounded-xl p-2.5 text-center outline-none focus:border-emerald-600 transition-colors text-slate-800 font-bold text-sm"
                      placeholder="ম"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">এটি আপনার মাদ্রাসার নামের শুরুর প্রতীক হরফ হতে পারে (যেমন: م / দার / কুতুব)</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">লোগো ইমোজি নির্বাচন করুন</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        value={madrasahEmoji}
                        onChange={(e) => {
                          setMadrasahEmoji(e.target.value);
                          localStorage.setItem('madrasah_profile_emoji', e.target.value);
                        }}
                        className="w-1/4 border border-slate-200 rounded-xl p-2 text-center outline-none focus:border-emerald-600 transition-colors text-slate-800 text-sm"
                      />
                      <div className="flex space-x-1 overflow-x-auto pb-1 shrink-0">
                        {['🕌', '🕋', '📖', '📚', '🖋️', '🎓', '🎪', '⭐'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setMadrasahEmoji(emoji);
                              localStorage.setItem('madrasah_profile_emoji', emoji);
                            }}
                            className="p-1 px-2.5 rounded-lg border border-slate-150 hover:bg-slate-50 text-sm transition-all cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Admin identity */}
              <div className="space-y-3.5">
                <h4 className="font-extrabold text-emerald-800 border-b border-slate-100 pb-1.5 shrink-0">
                  প্রধান এডমিন / মুহতামিম প্রোফাইল
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">মুহতামিমের নাম</label>
                    <input 
                      type="text" 
                      value={adminName}
                      onChange={(e) => {
                        setAdminName(e.target.value);
                        localStorage.setItem('madrasah_admin_name', e.target.value);
                      }}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-800 text-xs font-bold"
                      placeholder="যেমন: আহমদ হাসান"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">পদবি</label>
                    <input 
                      type="text" 
                      value={adminTitle}
                      onChange={(e) => {
                        setAdminTitle(e.target.value);
                        localStorage.setItem('madrasah_admin_title', e.target.value);
                      }}
                      className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-850 text-xs"
                      placeholder="যেমন: মুহতামিম"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-slate-500 font-semibold mb-1">সেটিংস সিকিউরিটি পাসওয়ার্ড *</label>
                  <input 
                    type="text" 
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      localStorage.setItem('madrasah_admin_password', e.target.value);
                    }}
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-800 font-mono font-bold"
                    placeholder="পাসওয়ার্ড লিখুন"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">ভবিষ্যতে মাস্টার সেটিংস প্রবেশদ্বার সুরক্ষিত রাখতে এই পাসওয়ার্ডটি ব্যবহার হবে।</p>
                </div>
              </div>

              {/* Section 4: Sandboxed Demo Data Actions */}
              <div className="space-y-3 bg-red-50/40 border border-red-150 rounded-2xl p-4 shrink-0 font-sans">
                <h5 className="font-bold text-red-800 flex items-center space-x-1.5">
                  <Trash2 size={13} className="shrink-0 text-red-650" />
                  <span>তথ্যসমূহ সাফকরণ ও কন্ট্রোল প্যানেল</span>
                </h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  মাদ্রাসার সমস্ত ডেমো ডাটা (শিক্ষার্থী, শিক্ষক, নোটিশ, রুটিন ইত্যাদি) এক ক্লিকে মুছে ফেলে কাজ শুরু করতে পারেন। কোনো ভুল হলে পুনরায় ডেমো ডাটা রিস্টোরও করতে পারবেন।
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleWipeDatabase}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-xs text-[10px] cursor-pointer"
                  >
                    সব ডেমো ডাটা মুছে ফেলুন
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreDemoDatabase}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-xl transition-all text-[10px] cursor-pointer"
                  >
                    ডিফল্ট ডেমো পুনরুদ্ধার করুন
                  </button>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 px-6 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PWA Home Screen Shortcut Modal WITH Premium Logo Preview & SmartMockup */}
      {isShortcutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="shortcut-helper-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-lg overflow-hidden flex flex-col md:max-h-[92vh] max-h-[95vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-teal-950 text-white p-4 flex items-center justify-between shrink-0 border-b border-emerald-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-800 flex items-center justify-center border border-amber-400/40 animate-pulse">
                  <Smartphone size={15} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-sans tracking-wide">নতুন লোগো সহ হোম স্ক্রিনে যোগ করুন</h3>
                  <p className="text-[9px] text-emerald-300 leading-none mt-0.5 font-sans">মাদ্রাসা অ্যাপটি মোবাইল স্ক্রিনে সেট করুন</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShortcutModalOpen(false)}
                className="text-white/80 hover:text-white bg-emerald-800 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-xs font-sans leading-relaxed">
              
              {/* Main Premium Announcement with Circular Logo */}
              <div className="bg-gradient-to-br from-emerald-50 to-amber-50/40 border border-emerald-150 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-2xs">
                
                {/* Embedded Premium Logo */}
                <div className="relative group shrink-0">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 to-emerald-600 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative w-16 h-16 rounded-full bg-emerald-950 border-2 border-amber-400 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                    <img src="/public/logo.svg" className="w-13 h-13 object-contain" alt="মাদ্রাসা লোগো" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-800 text-sm">{madrasahName} আইকন ও লোগো</h4>
                  <p className="text-slate-600 leading-normal text-[11px] font-sans">
                    আমাদের এই অ্যাপ্লিকেশনে একটি অত্যন্ত রমনীয় ও ঐতিহ্যবাহী সবুজ-সোনালী মার্জিত ইসলামী লোগো (খিলান গম্বুজ, কুরআনের রেহাল ও গাইড) যুক্ত করা হয়েছে। এটি শর্টকাট হিসেবে আপনার মোবাইল স্ক্রিনে দারুণ দেখাবে!
                  </p>
                </div>
              </div>

              {/* Interactive Phone Homescreen Mockup Visualizer */}
              <div className="border border-slate-150 rounded-2xl bg-slate-50 p-4">
                <span className="text-[10px] font-extrabold text-slate-450 tracking-wider uppercase block text-center mb-3">
                  মোবাইল স্ক্রিনে শর্টকাটটির রূপরেখা (পদ্ধতিগত ডেমো)
                </span>
                
                <div className="flex justify-center">
                  {/* Smartphone Container */}
                  <div className="w-52 h-64 rounded-[32px] border-4 border-slate-800 bg-slate-900 overflow-hidden relative shadow-md flex flex-col justify-between p-3 select-none">
                    
                    {/* Phone Top Speaker/Camera notch */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-slate-800 rounded-full z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700"></div>
                    </div>

                    {/* Phone Home Top Panel */}
                    <div className="flex justify-between items-center text-[7px] text-white/90 px-2 pt-0.5 font-mono font-bold">
                      <span>১০:৩০</span>
                      <div className="flex items-center space-x-1">
                        <span>📶</span>
                        <span>🔋 ৯৮%</span>
                      </div>
                    </div>

                    {/* Smartphone Home Screen Desktop Apps Grid */}
                    <div className="grid grid-cols-3 gap-y-3 gap-x-1 py-3 px-1 max-w-full overflow-hidden shrink-0 text-center text-[7px] text-white/90 font-medium">
                      
                      {/* System App 1 */}
                      <div className="flex flex-col items-center space-y-0.5">
                        <div className="w-7 h-7 rounded-xl bg-blue-500 flex items-center justify-center text-xs shadow-sm">📞</div>
                        <span className="truncate max-w-full opacity-80 font-semibold text-[7.5px]">ফোন</span>
                      </div>

                      {/* System App 2 */}
                      <div className="flex flex-col items-center space-y-0.5">
                        <div className="w-7 h-7 rounded-xl bg-orange-500 flex items-center justify-center text-xs shadow-sm">✉️</div>
                        <span className="truncate max-w-full opacity-80 font-semibold text-[7.5px]">মেসেজ</span>
                      </div>

                      {/* System App 3 */}
                      <div className="flex flex-col items-center space-y-0.5">
                        <div className="w-7 h-7 rounded-xl bg-sky-500 flex items-center justify-center text-xs shadow-sm">📷</div>
                        <span className="truncate max-w-full opacity-80 font-semibold text-[7.5px]">ক্যামেরা</span>
                      </div>

                      {/* OUR MADRASAH PWA COMPONENT */}
                      <div className="flex flex-col items-center space-y-0.5 relative col-span-3 py-1 bg-white/10 rounded-2xl border border-amber-400/30 shadow-xs animate-pulse">
                        <div className="absolute -top-1 -right-0.5 bg-red-600 text-white font-bold text-[7px] rounded-full w-4 h-4 flex items-center justify-center shadow-md animate-bounce">১</div>
                        
                        {/* Real SVG Logo Thumbnail */}
                        <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-amber-400 flex items-center justify-center shadow-lg pointer-events-none shrink-0 overflow-hidden">
                          <img src="/public/logo.svg" className="w-6 h-6 object-contain" alt="M" referrerPolicy="no-referrer" />
                        </div>
                        <span className="font-extrabold text-[8px] text-amber-300 drop-shadow-md truncate max-w-[90px] leading-tight block">{madrasahName}</span>
                        <div className="text-[6px] bg-emerald-600/95 text-white px-1 py-0.2 rounded-full font-bold">হোম শর্টকাট</div>
                      </div>

                    </div>

                    {/* Phone Desktop Dock area */}
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-1 grid grid-cols-3 gap-1 text-center shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-650 flex items-center justify-center mx-auto shadow-inner text-[10px]">💬</div>
                      <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center mx-auto shadow-inner text-[10px]">🗺️</div>
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center mx-auto shadow-inner text-[10px]">🧭</div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Action trigger: Dynamic installation or helper instructions */}
              {deferredPrompt ? (
                <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl text-center space-y-2 shrink-0">
                  <h5 className="font-extrabold text-emerald-900 text-sm">সরাসরি যুক্ত করার অপশন উপলব্ধ!</h5>
                  <p className="text-[11px] text-emerald-800">আপনার ডিভাইসটি সরাসরি শর্টকাট ইনস্টল করার সুবিধা সমর্থন করে। নিচের বোতামে চাপ দিন:</p>
                  
                  <button
                    onClick={async () => {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                          setIsSuccessfullyInstalled(true);
                          setDeferredPrompt(null);
                        }
                      }
                    }}
                    className="w-full sm:w-auto bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl border border-emerald-600 shadow-md transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer animate-bounce text-xs"
                  >
                    <Download size={13} className="text-white shrink-0 animate-pulse" />
                    <span>আমার হোম স্ক্রিনে লোগো সহ যুক্ত করুন</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Detailed Step-by-Step Instructions Tabs */}
                  <div className="bg-emerald-50/40 border border-emerald-150 rounded-2xl p-4">
                    <h5 className="font-extrabold text-slate-800 text-xs mb-3 text-center border-b pb-2 border-emerald-100">ইনস্টল করার সহজ নির্দেশনাবলী:</h5>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-white/95 border border-emerald-200/50 p-3 rounded-2xl text-center space-y-1">
                        <span className="font-extrabold text-[11px] text-emerald-800 flex items-center justify-center gap-1 leading-none select-none">
                          🤖 অ্যান্ড্রয়েড (Chrome)
                        </span>
                        <div className="text-[10px] text-slate-550 pt-1 text-left space-y-1.5 leading-normal">
                          <p><b className="text-emerald-700 font-mono">১.</b> উপরে ডান কোণার <b>তিনটি ডট (⋮)</b> অপশনে ট্যাপ করুন।</p>
                          <p><b className="text-emerald-700 font-mono">২.</b> <b>"Add to Home screen"</b> বা <b>"ইনস্টল করুন"</b> লেখাতে দিন।</p>
                          <p><b className="text-emerald-700 font-mono">৩.</b> মাদ্রাসা লোগো সহ শর্টকাটটি স্ক্রিনে যুক্ত হবে!</p>
                        </div>
                      </div>

                      <div className="bg-white/95 border border-emerald-200/50 p-3 rounded-2xl text-center space-y-1">
                        <span className="font-extrabold text-[11px] text-emerald-800 flex items-center justify-center gap-1 leading-none select-none">
                          🍎 আইফোন (Safari)
                        </span>
                        <div className="text-[10px] text-slate-550 pt-1 text-left space-y-1.5 leading-normal">
                          <p><b className="text-emerald-700 font-mono">১.</b> নিচে থাকা <b>শেয়ার (Share)</b> আইকনে চাপ দিন।</p>
                          <p><b className="text-emerald-700 font-mono">২.</b> একটু স্ক্রল করে <b>"Add to Home Screen"</b> লেখাটি ট্যাপ করুন।</p>
                          <p><b className="text-emerald-700 font-mono">৩.</b> উপরে ডান কোণার <b>"Add"</b> দিলে লোগো সহ সেট হবে!</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[9.5px] text-slate-400 text-center leading-normal mt-3 font-sans">
                      নোট: যেকোনো ব্রাউজার থেকেই এই শর্টকাট হোম স্ক্রিনে সেট করলে কোনো ইন্টারনেট লোডিং ছাড়াই মূল অ্যাপের মত দ্রুত ব্যবহার করতে পারবেন।
                    </p>
                  </div>
                </div>
              )}

              {isSuccessfullyInstalled && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center font-bold text-emerald-800 animate-pulse text-[10px]">
                  ✓ অভিনন্দন! শর্টকাট ইনস্টলেশন প্রক্রিয়া সফল হয়েছে এবং আপনার হোম স্ক্রিনে মাদ্রাসা লোগোটি যুক্ত হয়েছে।
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="text-[9px] text-slate-400 font-bold font-sans">সংস্করণ ৪.৩.০ • {madrasahName}</span>
              <button
                onClick={() => setIsShortcutModalOpen(false)}
                className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold py-2 px-6 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
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
