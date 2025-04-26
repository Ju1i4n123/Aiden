require('dotenv').config();
const { CronJob } = require('cron');
const Database    = require('better-sqlite3');
const axios       = require('axios');
const alpaca      = require('../services/alpaca').default;

// SQLite helpers
const db  = new Database(process.env.DB_FILE || './ai_invest.db');
const all = (q,p=[]) => db.prepare(q).all(p);
const run = (q,p=[]) => db.prepare(q).run(p);

// -------- Finbrain fetch (v1 daily, full list) ------------------------------
const FB_URL = `https://api.finbrain.tech/v1/market/${encodeURIComponent('S&P 500')}/predictions/daily?token=${process.env.FINBRAIN_KEY}`;
async function fetchPredictions(maxRetries = 5) {
  let err;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const { data } = await axios.get(FB_URL, {
        timeout: 60000,
        headers: { 'Accept-Encoding': 'gzip' }
      });
      console.log(`Finbrain OK (attempt ${i}) – rows ${data.length}`);
      return data;
    } catch (e) {
      err = e;
      console.warn(`Finbrain attempt ${i} failed: ${e.message}`);
      await new Promise(r => setTimeout(r, i * 3000));
    }
  }
  throw new Error(`Finbrain unreachable: ${err.message}`);
}

// -------- Allocation helper --------------------------------------------------
function allocateFixed(preds, principal, topN = 5) {
  const list = preds
    .map(r => ({ ticker: r.ticker, score: parseFloat(r.prediction.expectedMid) }))
    .filter(x => !isNaN(x.score))
    .sort((a,b) => b.score - a.score)
    .slice(0, topN);
  const sum = list.reduce((s,x) => s + x.score, 0);
  return list.map(x => ({ symbol: x.ticker, amount: +(principal * x.score / sum).toFixed(2) }));
}

// -------- Invest single deposit ---------------------------------------------
async function invest(dep) {
  const preds = await fetchPredictions();
  const alloc = allocateFixed(preds, dep.principal);
  for (const a of alloc) {
    if (a.amount <= 0) continue;
    const trade = await alpaca.getLatestTradeV2(a.symbol);
    const price = trade.Price;
    const qty   = Math.floor((a.amount / price) * 100) / 100;
    if (qty > 0) {
      await alpaca.createOrder({ symbol: a.symbol, qty, side:'buy', type:'market', time_in_force:'day' });
      console.log(`Bought ${qty} ${a.symbol} @ ${price} for deposit #${dep.id}`);
    }
  }
  run('UPDATE deposits SET invested = 1, invested_at = CURRENT_TIMESTAMP WHERE id = ?', [dep.id]);
}

// -------- Cron every 1 min ---------------------------------------------------
new CronJob('* * * * *', async () => {
  const t = Date.now();
  const from = new Date(t - 5*24*60*60*1000 - 30*60*1000).toISOString();
  const to   = new Date(t - 5*24*60*60*1000 + 30*60*1000).toISOString();
  const deps = all('SELECT id, user_id, principal FROM deposits WHERE invested = 0 AND created_at BETWEEN ? AND ?', [from,to]);
  for (const d of deps) {
    try { await invest(d); } catch(e){ console.error(`Invest #${d.id} failed:`, e.message);} }
}).start();