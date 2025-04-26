require('dotenv').config();
const cron = require('cron');
const Database = require('better-sqlite3');
const alpaca = require('../services/alpaca').default;
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const db = new Database(process.env.DB_FILE || './ai_invest.db');
const all = (sql, params=[]) => db.prepare(sql).all(params);
const run = (sql, params=[]) => db.prepare(sql).run(params);

// Runs 5 days +1hr after deposit window
new cron.CronJob('30 * * * *', async () => {
  const rows = all(
    'SELECT d.user_id, d.amount AS principal, u.stripe_account_id FROM deposits d JOIN users u ON u.id=u.user_id WHERE d.created_at <= datetime(CURRENT_TIMESTAMP, \'-5 days\')'
  );
  for (const { user_id, principal, stripe_account_id } of rows) {
    try {
      const positions = await alpaca.getPositions();
      for (const pos of positions) await alpaca.createOrder({ symbol:pos.symbol, qty:pos.qty, side:'sell', type:'market', time_in_force:'day' });
      const account = await alpaca.getAccount();
      const pnl = parseFloat(account.equity) - parseFloat(account.last_equity);
      const fee = pnl>0 ? pnl*0.10 : 0;
      const net = principal + pnl - fee;
      run('BEGIN');
      run('UPDATE wallets SET balance = balance + ? WHERE user_id = ?', [net, user_id]);
      run('INSERT INTO transactions(user_id,type,amount) VALUES(?,?,?)', [user_id,'payout',net]);
      run('INSERT INTO transactions(user_id,type,amount) VALUES(?,?,?)', [user_id,'fee',fee]);
      run('COMMIT');
      if (stripe_account_id && net>0) await stripe.transfers.create({ amount:Math.round(net*100), currency:'eur', destination:stripe_account_id });
      if (fee>0) await stripe.payouts.create({ amount:Math.round(fee*100), currency:'eur' });
    } catch(e){ console.error(e); }
  }
}).start();
