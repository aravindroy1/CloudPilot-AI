const express = require('express');
const jwt = require('jsonwebtoken');
const { CosmosClient } = require('@azure/cosmos');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret';
const COSMOS_CONN_STR = process.env.COSMOS_DB_CONN_STR;

let container;

async function initDB() {
    try {
        if (!COSMOS_CONN_STR) {
            console.warn("WARNING: COSMOS_DB_CONN_STR is missing. Authentication will fail.");
            return;
        }
        
        // Suppress unauthorized TLS errors if using the local Cosmos DB Emulator
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        const client = new CosmosClient(COSMOS_CONN_STR);
        const { database } = await client.databases.createIfNotExists({ id: "CloudPilotDB" });
        const { container: dbContainer } = await database.containers.createIfNotExists({
            id: "users",
            partitionKey: "/email"
        });
        container = dbContainer;
        console.log("Successfully connected to Azure Cosmos DB");
    } catch (err) {
        console.error("Failed to connect to Cosmos DB:", err);
    }
}
initDB();

app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
        return res.status(400).json({ error: "Missing registration details" });
    }

    try {
        // Check if user exists
        const { resources } = await container.items
            .query({ query: "SELECT * from c WHERE c.email = @email", parameters: [{ name: "@email", value: email }] })
            .fetchAll();

        if (resources.length > 0) {
            return res.status(409).json({ error: "Account with this email already exists" });
        }

        // Hash password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: email, // use email as ID for simplicity
            email: email,
            name: name,
            passwordHash: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        };

        await container.items.create(newUser);

        const token = jwt.sign({ email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, message: "Account created securely in Azure Cosmos DB." });

    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ error: "Internal database error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Missing credentials" });
    }

    try {
        // Find user
        const { resources } = await container.items
            .query({ query: "SELECT * from c WHERE c.email = @email", parameters: [{ name: "@email", value: email }] })
            .fetchAll();

        if (resources.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = resources[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, message: "Successfully authenticated via Azure Cosmos DB." });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal database error" });
    }
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
    console.log(`Production Auth Service listening on port ${PORT}`);
});
