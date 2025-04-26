import Alpaca from '@alpacahq/alpaca-trade-api';
import dotenv from 'dotenv';

dotenv.config();

const usePaper = process.env.PAPER === 'true';
export default new Alpaca({
  keyId: usePaper ? process.env.ALPACA_PAPER_KEY_ID : process.env.ALPACA_KEY_ID,
  secretKey: usePaper ? process.env.ALPACA_PAPER_SECRET_KEY : process.env.ALPACA_SECRET_KEY,
  paper: usePaper,
  baseUrl: usePaper ? process.env.ALPACA_PAPER_BASE_URL : process.env.ALPACA_BASE_URL
});