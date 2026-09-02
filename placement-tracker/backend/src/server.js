require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const prisma = require('./db');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local development
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Mount application routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/drives', require('./routes/drives.routes'));
app.use('/api/applications', require('./routes/applications.routes'));
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/api/companies', require('./routes/companies.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/assistant', require('./routes/assistant.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Placement Tracker backend listening on port ${PORT}`);
  });
}

module.exports = app;
