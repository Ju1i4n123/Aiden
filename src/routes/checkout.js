import { Router } from 'express';
import { get } from '../db.js';
import { stripe } from '../services/stripe.js';

const router = Router();

router.post('/checkout', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'userId & positive amount required' });
  }
  const user = get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return res.status(404).json({ error: 'user not found' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Wallet Top-Up' },
          unit_amount: Math.round(amount * 100)
        },
        quantity: 1
      }],
      customer: user.stripe_customer_id,
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL
    });
    return res.json({ sessionId: session.id, url: session.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'stripe' });
  }
});

export default router;