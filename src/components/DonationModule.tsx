import React, { useState, useEffect } from 'react';
import { DonationRecord } from '../types';
import { 
  HeartHandshake, 
  Coins, 
  Plus, 
  Search, 
  Printer, 
  Calendar, 
  Check, 
  X, 
  TrendingUp, 
  Briefcase, 
  Award, 
  Receipt,
  Gift,
  Trash2,
  Edit3
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DonationModule() {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fundFilter, setFundFilter] = useState<string>('সব');
  
  // Dynamic profile settings from settings master
  const madrasahName = (localStorage.getItem('madrasah_profile_name') || 'মারকাযুল কুরআন মাদরাসা').replace('ঐতিহ্যবাহী', '').trim();
  const madrasahSlogan = localStorage.getItem('madrasah_profile_slogan') || 'মিরপুর, ঢাকা • প্রতিষ্ঠিত ২০০২ ইং';
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedDonationForReceipt, setSelectedDonationForReceipt] = useState<DonationRecord | null>(null);
  const [editingDonation, setEditingDonation] = useState<DonationRecord | null>(null);

  // Form states
  const [formDonorName, setFormDonorName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formFundType, setFormFundType] = useState<DonationRecord['fundType']>('সাধারণ ফান্ড');
  const [formPaymentMethod, setFormPaymentMethod] = useState<DonationRecord['paymentMethod']>('নগদ (Cash)');
  const [formReceiptNo, setFormReceiptNo] = useState('');

  // Load or seed default donations
  useEffect(() => {
    const stored = localStorage.getItem('madrasah_donations');
    if (stored) {
      setDonations(JSON.parse(stored));
    } else {
      // Seed some typical pious donor records
      const initialDonations: DonationRecord[] = [
        {
          id: 'dn-1',
          donorName: 'আলহাজ্ব আব্দুর রহমান',
          phone: '01819-123456',
          amount: 25000,
          fundType: 'নির্মাণ তহবিল',
          date: '১২/০৩/২০২৬',
          receiptNo: 'DN-2026-0034',
          paymentMethod: 'ব্যাংক (Bank)'
        },
        {
          id: 'dn-2',
          donorName: 'সালাহউদ্দীন আহমেদ',
          phone: '01712-445566',
          amount: 5000,
          fundType: 'লিল্লাহ ফান্ড',
          date: '২৫/০৪/২০২৬',
          receiptNo: 'DN-2026-0041',
          paymentMethod: 'বিকাশ (bKash)'
        },
        {
          id: 'dn-3',
          donorName: 'বেনামী দানকারী (গোপন দান)',
          phone: '01911-000000',
          amount: 10000,
          fundType: 'সদকা ও যাকাত',
          date: '০৮/০৫/২০২৬',
          receiptNo: 'DN-2026-0048',
          paymentMethod: 'নগদ (Cash)'
        },
        {
          id: 'dn-4',
          donorName: 'মাওলানা শফিউর রহমান',
          phone: '01511-223344',
          amount: 3000,
          fundType: 'সাধারণ ফান্ড',
          date: '০১/০৬/২০২৬',
          receiptNo: 'DN-2026-0052',
          paymentMethod: 'নগদ (Cash)'
        }
      ];
      setDonations(initialDonations);
      localStorage.setItem('madrasah_donations', JSON.stringify(initialDonations));
    }
  }, []);

  const saveDonations = (list: DonationRecord[]) => {
    setDonations(list);
    localStorage.setItem('madrasah_donations', JSON.stringify(list));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDonorName || Number(formAmount) <= 0) return;

    const receipt = formReceiptNo.trim() || 'DN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    if (editingDonation) {
      const updated = donations.map(item => item.id === editingDonation.id ? {
        ...item,
        donorName: formDonorName,
        phone: formPhone || 'গোপন',
        amount: Number(formAmount),
        fundType: formFundType,
        paymentMethod: formPaymentMethod,
        receiptNo: receipt
      } : item);
      saveDonations(updated);
      setIsModalOpen(false);
      setEditingDonation(null);
      // reset
      setFormDonorName('');
      setFormPhone('');
      setFormAmount(0);
      setFormFundType('সাধারণ ফান্ড');
      setFormPaymentMethod('নগদ (Cash)');
      setFormReceiptNo('');
    } else {
      const banglaDate = new Date().toLocaleDateString('bn-BD');
      const newDonation: DonationRecord = {
        id: 'dn-' + Math.random().toString(36).substr(2, 9),
        donorName: formDonorName,
        phone: formPhone || 'গোপন',
        amount: Number(formAmount),
        fundType: formFundType,
        date: banglaDate,
        receiptNo: receipt,
        paymentMethod: formPaymentMethod
      };

      saveDonations([newDonation, ...donations]);
      
      // Clear & close
      setIsModalOpen(false);
      setFormDonorName('');
      setFormPhone('');
      setFormAmount(0);
      setFormFundType('সাধারণ ফান্ড');
      setFormPaymentMethod('নগদ (Cash)');
      setFormReceiptNo('');

      // Trigger instant receipt presentation
      setSelectedDonationForReceipt(newDonation);
      setIsReceiptModalOpen(true);
    }
  };

  const handleEdit = (record: DonationRecord) => {
    setEditingDonation(record);
    setFormDonorName(record.donorName);
    setFormPhone(record.phone === 'গোপন' ? '' : record.phone);
    setFormAmount(record.amount);
    setFormFundType(record.fundType);
    setFormPaymentMethod(record.paymentMethod);
    setFormReceiptNo(record.receiptNo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDonation(null);
    setFormDonorName('');
    setFormPhone('');
    setFormAmount(0);
    setFormFundType('সাধারণ ফান্ড');
    setFormPaymentMethod('নগদ (Cash)');
    setFormReceiptNo('');
  };

  const handleDelete = (id: string) => {
    const updated = donations.filter(item => item.id !== id);
    saveDonations(updated);
  };

  const handleOpenReceipt = (record: DonationRecord) => {
    setSelectedDonationForReceipt(record);
    setIsReceiptModalOpen(true);
  };

  // Filtering
  const filteredDonations = donations.filter(item => {
    const fundMatch = fundFilter === 'সব' || item.fundType === fundFilter;
    const searchMatch = searchQuery.trim() === '' || 
      item.donorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.phone.includes(searchQuery) ||
      item.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
    return fundMatch && searchMatch;
  });

  // Totals calculations
  const totalRaised = donations.reduce((sum, item) => sum + item.amount, 0);
  const lillahTotal = donations.filter(d => d.fundType === 'লিল্লাহ ফান্ড').reduce((sum, item) => sum + item.amount, 0);
  const sadqahTotal = donations.filter(d => d.fundType === 'সদকা ও যাকাত').reduce((sum, item) => sum + item.amount, 0);
  const constructTotal = donations.filter(d => d.fundType === 'নির্মাণ তহবিল').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto w-full">
      
      {/* Fin Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-2xl border border-emerald-850 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-300 block font-bold uppercase tracking-wider">সর্বমোট অর্জিত অনুদান</span>
            <strong className="text-2xl font-extrabold block mt-1 font-sans">৳ {totalRaised.toLocaleString()}</strong>
            <span className="text-[9px] text-emerald-250 block mt-1">সব তহবিল সমন্বিত</span>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <Coins size={22} className="text-emerald-300" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">লিল্লাহ বোর্ডিং তহবিল</span>
            <strong className="text-xl font-extrabold block mt-1 font-sans text-amber-600">৳ {lillahTotal.toLocaleString()}</strong>
            <span className="text-[9px] text-slate-400 block mt-1">দরিদ্র ও এতিমদের সেবা</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">সদকা ও যাকাত ফান্ড</span>
            <strong className="text-xl font-extrabold block mt-1 font-sans text-indigo-700">৳ {sadqahTotal.toLocaleString()}</strong>
            <span className="text-[9px] text-slate-400 block mt-1">দ্বীনি ছাত্র কল্যাণ ফান্ড</span>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <HeartHandshake size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">নির্মাণ ও সম্প্রসারণ ফান্ড</span>
            <strong className="text-xl font-extrabold block mt-1 font-sans text-rose-700">৳ {constructTotal.toLocaleString()}</strong>
            <span className="text-[9px] text-slate-400 block mt-1">ভবন সংস্কার তহবিল</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
            <Gift size={22} />
          </div>
        </div>
      </div>

      {/* Main Filter card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="দাতা বা রশিদ নম্বর লিখুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-emerald-700 bg-slate-50/50"
              />
            </div>

            {/* Fund Filter */}
            <select
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none font-semibold text-slate-600 bg-white"
            >
              <option value="সব">সকল লিজার ও ফান্ড</option>
              <option value="লিল্লাহ ফান্ড">লিল্লাহ বোর্ডিং ফান্ড</option>
              <option value="সদকা ও যাকাত">সদকা ও যাকাত</option>
              <option value="নির্মাণ তহবিল">নির্মাণ তহবিল</option>
              <option value="সাধারণ ফান্ড">সাধারণ ফান্ড</option>
            </select>
          </div>

          <button
            onClick={() => {
              setEditingDonation(null);
              setFormDonorName('');
              setFormPhone('');
              setFormAmount(0);
              setFormFundType('সাধারণ ফান্ড');
              setFormPaymentMethod('নগদ (Cash)');
              const randomReceiptNo = 'DN-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
              setFormReceiptNo(randomReceiptNo);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus size={15} />
            <span>নতুন অনুদান এন্ট্রি করুন</span>
          </button>
        </div>
      </div>

      {/* Donations List Grid/Voucher List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-4">রশিদ নম্বর</th>
                <th className="p-4">দাতা সুধী ব্যক্তির নাম</th>
                <th className="p-4">মোবাইল নম্বর</th>
                <th className="p-4 text-center">নির্ধারিত তহবিল বা খাত</th>
                <th className="p-4 text-center">পেমেন্ট মেথড</th>
                <th className="p-4 text-center">তারিখ</th>
                <th className="p-4 text-right">দানকৃত টাকা</th>
                <th className="p-4 text-center w-28">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDonations.length > 0 ? (
                filteredDonations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold font-mono text-slate-500 uppercase">{item.receiptNo}</td>
                    <td className="p-4">
                      <span className="font-extrabold text-slate-800 text-sm block">{item.donorName}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 font-mono">{item.phone}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        item.fundType === 'লিল্লাহ ফান্ড' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                        item.fundType === 'সদকা ও যাকাত' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                        item.fundType === 'নির্মাণ তহবিল' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                        'bg-slate-50 text-slate-700 border border-slate-100'
                      }`}>
                        {item.fundType}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-500">{item.paymentMethod}</td>
                    <td className="p-4 text-center text-slate-600 font-mono">{item.date}</td>
                    <td className="p-4 text-right font-extrabold text-emerald-800 font-sans text-sm bg-emerald-50/10">
                      ৳ {item.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenReceipt(item)}
                          className="p-1 px-1.5 transition-colors hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                          title="রশিদ দেখুন"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 px-1.5 transition-colors hover:bg-slate-150 text-indigo-700 rounded-lg cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 px-1.5 transition-colors hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} className="opacity-90" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    কোন দাতা সদকার রেকর্ড খুঁজে পাওয়া যায়নি!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New/Edit Donation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 animate-fade-in">
                <HeartHandshake size={18} className="text-emerald-700" />
                <span>{editingDonation ? 'অনুদান রশিদ সংশোধন করুন' : 'নতুন অনুদান বা সদকা রশিদ ফর্ম'}</span>
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">দানশীল দাতা সুধীর নাম *</label>
                <input
                  type="text"
                  value={formDonorName}
                  onChange={(e) => setFormDonorName(e.target.value)}
                  placeholder="উদা: হাজী শামসুর রহমান (বা গোপন দানকারী)"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">রশিদ নম্বর (Receipt No) *</label>
                <input
                  type="text"
                  value={formReceiptNo}
                  onChange={(e) => setFormReceiptNo(e.target.value)}
                  placeholder="উদা: DN-2026-1015"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 font-mono text-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="যেমন: 01712xxxxxx"
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">দানকৃত অর্থ (টাকা) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">অনুদান খাত বা নির্ধারিত ফান্ড *</label>
                  <select
                    value={formFundType}
                    onChange={(e) => setFormFundType(e.target.value as any)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 bg-white"
                  >
                    <option value="লিল্লাহ ফান্ড">লিল্লাহ বোর্ডিং ফান্ড</option>
                    <option value="সদকা ও যাকাত">সদকা ও যাকাত</option>
                    <option value="নির্মাণ তহবিল">নির্মাণ ও সম্প্রসারণ</option>
                    <option value="সাধারণ ফান্ড">সাধারণ ফান্ড</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">পেমেন্ট মেথড *</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 bg-white"
                  >
                    <option value="নগদ (Cash)">নগদ (Cash)</option>
                    <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                    <option value="ব্যাংক (Bank)">ব্যাংক (Bank)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 text-xs border border-slate-250 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {editingDonation ? 'সংশোধন সংরক্ষণ করুন' : 'রশিদ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Printable Receipt Voucher */}
      {isReceiptModalOpen && selectedDonationForReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-250 w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 pb-2 shrink-0">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest">দান রশিদ ভিউয়ার</h3>
              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
              {/* Traditional Receipt Visual Border */}
              <div className="border-[3px] border-emerald-800 rounded-2xl p-6 relative bg-emerald-50/5 text-center font-serif">
                <div className="absolute inset-1.5 border border-emerald-600/10 rounded-xl pointer-events-none"></div>

                {/* Card top branding */}
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-800 font-bold border border-emerald-800 px-3.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50">দান রশিদ - DONATION RECEIPT</span>
                  <h2 className="text-xl font-bold text-emerald-950 mt-3 font-sans">{madrasahName}</h2>
                  <p className="text-[9px] text-slate-500 font-medium font-sans">{madrasahSlogan}</p>
                </div>

                <div className="h-px bg-slate-200 max-w-sm mx-auto my-3"></div>

                {/* Receipt metadata banner */}
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans px-2 my-4">
                  <span>রশিদ নং: <strong className="text-slate-800 font-mono font-bold">{selectedDonationForReceipt.receiptNo}</strong></span>
                  <span>তারিখ: <strong className="text-slate-850 font-bold">{selectedDonationForReceipt.date}</strong></span>
                </div>

                {/* Receipt Body text with dynamic dots */}
                <div className="space-y-4 text-left text-xs leading-normal font-sans text-slate-700 py-3">
                  <p className="flex items-end flex-wrap">
                    <span>দানকারীর মহৎ নাম:</span>
                    <strong className="text-slate-900 border-b border-dashed border-slate-300 flex-1 px-2 font-black text-sm">{selectedDonationForReceipt.donorName}</strong>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p className="flex items-end">
                      <span>মোবাইল নম্বর:</span>
                      <strong className="text-slate-850 border-b border-dashed border-slate-300 flex-1 px-2 font-mono">{selectedDonationForReceipt.phone}</strong>
                    </p>
                    <p className="flex items-end">
                      <span>পেমেন্ট মেথড:</span>
                      <strong className="text-slate-850 border-b border-dashed border-slate-300 flex-1 px-2">{selectedDonationForReceipt.paymentMethod}</strong>
                    </p>
                  </div>
                  <p className="flex items-end flex-wrap">
                    <span>দানকৃত প্রদেয় খাতের নাম:</span>
                    <strong className="text-emerald-850 border-b border-dashed border-slate-300 flex-1 px-2 font-bold">{selectedDonationForReceipt.fundType}</strong>
                  </p>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between text-slate-800">
                    <span className="font-bold">মোট অনুদানের পরিমান:</span>
                    <strong className="text-emerald-950 font-black text-lg">৳ {selectedDonationForReceipt.amount.toLocaleString()} টাকা মাত্র</strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-450 text-center font-sans mt-3">
                  "আল্লাহ তায়ালা আপনাদের এই দানকে কবুল ও মনজুর করুন এবং উত্তম জাযা দান করুন। আমীন।"
                </p>

                {/* Signatures spaces */}
                <div className="flex justify-between items-end pt-12 text-center text-[10px] text-slate-500 font-sans">
                  <div className="space-y-1">
                    <div className="w-20 h-px bg-slate-300 mx-auto"></div>
                    <p className="font-bold text-slate-700">আদায়কারী স্বাক্ষর</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-20 h-px bg-slate-300 mx-auto"></div>
                    <p className="font-bold text-slate-700">অর্থ উস্তাদ / ক্যাশিয়ার</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end space-x-2 shrink-0 bg-slate-50">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-850 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer size={13} />
                <span>রশিদ প্রিন্ট দান</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
