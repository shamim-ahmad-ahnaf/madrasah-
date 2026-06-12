import React, { useState, useEffect } from 'react';
import { Student, HostelRecord, MadrasahClass } from '../types';
import { 
  Home, 
  Utensils, 
  Plus, 
  Check, 
  X, 
  Search, 
  Coffee, 
  ChevronRight, 
  Moon, 
  Sun,
  Bed,
  Settings,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface HostelModuleProps {
  students: Student[];
}

export default function HostelModule({ students }: HostelModuleProps) {
  const [hostelRecords, setHostelRecords] = useState<HostelRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('সব');
  
  // Modal states
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<HostelRecord | null>(null);

  // Form states (Room Allocation)
  const [formStudentId, setFormStudentId] = useState('');
  const [formRoomNo, setFormRoomNo] = useState('');
  const [formBedNo, setFormBedNo] = useState('');

  // Auto-filter students that are marked "residential" (আবাসিক)
  const residentialStudents = students.filter(s => s.isResidential);

  // Load hostel history or seed records
  useEffect(() => {
    const stored = localStorage.getItem('madrasah_hostel_records');
    if (stored) {
      setHostelRecords(JSON.parse(stored));
    } else {
      // Create some default allocations
      const initialRecords: HostelRecord[] = residentialStudents.slice(0, 6).map((st, idx) => {
        const roomNum = (101 + Math.floor(idx / 3)).toString();
        const bedNum = `সিট-${(idx % 3) + 1}`;
        
        return {
          id: `hst-${st.id}`,
          studentId: st.id,
          studentName: st.name,
          gradeClass: st.gradeClass,
          roomNo: roomNum,
          bedNo: bedNum,
          mealStatus: {
            breakfast: idx % 2 === 0,
            lunch: idx % 3 !== 0,
            dinner: true
          },
          lastMealUpdate: new Date().toISOString().split('T')[0]
        };
      });
      setHostelRecords(initialRecords);
      localStorage.setItem('madrasah_hostel_records', JSON.stringify(initialRecords));
    }
  }, [students]);

  const saveRecords = (list: HostelRecord[]) => {
    setHostelRecords(list);
    localStorage.setItem('madrasah_hostel_records', JSON.stringify(list));
  };

  const handleMealToggle = (id: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const updated = hostelRecords.map(item => {
      if (item.id === id) {
        return {
          ...item,
          mealStatus: {
            ...item.mealStatus,
            [mealType]: !item.mealStatus[mealType]
          },
          lastMealUpdate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    });
    saveRecords(updated);
  };

  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formRoomNo || !formBedNo) return;

    // Check if allocation already exists
    const st = students.find(s => s.id === formStudentId);
    if (!st) return;

    const newAlloc: HostelRecord = {
      id: `hst-${st.id}`,
      studentId: st.id,
      studentName: st.name,
      gradeClass: st.gradeClass,
      roomNo: formRoomNo,
      bedNo: formBedNo,
      mealStatus: {
        breakfast: true,
        lunch: true,
        dinner: true
      },
      lastMealUpdate: new Date().toISOString().split('T')[0]
    };

    saveRecords([newAlloc, ...hostelRecords.filter(item => item.studentId !== formStudentId)]);
    setIsAllocationModalOpen(false);
    setFormStudentId('');
    setFormRoomNo('');
    setFormBedNo('');
  };

  const handleRemoveAllocation = (id: string) => {
    const updated = hostelRecords.filter(item => item.id !== id);
    saveRecords(updated);
  };

  // Quick helper to activate meals for ALL active boarders
  const handleBulkMealActivate = () => {
    const updated = hostelRecords.map(item => ({
      ...item,
      mealStatus: {
        breakfast: true,
        lunch: true,
        dinner: true
      },
      lastMealUpdate: new Date().toISOString().split('T')[0]
    }));
    saveRecords(updated);
    alert('আজকের জন্য সকলের ডাইনিং মিল সফলভাবে চালু করা হয়েছে!');
  };

  const filteredRecords = hostelRecords.filter(item => {
    const roomMatch = selectedRoomFilter === 'সব' || item.roomNo === selectedRoomFilter;
    const searchMatch = searchQuery.trim() === '' || 
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.roomNo.includes(searchQuery);
    return roomMatch && searchMatch;
  });

  // Unique rooms list for filter
  const uniqueRooms = Array.from(new Set(hostelRecords.map(item => item.roomNo))).sort();

  // Stats calculation
  const totalAllocated = hostelRecords.length;
  const breakfastCount = hostelRecords.filter(r => r.mealStatus.breakfast).length;
  const lunchCount = hostelRecords.filter(r => r.mealStatus.lunch).length;
  const dinnerCount = hostelRecords.filter(r => r.mealStatus.dinner).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto w-full">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">হোস্টেল আবাসী ছাত্রসংখ্যা</span>
            <strong className="text-xl font-extrabold block mt-1 font-sans text-slate-800">{totalAllocated} জন</strong>
            <span className="text-[9px] text-emerald-600 font-semibold block mt-1">আবাসিক যোগ্য: {residentialStudents.length} জন</span>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
            <Bed size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">সকালের নাশতার মিল</span>
            <strong className="text-xl font-extrabold block mt-1 font-sans text-emerald-700">{breakfastCount} টি মিল</strong>
            <span className="text-[9px] text-slate-400 block mt-1">আজকের সেশন</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <Coffee size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">দুপুরের ডাইনিং মিল</span>
            <strong className="text-xl font-extrabold block mt-1 font-sans text-amber-700">{lunchCount} টি মিল</strong>
            <span className="text-[9px] text-slate-400 block mt-1">আজকের সেশন</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <Sun size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">রাতের ডাইনিং মিল</span>
            <strong className="text-xl font-extrabold block mt-1 font-sans text-indigo-700">{dinnerCount} টি মিল</strong>
            <span className="text-[9px] text-slate-400 block mt-1">আজকের সেশন</span>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Moon size={22} />
          </div>
        </div>
      </div>

      {/* Warnings when no residential students found */}
      {residentialStudents.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-2 max-w-2xl">
          <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">আবাসিক শিক্ষার্থী কোটা ফাঁকা!</strong>
            <span>রুমে সিট বরাদ্দ করতে চাইলে প্রথমে নতুন শিক্ষার্থী ভর্তি করানোর সময় বা শিক্ষার্থী তালিকায় গিয়ে 'আবাসিক (Residential)' স্ট্যাটাস অন করুন।</span>
          </div>
        </div>
      )}

      {/* Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Main Boarder list & meal log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="হাজী ছাত্র বা রুম খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-emerald-600"
                  />
                </div>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-xl px-2 py-2 outline-none font-semibold text-slate-600 bg-white"
                >
                  <option value="সব">সকল রুম</option>
                  {uniqueRooms.map(room => (
                    <option key={room} value={room}>রুম নম্বর {room}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBulkMealActivate}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  সকল ডাইনিং সেশন ও মিল চালু
                </button>
                <button
                  onClick={() => setIsAllocationModalOpen(true)}
                  disabled={residentialStudents.length === 0}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus size={14} />
                  <span>সিট বরাদ্দ করুন</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Boarders Checksheet */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <Utensils size={14} className="text-slate-500" />
                <span>আজকের ডাইনিং মিল বুকিং ও সিট চার্ট</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold text-slate-400">আপডেট টাইমস্ট্যাম্প: আজ</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-950 font-sans shadow-inner shrink-0 leading-none">
                        R{item.roomNo}
                      </div>
                      <div>
                        <strong className="text-sm font-black text-slate-800 block leading-tight">{item.studentName}</strong>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-400 font-semibold leading-none">
                          <span>{item.gradeClass}</span>
                          <span className="text-slate-200">•</span>
                          <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">{item.bedNo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meal checkbox triggers */}
                    <div className="flex items-center space-x-4 sm:space-x-8">
                      <div className="flex space-x-2.5">
                        {/* Breakfast */}
                        <button
                          onClick={() => handleMealToggle(item.id, 'breakfast')}
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 transition-all cursor-pointer ${
                            item.mealStatus.breakfast
                              ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60 font-semibold'
                              : 'bg-white text-slate-400 border-slate-200 opacity-60'
                          }`}
                          title="সকালের নাশতা"
                        >
                          <Coffee size={11} />
                          <span className="text-[9px] font-bold">নাশতা</span>
                          {item.mealStatus.breakfast ? <Check size={10} className="text-emerald-700 ml-0.5" /> : <X size={10} className="text-slate-300 ml-0.5" />}
                        </button>

                        {/* Lunch */}
                        <button
                          onClick={() => handleMealToggle(item.id, 'lunch')}
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 transition-all cursor-pointer ${
                            item.mealStatus.lunch
                              ? 'bg-amber-50/70 text-amber-800 border-amber-200/60 font-semibold'
                              : 'bg-white text-slate-400 border-slate-200 opacity-60'
                          }`}
                          title="দুপুরের খাবার"
                        >
                          <Sun size={11} />
                          <span className="text-[9px] font-bold">দুপুরের মিল</span>
                          {item.mealStatus.lunch ? <Check size={10} className="text-amber-700 ml-0.5" /> : <X size={10} className="text-slate-300 ml-0.5" />}
                        </button>

                        {/* Dinner */}
                        <button
                          onClick={() => handleMealToggle(item.id, 'dinner')}
                          className={`px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 transition-all cursor-pointer ${
                            item.mealStatus.dinner
                              ? 'bg-indigo-50/70 text-indigo-800 border-indigo-200/60 font-semibold'
                              : 'bg-white text-slate-400 border-slate-200 opacity-60'
                          }`}
                          title="রাতের খাবার"
                        >
                          <Moon size={11} />
                          <span className="text-[9px] font-bold">রাতের মিল</span>
                          {item.mealStatus.dinner ? <Check size={10} className="text-indigo-700 ml-0.5" /> : <X size={10} className="text-slate-300 ml-0.5" />}
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveAllocation(item.id)}
                        className="text-slate-350 hover:text-rose-600 transition-colors cursor-pointer p-1.5 hover:bg-rose-50 rounded-lg"
                        title="সিট বাতিল"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-slate-400 font-medium">
                  হোস্টেলে কোনো শিক্ষার্থীর সিট বরাদ্দ করা নেই!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Boarder distribution rules / info panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-emerald-300 flex items-center gap-1">
              <Home size={14} />
              <span>হোস্টেল ও ডাইনিং নীতিমালা</span>
            </h4>
            <p className="text-[11px] leading-relaxed text-emerald-100">
              ইসলামী নিয়মানুবর্তিতা ও সুশৃঙ্খল পরিবেশ রক্ষার্থে মাদরাসার আবাসিক হোস্টেল পরিচালিত হয়। প্রতিদিন সকল আবাসিক শিক্ষার্থীদের জন্য ডাইনিংয়ে ৩ বেলা স্বাস্থ্যকর আহারের ব্যবস্থা করা থাকে।
            </p>

            <div className="space-y-2 text-[10px] text-emerald-100 bg-white/5 border border-white/10 rounded-2xl p-3.5 leading-normal">
              <p className="font-semibold flex items-start gap-1">
                <span className="text-emerald-400">১.</span>
                <span>দৈনিক ডাইনিংয়ের মিল সেশন সকাল ৮টার মধ্যে সংশ্লিষ্ট উস্তাদ বা বাবুর্চি চূড়ান্ত করবেন।</span>
              </p>
              <p className="font-semibold flex items-start gap-1 mt-1">
                <span className="text-emerald-400">২.</span>
                <span>কোনো আবাসী ছাত্র অসুস্থ বা ছুটিতে থাকলে তার মিল সাময়িকভাবে বাতিল বা নিষ্ক্রিয় (Uncheck) করা যাবে।</span>
              </p>
              <p className="font-semibold flex items-start gap-1 mt-1">
                <span className="text-emerald-450">৩.</span>
                <span>রুমে সুষম বণ্টনের লক্ষে একটি রুমে সর্বোচ্চ ৩ জন ছাত্র বরাদ্দ দেওয়ার নির্দেশনা রয়েছে।</span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800">রুম খালি ও বণ্টন চার্ট</h4>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 font-semibold">১ম তলা (রুম ১০১ - ১০৪)</span>
                </div>
                <strong className="text-slate-800 font-mono">৪টি রুম</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-600 font-semibold">২য় তলা (রুম ২০১ - ২০৪)</span>
                </div>
                <strong className="text-slate-800 font-mono">৪টি রুম</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600 font-semibold">৩য় তলা (হিফজ আবাসিক হল)</span>
                </div>
                <strong className="text-slate-800 font-mono">২টি বড় হল</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Allocation Modal */}
      {isAllocationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Bed size={16} className="text-emerald-700" />
                <span>নতুন সিট ও রুম বরাদ্দ ফর্ম</span>
              </h3>
              <button 
                onClick={() => setIsAllocationModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAllocation} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">শিক্ষার্থী নির্বাচন করুন (আবাসিক কোটাভুক্ত) *</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700"
                  required
                >
                  <option value="">নির্বাচন করুন...</option>
                  {residentialStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.gradeClass}, রোল: {s.roll})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">রুম নম্বর *</label>
                  <input
                    type="text"
                    value={formRoomNo}
                    onChange={(e) => setFormRoomNo(e.target.value)}
                    placeholder="যেমন: ১০২"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">সিট / বেড নম্বর *</label>
                  <input
                    type="text"
                    value={formBedNo}
                    onChange={(e) => setFormBedNo(e.target.value)}
                    placeholder="যেমন: সিট-৩"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAllocationModalOpen(false)}
                  className="flex-1 py-3 text-xs border border-slate-250 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  বরাদ্দ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
