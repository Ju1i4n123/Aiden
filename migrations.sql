PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance REAL DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- deposit | invest | payout | fee
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  principal REAL NOT NULL,            -- original deposit amount
  invested BOOLEAN DEFAULT 0,
  processed BOOLEAN DEFAULT 0,
  invested_at DATETIME,
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deposit_id INTEGER REFERENCES deposits(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  qty REAL NOT NULL
);

-- Guard: a Stripe checkout session can be consumed once
CREATE TABLE IF NOT EXISTS stripe_sessions (
  id TEXT PRIMARY KEY,
  deposit_id INTEGER
);