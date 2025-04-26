import { Router } from 'express';
import { stripe } from '../services/stripe.js';
import { run, get } from '../db.js';

const router = Router();

router.get('/success', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).send('missing session_id');

  const dup = get('SELECT 1 FROM stripe_sessions WHERE id = ?', [session_id]);
  if (dup) return res.send('Payment already processed.');

  try {
  const session = await stripe.checkout.sessions.retrieve(session_id.trim());
  if (session.payment_status !== 'paid') return res.status(400).send('payment incomplete');

  const custId = session.customer;
  const amount = session.amount_total / 100;
  const user   = get('SELECT id FROM users WHERE stripe_customer_id = ?', [custId]);
  if (!user)   return res.status(404).send('user not found');

  run('BEGIN');
  // … Inserts …
  run('COMMIT');
  res.send('Deposit recorded ✔');
} catch (err) {
  console.error(err);
  try { run('ROLLBACK'); } catch {}
  res.status(500).send('server error');
}

});

export default router;