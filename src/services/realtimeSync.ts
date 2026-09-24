import { AppNotification } from '../types';

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
    name = isMobile ? 'মোবাইল ডিভাইস' : 'ল্যাপটপ / কম্পিউটার (মেইন)';
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
  private eventSource: EventSource | null = null;
  private isConnectedToServer: boolean = false;
  private isCurrentlySyncing: boolean = false;
  private reconnectTimeout: any = null;
  private fallbackPollingInterval: any = null;
  private lastServerTimestamp: string = '';
  private lastSuccessfulSyncTime: string = 'এখনই';

  constructor() {
    this.initBroadcastChannel();
    this.initSSE();
    this.initStorageListener();
    this.initFallbackPolling();
    // Fetch initial server data immediately upon construction
    this.fetchInitialServerData();
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

  // 2. Storage event listener for older or fallback browser tabs
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

  // 3. Multi-device Real-Time Server-Sent Events (SSE)
  private initSSE() {
    if (typeof window === 'undefined') return;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.isConnectedToServer = true;
        this.broadcastStatus();
      };

      this.eventSource.onmessage = (e) => {
        try {
          const payload: SyncEventPayload = JSON.parse(e.data);
          if (payload && payload.type) {
            const myDeviceId = getDeviceId();

            if (payload.type === 'CONNECTED') {
              this.isConnectedToServer = true;
              if (payload.timestamp || payload.data) {
                this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
              }
              this.broadcastStatus();

              // If server provided full data upon connection, apply it if we haven't synced yet
              if (payload.data && typeof payload.data === 'object') {
                this.applyFullServerData(payload.data, false);
              }
              return;
            }

            // Check if this event was sent by another device or server
            if (payload.senderDeviceId !== myDeviceId) {
              if (payload.type === 'DATA_SYNC' && payload.key) {
                // Update local storage directly
                try {
                  const dataStr = typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data);
                  localStorage.setItem(payload.key, dataStr);
                } catch (err) {
                  // ignore
                }
              } else if (payload.type === 'BULK_DATA_SYNC' && payload.entries) {
                Object.keys(payload.entries).forEach((k) => {
                  try {
                    const val = payload.entries![k];
                    const dataStr = typeof val === 'string' ? val : JSON.stringify(val);
                    localStorage.setItem(k, dataStr);
                  } catch (err) {
                    // ignore
                  }
                });
              }

              // Play chime for incoming remote changes
              if (payload.notification) {
                playNotificationChime();
              }

              this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
              this.broadcastStatus();
              this.notifyListeners(payload);
            }
          }
        } catch (err) {
          // heartbeat or ping
        }
      };

      this.eventSource.onerror = () => {
        this.isConnectedToServer = false;
        this.broadcastStatus();
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect after 3 seconds
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.initSSE();
        }, 3000);
      };
    } catch (err) {
      this.isConnectedToServer = false;
      this.broadcastStatus();
    }
  }

  // 4. Initial server data fetch on startup
  public async fetchInitialServerData() {
    try {
      this.isCurrentlySyncing = true;
      this.broadcastStatus();
      const res = await fetch('/api/data');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          this.isConnectedToServer = true;
          this.lastServerTimestamp = json.lastUpdated || '';
          this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
          this.applyFullServerData(json.data, true);
        }
      }
    } catch (err) {
      console.warn('Initial server fetch failed, using cached localStorage data:', err);
    } finally {
      this.isCurrentlySyncing = false;
      this.broadcastStatus();
    }
  }

  // 5. Periodic polling fallback every 3.5 seconds to guarantee zero missed updates
  private initFallbackPolling() {
    if (typeof window === 'undefined') return;

    this.fallbackPollingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/data');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          this.isConnectedToServer = true;
          if (json.success && json.lastUpdated && json.lastUpdated !== this.lastServerTimestamp) {
            this.lastServerTimestamp = json.lastUpdated;
            this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
            if (json.data) {
              this.applyFullServerData(json.data, false);
            }
          }
          this.broadcastStatus();
        }
      } catch (e) {
        // network glitch
      }
    }, 3500);
  }

  // Apply server data into localStorage and trigger listeners
  public applyFullServerData(data: Record<string, any>, isInitialBoot: boolean = false) {
    if (!data || typeof data !== 'object') return;

    const keysToSync = Object.keys(data).filter(
      (k) => k.startsWith('madrasah_') || k === 'notifications'
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

  // Force manual refresh: fetches all data from server immediately
  public async forceRefresh(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      this.isCurrentlySyncing = true;
      this.broadcastStatus();

      const res = await fetch('/api/data');
      if (!res.ok) {
        throw new Error('Server returned status ' + res.status);
      }

      const json = await res.json();
      if (json.success && json.data) {
        this.lastServerTimestamp = json.lastUpdated || '';
        this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
        this.applyFullServerData(json.data, true);
        this.isConnectedToServer = true;
        this.broadcastStatus();
        return { success: true, data: json.data };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
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
    // Send immediate status
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

    // Notify local listeners so toast and notifications appear immediately
    this.notifyListeners(payload);

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (e) {
        // ignore
      }
    }

    // 4. Send to server to broadcast to all external devices/phones/computers
    try {
      this.isCurrentlySyncing = true;
      this.broadcastStatus();

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          data,
          action,
          senderDeviceId,
          senderName
        })
      });

      if (res.ok) {
        this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
        this.isConnectedToServer = true;
      }
    } catch (err) {
      console.warn('Network sync failed, persisted locally:', err);
      this.isConnectedToServer = false;
    } finally {
      this.isCurrentlySyncing = false;
      this.broadcastStatus();
    }

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

      const res = await fetch('/api/sync-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries,
          action,
          senderDeviceId,
          senderName
        })
      });

      if (res.ok) {
        this.lastSuccessfulSyncTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
        this.isConnectedToServer = true;
      }
    } catch (e) {
      console.warn('Bulk sync to server failed:', e);
    } finally {
      this.isCurrentlySyncing = false;
      this.broadcastStatus();
    }
  }

  // Verify Owner / Admin Password
  public async verifyOwnerPassword(password: string): Promise<boolean> {
    const trimmed = password.trim();
    if (!trimmed) return false;

    // Check with backend
    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.valid) return true;
      }
    } catch (e) {
      // offline fallback: check localStorage
    }

    const localAdminPassword = localStorage.getItem('madrasah_admin_password') || 'admin123';
    return trimmed === localAdminPassword;
  }

  // Change Owner Password
  public async changeOwnerPassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });

      const json = await res.json();
      if (json.success) {
        localStorage.setItem('madrasah_admin_password', newPassword.trim());
        return { success: true, message: json.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' };
      } else {
        return { success: false, error: json.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' };
      }
    } catch (e) {
      // Local fallback
      const localCurrent = localStorage.getItem('madrasah_admin_password') || 'admin123';
      if (currentPassword.trim() !== localCurrent) {
        return { success: false, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়!' };
      }
      localStorage.setItem('madrasah_admin_password', newPassword.trim());
      return { success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' };
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
      await this.syncBulk(parsed, 'ডাটা ইমপোর্ট ও সম্পূর্ণ রিস্টোর');
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
