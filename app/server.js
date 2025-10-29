// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const APP_POOL = process.env.APP_POOL || 'default';
const RELEASE_ID = process.env.RELEASE_ID || 'local-test-v1';

// --- Chaos State ---
let chaosMode = null; // 'error' or 'timeout'

// Middleware to parse POST bodies
app.use(bodyParser.json());

// --- Chaos Middleware (Injects Downtime) ---
app.use((req, res, next) => {
    if (chaosMode) {
        if (chaosMode === 'error') {
            console.log(`[CHAOS] Serving 500 error for ${req.path}`);
            return res.status(500).send('Simulated 500 Internal Server Error (Chaos Mode)');
        }
        if (chaosMode === 'timeout') {
            console.log(`[CHAOS] Simulating 15-second timeout for ${req.path}`);
            // Nginx will likely detect this as a timeout error after 1-2 seconds
            return setTimeout(() => res.status(200).send('Timeout finished.'), 15000);
        }
    }
    next();
});

// --- Endpoints ---

// 1. GET /version (Returns required headers and data)
app.get('/version', (req, res) => {
    console.log(`[INFO] Serving /version from pool: ${APP_POOL}`);
    res.setHeader('X-App-Pool', APP_POOL);
    res.setHeader('X-Release-Id', RELEASE_ID);
    res.json({
        pool: APP_POOL,
        release: RELEASE_ID,
        message: 'Service is running normally.'
    });
});

// 2. GET /healthz (Liveness check)
app.get('/healthz', (req, res) => {
    if (chaosMode) {
        // Health check remains 200 even if the app is serving chaos
        // Failover relies on 5xx/timeout failures on /version
        return res.status(200).send('OK (Chaos Active)');
    }
    res.status(200).send('OK');
});

// 3. POST /chaos/start
app.post('/chaos/start', (req, res) => {
    const mode = req.query.mode;
    if (mode === 'error' || mode === 'timeout') {
        chaosMode = mode;
        console.warn(`!!! CHAOS STARTED: Mode set to ${chaosMode} !!!`);
        return res.status(200).send(`Chaos mode set to: ${chaosMode}`);
    }
    res.status(400).send('Invalid chaos mode. Use ?mode=error or ?mode=timeout.');
});

// 4. POST /chaos/stop
app.post('/chaos/stop', (req, res) => {
    chaosMode = null;
    console.warn('--- CHAOS STOPPED ---');
    res.status(200).send('Chaos mode stopped.');
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`App running on port ${PORT} as Pool: ${APP_POOL} (Release: ${RELEASE_ID})`);
});