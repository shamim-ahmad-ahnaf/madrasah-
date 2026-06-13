import React, { useState, useMemo, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Trash2, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  CheckCircle, 
  Filter, 
  Clock, 
  User, 
  Folder, 
  Receipt, 
  Edit,
  X,
  TrendingDown,
  LineChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces
interface InventoryItem {
  id: string;
  name: string;
  category: 'খাদ্য ও ডাইনিং (Food & Dining)' | 'সাধারণ স্টোর (General Store)';
  stock: number;
  unit: string; // e.g. কেজি, লিটার, পিস, বক্স
  safetyLevel: number; // Low stock warning threshold
  lastUpdated: string;
}

interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'stock_in' | 'stock_out';
  quantity: number;
  date: string; // YYYY-MM-DD
  operator: string; // Who distributed or accepted
  notes: string;
  cost?: number; // Only for stock_in (purchase cost)
  receiver?: string; // Only for stock_out (who received)
}

// Initial/default items when localStorage is empty
const DEFAULT_ITEMS: InventoryItem[] = [
  { id: 'item-1', name: 'মিনিকেট চাল', category: 'খাদ্য ও ডাইনিং (Food & Dining)', stock: 150, unit: 'কেজি', safetyLevel: 40, lastUpdated: '১৩/০৬/২০২৬' },
  { id: 'item-2', name: 'মসুর ডাল', category: 'খাদ্য ও ডাইনিং (Food & Dining)', stock: 45, unit: 'কেজি', safetyLevel: 15, lastUpdated: '১৩/০৬/২০২৬' },
  { id: 'item-3', name: 'সয়াবিন তেল', category: 'খাদ্য ও ডাইনিং (Food & Dining)', stock: 30, unit: 'লিটার', safetyLevel: 10, lastUpdated: '১২/০৬/২০২৬' },
  { id: 'item-4', name: 'দেশী পেঁয়াজ', category: 'খাদ্য ও ডাইনিং (Food & Dining)', stock: 8, unit: 'কেজি', safetyLevel: 12, lastUpdated: '১৩/০৬/২০২৬' },
  { id: 'item-5', name: 'ডিম (লাল)', category: 'খাদ্য ও ডাইনিং (Food & Dining)', stock: 120, unit: 'পিস', safetyLevel: 48, lastUpdated: '১১/০৬/২০২৬' },
  { id: 'item-6', name: 'সাদা আলু', category: 'খাদ্য ও ডাইনিং (Food & Dining)', stock: 65, unit: 'কেজি', safetyLevel: 20, lastUpdated: '১৩/০৬/২০২৬' },
  { id: 'item-7', name: 'লাইফবয় সাবান', category: 'সাধারণ স্টোর (General Store)', stock: 18, unit: 'পিস', safetyLevel: 10, lastUpdated: '১০/০৬/২০২৬' },
  { id: 'item-8', name: 'চক (সাদা)', category: 'সাধারণ স্টোর (General Store)', stock: 5, unit: 'বক্স', safetyLevel: 8, lastUpdated: '০৯/০৬/২০২৬' },
  { id: 'item-9', name: 'সাদা খাতা (১২০ পৃষ্ঠা)', category: 'সাধারণ স্টোর (General Store)', stock: 40, unit: 'পিস', safetyLevel: 15, lastUpdated: '১২/০৬/২০২৬' }
];

const DEFAULT_TRANSACTIONS: InventoryTransaction[] = [
  { id: 'tx-1', itemId: 'item-1', itemName: 'মিনিকেট চাল', type: 'stock_in', quantity: 100, date: '2026-06-11', operator: 'স্টোরকিপার ক্বারী আব্দুর রহমান', notes: 'পাইকারি চালের আড়ত থেকে ক্রয়', cost: 6450 },
  { id: 'tx-2', itemId: 'item-1', itemName: 'মিনিকেট চাল', type: 'stock_out', quantity: 15, date: '2026-06-13', operator: 'বাবুর্চি মো: কাশেম', notes: 'আবাসিক ছাত্রদের দুপুরের খাবার রান্না', receiver: 'বাবুর্চি মো: কাশেম' },
  { id: 'tx-3', itemId: 'item-4', itemName: 'দেশী পেঁয়াজ', type: 'stock_out', quantity: 5, date: '2026-06-13', operator: 'বাবুর্চি মো: কাশেম', notes: 'মালপত্র রান্নার কাজের জন্য', receiver: 'বাবুর্চি মো: কাশেম' },
  { id: 'tx-4', itemId: 'item-8', itemName: 'চক (সাদা)', type: 'stock_out', quantity: 2, date: '2026-06-12', operator: 'মাওলানা আব্দুল ওহাব', notes: 'কিতাব বিভাগের ৩য় ক্লাসরুমের জন্য', receiver: 'মাওলানা আব্দুল ওহাব' }
];

export default function StoreInventoryModule() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'items' | 'ledger'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('সব');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('সব');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals Controller
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);

  // Form States (New Item)
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'খাদ্য ও ডাইনিং (Food & Dining)' | 'সাধারণ স্টোর (General Store)'>('খাদ্য ও ডাইনিং (Food & Dining)');
  const [newItemInitialStock, setNewItemInitialStock] = useState<number>(0);
  const [newItemUnit, setNewItemUnit] = useState('কেজি');
  const [newItemSafetyLevel, setNewItemSafetyLevel] = useState<number>(10);

  // Form States (Stock In / Top-up)
  const [selectedItemIdIn, setSelectedItemIdIn] = useState('');
  const [stockInQty, setStockInQty] = useState<number>(0);
  const [stockInCost, setStockInCost] = useState<number>(0);
  const [stockInDate, setStockInDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockInOperator, setStockInOperator] = useState('ক্বারী আব্দুর রহমান (স্টোরকিপার)');
  const [stockInNotes, setStockInNotes] = useState('');
  const [addToGeneralExpenses, setAddToGeneralExpenses] = useState(true);

  // Form States (Stock Out / Consumed)
  const [selectedItemIdOut, setSelectedItemIdOut] = useState('');
  const [stockOutQty, setStockOutQty] = useState<number>(0);
  const [stockOutDate, setStockOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockOutOperator, setStockOutOperator] = useState('বাবুর্চি মো: কাশেম');
  const [stockOutReceiver, setStockOutReceiver] = useState('ডাইনিং রান্নাশালা');
  const [stockOutNotes, setStockOutNotes] = useState('');

  // Form States (Edit Item details)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemCategory, setEditItemCategory] = useState<'খাদ্য ও ডাইনিং (Food & Dining)' | 'সাধারণ স্টোর (General Store)'>('খাদ্য ও ডাইনিং (Food & Dining)');
  const [editItemUnit, setEditItemUnit] = useState('কেজি');
  const [editItemSafetyLevel, setEditItemSafetyLevel] = useState<number>(10);

  // Deletion confirm state helpers for iframe compatibility
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    const cachedItems = localStorage.getItem('madrasah_inventory_items');
    const cachedTransactions = localStorage.getItem('madrasah_inventory_transactions');

    if (cachedItems) {
      setItems(JSON.parse(cachedItems));
    } else {
      setItems(DEFAULT_ITEMS);
      localStorage.setItem('madrasah_inventory_items', JSON.stringify(DEFAULT_ITEMS));
    }

    if (cachedTransactions) {
      setTransactions(JSON.parse(cachedTransactions));
    } else {
      setTransactions(DEFAULT_TRANSACTIONS);
      localStorage.setItem('madrasah_inventory_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
    }
  }, []);

  // Save utility
  const saveItems = (updated: InventoryItem[]) => {
    setItems(updated);
    localStorage.setItem('madrasah_inventory_items', JSON.stringify(updated));
  };

  const saveTransactions = (updated: InventoryTransaction[]) => {
    setTransactions(updated);
    localStorage.setItem('madrasah_inventory_transactions', JSON.stringify(updated));
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Add Item
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      showNotification('দয়া করে পণ্যের নাম লিখুন!');
      return;
    }

    const dup = items.find(i => i.name.trim() === newItemName.trim());
    if (dup) {
      showNotification('এই নামের একটি পণ্য ইতিমধ্যে বিদ্যমান আছে!');
      return;
    }

    const newlyCreatedItem: InventoryItem = {
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      name: newItemName.trim(),
      category: newItemCategory,
      stock: Number(newItemInitialStock) || 0,
      unit: newItemUnit.trim(),
      safetyLevel: Number(newItemSafetyLevel) || 5,
      lastUpdated: new Date().toLocaleDateString('bn-BD')
    };

    const updatedItems = [newlyCreatedItem, ...items];
    saveItems(updatedItems);

    // If initial stock was > 0, log a transaction too
    if (newlyCreatedItem.stock > 0) {
      const initTx: InventoryTransaction = {
        id: 'tx-' + Math.random().toString(36).substr(2, 9),
        itemId: newlyCreatedItem.id,
        itemName: newlyCreatedItem.name,
        type: 'stock_in',
        quantity: newlyCreatedItem.stock,
        date: new Date().toISOString().split('T')[0],
        operator: 'সিস্টেম প্রারম্ভিক',
        notes: 'নতুন পণ্য খোলার সময়ের প্রারম্ভিক স্টক',
        cost: 0
      };
      saveTransactions([initTx, ...transactions]);
    }

    showNotification(`${newlyCreatedItem.name} সফলভাবে স্টোরে তালিকায় যোগ হয়েছে!`);
    
    // reset form
    setNewItemName('');
    setNewItemInitialStock(0);
    setNewItemUnit('কেজি');
    setNewItemSafetyLevel(10);
    setIsNewItemModalOpen(false);
  };

  // Edit Item Details
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemCategory(item.category);
    setEditItemUnit(item.unit);
    setEditItemSafetyLevel(item.safetyLevel);
    setIsEditItemModalOpen(true);
  };

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editItemName.trim()) return;

    const updated = items.map(i => i.id === editingItem.id ? {
      ...i,
      name: editItemName.trim(),
      category: editItemCategory,
      unit: editItemUnit.trim(),
      safetyLevel: Number(editItemSafetyLevel) || 5,
      lastUpdated: new Date().toLocaleDateString('bn-BD')
    } : i);

    saveItems(updated);
    showNotification('পণ্যের বিবরণ সফলভাবে সংশোধন করা হয়েছে!');
    setIsEditItemModalOpen(false);
    setEditingItem(null);
  };

  // Delete Item Completely
  const handleDeleteItem = (itemId: string, name: string) => {
    const updated = items.filter(i => i.id !== itemId);
    saveItems(updated);
    // filter transaction log too? Better keep logs but filter them. We'll keep logs cleanly.
    showNotification(`${name} স্টোর তালিকা থেকে সম্পূর্ণ মুছে ফেলা হয়েছে!`);
  };

  // Delete Transaction
  const handleDeleteTransaction = (tx: InventoryTransaction) => {
    // Reverse effects from current stock!
    const targetItem = items.find(i => i.id === tx.itemId);
    if (targetItem) {
      let finalStock = targetItem.stock;
      if (tx.type === 'stock_in') {
        finalStock = Math.max(0, finalStock - tx.quantity);
      } else {
        finalStock = finalStock + tx.quantity;
      }
      const updated = items.map(i => i.id === tx.itemId ? {
        ...i,
        stock: finalStock,
        lastUpdated: new Date().toLocaleDateString('bn-BD')
      } : i);
      saveItems(updated);
    }

    const filteredTxs = transactions.filter(t => t.id !== tx.id);
    saveTransactions(filteredTxs);
    showNotification('লেনদেনের রেকর্ড মুছে দেওয়া হয়েছে এবং স্টক সমন্বয় করা হয়েছে!');
  };

  // Stock In (Top-up) Submit
  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find(i => i.id === selectedItemIdIn);
    if (!item) {
      showNotification('দয়া করে একটি সঠিক পণ্য নির্বাচন করুন!');
      return;
    }
    if (Number(stockInQty) <= 0) {
      showNotification('পরিমাণ ১-এর বেশি হতে হবে!');
      return;
    }

    // 1. Log transaction
    const newTx: InventoryTransaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      itemId: item.id,
      itemName: item.name,
      type: 'stock_in',
      quantity: Number(stockInQty),
      date: stockInDate,
      operator: stockInOperator.trim() || 'ক্বারী আব্দুর রহমান',
      notes: stockInNotes.trim() || 'স্টকে পণ্য গ্রহণ করা হল',
      cost: Number(stockInCost) || 0
    };

    // 2. Add stock to item
    const updatedItems = items.map(i => i.id === item.id ? {
      ...i,
      stock: i.stock + Number(stockInQty),
      lastUpdated: new Date().toLocaleDateString('bn-BD')
    } : i);

    saveItems(updatedItems);
    saveTransactions([newTx, ...transactions]);

    // 3. Link with general Madrasah expense if selected & is above 0 Taka
    if (addToGeneralExpenses && Number(stockInCost) > 0) {
      try {
        const cachedExpensesStr = localStorage.getItem('madrasah_expenses');
        const list = cachedExpensesStr ? JSON.parse(cachedExpensesStr) : [];
        
        // Form a nice default voucher No
        const voucherNo = 'INV-' + Math.floor(1000 + Math.random() * 9000);
        
        // Category mapper
        const expCategory = item.category.includes('খাদ্য') ? 'ডাইনিং ও বোর্ডিং খরচ' : 'বই ও স্টেশনারি';
        
        const newExpense = {
          id: 'py-' + Math.random().toString(36).substr(2, 9),
          category: expCategory,
          title: `${item.name} ক্রয় (স্টক গ্রহণ)`,
          amount: Number(stockInCost),
          date: stockInDate,
          voucherNo: voucherNo,
          paymentMethod: 'নগদ (Cash)', 
          remarks: `স্টক পরিমাণ: ${stockInQty} ${item.unit} (${stockInOperator})`
        };

        localStorage.setItem('madrasah_expenses', JSON.stringify([newExpense, ...list]));
        showNotification(`${item.name} স্টকে যুক্ত হয়েছে এবং ক্রয় বাবদ ৳${stockInCost} টাকার ব্যয় খতিয়ানে এন্ট্রি করা হয়েছে!`);
      } catch (err) {
        console.error('Failed to link general expense tracker!', err);
      }
    } else {
      showNotification(`${item.name} স্টকে সফলভাবে যুক্ত করা হয়েছে!`);
    }

    // reset fields
    setStockInQty(0);
    setStockInCost(0);
    setStockInNotes('');
    setIsStockInModalOpen(false);
  };

  // Stock Out Submit
  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find(i => i.id === selectedItemIdOut);
    if (!item) {
      showNotification('দয়া করে একটি সঠিক পণ্য নির্বাচন করুন!');
      return;
    }
    if (Number(stockOutQty) <= 0) {
      showNotification('বিতরণ পরিমাণ ১-এর বেশি হতে হবে!');
      return;
    }
    if (item.stock < Number(stockOutQty)) {
      showNotification(`দুঃখিত! স্টকে পর্যাপ্ত মওজুদ নেই। সর্বোচ্চ মওজুদ ${item.stock} ${item.unit}।`);
      return;
    }

    // 1. Log transaction
    const newTx: InventoryTransaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      itemId: item.id,
      itemName: item.name,
      type: 'stock_out',
      quantity: Number(stockOutQty),
      date: stockOutDate,
      operator: stockOutOperator.trim() || 'বাবুর্চি মো: কাশেম',
      notes: stockOutNotes.trim() || 'স্টক থেকে পণ্য খরচ করা হল',
      receiver: stockOutReceiver.trim() || 'ডাইনিং রান্নাশালা'
    };

    // 2. Deduct stock from item
    const updatedItems = items.map(i => i.id === item.id ? {
      ...i,
      stock: i.stock - Number(stockOutQty),
      lastUpdated: new Date().toLocaleDateString('bn-BD')
    } : i);

    saveItems(updatedItems);
    saveTransactions([newTx, ...transactions]);

    showNotification(`${item.name} থেকে ${stockOutQty} ${item.unit} সফলভাবে খরচ/বিতরণ করা হয়েছে!`);

    // Reset fields
    setStockOutQty(0);
    setStockOutNotes('');
    setIsStockOutModalOpen(false);
  };

  // Pre-fill quick stock actions
  const triggerQuickStockIn = (item: InventoryItem) => {
    setSelectedItemIdIn(item.id);
    setIsStockInModalOpen(true);
  };

  const triggerQuickStockOut = (item: InventoryItem) => {
    setSelectedItemIdOut(item.id);
    setIsStockOutModalOpen(true);
  };

  // Stats Analytics
  const stats = useMemo(() => {
    const totalTypes = items.length;
    const lowStockCount = items.filter(i => i.stock <= i.safetyLevel).length;
    const diningCount = items.filter(i => i.category.includes('খাদ্য')).length;
    const storeCount = items.filter(i => i.category.includes('সাধারণ')).length;
    
    return {
      totalTypes,
      lowStockCount,
      diningCount,
      storeCount
    };
  }, [items]);

  // Filtering search outcomes (for Stock list)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'সব' || item.category.includes(categoryFilter);
      let matchStatus = true;
      if (stockStatusFilter === 'সতর্কতা') {
        matchStatus = item.stock <= item.safetyLevel;
      } else if (stockStatusFilter === 'পর্যাপ্ত') {
        matchStatus = item.stock > item.safetyLevel;
      } else if (stockStatusFilter === 'শূন্য') {
        matchStatus = item.stock === 0;
      }
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchQuery, categoryFilter, stockStatusFilter]);

  // Filtering ledger transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      return tx.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [transactions, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Floating Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 text-xs border border-emerald-600/35"
          >
            <CheckCircle size={16} className="text-emerald-300 shrink-0" />
            <span className="font-semibold">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Boxes size={280} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-800/40 border border-emerald-700/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              <Boxes size={11} />
              <span>স্টোর ও রান্নাঘর ডাটাবেজ</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-sans">স্টোর ও ডাইনিং ইনভেন্টরি খাতা (Store & Mess Inventory)</h2>
            <p className="text-xs text-emerald-100 max-w-xl">
              মাদ্রাসার খাবার মিল সমূহের ডাইনিং চাল, আলু, ডাল তেল থেকে শুরু করে ক্লাসরুম ব্যবহারের চক, মার্কার ও প্রশাসনিক সাধারণ মালামালের হিসাব রক্ষক রেজিস্টার।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                // Initialize default item states
                if (items.length > 0) setSelectedItemIdIn(items[0].id);
                setIsStockInModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md border border-emerald-500/20"
              id="btn-stock-in-open"
            >
              <ArrowUpRight size={14} />
              <span>স্টক ক্রয় / গ্রহণ</span>
            </button>
            <button
              onClick={() => {
                if (items.length > 0) setSelectedItemIdOut(items[0].id);
                setIsStockOutModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md border border-red-500/20"
              id="btn-stock-out-open"
            >
              <ArrowDownLeft size={14} />
              <span>স্টক বিতরণ / খরচ</span>
            </button>
            <button
              onClick={() => setIsNewItemModalOpen(true)}
              className="px-3.5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              id="btn-add-item-open"
            >
              <Plus size={14} />
              <span>নতুন ক্যাটালগ আইটেম</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Inventory Stat Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total catalog items */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">মোট পণ্য প্রকার</span>
            <p className="text-xl font-bold font-sans text-slate-800">{stats.totalTypes} টি</p>
            <p className="text-[9px] text-slate-400">ক্যাটালগে রেজিষ্টার্ড পণ্য</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
            <Boxes size={18} />
          </div>
        </div>

        {/* Low Stock count (Critical) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">কম স্টক সতর্কতা</span>
            <p className="text-xl font-bold font-sans text-amber-600">{stats.lowStockCount} টি</p>
            <p className="text-[9px] text-amber-500 font-medium">নিরাপত্তা লিমিটের নিচে মজুদ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* Food & Dining count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ডাইনিং ও রান্নাঘর খড়চ</span>
            <p className="text-xl font-bold font-sans text-emerald-700">{stats.diningCount} টি</p>
            <p className="text-[9px] text-slate-400">মেস খাবার সংক্রান্ত সামগ্রী</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
            <Folder size={18} className="opacity-90" />
          </div>
        </div>

        {/* General Store Stationeries */}
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">সাধারণ একাডেমিক মালামাল</span>
            <p className="text-xl font-bold font-sans text-indigo-600">{stats.storeCount} টি</p>
            <p className="text-[9px] text-slate-400">স্টেশনারি, চক ও শিক্ষা খড়ি</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Receipt size={18} />
          </div>
        </div>
      </div>

      {/* Main Core Section Card */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
        
        {/* Tabs Control Header & Selections */}
        <div className="p-4 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveSubTab('items')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'items'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
               মজুদ পণ্য তালিকা (Current Stocks)
            </button>
            <button
              onClick={() => {
                setActiveSubTab('ledger');
                setSearchQuery(''); // reset search to facilitate full transactions table
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'ledger'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="tab-ledger-link"
            >
              লেনদেন খতিয়ান রেজিস্টার (Stock Ledger)
            </button>
          </div>

          {/* Quick Search & Filters for both views */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeSubTab === 'items' ? "পণ্য দিয়ে খুঁজুন..." : "পণ্য দিয়ে খুঁজুন..."}
                className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-600 transition-all font-medium text-slate-700 bg-slate-50/50 w-44 md:w-56"
              />
            </div>

            {activeSubTab === 'items' && (
              <>
                {/* Category filtering selection */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-600 bg-white font-semibold text-slate-600 cursor-pointer"
                >
                  <option value="সব">সকল বিভাগ</option>
                  <option value="খাদ্য ও ডাইনিং">খাদ্য ও ডাইনিং</option>
                  <option value="সাধারণ স্টোর">সাধারণ স্টোর</option>
                </select>

                {/* Warning status filtering */}
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="px-2 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-600 bg-white font-semibold text-slate-600 cursor-pointer"
                >
                  <option value="সব">সকল স্থিতি</option>
                  <option value="সতর্কতা">কম স্টক (সতর্কতা)</option>
                  <option value="পর্যাপ্ত">পর্যাপ্ত মজুদ</option>
                  <option value="শূন্য">মজুদ শূন্য (০)</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Current Stock list */}
        {activeSubTab === 'items' && (
          <div className="overflow-x-auto">
            {filteredItems.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-5 text-center w-12">নং</th>
                    <th className="py-3 px-4">পণ্যের নাম</th>
                    <th className="py-3 px-4">ক্যাটাগরি</th>
                    <th className="py-3 px-4 text-center">বর্তমান মজুদ</th>
                    <th className="py-3 px-4 text-center">একক</th>
                    <th className="py-3 px-4 text-center">সতর্কতা লেভেল</th>
                    <th className="py-3 px-4 text-center">স্থিতি</th>
                    <th className="py-3 px-4 text-center">সর্বশেষ আপডেট</th>
                    <th className="py-3 px-5 text-right">স্টক নিয়ন্ত্রণ ও অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredItems.map((item, index) => {
                    const isLow = item.stock <= item.safetyLevel;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-5 text-center text-slate-400 font-mono text-[10px]">{index + 1}</td>
                        <td className="py-3.5 px-4 font-sans text-slate-900 text-sm">{item.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            item.category.includes('খাদ্য') 
                              ? 'bg-emerald-50 text-emerald-800' 
                              : 'bg-indigo-50 text-indigo-800'
                          }`}>
                            {item.category.split(' (')[0]}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 text-center text-sm font-bold font-mono ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                          {item.stock}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-sans">{item.unit}</td>
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">{item.safetyLevel} {item.unit}</td>
                        <td className="py-3.5 px-4 text-center">
                          {item.stock === 0 ? (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" title="মজুদ শুন্য" />
                          ) : isLow ? (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] font-bold border border-rose-100 animate-pulse">
                              <AlertTriangle size={10} />
                              <span>স্টক আনুন</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100">
                              <CheckCircle size={10} />
                              <span>পর্যাপ্ত</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[10px] font-medium text-slate-400 font-mono">{item.lastUpdated}</td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Stock Quick Top Up */}
                            <button
                              onClick={() => triggerQuickStockIn(item)}
                              className="p-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer text-[10px] font-bold flex items-center space-x-0.5"
                              title="স্টক আনুন (Stock In)"
                            >
                              <ArrowUpRight size={10} />
                              <span>যোগ</span>
                            </button>

                            {/* Stock Quick Consumption */}
                            <button
                              onClick={() => triggerQuickStockOut(item)}
                              className="p-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer text-[10px] font-bold flex items-center space-x-0.5"
                              disabled={item.stock === 0}
                              style={{ opacity: item.stock === 0 ? 0.4 : 1 }}
                              title="স্টক খরচ (Stock Out)"
                            >
                              <ArrowDownLeft size={10} />
                              <span>খরচ</span>
                            </button>

                            {/* Edit parameters */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Edit size={12} />
                            </button>

                            {/* Delete Completely */}
                            {deletingItemId === item.id ? (
                              <div className="flex items-center space-x-1 animate-fade-in bg-rose-50 p-1 rounded-lg border border-rose-200">
                                <button
                                  onClick={() => {
                                    handleDeleteItem(item.id, item.name);
                                    setDeletingItemId(null);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-650 hover:bg-rose-700 text-white text-[9px] font-bold cursor-pointer transition-colors"
                                  title="নিশ্চিত ডিলিট করুন"
                                >
                                  হ্যাঁ
                                </button>
                                <button
                                  onClick={() => setDeletingItemId(null)}
                                  className="px-1 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[9px] font-bold cursor-pointer transition-colors"
                                  title="ডিলিট বাতিল"
                                >
                                  না
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingItemId(item.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="সম্পূর্ণ মুছুন"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-slate-400 font-semibold space-y-2">
                <Boxes className="mx-auto text-slate-300" size={32} />
                <p className="text-xs">কোনো ইনভেন্টরি মওজুদ পণ্য খুঁজে পাওয়া যায়নি!</p>
                <p className="text-[10px] text-slate-400">নতুন ক্যাটালগ আইটেম তৈরি করতে উপরের বোতামে ক্লিক করুন।</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Stock Ledger Transactions list */}
        {activeSubTab === 'ledger' && (
          <div className="overflow-x-auto">
            {filteredTransactions.length > 0 ? (
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-5 text-center w-12">নং</th>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">পণ্য</th>
                    <th className="py-3 px-4 text-center">লেনদেন ধরণ</th>
                    <th className="py-3 px-4 text-center">পরিমাণ</th>
                    <th className="py-3 px-4">দায়িত্বে নিয়োজিত ব্যক্তি</th>
                    <th className="py-3 px-4 text-center">ব্যয়/গ্রহীতা</th>
                    <th className="py-3 px-4">রিমার্কস বা কাজের বিবরণী</th>
                    <th className="py-3 px-5 text-right w-16">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredTransactions.map((tx, index) => {
                    const isIn = tx.type === 'stock_in';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-5 text-center text-slate-400 font-mono text-[10px]">{index + 1}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-xs font-medium">{tx.date}</td>
                        <td className="py-3 px-4 font-sans text-slate-900 text-sm">{tx.itemName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isIn 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isIn ? 'ক্রয় / স্টক ইন' : 'বিতরণ / খরচ'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-center font-bold font-mono text-sm ${isIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIn ? '+' : '-'}{tx.quantity}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <User size={11} className="text-slate-400 shrink-0" />
                            <span className="text-slate-600 truncate max-w-[120px]">{tx.operator}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-sans text-xs">
                          {isIn ? (
                            tx.cost ? (
                              <span className="font-mono text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 text-[10px] font-bold border border-amber-100">
                                ৳{tx.cost}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[100px] inline-block font-medium">
                              {tx.receiver || 'ডাইনিং'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-normal truncate max-w-[200px]" title={tx.notes}>
                          {tx.notes}
                        </td>
                        <td className="py-3 px-5 text-right font-semibold">
                          {deletingTxId === tx.id ? (
                            <div className="flex items-center justify-end space-x-1 animate-fade-in">
                              <button
                                onClick={() => {
                                  handleDeleteTransaction(tx);
                                  setDeletingTxId(null);
                                }}
                                className="px-1.5 py-0.5 rounded bg-rose-650 hover:bg-rose-700 text-white text-[9px] font-bold cursor-pointer transition-all"
                                title="নিশ্চিত ডিলিট করুন"
                              >
                                হ্যাঁ
                              </button>
                              <button
                                onClick={() => setDeletingTxId(null)}
                                className="px-1 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[9px] font-bold cursor-pointer transition-all"
                                title="বাতিল"
                              >
                                না
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingTxId(tx.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors rounded-lg cursor-pointer ml-auto block"
                              title="লেনদেন মুছে ফেলুন"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-slate-400 font-semibold space-y-2">
                <Clock className="mx-auto text-slate-300" size={32} />
                <p className="text-xs">কোনো স্টক লেনদেন রেকর্ড পাওয়া যায়নি!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Add New Catalog Item Parameters */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-emerald-900">
                <Boxes size={18} />
                <h3 className="font-bold text-sm">নতুন ক্যাটালগ আইটেম যুক্ত করুন</h3>
              </div>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-150 rounded-lg cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">পণ্যের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="উদা: মিনিকেট চাল, দেশী আলু, চক"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ক্যাটাগরি নির্ধারণ *</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-600"
                  >
                    <option value="খাদ্য ও ডাইনিং (Food & Dining)">খাদ্য ও ডাইনিং</option>
                    <option value="সাধারণ স্টোর (General Store)">সাধারণ স্টোর</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">মাপার একক (Unit) *</label>
                  <input
                    type="text"
                    required
                    placeholder="উদা: কেজি, পিস, লিটার"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">প্রারম্ভিক স্টক মজুদ</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemInitialStock}
                    onChange={(e) => setNewItemInitialStock(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">সতর্কতা স্টক লেভেল *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemSafetyLevel}
                    onChange={(e) => setNewItemSafetyLevel(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 font-mono text-slate-800"
                    title="এই সীমানার কম হলেই রিফিল সতর্ক বার্তা দিবে"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl cursor-pointer"
                >
                  ক্যাটালগে যুক্ত করুন
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: Stock In (ক্রয় / মজুদ বৃদ্ধি) */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-emerald-950">
                <ArrowUpRight size={18} className="text-emerald-700 animate-bounce" />
                <h3 className="font-bold text-sm">পণ্য ক্রয় ও স্টকে আগমন (Stock In)</h3>
              </div>
              <button
                onClick={() => setIsStockInModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-150 rounded-lg cursor-pointer transition-colors"
                id="btn-stock-in-close"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleStockInSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">পণ্য নির্বাচন করুন *</label>
                <select
                  value={selectedItemIdIn}
                  onChange={(e) => setSelectedItemIdIn(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-750 font-semibold"
                  required
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (মজুদ: {item.stock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ক্রয়/আগমন পরিমাণ *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInQty || ''}
                    onChange={(e) => setStockInQty(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 font-mono text-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">মোট ক্রয় মূল্য (টাকা) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockInCost || ''}
                    onChange={(e) => setStockInCost(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 font-mono text-slate-850"
                    placeholder="৳ 0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">গ্রহণের তারিখ</label>
                  <input
                    type="date"
                    required
                    value={stockInDate}
                    onChange={(e) => setStockInDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 font-mono text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">দায়িত্বপ্রাপ্ত কর্মকর্তা</label>
                  <input
                    type="text"
                    required
                    value={stockInOperator}
                    onChange={(e) => setStockInOperator(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">মেমো নম্বর ও ক্রয়ের বিবরণী</label>
                <textarea
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  placeholder="উদা: চকবাজার পাইকারি বাজার থেকে কছম স্টোর মারফত ক্রয়।"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 h-16 outline-none focus:border-emerald-700 text-slate-700 resize-none"
                />
              </div>

              {/* Connected accounting toggle */}
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100/50 flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="chk-link-accounting"
                  checked={addToGeneralExpenses}
                  onChange={(e) => setAddToGeneralExpenses(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                />
                <label htmlFor="chk-link-accounting" className="text-[11px] text-emerald-800 font-bold select-none cursor-pointer">
                  ক্রয় খরচটি মাদারাসার মূল ব্যয় খাতায় (Expenses Register) ডাইনিং/স্টেশনারি বিভাগে সরাসরি যুক্ত করুন।
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl cursor-pointer"
                  id="btn-stock-in-submit"
                >
                  স্টক এন্ট্রি করুন
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: Stock Out (বিতরণ / মালামাল খরচ) */}
      {isStockOutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-red-950">
                <ArrowDownLeft size={18} className="text-red-650" />
                <h3 className="font-bold text-sm">স্টক বিতরণ ও খরচ হিসাব (Stock Out)</h3>
              </div>
              <button
                onClick={() => setIsStockOutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-150 rounded-lg cursor-pointer transition-colors"
                id="btn-stock-out-close"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleStockOutSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">পণ্য নির্বাচন করুন *</label>
                <select
                  value={selectedItemIdOut}
                  onChange={(e) => setSelectedItemIdOut(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white font-semibold text-slate-750"
                  required
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id} disabled={item.stock === 0}>
                      {item.name} (মওজুদ মাত্রা: {item.stock} {item.unit}) {item.stock === 0 ? '- [না-খালি]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">খরচকৃত পরিমাণ *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockOutQty || ''}
                    onChange={(e) => setStockOutQty(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-600 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">গ্রহীতা / ব্যবহার ক্ষেত্র *</label>
                  <input
                    type="text"
                    required
                    value={stockOutReceiver}
                    onChange={(e) => setStockOutReceiver(e.target.value)}
                    placeholder="উদা: ছাত্র ডাইনিং মেস / উস্তাদজী"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">বিতরণ বা খরচের তারিখ</label>
                  <input
                    type="date"
                    required
                    value={stockOutDate}
                    onChange={(e) => setStockOutDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-700 font-mono text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">বিতরণকারী কর্মকর্তা</label>
                  <input
                    type="text"
                    required
                    value={stockOutOperator}
                    onChange={(e) => setStockOutOperator(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-red-700 text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">বিতরণের সুনির্দিষ্ট কারণ</label>
                <textarea
                  value={stockOutNotes}
                  onChange={(e) => setStockOutNotes(e.target.value)}
                  placeholder="উদা: দুপুরের খাবারে আবাসিক ছাত্রদের আলুভর্তা ও ডাল রান্নার জন্য বন্টন।"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 h-16 outline-none focus:border-red-700 text-slate-700 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsStockOutModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
                  id="btn-stock-out-submit"
                >
                  স্টক খরচ এন্ট্রি
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 4: Edit Item Technical properties */}
      {isEditItemModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 text-emerald-900">
                <Edit size={16} />
                <h3 className="font-bold text-sm">পণ্যের তথ্য সংশোধন করুন</h3>
              </div>
              <button
                onClick={() => {
                  setIsEditItemModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-150 rounded-lg cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">পণ্যের নাম *</label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 text-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ক্যাটাগরি নির্ধারণ *</label>
                  <select
                    value={editItemCategory}
                    onChange={(e) => setEditItemCategory(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none bg-white text-slate-650"
                  >
                    <option value="খাদ্য ও ডাইনিং (Food & Dining)">খাদ্য ও ডাইনিং</option>
                    <option value="সাধারণ স্টোর (General Store)">সাধারণ স্টোর</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">মাপার একক *</label>
                  <input
                    type="text"
                    required
                    value={editItemUnit}
                    onChange={(e) => setEditItemUnit(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 text-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">নিরাপত্তা সতর্কতা লিমিট (Safety Level) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editItemSafetyLevel}
                  onChange={(e) => setEditItemSafetyLevel(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-700 font-mono text-slate-850"
                />
                <p className="text-[10px] text-slate-400 mt-1">মজুদ এই পরিমাণ বা নিচের দিকে গেলে সতর্কতা লাল সাইন প্রদর্শন করবে।</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditItemModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl cursor-pointer"
                >
                  তথ্য সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
