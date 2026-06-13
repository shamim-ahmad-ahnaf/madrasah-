export type MadrasahClass = 'নূরানী' | 'নাজেরা' | 'হিফজ' | 'কিতাব বিভাগ' | 'জেনারেল' | string;

export function isClassMatch(studentClass: string, filterClass: string): boolean {
  if (!studentClass || !filterClass) return false;
  if (filterClass === 'all' || filterClass === 'সব') return true;
  if (studentClass === filterClass) return true;
  if (studentClass.startsWith(filterClass)) return true;
  return studentClass.includes(filterClass);
}

export interface Student {
  id: string;
  name: string;
  roll: number;
  gradeClass: MadrasahClass;
  fatherName: string;
  phone: string;
  address: string;
  isResidential: boolean;
  monthlyFee: number;
  admissionDate: string;
}

export interface Teacher {
  id: string;
  name: string;
  designation: string; // e.g., মুহতামিম, শায়খুল হাদীস, প্রধান শিক্ষক, সহকারী শিক্ষক
  subject: string; // e.g., হিফজুল কুরআন, হাদীস, আরবী সাহিত্য, গণিত/ইংরেজি
  phone: string;
  salary: number;
  joinDate: string;
  email?: string;
  address?: string;
  departments?: string;
  photo?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  roll: number;
  gradeClass: MadrasahClass;
  status: 'উপস্থিত' | 'অনুপস্থিত';
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  roll: number;
  gradeClass: MadrasahClass;
  payingMonth: string; // e.g., জানুয়ারি, ফেব্রুয়ারি, রমজান ইত্যাদি
  amount: number;
  paymentDate: string;
  paymentMethod: 'নগদ (Cash)' | 'বিকাশ (bKash)' | 'ব্যাংক (Bank)';
  receiverName: string;
}

export interface ClassSchedule {
  id: string;
  gradeClass: MadrasahClass;
  subject: string;
  teacherName: string;
  startTime: string; // e.g., ০৮:০০ AM
  endTime: string; // e.g., ০৯:৩০ AM
  day: 'শনিবার' | 'রবিবার' | 'সোমবার' | 'মঙ্গলবার' | 'বুধবার' | 'বৃহস্পতিবার' | 'শুক্রবার';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'জরুরী' | 'পরীক্ষা' | 'ছুটি' | 'সাধারণ';
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalFeesCollected: number;
  attendanceRateToday: number;
}

export interface SMSLog {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName?: string;
  gradeClass?: MadrasahClass;
  phone: string;
  type: 'হাজিরা (Attendance)' | 'বেতন রিমাইন্ডার (Fee Reminder)' | 'পেমেন্ট রশিদ (Payment Receipt)' | 'ঘোষণা ও নোটিশ (Announcement)';
  message: string;
  status: 'সফল (Success)' | 'অপেক্ষমান (Pending)' | 'ব্যর্থ (Failed)';
}

export interface Book {
  id: string;
  title: string;
  author: string;
  subject: string;
  totalCopies: number;
  availableCopies: number;
  catalogCode?: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerType: 'student' | 'teacher';
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
}

export interface ExamMark {
  id: string;
  studentId: string;
  studentName: string;
  roll: number;
  gradeClass: MadrasahClass;
  examType: 'ত্রৈমাসিক' | 'ষাণ্মাসিক' | 'বার্ষিক';
  quranMarks: number;
  hadithMarks: number;
  arabicMarks: number;
  banglaMarks: number;
  mathMarks: number;
  totalMarks: number;
  grade: string;
}

export interface HostelRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeClass: MadrasahClass;
  roomNo: string;
  bedNo: string;
  mealStatus: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  lastMealUpdate: string;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  phone: string;
  amount: number;
  fundType: 'লিল্লাহ ফান্ড' | 'সদকা ও যাকাত' | 'নির্মাণ তহবিল' | 'সাধারণ ফান্ড';
  date: string;
  receiptNo: string;
  paymentMethod: 'নগদ (Cash)' | 'বিকাশ (bKash)' | 'ব্যাংক (Bank)';
}

export interface ExpenseRecord {
  id: string;
  category: 'শিক্ষক ও স্টাফ বেতন' | 'ডাইনিং ও বোর্ডিং খরচ' | 'ইউটিলিটি ও বিল' | 'নির্মাণ ও সংস্কার' | 'বই ও স্টেশনারি' | 'বিবিধ খরচ';
  title: string;
  amount: number;
  date: string;
  voucherNo: string;
  paymentMethod: 'নগদ (Cash)' | 'বিকাশ (bKash)' | 'ব্যাংক (Bank)';
  remarks?: string;
  payeeName?: string;
  payeeId?: string;
  salaryMonth?: string;
}


