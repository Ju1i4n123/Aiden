import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function getTopSignals(limit = 5) {
  const url = 'https://api.finbrain.tech/v0/forecast/top';
  const { data } = await axios.get(url, {
    params: { limit },
    headers: { 'api-key': process.env.FINBRAIN_KEY }
  });
  const total = data.reduce((s, r) => s + r.signal, 0);
  return data.map(r => ({ symbol: r.ticker, weight: r.signal / total }));
}