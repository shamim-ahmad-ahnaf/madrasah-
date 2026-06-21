import React, { useState } from 'react';
import { Student, FeePayment, MadrasahClass, ExpenseRecord, Teacher, isClassMatch } from '../types';
import { Search, Plus, Calendar, DollarSign, CreditCard, ChevronRight, X, Printer, Receipt, FileText, Bell, Send, Trash2, Wallet, TrendingDown, TrendingUp, Users, BookOpen, Clock, ShieldCheck, Edit } from 'lucide-react';

interface FinanceModuleProps {
  students: Student[];
  payments: FeePayment[];
  onAddPayment: (payment: Omit<FeePayment, 'id'> & { id?: string }, sendSMS: boolean) => void;
  onSendReminderSMS: (student: Student) => void;
  onDeletePayment?: (id: string) => void;
  madrasahName?: string;
  madrasahSlogan?: string;
  showAddPaymentDirectly?: boolean | string;
  onClearAddPaymentDirectly?: () => void;
  teachers?: Teacher[];
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
  onClearAddPaymentDirectly,
  teachers
}: FinanceModuleProps) {
  const [subTab, setSubTab] = useState<'fees' | 'expenses'>('fees');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'unpaid'>('all');
  
  // Expense Ledger state with initial seeds
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    try {
      const stored = localStorage.getItem('madrasah_expenses');
      if (stored) return JSON.parse(stored) as ExpenseRecord[];
    } catch (e) {
      console.warn('Error reading madrasah_expenses from localStorage', e);
    }
    const initialExpenses: ExpenseRecord[] = [
      {
        id: 'exp_01',
        category: 'শিক্ষক ও স্টাফ বেতন',
        title: 'জুন মাসের উস্তাদদের বেতন ও হাসিয়া প্রদান',
        amount: 32000,
        date: '2026-06-09',
        voucherNo: 'V-2026-601',
        paymentMethod: 'নগদ (Cash)',
        remarks: 'হিফজুল কুরআন উস্তাদ কারি আব্দুর রহমান ও অন্যান্যদের আংশিক সম্মানী',
        payeeName: 'মুফতী কারি আব্দুর রহমান',
        salaryMonth: 'জুন'
      },
      {
        id: 'exp_02',
        category: 'ডাইনিং ও বোর্ডিং খরচ',
        title: 'লিল্লাহ বোর্ডিং বাজার খরচ',
        amount: 8750,
        date: '2026-06-05',
        voucherNo: 'V-2026-602',
        paymentMethod: 'নগদ (Cash)',
        remarks: 'ছাত্রদের ডাইনিং বাজার: চাল ৫ বস্তা ও ডাল আলু ক্রয়'
      },
      {
        id: 'exp_03',
        category: 'ইউটিলিটি ও বিল',
        title: 'কারেন্ট ও পানির বিল জুন ২০২৬',
        amount: 4300,
        date: '2026-06-08',
        voucherNo: 'V-2026-603',
        paymentMethod: 'বিকাশ (bKash)',
        remarks: 'মাদরাসার নিচতলা ও হিফজখানার বিল'
      }
    ];
    localStorage.setItem('madrasah_expenses', JSON.stringify(initialExpenses));
    return initialExpenses;
  });

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeExpenseVoucher, setActiveExpenseVoucher] = useState<ExpenseRecord | null>(null);

  // Expense form variables state
  const [expenseFormCategory, setExpenseFormCategory] = useState<ExpenseRecord['category']>('ডাইনিং ও বোর্ডিং খরচ');
  const [expenseFormTitle, setExpenseFormTitle] = useState('');
  const [expenseFormAmount, setExpenseFormAmount] = useState<number | ''>('');
  const [expenseFormDate, setExpenseFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseFormVoucherNo, setExpenseFormVoucherNo] = useState(() => `V-26-${Math.floor(100 + Math.random() * 900)}`);
  const [expenseFormMethod, setExpenseFormMethod] = useState<ExpenseRecord['paymentMethod']>('নগদ (Cash)');
  const [expenseFormTeacherId, setExpenseFormTeacherId] = useState('');
  const [expenseFormSalaryMonth, setExpenseFormSalaryMonth] = useState('জুন');
  const [expenseFormRemarks, setExpenseFormRemarks] = useState('');

  const openEditExpenseModal = (expense: ExpenseRecord) => {
    setEditExpenseId(expense.id);
    setExpenseFormCategory(expense.category);
    setExpenseFormTitle(expense.title);
    setExpenseFormAmount(expense.amount);
    setExpenseFormDate(expense.date);
    setExpenseFormVoucherNo(expense.voucherNo);
    setExpenseFormMethod(expense.paymentMethod);
    setExpenseFormTeacherId(expense.payeeId || '');
    setExpenseFormSalaryMonth(expense.salaryMonth || 'জুন');
    setExpenseFormRemarks(expense.remarks || '');
    setIsExpenseModalOpen(true);
  };

  // Fetch teachers list dynamically or fallback to localStorage
  const loadedTeachers = React.useMemo(() => {
    if (teachers && teachers.length > 0) return teachers;
    try {
      const stored = localStorage.getItem('madrasah_teachers');
      if (stored) return JSON.parse(stored) as Teacher[];
    } catch (e) {
      console.warn('Error fetching teachers inside finance: ', e);
    }
    return [];
  }, [teachers]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<FeePayment | null>(null);
  const [sendSMS, setSendSMS] = useState<boolean>(true);
  const [reminderNotification, setReminderNotification] = useState<string | null>(null);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Form states for adding payment
  const [formStudentId, setFormStudentId] = useState('');
  const [formMonth, setFormMonth] = useState('জুন');
  const [formAmount, setFormAmount] = useState<number>(1000);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMethod, setFormMethod] = useState<'নগদ (Cash)' | 'বিকাশ (bKash)' | 'ব্যাংক (Bank)'>('নগদ (Cash)');
  const [formReceiver, setFormReceiver] = useState('ক্বারী উসমান গণী');
  const [formReceiptNo, setFormReceiptNo] = useState('');

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
    // Generate an editable random receipt number
    const randomReceiptNo = Math.floor(1000 + Math.random() * 9000).toString();
    setFormReceiptNo(randomReceiptNo);
    setIsModalOpen(true);
  };

  const openEditPaymentModal = (payment: FeePayment) => {
    setEditPaymentId(payment.id);
    setFormStudentId(payment.studentId);
    setFormAmount(payment.amount);
    setFormMonth(payment.payingMonth);
    setFormDate(payment.paymentDate);
    setFormMethod(payment.paymentMethod);
    setFormReceiver(payment.receiverName);
    setFormReceiptNo(payment.id.startsWith('py-') ? payment.id.replace('py-', '').toUpperCase() : payment.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditPaymentId(null);
    setStudentSearchQuery('');
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

  const filteredStudentsForSelect = React.useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    const query = studentSearchQuery.toLowerCase().trim();
    return students.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.roll.toString().includes(query) ||
      s.gradeClass.toLowerCase().includes(query)
    );
  }, [students, studentSearchQuery]);

  React.useEffect(() => {
    if (isModalOpen && filteredStudentsForSelect.length > 0 && studentSearchQuery.trim()) {
      const isStillInList = filteredStudentsForSelect.some(s => s.id === formStudentId);
      if (!isStillInList) {
        handleStudentChange(filteredStudentsForSelect[0].id);
      }
    }
  }, [filteredStudentsForSelect, isModalOpen, studentSearchQuery, formStudentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formAmount) {
      alert('সঠিক শিক্ষার্থী ও টাকার পরিমাণ দিন।');
      return;
    }

    const matchedStd = students.find(s => s.id === formStudentId);
    if (!matchedStd) return;

    const payload = {
      id: editPaymentId || formReceiptNo.trim() || 'py-' + Math.random().toString(36).substr(2, 9),
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

    onAddPayment(payload, editPaymentId ? false : sendSMS);
    handleCloseModal();
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.roll.toString() === searchTerm.trim() ||
                          p.payingMonth.includes(searchTerm);
    const matchesClass = selectedClassFilter === 'all' || isClassMatch(p.gradeClass, selectedClassFilter);
    return matchesSearch && matchesClass;
  });

  // Calculate gross sum
  const totalReceivedFunds = filteredPayments.reduce((sum, item) => sum + item.amount, 0);

  // Dynamic Donation calculation to sync with unified balance sheets
  const totalDonationFunds = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('madrasah_donations');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
      }
    } catch (e) {
      console.warn('Error fetching donations total inside finance calculations', e);
    }
    return 43000; // standard fallback
  }, [payments, expenses]); // re-calc if payment state triggers refresh

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800 font-sans">রশিদ ও বেতন সংগ্রহ খাতা (Fees & Finance)</h2>
          <p className="text-xs text-slate-500 mt-1">শিক্ষার্থীদের মাসিক বেতন, বোর্ডিং ফি ও মাদরাসা পরিচালনা ব্যয় এবং উস্তাদ সম্মানীর দৈনন্দিন হিসাব বিবরণী খাতা</p>
        </div>
        
        {subTab === 'fees' ? (
          <button 
            onClick={openAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus size={18} />
            <span>নতুন রশিদ সংগ্রহ ফর্ম</span>
          </button>
        ) : (
          <button 
            onClick={() => {
              setExpenseFormCategory('শিক্ষক ও স্টাফ বেতন');
              setExpenseFormTitle('');
              setExpenseFormAmount('');
              setExpenseFormDate(new Date().toISOString().split('T')[0]);
              setExpenseFormRemarks('');
              setExpenseFormVoucherNo(`V-26-${Math.floor(100 + Math.random() * 900)}`);
              setExpenseFormTeacherId('');
              setExpenseFormSalaryMonth('জুন');
              setEditExpenseId(null);
              setIsExpenseModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus size={18} />
            <span>নতুন ব্যয় লিপিবদ্ধ করুন</span>
          </button>
        )}
      </div>

      {/* Consolidated Cashbook Summary Overview */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 border border-emerald-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-emerald-850 pb-3 mb-4 gap-2">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold tracking-widest text-emerald-300 uppercase flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
              মাদ্রাসা ক্যাশ বুক ও সামগ্রিক ব্যালেন্স শীট (Consolidated Cash Ledger)
            </h3>
            <p className="text-[10px] text-emerald-200/70">শিক্ষার্থীদের মাসিক বেতন ও ফি, লিল্লাহ-বোর্ডিং ফান্ড, বিবিধ দান-সদকা এবং উস্তাদ ও পরিচালনা ব্যয়ের সমন্বিত হিসাব</p>
          </div>
          <span className="text-[9px] bg-emerald-800/80 border border-emerald-700/50 text-emerald-100 px-2.5 py-1 rounded-lg font-bold shrink-0 self-start sm:self-auto font-sans">সার্বক্ষণিক তদারকি</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Total Received (Income) */}
          <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-850 hover:border-emerald-700/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-250 font-extrabold select-none">১. মোট উসুল / সংগৃহীত ফান্ড (আয়)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-800/60 flex items-center justify-center text-emerald-300 shrink-0">
                <TrendingUp size={14} className="animate-pulse" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <strong className="text-xl md:text-2xl font-black font-mono text-emerald-300 block">
                ৳ {(payments.reduce((s, p) => s + p.amount, 0) + totalDonationFunds).toLocaleString()}
              </strong>
              <div className="flex flex-wrap items-center gap-x-2 text-[9.5px] text-emerald-300/80 border-t border-emerald-800/25 pt-1.5">
                <span>ছাত্র বেতন ও ফি: <b className="font-mono text-white">৳{payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</b></span>
                <span className="opacity-40">•</span>
                <span>দান ও সদকা: <b className="font-mono text-white">৳{totalDonationFunds.toLocaleString()}</b></span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Spent (Expenses) */}
          <div className="bg-red-950/15 p-4 rounded-xl border border-rose-950/25 hover:border-rose-900/35 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-rose-250 font-extrabold select-none">২. সর্বমোট খরচ / খতিয়ান ব্যয় (ব্যয়)</span>
              <div className="w-7 h-7 rounded-lg bg-red-950/60 flex items-center justify-center text-rose-450 shrink-0">
                <TrendingDown size={14} />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <strong className="text-xl md:text-2xl font-black font-mono text-rose-450 block">
                ৳ {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
              </strong>
              <div className="flex flex-wrap items-center gap-x-2 text-[9.5px] text-rose-350/80 border-t border-rose-950/35 pt-1.5">
                <span>উস্তাদ হাসিয়া/সম্মানী: <b className="font-mono text-white">৳{expenses.filter(e => e.category === 'শিক্ষক ও স্টাফ বেতন').reduce((s, e) => s + e.amount, 0).toLocaleString()}</b></span>
                <span className="opacity-40">•</span>
                <span>ইউটিলিটি ও বোর্ডিং: <b className="font-mono text-white">৳{expenses.filter(e => e.category !== 'শিক্ষক ও স্টাফ বেতন').reduce((s, e) => s + e.amount, 0).toLocaleString()}</b></span>
              </div>
            </div>
          </div>

          {/* Card 3: Cash In Hand (Remaining balance) */}
          <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-900/25 hover:border-amber-800/35 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-250 font-extrabold select-none">৩. অবশিষ্ট নগদ তহবিল (গচ্ছিত ক্যাশ)</span>
              <div className="w-7 h-7 rounded-lg bg-amber-950/60 flex items-center justify-center text-amber-300 shrink-0">
                <Wallet size={14} />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <strong className="text-xl md:text-2xl font-black font-mono text-amber-300 block">
                ৳ {((payments.reduce((s, p) => s + p.amount, 0) + totalDonationFunds) - expenses.reduce((s, e) => s + e.amount, 0)).toLocaleString()}
              </strong>
              <div className="text-[9.5px] text-amber-200/70 border-t border-amber-900/25 pt-1.5 leading-tight font-medium">
                তিজারাত, লিল্লাহ বোর্ডিং ও সাধারণ পরিচালনায় উদ্বৃত্ত অর্থ
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Subtab Navigation Buttons */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-sm">
        <button
          onClick={() => {
            setSubTab('fees');
            setSearchTerm('');
            setSelectedClassFilter('all');
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-205 cursor-pointer flex items-center justify-center space-x-1.5 ${
            subTab === 'fees'
              ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={13} className={subTab==='fees' ? "text-emerald-700" : ""} />
          <span>আয় / ফি রশিদ</span>
        </button>
        <button
          onClick={() => {
            setSubTab('expenses');
            setSearchTerm('');
            setSelectedClassFilter('all');
            setExpenseFormVoucherNo(`V-26-${Math.floor(100 + Math.random() * 900)}`);
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all duration-205 cursor-pointer flex items-center justify-center space-x-1.5 ${
            subTab === 'expenses'
              ? 'bg-white text-indigo-950 shadow-xs border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingDown size={13} className={subTab==='expenses' ? "text-indigo-750" : ""} />
          <span>ব্যয় ও উস্তাদ বেতন</span>
        </button>
      </div>

      {subTab === 'fees' ? (
        <>
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
                              className="p-1 px-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 text-red-655 text-red-600 transition-colors cursor-pointer"
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
                              setReminderNotification(`${student.name} এর সম্মানিত পিতা ${student.fatherName}-কে বকেয়া ফি নোটিফিকেশন পাঠানো হয়েছে!`);
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
        </>
      ) : (
        /* Expenses block! */
        <div className="space-y-6">
          {/* Statistics summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <TrendingDown size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">সর্বমোট ব্যয় আউটফ্লো</span>
                <span className="text-lg font-black text-rose-700 font-mono">৳ {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">শিক্ষক বেতন বাবদ উসুল</span>
                <span className="text-lg font-black text-indigo-700 font-mono">৳ {expenses.filter(e => e.category === 'শিক্ষক ও স্টাফ বেতন').reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Wallet size={22} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">অন্যান্য পরিচালনা খরচ</span>
                <span className="text-lg font-black text-slate-700 font-mono">৳ {expenses.filter(e => e.category !== 'শিক্ষক ও স্টাফ বেতন').reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="ভাউচার নম্বর, ব্যয়ের বিবরণ বা প্রাপক উস্তাদের নাম দিয়ে খুঁজুন..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700"
                />
              </div>

              <div>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-600"
                >
                  <option value="all">সকল ব্যয়ের খাত (All Expenses)</option>
                  <option value="শিক্ষক ও স্টাফ বেতন">শিক্ষক ও স্টাফ বেতন</option>
                  <option value="ডাইনিং ও বোর্ডিং খরচ">ডাইনিং ও বোর্ডিং খরচ</option>
                  <option value="ইউটিলিটি ও বিল">ইউটিলিটি ও বিল</option>
                  <option value="নির্মাণ ও সংস্কার">নির্মাণ ও সংস্কার</option>
                  <option value="বই ও স্টেশনারি">বই ও স্টেশনারি</option>
                  <option value="বিবিধ খরচ">বিবিধ খরচ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Slices of grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Expense ledger list table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800">দৈনিক ব্যয় ও খতিয়ান হিসাব তালিকা</h3>
                  <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">ডেবিট ক্যাশ আউট</span>
                </div>

                {expenses.filter(e => {
                  const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (e.payeeName && e.payeeName.toLowerCase().includes(searchTerm.toLowerCase()));
                  const matchesCategory = selectedClassFilter === 'all' || e.category === selectedClassFilter;
                  return matchesSearch && matchesCategory;
                }).length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {expenses.filter(e => {
                      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                            e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (e.payeeName && e.payeeName.toLowerCase().includes(searchTerm.toLowerCase()));
                      const matchesCategory = selectedClassFilter === 'all' || e.category === selectedClassFilter;
                      return matchesSearch && matchesCategory;
                    }).map((exp) => (
                      <div 
                        key={exp.id} 
                        onClick={() => setActiveExpenseVoucher(exp)}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2.5 rounded-lg transition-colors ${
                            exp.category === 'শিক্ষক ও স্টাফ বেতন' 
                              ? 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100' 
                              : 'bg-red-50 text-red-700 group-hover:bg-red-100'
                          }`}>
                            <TrendingDown size={18} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-bold text-slate-800">{exp.title}</p>
                              <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono font-bold">{exp.voucherNo}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-1 leading-snug">
                              খাত: <strong className="text-slate-600">{exp.category}</strong> {exp.payeeName && `• প্রাপক: ${exp.payeeName}`} {exp.salaryMonth && `• সন্মানী মাস: ${exp.salaryMonth}`} • মাধ্যম: {exp.paymentMethod}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-rose-700 block">৳ {exp.amount}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-1">{exp.date}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpenses(prev => {
                                const updated = prev.filter(item => item.id !== exp.id);
                                localStorage.setItem('madrasah_expenses', JSON.stringify(updated));
                                return updated;
                              });
                            }}
                            className="p-1 px-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-650 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                            title="ব্যয় খতিয়ান মুছুন"
                          >
                            <Trash2 size={13} />
                          </button>
                          <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <TrendingDown className="mx-auto text-slate-200 mb-2 animate-bounce" size={36} />
                    <p className="text-xs font-medium">কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি।</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action card: Teacher list tracker details */}
            <div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800">সম্মানী প্রদান হেল্পার (Teachers Salary Tracker)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">সহজে শিক্ষক সম্মানিত উস্তাদদের হাসিয়া পরিশোধ ভাউচার তৈরি করুন</p>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {loadedTeachers.length > 0 ? (
                    loadedTeachers.map(teacher => {
                      const hasPaidThisMonth = expenses.some(e => e.payeeId === teacher.id && e.salaryMonth === 'জুন');
                      return (
                        <div 
                          key={teacher.id} 
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all gap-2 ${
                            hasPaidThisMonth 
                              ? 'bg-emerald-50/10 border-emerald-100' 
                              : 'bg-indigo-50/15 border-indigo-100/70 hover:border-indigo-250 hover:bg-indigo-50/30'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5 wrap">
                              <p className="font-bold text-slate-700 leading-none truncate max-w-[120px] hover:text-indigo-700 hover:underline cursor-pointer"
                                 onClick={() => {
                                   setExpenseFormCategory('শিক্ষক ও স্টাফ বেতন');
                                   setExpenseFormTitle(`${teacher.name} এর সম্মানী পরিশোধ`);
                                   setExpenseFormAmount(teacher.salary);
                                   setExpenseFormTeacherId(teacher.id);
                                   setExpenseFormRemarks(`${teacher.designation} পদের সম্মানী উসুল নিশ্চিত পরিশোধ।`);
                                   setExpenseFormVoucherNo(`V-26-${Math.floor(100 + Math.random() * 900)}`);
                                   setEditExpenseId(null);
                                   setIsExpenseModalOpen(true);
                                 }}
                              >
                                {teacher.name}
                              </p>
                              {hasPaidThisMonth ? (
                                <span className="bg-emerald-50 border border-emerald-150 text-emerald-750 text-[8px] font-black px-1.5 py-0.2 rounded-full shrink-0">পরিশোধিত</span>
                              ) : (
                                <span className="bg-indigo-50 border border-indigo-150 text-indigo-750 text-[8px] font-black px-1.5 py-0.2 rounded-full shrink-0">বকেয়া</span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 block leading-none">{teacher.designation} • সম্মানী: ৳{teacher.salary}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <strong 
                              onClick={() => {
                                setExpenseFormCategory('শিক্ষক ও স্টাফ বেতন');
                                setExpenseFormTitle(`${teacher.name} এর জুন মাসের সম্মানী হাসিয়া`);
                                setExpenseFormAmount(teacher.salary);
                                setExpenseFormTeacherId(teacher.id);
                                setExpenseFormSalaryMonth('জুন');
                                setExpenseFormRemarks(`${teacher.designation} পদের জুন মাসের সম্মানী উসুল নিশ্চিত পরিশোধ।`);
                                setExpenseFormVoucherNo(`V-26-${Math.floor(100 + Math.random() * 900)}`);
                                setIsExpenseModalOpen(true);
                              }}
                              className="text-slate-600 bg-white border border-slate-100 px-2 py-1 rounded font-mono cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-[10px]"
                              title=" সম্মানী পরিশোধ ফর্ম"
                            >
                              ৳{teacher.salary}
                            </strong>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-8 text-slate-400 text-xs">
                      কোনো শিক্ষক রেকর্ড পাওয়া যায়নি। শিক্ষক মডিউলে শিক্ষক যোগ করুন।
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

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
                  <span className="font-mono font-bold text-slate-700">
                    {activeReceipt.id.startsWith('py-') 
                      ? `R-${activeReceipt.id.replace('py-', '').toUpperCase()}` 
                      : activeReceipt.id.toUpperCase()}
                  </span>
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



            </div>

            {/* Print trigger block button */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button 
                onClick={() => {
                  openEditPaymentModal(activeReceipt);
                  setActiveReceipt(null);
                }}
                className="px-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semi-bold font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                title="রশিদ সংশোধন করুন"
              >
                <Edit size={13} />
                <span>সংশোধন</span>
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer size={13} />
                <span>রশিদ প্রিন্ট বা ডাউনলোড</span>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">শিক্ষার্থী নির্বাচন *</label>
                {students.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="নাম, রোল বা শ্রেণী লিখে খুঁজুন..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 outline-none focus:border-emerald-600 font-sans text-slate-700 bg-slate-50/50"
                      />
                      <Search className="absolute left-2.5 top-3 text-slate-400" size={13} />
                      {studentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs py-1 px-1.5 font-bold transition-all rounded-md"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>
                    <select
                      value={formStudentId}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-emerald-600"
                    >
                      {filteredStudentsForSelect.length > 0 ? (
                        filteredStudentsForSelect.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.gradeClass}, রোল: {s.roll})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>কোনো রেজাল্ট পাওয়া যায়নি!</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs text-red-600 font-bold block bg-red-50 p-2 rounded-lg">
                    প্রথমে শিক্ষার্থী ভর্তি করতে হবে!
                  </span>
                )}
              </div>

              {/* Receipt Number (Custom/Editable) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">রশিদ নম্বর (Receipt No) *</label>
                <input 
                  type="text" 
                  required
                  value={formReceiptNo}
                  onChange={(e) => setFormReceiptNo(e.target.value)}
                  placeholder="উদা: 5012"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600 transition-colors text-slate-700 font-mono"
                />
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

      {/* 1. New Expense Record entry Popup Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-slide-up">
            
            {/* Header */}
            <div className="bg-indigo-800 text-white p-4 flex items-center justify-between shrink-0">
              <h4 className="font-bold text-sm font-sans flex items-center space-x-2">
                <TrendingDown size={18} />
                <span>{editExpenseId ? 'ব্যয় বিবরণী ও ভাউচার সংশোধন করুন' : 'নতুন মাদরাসা ব্যয় ও সম্মানী হাসিয়া পরিশোধ লিপিবদ্ধ করুন'}</span>
              </h4>
              <button 
                onClick={() => {
                  setIsExpenseModalOpen(false);
                  setEditExpenseId(null);
                }}
                className="text-white/85 hover:text-white bg-indigo-750 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!expenseFormTitle || !expenseFormAmount) {
                  alert('দয়া করে ব্যয়ের বিবরণী ও অংক টাইপ করুন।');
                  return;
                }

                const matchedTeacher = loadedTeachers.find(t => t.id === expenseFormTeacherId);

                const payloadRecord: ExpenseRecord = {
                  id: editExpenseId || `exp_${Date.now()}`,
                  category: expenseFormCategory,
                  title: expenseFormTitle,
                  amount: Number(expenseFormAmount),
                  date: expenseFormDate,
                  voucherNo: expenseFormVoucherNo,
                  paymentMethod: expenseFormMethod,
                  remarks: expenseFormRemarks,
                  payeeId: expenseFormTeacherId || undefined,
                  payeeName: expenseFormCategory === 'শিক্ষক ও স্টাফ বেতন' 
                    ? (matchedTeacher ? matchedTeacher.name : expenseFormRemarks)
                    : (expenseFormRemarks || 'অন্যান্য প্রাপক'),
                  salaryMonth: expenseFormCategory === 'শিক্ষক ও স্টাফ বেতন' ? expenseFormSalaryMonth : undefined
                };

                setExpenses(prev => {
                  let updated: ExpenseRecord[];
                  if (editExpenseId) {
                    updated = prev.map(item => item.id === editExpenseId ? payloadRecord : item);
                  } else {
                    updated = [payloadRecord, ...prev];
                  }
                  localStorage.setItem('madrasah_expenses', JSON.stringify(updated));
                  return updated;
                });

                setIsExpenseModalOpen(false);
                setEditExpenseId(null);
              }}
              className="p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              
              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যয় বা সম্মানিত পেমেন্টের খাত *</label>
                <select
                  value={expenseFormCategory}
                  onChange={(e) => {
                    const cat = e.target.value as ExpenseRecord['category'];
                    setExpenseFormCategory(cat);
                    if (cat === 'শিক্ষক ও স্টাফ বেতন') {
                      setExpenseFormTitle('উস্তাদের মাসিক সম্মানী হাসিয়া পরিশোধ');
                    } else {
                      setExpenseFormTitle('');
                    }
                  }}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white focus:border-indigo-600 text-slate-705"
                >
                  <option value="শিক্ষক ও স্টাফ বেতন">শিক্ষক ও স্টাফ বেতন (Teacher Honors)</option>
                  <option value="ডাইনিং ও বোর্ডিং খরচ">ডাইনিং ও বোর্ডিং খরচ (Boarding / Mess)</option>
                  <option value="ইউটিলিটি ও বিল">ইউটিলিটি ও বিল (Current / Utilities)</option>
                  <option value="নির্মাণ ও সংস্কার">নির্মাণ ও সংস্কার (Construction)</option>
                  <option value="বই ও স্টেশনারি">বই ও স্টেশনারি (Books Store)</option>
                  <option value="বিবিধ খরচ">বিবিধ খরচ (General / Daily)</option>
                </select>
              </div>

              {/* Conditional dropdown if Teacher Salary */}
              {expenseFormCategory === 'শিক্ষক ও স্টাফ বেতন' && (
                <div className="grid grid-cols-2 gap-4 bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/40">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-950 mb-1">সম্মানিত শিক্ষক নির্বাচন *</label>
                    <select
                      value={expenseFormTeacherId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setExpenseFormTeacherId(id);
                        const selectedTeacher = loadedTeachers.find(t => t.id === id);
                        if (selectedTeacher) {
                          setExpenseFormAmount(selectedTeacher.salary);
                          setExpenseFormTitle(`${selectedTeacher.name} - ${expenseFormSalaryMonth} মাসের সম্মানী হাসিয়া পরিশোধ`);
                        }
                      }}
                      className="w-full text-[11px] border border-slate-200 rounded-xl p-2 outline-none bg-white focus:border-indigo-600 text-slate-700"
                    >
                      <option value="">-- শিক্ষক সিলেক্ট করুন --</option>
                      {loadedTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-indigo-950 mb-1">পরিশোধের মাস *</label>
                    <select
                      value={expenseFormSalaryMonth}
                      onChange={(e) => {
                        const m = e.target.value;
                        setExpenseFormSalaryMonth(m);
                        const selectedTeacher = loadedTeachers.find(t => t.id === expenseFormTeacherId);
                        if (selectedTeacher) {
                          setExpenseFormTitle(`${selectedTeacher.name} - ${m} মাসের সম্মানী হাসিয়া পরিশোধ`);
                        }
                      }}
                      className="w-full text-[11px] border border-slate-200 rounded-xl p-2 outline-none bg-white focus:border-indigo-600 text-slate-700"
                    >
                      <option value="রমজান">রমজান</option>
                      <option value="শাওয়াল">শাওয়াল</option>
                      <option value="রজব">রজব</option>
                      <option value="জানুয়ারি">জানুয়ারি</option>
                      <option value="ফেব্রুয়ারি">ফেব্রুয়ারি</option>
                      <option value="মার্চ">মার্চ</option>
                      <option value="এপ্রিল">এপ্রিল</option>
                      <option value="মে">মে</option>
                      <option value="জুন">জুন</option>
                      <option value="জুলাই">জুলাই</option>
                      <option value="আগস্ট">আগস্ট</option>
                      <option value="সেপ্টেম্বর">সেপ্টেম্বর</option>
                      <option value="অক্টোবর">অক্টোবর</option>
                      <option value="নভেম্বর">নভেম্বর</option>
                      <option value="ডিসেম্বর">ডিসেম্বর</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যয় বা রশিদের বিবরণী *</label>
                <input 
                  type="text" 
                  required
                  placeholder="উদা: চাল ৫ বস্তা ক্রয়, অথবা হযরত মাওলানা আব্দুর রহমান সাহেবের সম্মানী উসুল"
                  value={expenseFormTitle}
                  onChange={(e) => setExpenseFormTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 transition-colors text-slate-700"
                />
              </div>

              {/* Voucher No and Calendar Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ভাউচার নং *</label>
                  <input 
                    type="text" 
                    required
                    value={expenseFormVoucherNo}
                    onChange={(e) => setExpenseFormVoucherNo(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 transition-colors text-slate-705 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যয়ের তারিখ *</label>
                  <input 
                    type="date" 
                    required
                    value={expenseFormDate}
                    onChange={(e) => setExpenseFormDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 transition-colors text-slate-700 font-mono"
                  />
                </div>
              </div>

              {/* Amount paid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">খরচ পরিমাণ (৳) *</label>
                  <input 
                    type="number" 
                    required
                    min={1}
                    value={expenseFormAmount}
                    onChange={(e) => setExpenseFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 transition-colors text-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পেমেন্ট মাধ্যম *</label>
                  <select
                    value={expenseFormMethod}
                    onChange={(e) => setExpenseFormMethod(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-700 focus:border-indigo-600"
                  >
                    <option value="নগদ (Cash)">নগদ (Cash)</option>
                    <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                    <option value="ব্যাংক (Bank)">ব্যাংক (Bank)</option>
                  </select>
                </div>
              </div>

              {/* Remarks / Payee Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">অন্যান্য মন্তব্য বা প্রাপক নাম</label>
                <input 
                  type="text" 
                  value={expenseFormRemarks}
                  onChange={(e) => setExpenseFormRemarks(e.target.value)}
                  placeholder="উদা: কোষাধ্যক্ষ মোস্তাক আহমেদ পরিশোধ করেছেন"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 transition-colors text-slate-700"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsExpenseModalOpen(false);
                    setEditExpenseId(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  {editExpenseId ? 'ভাউচার তথ্য হালনাগাদ করুন' : 'ব্যয় লিপিবদ্ধ করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Expense Voucher details representations printable Modal */}
      {activeExpenseVoucher && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-fade-in">
            {/* Header */}
            <div className="bg-indigo-800 text-white p-4 flex items-center justify-between shrink-0">
              <h4 className="font-semibold text-xs font-sans">ব্যয় বিবরণী ক্যাশ ভাউচার (Payment Cash Voucher)</h4>
              <button 
                onClick={() => setActiveExpenseVoucher(null)}
                className="text-white/80 hover:text-white bg-indigo-700/50 hover:bg-indigo-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Receipt Area */}
            <div className="p-6 space-y-4 font-sans text-slate-800 bg-indigo-50/10 overflow-y-auto flex-1" id="expense-voucher-print">
              <div className="text-center pb-3 border-b border-dashed border-slate-200">
                <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-850 px-2 py-0.5 rounded-full font-bold">মাদরাসা ক্যাশ ডেবিট ভাউচার</span>
                <h3 className="font-black text-slate-800 text-base mt-2">{madrasahName || 'দারুল উলুম মাদ্রাসা ও এতিমখানা'}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{madrasahSlogan || 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং'}</p>
              </div>

              {/* Data Block Table */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">ভাউচার নম্বর:</span>
                  <strong className="text-slate-800 font-mono tracking-wide">{activeExpenseVoucher.voucherNo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ব্যয়ের বিবরণ:</span>
                  <span className="text-slate-800 font-semibold">{activeExpenseVoucher.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ব্যয় বা সম্মানী খাত:</span>
                  <span className="text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded-sm">{activeExpenseVoucher.category}</span>
                </div>
                {activeExpenseVoucher.payeeName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">টাকা প্রাপক:</span>
                    <strong className="text-slate-800 font-medium">{activeExpenseVoucher.payeeName}</strong>
                  </div>
                )}
                {activeExpenseVoucher.salaryMonth && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">সম্মানী হাসিয়া মাস:</span>
                    <span className="text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded">{activeExpenseVoucher.salaryMonth} মাস</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">পরিশোধের তারিখ:</span>
                  <span className="text-slate-800 font-mono font-medium">{activeExpenseVoucher.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">লেনদেন মাধ্যম:</span>
                  <span className="text-slate-800 font-medium">{activeExpenseVoucher.paymentMethod}</span>
                </div>
                {activeExpenseVoucher.remarks && (
                  <div className="bg-slate-50 border border-slate-100/80 p-2 rounded-lg text-[10px] text-slate-500 leading-normal">
                    <strong className="text-slate-600 block mb-0.5">অতিরিক্ত মন্তব্য / নোট:</strong>
                    {activeExpenseVoucher.remarks}
                  </div>
                )}
              </div>

              {/* Final Gross amount banner */}
              <div className="bg-indigo-600 rounded-xl p-3 text-white flex items-center justify-between shadow-xs">
                <span className="text-xs font-semibold opacity-90">পরিস পরিশোধিত সম্মানী</span>
                <strong className="text-base font-black tracking-wide font-mono">৳ {activeExpenseVoucher.amount.toLocaleString()} /-</strong>
              </div>

              <div className="pt-4 border-t border-dashed border-slate-200 grid grid-cols-2 text-center text-[10px]">
                <div>
                  <div className="h-8"></div>
                  <p className="border-t border-slate-300 pt-1 text-slate-400">প্রাপকের স্বাক্ষর</p>
                </div>
                <div>
                  <div className="h-8"></div>
                  <p className="border-t border-slate-300 pt-1 text-slate-400">মুহতামিম / হিসাবরক্ষক</p>
                </div>
              </div>
            </div>

            {/* Primary printer triggers */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setActiveExpenseVoucher(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors"
              >
                বন্ধ করুন
              </button>
              <button 
                type="button" 
                onClick={() => {
                  openEditExpenseModal(activeExpenseVoucher);
                  setActiveExpenseVoucher(null);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                title="সংশোধন করুন"
              >
                <Edit size={13} />
                <span>সংশোধন</span>
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const printable = document.getElementById('expense-voucher-print')?.innerHTML;
                  if (printable) {
                    const original = document.body.innerHTML;
                    document.body.innerHTML = printable;
                    window.print();
                    document.body.innerHTML = original;
                    window.location.reload();
                  }
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center justify-center space-x-1 transition-colors shadow-xs cursor-pointer"
              >
                <Printer size={13} />
                <span>প্রিন্ট বা ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
