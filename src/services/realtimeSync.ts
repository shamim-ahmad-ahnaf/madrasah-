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
    name = isMobile ? 'মোবাইল ডিভাইস' : 'কম্পিউটার / পিসি';
    localStorage.setItem('madrasah_device_name', name);
  }
  return name;
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
  key: string;
  data: any;
  notification?: AppNotification;
  senderDeviceId?: string;
  timestamp?: string;
}

type SyncListener = (event: SyncEventPayload) => void;

class RealtimeSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private isConnectedToServer: boolean = false;
  private reconnectTimeout: any = null;
  private fallbackPollingInterval: any = null;
  private lastServerTimestamp: string = '';

  constructor() {
    this.initBroadcastChannel();
    this.initSSE();
    this.initStorageListener();
    this.initFallbackPolling();
  }

  // 1. Same-device multi-tab instant synchronization via BroadcastChannel
  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('madrasah_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.key) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported or failed:', err);
      }
    }
  }

  // 2. Storage event listener for older or fallback browsers
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
      };

      this.eventSource.onmessage = (e) => {
        try {
          const payload: SyncEventPayload = JSON.parse(e.data);
          if (payload && payload.type) {
            // Check if this event was sent by another device
            const myDeviceId = getDeviceId();
            if (payload.senderDeviceId !== myDeviceId) {
              this.notifyListeners(payload);
            }
          }
        } catch (err) {
          // heartbeat or ping
        }
      };

      this.eventSource.onerror = () => {
        this.isConnectedToServer = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Auto-reconnect after 4 seconds
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.initSSE();
        }, 4000);
      };
    } catch (err) {
      this.isConnectedToServer = false;
    }
  }

  // 4. Periodic polling fallback every 5 seconds to ensure 100% data freshness
  private initFallbackPolling() {
    if (typeof window === 'undefined') return;

    this.fallbackPollingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.lastUpdated && json.lastUpdated !== this.lastServerTimestamp) {
            this.lastServerTimestamp = json.lastUpdated;
            // Update local store with server's freshest data if newer
            if (json.data) {
              this.applyFullServerData(json.data);
            }
          }
        }
      } catch (e) {
        // server might be busy, ignore
      }
    }, 5000);
  }

  // Apply server data into localStorage and trigger listeners
  private applyFullServerData(data: Record<string, any>) {
    Object.keys(data).forEach((key) => {
      if (key.startsWith('madrasah_') && data[key] !== undefined) {
        try {
          const currentLocal = localStorage.getItem(key);
          const newString = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
          if (currentLocal !== newString) {
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
  }

  // Subscribe to real-time events
  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
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
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.random().toString(36).substring(2, 9)}`,
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
      storedNotifs.forEach(n => {
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
      await fetch('/api/sync', {
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
    } catch (err) {
      console.warn('Network sync failed, persisted locally:', err);
    }

    return notification;
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
}

export const realtimeSync = new RealtimeSyncManager();
