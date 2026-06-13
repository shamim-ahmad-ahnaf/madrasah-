import React, { useState } from 'react';
import { Teacher, ClassSchedule, MadrasahClass, isClassMatch } from '../types';
import { Search, Plus, Calendar, Clock, BookOpen, Trash2, X, RefreshCw, Grid, Edit } from 'lucide-react';

interface RoutineModuleProps {
  teachers: Teacher[];
  schedules: ClassSchedule[];
  onAddSchedule: (schedule: Omit<ClassSchedule, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
  onUpdateSchedule?: (schedule: ClassSchedule) => void;
}

export default function RoutineModule({
  teachers,
  schedules,
  onAddSchedule,
  onDeleteSchedule,
  onUpdateSchedule
}: RoutineModuleProps) {
  const [selectedClassTab, setSelectedClassTab] = useState<MadrasahClass>('হিফজ');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);

  // Form states for routines
  const [formClass, setFormClass] = useState<MadrasahClass>('হিফজ');
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formStartTime, setFormStartTime] = useState('০৮:০০ AM');
  const [formEndTime, setFormEndTime] = useState('০৯:৩০ AM');
  const [formDay, setFormDay] = useState<'শনিবার' | 'রবিবার' | 'সোমবার' | 'মঙ্গলবার' | 'বুধবার' | 'বৃহস্পতিবার' | 'শুক্রবার'>('শনিবার');

  const openAddModal = () => {
    setEditingSchedule(null);
    if (teachers.length > 0) {
      setFormTeacher(teachers[0].name);
    } else {
      setFormTeacher('');
    }
    setFormSubject('');
    setFormClass(selectedClassTab);
    setFormStartTime('০৮:০০ AM');
    setFormEndTime('০৯:৩০ AM');
    setFormDay('শনিবার');
    setIsModalOpen(true);
  };

  const openEditModal = (schedule: ClassSchedule) => {
    setEditingSchedule(schedule);
    setFormClass(schedule.gradeClass);
    setFormSubject(schedule.subject);
    setFormTeacher(schedule.teacherName);
    setFormStartTime(schedule.startTime);
    setFormEndTime(schedule.endTime);
    setFormDay(schedule.day);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject || !formTeacher) {
      alert('অনুগ্রহ করে বিষয় এবং দায়ীত্বরত উস্তাদের নাম দিন।');
      return;
    }

    const payload = {
      gradeClass: formClass,
      subject: formSubject,
      teacherName: formTeacher,
      startTime: formStartTime,
      endTime: formEndTime,
      day: formDay
    };

    if (editingSchedule) {
      if (onUpdateSchedule) {
        onUpdateSchedule({
          ...payload,
          id: editingSchedule.id
        });
      }
    } else {
      onAddSchedule(payload);
    }
    handleCloseModal();
  };

  // Days list in sequence
  const days: ('শনিবার' | 'রবিবার' | 'সোমবার' | 'মঙ্গলবার' | 'বুধবার' | 'বৃহস্পতিবার' | 'শুক্রবার')[] = [
    'শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'
  ];

  // Filter schedules to display for selected class
  const displayedSchedules = schedules.filter(s => isClassMatch(s.gradeClass, selectedClassTab));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800 font-sans">ক্লাস রুটিন ও দিনপঞ্জি (Class Schedules)</h2>
          <p className="text-xs text-slate-500 mt-1">মাদ্রাসার নিয়মিত সবক, তাকরার, তাজবিদ পঠন এবং সাধারণ বিষয়ের সাপ্তাহিক সময়সূচী</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5"
        >
          <Plus size={18} />
          <span>নতুন সময়সূচী যোগ করুন</span>
        </button>
      </div>

      {/* Class division selector Tabs inside page */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {(['নূরানী', 'নাজেরা', 'হিফজ', 'কিতাব বিভাগ', 'জেনারেল'] as MadrasahClass[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedClassTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedClassTab === tab 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {tab} বিভাগ
          </button>
        ))}
      </div>

      {/* Timetable schedule display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day) => {
          const daySchedules = displayedSchedules.filter(s => s.day === day);
          
          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
              {/* Day title header card */}
              <div>
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 flex items-center space-x-1.5">
                    <Calendar size={14} className="text-emerald-700" />
                    <span>{day}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    {daySchedules.length}টি ক্লাস
                  </span>
                </div>

                {/* Schedules list list */}
                <div className="p-4 space-y-4 font-sans">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((schedule) => (
                      <div key={schedule.id} className="relative pl-3.5 border-l-2 border-emerald-600 group">
                        
                        {/* Time timing block */}
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                          <Clock size={11} />
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </div>

                        {/* Subject title */}
                        <h4 className="text-xs font-bold text-slate-800 mt-1 leading-normal">{schedule.subject}</h4>
                        
                        {/* Teacher */}
                        <p className="text-[10px] text-slate-500 mt-0.5">দায়ীত্বে: <strong className="text-slate-600">{schedule.teacherName}</strong></p>

                        {/* Edit and Delete operations */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 md:opacity-0 opacity-100 group-hover:opacity-100 transition-all flex items-center space-x-1 bg-white pl-2">
                          <button 
                            type="button"
                            onClick={() => openEditModal(schedule)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg transition-colors border border-emerald-100"
                            title="সম্পাদনা করুন"
                          >
                            <Edit size={11} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              onDeleteSchedule(schedule.id);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition-colors border border-red-100"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-[10px] text-slate-400 font-light italic">
                      এই দিন কোনো পিরিয়ড ধার্য নেই।
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal - Add Schedule Time Block */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xs font-sans">
                {editingSchedule ? 'শ্রেণী সময়সূচী সম্পাদনা ফরম' : 'নতুন ক্লাস সূচী নিবেশন'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 md:pr-4">
              
              {/* Choose Targeted Class division */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">টার্গেটেড শ্রেণী বিভাগ *</label>
                <select
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value as MadrasahClass)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                >
                  <option value="নূরানী">নূরানী বিভাগ</option>
                  <option value="নাজেরা">নাজেরা বিভাগ</option>
                  <option value="হিফজ">হিফজ বিভাগ</option>
                  <option value="কিতাব বিভাগ">কিতাব বিভাগ</option>
                  <option value="জেনারেল">জেনারেল বিভাগ</option>
                </select>
              </div>

              {/* Day of the week */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">সাপ্তাহিক দিন নির্বাচন *</label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Subject Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">সূচীর বিষয় বা কার্যক্রম নাম *</label>
                <input 
                  type="text" 
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="উদা: রিভিশন তেলাওয়াত / সবক শুনানো"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              {/* Teacher list */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">দায়ীত্বরত সম্মানিত উস্তাদ *</label>
                {teachers.length > 0 ? (
                  <select
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>{t.name} ({t.designation})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    required
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="হাতে লিখে উস্তাদের নাম দিন"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start timing */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শুরুর সময়সূচী *</label>
                  <input 
                    type="text" 
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="০৮:০০ AM"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-sans"
                  />
                </div>

                {/* End timing */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">সমাপ্তির সময়সূচী *</label>
                  <input 
                    type="text" 
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="০৯:৩০ AM"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-sans"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="bg-slate-105 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  {editingSchedule ? 'তথ্য সংশোধন করুন' : 'সময়সূচী তালিকাভুক্ত করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
