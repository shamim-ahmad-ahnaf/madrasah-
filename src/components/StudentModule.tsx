import React, { useState } from 'react';
import { Student, MadrasahClass, isClassMatch } from '../types';
import { User, Search, Plus, Edit, Trash2, Phone, MapPin, Calendar, Clock, CreditCard, X, BookOpen, Check, Printer, QrCode, ShieldCheck, GraduationCap, Award, FileText } from 'lucide-react';
import { motion } from 'motion/react';

// Helper to parse detailed gradeClass back to division & subclass
const parseGradeClass = (gradeClass: string) => {
  const bases = ['নূরানী', 'নাজেরা', 'হিফজ', 'কিতাব বিভাগ', 'জেনারেল'];
  for (const b of bases) {
    if (gradeClass === b) {
      return { base: b as MadrasahClass, sub: '' };
    }
    if (gradeClass.startsWith(b + ' - ')) {
      return { base: b as MadrasahClass, sub: gradeClass.substring(b.length + 3) };
    }
    if (gradeClass.startsWith(b)) {
      return { base: b as MadrasahClass, sub: gradeClass.substring(b.length).trim() };
    }
  }
  for (const b of bases) {
    if (gradeClass.includes(b)) {
      return { base: b as MadrasahClass, sub: gradeClass.replace(b, '').replace(/[-\s()]+/g, '').trim() };
    }
  }
  return { base: 'জেনারেল' as MadrasahClass, sub: gradeClass };
};

interface StudentModuleProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  showAddModalDirectly?: boolean;
  onCloseModalDirectly?: () => void;
}

export default function StudentModule({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  showAddModalDirectly,
  onCloseModalDirectly
}: StudentModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all'); // 'all', 'residential', 'non-residential'
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<Student | null>(null);

  // Dynamic profile settings from settings master
  const madrasahName = (localStorage.getItem('madrasah_profile_name') || 'মারকাযুল কুরআন মাদরাসা').replace('ঐতিহ্যবাহী', '').trim();
  const madrasahSlogan = localStorage.getItem('madrasah_profile_slogan') || 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং';
  const madrasahLogoIcon = localStorage.getItem('madrasah_profile_emoji') || '🕌';
  const madrasahLogoText = localStorage.getItem('madrasah_profile_initial') || 'م';
  const madrasahLogoStyle = localStorage.getItem('madrasah_profile_logo_type') || 'emblem';

  // Form states
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState(1);
  const [formClass, setFormClass] = useState<MadrasahClass>('হিফজ');
  const [formSubClass, setFormSubClass] = useState(''); // Custom specific class/jamat name
  const [formFatherName, setFormFatherName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formIsResidential, setFormIsResidential] = useState(false);
  const [formMonthlyFee, setFormMonthlyFee] = useState(1000);
  const [formAdmissionDate, setFormAdmissionDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (showAddModalDirectly) {
      openAddModal();
    }
  }, [showAddModalDirectly]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormRoll(students.length > 0 ? Math.max(...students.map(s => s.roll)) + 1 : 1);
    setFormClass('হিফজ');
    setFormSubClass(''); // RESET custom sub-class
    setFormFatherName('');
    setFormPhone('');
    setFormAddress('');
    setFormIsResidential(false);
    setFormMonthlyFee(1000);
    setFormAdmissionDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormRoll(student.roll);
    
    // Parse the custom combined gradeClass and assign values
    const parsed = parseGradeClass(student.gradeClass);
    setFormClass(parsed.base);
    setFormSubClass(parsed.sub);
    
    setFormFatherName(student.fatherName);
    setFormPhone(student.phone);
    setFormAddress(student.address);
    setFormIsResidential(student.isResidential);
    setFormMonthlyFee(student.monthlyFee);
    setFormAdmissionDate(student.admissionDate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseModalDirectly) {
      onCloseModalDirectly();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formFatherName || !formPhone) {
      alert('অনুগ্রহ করে নাম, অভিভাবকের নাম এবং ফোন নম্বর দিন।');
      return;
    }

    // Combine department and the custom subclass name
    const finalClass = formSubClass.trim() ? `${formClass} - ${formSubClass.trim()}` : formClass;

    const payload = {
      name: formName,
      roll: Number(formRoll),
      gradeClass: finalClass as MadrasahClass,
      fatherName: formFatherName,
      phone: formPhone,
      address: formAddress,
      isResidential: formIsResidential,
      monthlyFee: Number(formMonthlyFee),
      admissionDate: formAdmissionDate,
    };

    if (editingStudent) {
      onUpdateStudent({ ...payload, id: editingStudent.id });
    } else {
      onAddStudent(payload);
    }
    handleCloseModal();
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.roll.toString() === searchTerm.trim() ||
                          student.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.phone.includes(searchTerm);
    
    const matchesClass = selectedClassFilter === 'all' || isClassMatch(student.gradeClass, selectedClassFilter);
    
    const matchesType = selectedTypeFilter === 'all' || 
                        (selectedTypeFilter === 'residential' && student.isResidential) ||
                        (selectedTypeFilter === 'non-residential' && !student.isResidential);

    return matchesSearch && matchesClass && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800">শিক্ষার্থী ভর্তি ও তালিকা ব্যবস্থাপনা</h2>
          <p className="text-xs text-slate-500 mt-1">মাদ্রাসার নিয়মিত ভর্তি হওয়া এবং আবাসিক ও অনাবাসিক শিক্ষার্থীদের ডাটাবেজ</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5"
        >
          <Plus size={18} />
          <span>নতুন শিক্ষার্থী ভর্তি করুন</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
        
        {/* Search & Secondary Filter row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Main search bar */}
          <div className="md:col-span-6 relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">শিক্ষার্থীর নাম বা রোল নম্বর দিয়ে অনুসন্ধান</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="শিক্ষার্থীর নাম অথবা ক্লাস রোল নম্বর লিখুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700 font-medium"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-sans p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Dropdown selectors (for Class & Residential type) */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">আবাসিক অবস্থা ফিল্টার</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-600 font-medium"
            >
              <option value="all">আবাসিক অবস্থা (সবগুলো)</option>
              <option value="residential">আবাসিক (Residential)</option>
              <option value="non-residential">অনাবাসিক (Non-Residential)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex flex-col items-start md:items-end justify-center pt-3 md:pt-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ফলাফল পরিসংখ্যান</span>
            <p className="text-xs text-slate-600 font-medium">
              তালিকাভুক্ত শিক্ষার্থী: <span className="text-emerald-700 font-extrabold text-sm">{filteredStudents.length}</span> / {students.length} জন
            </p>
          </div>

        </div>

        {/* Dynamic Class Quick-Filter Pills */}
        <div className="border-t border-slate-50 pt-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">মাদ্রাসার শ্রেণী ও বিভাগ সমূহ দ্বারা ফিল্টার করুন:</span>
          
          <div className="flex flex-wrap gap-2">
            {/* 'all' class pill */}
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedClassFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>সব বিভাগ</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                selectedClassFilter === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {students.length}
              </span>
            </button>

            {/* Department pills */}
            {(['নূরানী', 'নাজেরা', 'হিফজ', 'কিতাব বিভাগ', 'জেনারেল'] as MadrasahClass[]).map((cls) => {
              const count = students.filter(s => isClassMatch(s.gradeClass, cls)).length;
              const isActive = selectedClassFilter === cls;
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClassFilter(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cls} বিভাগ</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Students Data Grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStudents.map((student) => (
            <div 
              key={student.id} 
              className="bg-white rounded-2xl border border-slate-100 hover:border-emerald-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              {/* Header inside Student Card */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">{student.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {student.gradeClass}
                        </span>
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                          রোল: {student.roll}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    student.isResidential 
                      ? 'bg-amber-50 text-amber-800 border border-amber-100' 
                      : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}>
                    {student.isResidential ? 'আবাসিক' : 'অনাবাসিক'}
                  </span>
                </div>

                {/* Details list */}
                <div className="pt-2 border-t border-slate-50 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <User size={13} className="text-slate-400 shrink-0" />
                    <span>পিতা: <strong className="text-slate-700">{student.fatherName}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>ফোন: <span className="text-slate-700 font-mono font-medium">{student.phone}</span></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>ঠিকানা: <span className="text-slate-700">{student.address || 'উল্লেখ্য নেই'}</span></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CreditCard size={13} className="text-slate-400 shrink-0" />
                    <span>মাসিক বেতন ফি: <strong className="text-emerald-700">৳ {student.monthlyFee}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>ভর্তির তারিখ: <span className="text-slate-700 font-mono">{student.admissionDate}</span></span>
                  </div>
                </div>
              </div>

              {/* Action operations */}
              <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-end gap-1.5 flex-wrap shrink-0">
                <button 
                  onClick={() => setSelectedProfileStudent(student)}
                  className="p-1 px-2.5 rounded-lg border border-teal-100 bg-teal-50/25 hover:bg-teal-50 text-teal-700 transition-colors text-xs flex items-center space-x-1 cursor-pointer font-bold"
                >
                  <User size={12} />
                  <span>প্রোফাইল</span>
                </button>
                <button 
                  onClick={() => openEditModal(student)}
                  className="p-1 px-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 transition-colors text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Edit size={12} />
                  <span>সম্পাদনা</span>
                </button>
                <button 
                  onClick={() => {
                    onDeleteStudent(student.id);
                  }}
                  className="p-1.5 px-3 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors text-xs flex items-center space-x-1 font-medium cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>মুছে ফেলুন</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white text-center py-12 rounded-2xl border border-slate-100 shadow-sm text-slate-400">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-sm font-medium">কোনো শিক্ষার্থীর রেকর্ড পাওয়া যায়নি। নতুন ভর্তি করুন!</p>
        </div>
      )}

      {/* Modal - Add / Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold font-sans">
                {editingStudent ? 'শিক্ষার্থীর তথ্য পরিবর্তন করুন' : 'নতুন শিক্ষার্থী ভর্তির তথ্য ছক'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 md:pr-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শিক্ষার্থীর সম্পূর্ণ নাম *</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="উদা: আবু বকর সিদ্দিক"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                  />
                </div>

                {/* Class Division Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শ্রেণী/বিভাগ *</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value as MadrasahClass)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                  >
                    <option value="নূরানী">নূরানী</option>
                    <option value="নাজেরা">নাজেরা</option>
                    <option value="হিফজ">হিফজ</option>
                    <option value="কিতাব বিভাগ">কিতাব বিভাগ</option>
                    <option value="জেনারেল">জেনারেল</option>
                  </select>
                </div>

                {/* Roll No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">রোল নম্বর *</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={formRoll}
                    onChange={(e) => setFormRoll(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                  />
                </div>

                {/* Specific custom class input */}
                <div className="col-span-2 bg-emerald-50/15 p-3.5 rounded-2xl border border-emerald-100/50 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>নির্দিষ্ট ক্লাস বা জামাতের নাম</span>
                    <span className="text-[10px] text-emerald-600 font-normal">নিচে নিজের মতো কাস্টম নাম লিখুন (ঐচ্ছিক)</span>
                  </label>
                  <input
                    type="text"
                    value={formSubClass}
                    onChange={(e) => setFormSubClass(e.target.value)}
                    placeholder={
                      formClass === 'নূরানী' ? 'যেমন: শিশু শ্রেণী, ১ম শ্রেণী, ২য় শ্রেণী...' :
                      formClass === 'কিতাব বিভাগ' ? 'যেমন: তাইসীর, নাযীরা, নাহবেমীর, কানূনে প্রথম, মিশকাত, দাওরায়ে হাদীস...' :
                      formClass === 'নাজেরা' ? 'যেমন: ১ম গ্রুপ, সাধারণ নাজেরা...' :
                      'যেমন: শিশু জামাত, কেজি, ১ম শ্রেণী, ইত্যাদি...'
                    }
                    className="w-full text-xs border border-slate-200 focus:border-emerald-600 rounded-xl p-2.5 bg-white text-slate-700 outline-none transition-all placeholder:text-slate-400 font-sans"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">এর ফলে মূল ড্যাশবোর্ডে ও শিক্ষার্থীর আইডিতে সম্পূর্ণ শ্রেণী নাম <strong>"{formClass}{formSubClass.trim() ? ` - ${formSubClass.trim()}` : ''}"</strong> হিসেবে প্রদর্শিত হবে।</p>
                </div>

                {/* Father / Guardian Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পিতা বা অভিভাবকের নাম *</label>
                  <input 
                    type="text" 
                    required
                    value={formFatherName}
                    onChange={(e) => setFormFatherName(e.target.value)}
                    placeholder="উদা: হাফেজ মোঃ আব্দুল মান্নান"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                  />
                </div>

                {/* Phone Contact */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">মোবাইল ফোন নম্বর *</label>
                  <input 
                    type="tel" 
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-mono"
                  />
                </div>

                {/* Monthly Fee tuition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">মাসিক বেতন (৳) *</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={formMonthlyFee}
                    onChange={(e) => setFormMonthlyFee(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                  />
                </div>

                {/* Admission Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ভর্তির তারিখ</label>
                  <input 
                    type="date" 
                    value={formAdmissionDate}
                    onChange={(e) => setFormAdmissionDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-mono"
                  />
                </div>

                {/* Residential status toggle */}
                <div className="flex items-center space-x-3 pl-2 mt-6">
                  <input 
                    type="checkbox" 
                    id="isResidential"
                    checked={formIsResidential}
                    onChange={(e) => setFormIsResidential(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="isResidential" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    ছাত্রটি কি বোর্ডিং/আবাসিক?
                  </label>
                </div>

                {/* Address details */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ঠিকানা (গ্রাম, থানা, জেলা)</label>
                  <textarea 
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="এখানে শিক্ষার্থীর স্থায়ী/বর্তমান ঠিকানা লিখুন..."
                    rows={2}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                  />
                </div>
              </div>

              {/* Action Area */}
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
                  {editingStudent ? 'তথ্য হালনাগাদ করুন' : 'ভর্তি প্রক্রিয়া সম্পন্ন করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Student Profile Showcase Modal */}
      {selectedProfileStudent && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800"
          >
            {/* Modal Header Cover */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 relative text-white shrink-0">
              <button 
                onClick={() => setSelectedProfileStudent(null)}
                className="absolute right-4 top-4 text-emerald-200 hover:text-white bg-emerald-700/30 hover:bg-emerald-700/50 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center space-x-4 mt-2">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold text-lg shadow-inner shrink-0 overflow-hidden">
                  <User size={36} className="text-white/80" />
                </div>
                <div>
                  <span className={`inline-block text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-opacity-30 uppercase ${
                    selectedProfileStudent.isResidential 
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400' 
                      : 'bg-emerald-400/20 text-emerald-300 border-emerald-400'
                  }`}>
                    {selectedProfileStudent.isResidential ? 'আবাসিক শিক্ষার্থী' : 'অনাবাসিক শিক্ষার্থী'}
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-1 leading-tight font-sans">{selectedProfileStudent.name}</h3>
                  <p className="text-xs text-emerald-100 font-semibold mt-1 inline-flex items-center space-x-1">
                    <BookOpen size={14} className="text-emerald-300" />
                    <span>{selectedProfileStudent.gradeClass}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5" id="printable-student-profile">
              
              {/* Section: Academic Info */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <GraduationCap size={14} className="text-emerald-700" />
                  <span>একাডেমিক তথ্য (Academic Information)</span>
                </h4>
                <div className="bg-slate-50 border border-slate-100/70 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">শ্রেণী/শাখা:</span>
                    <strong className="text-slate-800 font-semibold">{selectedProfileStudent.gradeClass}</strong>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">শ্রেণী রোল নম্বর:</span>
                    <strong className="text-slate-800 font-mono font-bold text-sm bg-slate-100 px-2 py-0.5 rounded">{selectedProfileStudent.roll.toString().padStart(2, '0')}</strong>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">শিক্ষার্থী রেজি. আইডি:</span>
                    <strong className="text-emerald-800 font-mono font-bold">REG-M-{selectedProfileStudent.id.substring(0, 4).toUpperCase()}</strong>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">ভর্তির তারিখ:</span>
                    <strong className="text-slate-700 font-mono font-semibold">{selectedProfileStudent.admissionDate}</strong>
                  </div>
                </div>
              </div>

              {/* Section: Family & Contact Info */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <User size={14} className="text-emerald-700" />
                  <span>পারিবারিক ও যোগাযোগ বিবরণ</span>
                </h4>
                <div className="bg-slate-50 border border-slate-100/70 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">পিতা বা অভিভাবকের নাম:</span>
                    <strong className="text-slate-800 font-semibold">{selectedProfileStudent.fatherName}</strong>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex justify-between items-center text-xs border-slate-100">
                    <span className="text-slate-500 font-medium">অভিভাবকের মোবাইল নম্বর:</span>
                    <strong className="text-slate-800 font-mono font-bold">{selectedProfileStudent.phone}</strong>
                  </div>
                  <div className="h-px bg-slate-200/50"></div>
                  <div className="flex flex-col space-y-1 text-xs">
                    <span className="text-slate-500 font-medium col-span-1">স্থায়ী ঠিকানা:</span>
                    <p className="text-slate-700 font-medium leading-relaxed bg-white rounded-xl p-2.5 border border-slate-100 mt-1">{selectedProfileStudent.address || 'উল্লেখ নেই'}</p>
                  </div>
                </div>
              </div>

              {/* Section: Residential & Finance Status */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <CreditCard size={14} className="text-emerald-700" />
                  <span>আবাসিক ও আর্থিক বিবরণ</span>
                </h4>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-emerald-50/25 border border-emerald-100/40 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase font-sans">আবাসিক অবস্থা</span>
                    <strong className="text-slate-850 select-none block text-xs mt-1 font-bold">
                      {selectedProfileStudent.isResidential ? 'আবাসিক (Residential)' : 'অনাবাসিক (Non-Res)'}
                    </strong>
                  </div>
                  <div className="bg-emerald-50/25 border border-emerald-100/40 rounded-2xl p-3.5 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase font-sans">মাসিক নির্ধারিত বেতন</span>
                    <strong className="text-emerald-800 block text-sm mt-0.5 font-black">
                      ৳ {selectedProfileStudent.monthlyFee} টাকা
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dynamic Branding Emblem overlay */}
              <div className="pt-4 text-center border-t border-slate-100 shrink-0">
                <p className="text-[8px] text-slate-400 font-bold leading-none mb-0.5 uppercase tracking-wider leading-none font-sans">{madrasahName}</p>
                <p className="text-[7px] text-slate-350 font-medium leading-none font-sans">{madrasahSlogan} • বাংলাদেশ</p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end space-x-2 shrink-0 bg-slate-50">
              <button
                onClick={() => setSelectedProfileStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
              
              <button
                onClick={() => {
                  const studentToEdit = selectedProfileStudent;
                  setSelectedProfileStudent(null);
                  openEditModal(studentToEdit);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <Edit size={13} />
                <span>সম্পাদনা করুন</span>
              </button>

              <button
                onClick={() => {
                  const printContents = document.getElementById('printable-student-profile')?.innerHTML;
                  if (printContents) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>শিক্ষার্থী প্রোফাইল - ${selectedProfileStudent.name}</title>
                            <style>
                              body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                              .heading { font-size: 20px; font-weight: 800; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 20px; text-align: center; color: #065f46; }
                              .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 25px; margin-bottom: 10px; }
                              .grid { border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc; padding: 15px; }
                              .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
                              .row:last-child { border-bottom: none; }
                              .label { color: #64748b; font-weight: 600; }
                              .val { color: #0f172a; font-weight: 700; }
                              .address-val { color: #334155; font-weight: 605; padding-top: 5px; }
                              .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; }
                            </style>
                          </head>
                          <body>
                            <div class="heading">শিক্ষার্থী প্রোফাইল রেকর্ড (Student Profile Record)</div>
                            <div style="font-size: 16px; font-weight: 850; text-align: center; margin-bottom: 5px;">${selectedProfileStudent.name}</div>
                            <div style="font-size: 12px; text-align: center; color: #047857; font-weight: 700; margin-bottom: 20px;">${selectedProfileStudent.gradeClass}</div>
                            
                            <div class="section-title">একাডেমিক তথ্য</div>
                            <div class="grid">
                              <div class="row"><span class="label">শ্রেণী/শাখা:</span><span class="val">${selectedProfileStudent.gradeClass}</span></div>
                              <div class="row"><span class="label">শ্রেণী রোল নম্বর:</span><span class="val">${selectedProfileStudent.roll}</span></div>
                              <div class="row"><span class="label">রেজিস্ট্রেশন আইডি:</span><span class="val">REG-M-${selectedProfileStudent.id.substring(0, 4).toUpperCase()}</span></div>
                              <div class="row"><span class="label">ভর্তির তারিখ:</span><span class="val">${selectedProfileStudent.admissionDate}</span></div>
                            </div>

                            <div class="section-title">পারিবারিক ও যোগাযোগ বিবরণ</div>
                            <div class="grid">
                              <div class="row"><span class="label">পিতা বা অভিভাবকের নাম:</span><span class="val">${selectedProfileStudent.fatherName}</span></div>
                              <div class="row"><span class="label">মোবাইল নম্বর:</span><span class="val">${selectedProfileStudent.phone}</span></div>
                              <div class="row" style="flex-direction: column; align-items: flex-start;"><span class="label" style="margin-bottom: 4px;">ঠিকানা:</span><span class="address-val">${selectedProfileStudent.address || 'উল্লেখ নেই'}</span></div>
                            </div>

                            <div class="section-title">অন্যান্য বিবরণ</div>
                            <div class="grid">
                              <div class="row"><span class="label">আবাসিক অবস্থা:</span><span class="val">${selectedProfileStudent.isResidential ? 'আবাসিক' : 'অনাবাসিক'}</span></div>
                              <div class="row"><span class="label">মাসিক নির্ধারিত বেতন:</span><span class="val">৳ ${selectedProfileStudent.monthlyFee} টাকা</span></div>
                            </div>

                            <div class="footer">
                              <p>${madrasahName}</p>
                              <p>${madrasahSlogan}</p>
                            </div>
                            <script>window.print();</script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center space-x-1 cursor-pointer"
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
