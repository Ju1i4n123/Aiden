import 'dotenv/config';
import fs from 'fs';
import Database from 'better-sqlite3';

const db = new Database(process.env.DB_FILE || './ai_invest.db');
db.pragma('foreign_keys = ON');

const sql = fs.readFileSync('migrations.sql', 'utf8');
sql.split(';').forEach(stmt => {
  if (stmt.trim()) db.prepare(stmt).run();
});

console.log('✅ Migrations applied.');