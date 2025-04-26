import express from 'express';
import dotenv from 'dotenv';

import checkout from './routes/checkout.js';
import users from './routes/users.js';
import success from './routes/success.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use(checkout);
app.use(users);
app.use(success);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));