
const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Format keluaran tetap sama: date "YYYY-MM-DD", time "HH:MM"
const COLUMNS = `
    id,
    DATE_FORMAT(task_date, '%Y-%m-%d') AS date,
    DATE_FORMAT(task_time, '%H:%i') AS time,
    title,
    description
`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function duplicateError(res, time) {
    return res.status(409).json({
        message: `A task already exists at ${time}. Please input a different time.`
    });
}

// GET semua task milik user yang sedang login
router.get('/', async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT ${COLUMNS}
         FROM tasks
         WHERE user_id = ?
         ORDER BY task_date, task_time`,
        [req.user.id]
    );

    res.json(rows);
});

// POST tambah task
router.post('/', async (req, res) => {
    const { date, time, title, description = '' } = req.body || {};

    if (!title || !title.trim() || !time) {
        return res.status(400).json({
            message: 'Input cannot be empty.'
        });
    }

    if (!DATE_RE.test(date || '') || !TIME_RE.test(time)) {
        return res.status(400).json({
            message: 'Date or time format is not valid'
        });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO tasks
             (user_id, task_date, task_time, title, description)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.id,
                date,
                time,
                title.trim(),
                description
            ]
        );

        // Ambil kembali task yang baru ditambahkan
        const [rows] = await pool.execute(
            `SELECT ${COLUMNS}
             FROM tasks
             WHERE id = ? AND user_id = ?`,
            [result.insertId, req.user.id]
        );

        res.status(201).json(rows[0]);

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return duplicateError(res, time);
        }

        throw err;
    }
});

// PUT edit task
router.put('/:id', async (req, res) => {
    const { time, title, description = '' } = req.body || {};

    if (!title || !title.trim() || !time) {
        return res.status(400).json({
            message: 'Input cannot be empty.'
        });
    }

    if (!TIME_RE.test(time)) {
        return res.status(400).json({
            message: 'Time format is not valid'
        });
    }

    try {
        const [result] = await pool.execute(
            `UPDATE tasks
             SET title = ?, description = ?, task_time = ?
             WHERE id = ? AND user_id = ?`,
            [
                title.trim(),
                description,
                time,
                req.params.id,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Task not found'
            });
        }

        // Ambil kembali task setelah berhasil diedit
        const [rows] = await pool.execute(
            `SELECT ${COLUMNS}
             FROM tasks
             WHERE id = ? AND user_id = ?`,
            [req.params.id, req.user.id]
        );

        res.json(rows[0]);

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return duplicateError(res, time);
        }

        throw err;
    }
});

// DELETE hapus task
router.delete('/:id', async (req, res) => {
    const [result] = await pool.execute(
        `DELETE FROM tasks
         WHERE id = ? AND user_id = ?`,
        [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            message: 'Task not found'
        });
    }

    res.status(204).end();
});

module.exports = router;
