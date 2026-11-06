require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// API
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Frontend
const frontendPath = path.join(
    __dirname,
    '../../frontend/public'
);

app.use(express.static(frontendPath));

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
});
