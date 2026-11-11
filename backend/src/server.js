
require('dotenv').config();

const express = require('express');

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok'
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Server
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
});
