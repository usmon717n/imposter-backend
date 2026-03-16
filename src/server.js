'use strict';

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// ─── SECURITY ─────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ─────────────────────────────────────────────────
const rawOrigins = process.env.CLIENT_URL || '';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin)                                      return cb(null, true); // curl/postman
    if (allowedOrigins.length === 0)                 return cb(null, true); // dev: allow all
    if (allowedOrigins.includes(origin))             return cb(null, true);
    if (origin.endsWith('.vercel.app'))              return cb(null, true); // Vercel previews
    if (origin.endsWith('.railway.app'))             return cb(null, true);
    console.warn('[CORS blocked]', origin);
    cb(new Error('CORS blocked: ' + origin));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── LOGGING & PARSING ────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── STATIC ───────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d', etag: true,
}));

// ─── RATE LIMITING ────────────────────────────────────────
app.use('/api/',      rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/', rateLimit({ windowMs: 15*60*1000, max: 30,  standardHeaders: true, legacyHeaders: false }));

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/services',  require('./routes/service.routes'));
app.use('/api/orders',    require('./routes/order.routes'));
app.use('/api/portfolio', require('./routes/portfolio.routes'));
app.use('/api/reviews',   require('./routes/review.routes'));
app.use('/api/contact',   require('./routes/contact.routes'));
app.use('/api/admin',     require('./routes/admin.routes'));
app.use('/api/upload',    require('./routes/upload.routes'));

// ─── HEALTH ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  success:   true,
  message:   'MarryMe API 💍',
  env:       process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

// ─── 404 ──────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── ERROR HANDLER ────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── START ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀  MarryMe API  →  http://0.0.0.0:${PORT}`);
  console.log(`📊  NODE_ENV    :  ${process.env.NODE_ENV}`);
  console.log(`🌐  CORS        :  ${allowedOrigins.length ? allowedOrigins.join(', ') : '*.vercel.app'}\n`);
});

module.exports = app;
