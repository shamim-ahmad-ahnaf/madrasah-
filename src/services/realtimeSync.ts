import { AppNotification } from '../types';
import { db, doc, setDoc, getDoc, onSnapshot } from './firebase';

// Persistent Device Identifier
export const getDeviceId = (): string => {
  let id = localStorage.getItem('madrasah_device_id');
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem('madrasah_device_id', id);
  }
  return id;
};

export const getDeviceName = (): string => {
  let name = localStorage.getItem('madrasah_device_name');
  if (!name) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    name = isMobile ? 'মোবাইল ডিভাইস' : 'প্রধান ডিভাইস (অ্যাডমিন)';
    localStorage.setItem('madrasah_device_name', name);
  }
  return name;
};

export const setDeviceName = (name: string): void => {
  if (name && name.trim()) {
    localStorage.setItem('madrasah_device_name', name.trim());
  }
};

// Subtle Web Audio Sound Notification (No external asset dependencies)
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second tone (higher chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    // Audio play might be blocked if no user interaction yet, safe to ignore
  }
};

export interface SyncEventPayload {
  type: string;
  key?: string;
  data?: any;
  entries?: Record<string, any>;
  notification?: AppNotification;
  senderDeviceId?: string;
  senderName?: string;
  timestamp?: string;
}

type SyncListener = (event: SyncEventPayload) => void;
type StatusListener = (status: { connected: boolean; syncing: boolean; lastSyncTime: string }) => void;

class RealtimeSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnectedToServer: boolean = navigator.onLine;
  private isCurrentlySyncing: boolean = false;
  private lastServerTimestamp: string = '';
  private lastSuccessfulSyncTime: string = 'এখনই';
  private firestoreUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initBroadcastChannel();
    this.initStorageListener();
    this.initNetworkListeners();
    this.initFirestoreListener();
  }

  // 1. Same-device multi-tab instant synchronization via BroadcastChannel
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('madrasah_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or failed:', err);
      }
    }
  }

  // 2. Storage event listener for fallback browser tabs
  private initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('madrasah_') && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.notifyListeners({
              type: 'STORAGE_SYNC',
              key: e.key,
              data: parsed,
              senderDeviceId: 'local_tab'
            });
          } catch (err) {
            // ignore non-json
          }
        }
      });
    }
  }

  // 3. Online/offline connection watchers
  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isConnectedToServer = true;
        this.broadcastStatus();
        this.forceRefresh();
      });
      window.addEventListener('offline', () => {
        this.isConnectedToServer = false;
        this.broadcastStatus();
      });
    }
  }

  // 4. Firebase Firestore Live Real-Time Snapshot Listener
  private initFirestoreListener() {
    if (typeof window === 'undefined') return;

    try {
      const docRef = doc(db, 'madrasah_system', 'main_store');
      this.firestoreUnsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          this.isConnectedToServer = true;
          this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', {
            hour: '2-digit',
            minute: '2-digit'
          });
          this.broadcastStatus();

          if (!snapshot.exists()) {
            // Initial seed if Firestore document is fresh
            this.seedInitialDataToFirestore();
            return;
          }

          const rawData = snapshot.data();
          if (!rawData) return;

          const myDeviceId = getDeviceId();
          const lastEvent = rawData._lastEvent;

          // If another device triggered this update
          if (lastEvent && lastEvent.senderDeviceId !== myDeviceId) {
            if (lastEvent.key && lastEvent.data !== undefined) {
              try {
                const dataStr = typeof lastEvent.data === 'string' ? lastEvent.data : JSON.stringify(lastEvent.data);
                localStorage.setItem(lastEvent.key, dataStr);
              } catch (e) {}
            }

            if (lastEvent.notification) {
              playNotificationChime();
            }

            this.notifyListeners({
              type: 'DATA_SYNC',
              key: lastEvent.key,
              data: lastEvent.data,
              notification: lastEvent.notification,
              senderDeviceId: lastEvent.senderDeviceId,
              senderName: lastEvent.senderName,
              timestamp: lastEvent.timestamp
            });
          }

          // Merge all data keys into localStorage
          this.applyFullServerData(rawData, false);
        },
        (error) => {
          console.warn('Firestore live listener offline or reconnecting:', error);
          this.isConnectedToServer = navigator.onLine;
          this.broadcastStatus();
        }
      );
    } catch (err) {
      console.warn('Could not initialize Firestore listener:', err);
    }
  }

  // Initial seed from localStorage or server to Firestore if fresh
  private async seedInitialDataToFirestore() {
    try {
      const localData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('madrasah_') || k === 'notifications')) {
          try {
            localData[k] = JSON.parse(localStorage.getItem(k) || '');
          } catch (e) {
            localData[k] = localStorage.getItem(k);
          }
        }
      }

      if (Object.keys(localData).length > 0) {
        const docRef = doc(db, 'madrasah_system', 'main_store');
        await setDoc(docRef, {
          ...localData,
          _updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Could not seed data to Firestore:', e);
    }
  }

  // Apply server/Firestore data into localStorage and trigger listeners
  public applyFullServerData(data: Record<string, any>, isInitialBoot: boolean = false) {
    if (!data || typeof data !== 'object') return;

    const keysToSync = Object.keys(data).filter(
      (k) => !k.startsWith('_') && (k.startsWith('madrasah_') || k === 'notifications')
    );

    keysToSync.forEach((key) => {
      if (data[key] !== undefined) {
        try {
          const currentLocal = localStorage.getItem(key);
          const newString = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);

          // Update if changed or on initial boot
          if (currentLocal !== newString || isInitialBoot) {
            localStorage.setItem(key, newString);
            this.notifyListeners({
              type: 'FULL_DATA_SYNC',
              key,
              data: data[key],
              senderDeviceId: 'server'
            });
          }
        } catch (e) {
          // ignore
        }
      }
    });

    // Also notify bulk sync event so UI can reload all collections cleanly
    this.notifyListeners({
      type: 'BULK_REFRESH_COMPLETE',
      entries: data,
      senderDeviceId: 'server'
    });
  }

  // Force manual refresh: pulls fresh data from Firestore immediately
  public async forceRefresh(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      this.isCurrentlySyncing = true;
      this.broadcastStatus();

      // 1. Try Firestore direct
      try {
        const docRef = doc(db, 'madrasah_system', 'main_store');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          this.isConnectedToServer = true;
          this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
          this.applyFullServerData(data, true);
          this.broadcastStatus();
          return { success: true, data };
        }
      } catch (err) {
        console.warn('Direct Firestore fetch error, trying backend route:', err);
      }

      // 2. Fallback to Express backend if running in fullstack dev
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.lastServerTimestamp = json.lastUpdated || '';
          this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
          this.applyFullServerData(json.data, true);
          this.isConnectedToServer = true;
          this.broadcastStatus();
          return { success: true, data: json.data };
        }
      }

      return { success: false, error: 'ডাটাবেজ রিফ্রেশ সম্পন্ন হয়নি।' };
    } catch (err: any) {
      console.error('Manual refresh error:', err);
      return { success: false, error: err?.message || 'ডাটাবেজ রিফ্রেশ ব্যর্থ হয়েছে।' };
    } finally {
      this.isCurrentlySyncing = false;
      this.broadcastStatus();
    }
  }

  // Subscribe to real-time events
  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Subscribe to connection status changes
  public subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener({
      connected: this.isConnectedToServer,
      syncing: this.isCurrentlySyncing,
      lastSyncTime: this.lastSuccessfulSyncTime
    });
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private broadcastStatus() {
    const status = {
      connected: this.isConnectedToServer,
      syncing: this.isCurrentlySyncing,
      lastSyncTime: this.lastSuccessfulSyncTime
    };
    this.statusListeners.forEach((l) => {
      try {
        l(status);
      } catch (e) {
        // ignore
      }
    });
  }

  private notifyListeners(event: SyncEventPayload) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }

  // Push an update from this device to ALL other devices and tabs
  public async syncChange(
    key: string,
    data: any,
    action: {
      title: string;
      message: string;
      module: AppNotification['module'];
      type: AppNotification['type'];
      targetTab?: string;
      targetId?: string;
      data?: any;
    }
  ): Promise<AppNotification> {
    const senderDeviceId = getDeviceId();
    const senderName = getDeviceName();

    // 1. Immediately persist locally
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(key, dataString);

    // 2. Create notification record
    const notification: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      title: action.title,
      message: action.message,
      module: action.module,
      type: action.type,
      timestamp: new Date().toISOString(),
      senderDeviceId,
      senderName,
      targetTab: action.targetTab,
      targetId: action.targetId,
      data: action.data !== undefined ? action.data : undefined,
      isRead: false
    };

    // Store notification locally with strict deduplication
    try {
      const storedNotifs: AppNotification[] = JSON.parse(localStorage.getItem('madrasah_notifications') || '[]');
      const notifMap = new Map<string, AppNotification>();
      notifMap.set(notification.id, notification);
      storedNotifs.forEach((n) => {
        if (n && n.id && !notifMap.has(n.id)) {
          notifMap.set(n.id, n);
        }
      });
      const updatedNotifs = Array.from(notifMap.values()).slice(0, 100);
      localStorage.setItem('madrasah_notifications', JSON.stringify(updatedNotifs));
    } catch (e) {
      // ignore
    }

    // 3. Broadcast to other tabs on the same device and notify local listeners
    const payload: SyncEventPayload = {
      type: 'LOCAL_SYNC',
      key,
      data,
      notification,
      senderDeviceId,
      senderName,
      timestamp: new Date().toISOString()
    };

    this.notifyListeners(payload);

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {
        // ignore
      }
    }

    // 4. Send to Firebase Firestore for Instant Global Multi-Device Broadcast
    try {
      this.isCurrentlySyncing = true;
      this.broadcastStatus();

      const docRef = doc(db, 'madrasah_system', 'main_store');
      await setDoc(
        docRef,
        {
          [key]: data,
          _lastEvent: {
            key,
            data,
            notification,
            senderDeviceId,
            senderName,
            timestamp: new Date().toISOString()
          },
          _updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit'
      });
      this.isConnectedToServer = true;
    } catch (err) {
      console.warn('Firestore sync failed, local copy kept:', err);
    } finally {
      this.isCurrentlySyncing = false;
      this.broadcastStatus();
    }

    // 5. Also notify backend if reachable (optional fallback)
    try {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          data,
          action,
          senderDeviceId,
          senderName
        })
      }).catch(() => {});
    } catch (e) {}

    return notification;
  }

  // Bulk sync helper
  public async syncBulk(
    entries: Record<string, any>,
    action: {
      title: string;
      message: string;
      module: AppNotification['module'];
      type: AppNotification['type'];
    }
  ) {
    const senderDeviceId = getDeviceId();
    const senderName = getDeviceName();

    // Persist locally
    Object.keys(entries).forEach((k) => {
      const val = entries[k];
      const str = typeof val === 'string' ? val : JSON.stringify(val);
      localStorage.setItem(k, str);
    });

    try {
      this.isCurrentlySyncing = true;
      this.broadcastStatus();

      const docRef = doc(db, 'madrasah_system', 'main_store');
      await setDoc(
        docRef,
        {
          ...entries,
          _lastEvent: {
            key: 'bulk',
            entries,
            senderDeviceId,
            senderName,
            timestamp: new Date().toISOString()
          },
          _updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', {
        hour: '2-digit',
        minute: '2-digit'
      });
      this.isConnectedToServer = true;
    } catch (e) {
      console.warn('Bulk sync to Firestore failed:', e);
    } finally {
      this.isCurrentlySyncing = false;
      this.broadcastStatus();
    }
  }

  // Verify Owner / Admin Password
  public async verifyOwnerPassword(password: string): Promise<boolean> {
    const trimmed = password.trim();
    if (!trimmed) return false;

    // Check with Firestore Security Document
    try {
      const secSnap = await getDoc(doc(db, 'madrasah_system', 'security'));
      if (secSnap.exists()) {
        const secData = secSnap.data();
        if (secData && secData.adminPassword) {
          localStorage.setItem('madrasah_admin_password', secData.adminPassword);
          return trimmed === secData.adminPassword;
        }
      }
    } catch (e) {
      // offline fallback
    }

    // Check local storage or default password
    const localAdminPassword = localStorage.getItem('madrasah_admin_password') || 'admin123';
    return trimmed === localAdminPassword;
  }

  // Change Owner Password
  public async changeOwnerPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const isCurrentValid = await this.verifyOwnerPassword(currentPassword);
    if (!isCurrentValid) {
      return { success: false, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়!' };
    }

    const trimmedNew = newPassword.trim();
    if (trimmedNew.length < 4) {
      return { success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!' };
    }

    try {
      // Save to Firestore
      const secRef = doc(db, 'madrasah_system', 'security');
      await setDoc(secRef, {
        adminPassword: trimmedNew,
        updatedAt: new Date().toISOString(),
        updatedBy: getDeviceName()
      }, { merge: true });

      // Save locally
      localStorage.setItem('madrasah_admin_password', trimmedNew);

      return { success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' };
    } catch (e: any) {
      localStorage.setItem('madrasah_admin_password', trimmedNew);
      return { success: true, message: 'পাসওয়ার্ড স্থানীয়ভাবে আপডেট হয়েছে।' };
    }
  }

  // Status check
  public isConnected(): boolean {
    return this.isConnectedToServer;
  }

  // Owner Authorization & Device Recognition
  public isOwnerDevice(): boolean {
    return localStorage.getItem('madrasah_is_owner_device') === 'true';
  }

  public setOwnerDevice(isOwner: boolean): void {
    if (isOwner) {
      localStorage.setItem('madrasah_is_owner_device', 'true');
      localStorage.removeItem('madrasah_owner_auth_expire');
    } else {
      localStorage.setItem('madrasah_is_owner_device', 'false');
      localStorage.removeItem('madrasah_owner_auth_expire');
    }
  }

  public isOwnerAuthorized(): boolean {
    if (this.isOwnerDevice()) {
      return true;
    }
    try {
      const expire = localStorage.getItem('madrasah_owner_auth_expire');
      if (expire && parseInt(expire, 10) > Date.now()) {
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  public setTemporaryOwnerAuth(minutes: number = 15): void {
    const expire = Date.now() + minutes * 60 * 1000;
    localStorage.setItem('madrasah_owner_auth_expire', expire.toString());
  }

  public lockOwnerMode(): void {
    localStorage.setItem('madrasah_is_owner_device', 'false');
    localStorage.removeItem('madrasah_owner_auth_expire');
  }

  // Cross-device Backup & Sync Code Helpers
  public exportAllData(): string {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('madrasah_') || key === 'notifications')) {
        const val = localStorage.getItem(key);
        try {
          data[key] = JSON.parse(val || '');
        } catch (e) {
          data[key] = val;
        }
      }
    }
    data.exportedAt = new Date().toISOString();
    data.exportedDevice = getDeviceName();
    return JSON.stringify(data, null, 2);
  }

  public async importAllData(jsonString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'ফাইলটিতে সঠিক ডাটা পাওয়া যায়নি।' };
      }

      delete parsed.exportedAt;
      delete parsed.exportedDevice;

      this.applyFullServerData(parsed, true);
      await this.syncBulk(parsed, {
        title: 'ডাটাবেজ রিস্টোর সম্পন্ন 📥',
        message: 'ব্যাকআপ ফাইল হতে সমস্ত তথ্য সফলভাবে রিস্টোর ও সিঙ্ক করা হয়েছে।',
        module: 'general',
        type: 'update'
      });
      return { success: true };
    } catch (e: any) {
      console.error('Failed to import data:', e);
      return { success: false, error: e?.message || 'ডাটা ইমপোর্ট ব্যর্থ হয়েছে।' };
    }
  }

  // Device helpers
  public getDeviceId(): string {
    return getDeviceId();
  }

  public getDeviceName(): string {
    return getDeviceName();
  }

  public setDeviceName(name: string): void {
    setDeviceName(name);
  }
}

export const realtimeSync = new RealtimeSyncManager();
