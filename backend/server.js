const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const stockRoutes = require('./routes/stock');
const valuationRoutes = require('./routes/valuation');
const marketRoutes = require('./routes/market');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const corsOptions = {
  origin: [
    'https://ainoesis.org',
    'https://www.ainoesis.org',
    'https://noesis-livid.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('/(.*)', cors(corsOptions)); // ✅ תיקון סינטקס preflight

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use('/api/stock', stockRoutes);
app.use('/api/valuation', valuationRoutes);
app.use('/api/market', marketRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
