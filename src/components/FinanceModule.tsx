import React, { useState } from 'react';
import { Student, FeePayment, MadrasahClass } from '../types';
import { Search, Plus, Calendar, DollarSign, CreditCard, ChevronRight, X, Printer, Receipt, FileText, Bell, Send, Trash2 } from 'lucide-react';

interface FinanceModuleProps {
  students: Student[];
  payments: FeePayment[];
  onAddPayment: (payment: Omit<FeePayment, 'id'>, sendSMS: boolean) => void;
  onSendReminderSMS: (student: Student) => void;
  onDeletePayment?: (id: string) => void;
  madrasahName?: string;
  madrasahSlogan?: string;
  showAddPaymentDirectly?: boolean | string;
  onClearAddPaymentDirectly?: () => void;
}

export default function FinanceModule({
  students,
  payments,
  onAddPayment,
  onSendReminderSMS,
  onDeletePayment,
  madrasahName,
  madrasahSlogan,
  showAddPaymentDirectly,
  onClearAddPaymentDirectly
}: FinanceModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'unpaid'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<FeePayment | null>(null);
  const [sendSMS, setSendSMS] = useState<boolean>(true);
  const [reminderNotification, setReminderNotification] = useState<string | null>(null);

  // Form states for adding payment
  const [formStudentId, setFormStudentId] = useState('');
  const [formMonth, setFormMonth] = useState('জুন');
  const [formAmount, setFormAmount] = useState<number>(1000);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMethod, setFormMethod] = useState<'নগদ (Cash)' | 'বিকাশ (bKash)' | 'ব্যাংক (Bank)'>('নগদ (Cash)');
  const [formReceiver, setFormReceiver] = useState('ক্বারী উসমান গণী');

  const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const currentMonthIndex = new Date().getMonth();
  const currentBanglaMonth = banglaMonths[currentMonthIndex] || 'জুন';

  React.useEffect(() => {
    if (showAddPaymentDirectly) {
      openAddModal(typeof showAddPaymentDirectly === 'string' ? showAddPaymentDirectly : undefined);
    }
  }, [showAddPaymentDirectly]);

  const openAddModal = (pushedStudentId?: string) => {
    let selectedStudent = students[0];
    if (pushedStudentId) {
      const found = students.find(s => s.id === pushedStudentId);
      if (found) selectedStudent = found;
    }

    if (selectedStudent) {
      setFormStudentId(selectedStudent.id);
      setFormAmount(selectedStudent.monthlyFee);
    } else {
      setFormStudentId('');
      setFormAmount(1000);
    }
    setFormMonth(currentBanglaMonth);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMethod('নগদ (Cash)');
    setFormReceiver('ক্বারী উসমান গণী');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onClearAddPaymentDirectly) {
      onClearAddPaymentDirectly();
    }
  };

  // Pre-fill amount when student selection changes
  const handleStudentChange = (id: string) => {
    setFormStudentId(id);
    const selected = students.find(s => s.id === id);
    if (selected) {
      setFormAmount(selected.monthlyFee);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formAmount) {
      alert('সঠিক শিক্ষার্থী ও টাকার পরিমাণ দিন।');
      return;
    }

    const matchedStd = students.find(s => s.id === formStudentId);
    if (!matchedStd) return;

    const payload = {
      studentId: formStudentId,
      studentName: matchedStd.name,
      roll: matchedStd.roll,
      gradeClass: matchedStd.gradeClass,
      payingMonth: formMonth,
      amount: Number(formAmount),
      paymentDate: formDate,
      paymentMethod: formMethod,
      receiverName: formReceiver
    };

    onAddPayment(payload, sendSMS);
    handleCloseModal();
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.roll.toString() === searchTerm.trim() ||
                          p.payingMonth.includes(searchTerm);
    const matchesClass = selectedClassFilter === 'all' || p.gradeClass === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  // Calculate gross sum
  const totalReceivedFunds = filteredPayments.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800 font-sans">রশিদ ও বেতন সংগ্রহ খাতা (Fees & Finance)</h2>
          <p className="text-xs text-slate-500 mt-1">শিক্ষার্থীদের মাসিক বেতন, বোর্ডিং ফি ও অন্যান্য রশিদ সংগ্রহ হিসাব নিবেশন</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5"
        >
          <Plus size={18} />
          <span>নতুন রশিদ সংগ্রহ ফর্ম</span>
        </button>
      </div>

      {/* Finance Filter widgets */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="শিক্ষার্থীর নাম, রোল নম্বর বা পরিশোধের মাস দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700"
            />
          </div>

          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-600"
            >
              <option value="all">সকল বিভাগ (All Classes)</option>
              <option value="নূরানী">নূরানী বিভাগ</option>
              <option value="নাজেরা">নাজেরা বিভাগ</option>
              <option value="হিফজ">হিফজ বিভাগ</option>
              <option value="কিতাব বিভাগ">কিতাব বিভাগ</option>
              <option value="জেনারেল">জেনারেল বিভাগ</option>
            </select>
          </div>

          <div className="bg-emerald-50/50 p-2 border border-emerald-100 rounded-xl text-center">
            <span className="text-[10px] text-slate-500 block">সংগৃহীত সর্বমোট টাকা</span>
            <span className="text-sm font-extrabold text-emerald-800 font-mono">৳ {totalReceivedFunds.toLocaleString()}</span>
          </div>

        </div>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">পরিশোধিত রশিদের বিবরণী তালিকা</h3>
            </div>

            {filteredPayments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <div 
                    key={payment.id} 
                    onClick={() => setActiveReceipt(payment)}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-100 transition-colors">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{payment.studentName}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          শ্রেণী: {payment.gradeClass} • রোল: {payment.roll} • পেমেন্ট মাধ্যম: {payment.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-700 block">৳ {payment.amount}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">{payment.paymentDate}</span>
                      </div>
                      {onDeletePayment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePayment(payment.id);
                          }}
                          className="p-1 px-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 text-red-600 transition-colors"
                          title="রশিদ মুছুন"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                <FileText className="mx-auto text-slate-300 mb-2" size={36} />
                <p className="text-xs font-medium">কোনো রশিদ রেকর্ড পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Student Directory with custom fees rates */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800">উপযোগিতা: শিক্ষার্থীরা নির্ধারিত ফি</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">রশিদ পূরণ করতে শিক্ষার্থীর নাম বা টাকার কোঠায় চাপুন</p>
            </div>
            
            {reminderNotification && (
              <div className="bg-indigo-50 border border-indigo-150 text-indigo-850 p-2.5 text-[10px] font-bold rounded-xl animate-fade-in flex items-center space-x-1.5 leading-normal">
                <Send size={11} className="text-indigo-600 shrink-0" />
                <span>{reminderNotification}</span>
              </div>
            )}

            {/* Sidebar toggle tab */}
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-150 text-[10px] font-bold gap-1">
              <button 
                type="button"
                onClick={() => setSidebarFilter('all')}
                className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                  sidebarFilter === 'all' 
                    ? 'bg-white text-slate-800 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                সকল ({students.length})
              </button>
              <button 
                type="button"
                onClick={() => setSidebarFilter('unpaid')}
                className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                  sidebarFilter === 'unpaid' 
                    ? 'bg-rose-500 text-white shadow-xs' 
                    : 'text-rose-600 hover:bg-rose-50'
                }`}
              >
                বকেয়া ({students.filter(student => !payments.some(p => p.studentId === student.id && (p.payingMonth === currentBanglaMonth || p.payingMonth === `${currentBanglaMonth} মাস`))).length})
              </button>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {students
                .map(student => {
                  const hasPaidCurrentMonth = payments.some(p => p.studentId === student.id && (p.payingMonth === currentBanglaMonth || p.payingMonth === `${currentBanglaMonth} মাস`));
                  return { ...student, isPaidCurrent: hasPaidCurrentMonth };
                })
                .filter(student => sidebarFilter === 'all' || !student.isPaidCurrent)
                .map((student) => (
                  <div 
                    key={student.id} 
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all gap-2 ${
                      student.isPaidCurrent 
                        ? 'bg-emerald-50/10 border-emerald-100 hover:border-emerald-250' 
                        : 'bg-rose-50/20 border-rose-100/70 hover:border-rose-250 hover:bg-rose-50/40'
                    }`}
                  >
                    <div 
                      onClick={() => openAddModal(student.id)}
                      className="cursor-pointer flex-1 min-w-0"
                      title="বেতন রশিদ তৈরি করতে ক্লিক করুন"
                    >
                      <div className="flex items-center space-x-1.5 wrap">
                        <p className="font-bold text-slate-700 leading-none truncate max-w-[120px] hover:text-emerald-700 hover:underline">{student.name}</p>
                        {student.isPaidCurrent ? (
                          <span className="bg-emerald-50 border border-emerald-150 text-emerald-750 text-[8px] font-black px-1.5 py-0.2 rounded-full shrink-0">পরিশোধিত</span>
                        ) : (
                          <span className="bg-rose-50 border border-rose-150 text-rose-750 text-[8px] font-black px-1.5 py-0.2 rounded-full shrink-0">বকেয়া</span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 block leading-none">{student.gradeClass} • রোল: {student.roll}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <strong 
                        onClick={() => openAddModal(student.id)}
                        className="text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded font-mono cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-[10px]"
                        title="ক্লিক করে রশিদ জমা নিন"
                      >
                        ৳{student.monthlyFee}
                      </strong>
                      <button
                        onClick={() => {
                          onSendReminderSMS(student);
                          setReminderNotification(`${student.name} এর শিক্ষক পিতা ${student.fatherName}-কে ফি নোটিফিকেশন পাঠানো হয়েছে!`);
                          setTimeout(() => setReminderNotification(null), 4500);
                        }}
                        title="বকেয়া বেতন সতর্কবার্তা এসএমএস পাঠান"
                        className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-150/45 cursor-pointer transition-colors flex items-center space-x-0.5 shrink-0"
                      >
                        <Bell size={11} />
                        <span className="text-[8px] font-extrabold uppercase font-sans">SMS</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

      </div>

      {/* Invoice receipt print Modal views */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <h4 className="font-bold text-xs font-sans">টাকা জমার রশিদ (Payment Slip Receipt)</h4>
              <button 
                onClick={() => setActiveReceipt(null)}
                className="text-white/80 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Slip Printable area */}
            <div className="p-6 space-y-4 font-sans text-slate-800 bg-amber-50/15 overflow-y-auto flex-1 md:pr-4" id="receipt-slip">
              
              <div className="text-center pb-3 border-b border-dashed border-slate-200">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold">মাদ্রাসার মূল রশিদ কপি</span>
                <h3 className="font-extrabold text-slate-800 text-base mt-2">{madrasahName || 'দারুল উলুম মাদ্রাসা ও এতিমখানা'}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{madrasahSlogan || 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং'}</p>
              </div>

              {/* Roster detail rows */}
              <div className="space-y-2.5 text-xs">
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">রশিদ নং:</span>
                  <span className="font-mono font-bold text-slate-700">R-{activeReceipt.id.toUpperCase()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">তারিখ:</span>
                  <span className="font-mono text-slate-700 font-medium">{activeReceipt.paymentDate}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                  <span className="text-slate-400">পেমেন্ট মাধ্যম:</span>
                  <span className="text-slate-700 font-bold">{activeReceipt.paymentMethod}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">শিক্ষার্থীর নাম:</span>
                  <span className="text-slate-800 font-bold">{activeReceipt.studentName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">বিভাগ / শ্রেণী:</span>
                  <span className="text-slate-700 font-medium">{activeReceipt.gradeClass}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">রোল নং:</span>
                  <span className="text-slate-700 font-mono font-medium">{activeReceipt.roll}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200">
                  <span className="text-slate-400">পরিশোধের মাস:</span>
                  <strong className="text-emerald-800 px-2 py-0.5 bg-emerald-50 rounded">{activeReceipt.payingMonth}</strong>
                </div>

                <div className="flex items-center justify-between pt-1 text-sm bg-emerald-50/50 p-2 rounded-lg">
                  <span className="font-bold text-emerald-800">পরিশোধিত মোট টাকা:</span>
                  <strong className="text-base text-emerald-800 font-mono font-extrabold">৳ {activeReceipt.amount}</strong>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">আদায়কারী উস্তাদ:</span>
                  <span className="text-slate-600 font-bold">{activeReceipt.receiverName}</span>
                </div>

              </div>

              {/* Islamic quote signature block */}
              <div className="text-center pt-4 border-t border-dashed border-slate-200 text-[10px] text-slate-400 italic">
                "নিশ্চয়ই দান ও ইলম অর্জনের সাহায্যকারীকে আল্লাহ পুরস্কৃত করবেন।"
              </div>

            </div>

            {/* Print trigger block button */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button 
                onClick={() => {
                  window.print();
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Printer size={13} />
                <span>রশিদ প্রিন্ট বা পিডিএফ ডাউনলোড করুন</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal - Add Payment Log */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold font-sans">নতুন রশিদ সংগ্রহ নিবেশন</h3>
              <button 
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-emerald-700/50 hover:bg-emerald-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 md:pr-4">
              
              {/* Choose Student */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">শিক্ষার্থী নির্বাচন *</label>
                {students.length > 0 ? (
                  <select
                    value={formStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gradeClass}, রোল: {s.roll})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-red-600 font-bold block bg-red-50 p-2 rounded-lg">
                    প্রথমে শিক্ষার্থী ভর্তি করতে হবে!
                  </span>
                )}
              </div>

              {/* Paying Month */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">পরিশোধের মাস নির্ধারণ *</label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                >
                  {['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর', 'রমজান মাস', 'শাবান মাস', 'শওয়াল মাস'].map((monthName) => (
                    <option key={monthName} value={monthName}>{monthName}</option>
                  ))}
                </select>
              </div>

              {/* Amount paid */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">জমার পরিমাণ (৳) *</label>
                <input 
                  type="number" 
                  required
                  min={1}
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Pay Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পেমেন্ট মাধ্যম *</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                  >
                    <option value="নগদ (Cash)">নগদ (Cash)</option>
                    <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                    <option value="ব্যাংক (Bank)">ব্যাংক (Bank)</option>
                  </select>
                </div>

                {/* Pay Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">জমার তারিখ *</label>
                  <input 
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* Receiver */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">আদায়কারী উস্তাদের নাম</label>
                <input 
                  type="text" 
                  value={formReceiver}
                  onChange={(e) => setFormReceiver(e.target.value)}
                  placeholder="উদা: ক্বারী উসমান গণী"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700"
                />
              </div>

              {/* SMS Alert */}
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-755 cursor-pointer select-none bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60">
                <input 
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer accent-emerald-600"
                />
                <span>অভিভাবকের মোবাইলে সফল পরিশোধের এসএমএস নিশ্চিতকরণ পাঠান</span>
              </label>

              {/* Action */}
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
                  disabled={students.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:bg-slate-350"
                >
                  রশিদ কপি তৈরি করুন
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
