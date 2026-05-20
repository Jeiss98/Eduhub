// app.js
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const apiRoutes    = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4200',        // Angular dev server
  'http://127.0.0.1:4200',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'EduHub API funcionando correctamente (MongoDB Only)',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Rutas API ────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada.` });
});

// ── Error global ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;