import React, { useState, useMemo, useEffect } from 'react';
import { Student, Teacher, Book, BorrowRecord } from '../types';
import { 
  BookOpen, 
  Search, 
  Plus, 
  UserPlus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Filter, 
  User, 
  GraduationCap, 
  Phone, 
  BookCheck,
  Bookmark,
  ChevronRight,
  Bell
} from 'lucide-react';

interface LibraryModuleProps {
  students: Student[];
  teachers: Teacher[];
}

const DEFAULT_BOOKS: Book[] = [];

const DEFAULT_BORROWS: BorrowRecord[] = [];

export default function LibraryModule({ students, teachers }: LibraryModuleProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'circulation'>('catalog');
  const [bookSearch, setBookSearch] = useState('');
  const [borrowSearch, setBorrowSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('সব বিষয়');
  const [circulationStatusFilter, setCirculationStatusFilter] = useState<'all' | 'borrowed' | 'overdue' | 'returned'>('all');

  // Modal States
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  
  // New Book Form State
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookSubject, setNewBookSubject] = useState('হাদীস শাস্ত্র');
  const [newBookTotalCopies, setNewBookTotalCopies] = useState<number>(5);
  const [newBookCatalogCode, setNewBookCatalogCode] = useState('');

  // New Borrow Form State
  const [borrowBookId, setBorrowBookId] = useState('');
  const [borrowerType, setBorrowerType] = useState<'student' | 'teacher'>('student');
  const [borrowerId, setBorrowerId] = useState('');
  const [customBorrowerName, setCustomBorrowerName] = useState('');
  const [customBorrowerPhone, setCustomBorrowerPhone] = useState('');
  const [borrowDate, setBorrowDate] = useState('2026-06-09');
  const [borrowDays, setBorrowDays] = useState<number>(15);

  const [notification, setNotification] = useState<string | null>(null);

  // Load from database on mount
  useEffect(() => {
    const storedBooks = localStorage.getItem('madrasah_books');
    const storedBorrows = localStorage.getItem('madrasah_borrow_records');

    if (storedBooks) {
      setBooks(JSON.parse(storedBooks));
    } else {
      setBooks(DEFAULT_BOOKS);
      localStorage.setItem('madrasah_books', JSON.stringify(DEFAULT_BOOKS));
    }

    if (storedBorrows) {
      setBorrows(JSON.parse(storedBorrows));
    } else {
      setBorrows(DEFAULT_BORROWS);
      localStorage.setItem('madrasah_borrow_records', JSON.stringify(DEFAULT_BORROWS));
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Helper sync functions
  const saveBooks = (updatedBooks: Book[]) => {
    setBooks(updatedBooks);
    localStorage.setItem('madrasah_books', JSON.stringify(updatedBooks));
  };

  const saveBorrows = (updatedBorrows: BorrowRecord[]) => {
    setBorrows(updatedBorrows);
    localStorage.setItem('madrasah_borrow_records', JSON.stringify(updatedBorrows));
  };

  // Check and flag overdue list dynamically based on Today: 2026-06-09
  const todayStr = '2026-06-09';
  const processBorrowsWithOverdue = useMemo(() => {
    return borrows.map(record => {
      if (record.status === 'borrowed') {
        const isOverdue = record.dueDate < todayStr;
        return {
          ...record,
          status: (isOverdue ? 'overdue' : 'borrowed') as 'borrowed' | 'returned' | 'overdue'
        };
      }
      return record;
    });
  }, [borrows, todayStr]);

  // Subject options
  const subjectsList = ['হাদীস শাস্ত্র', 'তাফসীর', 'ফিকহ শাস্ত্র', 'আরবী সাহিত্য', 'ইতিহাস ও সীরাত', 'সাধারণ জ্ঞান ও অন্যান্য'];

  // Handle book adding
  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookAuthor.trim()) {
      alert('দয়া করে বইয়ের নাম ও লেখকের নাম পূরণ করুন।');
      return;
    }

    const newBook: Book = {
      id: 'bk-' + Math.random().toString(36).substr(2, 9),
      title: newBookTitle.trim(),
      author: newBookAuthor.trim(),
      subject: newBookSubject,
      totalCopies: Math.max(1, newBookTotalCopies),
      availableCopies: Math.max(1, newBookTotalCopies),
      catalogCode: newBookCatalogCode.trim() || 'CAT-' + Math.floor(100 + Math.random() * 900)
    };

    const updated = [newBook, ...books];
    saveBooks(updated);
    setIsBookModalOpen(false);
    
    // reset form
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookSubject('হাদীস শাস্ত্র');
    setNewBookTotalCopies(5);
    setNewBookCatalogCode('');
    
    showNotification(`নতুন কিতাব "${newBook.title}" সফলভাবে লাইব্রেরিতে যোগ করা হয়েছে!`);
  };

  // Auto-fill phone/name when a Borrower ID is selected
  useEffect(() => {
    if (borrowerType === 'student') {
      const std = students.find(s => s.id === borrowerId);
      if (std) {
        setCustomBorrowerName(std.name);
        setCustomBorrowerPhone(std.phone);
      } else {
        setCustomBorrowerName('');
        setCustomBorrowerPhone('');
      }
    } else {
      const tea = teachers.find(t => t.id === borrowerId);
      if (tea) {
        setCustomBorrowerName(tea.name);
        setCustomBorrowerPhone(tea.phone);
      } else {
        setCustomBorrowerName('');
        setCustomBorrowerPhone('');
      }
    }
  }, [borrowerId, borrowerType, students, teachers]);

  // Handle borrow issuing
  const handleIssueBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!borrowBookId) {
      alert('দয়া করে একটি কিতাব নির্বাচন করুন।');
      return;
    }

    if (!customBorrowerName.trim()) {
      alert('দয়া করে কোনো গ্রহীতা নির্বাচন বা নাম লিখুন।');
      return;
    }

    // Check available copies first
    const targetBook = books.find(b => b.id === borrowBookId);
    if (!targetBook) {
      alert('কিতাবটি পাওয়া যায়নি।');
      return;
    }

    if (targetBook.availableCopies <= 0) {
      alert('দুঃখিত! এই কিতাবের কোনো কপি এখন লাইব্রেরিতে খালি নেই।');
      return;
    }

    // Calculate due date
    const bDate = new Date(borrowDate);
    bDate.setDate(bDate.getDate() + borrowDays);
    const dueDateStr = bDate.toISOString().split('T')[0];

    const newBorrow: BorrowRecord = {
      id: 'br-' + Math.random().toString(36).substr(2, 9),
      bookId: borrowBookId,
      bookTitle: targetBook.title,
      borrowerType,
      borrowerId: borrowerId || 'custom-guest',
      borrowerName: customBorrowerName.trim(),
      borrowerPhone: customBorrowerPhone.trim() || '01700-000000',
      borrowDate,
      dueDate: dueDateStr,
      status: 'borrowed'
    };

    // Decrease book copies count
    const updatedBooks = books.map(b => {
      if (b.id === borrowBookId) {
        return { ...b, availableCopies: Math.max(0, b.availableCopies - 1) };
      }
      return b;
    });

    const updatedBorrows = [newBorrow, ...borrows];

    saveBooks(updatedBooks);
    saveBorrows(updatedBorrows);
    setIsBorrowModalOpen(false);

    // Reset Form
    setBorrowBookId('');
    setBorrowerId('');
    setCustomBorrowerName('');
    setCustomBorrowerPhone('');
    setBorrowDate('2026-06-09');
    setBorrowDays(15);

    showNotification(`"${newBorrow.bookTitle}" কিতাবটি ${newBorrow.borrowerName}-কে প্রদান করা হয়েছে! ফেরত দেওয়ার শেষ তারিখ: ${dueDateStr}`);
  };

  // Return Book Action
  const handleReturnBook = (recordId: string) => {
    const record = borrows.find(r => r.id === recordId);
    if (!record) return;

    // Set return date as today
    const updatedBorrows = borrows.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          returnDate: todayStr,
          status: 'returned' as const
        };
      }
      return r;
    });

    // Increase available copies
    const updatedBooks = books.map(b => {
      if (b.id === record.bookId) {
        return { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) };
      }
      return b;
    });

    saveBorrows(updatedBorrows);
    saveBooks(updatedBooks);
    showNotification(`"${record.bookTitle}" কিতাবটি ${record.borrowerName} এর নিকট হতে সফলভাবে লাইব্রেরিতে ফেরত নেওয়া হয়েছে।`);
  };

  // Delete Book Catalog Entry
  const handleDeleteBook = (bookId: string) => {
    const hasActiveBorrows = borrows.some(b => b.bookId === bookId && b.status !== 'returned');
    if (hasActiveBorrows) {
      alert('সতর্কতা! এই কিতাবটি বর্তমানে কারও নিকট ধার দেওয়া আছে। ফেরত নেওয়ার আগে এটি মুছে ফেলা যাবে না।');
      return;
    }

    if (window.confirm('আপনি কি নিশ্চিত যে এই কিতাবটি লাইব্রেরি ক্যাটালগ থেকে চিরতরে মুছে ফেলতে চান?')) {
      const updated = books.filter(b => b.id !== bookId);
      saveBooks(updated);
      showNotification('কিতাব ক্যাটালগ হতে সফলভাবে অপসারিত হয়েছে।');
    }
  };

  // Delete Borrow Entry
  const handleDeleteBorrowLog = (borrowId: string) => {
    if (window.confirm('আপনি কি এই বই বিতরণের রেকর্ডটি মুছে ফেলতে চান?')) {
      const target = borrows.find(b => b.id === borrowId);
      if (target && target.status !== 'returned') {
        // Return available copy first
        const updatedBooks = books.map(b => {
          if (b.id === target.bookId) {
            return { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) };
          }
          return b;
        });
        saveBooks(updatedBooks);
      }
      const updated = borrows.filter(b => b.id !== borrowId);
      saveBorrows(updated);
      showNotification('বই বিতরণের ইতিহাস সফলভাবে মুছে ফেলা হয়েছে।');
    }
  };

  // Statistics Computations
  const stats = useMemo(() => {
    const totalCirculatingBooks = books.reduce((acc, curr) => acc + curr.totalCopies, 0);
    const totalAvailableCopies = books.reduce((acc, curr) => acc + curr.availableCopies, 0);
    const activeBorrowedCount = processBorrowsWithOverdue.filter(b => b.status === 'borrowed').length;
    const activeOverdueCount = processBorrowsWithOverdue.filter(b => b.status === 'overdue').length;

    return {
      uniqueBooks: books.length,
      totalCirculatingBooks,
      totalAvailableCopies,
      activeBorrowedCount,
      activeOverdueCount
    };
  }, [books, processBorrowsWithOverdue]);

  // Filter books matching search/subject
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(bookSearch.toLowerCase()) || 
                            b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
                            (b.catalogCode && b.catalogCode.toLowerCase().includes(bookSearch.toLowerCase()));
      const matchesSubject = subjectFilter === 'সব বিষয়' || b.subject === subjectFilter;
      return matchesSearch && matchesSubject;
    });
  }, [books, bookSearch, subjectFilter]);

  // Filter distribution log matching search/status
  const filteredCirculation = useMemo(() => {
    return processBorrowsWithOverdue.filter(b => {
      const query = borrowSearch.toLowerCase();
      const matchesSearch = b.bookTitle.toLowerCase().includes(query) || 
                            b.borrowerName.toLowerCase().includes(query) ||
                            (b.borrowerPhone && b.borrowerPhone.includes(query));
      
      const matchesStatus = circulationStatusFilter === 'all' || b.status === circulationStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [processBorrowsWithOverdue, borrowSearch, circulationStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Title Bar & Stats Summary Grid */}
      <div className="bg-emerald-900 text-white rounded-3xl p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl lg:text-2xl font-black font-sans flex items-center space-x-2.5">
              <BookOpen className="text-emerald-400 shrink-0" size={24} />
              <span>হিফজ ও কিতাব লাইব্রেরি (Library Circulation)</span>
            </h1>
            <p className="text-xs text-emerald-200">মাদ্রাসার পবিত্র আল-কুরআন, সুন্নাহ গ্রন্থাবলী ও কিতাবসমূহের বিতরণ, স্টক এবং ফেরত ব্যবস্থাপনার ডিজিটাল সিস্টেম</p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/30 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1.5 transition-colors"
            >
              <Plus size={14} />
              <span>নতুন কিতাব যোগ</span>
            </button>
            <button
              onClick={() => setIsBorrowModalOpen(true)}
              className="bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer flex items-center space-x-1.5 transition-colors"
            >
              <UserPlus size={14} />
              <span>বই বিতরণ (ইস্যু)</span>
            </button>
          </div>
        </div>

        {/* Library Mini KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8 pt-6 border-t border-emerald-800/60">
          <div className="bg-emerald-950/40 p-4.5 rounded-2xl border border-emerald-800/30 text-left">
            <span className="text-[10px] text-emerald-300 block font-semibold">ক্যাটালগ কিতাব</span>
            <strong className="text-white text-lg font-black block mt-1 font-sans">{stats.uniqueBooks} টি বই</strong>
          </div>
          <div className="bg-emerald-950/40 p-4.5 rounded-2xl border border-emerald-800/30 text-left">
            <span className="text-[10px] text-emerald-300 block font-semibold">সর্বমোট খন্ড-কপি</span>
            <strong className="text-white text-lg font-black block mt-1 font-sans">{stats.totalCirculatingBooks} কপি</strong>
          </div>
          <div className="bg-emerald-950/40 p-4.5 rounded-2xl border border-emerald-800/30 text-left">
            <span className="text-[10px] text-emerald-300 block font-semibold">সহজলভ্য স্টক</span>
            <strong className="text-white text-lg font-black block mt-1 font-sans">{stats.totalAvailableCopies} কপি</strong>
          </div>
          <div className="bg-emerald-950/40 p-4.5 rounded-2xl border border-emerald-800/30 text-left">
            <span className="text-[10px] text-emerald-300 block font-semibold">বর্তমানে পাঠকদের নিকট</span>
            <strong className="text-amber-300 text-lg font-black block mt-1 font-sans">{stats.activeBorrowedCount} টি</strong>
          </div>
          <div className="bg-emerald-950/40 p-4.5 rounded-2xl border border-emerald-800/40 col-span-2 md:col-span-1 text-left flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-300 block font-semibold">সময়োত্তীর্ণ / বকেয়া ফেরত</span>
              <strong className="text-rose-400 text-lg font-black block mt-1 font-sans">{stats.activeOverdueCount} টি কিতাব</strong>
            </div>
            {stats.activeOverdueCount > 0 && (
              <div className="p-1.5 bg-rose-500/20 text-rose-300 rounded-lg animate-pulse">
                <AlertTriangle size={15} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Internal Notification Area */}
      {notification && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl p-4 flex items-center space-x-2 animate-fade-in text-xs font-semibold select-none shadow-sm leading-normal">
          <BookCheck className="text-indigo-600 shrink-0" size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Central Search, Filter and Tabs Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Navigation tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'catalog'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bookmark size={14} />
              <span>কিতাব ক্যাটালগ ও স্টক ({stats.uniqueBooks})</span>
            </button>
            <button
              onClick={() => setActiveTab('circulation')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeTab === 'circulation'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <RotateCcw size={14} />
              <span>বিতরণ ও ফেরত খতিয়ান ({borrows.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-[10px] text-slate-400 font-bold uppercase font-sans">সিস্টেম তারিখ: ০৯/০৬/২০২৬</span>
          </div>
        </div>

        {/* Dynamic Inner Tab Interface */}
        <div className="p-6">
          {activeTab === 'catalog' ? (
            /* ================= CATALOG TAB ================= */
            <div className="space-y-6">
              {/* Search and Filters for books */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="কিতাবের নাম, লেখক বা ক্যাটালগ কোড খুজুন..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="সব বিষয়">সব বিষয়</option>
                    {subjectsList.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="text-right flex items-center justify-end text-[11px] font-bold text-slate-400 shrink-0 px-1">
                  মোট খুজে পাওয়া বই: &nbsp;<span className="text-slate-800 font-extrabold text-sm">{filteredBooks.length}</span> / {books.length}টি
                </div>
              </div>

              {/* Books Grid */}
              {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map((book) => {
                    const stockPercentage = Math.round((book.availableCopies / book.totalCopies) * 100);
                    return (
                      <div key={book.id} className="bg-slate-50/40 p-5 rounded-2xl border border-slate-150/80 shadow-2xs hover:border-emerald-250 hover:bg-white transition-all space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100/60 text-emerald-800 text-[9px] font-extrabold rounded-lg">
                              {book.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">
                              {book.catalogCode}
                            </span>
                          </div>
                          <h3 className="text-xs font-extrabold text-slate-800 tracking-tight leading-snug pt-0.5">{book.title}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">লেখক: {book.author}</p>
                        </div>

                        {/* Stock Progress Indicators */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500">মজুদ পরিস্থিতি:</span>
                            <span className={book.availableCopies > 0 ? 'text-slate-700' : 'text-rose-600'}>
                              {book.availableCopies > 0 ? `${book.availableCopies} খণ্ড খালি / ${book.totalCopies} কপি` : 'স্টক শেষ (০ কপি)'}
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="h-1.5 bg-slate-200/65 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                stockPercentage > 50 
                                  ? 'bg-emerald-600' 
                                  : stockPercentage > 20 
                                    ? 'bg-amber-500' 
                                    : 'bg-rose-500'
                              }`}
                              style={{ width: `${stockPercentage}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[10px] gap-2">
                            {book.availableCopies > 0 ? (
                              <button
                                onClick={() => {
                                  setBorrowBookId(book.id);
                                  setIsBorrowModalOpen(true);
                                }}
                                className="text-emerald-700 hover:text-emerald-900 font-black cursor-pointer flex items-center space-x-0.5"
                              >
                                <span>ধার ইস্যু করুন</span>
                                <ChevronRight size={12} />
                              </button>
                            ) : (
                              <span className="text-rose-500 font-black flex items-center space-x-1">
                                <AlertTriangle size={11} />
                                <span>বিতরণ বন্ধ</span>
                              </span>
                            )}

                            <button
                              onClick={() => handleDeleteBook(book.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                              title="কিতাবটি ক্যাটালগ থেকে বাদ দিন"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <BookOpen size={24} className="text-slate-300" />
                  <p className="font-bold text-slate-600">কোনো বই পাওয়া যায়নি!</p>
                  <p className="text-[10px] text-slate-400">অনুগ্রহ করে ভিন্ন কোনো শব্দ দিয়ে সার্চ করুন অথবা নতুন কিতাব ক্যাটালগভুক্ত করুন।</p>
                </div>
              )}
            </div>
          ) : (
            /* ================= CIRCULATION TAB ================= */
            <div className="space-y-6">
              {/* Circulation filters and search */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={borrowSearch}
                    onChange={(e) => setBorrowSearch(e.target.value)}
                    placeholder="কিতাবের নাম, গ্রহীতার নাম বা মোবাইল দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <select
                    value={circulationStatusFilter}
                    onChange={(e) => setCirculationStatusFilter(e.target.value as any)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="all">সকল অবস্থা (All Status)</option>
                    <option value="borrowed">বর্তমানে পঠিত (Issued/Borrowed)</option>
                    <option value="overdue">ফেরত বকেয়া (Overdue/Late)</option>
                    <option value="returned">ফেরত এসেছে (Returned Books)</option>
                  </select>
                </div>

                <div className="text-right flex items-center justify-end text-[11px] font-bold text-slate-400 shrink-0 px-1">
                  মোট লেনদেন রেকর্ড: &nbsp;<span className="text-slate-800 font-extrabold text-sm">{filteredCirculation.length}</span> টি
                </div>
              </div>

              {/* Borrowed Book list Table */}
              {filteredCirculation.length > 0 ? (
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 select-none">
                          <th className="p-4">কিতাবের নাম</th>
                          <th className="p-4">কিতাব গ্রহীতা</th>
                          <th className="p-4">গ্রুপ ধরন</th>
                          <th className="p-4">বিতরণ তারিখ</th>
                          <th className="p-4">ফেরত শেষ তারিখ / ফেরত দিন</th>
                          <th className="p-4 text-center">লেনদেন স্থিতি</th>
                          <th className="p-4 text-right">কার্যক্রম</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCirculation.map((log) => {
                          const isCurrentlyIssued = log.status === 'borrowed' || log.status === 'overdue';
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="p-4">
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-800 block">{log.bookTitle}</span>
                                  <span className="text-[9px] font-mono text-slate-400 block">আইডি: {log.bookId}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-1">
                                    {log.borrowerType === 'student' ? (
                                      <User size={12} className="text-indigo-600 shrink-0" />
                                    ) : (
                                      <GraduationCap size={13} className="text-emerald-700 shrink-0" />
                                    )}
                                    <strong className="text-slate-700 block">{log.borrowerName}</strong>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 leading-none">
                                    <Phone size={9} />
                                    <span>{log.borrowerPhone}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                {log.borrowerType === 'student' ? (
                                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded-lg">ছাত্র (Student)</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] font-extrabold rounded-lg">উস্তাদ (Teacher)</span>
                                )}
                              </td>
                              <td className="p-4 text-slate-600 font-mono text-[11px]">
                                {log.borrowDate}
                              </td>
                              <td className="p-4">
                                {log.returnDate ? (
                                  <div>
                                    <span className="text-emerald-700 font-bold font-mono text-[11px] block">{log.returnDate}</span>
                                    <span className="text-[8px] text-slate-400 font-semibold block uppercase">ফেরত দাখিলকৃত</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className={`font-black font-mono text-[11px] block ${log.status === 'overdue' ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
                                      {log.dueDate}
                                    </span>
                                    <span className={`text-[8px] font-bold block uppercase ${log.status === 'overdue' ? 'text-rose-500' : 'text-slate-400'}`}>
                                      {log.status === 'overdue' ? 'সময় পার হয়েছে!' : 'ফেরত ডেডলাইন'}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                {log.status === 'returned' && (
                                  <span className="px-2 py-0.8 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold rounded-lg inline-flex items-center space-x-1">
                                    <CheckCircle size={10} />
                                    <span>জমা হয়েছে</span>
                                  </span>
                                )}
                                {log.status === 'borrowed' && (
                                  <span className="px-2 py-0.8 bg-amber-50 text-amber-800 border border-amber-250 text-[9px] font-bold rounded-lg inline-flex items-center space-x-1">
                                    <Clock size={10} />
                                    <span>বর্তমানে পঠিত</span>
                                  </span>
                                )}
                                {log.status === 'overdue' && (
                                  <span className="px-2 py-0.8 bg-rose-500 text-white text-[9px] font-extrabold rounded-lg inline-flex items-center space-x-1 border border-rose-600 animate-bounce">
                                    <AlertTriangle size={10} />
                                    <span>লেট জরিমানা / বকেয়া</span>
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end space-x-1.5">
                                  {isCurrentlyIssued && (
                                    <button
                                      onClick={() => handleReturnBook(log.id)}
                                      className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer font-bold transition-all flex items-center space-x-1 hover:shadow-2xs text-[10px]"
                                      title="বইটি ফেরত দাখিল লিপিবদ্ধ করেন"
                                    >
                                      <RotateCcw size={10} />
                                      <span>ফেরত নিবেন</span>
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteBorrowLog(log.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-150/45 rounded-lg cursor-pointer transition-colors"
                                    title="রেকর্ড মুছে ফেলুন"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <RotateCcw size={24} className="text-slate-300 animate-spin-slow" />
                  <p className="font-bold text-slate-600">কোনো বই বিতরণের খতিয়ান বা লেনদেন রেকর্ড পাওয়া যায়নি!</p>
                  <p className="text-[10px] text-slate-400">গ্রহীতাদের কিতাব ইস্যু করলে সেই সংক্রান্ত সকল ট্র্যাক এখানে ভেসে উঠবে।</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

       {/* ================= MODAL 1: ADD BOOK CATALOG ENTRY ================= */}
       {isBookModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-lg overflow-hidden animate-fade-in border border-slate-100 flex flex-col max-h-[90vh] text-left">
             <div className="bg-emerald-900 p-5 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center space-x-2">
                 <BookOpen size={18} className="text-emerald-300" />
                 <h3 className="text-sm font-black font-sans">নতুন কিতাব সংযোজন রশিদ</h3>
               </div>
               <button 
                 onClick={() => setIsBookModalOpen(false)}
                 className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
               >
                 ✕
               </button>
             </div>
 
             <form onSubmit={handleAddBook} className="p-6 space-y-4 overflow-y-auto flex-1 md:pr-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">১. কিতাব বা বইয়ের পুরো নাম *</label>
                <input
                  type="text"
                  required
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="যেমন: আল ফিরদাউস, তালীমুল ইসলাম"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">২. সংকলক বা লেখকের নাম *</label>
                <input
                  type="text"
                  required
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  placeholder="যেমন: আল্লামা ইবনে কাসীর"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">৩. কিতাবের সাধারণ শ্রেণী</label>
                  <select
                    value={newBookSubject}
                    onChange={(e) => setNewBookSubject(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {subjectsList.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">৪. বারকোড / ক্যাটালগ কোড</label>
                  <input
                    type="text"
                    value={newBookCatalogCode}
                    onChange={(e) => setNewBookCatalogCode(e.target.value)}
                    placeholder="যেমন: TAF-034"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">৫. সর্বমোট সংগ্রহীত কপির সংখ্যা (Total copies in library)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newBookTotalCopies}
                  onChange={(e) => setNewBookTotalCopies(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer transition-colors"
                >
                  ক্যাটালগে অন্তর্ভুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

       {/* ================= MODAL 2: ISSUE BORROW BOOK ================= */}
       {isBorrowModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-lg overflow-hidden animate-fade-in border border-slate-100 flex flex-col max-h-[90vh] text-left">
             <div className="bg-emerald-900 p-5 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center space-x-2">
                 <UserPlus size={18} className="text-emerald-300" />
                 <h3 className="text-sm font-black font-sans">নতুন কিতাব বিতরণ / ধার ইস্যু স্লিপ</h3>
               </div>
               <button 
                 onClick={() => setIsBorrowModalOpen(false)}
                 className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
               >
                 ✕
               </button>
             </div>
 
             <form onSubmit={handleIssueBorrow} className="p-6 space-y-4 overflow-y-auto flex-1 md:pr-4">
              
              {/* Select Book */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">১. বিতরণযোগ্য কিতাব নির্বাচন করুন *</label>
                <select
                  required
                  value={borrowBookId}
                  onChange={(e) => setBorrowBookId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- কিতাব সিলেক্ট করুন --</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                      {b.title} ({b.author}) - {b.availableCopies > 0 ? `সহজলভ্য: ${b.availableCopies} খণ্ড` : 'স্টক শূন্য'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Borrower group switch */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">২. গ্রহীতার ধরন</label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => {
                      setBorrowerType('student');
                      setBorrowerId('');
                    }}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      borrowerType === 'student'
                        ? 'bg-white text-indigo-700 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    মাদ্রাসার নিয়মিত ছাত্র (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBorrowerType('teacher');
                      setBorrowerId('');
                    }}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      borrowerType === 'teacher'
                        ? 'bg-white text-emerald-800 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-705'
                    }`}
                  >
                    সম্মানিত উস্তাদ (Teacher)
                  </button>
                </div>
              </div>

              {/* Select Registered Borrower ID */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">
                  ৩. নিবন্ধিত {borrowerType === 'student' ? 'শিক্ষার্থী' : 'উস্তাদ'} সিলেক্ট করুন
                </label>
                <select
                  value={borrowerId}
                  onChange={(e) => setBorrowerId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- মেম্বার নির্বাচন করুন (অথবা নিচে নাম লিখুন) --</option>
                  {borrowerType === 'student' ? (
                    students.map(s => (
                      <option key={s.id} value={s.id}>
                        রোল: {s.roll} - {s.name} ({s.gradeClass})
                      </option>
                    ))
                  ) : (
                    teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.designation})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Direct inputs for guest / fallback */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase">গ্রহীতার নাম *</label>
                  <input
                    type="text"
                    required
                    value={customBorrowerName}
                    onChange={(e) => setCustomBorrowerName(e.target.value)}
                    placeholder="হাতে লিখুন"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={customBorrowerPhone}
                    onChange={(e) => setCustomBorrowerPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Borrow & Due period picker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">৪. পরিশোধ / বিতরণের ডেট</label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">৫. ফেরত পাওয়ার মেয়াদ (দিন)</label>
                  <select
                    value={borrowDays}
                    onChange={(e) => setBorrowDays(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-mono font-bold"
                  >
                    <option value={7}>৭ দিন (১ সপ্তাহ)</option>
                    <option value={15}>১৫ দিন (২ সপ্তাহ)</option>
                    <option value={30}>৩০ দিন (১ মাস)</option>
                    <option value={60}>৬০ দিন (২ মাস)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBorrowModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer transition-colors"
                >
                  বিতরণ স্লিপ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
