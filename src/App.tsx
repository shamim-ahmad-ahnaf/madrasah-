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
  SMSLog,
  AppNotification
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
import NotificationCenter from './components/NotificationCenter';
import OwnerAuthModal from './components/OwnerAuthModal';
import { realtimeSync, playNotificationChime } from './services/realtimeSync';

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
  Lock,
  Unlock,
  Radio,
  ShieldCheck,
  KeyRound,
  Check,
  RefreshCw,
  Laptop,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function App() {
  // Multi-Device Real-Time Sync & Refresh States
  const [syncStatus, setSyncStatus] = useState<{ connected: boolean; syncing: boolean; lastSyncTime: string }>({
    connected: true,
    syncing: false,
    lastSyncTime: 'এখনই'
  });
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [currentDeviceName, setCurrentDeviceName] = useState(() => realtimeSync.getDeviceName());
  const [tempDeviceName, setTempDeviceName] = useState('');

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
  
  // Settings & Master Password Modal States
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem('madrasah_admin_password') || 'admin123';
  });

  // Password Change Form inside Settings
  const [changePassCurrent, setChangePassCurrent] = useState('');
  const [changePassNew, setChangePassNew] = useState('');
  const [changePassConfirm, setChangePassConfirm] = useState('');
  const [changePassMessage, setChangePassMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Mobile menu control
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Direct modal trigger states (from Dashboard quick links)
  const [triggerStudentModal, setTriggerStudentModal] = useState(false);
  const [triggerPaymentModal, setTriggerPaymentModal] = useState<boolean | string>(false);

  // Core Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);

  // Real-Time Notifications State with strict deduplication
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('madrasah_notifications');
      if (stored) {
        const parsed: AppNotification[] = JSON.parse(stored);
        const map = new Map<string, AppNotification>();
        parsed.forEach((n) => {
          if (n && n.id && !map.has(n.id)) {
            map.set(n.id, n);
          }
        });
        const deduplicated = Array.from(map.values());
        localStorage.setItem('madrasah_notifications', JSON.stringify(deduplicated));
        return deduplicated;
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const [currentToast, setCurrentToast] = useState<AppNotification | null>(null);

  // Helper to safely add or update notifications with guaranteed zero duplicate keys
  const addOrUpdateNotification = (notif: AppNotification) => {
    setNotifications((prev) => {
      const map = new Map<string, AppNotification>();
      map.set(notif.id, notif);
      prev.forEach((n) => {
        if (n && n.id && !map.has(n.id)) {
          map.set(n.id, n);
        }
      });
      const updated = Array.from(map.values()).slice(0, 100);
      try {
        localStorage.setItem('madrasah_notifications', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    setCurrentToast(notif);
    playNotificationChime();
  };

  // Owner Password Authorization State
  const checkIsOwnerAuthorized = (): boolean => {
    try {
      const expire = localStorage.getItem('madrasah_owner_auth_expire');
      if (expire && parseInt(expire, 10) > Date.now()) {
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  };

  const [isOwnerAuthorized, setIsOwnerAuthorized] = useState<boolean>(checkIsOwnerAuthorized);
  const [isOwnerAuthModalOpen, setIsOwnerAuthModalOpen] = useState(false);
  const [pendingOwnerAction, setPendingOwnerAction] = useState<{
    title: string;
    description: string;
    actionButtonText?: string;
    action: () => void;
  } | null>(null);

  // PWA & Home Screen shortcut state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isSuccessfullyInstalled, setIsSuccessfullyInstalled] = useState(false);

  // Helper to require owner password before executing any final change
  const requireOwnerAuth = (
    title: string,
    description: string,
    onAuthorized: () => void,
    actionButtonText = 'অনুমোদন ও ফাইনাল করুন'
  ) => {
    if (checkIsOwnerAuthorized()) {
      setIsOwnerAuthorized(true);
      onAuthorized();
      return;
    }

    setPendingOwnerAction({
      title,
      description,
      actionButtonText,
      action: () => {
        setIsOwnerAuthorized(true);
        onAuthorized();
      }
    });
    setIsOwnerAuthModalOpen(true);
  };

  // Lock owner mode immediately
  const handleLockOwnerMode = () => {
    localStorage.removeItem('madrasah_owner_auth_expire');
    setIsOwnerAuthorized(false);
    const lockToast: AppNotification = {
      id: `notif_${Date.now()}`,
      title: 'মালিক মোড লক করা হয়েছে',
      message: 'এখন যেকোনো পরিবর্তন ফাইনাল করার জন্য মালিকের পাসওয়ার্ড আবশ্যক হবে।',
      module: 'settings',
      type: 'info',
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setCurrentToast(lockToast);
  };

  // Toast Auto-Dismiss
  useEffect(() => {
    if (currentToast) {
      const timer = setTimeout(() => {
        setCurrentToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentToast]);

  // Check auth expiration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOwnerAuthorized(checkIsOwnerAuthorized());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // PWA Prompt Listeners
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

  // Subscribe to multi-device sync status
  useEffect(() => {
    const unsubStatus = realtimeSync.subscribeStatus((status) => {
      setSyncStatus(status);
    });
    return () => unsubStatus();
  }, []);

  // Initial load effect and instant multi-device server synchronization
  useEffect(() => {
    // 1. Immediate read from localStorage for instant initial UI rendering
    const storedStudents = localStorage.getItem('madrasah_students');
    if (storedStudents) {
      try { setStudents(JSON.parse(storedStudents)); } catch (e) {}
    } else {
      setStudents(initialStudents);
      localStorage.setItem('madrasah_students', JSON.stringify(initialStudents));
    }

    const storedTeachers = localStorage.getItem('madrasah_teachers');
    if (storedTeachers) {
      try { setTeachers(JSON.parse(storedTeachers)); } catch (e) {}
    } else {
      setTeachers(initialTeachers);
      localStorage.setItem('madrasah_teachers', JSON.stringify(initialTeachers));
    }

    const storedAttendance = localStorage.getItem('madrasah_attendance');
    if (storedAttendance) {
      try { setAttendance(JSON.parse(storedAttendance)); } catch (e) {}
    }

    const storedPayments = localStorage.getItem('madrasah_payments');
    if (storedPayments) {
      try { setPayments(JSON.parse(storedPayments)); } catch (e) {}
    } else {
      setPayments(initialPayments);
      localStorage.setItem('madrasah_payments', JSON.stringify(initialPayments));
    }

    const storedSchedules = localStorage.getItem('madrasah_schedules');
    if (storedSchedules) {
      try { setSchedules(JSON.parse(storedSchedules)); } catch (e) {}
    } else {
      setSchedules(initialSchedules);
      localStorage.setItem('madrasah_schedules', JSON.stringify(initialSchedules));
    }

    const storedNotices = localStorage.getItem('madrasah_notices');
    if (storedNotices) {
      try { setNotices(JSON.parse(storedNotices)); } catch (e) {}
    } else {
      setNotices(initialNotices);
      localStorage.setItem('madrasah_notices', JSON.stringify(initialNotices));
    }

    const storedSms = localStorage.getItem('madrasah_sms_logs');
    if (storedSms) {
      try { setSmsLogs(JSON.parse(storedSms)); } catch (e) {}
    }

    // Notifications initial seeding if empty
    const storedNotifs = localStorage.getItem('madrasah_notifications');
    if (!storedNotifs || storedNotifs === '[]') {
      const defaultNotifs: AppNotification[] = [
        {
          id: 'notif_welcome_live',
          title: 'স্বাগতম! লাইভ নোটিফিকেশন ও সিঙ্ক সক্রিয় 🟢',
          message: 'যেকোনো ডিভাইস (ল্যাপটপ/মোবাইল) হতে ডাটা এন্ট্রি বা ডিলিট হলে তৎক্ষণাৎ অন্য সকল ডিভাইসে সিঙ্ক হবে।',
          module: 'general',
          type: 'info',
          timestamp: new Date().toISOString(),
          isRead: false
        },
        {
          id: 'notif_welcome_security',
          title: 'মালিক পাসওয়ার্ড সুরক্ষা চালু 🔐',
          message: 'যেকোনো পরিবর্তন ফাইনাল করার জন্য মালিকের পাসওয়ার্ড আবশ্যক (ডিফল্ট: admin123)।',
          module: 'settings',
          type: 'info',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          isRead: false
        }
      ];
      setNotifications(defaultNotifs);
      localStorage.setItem('madrasah_notifications', JSON.stringify(defaultNotifs));
    }

    // 2. Fetch authoritative fresh state from server immediately (handles mobile refresh & load)
    const pullInitialServerData = async () => {
      const res = await realtimeSync.forceRefresh();
      if (res.success && res.data) {
        const d = res.data;
        if (Array.isArray(d.madrasah_students)) setStudents(d.madrasah_students);
        if (Array.isArray(d.madrasah_teachers)) setTeachers(d.madrasah_teachers);
        if (Array.isArray(d.madrasah_payments)) setPayments(d.madrasah_payments);
        if (Array.isArray(d.madrasah_attendance)) setAttendance(d.madrasah_attendance);
        if (Array.isArray(d.madrasah_schedules)) setSchedules(d.madrasah_schedules);
        if (Array.isArray(d.madrasah_notices)) setNotices(d.madrasah_notices);
        if (Array.isArray(d.madrasah_sms_logs)) setSmsLogs(d.madrasah_sms_logs);
        if (d.madrasah_profile_name) setMadrasahName(d.madrasah_profile_name);
        if (d.madrasah_profile_slogan) setMadrasahSlogan(d.madrasah_profile_slogan);

        if (Array.isArray(d.notifications) && d.notifications.length > 0) {
          setNotifications((prev) => {
            const map = new Map<string, AppNotification>();
            d.notifications.forEach((n: AppNotification) => {
              if (n && n.id) map.set(n.id, n);
            });
            prev.forEach((n: AppNotification) => {
              if (n && n.id && !map.has(n.id)) map.set(n.id, n);
            });
            const updated = Array.from(map.values()).slice(0, 100);
            try {
              localStorage.setItem('madrasah_notifications', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
    };
    pullInitialServerData();

    // 3. Real-Time Multi-Device Listener Subscription
    const unsubscribe = realtimeSync.subscribe((event) => {
      // Bulk sync from server
      if (event.type === 'BULK_REFRESH_COMPLETE' && event.entries) {
        const d = event.entries;
        if (Array.isArray(d.madrasah_students)) setStudents(d.madrasah_students);
        if (Array.isArray(d.madrasah_teachers)) setTeachers(d.madrasah_teachers);
        if (Array.isArray(d.madrasah_payments)) setPayments(d.madrasah_payments);
        if (Array.isArray(d.madrasah_attendance)) setAttendance(d.madrasah_attendance);
        if (Array.isArray(d.madrasah_schedules)) setSchedules(d.madrasah_schedules);
        if (Array.isArray(d.madrasah_notices)) setNotices(d.madrasah_notices);
        if (Array.isArray(d.madrasah_sms_logs)) setSmsLogs(d.madrasah_sms_logs);
        if (d.madrasah_profile_name) setMadrasahName(d.madrasah_profile_name);
        if (d.madrasah_profile_slogan) setMadrasahSlogan(d.madrasah_profile_slogan);
      }

      // Individual key sync
      if (event.key === 'madrasah_students' && Array.isArray(event.data)) {
        setStudents(event.data);
      } else if (event.key === 'madrasah_teachers' && Array.isArray(event.data)) {
        setTeachers(event.data);
      } else if (event.key === 'madrasah_payments' && Array.isArray(event.data)) {
        setPayments(event.data);
      } else if (event.key === 'madrasah_attendance' && Array.isArray(event.data)) {
        setAttendance(event.data);
      } else if (event.key === 'madrasah_schedules' && Array.isArray(event.data)) {
        setSchedules(event.data);
      } else if (event.key === 'madrasah_notices' && Array.isArray(event.data)) {
        setNotices(event.data);
      } else if (event.key === 'madrasah_sms_logs' && Array.isArray(event.data)) {
        setSmsLogs(event.data);
      } else if (event.key === 'madrasah_profile_name') {
        setMadrasahName(event.data);
      } else if (event.key === 'madrasah_profile_slogan') {
        setMadrasahSlogan(event.data);
      }

      // Notifications from other devices, tabs, or local
      if (event.notification) {
        addOrUpdateNotification(event.notification);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle manual 1-click full database refresh across devices
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const res = await realtimeSync.forceRefresh();
      if (res.success && res.data) {
        const d = res.data;
        if (Array.isArray(d.madrasah_students)) setStudents(d.madrasah_students);
        if (Array.isArray(d.madrasah_teachers)) setTeachers(d.madrasah_teachers);
        if (Array.isArray(d.madrasah_payments)) setPayments(d.madrasah_payments);
        if (Array.isArray(d.madrasah_attendance)) setAttendance(d.madrasah_attendance);
        if (Array.isArray(d.madrasah_schedules)) setSchedules(d.madrasah_schedules);
        if (Array.isArray(d.madrasah_notices)) setNotices(d.madrasah_notices);
        if (Array.isArray(d.madrasah_sms_logs)) setSmsLogs(d.madrasah_sms_logs);
        if (d.madrasah_profile_name) setMadrasahName(d.madrasah_profile_name);
        if (d.madrasah_profile_slogan) setMadrasahSlogan(d.madrasah_profile_slogan);

        const refreshedToast: AppNotification = {
          id: `notif_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: 'ডাটাবেজ রিফ্রেশ সম্পন্ন 🔄',
          message: 'সার্ভার ও অন্যান্য ডিভাইসের সর্বশেষ ডাটা সফলভাবে সিঙ্ক হয়েছে।',
          module: 'general',
          type: 'info',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        addOrUpdateNotification(refreshedToast);
      } else {
        const errToast: AppNotification = {
          id: `notif_err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: 'রিফ্রেশ সতর্কতা ⚠️',
          message: res.error || 'সার্ভার থেকে ডাটা আনতে সমস্যা হয়েছে।',
          module: 'general',
          type: 'info',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        addOrUpdateNotification(errToast);
      }
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 500);
    }
  };

  // Device Name management
  const handleOpenDeviceModal = () => {
    setTempDeviceName(realtimeSync.getDeviceName());
    setIsDeviceModalOpen(true);
  };

  const handleSaveDeviceName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempDeviceName.trim()) {
      realtimeSync.setDeviceName(tempDeviceName.trim());
      setCurrentDeviceName(tempDeviceName.trim());
      setIsDeviceModalOpen(false);
      const toast: AppNotification = {
        id: `notif_dev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: 'ডিভাইসের নাম সংরক্ষিত 💻',
        message: `এই ডিভাইসের নাম নির্ধারণ করা হয়েছে: "${tempDeviceName.trim()}"`,
        module: 'settings',
        type: 'info',
        timestamp: new Date().toISOString(),
        isRead: false
      };
      addOrUpdateNotification(toast);
    }
  };

  // CRUD Operations handlers with Owner Password Protection and Multi-Device Real-time Sync
  // 1. Students
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    requireOwnerAuth(
      'নতুন শিক্ষার্থী ভর্তি অনুমোদন',
      `শিক্ষার্থী "${studentData.name}" এর ভর্তি নিশ্চিত ও ডাটাবেজে ফাইনাল করতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const newStudent: Student = {
          ...studentData,
          id: 'st-' + Math.random().toString(36).substr(2, 9)
        };
        const updatedList = [newStudent, ...students];
        setStudents(updatedList);
        
        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_students', updatedList, {
          title: 'নতুন শিক্ষার্থী ভর্তি সম্পন্ন 🎓',
          message: `🔐 [${deviceName}] হতে "${newStudent.name}" (রোল: ${newStudent.roll}, শ্রেণী: ${newStudent.gradeClass}) ভর্তি অনুমোদন ও ডাটাবেজে যুক্ত করা হয়েছে।`,
          module: 'student',
          type: 'create'
        });
      }
    );
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    requireOwnerAuth(
      'শিক্ষার্থীর তথ্য পরিবর্তন অনুমোদন',
      `শিক্ষার্থী "${updatedStudent.name}" এর তথ্য পরিবর্তন ফাইনাল করার জন্য মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const updatedList = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        setStudents(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_students', updatedList, {
          title: 'শিক্ষার্থী তথ্য সংশোধিত 📝',
          message: `🔐 [${deviceName}] হতে শিক্ষার্থী "${updatedStudent.name}" এর তথ্য পরিবর্তন অনুমোদিত হয়েছে।`,
          module: 'student',
          type: 'update'
        });
      }
    );
  };

  const handleDeleteStudent = (id: string) => {
    const studentToDelete = students.find(s => s.id === id);
    requireOwnerAuth(
      'শিক্ষার্থী মুছে ফেলা অনুমোদন',
      `শিক্ষার্থী "${studentToDelete?.name || ''}" এর রেকর্ড স্থায়ীভাবে মুছে ফেলতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const updatedList = students.filter(s => s.id !== id);
        setStudents(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_students', updatedList, {
          title: 'শিক্ষার্থী রেকর্ড অপসারিত 🗑️',
          message: `🔐 [${deviceName}] এ মালিক পাসওয়ার্ড দিয়ে "${studentToDelete?.name || 'শিক্ষার্থী'}" এর রেকর্ড তালিকা হতে মুছে ফেলা হয়েছে।`,
          module: 'student',
          type: 'delete'
        });
      },
      'মুছে ফেলা নিশ্চিত করুন'
    );
  };

  // 2. Teachers
  const handleAddTeacher = (teacherData: Omit<Teacher, 'id'>) => {
    requireOwnerAuth(
      'নতুন শিক্ষক নিয়োগ অনুমোদন',
      `উস্তাদ "${teacherData.name}" এর তথ্য যুক্ত ও ফাইনাল করার জন্য মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const newTeacher: Teacher = {
          ...teacherData,
          id: 'tc-' + Math.random().toString(36).substr(2, 9)
        };
        const updatedList = [newTeacher, ...teachers];
        setTeachers(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_teachers', updatedList, {
          title: 'নতুন শিক্ষক যুক্ত হয়েছেন 👨‍🏫',
          message: `🔐 [${deviceName}] হতে উস্তাদ "${newTeacher.name}" (${newTeacher.designation}) এর নিয়োগ অনুমোদন করা হয়েছে।`,
          module: 'teacher',
          type: 'create'
        });
      }
    );
  };

  const handleUpdateTeacher = (updatedTeacher: Teacher) => {
    requireOwnerAuth(
      'শিক্ষকের তথ্য হালনাগাদ অনুমোদন',
      `উস্তাদ "${updatedTeacher.name}" এর তথ্য সংরক্ষণ করতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const updatedList = teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t);
        setTeachers(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_teachers', updatedList, {
          title: 'শিক্ষক তথ্য হালনাগাদ 📝',
          message: `🔐 [${deviceName}] হতে উস্তাদ "${updatedTeacher.name}" এর তথ্য পরিবর্তন অনুমোদিত হয়েছে।`,
          module: 'teacher',
          type: 'update'
        });
      }
    );
  };

  const handleDeleteTeacher = (id: string) => {
    const teacherToDelete = teachers.find(t => t.id === id);
    requireOwnerAuth(
      'শিক্ষক তথ্য মুছে ফেলার অনুমোদন',
      `উস্তাদ "${teacherToDelete?.name || ''}" এর প্রোফাইল মুছে ফেলতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const updatedList = teachers.filter(t => t.id !== id);
        setTeachers(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_teachers', updatedList, {
          title: 'শিক্ষক রেকর্ড অপসারিত 🗑️',
          message: `🔐 [${deviceName}] এ মালিক পাসওয়ার্ড দিয়ে উস্তাদ "${teacherToDelete?.name || 'শিক্ষক'}" এর রেকর্ড মুছে ফেলা হয়েছে।`,
          module: 'teacher',
          type: 'delete'
        });
      },
      'মুছে ফেলা নিশ্চিত করুন'
    );
  };

  // Core SMS helpers
  const handleAddSmsLogs = (newLogs: SMSLog[]) => {
    const updated = [...newLogs, ...smsLogs];
    setSmsLogs(updated);
    realtimeSync.syncChange('madrasah_sms_logs', updated, {
      title: 'এসএমএস বার্তা প্রেরিত',
      message: `${newLogs.length} টি বার্তা সফলভাবে তৈরি করা হয়েছে।`,
      module: 'general',
      type: 'info'
    });
  };

  const handleClearSmsLogs = () => {
    requireOwnerAuth(
      'এসএমএস লগ মোছার অনুমোদন',
      'সকল এসএমএস লগ মুছে ফেলতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        setSmsLogs([]);
        realtimeSync.syncChange('madrasah_sms_logs', [], {
          title: 'এসএমএস লগ সাফ করা হয়েছে',
          message: 'সকল বার্তা হিস্ট্রি মুছে ফেলা হয়েছে।',
          module: 'general',
          type: 'delete'
        });
      }
    );
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
    const updated = [reminderSms, ...smsLogs];
    setSmsLogs(updated);
    realtimeSync.syncChange('madrasah_sms_logs', updated, {
      title: 'বেতন তাগাদা এসএমএস তৈরি',
      message: `${student.name} এর অভিভাবকের কাছে ফি রিমাইন্ডার প্রস্তুত হয়েছে।`,
      module: 'finance',
      type: 'info'
    });
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
    realtimeSync.syncChange('madrasah_sms_logs', updated, {
      title: 'নোটিশ এসএমএস ব্রডকাস্ট',
      message: `নোটিশ "${notice.title}" শিক্ষার্থীদের মাঝে প্রেরিত হয়েছে।`,
      module: 'notice',
      type: 'info'
    });
  };

  // 3. Attendance Save/Override
  const handleSaveAttendance = (newRecords: Omit<AttendanceRecord, 'id'>[], sendSMS: boolean) => {
    requireOwnerAuth(
      'দৈনিক হাজিরা সংরক্ষণ অনুমোদন',
      'আজকের হাজিরা খাতা নিশ্চিত ও সংরক্ষণ করতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        const incomingWithIds: AttendanceRecord[] = newRecords.map(rec => ({
          ...rec,
          id: 'att-' + Math.random().toString(36).substr(2, 9)
        }));

        const firstRec = newRecords[0];
        let filteredPrev = [...attendance];
        if (firstRec) {
          filteredPrev = attendance.filter(
            r => !(r.date === firstRec.date && r.gradeClass === firstRec.gradeClass)
          );
        }

        const finalAttendance = [...filteredPrev, ...incomingWithIds];
        setAttendance(finalAttendance);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_attendance', finalAttendance, {
          title: 'হাজিরা খাতা সংরক্ষিত 📋',
          message: `🔐 [${deviceName}] হতে ${firstRec ? firstRec.gradeClass + ' এর ' : ''}${firstRec?.date || 'আজকের'} হাজিরা অনুমোদন ও ক্লাউডে সংরক্ষণ করা হয়েছে।`,
          module: 'attendance',
          type: 'update'
        });

        // Trigger SMS for absentees if enabled
        if (sendSMS && firstRec) {
          const bkBDate = new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
          const absenteeLogs: SMSLog[] = incomingWithIds
            .filter(r => r.status === 'অনুপস্থিত')
            .map(rec => {
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
                message: `আস-সালামু আলাইকুম। আপনার সন্তান ${rec.studentName} আজ (${firstRec.date}) মাদ্রাসায় অনুপস্থিত রয়েছে। জরুরি প্রয়োজনে মুহতামিমের সাথে যোগাযোগ করুন। - দারুল উলুম মাদ্রাসা`,
                status: 'সফল (Success)'
              };
            });

          if (absenteeLogs.length > 0) {
            const updatedSms = [...absenteeLogs, ...smsLogs];
            setSmsLogs(updatedSms);
            realtimeSync.syncChange('madrasah_sms_logs', updatedSms, {
              title: 'অনুপস্থিতি এসএমএস প্রেরিত',
              message: `${absenteeLogs.length} জন অনুপস্থিত শিক্ষার্থীর অভিভাবককে বার্তা পাঠানো হয়েছে।`,
              module: 'attendance',
              type: 'info'
            });
          }
        }
      }
    );
  };

  // 4. Financial Fee Payments
  const handleAddPayment = (paymentData: Omit<FeePayment, 'id'>) => {
    requireOwnerAuth(
      'ফি আদায় ও রসিদ অনুমোদন',
      `${paymentData.studentName} এর ৳${paymentData.amount} টাকা ফি গ্রহণ নিশ্চিত ও ফাইনাল করতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const newPayment: FeePayment = {
          ...paymentData,
          id: 'pay-' + Math.random().toString(36).substr(2, 9)
        };
        const updatedList = [newPayment, ...payments];
        setPayments(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_payments', updatedList, {
          title: 'নতুন ফি আদায় সম্পন্ন 💵',
          message: `🔐 [${deviceName}] হতে ${paymentData.studentName} (${paymentData.gradeClass}) এর ${paymentData.payingMonth} মাসের ৳${paymentData.amount} টাকা ফি আদায় অনুমোদন হয়েছে।`,
          module: 'finance',
          type: 'create'
        });

        // Trigger SMS Receipt
        const studentObj = students.find(s => s.id === paymentData.studentId);
        const bkBDate = new Date().toLocaleDateString('bn-BD') + ' ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
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
        const updatedSms = [paymentSms, ...smsLogs];
        setSmsLogs(updatedSms);
        realtimeSync.syncChange('madrasah_sms_logs', updatedSms, {
          title: 'পেমেন্ট রশিদ এসএমএস',
          message: `${paymentData.studentName} এর ফি জমার রশিদ প্রস্তুত হয়েছে।`,
          module: 'finance',
          type: 'info'
        });
      }
    );
  };

  const handleDeletePayment = (id: string) => {
    const paymentToDelete = payments.find(p => p.id === id);
    requireOwnerAuth(
      'ফি রসিদ মুছে ফেলার অনুমোদন',
      `রসিদ নং "${paymentToDelete?.id || ''}" (৳${paymentToDelete?.amount || 0}) মুছে ফেলার জন্য মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const updatedList = payments.filter(p => p.id !== id);
        setPayments(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_payments', updatedList, {
          title: 'ফি রসিদ মুছে ফেলা হয়েছে 🗑️',
          message: `🔐 [${deviceName}] এ মালিকের পাসওয়ার্ড অনুমোদন সাপেক্ষে ${paymentToDelete?.studentName || ''} এর ৳${paymentToDelete?.amount || 0} টাকার ফি রসিদ অপসারিত হয়েছে।`,
          module: 'finance',
          type: 'delete'
        });
      },
      'মুছে ফেলা নিশ্চিত করুন'
    );
  };

  // 5. Schedules Routines
  const handleAddSchedule = (scheduleData: Omit<ClassSchedule, 'id'>) => {
    requireOwnerAuth(
      'শ্রেণী রুটিন যোগ অনুমোদন',
      'শ্রেণী রুটিনে নতুন পিরিয়ড যুক্ত করতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        const newSchedule: ClassSchedule = {
          ...scheduleData,
          id: 'sch-' + Math.random().toString(36).substr(2, 9)
        };
        const updatedList = [newSchedule, ...schedules];
        setSchedules(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_schedules', updatedList, {
          title: 'শ্রেণী রুটিন হালনাগাদ ⏰',
          message: `🔐 [${deviceName}] হতে ${newSchedule.gradeClass} এর জন্য "${newSchedule.subject}" ক্লাসের সময়সূচি অনুমোদিত ও যুক্ত হয়েছে।`,
          module: 'routine',
          type: 'create'
        });
      }
    );
  };

  const handleUpdateSchedule = (updatedSchedule: ClassSchedule) => {
    requireOwnerAuth(
      'রুটিন পরিবর্তন অনুমোদন',
      'রুটিনের সময়সূচি পরিবর্তন নিশ্চিত করতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        const updatedList = schedules.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
        setSchedules(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_schedules', updatedList, {
          title: 'রুটিন সময়সূচি সংশোধিত ⏰',
          message: `🔐 [${deviceName}] হতে ${updatedSchedule.gradeClass} এর "${updatedSchedule.subject}" ক্লাসের সময় পরিবর্তন অনুমোদিত হয়েছে।`,
          module: 'routine',
          type: 'update'
        });
      }
    );
  };

  const handleDeleteSchedule = (id: string) => {
    requireOwnerAuth(
      'রুটিন পিরিয়ড মুছে ফেলার অনুমোদন',
      'রুটিন হতে এই পিরিয়ড মুছে ফেলতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        const updatedList = schedules.filter(s => s.id !== id);
        setSchedules(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_schedules', updatedList, {
          title: 'রুটিন পিরিয়ড অপসারিত 🗑️',
          message: `🔐 [${deviceName}] এ মালিক পাসওয়ার্ড দিয়ে রুটিন হতে একটি পিরিয়ড মুছে ফেলা হয়েছে।`,
          module: 'routine',
          type: 'delete'
        });
      },
      'মুছে ফেলা নিশ্চিত করুন'
    );
  };

  // 6. Public Notices
  const handleAddNotice = (noticeData: Omit<Notice, 'id'>) => {
    requireOwnerAuth(
      'নতুন নোটিশ প্রকাশ অনুমোদন',
      `নোটিশ "${noticeData.title}" প্রকাশ করতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const newNotice: Notice = {
          ...noticeData,
          id: 'nt-' + Math.random().toString(36).substr(2, 9)
        };
        const updatedList = [newNotice, ...notices];
        setNotices(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_notices', updatedList, {
          title: 'নতুন নোটিশ প্রকাশিত 📢',
          message: `🔐 [${deviceName}] হতে বিজ্ঞপ্তি: "${newNotice.title}" সকল ডিভাইসে প্রকাশিত হয়েছে।`,
          module: 'notice',
          type: 'create'
        });
      }
    );
  };

  const handleUpdateNotice = (updatedNotice: Notice) => {
    requireOwnerAuth(
      'নোটিশ সংশোধন অনুমোদন',
      'বিজ্ঞপ্তির বিষয়বস্তু পরিবর্তন করতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        const updatedList = notices.map(n => n.id === updatedNotice.id ? updatedNotice : n);
        setNotices(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_notices', updatedList, {
          title: 'নোটিশ সংশোধিত হয়েছে 📢',
          message: `🔐 [${deviceName}] হতে বিজ্ঞপ্তি "${updatedNotice.title}" আপডেট করা হয়েছে।`,
          module: 'notice',
          type: 'update'
        });
      }
    );
  };

  const handleDeleteNotice = (id: string) => {
    requireOwnerAuth(
      'নোটিশ অপসারণ অনুমোদন',
      'নোটিশটি বোর্ড থেকে মুছে ফেলতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        const updatedList = notices.filter(n => n.id !== id);
        setNotices(updatedList);

        const deviceName = realtimeSync.getDeviceName();
        realtimeSync.syncChange('madrasah_notices', updatedList, {
          title: 'নোটিশ অপসারিত 🗑️',
          message: `🔐 [${deviceName}] এ মালিক পাসওয়ার্ড দিয়ে একটি নোটিশ বোর্ড হতে মুছে ফেলা হয়েছে।`,
          module: 'notice',
          type: 'delete'
        });
      },
      'মুছে ফেলা নিশ্চিত করুন'
    );
  };

  // Database actions: Wiping and restoring
  const handleWipeDatabase = () => {
    requireOwnerAuth(
      'সমস্ত তথ্য সাফ করার চূড়ান্ত অনুমোদন',
      'মাদ্রাসার সমস্ত তথ্য স্থায়ীভাবে মুছে ফেলার জন্য মালিকের পাসওয়ার্ড দিন।',
      () => {
        localStorage.setItem('madrasah_students', '[]');
        localStorage.setItem('madrasah_teachers', '[]');
        localStorage.setItem('madrasah_attendance', '[]');
        localStorage.setItem('madrasah_payments', '[]');
        localStorage.setItem('madrasah_schedules', '[]');
        localStorage.setItem('madrasah_notices', '[]');
        localStorage.setItem('madrasah_sms_logs', '[]');
        
        setStudents([]);
        setTeachers([]);
        setAttendance([]);
        setPayments([]);
        setSchedules([]);
        setNotices([]);
        setSmsLogs([]);

        realtimeSync.syncChange('madrasah_students', [], {
          title: 'ডাটাবেজ সাফ করা হয়েছে',
          message: 'মালিক কর্তৃক সমস্ত রেকর্ড মুছে ফেলা হয়েছে।',
          module: 'general',
          type: 'delete'
        });
        
        window.location.reload();
      },
      'সম্পূর্ণ ডাটা মুছে ফেলুন'
    );
  };

  const handleRestoreDemoDatabase = () => {
    requireOwnerAuth(
      'ডিফল্ট ডাটা পুনরুদ্ধার অনুমোদন',
      'ডেমো ডাটা পুনরুদ্ধার করতে মালিকের পাসওয়ার্ড দিন।',
      () => {
        localStorage.removeItem('madrasah_students');
        localStorage.removeItem('madrasah_teachers');
        localStorage.removeItem('madrasah_attendance');
        localStorage.removeItem('madrasah_payments');
        localStorage.removeItem('madrasah_schedules');
        localStorage.removeItem('madrasah_notices');
        localStorage.removeItem('madrasah_sms_logs');
        window.location.reload();
      }
    );
  };

  // Change Owner Master Password in Settings
  const handleChangeOwnerPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePassNew !== changePassConfirm) {
      setChangePassMessage({ text: 'নতুন পাসওয়ার্ড দুটি মেলেনি!', isError: true });
      return;
    }
    if (changePassNew.length < 4) {
      setChangePassMessage({ text: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!', isError: true });
      return;
    }

    const res = await realtimeSync.changeOwnerPassword(changePassCurrent, changePassNew);
    if (res.success) {
      setAdminPassword(changePassNew);
      setChangePassMessage({ text: 'মালিকের পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!', isError: false });
      setChangePassCurrent('');
      setChangePassNew('');
      setChangePassConfirm('');
      setTimeout(() => setChangePassMessage(null), 4000);
    } else {
      setChangePassMessage({ text: res.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে!', isError: true });
    }
  };

  // Notification actions
  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem('madrasah_notifications', JSON.stringify(updated));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('madrasah_notifications', JSON.stringify([]));
    fetch('/api/notifications/clear', { method: 'POST' }).catch(() => {});
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

  const handleOpenSettings = () => {
    setIsPasswordPromptOpen(true);
    setPasswordInput('');
    setPasswordError('');
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
            madrasahName={madrasahName}
            madrasahSlogan={madrasahSlogan}
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
        return <div className="text-center py-10 font-sans">অনুপলব্ধ বিভাগ!</div>;
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
      <aside className="w-64 bg-emerald-900 text-white flex flex-col border-r border-emerald-800/50 shrink-0 hidden lg:flex font-sans">
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
                <h1 className="text-sm font-extrabold tracking-tight truncate leading-tight text-emerald-50">
                  {madrasahName}
                </h1>
                <p className="text-[10px] text-emerald-350 tracking-wider font-semibold uppercase">
                  ম্যানেজমেন্ট পোর্টাল
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleOpenSettings}
              className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200 hover:text-white transition-colors cursor-pointer shrink-0"
              title="মাস্টার সেটিংস ও প্রোফাইল"
              id="sidebar-settings-trigger"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3.5 space-y-1">
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
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-800 text-white font-bold shadow-md shadow-emerald-950/20' 
                    : 'text-emerald-100/90 hover:bg-emerald-800/40 hover:text-white'
                }`}
              >
                <IconComponent size={17} className={isActive ? 'text-white' : 'text-emerald-300'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer profile & server state details */}
        <div className="p-4 border-t border-emerald-800/50 space-y-2.5">
          {/* Add to Home Screen shortcut banner */}
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

          {/* Real-time Multi-Device Sync Indicator */}
          <div className="flex items-center justify-between bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-800/30 text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-emerald-200">লাইভ সিঙ্ক সক্রিয়</span>
            </div>
            <span className="text-[9px] text-emerald-350 font-mono">সকল ডিভাইসে</span>
          </div>

          <div className="flex items-center space-x-3 px-3 py-2 bg-emerald-950 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-sm font-sans select-none shrink-0">
              {adminName ? adminName.charAt(0) : 'এ'}
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-bold text-white leading-none truncate" title={adminName}>{adminName}</p>
              <p className="text-emerald-350 mt-1 text-[10px] truncate" title={adminTitle}>{adminTitle}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile nav header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-emerald-900 border-b border-emerald-800 text-white flex items-center justify-between px-3 sm:px-4 z-40 shadow-sm font-sans">
        <div className="flex items-center space-x-2 overflow-hidden">
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
          {/* Mobile Instant Refresh Button */}
          <button 
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition-colors cursor-pointer"
            title="ডাটাবেজ রিফ্রেশ করুন"
          >
            <RefreshCw size={15} className={isManualRefreshing ? 'animate-spin text-amber-300' : ''} />
          </button>

          {/* Mobile Device Name Chip */}
          <button
            onClick={handleOpenDeviceModal}
            className="flex items-center space-x-1 bg-emerald-950/70 text-emerald-200 px-2 py-1.5 rounded-lg text-[10px] font-bold border border-emerald-700/50 cursor-pointer"
            title="ডিভাইসের নাম ও সিঙ্ক তথ্য"
          >
            <Smartphone size={12} className="text-emerald-400 shrink-0" />
            <span className="truncate max-w-[75px]">{currentDeviceName}</span>
          </button>

          {/* Notification Center in Mobile */}
          <NotificationCenter
            notifications={notifications}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onClearAll={handleClearAllNotifications}
            currentToast={currentToast}
            onDismissToast={() => setCurrentToast(null)}
          />

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
      <div className={`fixed top-14 bottom-0 left-0 w-64 bg-emerald-900 text-white border-r border-emerald-800/40 z-50 lg:hidden transform transition-transform duration-300 ease-in-out font-sans ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="py-6 px-4 space-y-6 h-full flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] uppercase font-bold text-emerald-200/75 tracking-widest block">
                মূল মেন্যু
              </span>
              <span className="text-[9px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                লাইভ সিঙ্ক
              </span>
            </div>
            
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
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                  হোম স্ক্রিনে যোগ করুন <Plus size={11} className="text-amber-300 shrink-0" />
                </p>
                <p className="text-[9px] text-emerald-250 mt-0.5 leading-none font-medium">লোগো সহ অ্যাপ ব্যবহার করুন</p>
              </div>
            </button>
          </div>

          <div className="pt-4 border-t border-emerald-800/40 text-[10px] text-emerald-300 text-center select-none font-sans">
            {madrasahName} • স্বয়ংক্রিয় সিঙ্ক ও নোটিফিকেশন সিস্টেম
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0 font-sans">
        
        {/* Real Breadcrumb Header */}
        <header className="h-16 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs z-30">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
            <span className="hidden sm:inline">মূল পাতা</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-slate-900 font-bold bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md">
              {getTabLabelBangla(activeTab)}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Multi-Device Live Sync & Device Info Badge */}
            <button
              onClick={handleOpenDeviceModal}
              className="hidden sm:flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="ডিভাইসের নাম ও লাইভ সিঙ্ক তথ্য দেখতে ক্লিক করুন"
            >
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${syncStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${syncStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <Laptop size={13} className="text-emerald-700 shrink-0" />
              <span className="truncate max-w-[130px]">{currentDeviceName}</span>
              <span className="text-[9px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded-md font-extrabold ml-1">
                {syncStatus.connected ? 'লাইভ' : 'অফলাইন'}
              </span>
            </button>

            {/* Manual 1-Click Instant Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="flex items-center space-x-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/90 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-75"
              title="সার্ভার থেকে সমস্ত ডিভাইসের সর্বশেষ ডাটা এখনই রিফ্রেশ ও সিঙ্ক করুন"
            >
              <RefreshCw size={13} className={`text-sky-700 shrink-0 ${isManualRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isManualRefreshing ? 'সিঙ্ক হচ্ছে...' : 'রিফ্রেশ'}</span>
            </button>

            {/* Owner Security Status Badge (Lock / Unlock Toggle) */}
            {isOwnerAuthorized ? (
              <div className="flex items-center space-x-1.5 bg-emerald-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xs">
                <Unlock size={12} className="text-emerald-300" />
                <span className="hidden md:inline">মালিক মোড আনলক</span>
                <button
                  onClick={handleLockOwnerMode}
                  className="ml-1 text-emerald-200 hover:text-white font-extrabold underline text-[10px] cursor-pointer"
                  title="এখনই মালিক মোড লক করুন"
                >
                  (লক করুন)
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  requireOwnerAuth(
                    'মালিক মোড আনলক করুন',
                    'এই ডিভাইসে মালিকের এক্সেস ১৫ মিনিটের জন্য সক্রিয় করতে পাসওয়ার্ড দিন।',
                    () => {
                      const unlockToast: AppNotification = {
                        id: `notif_${Date.now()}`,
                        title: 'মালিক মোড আনলক হয়েছে',
                        message: 'পরবর্তী ১৫ মিনিট পাসওয়ার্ড ছাড়া যেকোনো পরিবর্তন সরাসরি ফাইনাল করা যাবে।',
                        module: 'settings',
                        type: 'info',
                        timestamp: new Date().toISOString(),
                        isRead: false
                      };
                      setNotifications(prev => [unlockToast, ...prev]);
                      setCurrentToast(unlockToast);
                      playNotificationChime();
                    },
                    'আনলক করুন'
                  );
                }}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                title="মালিকের অনুমোদন পাসওয়ার্ড দিয়ে মোড আনলক করুন"
              >
                <Lock size={12} className="text-slate-500" />
                <span className="hidden md:inline">লক করা</span>
                <span className="text-emerald-800 font-bold ml-0.5">আনলক</span>
              </button>
            )}

            {/* Centralized Notification Center in Desktop Header */}
            <div className="hidden lg:block">
              <NotificationCenter
                notifications={notifications}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
                onClearAll={handleClearAllNotifications}
                currentToast={currentToast}
                onDismissToast={() => setCurrentToast(null)}
              />
            </div>

            {/* Settings Trigger */}
            <button
              onClick={handleOpenSettings}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="মাদ্রাসা কন্ট্রোল প্যানেল"
              id="header-settings-trigger"
            >
              <Settings size={13} />
              <span className="hidden md:inline">সেটিংস</span>
            </button>

            {/* Quick Add Student */}
            <button 
              onClick={handleDashboardAddStudentTrigger}
              className="bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-900 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Users size={12} />
              <span className="hidden sm:inline">নতুন ছাত্র ভর্তি</span>
              <span className="sm:hidden">ভর্তি</span>
            </button>
          </div>
        </header>

        {/* Dynamic Interactive Workspace */}
        <div className="flex-1 bg-slate-50 overflow-y-auto px-4 py-6 md:p-6 lg:p-8">
          {renderActiveTabContent()}
        </div>
      </main>

      {/* Owner Confirmation Modal for any modification */}
      <OwnerAuthModal
        isOpen={isOwnerAuthModalOpen}
        onClose={() => {
          setIsOwnerAuthModalOpen(false);
          setPendingOwnerAction(null);
        }}
        onSuccess={() => {
          setIsOwnerAuthorized(true);
          if (pendingOwnerAction?.action) {
            pendingOwnerAction.action();
            setPendingOwnerAction(null);
          }
        }}
        title={pendingOwnerAction?.title}
        description={pendingOwnerAction?.description}
        actionButtonText={pendingOwnerAction?.actionButtonText}
      />

      {/* Password Verification Modal for Master Settings */}
      {isPasswordPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" id="password-prompt-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Settings size={18} className="text-emerald-300" />
                <h3 className="font-bold text-sm font-sans">অ্যাডমিন প্রবেশাধিকার নিয়ন্ত্রণ</h3>
              </div>
              <button 
                onClick={() => setIsPasswordPromptOpen(false)}
                className="text-white/80 hover:text-white bg-emerald-800 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const isValid = await realtimeSync.verifyOwnerPassword(passwordInput);
              if (isValid) {
                setIsPasswordPromptOpen(false);
                setIsSettingsModalOpen(true);
                setPasswordError('');
                setPasswordInput('');
              } else {
                setPasswordError('ভুল পাসওয়ার্ড! শুধুমাত্র মালিকের পাসওয়ার্ড দিয়ে প্রবেশ করতে পারবেন।');
              }
            }} className="p-6 space-y-4 text-slate-700 text-xs font-sans">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">মাস্টার সেটিংস লক</h4>
                <p className="text-[10px] text-slate-500 mt-1">মাদ্রাসার প্রাথমিক বিবরণী, লোগো বা মাস্টার পাসওয়ার্ড পরিবর্তন করতে মালিকের পাসওয়ার্ড দিন।</p>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">মালিকের পাসওয়ার্ড লিখুন:</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-center outline-none focus:border-emerald-600 transition-colors tracking-widest text-slate-800 font-bold font-mono text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="••••••••"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-rose-600 font-bold mt-1.5 text-center text-[10px]">{passwordError}</p>
                )}
                <p className="text-[9px] text-slate-400 mt-2.5 text-center leading-relaxed">
                  ডিফল্ট পাসওয়ার্ড: <span className="font-mono bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">admin123</span>
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
                  className="w-1/2 bg-emerald-800 hover:bg-emerald-900 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  প্রবেশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Madrasah Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" id="madrasah-settings-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-emerald-900 text-white p-4.5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Settings size={18} className="text-emerald-300" />
                <h3 className="font-bold text-sm font-sans">মাদ্রাসা প্রোফাইল ও মাস্টার সিকিউরিটি সেটিংস</h3>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-white/80 hover:text-white bg-emerald-800 hover:bg-emerald-700 p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs font-sans">
              
              {/* SPECIAL SECTION: Owner Password Changer */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center space-x-2">
                  <KeyRound size={16} className="text-emerald-800" />
                  <h4 className="font-black text-emerald-950 text-xs">
                    মালিকের মাস্টার পাসওয়ার্ড পরিবর্তন
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  এই পাসওয়ার্ডটি দিয়ে যেকোনো তথ্য ফাইনাল অনুমোদন করা হয়। শুধুমাত্র মালিক/মুহতামিম এই পাসওয়ার্ডটি জানবেন।
                </p>

                <form onSubmit={handleChangeOwnerPasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">বর্তমান পাসওয়ার্ড:</label>
                    <input
                      type="password"
                      value={changePassCurrent}
                      onChange={(e) => setChangePassCurrent(e.target.value)}
                      placeholder="বর্তমান পাসওয়ার্ড লিখুন..."
                      className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white outline-none focus:border-emerald-600 font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">নতুন পাসওয়ার্ড:</label>
                      <input
                        type="password"
                        value={changePassNew}
                        onChange={(e) => setChangePassNew(e.target.value)}
                        placeholder="নতুন পাসওয়ার্ড..."
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white outline-none focus:border-emerald-600 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">পাসওয়ার্ড নিশ্চিত করুন:</label>
                      <input
                        type="password"
                        value={changePassConfirm}
                        onChange={(e) => setChangePassConfirm(e.target.value)}
                        placeholder="পুনরায় লিখুন..."
                        className="w-full border border-slate-200 rounded-xl p-2 text-xs bg-white outline-none focus:border-emerald-600 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {changePassMessage && (
                    <div className={`p-2 rounded-xl text-[11px] font-bold ${changePassMessage.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                      {changePassMessage.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                  >
                    <Check size={14} />
                    <span>পাসওয়ার্ড আপডেট ও সংরক্ষণ করুন</span>
                  </button>
                </form>
              </div>

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
                      realtimeSync.syncChange('madrasah_profile_name', e.target.value, {
                        title: 'মাদ্রাসার নাম আপডেট',
                        message: `মাদ্রাসার নাম "${e.target.value}" হিসেবে হালনাগাদ করা হয়েছে।`,
                        module: 'settings',
                        type: 'update'
                      });
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
                      realtimeSync.syncChange('madrasah_profile_slogan', e.target.value, {
                        title: 'স্লোগান ও ঠিকানা আপডেট',
                        message: `স্লোগান "${e.target.value}" হিসেবে আপডেট করা হয়েছে।`,
                        module: 'settings',
                        type: 'update'
                      });
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
              </div>

              {/* Section 4: Data Actions */}
              <div className="space-y-3 bg-red-50/40 border border-red-150 rounded-2xl p-4 shrink-0 font-sans">
                <h5 className="font-bold text-red-800 flex items-center space-x-1.5">
                  <Trash2 size={13} className="shrink-0 text-red-650" />
                  <span>তথ্যসমূহ সাফকরণ ও কন্ট্রোল প্যানেল</span>
                </h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  মাদ্রাসার সমস্ত ডেমো ডাটা (শিক্ষার্থী, শিক্ষক, নোটিশ, রুটিন ইত্যাদি) এক ক্লিকে মুছে ফেলে কাজ শুরু করতে পারেন।
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

      {/* PWA Home Screen Shortcut Modal */}
      {isShortcutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" id="shortcut-helper-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col md:max-h-[92vh] max-h-[95vh]">
            
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-teal-950 text-white p-4 flex items-center justify-between shrink-0 border-b border-emerald-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-800 flex items-center justify-center border border-amber-400/40 animate-pulse">
                  <Smartphone size={15} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-sans tracking-wide">লোগো সহ হোম স্ক্রিনে যোগ করুন</h3>
                  <p className="text-[9px] text-emerald-300 leading-none mt-0.5 font-sans">মোবাইল বা পিসিতে ইনস্টল করুন</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShortcutModalOpen(false)}
                className="text-white/80 hover:text-white bg-emerald-800 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-slate-700 text-xs font-sans leading-relaxed">
              <div className="flex items-center space-x-4 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80">
                <div className="w-14 h-14 rounded-2xl bg-emerald-900 border-2 border-amber-400/70 shadow-md flex items-center justify-center shrink-0">
                  <img src="/public/logo.svg" className="w-10 h-10 object-contain" alt="App Icon" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">{madrasahName}</h4>
                  <p className="text-[11px] text-emerald-800 font-medium">অফিশিয়াল মাদ্রাসা ম্যানেজমেন্ট ওয়েব অ্যাপ</p>
                  <p className="text-[10px] text-slate-500 mt-1">সব ডিভাইসে স্বয়ংক্রিয় লাইভ সিঙ্ক সহ ইনস্টল হবে।</p>
                </div>
              </div>

              {deferredPrompt ? (
                <button
                  onClick={async () => {
                    deferredPrompt.prompt();
                    const choiceResult = await deferredPrompt.userChoice;
                    if (choiceResult.outcome === 'accepted') {
                      setIsSuccessfullyInstalled(true);
                      setDeferredPrompt(null);
                    }
                  }}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 text-xs cursor-pointer"
                >
                  <Plus size={16} />
                  <span>এখনই সরাসরি হোম স্ক্রিনে ইনস্টল করুন</span>
                </button>
              ) : (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h5 className="font-bold text-slate-800 text-xs">ম্যানুয়ালি হোম স্ক্রিনে যোগ করার নিয়ম:</h5>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                    <li><strong>অ্যান্ড্রয়েড / ক্রোম:</strong> ব্রাউজারের উপরে ৩-ডট মেন্যুতে ক্লিক করে "Add to Home screen" বা "Install App" চাপুন।</li>
                    <li><strong>আইফোন / সাফারি:</strong> নিচে শেয়ার (Share) আইকনে ক্লিক করে "Add to Home Screen" নির্বাচন করুন।</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setIsShortcutModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer"
              >
                ঠিক আছে
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Multi-Device Live Sync & Device Settings Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-950 to-teal-950 text-white p-4.5 flex items-center justify-between shrink-0 border-b border-emerald-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-400/40">
                  <Laptop size={16} className="text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-sans tracking-wide">মাল্টি-ডিভাইস লাইভ সিঙ্ক ও সেটিংস</h3>
                  <p className="text-[10px] text-emerald-300 leading-none mt-0.5 font-sans">রিয়েল-টাইম ক্লাউড ডাটাবেজ সমন্বয়</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeviceModalOpen(false)}
                className="text-white/80 hover:text-white bg-emerald-800 hover:bg-emerald-700 p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs font-sans leading-relaxed">
              
              {/* Sync Status Banner */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-2 text-xs">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    লাইভ সিঙ্ক স্ট্যাটাস: সংযুক্ত (Online)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-850 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    সার্ভার লাইভ
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1">
                  <span>সর্বশেষ সফল সিঙ্ক: <strong>{syncStatus.lastSyncTime || 'এইমাত্র'}</strong></span>
                  <span className="text-[10px] text-slate-500 font-mono">আইডি: {realtimeSync.getDeviceId().substring(0, 10)}</span>
                </div>
              </div>

              {/* How it works instruction */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-slate-700 text-[11px]">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <span>💡</span> কিভাবে ডিভাইসগুলোর মাঝে ডাটা সিঙ্ক হয়?
                </h4>
                <ul className="space-y-2 list-disc list-inside text-slate-600">
                  <li>
                    <strong>প্রধান ডিভাইস (ল্যাপটপ / কম্পিউটার):</strong> ল্যাপটপ থেকে কোনো শিক্ষার্থী ভর্তি, ফি আদায়, হাজিরা বা ডাটা পরিবর্তন করলে তা তৎক্ষণাৎ সার্ভার ডাটাবেজে সংরক্ষিত হয়।
                  </li>
                  <li>
                    <strong>অন্যান্য ডিভাইস (মোবাইল / ট্যাব):</strong> মোবাইল অ্যাপ খোলা থাকলে সাথে সাথে নোটিফিকেশন সহ ডাটা আপডেট হবে। অথবা পেজ রিফ্রেশ বা উপরের <strong>"রিফ্রেশ"</strong> বাটনে চাপ দিলে সমস্ত তথ্য তাৎক্ষণিক চলে আসবে।
                  </li>
                  <li>
                    <strong>পাসওয়ার্ড সুরক্ষা ও স্বচ্ছতা:</strong> মালিকের পাসওয়ার্ড দিয়ে কোনো তথ্য এন্ট্রি বা ডিলিট হলে নোটিফিকেশনে স্পষ্ট লেখা থাকবে কোন ডিভাইস থেকে এই কাজটি অনুমোদিত হয়েছে।
                  </li>
                </ul>
              </div>

              {/* Device Rename Form */}
              <form onSubmit={handleSaveDeviceName} className="space-y-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    এই ডিভাইসের নাম বা পরিচিতি নির্ধারণ করুন:
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    (অন্যান্য ডিভাইসে প্রেরিত নোটিফিকেশন মেসেজে এই নামটি প্রদর্শিত হবে)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempDeviceName}
                      onChange={(e) => setTempDeviceName(e.target.value)}
                      placeholder="যেমন: ল্যাপটপ (মেইন ডিভাইস)"
                      className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                    >
                      নাম সেভ করুন
                    </button>
                  </div>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['ল্যাপটপ / কম্পিউটার (মেইন)', 'প্রধান ল্যাপটপ', 'মোবাইল ডিভাইস', 'মুহতামিমের ফোন', 'অফিস কম্পিউটার'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTempDeviceName(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                        tempDeviceName === preset ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </form>

              {/* Instant Force Refresh Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleManualRefresh();
                    setIsDeviceModalOpen(false);
                  }}
                  disabled={isManualRefreshing}
                  className="w-full flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-75"
                >
                  <RefreshCw size={14} className={isManualRefreshing ? 'animate-spin' : ''} />
                  <span>এখনই সম্পূর্ণ ডাটাবেজ রিফ্রেশ ও সিঙ্ক করুন</span>
                </button>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer"
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
