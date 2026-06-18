const express = require('express');

const app = express();
app.use(express.json());

app.post('/api/monitor/log', (req, res) => {
    const { event, details } = req.body;
    // Save to Cosmos DB audit_logs collection
    console.log(`[AUDIT] ${event}: ${JSON.stringify(details)}`);
    res.json({ success: true });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Monitoring Service listening on port ${PORT}`);
});
