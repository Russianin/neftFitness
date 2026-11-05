const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./db');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ТЕПЕРЬ СЕРВЕР БЕРЕТ ФАЙЛЫ ИЗ СВОЕЙ ЖЕ ПАПКИ (ГДЕ ЛЕЖИТ index.html)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const auth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Неверный токен' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ только для админа' });
    next();
};

app.post('/api/register', async (req, res) => {
    const { name, phone, email, password, category } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, phone, email, password_hash, category) VALUES (?, ?, ?, ?, ?)', 
            [name, phone, email, hash, category]);
        res.status(201).json({ message: 'Успешно' });
    } catch (err) {
        res.status(400).json({ error: 'Телефон или Email уже заняты' });
    }
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
        if (rows.length === 0) return res.status(400).json({ error: 'Пользователь не найден' });
        
        const user = rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: 'Неверный пароль' });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
        res.json({ id: user.id, name: user.name, role: user.role, category: user.category });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Выход выполнен' });
});

app.get('/api/me', auth, async (req, res) => {
    const [rows] = await db.query('SELECT id, name, phone, email, role, category FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
});

app.get('/api/memberships', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM memberships');
    const data = rows.map(m => ({ 
        ...m, 
        allowed_categories: typeof m.allowed_categories === 'string' ? JSON.parse(m.allowed_categories) : m.allowed_categories, 
        features: typeof m.features === 'string' ? JSON.parse(m.features) : m.features 
    }));
    res.json(data);
});

app.get('/api/discounts', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM discounts');
    res.json(rows);
});

app.get('/api/reviews', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM reviews ORDER BY date DESC');
    res.json(rows);
});

app.post('/api/purchases', auth, async (req, res) => {
    const { membershipId, price } = req.body;
    const expiresAt = new Date();
    if (membershipId === 6) expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    await db.query('INSERT INTO purchases (user_id, membership_id, price, expires_at) VALUES (?, ?, ?, ?)', 
        [req.user.id, membershipId, price, expiresAt]);
    res.status(201).json({ message: 'Успешно' });
});

app.get('/api/my-purchases', auth, async (req, res) => {
    const [rows] = await db.query('SELECT p.*, m.title FROM purchases p JOIN memberships m ON p.membership_id = m.id WHERE p.user_id = ?', [req.user.id]);
    res.json(rows);
});

app.post('/api/reviews', auth, async (req, res) => {
    const { rating, text } = req.body;
    await db.query('INSERT INTO reviews (user_id, author, rating, text) VALUES (?, ?, ?, ?)', 
        [req.user.id, req.user.name, rating, text]);
    res.status(201).json({ message: 'Успешно' });
});

app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
    const [rows] = await db.query('SELECT id, name, phone, role, category FROM users');
    res.json(rows);
});

app.put('/api/admin/users/:id/role', auth, adminOnly, async (req, res) => {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [req.body.role, req.params.id]);
    res.json({ message: 'Роль обновлена' });
});

app.get('/api/admin/purchases', auth, adminOnly, async (req, res) => {
    const [rows] = await db.query(`
        SELECT p.*, u.name as user_name, m.title as membership_title 
        FROM purchases p 
        JOIN users u ON p.user_id = u.id 
        JOIN memberships m ON p.membership_id = m.id
    `);
    res.json(rows);
});

app.delete('/api/admin/purchases/:id', auth, adminOnly, async (req, res) => {
    await db.query('DELETE FROM purchases WHERE id = ?', [req.params.id]);
    res.json({ message: 'Покупка удалена' });
});

app.delete('/api/admin/reviews/:id', auth, adminOnly, async (req, res) => {
    await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Отзыв удален' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));