const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret';

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // In a real scenario, this connects to Cosmos DB to verify credentials
    if (email && password) {
        const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token, message: "Successfully logged in." });
    }
    
    return res.status(401).json({ error: "Invalid credentials" });
});

app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    
    // In a real scenario, this connects to Cosmos DB to create a new user account
    if (email && password) {
        const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token, message: "Account created successfully." });
    }
    
    return res.status(400).json({ error: "Invalid registration details" });
});

app.get('/api/auth/verify', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: "No token provided" });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (err) {
        res.status(401).json({ valid: false, error: "Invalid token" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth Service listening on port ${PORT}`);
});
