const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'omniqr.db');
const db = new Database(dbPath);

console.log('[SQLite] Connected to database at:', dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'creator',
    plan_name TEXT DEFAULT 'Free Tier',
    avatar_bg TEXT,
    initials TEXT,
    badge_text TEXT DEFAULT 'FREE',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS qr_items (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    is_dynamic INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_scanned INTEGER
  );

  CREATE TABLE IF NOT EXISTS scan_logs (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    device TEXT,
    os TEXT,
    browser TEXT,
    location TEXT,
    status TEXT DEFAULT 'Verified Scan'
  );

  CREATE INDEX IF NOT EXISTS idx_scan_qr ON scan_logs(qr_id);
  CREATE INDEX IF NOT EXISTS idx_scan_ts ON scan_logs(timestamp);
`);

// Pre-seed demo users
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, password_hash, role, plan_name, avatar_bg, initials, badge_text, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('user_pro_01', 'Alex Morgan', 'alex@omniqr.pro', bcrypt.hashSync('password123', 10), 'pro', 'Pro Studio Unlimited', 'linear-gradient(135deg, #6366F1, #06B6D4)', 'AM', 'PRO', Date.now());
insertUser.run('user_demo_02', 'Demo Creator', 'demo@omniqr.pro', bcrypt.hashSync('password123', 10), 'creator', 'Creator Free', 'linear-gradient(135deg, #10B981, #059669)', 'DC', 'FREE', Date.now());

module.exports = db;