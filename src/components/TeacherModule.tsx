import React, { useState } from 'react';
import { Teacher } from '../types';
import { Search, Plus, Edit, Trash2, Phone, Briefcase, Calendar, CreditCard, X, GraduationCap, Users, Mail, MapPin, Award, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TeacherModuleProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

export default function TeacherModule({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}: TeacherModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedProfileTeacher, setSelectedProfileTeacher] = useState<Teacher | null>(null);

  // Bengali localization utilities
  const convertToBanglaNumber = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit)]);
  };

  const getExperienceString = (joinDateStr: string): string => {
    const join = new Date(joinDateStr);
    const current = new Date('2026-06-09');
    if (isNaN(join.getTime())) return 'তথ্য দেওয়া নেই';
    
    let years = current.getFullYear() - join.getFullYear();
    let months = current.getMonth() - join.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0 && months > 0) {
      return `${convertToBanglaNumber(years)} বছর ${convertToBanglaNumber(months)} মাস`;
    } else if (years > 0) {
      return `${convertToBanglaNumber(years)} বছর`;
    } else if (months > 0) {
      return `${convertToBanglaNumber(months)} মাস`;
    } else {
      return 'নতুন যোগদানকৃত';
    }
  };

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesignation, setFormDesignation] = useState('সহকারী শিক্ষক');
  const [formSubject, setFormSubject] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSalary, setFormSalary] = useState(15000);
  const [formJoinDate, setFormJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDepartments, setFormDepartments] = useState('');

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormName('');
    setFormDesignation('সহকারী শিক্ষক');
    setFormSubject('');
    setFormPhone('');
    setFormSalary(15000);
    setFormJoinDate(new Date().toISOString().split('T')[0]);
    setFormEmail('');
    setFormAddress('');
    setFormDepartments('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormName(teacher.name);
    setFormDesignation(teacher.designation);
    setFormSubject(teacher.subject);
    setFormPhone(teacher.phone);
    setFormSalary(teacher.salary);
    setFormJoinDate(teacher.joinDate);
    setFormEmail(teacher.email || '');
    setFormAddress(teacher.address || '');
    setFormDepartments(teacher.departments || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSubject || !formPhone) {
      alert('অনুগ্রহ করে শিক্ষকের নাম, পড়ানোর বিষয় ও ফোন নম্বর প্রদান করুন।');
      return;
    }

    const payload = {
      name: formName,
      designation: formDesignation,
      subject: formSubject,
      phone: formPhone,
      salary: Number(formSalary),
      joinDate: formJoinDate,
      email: formEmail,
      address: formAddress,
      departments: formDepartments,
    };

    if (editingTeacher) {
      onUpdateTeacher({ ...payload, id: editingTeacher.id });
    } else {
      onAddTeacher(payload);
    }
    handleCloseModal();
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800 font-sans">উস্তাদ ও শিক্ষক মণ্ডলী ব্যবস্থাপনা</h2>
          <p className="text-xs text-slate-500 mt-1">মাদ্রাসার সম্মানিত শিক্ষক ও কর্মচারীদের পরিচিতি, পদাভিযান ও ফোন বুক</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5"
        >
          <Plus size={18} />
          <span>নতুন শিক্ষক যুক্ত করুন</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="শিক্ষকের নাম, পদবী, বা শেখানোর বিষয় দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700"
            />
          </div>

          <div className="flex items-center justify-end px-2">
            <p className="text-xs text-slate-500 font-medium">
              মোট উস্তাদ সংখ্যা: <span className="text-emerald-700 font-bold">{filteredTeachers.length}</span> জন
            </p>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <div 
              key={teacher.id} 
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 font-sans flex items-center justify-center font-bold text-lg">
                    {teacher.name.charAt(0)}
                  </div>
                  <div>
                    <h3 
                      onClick={() => setSelectedProfileTeacher(teacher)}
                      className="text-sm font-bold text-slate-800 leading-tight hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                      title="বিস্তারিত প্রোফাইল দেখতে ক্লিক করুন"
                    >
                      {teacher.name}
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium mt-1 inline-flex items-center space-x-1">
                      <GraduationCap size={13} />
                      <span>{teacher.designation}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Briefcase size={13} className="text-slate-400 shrink-0" />
                    <span>প্রধান বিষয়: <strong className="text-slate-700">{teacher.subject}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>মোবাইল: <span className="text-slate-700 font-mono font-medium">{teacher.phone}</span></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CreditCard size={13} className="text-slate-400 shrink-0" />
                    <span>নির্ধারিত বেতন: <strong className="text-slate-700">৳ {teacher.salary.toLocaleString()} / মাস</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>যোগদানের তারিখ: <span className="text-slate-700 font-mono">{teacher.joinDate}</span></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-end space-x-2">
                <button 
                  onClick={() => setSelectedProfileTeacher(teacher)}
                  className="p-1 px-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Users size={12} />
                  <span>প্রোফাইল</span>
                </button>
                <button 
                  onClick={() => openEditModal(teacher)}
                  className="p-1 px-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 transition-colors text-xs flex items-center space-x-1"
                >
                  <Edit size={12} />
                  <span>সম্পাদনা</span>
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`আপনি কি নিশ্চিতভাবে "${teacher.name}" এর ডাটা ডিলিট করতে চান?`)) {
                      onDeleteTeacher(teacher.id);
                    }
                  }}
                  className="p-1.5 px-3 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 text-red-650 text-red-600 hover:text-red-700 transition-colors text-xs flex items-center space-x-1 font-medium cursor-pointer"
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
          <Users className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-sm font-medium">কোনো শিক্ষকের রেকর্ড পাওয়া যায়নি। নতুন উস্তাদ যুক্ত করুন!</p>
        </div>
      )}

      {/* Modal Teacher Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold font-sans">
                {editingTeacher ? 'উস্তাদের তথ্য সংশোধন' : 'নতুন উস্তাদ/শিক্ষক ফরম'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 md:pr-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">উস্তাদ/শিক্ষকের পূর্ণ নাম *</label>
                <input 
                  type="text" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="উদা: মাওলানা আব্দুর রহমান"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">পদাভিযান/উপাধি *</label>
                <select
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                >
                  <option value="মুহতামিম / Principal">মুহতামিম / Principal</option>
                  <option value="শায়খুল হাদীস">শায়খুল হাদীস</option>
                  <option value="সহকারী মুহতামিম">সহকারী মুহতামিম</option>
                  <option value="প্রধান হিফজ শিক্ষক">প্রধান হিফজ শিক্ষক</option>
                  <option value="তাজবিদ শিক্ষক">তাজবিদ শিক্ষক</option>
                  <option value="সহকারী শিক্ষক">সহকারী শিক্ষক</option>
                  <option value="বাবুর্চি ও মেস স্টাফ">বাবুর্চি ও মেস স্টাফ</option>
                  <option value="দারোয়ান / সিকিউরিটি">দারোয়ান / সিকিউরিটি</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">বিশেষায়িত বিষয় / পড়ানোর বিভাগ *</label>
                <input 
                  type="text" 
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="উদা: হিফজুল কুরআন, তাজবিদ, আরবী ব্যাকরণ"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">অধীনস্থ বিভাগ সমূহ (দায়িত্বপ্রাপ্ত শাখা)</label>
                <input 
                  type="text" 
                  value={formDepartments}
                  onChange={(e) => setFormDepartments(e.target.value)}
                  placeholder="উদা: নূরানী বিভাগ, নাজেরা বিভাগ (ঐচ্ছিক)"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">মাসিক বেতন (৳) *</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={formSalary}
                    onChange={(e) => setFormSalary(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">যোগদানের তারিখ</label>
                <input 
                  type="date" 
                  value={formJoinDate}
                  onChange={(e) => setFormJoinDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ইমেইল ঠিকানা</label>
                <input 
                  type="email" 
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="উদা: ustad@example.com (ঐচ্ছিক)"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">বাসস্থান / ঠিকানা</label>
                <textarea 
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="উদা: বাড়ি নং ১২, রোড নং ৫, ব্লক বি, মিরপুর, ঢাকা"
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 resize-none animate-none"
                />
              </div>

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
                  {editingTeacher ? 'তথ্য হালনাগাদ করুন' : 'যোগদান নিবন্ধন সম্পন্ন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Teacher Profile Card Modal */}
      <AnimatePresence>
        {selectedProfileTeacher && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center p-4 z-50 overflow-y-auto items-start">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-4 md:my-8"
            >
              {/* Profile Top Banner / Cover */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 relative">
                <button 
                  onClick={() => setSelectedProfileTeacher(null)}
                  className="absolute right-4 top-4 text-emerald-200 hover:text-white bg-emerald-700/30 hover:bg-emerald-700/50 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
                
                <div className="flex items-center space-x-4 mt-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
                    {selectedProfileTeacher.name.charAt(0)}
                  </div>
                  <div>
                    <span className="bg-emerald-400/20 text-emerald-300 font-bold tracking-wider text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                      সম্মানিত উস্তাদ (Faculty)
                    </span>
                    <h3 className="text-lg font-extrabold text-white mt-1 leading-tight">{selectedProfileTeacher.name}</h3>
                    <p className="text-xs text-emerald-100 font-semibold mt-1 inline-flex items-center space-x-1">
                      <GraduationCap size={14} className="text-emerald-300" />
                      <span>{selectedProfileTeacher.designation}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="p-6 space-y-6">
                
                {/* Section: Academic Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <BookOpen size={13} className="text-emerald-700 mt-0.5" />
                    <span>একাডেমিক বিবরণ ও পড়ানোর বিষয়</span>
                  </h4>
                  <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">প্রধান বিষয়বস্তু:</span>
                      <strong className="text-slate-800">{selectedProfileTeacher.subject}</strong>
                    </div>
                    <div className="h-px bg-slate-250/20"></div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">অধীনস্থ বিভাগ সমূহ:</span>
                      <strong className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/40">
                        {selectedProfileTeacher.departments || 'উল্লেখ নেই'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Section: Experience details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Award size={13} className="text-emerald-700 mt-0.5" />
                    <span>চাকরি ও অভিজ্ঞতার বিবরণ (Experience)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/30 border border-emerald-100/40 rounded-2xl p-3 text-center">
                      <Clock size={16} className="text-emerald-700 mx-auto mb-1.5" />
                      <span className="text-[10px] text-slate-400 block font-semibold">মাদরাসায় যোগদানের সময়</span>
                      <strong className="text-slate-800 select-none block text-xs mt-1 font-mono">
                        {selectedProfileTeacher.joinDate}
                      </strong>
                    </div>
                    <div className="bg-emerald-50/30 border border-emerald-100/40 rounded-2xl p-3 text-center">
                      <Award size={16} className="text-emerald-700 mx-auto mb-1.5" />
                      <span className="text-[10px] text-slate-400 block font-semibold">মোট শিক্ষকতা অভিজ্ঞতা</span>
                      <strong className="text-emerald-900 block text-xs mt-1 font-extrabold">
                        {getExperienceString(selectedProfileTeacher.joinDate)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Section: Contact details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Phone size={13} className="text-emerald-700 mt-0.5" />
                    <span>যোগাযোগ ও ঠিকানা (Contact Info)</span>
                  </h4>
                  
                  <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-start space-x-3 text-xs">
                      <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-slate-400 block text-[10px]">মোবাইল নাম্বার</span>
                        <strong className="text-slate-700 font-mono text-xs">{selectedProfileTeacher.phone}</strong>
                      </div>
                      <a 
                        href={`tel:${selectedProfileTeacher.phone}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        কল দিন
                      </a>
                    </div>
                    
                    <div className="h-px bg-slate-250/20"></div>

                    <div className="flex items-start space-x-3 text-xs">
                      <Mail size={14} className="text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-slate-400 block text-[10px]">ইমেইল ঠিকানা</span>
                        <strong className="text-slate-700 text-xs font-mono">
                          {selectedProfileTeacher.email || `${selectedProfileTeacher.name.toLowerCase().replace(/\s+/g, '').replace(/[\u0980-\u09FF]/g, 'ustad')}@jamiamadrasah.org`}
                        </strong>
                      </div>
                    </div>

                    <div className="h-px bg-slate-250/20"></div>

                    <div className="flex items-start space-x-3 text-xs">
                      <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-slate-400 block text-[10px]">বাসস্থান / ঠিকানা</span>
                        <strong className="text-slate-700 text-xs font-sans">
                          {selectedProfileTeacher.address || (selectedProfileTeacher.id === 't1' 
                            ? 'মাদরাসা কমপ্লেক্স আবাসিক ভবন, বাসা-১২/এ, মিরপুর, ঢাকা' 
                            : 'জামিয়া শিক্ষক কুটির, কক্ষ নং ' + convertToBanglaNumber(selectedProfileTeacher.id.replace(/\D/g, '') || 3) + ', ঢাকা')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: System Actions / Salary */}
                <div className="bg-slate-100/60 rounded-2xl p-4 flex items-center justify-between text-xs border border-slate-200/20">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck size={16} className="text-emerald-700 mt-0.5" />
                    <span>মাসিক সম্মানী বেতন</span>
                  </div>
                  <strong className="text-slate-800 text-sm font-sans font-extrabold">
                    ৳ {selectedProfileTeacher.salary.toLocaleString()} / মাস
                  </strong>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end">
                <button 
                  onClick={() => setSelectedProfileTeacher(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
