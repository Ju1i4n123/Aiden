import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database(process.env.DB_FILE || './ai_invest.db');
db.pragma('foreign_keys = ON');

export const run = (sql, params = []) => db.prepare(sql).run(params);
export const get = (sql, params = []) => db.prepare(sql).get(params);
export const all = (sql, params = []) => db.prepare(sql).all(params);
export default db;