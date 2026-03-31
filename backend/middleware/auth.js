const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

<<<<<<< HEAD
=======
// Hardcoded JWT secret for simplicity
const JWT_SECRET = 'luminary_dev_secret_key_2024';

>>>>>>> b02e1a7 (updating luminary)
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

<<<<<<< HEAD
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
=======
        const decoded = jwt.verify(token, JWT_SECRET);
>>>>>>> b02e1a7 (updating luminary)

        const pool = getPool();
        const [users] = await pool.query('SELECT id, email, first_name, last_name, avatar_url, role FROM users WHERE id = ?', [decoded.id]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
