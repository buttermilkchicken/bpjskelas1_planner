const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not logged in' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.id, username: payload.username };
        next();
    } catch {
        res.status(401).json({ message: 'Session expired, please log in again' });
    }
};
