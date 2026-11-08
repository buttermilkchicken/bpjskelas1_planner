
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// SIGNUP
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
        return res.status(400).json({
            message: 'Username, email and password are required'
        });
    }

    if (typeof username !== 'string' ||
        username.trim().length < 3 ||
        username.trim().length > 50) {
        return res.status(400).json({
            message: 'Username must be 3-50 characters'
        });
    }

    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
        return res.status(400).json({
            message: 'Email format is not valid'
        });
    }

    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
            message: 'Password must be at least 6 characters'
        });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        // Simpan user ke database MySQL
        const [result] = await pool.execute(
            `INSERT INTO users (username, email, password_hash)
             VALUES (?, ?, ?)`,
            [
                username.trim(),
                email.trim().toLowerCase(),
                hash
            ]
        );

        // Ambil data user yang baru dibuat
        const [rows] = await pool.execute(
            `SELECT id, username, email
             FROM users
             WHERE id = ?`,
            [result.insertId]
        );

        const user = rows[0];

        res.status(201).json({
            token: createToken(user),
            user: user
        });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Username or email is already registered'
            });
        }

        throw err;
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required'
        });
    }

    const [rows] = await pool.execute(
        `SELECT id, username, email, password_hash
         FROM users
         WHERE email = ?`,
        [email.trim().toLowerCase()]
    );

    const user = rows[0];

    const valid = user &&
        (await bcrypt.compare(password, user.password_hash));

    if (!valid) {
        return res.status(401).json({
            message: 'Wrong email or password'
        });
    }

    res.json({
        token: createToken(user),
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    });
});

// GET USER LOGIN
router.get('/me', requireAuth, (req, res) => {
    res.json({
        user: req.user
    });
});

module.exports = router;
