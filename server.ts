import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory DB structure with default fallback
interface DatabaseSchema {
  madrasah_students?: any[];
  madrasah_teachers?: any[];
  madrasah_attendance?: any[];
  madrasah_payments?: any[];
  madrasah_schedules?: any[];
  madrasah_notices?: any[];
  madrasah_sms_logs?: any[];
  madrasah_exam_marks?: any[];
  madrasah_class_subjects?: any;
  madrasah_grading_rules?: any[];
  madrasah_books?: any[];
  madrasah_borrow_records?: any[];
  madrasah_hostel_records?: any[];
  madrasah_donations?: any[];
  madrasah_expenses?: any[];
  madrasah_inventory?: any[];
  madrasah_profile_name?: string;
  madrasah_profile_slogan?: string;
  madrasah_admin_name?: string;
  madrasah_admin_title?: string;
  madrasah_admin_password?: string;
  notifications?: any[];
  lastUpdated?: string;
}

let db: DatabaseSchema = {
  madrasah_admin_password: 'admin123',
  notifications: [],
  lastUpdated: new Date().toISOString()
};

// Load existing database if available
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = { ...db, ...JSON.parse(raw) };
    if (!db.madrasah_admin_password) {
      db.madrasah_admin_password = 'admin123';
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
}

// Save DB helper
function persistDB() {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

// SSE Clients for real-time live push to all open devices
interface SSEClient {
  id: string;
  res: Response;
}

let sseClients: SSEClient[] = [];

function broadcastToClients(eventData: any) {
  const payloadString = `data: ${JSON.stringify(eventData)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payloadString);
    } catch (err) {
      // client disconnected
    }
  });
}

// Keep-alive ping for SSE connections every 20 seconds
setInterval(() => {
  sseClients.forEach(client => {
    try {
      client.res.write(': ping\n\n');
    } catch (e) {
      // ignore
    }
  });
}, 20000);

// API: Get Full Data
app.get('/api/data', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: db,
    lastUpdated: db.lastUpdated,
    serverTime: new Date().toISOString()
  });
});

// API: Real-Time SSE Stream for all devices
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial welcome & connection confirmation
  res.write(`data: ${JSON.stringify({
    type: 'CONNECTED',
    clientId,
    lastUpdated: db.lastUpdated,
    notifications: (db.notifications || []).slice(-20)
  })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// API: Real-Time Sync Action & Broadcast across all devices
app.post('/api/sync', (req: Request, res: Response) => {
  const { key, data, action, senderDeviceId, senderName } = req.body;

  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' });
  }

  // Update in DB
  (db as any)[key] = data;

  // Prepare notification item
  const notificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title: action?.title || 'তথ্য হালনাগাদ',
    message: action?.message || `${key} এ পরিবর্তন সম্পন্ন হয়েছে`,
    module: action?.module || 'general',
    type: action?.type || 'update',
    timestamp: new Date().toISOString(),
    senderDeviceId: senderDeviceId || 'unknown',
    senderName: senderName || 'প্রধান ডিভাইস',
    isRead: false
  };

  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }

  // Prepend and keep latest 100 notifications
  db.notifications.unshift(notificationItem);
  if (db.notifications.length > 100) {
    db.notifications = db.notifications.slice(0, 100);
  }

  persistDB();

  // Broadcast to all other devices & tabs!
  broadcastToClients({
    type: 'DATA_SYNC',
    key,
    data,
    notification: notificationItem,
    senderDeviceId,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    notification: notificationItem,
    lastUpdated: db.lastUpdated
  });
});

// API: Verify Owner Password
app.post('/api/verify-password', (req: Request, res: Response) => {
  const { password } = req.body;
  const currentPassword = db.madrasah_admin_password || 'admin123';

  if (password === currentPassword) {
    return res.json({ success: true, valid: true });
  }

  return res.json({
    success: false,
    valid: false,
    error: 'পাসওয়ার্ড সঠিক নয়! শুধুমাত্র মাদরাসার মালিক/মুহতামিম এই পরিবর্তন চূড়ান্ত করতে পারবেন।'
  });
});

// API: Change Owner Password
app.post('/api/change-password', (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const existingPassword = db.madrasah_admin_password || 'admin123';

  if (currentPassword !== existingPassword) {
    return res.status(400).json({
      success: false,
      error: 'বর্তমান পাসওয়ার্ড সঠিক নয়!'
    });
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({
      success: false,
      error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে!'
    });
  }

  db.madrasah_admin_password = newPassword.trim();
  persistDB();

  // Broadcast password update notice
  broadcastToClients({
    type: 'SECURITY_UPDATE',
    message: 'মালিকের পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে',
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'মালিকের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।'
  });
});

// API: Clear Notifications
app.post('/api/notifications/clear', (_req: Request, res: Response) => {
  db.notifications = [];
  persistDB();
  broadcastToClients({
    type: 'NOTIFICATIONS_CLEARED',
    timestamp: new Date().toISOString()
  });
  res.json({ success: true });
});

// Start Server & mount Vite / static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Madrasah Management System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
