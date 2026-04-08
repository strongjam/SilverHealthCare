const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3005;
const JWT_SECRET = 'sugar-logos-secret-key-2024';

app.use(cors());
app.use(express.json());

// Database Initialization
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0
    )`);

    // Records table (Score and Ramen choice)
    db.run(`CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        student_id TEXT,
        score INTEGER,
        ramen_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(username) REFERENCES users(username)
    )`);

    // Migration: Add student_id to records if not exists
    db.run("ALTER TABLE records ADD COLUMN student_id TEXT", (err) => {
        // Ignore error if column already exists
        if (err) {
            if (err.message.includes("duplicate column name")) console.log("Migration: student_id already exists.");
            else console.error("Migration Error:", err.message);
        } else {
            console.log("Migration: student_id column added to records table.");
        }
    });

    // Seed/Update Admin User (manager / 1234)
    const adminUser = 'manager';
    const adminPass = '1234';
    // Use REPLACE to ensure old hashed passwords are overwritten with plaintext
    db.run("INSERT OR REPLACE INTO users (username, password, is_admin) VALUES (?, ?, ?)", [adminUser, adminPass, 1]);
    console.log("Admin account synchronized: manager / 1234");
});

// Middleware for JWT Verification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- API Endpoints ---

// Registration
app.post('/api/auth/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'ID와 비밀번호를 입력해주세요.' });

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err) => {
        if (err) return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
        res.json({ message: '회원가입 성공!' });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user || user.password !== password) {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
        const token = jwt.sign({ username: user.username, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username, isAdmin: user.is_admin });
    });
});

// Save Record (Score & Ramen)
app.post('/api/records', authenticateToken, (req, res) => {
    const { score, ramen_type, student_id } = req.body;
    const username = req.user.username;

    db.run("INSERT INTO records (username, student_id, score, ramen_type) VALUES (?, ?, ?, ?)", [username, student_id, score, ramen_type], (err) => {
        if (err) return res.status(500).json({ error: '기록 저장 실패' });
        res.json({ message: '기록이 저장되었습니다.' });
    });
});

// Admin: Get all records
app.get('/api/admin/records', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);

    const query = `
        SELECT r.*, u.is_admin 
        FROM records r 
        JOIN users u ON r.username = u.username 
        ORDER BY r.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: '기록 조회 실패' });
        res.json(rows);
    });
});

// Admin: Get user stats (Aggregate ramen counts)
app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);

    const query = `
        SELECT u.username, u.password, r.student_id, COUNT(r.id) as total_ramen, MAX(r.score) as high_score
        FROM users u
        LEFT JOIN records r ON u.username = r.username
        WHERE u.is_admin = 0
        GROUP BY u.username
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: '회원 조회 실패' });
        res.json(rows);
    });
});

// Admin: Delete User and their records
app.delete('/api/admin/users/:username', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);
    const { username } = req.params;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("DELETE FROM records WHERE username = ?", [username]);
        db.run("DELETE FROM users WHERE username = ? AND is_admin = 0", [username], function(err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: '삭제 실패' });
            }
            db.run("COMMIT");
            res.json({ message: '사용자 정보가 성공적으로 삭제되었습니다.' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Sugar Logos Backend running on http://localhost:${PORT}`);
});
