import React, { useState, useEffect, useMemo } from 'react';
import { Student, ExamMark, MadrasahClass, isClassMatch, SubjectScore, GradeRule } from '../types';
import { realtimeSync } from '../services/realtimeSync';
import OwnerAuthModal from './OwnerAuthModal';
import { 
  Award, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Printer, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  X,
  SlidersHorizontal,
  CheckCircle,
  HelpCircle,
  Percent,
  Layers,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExamModuleProps {
  students: Student[];
}

export const convertToBanglaNumber = (num: number | string): string => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return (num ?? '').toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
};

// Default subjects per class (প্রতিটি শ্রেণীর জন্য আলাদা আলাদা বিষয়)
export const DEFAULT_CLASS_SUBJECTS: Record<string, string[]> = {
  '৩য় শ্রেণী': ['কুরআন', 'বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান'],
  '১ম শ্রেণী': ['কুরআন', 'বাংলা', 'ইংরেজি', 'গণিত', 'আরবি ও দ্বীনিয়াত'],
  '২য় শ্রেণী': ['কুরআন', 'বাংলা', 'ইংরেজি', 'গণিত', 'আরবি ও দ্বীনিয়াত'],
  '৪র্থ শ্রেণী': ['কুরআন ও তাজবীদ', 'বাংলা', 'ইংরেজি', 'গণিত', 'আরবি', 'সমাজ ও বিজ্ঞান'],
  '৫ম শ্রেণী': ['কুরআন ও তাজবীদ', 'বাংলা', 'ইংরেজি', 'গণিত', 'আরবি', 'সমাজ ও বিজ্ঞান'],
  'নূরানী': ['নূরানী কায়দা/আমপারা', 'কালিমাহ ও মাসনুন দোয়া', 'বাংলা', 'ইংরেজি', 'গণিত'],
  'নাজেরা': ['নাজেরা তিলাওয়াত', 'তাজবীদ ও মাখরাজ', 'মাসায়িল ও ফিকহ', 'উর্দু/আরবি', 'বাংলা'],
  'হিফজ': ['হিফজুল কুরআন', 'তাজবীদ ও তরতীল', 'আদব ও আখলাক', 'মাসায়িল', 'সাধারণ শিক্ষা'],
  'কিতাব বিভাগ': ['মিজান ও মুনশাইব', 'কুরআন তরজমা', 'হাদিস শরীফ', 'ফিকহ', 'আরবি ব্যাকরণ'],
  'জেনারেল': ['কুরআন ও ইসলাম শিক্ষা', 'বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান']
};

// Default Grading Rules based on average marks (গড় নাম্বারের ওপর ভিত্তি করে স্বয়ংক্রিয় গ্রেডিং)
export const DEFAULT_GRADE_RULES: GradeRule[] = [
  {
    id: 'mumtaz',
    name: 'মুমতাজ (A+)',
    division: 'প্রথম বিভাগ (স্টার)',
    minAverage: 80,
    maxAverage: 100,
    badgeClass: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
    description: 'গড় ৮০% বা তদূর্ধ্ব নম্বর'
  },
  {
    id: 'jayyid_jiddan',
    name: 'জায়্যিদ জিদ্দান (A)',
    division: 'প্রথম বিভাগ',
    minAverage: 65,
    maxAverage: 79.99,
    badgeClass: 'bg-teal-50 border border-teal-200 text-teal-800',
    description: 'গড় ৬৫% থেকে ৭৯.৯% নম্বর'
  },
  {
    id: 'jayyid',
    name: 'জায়্যিদ (B)',
    division: 'দ্বিতীয় বিভাগ',
    minAverage: 50,
    maxAverage: 64.99,
    badgeClass: 'bg-blue-50 border border-blue-200 text-blue-800',
    description: 'গড় ৫০% থেকে ৬৪.৯% নম্বর'
  },
  {
    id: 'maqbul',
    name: 'মাকবুল (C)',
    division: 'তৃতীয় বিভাগ (পাস)',
    minAverage: 33,
    maxAverage: 49.99,
    badgeClass: 'bg-amber-50 border border-amber-200 text-amber-800',
    description: 'গড় ৩৩% থেকে ৪৯.৯% নম্বর'
  },
  {
    id: 'rasib',
    name: 'রাসেব (F)',
    division: 'অকৃতকার্য (ফেল)',
    minAverage: 0,
    maxAverage: 32.99,
    badgeClass: 'bg-rose-50 border border-rose-200 text-rose-700',
    description: 'গড় ৩৩% এর নিচে নম্বর'
  }
];

// Helper to evaluate grade dynamically based on active grading configuration rules
export function evaluateGradeByRules(average: number, rules: GradeRule[]): {
  grade: string;
  division: string;
  badgeClass: string;
} {
  const sorted = [...rules].sort((a, b) => b.minAverage - a.minAverage);
  for (const rule of sorted) {
    if (average >= rule.minAverage) {
      return {
        grade: rule.name,
        division: rule.division,
        badgeClass: rule.badgeClass
      };
    }
  }
  const last = sorted[sorted.length - 1];
  return {
    grade: last ? last.name : 'রাসেব (F)',
    division: last ? last.division : 'অকৃতকার্য',
    badgeClass: last ? last.badgeClass : 'bg-rose-50 border border-rose-200 text-rose-700'
  };
}

// Normalize any exam mark to ensure it has subjectScores and averageMarks
export function normalizeExamMark(
  mark: ExamMark, 
  gradingRules: GradeRule[]
): ExamMark & { subjectScores: SubjectScore[]; averageMarks: number } {
  let scores: SubjectScore[] = [];

  if (mark.subjectScores && Array.isArray(mark.subjectScores) && mark.subjectScores.length > 0) {
    scores = mark.subjectScores.map(s => ({
      subjectName: s.subjectName || 'বিষয়',
      marks: Number(s.marks) || 0,
      fullMarks: Number(s.fullMarks) || 100
    }));
  } else {
    // Fallback to legacy fields
    if (typeof mark.quranMarks === 'number') scores.push({ subjectName: 'কুরআন', marks: mark.quranMarks, fullMarks: 100 });
    if (typeof mark.hadithMarks === 'number') scores.push({ subjectName: 'হাদীস', marks: mark.hadithMarks, fullMarks: 100 });
    if (typeof mark.arabicMarks === 'number') scores.push({ subjectName: 'আরবী', marks: mark.arabicMarks, fullMarks: 100 });
    if (typeof mark.banglaMarks === 'number') scores.push({ subjectName: 'বাংলা', marks: mark.banglaMarks, fullMarks: 100 });
    if (typeof mark.mathMarks === 'number') scores.push({ subjectName: 'গণিত', marks: mark.mathMarks, fullMarks: 100 });
  }

  if (scores.length === 0) {
    scores = [
      { subjectName: 'কুরআন', marks: 0, fullMarks: 100 },
      { subjectName: 'বাংলা', marks: 0, fullMarks: 100 }
    ];
  }

  const total = scores.reduce((sum, s) => sum + (Number(s.marks) || 0), 0);
  const average = Math.round((total / scores.length) * 10) / 10;
  const gradeInfo = evaluateGradeByRules(average, gradingRules);

  return {
    ...mark,
    subjectScores: scores,
    totalMarks: total,
    averageMarks: average,
    grade: gradeInfo.grade
  };
}

export default function ExamModule({ students }: ExamModuleProps) {
  // Top Active View Tab: 'results' | 'grading_config'
  const [activeTab, setActiveTab] = useState<'results' | 'grading_config'>('results');

  // Sub-tab inside Grading Configuration: 'subjects' | 'grading_rules'
  const [configSubTab, setConfigSubTab] = useState<'subjects' | 'grading_rules'>('subjects');

  // Grading Rules State
  const [gradingRules, setGradingRules] = useState<GradeRule[]>(() => {
    const stored = localStorage.getItem('madrasah_grading_rules');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // use default
      }
    }
    return DEFAULT_GRADE_RULES;
  });

  // Class Subjects Settings Map State
  const [classSubjectsMap, setClassSubjectsMap] = useState<Record<string, string[]>>(() => {
    const stored = localStorage.getItem('madrasah_class_subjects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CLASS_SUBJECTS, ...parsed };
      } catch (e) {
        return DEFAULT_CLASS_SUBJECTS;
      }
    }
    return DEFAULT_CLASS_SUBJECTS;
  });

  const [examMarks, setExamMarks] = useState<ExamMark[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('সব');
  const [selectedExamType, setSelectedExamType] = useState<'ত্রৈমাসিক' | 'ষাণ্মাসিক' | 'বার্ষিক' | 'সব'>('সব');
  const [searchQuery, setSearchQuery] = useState('');

  // Institution Profile Info
  const madrasahName = (localStorage.getItem('madrasah_profile_name') || 'মারকাযুল কুরআন আল ইসলামিয়া মাদরাসা').replace('ঐতিহ্যবাহী', '').trim();
  const madrasahSlogan = localStorage.getItem('madrasah_profile_slogan') || 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং';

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedResultForPrint, setSelectedResultForPrint] = useState<(ExamMark & { subjectScores: SubjectScore[]; averageMarks: number }) | null>(null);
  const [editingMark, setEditingMark] = useState<ExamMark | null>(null);
  const [showConfigSavedToast, setShowConfigSavedToast] = useState(false);

  // Form states for Add/Edit Result
  const [formStudentId, setFormStudentId] = useState('');
  const [formClass, setFormClass] = useState<string>('৩য় শ্রেণী');
  const [formExamType, setFormExamType] = useState<'ত্রৈমাসিক' | 'ষাণ্মাসিক' | 'বার্ষিক'>('বার্ষিক');
  const [formSubjectScores, setFormSubjectScores] = useState<SubjectScore[]>([
    { subjectName: 'কুরআন', marks: 0, fullMarks: 100 },
    { subjectName: 'বাংলা', marks: 0, fullMarks: 100 },
    { subjectName: 'ইংরেজি', marks: 0, fullMarks: 100 },
    { subjectName: 'গণিত', marks: 0, fullMarks: 100 },
    { subjectName: 'সাধারণ জ্ঞান', marks: 0, fullMarks: 100 }
  ]);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Config View States
  const [settingsSelectedClass, setSettingsSelectedClass] = useState<string>('৩য় শ্রেণী');
  const [settingsNewSubject, setSettingsNewSubject] = useState('');
  const [newCustomClassName, setNewCustomClassName] = useState('');

  // Live Grade Simulator State
  const [simulatorAverage, setSimulatorAverage] = useState<number>(80);

  // Helper to retrieve subjects for any class
  const getSubjectsForClass = (clsName: string): string[] => {
    if (!clsName) return DEFAULT_CLASS_SUBJECTS['৩য় শ্রেণী'];
    const trimmed = clsName.trim();

    // Direct match
    if (classSubjectsMap[trimmed] && classSubjectsMap[trimmed].length > 0) {
      return classSubjectsMap[trimmed];
    }

    // Keyword match
    for (const [key, subjects] of Object.entries(classSubjectsMap) as [string, string[]][]) {
      if (trimmed.toLowerCase() === key.toLowerCase() || trimmed.includes(key) || key.includes(trimmed)) {
        if (Array.isArray(subjects) && subjects.length > 0) return subjects;
      }
    }

    // Number matching
    if (trimmed.includes('৩') || trimmed.includes('তিন') || trimmed.includes('৩য়') || trimmed.includes('তৃতীয়')) {
      return classSubjectsMap['৩য় শ্রেণী'] || DEFAULT_CLASS_SUBJECTS['৩য় শ্রেণী'];
    }
    if (trimmed.includes('১') || trimmed.includes('এক') || trimmed.includes('১ম') || trimmed.includes('প্রথম')) {
      return classSubjectsMap['১ম শ্রেণী'] || DEFAULT_CLASS_SUBJECTS['১ম শ্রেণী'];
    }
    if (trimmed.includes('২') || trimmed.includes('দুই') || trimmed.includes('২য়') || trimmed.includes('দ্বিতীয়')) {
      return classSubjectsMap['২য় শ্রেণী'] || DEFAULT_CLASS_SUBJECTS['২য় শ্রেণী'];
    }
    if (trimmed.includes('৪') || trimmed.includes('চার') || trimmed.includes('৪র্থ') || trimmed.includes('চতুর্থ')) {
      return classSubjectsMap['৪র্থ শ্রেণী'] || DEFAULT_CLASS_SUBJECTS['৪র্থ শ্রেণী'];
    }
    if (trimmed.includes('৫') || trimmed.includes('পাঁচ') || trimmed.includes('৫ম') || trimmed.includes('পঞ্চম')) {
      return classSubjectsMap['৫ম শ্রেণী'] || DEFAULT_CLASS_SUBJECTS['৫ম শ্রেণী'];
    }
    if (trimmed.includes('নূরানী')) return classSubjectsMap['নূরানী'] || DEFAULT_CLASS_SUBJECTS['নূরানী'];
    if (trimmed.includes('নাজেরা')) return classSubjectsMap['নাজেরা'] || DEFAULT_CLASS_SUBJECTS['নাজেরা'];
    if (trimmed.includes('হিফজ')) return classSubjectsMap['হিফজ'] || DEFAULT_CLASS_SUBJECTS['হিফজ'];
    if (trimmed.includes('কিতাব')) return classSubjectsMap['কিতাব বিভাগ'] || DEFAULT_CLASS_SUBJECTS['কিতাব বিভাগ'];

    return DEFAULT_CLASS_SUBJECTS['৩য় শ্রেণী'];
  };

  // Load marks from storage or seed initial marks
  useEffect(() => {
    const stored = localStorage.getItem('madrasah_exam_marks');
    if (stored) {
      try {
        const parsed: ExamMark[] = JSON.parse(stored);
        const normalized = parsed.map(m => normalizeExamMark(m, gradingRules));
        setExamMarks(normalized);
      } catch (e) {
        setExamMarks([]);
      }
    } else {
      // Seed sample marks showcasing average based grading (including 3rd class with Quran, Bangla, English, Math, General Knowledge)
      const initialMarks: ExamMark[] = students.slice(0, 6).map((st, idx) => {
        const studentCls = idx % 2 === 0 ? '৩য় শ্রেণী' : st.gradeClass || 'হিফজ';
        const classSubjs = getSubjectsForClass(studentCls);
        
        // E.g. 70 in one, 90 in another, average >= 80 -> Mumtaz!
        const baseScores = [70, 90, 85, 80, 75, 88];
        const scores: SubjectScore[] = classSubjs.map((subj, sIdx) => ({
          subjectName: subj,
          marks: baseScores[(sIdx + idx) % baseScores.length] + ((idx % 3) * 2),
          fullMarks: 100
        }));

        const total = scores.reduce((sum, s) => sum + s.marks, 0);
        const avg = Math.round((total / scores.length) * 10) / 10;
        const gradeInfo = evaluateGradeByRules(avg, gradingRules);

        return {
          id: `ex-${idx}-${st.id}`,
          studentId: st.id,
          studentName: st.name,
          roll: st.roll,
          gradeClass: studentCls,
          examType: 'বার্ষিক',
          subjectScores: scores,
          totalMarks: total,
          averageMarks: avg,
          grade: gradeInfo.grade
        };
      });

      setExamMarks(initialMarks);
      localStorage.setItem('madrasah_exam_marks', JSON.stringify(initialMarks));
    }
  }, [students]);

  // Save marks to state and localStorage with Real-Time sync
  const saveMarks = (list: ExamMark[]) => {
    setExamMarks(list);
    realtimeSync.syncChange('madrasah_exam_marks', list, {
      title: 'পরীক্ষার ফলাফল হালনাগাদ',
      message: 'শিক্ষার্থীদের পরীক্ষার নম্বর ও গ্রেড ডাটাবেজে সংরক্ষিত হয়েছে।',
      module: 'exam',
      type: 'update'
    });
  };

  // Save class subjects map to state and localStorage with Real-Time sync
  const saveClassSubjects = (newMap: Record<string, string[]>) => {
    setClassSubjectsMap(newMap);
    realtimeSync.syncChange('madrasah_class_subjects', newMap, {
      title: 'শ্রেণীভিত্তিক বিষয় তালিকা সংরক্ষিত',
      message: 'সকল শ্রেণীর বিষয় তালিকা আপডেট হয়েছে।',
      module: 'exam',
      type: 'update'
    });
  };

  // Save grading rules with Real-Time sync
  const saveGradingRules = (newRules: GradeRule[]) => {
    setGradingRules(newRules);
    realtimeSync.syncChange('madrasah_grading_rules', newRules, {
      title: 'গ্রেডিং কনফিগারেশন সংরক্ষিত',
      message: 'গড় নাম্বারের গ্রেড বণ্টন নিয়ম হালনাগাদ হয়েছে।',
      module: 'exam',
      type: 'update'
    });

    // Re-evaluate all existing marks with new grading configuration rules
    setExamMarks(prev => {
      const recalculated = prev.map(m => normalizeExamMark(m, newRules));
      realtimeSync.syncChange('madrasah_exam_marks', recalculated, {
        title: 'ফলাফল পুনর্মূল্যায়ন সম্পন্ন',
        message: 'নতুন গ্রেডিং নীতি অনুযায়ী ফলাফল আপডেট হয়েছে।',
        module: 'exam',
        type: 'update'
      });
      return recalculated;
    });

    setShowConfigSavedToast(true);
    setTimeout(() => setShowConfigSavedToast(false), 3500);
  };

  // Owner Auth state for Exam Module
  const [isOwnerAuthOpen, setIsOwnerAuthOpen] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  const requireExamOwnerAuth = (title: string, description: string, action: () => void) => {
    const expire = localStorage.getItem('madrasah_owner_auth_expire');
    if (expire && parseInt(expire, 10) > Date.now()) {
      action();
      return;
    }
    setPendingAuthAction({ title, description, action });
    setIsOwnerAuthOpen(true);
  };

  // Subscribe to real-time events from other devices
  useEffect(() => {
    const unsub = realtimeSync.subscribe((event) => {
      if (event.key === 'madrasah_exam_marks' && Array.isArray(event.data)) {
        setExamMarks(event.data);
      } else if (event.key === 'madrasah_grading_rules' && Array.isArray(event.data)) {
        setGradingRules(event.data);
      } else if (event.key === 'madrasah_class_subjects' && event.data) {
        setClassSubjectsMap(event.data);
      }
    });
    return () => unsub();
  }, []);

  // Available classes list (from students + pre-configured classes)
  const availableClasses = useMemo(() => {
    const studentClasses = students.map(s => s.gradeClass).filter(Boolean);
    const configuredClasses = Object.keys(classSubjectsMap);
    const combined = Array.from(new Set(['৩য় শ্রেণী', '১ম শ্রেণী', '২য় শ্রেণী', '৪র্থ শ্রেণী', '৫ম শ্রেণী', 'নূরানী', 'নাজেরা', 'হিফজ', 'কিতাব বিভাগ', 'জেনারেল', ...studentClasses, ...configuredClasses]));
    return combined;
  }, [students, classSubjectsMap]);

  // When student selection changes in the form, load their class subjects
  const handleStudentSelect = (studentId: string) => {
    setFormStudentId(studentId);
    const selectedStudent = students.find(s => s.id === studentId);
    if (selectedStudent) {
      const cls = selectedStudent.gradeClass || '৩য় শ্রেণী';
      setFormClass(cls);
      const subjects = getSubjectsForClass(cls);
      setFormSubjectScores(subjects.map(s => ({ subjectName: s, marks: 0, fullMarks: 100 })));
    }
  };

  // When class changes in the form, reload subjects for that class
  const handleFormClassChange = (newCls: string) => {
    setFormClass(newCls);
    const subjects = getSubjectsForClass(newCls);
    setFormSubjectScores(subjects.map(s => ({ subjectName: s, marks: 0, fullMarks: 100 })));
  };

  // Update marks for a specific subject in form
  const handleSubjectMarkChange = (index: number, val: number) => {
    const validMarks = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    setFormSubjectScores(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], marks: validMarks };
      return updated;
    });
  };

  // Update subject name in form
  const handleSubjectNameChange = (index: number, name: string) => {
    setFormSubjectScores(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], subjectName: name };
      return updated;
    });
  };

  // Add a new subject on the fly in the form
  const handleAddSubjectToForm = () => {
    if (!newSubjectInput.trim()) return;
    const exists = formSubjectScores.some(s => s.subjectName.trim() === newSubjectInput.trim());
    if (exists) return;
    setFormSubjectScores(prev => [...prev, { subjectName: newSubjectInput.trim(), marks: 0, fullMarks: 100 }]);
    setNewSubjectInput('');
  };

  // Remove a subject from form
  const handleRemoveSubjectFromForm = (index: number) => {
    if (formSubjectScores.length <= 1) return;
    setFormSubjectScores(prev => prev.filter((_, idx) => idx !== index));
  };

  // Real-time calculation of form totals and average based on active grading configuration
  const formCalculations = useMemo(() => {
    const total = formSubjectScores.reduce((sum, s) => sum + (Number(s.marks) || 0), 0);
    const count = formSubjectScores.length;
    const fullTotal = count * 100;
    const average = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
    const gradeInfo = evaluateGradeByRules(average, gradingRules);

    return {
      total,
      fullTotal,
      count,
      average,
      gradeInfo
    };
  }, [formSubjectScores, gradingRules]);

  // Handle Form Submit (Add or Edit) with Owner Authentication
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === formStudentId);
    if (!st) return;

    requireExamOwnerAuth(
      editingMark ? 'ফলাফল সংশোধন অনুমোদন' : 'ফলাফল সংরক্ষণ অনুমোদন',
      `শিক্ষার্থী "${st.name}" এর পরীক্ষার ফলাফল ফাইনাল ও ডেটাবেজে সংরক্ষণ করতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const total = formCalculations.total;
        const average = formCalculations.average;
        const grade = formCalculations.gradeInfo.grade;

        if (editingMark) {
          const updated = examMarks.map(item => item.id === editingMark.id ? {
            ...item,
            studentId: formStudentId,
            studentName: st.name,
            roll: st.roll,
            gradeClass: formClass,
            examType: formExamType,
            subjectScores: formSubjectScores,
            totalMarks: total,
            averageMarks: average,
            grade
          } : item);
          saveMarks(updated);
        } else {
          const newResult: ExamMark = {
            id: 'ex-' + Math.random().toString(36).substr(2, 9),
            studentId: formStudentId,
            studentName: st.name,
            roll: st.roll,
            gradeClass: formClass,
            examType: formExamType,
            subjectScores: formSubjectScores,
            totalMarks: total,
            averageMarks: average,
            grade
          };
          saveMarks([newResult, ...examMarks]);
        }

        // Reset & close
        setIsModalOpen(false);
        setEditingMark(null);
        setFormStudentId('');
        setNewSubjectInput('');
      }
    );
  };

  // Open Edit Modal
  const handleEdit = (mark: ExamMark) => {
    const norm = normalizeExamMark(mark, gradingRules);
    setEditingMark(norm);
    setFormStudentId(norm.studentId);
    setFormClass(norm.gradeClass || '৩য় শ্রেণী');
    setFormExamType(norm.examType);
    setFormSubjectScores(norm.subjectScores);
    setIsModalOpen(true);
  };

  // Delete mark with Owner Authentication
  const handleDelete = (id: string) => {
    const target = examMarks.find(m => m.id === id);
    requireExamOwnerAuth(
      'ফলাফল মুছে ফেলার অনুমোদন',
      `শিক্ষার্থী "${target?.studentName || ''}" এর পরীক্ষার ফলাফল ডাটাবেজ থেকে মুছে ফেলতে মালিকের পাসওয়ার্ড দিন।`,
      () => {
        const updated = examMarks.filter(item => item.id !== id);
        saveMarks(updated);
      }
    );
  };

  // Open Print Modal
  const handleOpenPrint = (mark: ExamMark) => {
    const norm = normalizeExamMark(mark, gradingRules);
    setSelectedResultForPrint(norm);
    setIsPrintModalOpen(true);
  };

  // Filtered Marks list
  const filteredMarks = useMemo(() => {
    return examMarks.map(m => normalizeExamMark(m, gradingRules)).filter(item => {
      const classMatch = selectedClass === 'সব' || isClassMatch(item.gradeClass, selectedClass);
      const examMatch = selectedExamType === 'সব' || item.examType === selectedExamType;
      const searchMatch = searchQuery.trim() === '' || 
        item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.roll.toString().includes(searchQuery);
      return classMatch && examMatch && searchMatch;
    });
  }, [examMarks, selectedClass, selectedExamType, searchQuery, gradingRules]);

  // Overall Stats
  const stats = useMemo(() => {
    if (filteredMarks.length === 0) {
      return {
        totalRegistered: 0,
        passRate: 0,
        topScorer: null,
        averageAcrossAll: 0,
        mumtazCount: 0
      };
    }

    const totalRegistered = filteredMarks.length;
    const passedCount = filteredMarks.filter(m => !m.grade.includes('রাসেব') && !m.grade.includes('F')).length;
    const passRate = Math.round((passedCount / totalRegistered) * 100);
    const mumtazCount = filteredMarks.filter(m => m.grade.includes('মুমতাজ')).length;
    const totalAveragesSum = filteredMarks.reduce((sum, m) => sum + m.averageMarks, 0);
    const averageAcrossAll = Math.round((totalAveragesSum / totalRegistered) * 10) / 10;

    const sortedByAverage = [...filteredMarks].sort((a, b) => b.averageMarks - a.averageMarks);
    const topScorer = sortedByAverage[0] || null;

    return {
      totalRegistered,
      passRate,
      topScorer,
      averageAcrossAll,
      mumtazCount
    };
  }, [filteredMarks]);

  // Class Subject Settings Handlers
  const handleAddSubjectToClassSettings = () => {
    if (!settingsNewSubject.trim()) return;
    const currentList = classSubjectsMap[settingsSelectedClass] || [];
    if (currentList.includes(settingsNewSubject.trim())) return;
    const updated = {
      ...classSubjectsMap,
      [settingsSelectedClass]: [...currentList, settingsNewSubject.trim()]
    };
    saveClassSubjects(updated);
    setSettingsNewSubject('');
  };

  const handleRemoveSubjectFromClassSettings = (subjectToRemove: string) => {
    const currentList = classSubjectsMap[settingsSelectedClass] || [];
    const updated = {
      ...classSubjectsMap,
      [settingsSelectedClass]: currentList.filter(s => s !== subjectToRemove)
    };
    saveClassSubjects(updated);
  };

  const handleCreateCustomClassInSettings = () => {
    if (!newCustomClassName.trim()) return;
    const name = newCustomClassName.trim();
    if (!classSubjectsMap[name]) {
      const updated = {
        ...classSubjectsMap,
        [name]: ['কুরআন', 'বাংলা', 'ইংরেজি', 'গণিত', 'সাধারণ জ্ঞান']
      };
      saveClassSubjects(updated);
      setSettingsSelectedClass(name);
    }
    setNewCustomClassName('');
  };

  const handleResetClassSubjects = () => {
    saveClassSubjects(DEFAULT_CLASS_SUBJECTS);
  };

  // Rule threshold edit handler
  const handleRuleMinAverageChange = (id: string, newMin: number) => {
    const updated = gradingRules.map(r => r.id === id ? { ...r, minAverage: isNaN(newMin) ? 0 : newMin } : r);
    setGradingRules(updated);
  };

  const handleRuleNameChange = (id: string, newName: string) => {
    const updated = gradingRules.map(r => r.id === id ? { ...r, name: newName } : r);
    setGradingRules(updated);
  };

  const handleRuleDivisionChange = (id: string, newDiv: string) => {
    const updated = gradingRules.map(r => r.id === id ? { ...r, division: newDiv } : r);
    setGradingRules(updated);
  };

  // Simulator grade result
  const simulatedGrade = useMemo(() => {
    return evaluateGradeByRules(simulatorAverage, gradingRules);
  }, [simulatorAverage, gradingRules]);

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto w-full font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showConfigSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-emerald-700"
          >
            <CheckCircle size={18} className="text-emerald-300" />
            <span className="text-xs font-bold font-sans">
              গ্রেডিং কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে এবং ফলাফলসমূহে প্রযোজ্য হয়েছে!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & View Tabs Switcher */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Award size={20} />
            </span>
            <div>
              <h1 className="text-lg font-black text-slate-850">
                পরীক্ষার ফলাফল ও স্বয়ংক্রিয় গ্রেডিং ব্যবস্থাপনা
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                শ্রেণীভিত্তিক বিষয় তালিকা এবং গড় নম্বর ভিত্তিক মুমতাজ, জায়্যিদ গ্রেডিং কনফিগারেশন
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'results'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>ফলাফল ও মার্কশীট তালিকা</span>
            <span className="bg-indigo-100 text-indigo-800 font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
              {convertToBanglaNumber(examMarks.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('grading_config')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'grading_config'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>গ্রেডিং ও বিষয় কনফিগারেশন</span>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
              activeTab === 'grading_config' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              সেটিংস
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: RESULTS & MARKSHEET LIST */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          
          {/* Top Welcome Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-850 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-300 block font-bold uppercase tracking-wider">মোট ফলাফল নথিভুক্ত</span>
                <strong className="text-2xl font-extrabold block mt-1 font-mono">{convertToBanglaNumber(stats.totalRegistered)} টি</strong>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <FileSpreadsheet size={22} className="text-indigo-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-2xl border border-emerald-850 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-300 block font-bold uppercase tracking-wider">পাসের গড় হার</span>
                <strong className="text-2xl font-extrabold block mt-1 font-mono">{convertToBanglaNumber(stats.passRate)}%</strong>
                <span className="text-[10px] text-emerald-300 mt-0.5 block">মুমতাজ (স্টার): {convertToBanglaNumber(stats.mumtazCount)} জন</span>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <TrendingUp size={22} className="text-emerald-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white p-5 rounded-2xl border border-teal-850 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-teal-300 block font-bold uppercase tracking-wider">সার্বিক গড় নম্বর</span>
                <strong className="text-2xl font-extrabold block mt-1 font-mono">{convertToBanglaNumber(stats.averageAcrossAll)}%</strong>
                <span className="text-[10px] text-teal-200 mt-0.5 block font-medium">কনফিগার করা রুলস অনুযায়ী</span>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <Percent size={22} className="text-teal-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="text-[10px] text-amber-100 block font-bold uppercase tracking-wider">শীর্ষ স্থানাধিকারী</span>
                {stats.topScorer ? (
                  <div className="mt-1 truncate">
                    <strong className="text-sm font-bold block truncate">{stats.topScorer.studentName}</strong>
                    <span className="text-[10px] text-amber-50 font-mono">
                      গড়: {convertToBanglaNumber(stats.topScorer.averageMarks)}% • {stats.topScorer.gradeClass}
                    </span>
                  </div>
                ) : (
                  <strong className="text-sm font-bold block mt-1">রেকর্ড নেই</strong>
                )}
              </div>
              <div className="bg-white/15 p-3 rounded-xl shrink-0">
                <Award size={22} className="text-amber-100" />
              </div>
            </div>
          </div>

          {/* Filter & Action Row */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Left search & filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="ছাত্রের নাম বা রোল খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-slate-700 bg-slate-50/50"
                  />
                </div>

                {/* Class Filter */}
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-white font-semibold text-slate-600 cursor-pointer"
                >
                  <option value="সব">সকল শ্রেণী / বিভাগ</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>

                {/* Exam Filter */}
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value as any)}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-white font-semibold text-slate-600 cursor-pointer"
                >
                  <option value="সব">সকল পরীক্ষা</option>
                  <option value="ত্রৈমাসিক">ত্রৈমাসিক পরীক্ষা</option>
                  <option value="ষাণ্মাসিক">ষাণ্মাসিক পরীক্ষা</option>
                  <option value="বার্ষিক">বার্ষিক পরীক্ষা</option>
                </select>
              </div>

              {/* Right action buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Switch to grading config */}
                <button
                  onClick={() => setActiveTab('grading_config')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80 shadow-2xs"
                  title="শ্রেণীভিত্তিক বিষয় ও গ্রেডিং রুলস কনফিগার করুন"
                >
                  <SlidersHorizontal size={14} className="text-slate-600" />
                  <span>গ্রেডিং কনফিগারেশন পরিবর্তন</span>
                </button>

                {/* Add Result Button */}
                <button
                  onClick={() => {
                    setEditingMark(null);
                    const firstStudent = students[0];
                    const initialCls = firstStudent?.gradeClass || '৩য় শ্রেণী';
                    setFormStudentId(firstStudent?.id || '');
                    setFormClass(initialCls);
                    const subjects = getSubjectsForClass(initialCls);
                    setFormSubjectScores(subjects.map(s => ({ subjectName: s, marks: 0, fullMarks: 100 })));
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus size={15} />
                  <span>নতুন ফলাফল যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* Informative Guidance Ribbon */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-1.5">
                <HelpCircle size={13} className="text-indigo-600 shrink-0" />
                <span>
                  <strong>স্বয়ংক্রিয় গ্রেডিং নিয়ম:</strong> প্রতি বিষয়ে ৮০ পাওয়ার বাধ্যবাধকতা নেই; সব বিষয়ের <strong>গড় নম্বর ৮০% বা তদূর্ধ্ব হলেই মুমতাজ (স্টার)</strong>, ৬৫%-৭৯.৯% জায়্যিদ জিদ্দান, ৫০%-৬৪.৯% জায়্যিদ, এবং ৩৩%-৪৯.৯% মাকবুল হবে।
                </span>
              </div>
              <span className="text-emerald-700 font-semibold font-mono">
                {convertToBanglaNumber(filteredMarks.length)} টি ফলাফল ফিল্টারকৃত
              </span>
            </div>
          </div>

          {/* Results Table Section */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 text-center w-14">রোল</th>
                    <th className="p-3.5">শিক্ষার্থীর নাম ও শ্রেণী</th>
                    <th className="p-3.5 text-center">পরীক্ষা</th>
                    <th className="p-3.5">শ্রেণীভিত্তিক বিষয়ের প্রাপ্ত নম্বর</th>
                    <th className="p-3.5 text-center font-bold">মোট নম্বর</th>
                    <th className="p-3.5 text-center font-bold">গড় নম্বর</th>
                    <th className="p-3.5 text-center">চূড়ান্ত ফলাফল (গ্রেড)</th>
                    <th className="p-3.5 text-center w-28">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredMarks.length > 0 ? (
                    filteredMarks.map((item) => {
                      const gradeInfo = evaluateGradeByRules(item.averageMarks, gradingRules);
                      const totalPossible = item.subjectScores.length * 100;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Roll */}
                          <td className="p-3.5 text-center font-bold font-mono text-slate-800">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center mx-auto text-xs">
                              {convertToBanglaNumber(item.roll)}
                            </span>
                          </td>

                          {/* Name & Class */}
                          <td className="p-3.5">
                            <div>
                              <span className="font-extrabold text-slate-850 text-sm block">{item.studentName}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5 font-semibold">
                                {item.gradeClass}
                              </span>
                            </div>
                          </td>

                          {/* Exam Type */}
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 font-bold rounded-lg text-[10px]">
                              {item.examType}
                            </span>
                          </td>

                          {/* Dynamic Subject Marks List */}
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {item.subjectScores.map((subj, sIdx) => (
                                <span 
                                  key={sIdx} 
                                  className="text-[10px] bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md font-medium text-slate-700 inline-flex items-center space-x-1"
                                  title={`${subj.subjectName}: ${subj.marks}/১০০`}
                                >
                                  <span>{subj.subjectName}:</span>
                                  <strong className={`font-mono font-bold ${subj.marks >= 80 ? 'text-emerald-700' : subj.marks < 33 ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {convertToBanglaNumber(subj.marks)}
                                  </strong>
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Total Marks */}
                          <td className="p-3.5 text-center font-mono text-slate-800">
                            <span className="font-extrabold text-xs block">{convertToBanglaNumber(item.totalMarks)}</span>
                            <span className="text-[10px] text-slate-400">/{convertToBanglaNumber(totalPossible)}</span>
                          </td>

                          {/* Average Marks */}
                          <td className="p-3.5 text-center font-mono">
                            <span className="font-extrabold text-xs text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100">
                              {convertToBanglaNumber(item.averageMarks)}%
                            </span>
                          </td>

                          {/* Grade based on average */}
                          <td className="p-3.5 text-center">
                            <div>
                              <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] inline-block ${gradeInfo.badgeClass}`}>
                                {gradeInfo.grade}
                              </span>
                              <span className="block text-[9px] text-slate-400 mt-0.5 font-medium">
                                {gradeInfo.division}
                              </span>
                            </div>
                          </td>

                          {/* Action buttons */}
                          <td className="p-3.5">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleOpenPrint(item)}
                                className="p-1.5 transition-colors hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                                title="নম্বরপত্র / সনদ প্রিন্ট করুন"
                              >
                                <Printer size={14} />
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 transition-colors hover:bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer"
                                title="সম্পাদনা করুন"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 transition-colors hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        কোন পরীক্ষার ফলাফল পাওয়া যায়নি!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DEDICATED GRADING & SUBJECT CONFIGURATION VIEW */}
      {activeTab === 'grading_config' && (
        <div className="space-y-6">
          
          {/* Config Sub-tabs Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-850 flex items-center space-x-2">
                  <SlidersHorizontal size={18} className="text-indigo-600" />
                  <span>গ্রেডিং ও শ্রেণীভিত্তিক বিষয় কনফিগারেশন প্যানেল</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  এখানে প্রতিটি শ্রেণীর পাঠ্য বিষয় তালিকাভুক্ত করুন এবং গড় নাম্বারের শতকরা হারের ওপর ভিত্তি করে স্বয়ংক্রিয় ফলাফল নির্ধারণের নিয়ম কাস্টমাইজ করুন।
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setConfigSubTab('subjects')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    configSubTab === 'subjects'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>১. শ্রেণীভিত্তিক বিষয় তালিকা</span>
                </button>

                <button
                  onClick={() => setConfigSubTab('grading_rules')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    configSubTab === 'grading_rules'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Award size={14} />
                  <span>২. গড় নম্বর ভিত্তিক গ্রেডিং স্কেল</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: CLASS-WISE SUBJECTS LIST */}
            {configSubTab === 'subjects' && (
              <div className="space-y-6 pt-2">
                
                {/* Select Class Pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    যে শ্রেণীর বিষয় তালিকাভুক্ত করতে চান তা নির্বাচন করুন:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableClasses.map(cls => {
                      const count = (classSubjectsMap[cls] || []).length;
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setSettingsSelectedClass(cls)}
                          className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                            settingsSelectedClass === cls
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span>{cls}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            settingsSelectedClass === cls ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {convertToBanglaNumber(count)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Class Subjects Container */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-850 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                        <span>{settingsSelectedClass} — তালিকাভুক্ত বিষয়সমূহ</span>
                      </h3>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        ফলাফল এন্ট্রি করার সময় এই শ্রেণীর শিক্ষার্থীদের জন্য স্বয়ংক্রিয়ভাবে এই বিষয়গুলো লোড হবে।
                      </span>
                    </div>

                    <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 self-start sm:self-auto">
                      মোট {convertToBanglaNumber((classSubjectsMap[settingsSelectedClass] || []).length)} টি বিষয়
                    </span>
                  </div>

                  {/* Subject Badges Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(classSubjectsMap[settingsSelectedClass] || []).length > 0 ? (
                      (classSubjectsMap[settingsSelectedClass] || []).map((subj, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold font-mono flex items-center justify-center">
                              {convertToBanglaNumber(idx + 1)}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{subj}</span>
                              <span className="text-[10px] text-slate-400 font-mono">পূর্ণমান: ১০০</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectFromClassSettings(subj)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="বিষয়টি বাদ দিন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                        এই শ্রেণীর জন্য এখনো কোনো বিষয় তালিকাভুক্ত করা হয়নি। নিচে বিষয় যুক্ত করুন।
                      </div>
                    )}
                  </div>

                  {/* Add Subject to Selected Class */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <input
                      type="text"
                      value={settingsNewSubject}
                      onChange={(e) => setSettingsNewSubject(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubjectToClassSettings();
                        }
                      }}
                      placeholder={`"${settingsSelectedClass}" এর জন্য নতুন বিষয়ের নাম লিখুন (যেমন: আকাইদ, উর্দু, বিজ্ঞান)...`}
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3.5 py-2 outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubjectToClassSettings}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 shadow-xs flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>বিষয় যুক্ত করুন</span>
                    </button>
                  </div>
                </div>

                {/* Add New Custom Class Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-750 flex items-center space-x-1.5">
                    <Plus size={14} className="text-emerald-700" />
                    <span>নতুন কোনো শ্রেণী বা বিভাগ যুক্ত করতে চান?</span>
                  </h4>
                  <div className="flex items-center gap-2 max-w-lg">
                    <input
                      type="text"
                      value={newCustomClassName}
                      onChange={(e) => setNewCustomClassName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomClassInSettings();
                        }
                      }}
                      placeholder="নতুন শ্রেণীর নাম (যেমন: ৬ষ্ঠ শ্রেণী, মিজান, বা শরহে বেকায়া)..."
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3.5 py-2 outline-none focus:border-indigo-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomClassInSettings}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
                    >
                      শ্রেণী তৈরি করুন
                    </button>
                  </div>
                </div>

                {/* Reset Default Subjects */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={handleResetClassSubjects}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>মাদরাসার ডিফল্ট বিষয় তালিকায় রিসেট করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    ফলাফল তালিকায় ফিরে যান
                  </button>
                </div>

              </div>
            )}

            {/* SUB-TAB 2: AVERAGE-BASED GRADING SCALE RULES */}
            {configSubTab === 'grading_rules' && (
              <div className="space-y-6 pt-2">
                
                {/* Explanation Card */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs">
                  <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-emerald-950 block font-bold">
                      গড় নম্বর (Average Marks) ভিত্তিক স্বয়ংক্রিয় গ্রেডিং নীতি:
                    </strong>
                    <p className="text-emerald-900 leading-relaxed">
                      ফলাফল মূল্যায়নে প্রতিটি বিষয়ে নির্দিষ্ট নম্বর পাওয়ার বাধ্যবাধকতা নেই। শিক্ষার্থী সকল বিষয়ে মিলে যে গড় শতকরা নম্বর (Average %) অর্জন করবে, তার ওপর ভিত্তি করে নিচের স্কেল অনুযায়ী <strong>মুমতাজ (স্টার), জায়্যিদ জিদ্দান, জায়্যিদ, মাকবুল বা রাসেব</strong> গ্রেড নির্ধারিত হবে।
                    </p>
                  </div>
                </div>

                {/* Grading Rules Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      সক্রিয় গ্রেডিং স্কেল কনফিগারেশন রুলস
                    </span>
                    <span className="text-[11px] text-slate-400">
                      নিচের সর্বনিম্ন গড় নম্বর পরিবর্তন করে আপনি গ্রেডিং লিমিট কাস্টমাইজ করতে পারেন
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <th className="p-3">গ্রেডের নাম</th>
                        <th className="p-3">বিভাগ / পদমর্যাদা</th>
                        <th className="p-3 text-center">সর্বনিম্ন গড় নম্বর (%)</th>
                        <th className="p-3 text-center">সর্বোচ্চ গড় নম্বর (%)</th>
                        <th className="p-3 text-center">প্রিভিউ ব্যাজ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gradingRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-slate-50/50">
                          {/* Grade Name */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={rule.name}
                              onChange={(e) => handleRuleNameChange(rule.id, e.target.value)}
                              className="text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 w-36 outline-none focus:border-indigo-600 bg-white"
                            />
                          </td>

                          {/* Division */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={rule.division}
                              onChange={(e) => handleRuleDivisionChange(rule.id, e.target.value)}
                              className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 w-44 outline-none focus:border-indigo-600 bg-white"
                            />
                          </td>

                          {/* Min Average */}
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center space-x-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={rule.minAverage}
                                onChange={(e) => handleRuleMinAverageChange(rule.id, parseFloat(e.target.value))}
                                className="w-16 text-center font-mono font-bold text-xs border border-slate-200 rounded-lg py-1 px-1.5 outline-none focus:border-indigo-600 bg-white"
                              />
                              <span className="font-mono text-slate-400 font-bold">%</span>
                            </div>
                          </td>

                          {/* Max Average */}
                          <td className="p-3 text-center font-mono text-slate-500 font-bold">
                            {convertToBanglaNumber(rule.maxAverage)}%
                          </td>

                          {/* Preview Badge */}
                          <td className="p-3 text-center">
                            <span className={`px-3 py-1 rounded-lg font-bold text-[10px] inline-block ${rule.badgeClass}`}>
                              {rule.name}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Interactive Grade Simulator */}
                <div className="bg-gradient-to-r from-indigo-50/60 to-emerald-50/60 border border-indigo-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles size={16} className="text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-850">
                      তাৎক্ষণিক গ্রেড সিমুলেটর (Live Grade Tester)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    যেকোনো গড় নম্বর দিয়ে পরীক্ষা করুন যে আপনার কনফিগারেশন অনুযায়ী স্বয়ংক্রিয়ভাবে কোন গ্রেড নির্ধারিত হয়:
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-bold text-slate-700">গড় নম্বর লিখুন:</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={simulatorAverage}
                          onChange={(e) => setSimulatorAverage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                          className="w-20 font-mono font-extrabold text-sm border border-indigo-200 rounded-lg p-1.5 text-center text-indigo-900 outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                        <span className="font-bold text-indigo-700">%</span>
                      </div>
                    </div>

                    <ArrowRight size={16} className="text-slate-400 hidden sm:block" />

                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500 font-medium">স্বয়ংক্রিয়ভাবে নির্ধারিত গ্রেড:</span>
                      <span className={`px-3 py-1 rounded-xl font-bold text-xs inline-block ${simulatedGrade.badgeClass}`}>
                        {simulatedGrade.grade}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 font-sans">
                        ({simulatedGrade.division})
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic">
                    উদাহরণ: কোনো ছাত্র বাংলায় ৭০ ও গণিতে ৯০ পেলে গড় ৮০% হয়, সুতরাং স্বয়ংক্রিয়ভাবে মুমতাজ আসবে।
                  </p>
                </div>

                {/* Action Buttons: Save & Reset */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => saveGradingRules(DEFAULT_GRADE_RULES)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>ডিফল্ট গ্রেডিং স্কেলে রিসেট করুন</span>
                  </button>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('results')}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={() => saveGradingRules(gradingRules)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
                    >
                      <Check size={15} />
                      <span>গ্রেডিং কনফিগারেশন সংরক্ষণ করুন</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* Add / Edit Exam Result Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-4"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <FileText size={18} className="text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-850">
                      {editingMark ? 'পরীক্ষার ফলাফল সম্পাদন করুন' : 'নতুন পরীক্ষার ফলাফল এন্ট্রি করুন'}
                    </h3>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      শ্রেণীভিত্তিক নির্ধারিত বিষয়ে প্রাপ্ত নম্বর যোগ করুন (কনফিগার করা গড় নম্বর স্কেল অনুযায়ী গ্রেড নির্ধারিত হবে)
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* 1. Student Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    শিক্ষার্থী নির্বাচন করুন *
                  </label>
                  <select
                    value={formStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 focus:bg-white bg-slate-50/50 cursor-pointer"
                    required
                  >
                    <option value="">-- শিক্ষার্থী নির্বাচন করুন --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (রোল: {convertToBanglaNumber(s.roll)}, শ্রেণী: {s.gradeClass})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Class and Exam Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      শ্রেণী / বিভাগ নির্ধারণ *
                    </label>
                    <select
                      value={formClass}
                      onChange={(e) => handleFormClassChange(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 focus:bg-white bg-slate-50/50 cursor-pointer"
                    >
                      {availableClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      শ্রেণী পরিবর্তনের সাথে বিষয় স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে।
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      পরীক্ষার ধরণ *
                    </label>
                    <select
                      value={formExamType}
                      onChange={(e) => setFormExamType(e.target.value as any)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 focus:bg-white bg-slate-50/50 cursor-pointer"
                    >
                      <option value="ত্রৈমাসিক">ত্রৈমাসিক পরীক্ষা</option>
                      <option value="ষাণ্মাসিক">ষাণ্মাসিক পরীক্ষা</option>
                      <option value="বার্ষিক">বার্ষিক পরীক্ষা</option>
                    </select>
                  </div>
                </div>

                {/* 3. Dynamic Subjects & Marks Inputs */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                        <BookOpen size={14} className="text-indigo-600" />
                        <span>{formClass} এর বিষয় ও প্রাপ্ত নম্বর</span>
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        প্রতিটি বিষয়ের পূর্ণমান ১০০ নম্বর। প্রয়োজনে বিষয় পরিবর্তন বা নতুন বিষয় যোগ করতে পারেন।
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-md">
                      মোট {convertToBanglaNumber(formSubjectScores.length)} টি বিষয়
                    </span>
                  </div>

                  {/* Subject rows */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {formSubjectScores.map((scoreItem, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <span className="w-5 text-center text-xs font-bold text-slate-400 font-mono">
                          {convertToBanglaNumber(idx + 1)}.
                        </span>

                        <input
                          type="text"
                          value={scoreItem.subjectName}
                          onChange={(e) => handleSubjectNameChange(idx, e.target.value)}
                          placeholder="বিষয়ের নাম..."
                          className="flex-1 text-xs font-bold text-slate-800 bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-indigo-600 py-1"
                          required
                        />

                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={scoreItem.marks === 0 ? '' : scoreItem.marks}
                            onChange={(e) => handleSubjectMarkChange(idx, parseInt(e.target.value, 10))}
                            placeholder="০"
                            className="w-16 text-center font-bold font-mono text-xs border border-slate-200 rounded-lg py-1 px-1.5 outline-none focus:border-indigo-600 bg-slate-50 focus:bg-white"
                            required
                          />
                          <span className="text-[10px] text-slate-400 font-mono">/১০০</span>
                        </div>

                        {formSubjectScores.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubjectFromForm(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="বিষয়টি বাদ দিন"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Extra Subject Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newSubjectInput}
                      onChange={(e) => setNewSubjectInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubjectToForm();
                        }
                      }}
                      placeholder="অতিরিক্ত বিষয়ের নাম লিখুন (যেমন: ড্রয়িং, উর্দূ)..."
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubjectToForm}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <Plus size={13} />
                      <span>বিষয় যোগ করুন</span>
                    </button>
                  </div>
                </div>

                {/* 4. Live Calculation Summary Card */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900">হিসাবকৃত মোট নম্বর:</span>
                    <strong className="text-emerald-950 font-bold font-mono text-sm">
                      {convertToBanglaNumber(formCalculations.total)} / {convertToBanglaNumber(formCalculations.fullTotal)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900">গড় নম্বর (Average):</span>
                    <strong className="text-emerald-950 font-extrabold font-mono text-base">
                      {convertToBanglaNumber(formCalculations.average)}%
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                    <span className="font-bold text-emerald-900">অর্জিত বিভাগ ও ফলাফল:</span>
                    <div className="text-right">
                      <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs inline-block ${formCalculations.gradeInfo.badgeClass}`}>
                        {formCalculations.gradeInfo.grade}
                      </span>
                      <span className="block text-[9px] text-emerald-800 font-medium mt-0.5">
                        {formCalculations.gradeInfo.division}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-emerald-800/80 italic pt-1">
                    * কনফিগার করা গ্রেডিং নিয়ম অনুযায়ী কোনো বিষয়ে কম এবং অন্য বিষয়ে বেশি পেলেও গড় নম্বর অনুযায়ী স্বয়ংক্রিয়ভাবে ফলাফল নির্ধারিত হবে।
                  </p>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 text-xs border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {editingMark ? 'ফলাফল আপডেট করুন' : 'সফলভাবে ফলাফল সংরক্ষণ করুন'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Sanad / Marksheet View Modal */}
      <AnimatePresence>
        {isPrintModalOpen && selectedResultForPrint && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-300 w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-4"
            >
              {/* Modal Top Bar */}
              <div className="flex justify-between items-center p-4 md:p-5 border-b border-slate-100 shrink-0 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Printer size={16} className="text-emerald-700" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    সানাদ ও নম্বরপত্র ভিউয়ার (Marksheet Preview)
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const printable = document.getElementById('exam-marksheet-printable')?.innerHTML;
                      if (printable) {
                        const original = document.body.innerHTML;
                        document.body.innerHTML = printable;
                        window.print();
                        document.body.innerHTML = original;
                        window.location.reload();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer size={13} />
                    <span>প্রিন্ট বা পিডিএফ</span>
                  </button>
                  <button 
                    onClick={() => setIsPrintModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Printable Sanad Certificate Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" id="exam-marksheet-printable">
                <div className="border-4 double border-emerald-800 p-6 md:p-8 space-y-6 text-center select-none bg-amber-50/5 relative rounded-2xl">
                  <div className="absolute inset-2 border border-emerald-600/20 rounded-xl pointer-events-none"></div>
                  
                  {/* Institutional Header */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-800 font-bold border border-emerald-800 px-3.5 py-0.5 rounded-full uppercase tracking-wider">
                      মাদরাসা শিক্ষা বোর্ড নম্বরপত্র
                    </span>
                    <h2 className="text-xl font-extrabold text-emerald-950 mt-2.5 font-sans">{madrasahName}</h2>
                    <p className="text-[10px] text-slate-500 font-medium">{madrasahSlogan} • সনদ ও পরীক্ষা মূল্যায়ন শাখা</p>
                  </div>

                  <div className="h-px bg-emerald-800/20 max-w-sm mx-auto my-2"></div>

                  <h4 className="text-sm font-bold text-slate-800">
                    {selectedResultForPrint.examType} পরীক্ষার ফলাফল ও মূল্যায়ন নম্বরপত্র
                  </h4>

                  {/* Student Metadata Card */}
                  <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-xl grid grid-cols-2 gap-3 text-left text-xs text-slate-700 font-sans">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">শিক্ষার্থীর নাম:</span>
                      <strong className="text-slate-900 font-black text-sm">{selectedResultForPrint.studentName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">শ্রেণী / বিভাগ:</span>
                      <strong className="text-emerald-800 font-black">{selectedResultForPrint.gradeClass}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">ঘোষিত রোল নম্বর:</span>
                      <strong className="text-slate-900 font-bold font-mono text-sm">{convertToBanglaNumber(selectedResultForPrint.roll)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">পরীক্ষার ধরণ:</span>
                      <strong className="text-indigo-800 font-bold">{selectedResultForPrint.examType}</strong>
                    </div>
                  </div>

                  {/* Marks Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs font-sans">
                    <div className="grid grid-cols-3 bg-slate-100 font-bold text-slate-700 py-2 border-b border-slate-200">
                      <span>বিষয়সমূহ</span>
                      <span>পূর্ণমান</span>
                      <span>প্রাপ্ত নম্বর</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {selectedResultForPrint.subjectScores.map((subj, idx) => (
                        <div key={idx} className="grid grid-cols-3 py-2 text-center">
                          <span className="font-semibold text-slate-700">{subj.subjectName}</span>
                          <span className="font-mono text-slate-400">{convertToBanglaNumber(subj.fullMarks || 100)}</span>
                          <span className="font-extrabold font-mono text-emerald-800">
                            {convertToBanglaNumber(subj.marks)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total Summary */}
                    <div className="grid grid-cols-3 bg-emerald-50/80 py-2.5 border-t border-slate-200 font-bold text-slate-800">
                      <span>সর্বমোট অর্জিত নম্বর</span>
                      <span className="font-mono">{convertToBanglaNumber(selectedResultForPrint.subjectScores.length * 100)}</span>
                      <span className="font-extrabold font-mono text-sm text-emerald-900 bg-emerald-100/50 px-3 py-0.5 rounded-md inline-block mx-auto">
                        {convertToBanglaNumber(selectedResultForPrint.totalMarks)}
                      </span>
                    </div>
                  </div>

                  {/* Performance Grade Announcement with Average Marks */}
                  <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-1.5 text-xs font-sans">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-emerald-900 text-sm">
                        প্রাপ্ত গড় নম্বর ও শতকরা হার:
                      </span>
                      <strong className="text-emerald-950 font-black text-base font-mono">
                        {convertToBanglaNumber(selectedResultForPrint.averageMarks)}%
                      </strong>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-emerald-200/50">
                      <span className="font-bold text-emerald-900">
                        চূড়ান্ত ফলাফল ও গ্রেড:
                      </span>
                      <strong className="text-emerald-950 font-black text-sm bg-white px-3 py-1 rounded-lg border border-emerald-200">
                        {selectedResultForPrint.grade}
                      </strong>
                    </div>

                    <p className="text-[11px] text-emerald-800 font-medium text-left pt-1">
                      {selectedResultForPrint.averageMarks >= 80 ? (
                        <>শিক্ষার্থী পরীক্ষায় গড় {convertToBanglaNumber(selectedResultForPrint.averageMarks)}% নম্বর অর্জন করে <strong>প্রথম বিভাগে মুমতাজ (স্টার)</strong> কৃতিত্বের সাথে উত্তীর্ণ হয়েছে।</>
                      ) : selectedResultForPrint.averageMarks >= 65 ? (
                        <>শিক্ষার্থী পরীক্ষায় গড় {convertToBanglaNumber(selectedResultForPrint.averageMarks)}% নম্বর অর্জন করে <strong>প্রথম বিভাগ (জায়্যিদ জিদ্দান)</strong> নিয়ে উত্তীর্ণ হয়েছে।</>
                      ) : selectedResultForPrint.averageMarks >= 50 ? (
                        <>শিক্ষার্থী পরীক্ষায় গড় {convertToBanglaNumber(selectedResultForPrint.averageMarks)}% নম্বর অর্জন করে <strong>দ্বিতীয় বিভাগ (জায়্যিদ)</strong> নিয়ে উত্তীর্ণ হয়েছে।</>
                      ) : selectedResultForPrint.averageMarks >= 33 ? (
                        <>শিক্ষার্থী পরীক্ষায় গড় {convertToBanglaNumber(selectedResultForPrint.averageMarks)}% নম্বর অর্জন করে <strong>তৃতীয় বিভাগ (মাকবুল)</strong> নিয়ে উত্তীর্ণ হয়েছে।</>
                      ) : (
                        <>শিক্ষার্থী পরীক্ষায় পাস নম্বর অর্জন করতে ব্যর্থ হয়েছে (রাসেব)।</>
                      )}
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between items-end pt-12 text-center text-[10px] text-slate-500 font-sans">
                    <div className="space-y-1">
                      <div className="w-28 h-px bg-slate-400 mx-auto"></div>
                      <p className="font-bold text-slate-700">শ্রেণি শিক্ষকের স্বাক্ষর</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-28 h-px bg-slate-400 mx-auto"></div>
                      <p className="font-bold text-slate-700">পরীক্ষা নিয়ন্ত্রক</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-28 h-px bg-slate-400 mx-auto"></div>
                      <p className="font-bold text-slate-700">মুহতামিমের দস্তখত ও সিল</p>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-400 text-right pt-2 border-t border-slate-100">
                    সনদ ইস্যুর তারিখ: {new Date().toLocaleDateString('bn-BD')}
                  </div>

                </div>
              </div>

              {/* Modal Bottom Bar */}
              <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 shrink-0 bg-slate-50">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold font-sans transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Owner Auth Modal for Exam Finalization */}
      <OwnerAuthModal
        isOpen={isOwnerAuthOpen}
        onClose={() => {
          setIsOwnerAuthOpen(false);
          setPendingAuthAction(null);
        }}
        onSuccess={() => {
          if (pendingAuthAction?.action) {
            pendingAuthAction.action();
            setPendingAuthAction(null);
          }
        }}
        title={pendingAuthAction?.title}
        description={pendingAuthAction?.description}
      />

    </div>
  );
}
