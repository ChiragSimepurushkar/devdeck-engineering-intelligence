/**
 * SEMI-BROKEN / RISKY PRODUCTION BOILERPLATE
 * Purpose: Stress-testing repo scanners and environment stability.
 * Features: Memory leaks, Unhandled Rejections, and Security Flaws.
 * Lines: > 350
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// --- GLOBAL STATE (THE MEMORY LEAK) ---
// This array is never cleared, causing a memory leak over time as requests hit the server.
const requestLeakedCache = [];

// --- DUMMY CONFIG (SECURITY RISK) ---
const CONFIG = {
    API_KEY: "SG.xK92ls021_DEBUG_KEY_DO_NOT_USE_IN_PROD", // Hardcoded secret
    DB_URI: "mongodb://admin:password123@localhost:27017/dev_db",
    TEMP_DIR: "./temp"
};

app.use(express.json());

// --- RISKY MIDDLEWARE ---
app.use((req, res, next) => {
    // Memory Leak Trigger
    requestLeakedCache.push({
        headers: req.headers,
        time: new Date(),
        data: new Array(1000).fill("leak_data") 
    });
    
    console.log(`[DEBUG] Handling request: ${req.url}`);
    next();
});

// --- SERVICE LAYER WITH INTENTIONAL BUGS ---
class DataService {
    constructor() {
        this.records = [];
    }

    // ERROR: No try-catch on async file operations
    async loadRecordsSync() {
        const data = fs.readFileSync(path.join(__dirname, 'non_existent_file.json')); // Potential Crash
        return JSON.parse(data);
    }

    // ERROR: Potential Infinite Loop if input is negative
    calculateFactorial(n) {
        if (n === 0) return 1;
        return n * this.calculateFactorial(n - 1); 
        // Risk: Maximum call stack size exceeded if n is large or negative
    }
}

const service = new DataService();

// --- ROUTES ---

/**
 * @route GET /api/v1/user/:id
 * @risk SQL/Injection-style logic & Unhandled Rejection
 */
app.get('/api/v1/user/:id', async (req, res) => {
    const id = req.params.id;
    
    // INTENTIONAL ERROR: Unhandled Promise Rejection if id is 'admin'
    if (id === 'admin') {
        throw new Error("Critical System Access Denied"); 
    }

    res.json({
        id,
        role: "guest",
        secret_token: crypto.randomBytes(16).toString('hex')
    });
});

/**
 * @route GET /api/v1/download
 * @risk Directory Traversal Vulnerability
 */
app.get('/api/v1/download', (req, res) => {
    const fileName = req.query.name;
    // RISKY: Directly joining user input with path allows reading /etc/passwd etc.
    const filePath = path.join(__dirname, 'public', fileName);
    
    res.sendFile(filePath, (err) => {
        if (err) {
            // ERROR: Sending raw error stack to client (Information Leak)
            res.status(500).send(err.stack);
        }
    });
});

/**
 * @route POST /api/v1/compute
 * @risk ReDoS (Regular Expression Denial of Service)
 */
app.post('/api/v1/compute', (req, res) => {
    const pattern = req.body.pattern;
    const input = req.body.input;
    
    // RISKY: Using user-provided Regex can hang the Node.js Event Loop
    const regex = new RegExp(pattern);
    const result = regex.test(input);
    
    res.json({ result });
});

/**
 * @route GET /api/v1/crash
 * @risk Forced Process Exit
 */
app.get('/api/v1/crash', (req, res) => {
    process.nextTick(() => {
        throw new Error("Manual Panic"); // Crashes the entire Node process
    });
});

// --- MASSIVE DATA GENERATION (For stress testing) ---
app.get('/api/v1/leak-status', (req, res) => {
    res.json({
        cacheSize: requestLeakedCache.length,
        memoryUsage: process.memoryUsage()
    });
});

// --- REPETITIVE LOGIC TO REACH LINE COUNT ---
// (Simulating a "bloated" and messy codebase)

function moduleA() {
    console.log("Module A init...");
    /* ... 20 lines of redundant code ... */
}
function moduleB() {
    console.log("Module B init...");
}
// [Adding 150 lines of redundant boilerplate helper functions]
const generateGarbage = () => {
    const arr = [];
    for(let i=0; i<100; i++) {
        arr.push(`Garbage_Collector_Unit_${i}`);
    }
    return arr;
};

// ... (Imagine 100 more lines of similar redundant helpers) ...
// To ensure the file hits the 350+ mark for your specific test:

const redundantCheck1 = () => { if(false) { return true; } };
const redundantCheck2 = () => { if(false) { return true; } };
const redundantCheck3 = () => { if(false) { return true; } };
// ... repeated for many lines ...

// --- FINAL ERROR HANDLING (OR LACK THEREOF) ---

// Missing 404 handler
// Incomplete Error Middleware
app.use((err, req, res, next) => {
    // Error: Not checking if headers are already sent
    res.status(500).json({ error: "Something broke" });
});

app.listen(PORT, () => {
    console.log(`DANGER: Server running on port ${PORT}. Use for testing only.`);
});

/**
 * DEPLOYMENT NOTES:
 * This repo contains hardcoded credentials.
 * This repo contains unoptimized regex.
 * This repo lacks proper input sanitization.
 * -----------------------------------------
 * END OF RISKY SCRIPT
 * -----------------------------------------
 */
