import React, { useState, useEffect } from 'react';
import { Student, ExamMark, MadrasahClass } from '../types';
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
  X
} from 'lucide-react';
import { motion } from 'motion/react';

interface ExamModuleProps {
  students: Student[];
}

export default function ExamModule({ students }: ExamModuleProps) {
  const [examMarks, setExamMarks] = useState<ExamMark[]>([]);
  const [selectedClass, setSelectedClass] = useState<MadrasahClass | 'সব'>('সব');
  
  // Dynamic profile settings from settings master
  const madrasahName = (localStorage.getItem('madrasah_profile_name') || 'মারকাযুল কুরআন মাদরাসা').replace('ঐতিহ্যবাহী', '').trim();
  const madrasahSlogan = localStorage.getItem('madrasah_profile_slogan') || 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং';
  const [selectedExamType, setSelectedExamType] = useState<'ত্রৈমাসিক' | 'ষাণ্মাসিক' | 'বার্ষিক' | 'সব'>('সব');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedResultForPrint, setSelectedResultForPrint] = useState<ExamMark | null>(null);
  const [editingMark, setEditingMark] = useState<ExamMark | null>(null);

  // Form states
  const [formStudentId, setFormStudentId] = useState('');
  const [formExamType, setFormExamType] = useState<'ত্রৈমাসিক' | 'ষাণ্মাসিক' | 'বার্ষিক'>('বার্ষিক');
  const [quranMarks, setQuranMarks] = useState<number>(0);
  const [hadithMarks, setHadithMarks] = useState<number>(0);
  const [arabicMarks, setArabicMarks] = useState<number>(0);
  const [banglaMarks, setBanglaMarks] = useState<number>(0);
  const [mathMarks, setMathMarks] = useState<number>(0);

  // Load marks from storage
  useEffect(() => {
    const stored = localStorage.getItem('madrasah_exam_marks');
    if (stored) {
      setExamMarks(JSON.parse(stored));
    } else {
      // Seed some marks
      const initialMarks: ExamMark[] = students.slice(0, 5).map((st, idx) => {
        const qNum = 85 + (idx % 3) * 4;
        const hNum = 78 + (idx % 2) * 5;
        const aNum = 82 - (idx % 3) * 6;
        const bNum = 70 + (idx % 4) * 5;
        const mNum = 75 + (idx % 2) * 8;
        const total = qNum + hNum + aNum + bNum + mNum;
        const avg = total / 5;
        
        return {
          id: `ex-${idx}-${st.id}`,
          studentId: st.id,
          studentName: st.name,
          roll: st.roll,
          gradeClass: st.gradeClass,
          examType: 'বার্ষিক',
          quranMarks: qNum,
          hadithMarks: hNum,
          arabicMarks: aNum,
          banglaMarks: bNum,
          mathMarks: mNum,
          totalMarks: total,
          grade: avg >= 90 ? 'মুমতাজ (A+)' : avg >= 80 ? 'জায়্যিদ জিদ্দান (A)' : avg >= 65 ? 'জায়্যিদ (B)' : avg >= 50 ? 'মাকবুল (C)' : 'রাসেব (F)'
        };
      });
      setExamMarks(initialMarks);
      localStorage.setItem('madrasah_exam_marks', JSON.stringify(initialMarks));
    }
  }, [students]);

  const saveMarks = (list: ExamMark[]) => {
    setExamMarks(list);
    localStorage.setItem('madrasah_exam_marks', JSON.stringify(list));
  };

  const calculateGrade = (total: number): string => {
    const avg = total / 5;
    if (avg >= 90) return 'মুমতাজ (A+)';
    if (avg >= 80) return 'জায়্যিদ জিদ্দান (A)';
    if (avg >= 65) return 'জায়্যিদ (B)';
    if (avg >= 50) return 'মাকবুল (C)';
    return 'রাসেব (F)';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === formStudentId);
    if (!st) return;

    const total = Number(quranMarks) + Number(hadithMarks) + Number(arabicMarks) + Number(banglaMarks) + Number(mathMarks);
    const grade = calculateGrade(total);

    if (editingMark) {
      const updated = examMarks.map(item => item.id === editingMark.id ? {
        ...item,
        studentId: formStudentId,
        studentName: st.name,
        roll: st.roll,
        gradeClass: st.gradeClass,
        examType: formExamType,
        quranMarks: Number(quranMarks),
        hadithMarks: Number(hadithMarks),
        arabicMarks: Number(arabicMarks),
        banglaMarks: Number(banglaMarks),
        mathMarks: Number(mathMarks),
        totalMarks: total,
        grade
      } : item);
      saveMarks(updated);
    } else {
      const newResult: ExamMark = {
        id: 'ex-' + Math.random().toString(36).substr(2, 9),
        studentId: formStudentId,
        studentName: st.name,
        roll: st.roll,
        gradeClass: st.gradeClass,
        examType: formExamType,
        quranMarks: Number(quranMarks),
        hadithMarks: Number(hadithMarks),
        arabicMarks: Number(arabicMarks),
        banglaMarks: Number(banglaMarks),
        mathMarks: Number(mathMarks),
        totalMarks: total,
        grade
      };
      saveMarks([newResult, ...examMarks]);
    }

    // Reset
    setIsModalOpen(false);
    setEditingMark(null);
    setFormStudentId('');
    setQuranMarks(0);
    setHadithMarks(0);
    setArabicMarks(0);
    setBanglaMarks(0);
    setMathMarks(0);
  };

  const handleEdit = (mark: ExamMark) => {
    setEditingMark(mark);
    setFormStudentId(mark.studentId);
    setFormExamType(mark.examType);
    setQuranMarks(mark.quranMarks);
    setHadithMarks(mark.hadithMarks);
    setArabicMarks(mark.arabicMarks);
    setBanglaMarks(mark.banglaMarks);
    setMathMarks(mark.mathMarks);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = examMarks.filter(item => item.id !== id);
    saveMarks(updated);
  };

  const handleOpenPrint = (mark: ExamMark) => {
    setSelectedResultForPrint(mark);
    setIsPrintModalOpen(true);
  };

  // Filters
  const filteredMarks = examMarks.filter(item => {
    const classMatch = selectedClass === 'সব' || item.gradeClass === selectedClass;
    const examMatch = selectedExamType === 'সব' || item.examType === selectedExamType;
    const searchMatch = searchQuery.trim() === '' || 
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.roll.toString().includes(searchQuery);
    return classMatch && examMatch && searchMatch;
  });

  const topScorer = filteredMarks.length > 0 
    ? [...filteredMarks].sort((a,b) => b.totalMarks - a.totalMarks)[0]
    : null;

  const passedCount = filteredMarks.filter(m => m.grade !== 'রাসেব (F)').length;
  const passRate = filteredMarks.length > 0 ? Math.round((passedCount / filteredMarks.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto w-full">
      
      {/* Top Welcome Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-850 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-indigo-300 block font-bold uppercase tracking-wider">মোট নিবন্ধিত ফলাফল</span>
            <strong className="text-2xl font-extrabold block mt-1 font-mono">{examMarks.length} টি</strong>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <FileSpreadsheet size={24} className="text-indigo-300" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-2xl border border-emerald-850 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-300 block font-bold uppercase tracking-wider">পাসের গড় হার </span>
            <strong className="text-2xl font-extrabold block mt-1 font-mono">{passRate}%</strong>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <TrendingUp size={24} className="text-emerald-300" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-100 block font-bold uppercase tracking-wider">সর্বোচ্চ নম্বরদাতা (আজকের ফিল্টারে)</span>
            {topScorer ? (
              <div className="mt-1">
                <strong className="text-sm font-bold block truncate">{topScorer.studentName}</strong>
                <span className="text-[10px] text-amber-50 font-mono">মোট নম্বর: {topScorer.totalMarks} ({topScorer.gradeClass})</span>
              </div>
            ) : (
              <strong className="text-sm font-bold block mt-1">রেকর্ড নেই</strong>
            )}
          </div>
          <div className="bg-white/15 p-3 rounded-xl">
            <Award size={24} className="text-amber-100" />
          </div>
        </div>
      </div>

      {/* Main Filter & Action Row */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
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
              onChange={(e) => setSelectedClass(e.target.value as MadrasahClass | 'সব')}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-white font-semibold text-slate-600"
            >
              <option value="সব">সকল বিভাগ</option>
              <option value="নূরানী">নূরানী বিভাগ</option>
              <option value="নাজেরা">নাজেরা বিভাগ</option>
              <option value="হিফজ">হিফজ বিভাগ</option>
              <option value="KITAB">কিতাব বিভাগ</option>
              <option value="কিতাব বিভাগ">কিতাব বিভাগ</option>
              <option value="জেনারেল">জেনারেল বিভাগ</option>
            </select>

            {/* Exam Filter */}
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600 bg-white font-semibold text-slate-600"
            >
              <option value="সব">সকল পরীক্ষা</option>
              <option value="ত্রৈমাসিক">ত্রৈমাসিক</option>
              <option value="ষাণ্মাসিক">ষাণ্মাসিক</option>
              <option value="বার্ষিক">বার্ষিক</option>
            </select>
          </div>

          <button
            onClick={() => {
              setEditingMark(null);
              setFormStudentId(students[0]?.id || '');
              setQuranMarks(0);
              setHadithMarks(0);
              setArabicMarks(0);
              setBanglaMarks(0);
              setMathMarks(0);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>নতুন ফলাফল যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Results Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-4 text-center w-16">রোল</th>
                <th className="p-4">শিক্ষার্থীর নাম ও শ্রেণী</th>
                <th className="p-4 text-center">পরীক্ষার নাম</th>
                <th className="p-4 text-center">কুরআন / হিফজ</th>
                <th className="p-4 text-center">হাদীস</th>
                <th className="p-4 text-center">আরবী</th>
                <th className="p-4 text-center">বাংলা</th>
                <th className="p-4 text-center">গণিত</th>
                <th className="p-4 text-center font-black">মোট নম্বর</th>
                <th className="p-4 text-center">গ্রেড</th>
                <th className="p-4 text-center w-28">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMarks.length > 0 ? (
                filteredMarks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center font-bold font-mono text-slate-700">{item.roll}</td>
                    <td className="p-4">
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">{item.studentName}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">{item.gradeClass}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-800 font-bold rounded-xl text-[10px]">
                        {item.examType}
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium font-mono">{item.quranMarks}</td>
                    <td className="p-4 text-center font-medium font-mono">{item.hadithMarks}</td>
                    <td className="p-4 text-center font-medium font-mono">{item.arabicMarks}</td>
                    <td className="p-4 text-center font-medium font-mono">{item.banglaMarks}</td>
                    <td className="p-4 text-center font-medium font-mono">{item.mathMarks}</td>
                    <td className="p-4 text-center font-extrabold font-mono text-indigo-700 bg-indigo-50/20">{item.totalMarks}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        item.grade.includes('F') 
                          ? 'bg-rose-50 border border-rose-100 text-rose-700' 
                          : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                      }`}>
                        {item.grade}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleOpenPrint(item)}
                          className="p-2 transition-colors hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                          title="মার্কশীট দেখুন / প্রিন্ট"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 transition-colors hover:bg-slate-100 text-indigo-600 rounded-lg cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 transition-colors hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                    কোন পরীক্ষার রেকর্ড খুঁজে পাওয়া যায়নি!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <span>{editingMark ? 'পরীক্ষার ফলাফল সম্পাদন করুন' : 'নতুন ফলাফল এন্ট্রি করুন'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  required
                >
                  <option value="">নির্বাচন করুন...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (রোল: {s.roll}, ক্লাস: {s.gradeClass})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">পরীক্ষার ধরণ *</label>
                  <select
                    value={formExamType}
                    onChange={(e) => setFormExamType(e.target.value as any)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  >
                    <option value="ত্রৈমাসিক">ত্রৈমাসিক পরীক্ষা</option>
                    <option value="ষাণ্মাসিক">ষাণ্মাসিক পরীক্ষা</option>
                    <option value="বার্ষিক">বার্ষিক পরীক্ষা</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">কুরআন / হিফজ (১০০ এর মধ্যে) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quranMarks}
                    onChange={(e) => setQuranMarks(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">হাদীস (১০০ এর মধ্যে) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={hadithMarks}
                    onChange={(e) => setHadithMarks(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">আরবী সাহিত্য (১০০) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={arabicMarks}
                    onChange={(e) => setArabicMarks(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">বাংলা ও সাধারণ (১০০) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={banglaMarks}
                    onChange={(e) => setBanglaMarks(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">গণিত (১০০) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={mathMarks}
                    onChange={(e) => setMathMarks(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">মোট হিসাবকৃত নম্বর:</span>
                <strong className="text-indigo-700 text-sm font-extrabold">
                  {Number(quranMarks) + Number(hadithMarks) + Number(arabicMarks) + Number(banglaMarks) + Number(mathMarks)} / ৫০০
                </strong>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-xs border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md"
                >
                  সফলভাবে যুক্ত করুন
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Printable Sanad / Marksheet View Modal */}
      {isPrintModalOpen && selectedResultForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-300 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">সানাদ ও নম্বরপত্র ভিউয়ার</h3>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Sanad / Certificate Board */}
              <div className="border-4 double border-emerald-800 p-6 space-y-6 text-center select-none bg-amber-50/5 relative rounded-2xl">
              <div className="absolute inset-2 border border-emerald-600/20 rounded-xl pointer-events-none"></div>
              
              {/* Header */}
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-800 font-bold border border-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">মাদরাসা শিক্ষা বোর্ড নম্বরপত্র</span>
                <h2 className="text-xl font-extrabold text-emerald-950 mt-3 font-sans">{madrasahName}</h2>
                <p className="text-[10px] text-slate-500 font-medium">{madrasahSlogan} • সনদ ও পরীক্ষা মূল্যায়ন শাখা</p>
              </div>

              <div className="h-px bg-emerald-800/20 max-w-sm mx-auto my-3"></div>

              <h4 className="text-md font-bold text-slate-800">পড়ালেখার সাময়িক মূল্যায়ন নম্বরপত্র</h4>

              {/* Student Metadata Card */}
              <div className="bg-slate-50/80 border border-slate-250/50 p-4 rounded-xl grid grid-cols-2 gap-3 text-left text-xs text-slate-700 font-sans">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">শিক্ষার্থীর নাম:</span>
                  <strong className="text-slate-850 font-black text-sm">{selectedResultForPrint.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">শ্রেণী / বিভাগ:</span>
                  <strong className="text-emerald-800 font-black">{selectedResultForPrint.gradeClass}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">ঘোষিত রোল নম্বর:</span>
                  <strong className="text-slate-850 font-bold font-mono text-sm">{selectedResultForPrint.roll}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px]">পরীক্ষার ধরণ:</span>
                  <strong className="text-indigo-800 font-bold">{selectedResultForPrint.examType}</strong>
                </div>
              </div>

              {/* Marks Sheet */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs font-sans">
                <div className="grid grid-cols-3 bg-slate-100 font-bold text-slate-600 py-2 border-b border-slate-200">
                  <span>বিষয়সমূহ</span>
                  <span>পূর্ণমান</span>
                  <span>প্রাপ্ত নম্বর</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-3 py-2">
                    <span className="font-semibold text-slate-700">আল-কুরআন ও হিফজ</span>
                    <span className="font-mono text-slate-400">১০০</span>
                    <span className="font-extrabold font-mono text-emerald-700">{selectedResultForPrint.quranMarks}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2">
                    <span className="font-semibold text-slate-700">আল-হাদীস</span>
                    <span className="font-mono text-slate-400">১০০</span>
                    <span className="font-extrabold font-mono text-emerald-700">{selectedResultForPrint.hadithMarks}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2">
                    <span className="font-semibold text-slate-700">আরবী ভাষা ও ব্যাকরণ</span>
                    <span className="font-mono text-slate-400">১০০</span>
                    <span className="font-extrabold font-mono text-emerald-700">{selectedResultForPrint.arabicMarks}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2">
                    <span className="font-semibold text-slate-700">বাংলা ও সাধারণ জ্ঞান</span>
                    <span className="font-mono text-slate-400">১০০</span>
                    <span className="font-extrabold font-mono text-emerald-700">{selectedResultForPrint.banglaMarks}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2">
                    <span className="font-semibold text-slate-700">গণিত ও হিসাব</span>
                    <span className="font-mono text-slate-400">১০০</span>
                    <span className="font-extrabold font-mono text-emerald-700">{selectedResultForPrint.mathMarks}</span>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="grid grid-cols-3 bg-emerald-50 py-2.5 border-t border-slate-200 font-bold text-slate-800">
                  <span>সর্বমোট অর্জিত</span>
                  <span className="font-mono">৫০০</span>
                  <span className="font-extrabold font-mono text-sm text-emerald-900 bg-emerald-100/50 px-2.5 py-0.5 rounded-md inline-block mx-auto">{selectedResultForPrint.totalMarks}</span>
                </div>
              </div>

              {/* Performance Grade Announcement */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between text-xs font-sans">
                <span className="font-bold text-emerald-900">চূড়ান্ত মূল্যায়নের গ্রেড ও মান:</span>
                <strong className="text-emerald-950 font-black text-sm bg-white px-3 py-1 rounded-lg border border-emerald-200/50">{selectedResultForPrint.grade}</strong>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-12 text-center text-[10px] text-slate-500 font-sans">
                <div className="space-y-1">
                  <div className="w-24 h-px bg-slate-300 mx-auto"></div>
                  <p className="font-bold text-slate-700">পরীক্ষা নিয়ন্ত্রক</p>
                </div>
                <div className="space-y-1">
                  <div className="w-24 h-px bg-slate-300 mx-auto"></div>
                  <p className="font-bold text-slate-700">মুহতামিমের দস্তখত</p>
                </div>
              </div>
            </div>
          </div>

            <div className="p-6 border-t border-slate-100 flex justify-end space-x-2 shrink-0 bg-slate-50">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold font-sans transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-xl text-xs font-bold font-sans transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer size={13} />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
