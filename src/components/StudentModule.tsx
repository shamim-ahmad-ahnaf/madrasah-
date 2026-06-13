import React, { useState } from 'react';
import { Student, MadrasahClass } from '../types';
import { User, Search, Plus, Edit, Trash2, Phone, MapPin, Calendar, Clock, CreditCard, X, BookOpen, Check, Printer, QrCode, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

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
  const [selectedIdCardStudent, setSelectedIdCardStudent] = useState<Student | null>(null);
  const [idCardTheme, setIdCardTheme] = useState<'emerald' | 'indigo' | 'slate' | 'amber'>('emerald');

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
    setFormClass(student.gradeClass);
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

    const payload = {
      name: formName,
      roll: Number(formRoll),
      gradeClass: formClass,
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
    
    const matchesClass = selectedClassFilter === 'all' || student.gradeClass === selectedClassFilter;
    
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
              const count = students.filter(s => s.gradeClass === cls).length;
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
                  onClick={() => setSelectedIdCardStudent(student)}
                  className="p-1 px-2.5 rounded-lg border border-indigo-100 bg-indigo-50/25 hover:bg-indigo-50 text-indigo-700 transition-colors text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <CreditCard size={12} />
                  <span>আইডি কার্ড</span>
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

      {/* Student ID Card Showcase Modal */}
      {selectedIdCardStudent && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-850"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2">
                <CreditCard size={18} className="text-indigo-600" />
                <h3 className="text-sm font-black text-slate-850 font-sans">শিক্ষার্থী পরিচয়পত্র (ডিজিটাল আইডি কার্ড)</h3>
              </div>
              <button 
                onClick={() => setSelectedIdCardStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* Theme Selector */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">কার্ডের থিম নির্বাচন:</span>
                <div className="flex space-x-2">
                  {[
                    { id: 'emerald', label: 'সবুজ', bg: 'bg-emerald-600' },
                    { id: 'indigo', label: 'নীল', bg: 'bg-indigo-600' },
                    { id: 'slate', label: 'কয়লা', bg: 'bg-slate-705 bg-slate-700' },
                    { id: 'amber', label: 'সোনালী', bg: 'bg-amber-600' }
                  ].map((themeOpt) => (
                    <button
                      key={themeOpt.id}
                      onClick={() => setIdCardTheme(themeOpt.id as any)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        idCardTheme === themeOpt.id 
                          ? 'bg-slate-800 text-white shadow-xs' 
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${themeOpt.bg}`}></span>
                      {themeOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID Card Front and Back Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto py-2">
                
                {/* CARD FRONT SIDE */}
                <div 
                  id="id-card-front" 
                  className={`w-full aspect-[2.6/4] max-w-[280px] mx-auto rounded-2xl border-2 shadow-lg overflow-hidden flex flex-col relative select-none bg-white ${
                    idCardTheme === 'emerald' ? 'border-emerald-600' :
                    idCardTheme === 'indigo' ? 'border-indigo-600' :
                    idCardTheme === 'slate' ? 'border-slate-700' :
                    'border-amber-600'
                  }`}
                >
                  {/* Card Front Top Overlay Header */}
                  <div className={`p-4 pt-5 text-center text-white relative shrink-0 ${
                    idCardTheme === 'emerald' ? 'bg-emerald-800' :
                    idCardTheme === 'indigo' ? 'bg-indigo-800' :
                    idCardTheme === 'slate' ? 'bg-slate-800' :
                    'bg-amber-800'
                  }`}>
                    {/* Tiny watermark curves */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    
                    {/* Madrasah Branding */}
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      {madrasahLogoStyle === 'emblem' ? (
                        <span className="w-5 h-5 rounded-md bg-white/20 border border-white/20 flex items-center justify-center font-bold text-[9px] font-serif shrink-0">
                          {madrasahLogoText}
                        </span>
                      ) : (
                        <span className="text-sm shrink-0">{madrasahLogoIcon}</span>
                      )}
                      <h4 className="text-[10px] font-extrabold tracking-tight truncate leading-none uppercase">{madrasahName}</h4>
                    </div>
                    <p className="text-[7px] text-white/75 font-semibold tracking-widest leading-none">ছাত্র পরিচয়পত্র • STUDENT CARD</p>
                  </div>

                  {/* Top design Accent Wave Bar */}
                  <div className={`h-1.5 shrink-0 ${
                    idCardTheme === 'emerald' ? 'bg-emerald-500' :
                    idCardTheme === 'indigo' ? 'bg-indigo-500' :
                    idCardTheme === 'slate' ? 'bg-slate-500' :
                    'bg-amber-500'
                  }`}></div>

                  {/* Card Body - Profile Details */}
                  <div className="flex-1 p-4 flex flex-col items-center justify-between bg-emerald-50/5 relative">
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    {/* Profile Picture Frame placeholder */}
                    <div className="relative mt-1 shrink-0">
                      <div className={`w-18 h-18 rounded-full border-2 flex items-center justify-center bg-slate-50 overflow-hidden shadow-xs relative ${
                        idCardTheme === 'emerald' ? 'border-emerald-300' :
                        idCardTheme === 'indigo' ? 'border-indigo-300' :
                        idCardTheme === 'slate' ? 'border-slate-300' :
                        'border-amber-300'
                      }`}>
                        <User size={36} className="text-slate-400" />
                      </div>
                      <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[7px] font-black text-white leading-none ${
                        selectedIdCardStudent.isResidential 
                          ? 'bg-rose-600' 
                          : 'bg-emerald-600'
                      }`}>
                        {selectedIdCardStudent.isResidential ? 'আবাসিক' : 'অনাবাসিক'}
                      </span>
                    </div>

                    {/* Student Basic Typography Data */}
                    <div className="text-center w-full my-2">
                      <h3 className="text-xs font-black text-slate-800 tracking-tight leading-none truncate mb-1.5">
                        {selectedIdCardStudent.name}
                      </h3>
                      <p className={`text-[8px] font-bold inline-block px-2.5 py-0.5 rounded-md ${
                        idCardTheme === 'emerald' ? 'bg-emerald-50 text-emerald-800' :
                        idCardTheme === 'indigo' ? 'bg-indigo-50 text-indigo-800' :
                        idCardTheme === 'slate' ? 'bg-slate-105 bg-slate-100 text-slate-800' :
                        'bg-amber-50 text-amber-800'
                      }`}>
                        {selectedIdCardStudent.gradeClass}
                      </p>
                    </div>

                    {/* Fields Block Grid */}
                    <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 divide-y divide-slate-100 text-[8px] space-y-1.5 shrink-0">
                      <div className="flex justify-between items-center pt-1 leading-none">
                        <span className="text-slate-450 font-bold">রোল নম্বর (Roll):</span>
                        <span className="font-extrabold text-slate-800 font-mono">
                          {selectedIdCardStudent.roll.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 leading-none">
                        <span className="text-slate-450 font-bold">পিতার নাম (Father):</span>
                        <span className="font-bold text-slate-700 truncate max-w-[110px]">
                          {selectedIdCardStudent.fatherName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 leading-none">
                        <span className="text-slate-450 font-bold">মোবাইল (Mobile):</span>
                        <span className="font-semibold text-slate-750 font-mono">
                          {selectedIdCardStudent.phone}
                        </span>
                      </div>
                    </div>

                    {/* QR Code Graphic Place/Layout */}
                    <div className="w-full flex items-center justify-between pt-2.5 shrink-0 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <QrCode size={20} className="text-slate-550 shrink-0" />
                        <span className="text-[6px] text-slate-400 font-mono flex flex-col font-bold">
                          <span>REG-M-{selectedIdCardStudent.id.substring(0, 4).toUpperCase()}</span>
                          <span>CLASS-ID-{selectedIdCardStudent.roll}</span>
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-center">
                        <div className="w-8 h-4 border-b border-slate-400 shrink-0"></div>
                        <span className="text-[6px] text-slate-500 font-black pt-1 leading-none font-sans">মুহতামিমের স্বাক্ষর</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* CARD BACK SIDE */}
                <div 
                  id="id-card-back" 
                  className={`w-full aspect-[2.6/4] max-w-[280px] mx-auto rounded-2xl border-2 shadow-lg overflow-hidden flex flex-col relative select-none bg-slate-50 ${
                    idCardTheme === 'emerald' ? 'border-emerald-600' :
                    idCardTheme === 'indigo' ? 'border-indigo-600' :
                    idCardTheme === 'slate' ? 'border-slate-700' :
                    'border-amber-600'
                  }`}
                >
                  {/* Watermark Graphic Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <ShieldCheck size={180} />
                  </div>

                  {/* Card Back Header */}
                  <div className={`p-3.5 flex items-center justify-between text-white shrink-0 ${
                    idCardTheme === 'emerald' ? 'bg-emerald-900' :
                    idCardTheme === 'indigo' ? 'bg-indigo-900' :
                    idCardTheme === 'slate' ? 'bg-slate-900' :
                    'bg-amber-900'
                  }`}>
                    <span className="text-[7px] font-bold tracking-widest uppercase">জরুরী নির্দেশনাবলী</span>
                    <ShieldCheck size={10} className="text-white/60" />
                  </div>

                  {/* Card Back Rules */}
                  <div className="flex-1 p-4 flex flex-col justify-between text-slate-700 text-[8px] space-y-2">
                    <ul className="space-y-1.5 list-disc pl-3 text-slate-550 font-bold leading-relaxed">
                      <li>এটি মাদরাসার একটি দাপ্তরিক সম্পত্তি। কার্ডটি হারিয়ে গেলে অবিলম্বে কর্তৃপক্ষকে জানান।</li>
                      <li>নিয়ম ও শৃঙ্খল রক্ষার্থে মাদরাসার ভিতরে পরিচয়পত্রটি পরিধান করা বাধ্যতামূলক।</li>
                      <li>এই কার্ডটি হস্তান্তরযোগ্য নয় এবং অপব্যবহার করা দণ্ডনীয় অপরাধ।</li>
                      <li>কার্ডধারী শিক্ষার্থী কোনো অনৈতিক কার্যকলাপে জড়িত হলে এই কার্ড বাতিল বলে গণ্য হবে।</li>
                    </ul>

                    <div className="bg-white p-2.5 border border-slate-200/70 rounded-xl space-y-1.5 shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                      <div className="flex items-start tracking-tight">
                        <MapPin size={9} className="text-slate-400 shrink-0 mt-0.5 mr-1" />
                        <div>
                          <p className="text-[7px] text-slate-400 font-extrabold leading-none mb-0.5">স্থায়ী ঠিকানা:</p>
                          <p className="text-slate-700 font-bold leading-tight">{selectedIdCardStudent.address || 'উল্লেখ নেই'}</p>
                        </div>
                      </div>

                      <div className="flex items-start tracking-tight">
                        <Phone size={9} className="text-slate-400 shrink-0 mt-0.5 mr-1" />
                        <div>
                          <p className="text-[7px] text-slate-400 font-extrabold leading-none mb-0.5">অভিভাবক ফোন নম্বর:</p>
                          <p className="text-slate-700 font-bold font-mono leading-tight">{selectedIdCardStudent.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Back Footer */}
                    <div className="pt-2 text-center border-t border-slate-200 shrink-0">
                      <p className="text-[7px] text-slate-500 font-extrabold leading-none mb-0.5 uppercase">{madrasahName}</p>
                      <p className="text-[6px] text-slate-400 font-medium leading-none">{madrasahSlogan} • বাংলাদেশ</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex justify-end space-x-2 shrink-0 bg-slate-50">
              <button
                onClick={() => setSelectedIdCardStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
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
