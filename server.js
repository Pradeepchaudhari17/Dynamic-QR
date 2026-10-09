const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname)));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- AUTH ROUTES ---
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'creator' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Email address already registered' });
  }

  const id = 'user_' + Math.random().toString(36).substring(2, 11);
  const hash = bcrypt.hashSync(password, 10);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const avatarBg = 'linear-gradient(135deg, #6366F1, #06B6D4)';
  const now = Date.now();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, plan_name, avatar_bg, initials, badge_text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email.toLowerCase(), hash, role, role === 'pro' ? 'Pro Studio Plan' : 'Free Tier', avatarBg, initials, role.toUpperCase(), now);

  const user = { id, name, email: email.toLowerCase(), role, initials, avatarBg, badgeText: role.toUpperCase(), planName: role === 'pro' ? 'Pro Studio Plan' : 'Free Tier' };
  console.log(`[SQLite] Registered user: ${email}`);
  res.status(201).json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planName: user.plan_name,
    avatarBg: user.avatar_bg,
    initials: user.initials,
    badgeText: user.badge_text
  };
  console.log(`[SQLite] Logged in user: ${email}`);
  res.json({ user: safeUser });
});

app.put('/api/auth/profile', (req, res) => {
  const { id, name, avatarBg } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID is required' });

  const initials = name ? name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase() : null;

  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        avatar_bg = COALESCE(?, avatar_bg),
        initials = COALESCE(?, initials)
    WHERE id = ?
  `).run(name, avatarBg, initials, id);

  const updated = db.prepare('SELECT id, name, email, role, plan_name, avatar_bg, initials, badge_text FROM users WHERE id = ?').get(id);
  res.json({ user: updated });
});

app.put('/api/auth/password', (req, res) => {
  const { id, oldPassword, newPassword } = req.body;
  if (!id || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'All password fields are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user || !bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, id);
  res.json({ success: true });
});

// --- QR VAULT ROUTES ---
app.get('/api/qrs', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT q.*, 
        COUNT(s.id) AS scanCount,
        COUNT(DISTINCT s.location) AS uniqueScanners
      FROM qr_items q
      LEFT JOIN scan_logs s ON q.id = s.qr_id
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `).all();
    console.log(`[SQLite] Returning ${items.length} saved QR(s).`);
    res.json(items);
  } catch (err) {
    console.error('[SQLite Error] GET /api/qrs:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/qrs', (req, res) => {
  try {
    const { id, userId, title, type, payload, isDynamic } = req.body;
    if (!id || !title || !type || !payload) {
      return res.status(400).json({ error: 'Missing required QR parameters' });
    }

    const upsert = db.prepare(`
      INSERT INTO qr_items (id, user_id, title, type, payload, is_dynamic, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        type = excluded.type,
        payload = excluded.payload,
        is_dynamic = excluded.is_dynamic
    `);

    upsert.run(id, userId || null, title, type, payload, isDynamic ? 1 : 0, Date.now());
    console.log(`>>> [SUCCESS] Saved to omniqr.db: "${title}" (ID: ${id})`);
    res.status(200).json({ success: true, id });
  } catch (err) {
    console.error('>>> [FAILED] Could not insert into omniqr.db:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/qrs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM qr_items WHERE id = ?').run(req.params.id);
    console.log(`[SQLite] Deleted QR ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SCAN TELEMETRY ROUTES ---
app.post('/api/scans', (req, res) => {
  try {
    const { qrId, device, os, browser, location } = req.body;
    const now = Date.now();
    const scanId = 'log_' + Math.random().toString(36).substring(2, 9);

    db.prepare(`
      INSERT INTO scan_logs (id, qr_id, timestamp, device, os, browser, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(scanId, qrId, now, device || 'Mobile', os || 'Unknown', browser || 'Browser', location || 'Unknown');

    db.prepare('UPDATE qr_items SET last_scanned = ? WHERE id = ?').run(now, qrId);
    console.log(`[SQLite] Recorded scan for QR: ${qrId}`);
    res.status(201).json({ success: true, scanId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics', (req, res) => {
  try {
    const { qrId } = req.query;
    const query = qrId && qrId !== 'all'
      ? 'SELECT s.*, q.title as qrTitle, q.type as qrType FROM scan_logs s JOIN qr_items q ON s.qr_id = q.id WHERE s.qr_id = ? ORDER BY s.timestamp DESC LIMIT 150'
      : 'SELECT s.*, q.title as qrTitle, q.type as qrType FROM scan_logs s JOIN qr_items q ON s.qr_id = q.id ORDER BY s.timestamp DESC LIMIT 150';

    const logs = qrId && qrId !== 'all' ? db.prepare(query).all(qrId) : db.prepare(query).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic redirect
// server.js - Dynamic Gateway Handler
app.get('/r/:id', (req, res) => {
  try {
    const qrId = req.params.id;
    let qr = db.prepare('SELECT * FROM qr_items WHERE id = ?').get(qrId);

    // 1. If scanned before manual save, create a draft entry on the fly
    if (!qr) {
      db.prepare(`
        INSERT INTO qr_items (id, title, type, payload, is_dynamic, created_at, last_scanned)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(qrId, 'Campaign ' + qrId, 'url', 'https://google.com', 1, Date.now(), Date.now());

      qr = db.prepare('SELECT * FROM qr_items WHERE id = ?').get(qrId);
    }

    // 2. Telemetry extraction from the scanning device
    const ua = req.headers['user-agent'] || '';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);
    const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

    let os = 'Unknown OS';
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser Scanner';
    if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
    else if (/Edg/i.test(ua)) browser = 'Edge';

    const scanId = 'log_' + Math.random().toString(36).substring(2, 9);
    
    // 3. Log scan event to SQLite
    db.prepare(`
      INSERT INTO scan_logs (id, qr_id, timestamp, device, os, browser, location, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(scanId, qr.id, Date.now(), device, os, browser, 'Direct Network Scan', 'Verified Scan');

    db.prepare('UPDATE qr_items SET last_scanned = ? WHERE id = ?').run(Date.now(), qr.id);
    console.log(`[SQLite Gateway] Recorded scan for "${qr.title}" (${qr.id}) from ${device} (${os}) -> ${qr.payload}`);

    // 4. Redirect
    let target = qr.payload.trim();
    if (/^https?:\/\//i.test(target)) {
      return res.redirect(target);
    } else {
      // If payload is plain text, vcard, or non-URL, send to app gateway viewer
      return res.redirect(`/#/scan?id=${qr.id}`);
    }
  } catch (err) {
    console.error('[Gateway Error]:', err.message);
    res.redirect('/');
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});