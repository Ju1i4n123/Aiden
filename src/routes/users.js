import { Router } from 'express';
import crypto from 'crypto';
import { run } from '../db.js';
import { stripe } from '../services/stripe.js';

const router = Router();

router.post('/users', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const customer = await stripe.customers.create({ email });
    const userId = crypto.randomUUID();
    run('INSERT INTO users(id,email,stripe_customer_id) VALUES(?,?,?)', [userId, email, customer.id]);
    run('INSERT INTO wallets(user_id) VALUES(?)', [userId]);
    return res.json({ userId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server' });
  }
});

export default router;