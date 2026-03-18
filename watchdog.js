const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

/**
 * 🐕 Watchdog.js v1.7 (Quantum-Mesh Guardian: Context Monitoring Edition)
 */

const BASE_DIR = 'C:\\Users\\Administrator\\.gemini';
const S_AG_DIR = path.join(BASE_DIR, 'S_AG');
const MEMORY_DIR = path.join(BASE_DIR, 'memory');
const VIZ_PATH = path.join(MEMORY_DIR, 'state', 'context-viz.json');
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function log(msg) {
    console.log(`[Watchdog] ${new Date().toISOString()} | ${msg}`);
}

function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return (stats.size / 1024).toFixed(1) + 'k';
    } catch (e) {
        return '0k';
    }
}

function updateContextViz() {
    log("Updating Context Visualization...");
    const usage = {
        memory_system: getFileSize(path.join(MEMORY_DIR, 'shared', 'MEMORY.md')),
        active_code: getFileSize(path.join(BASE_DIR, 'AGENTS.md')),
        inventory: getFileSize(path.join(MEMORY_DIR, 'shared', 'skills', 'agency-inventory.json')),
        current_state: getFileSize(path.join(S_AG_DIR, 'main', 'CURRENT_STATE.md'))
    };

    const viz = {
        lastUpdated: new Date().toISOString(),
        usage: usage,
        hotspots: [
            { file: "agency-inventory.json", size: usage.inventory, impact: parseFloat(usage.inventory) > 50 ? "HIGH" : "MEDIUM" },
            { file: "CURRENT_STATE.md", size: usage.current_state, impact: "LOW" }
        ],
        status: "OPTIMIZED"
    };

    fs.writeFileSync(VIZ_PATH, JSON.stringify(viz, null, 4));
    log("✅ Context Viz updated.");
}

function purgeLRU(directory) {
    if (!fs.existsSync(directory)) return;
    const now = Date.now();
    let count = 0;
    
    const agents = fs.readdirSync(directory);
    for (const agent of agents) {
        const tasksDir = path.join(directory, agent, 'tasks');
        if (fs.existsSync(tasksDir)) {
            const files = fs.readdirSync(tasksDir);
            for (const file of files) {
                const fullPath = path.join(tasksDir, file);
                const stats = fs.statSync(fullPath);
                if (now - stats.mtimeMs > MAX_AGE_MS) {
                    fs.unlinkSync(fullPath);
                    count++;
                }
            }
        }
    }
    if (count > 0) log(`🧹 Purged ${count} expired tasks from S_AG.`);
}

async function checkHealth() {
    log("Running Health Check...");
    
    const identityPath = path.join(MEMORY_DIR, 'IDENTITY.md');
    if (!fs.existsSync(identityPath)) {
        log("❌ FATAL: IDENTITY.md missing!");
    } else {
        log("✅ IDENTITY.md verified.");
    }
    
    return new Promise((resolve) => {
        let resolved = false;
        
        const req = http.get('http://127.0.0.1:4747/api/repos', (res) => {
            if (resolved) return;
            if (res.statusCode === 200) {
                log("✅ GitNexus (Port 4747) is ALIVE.");
                resolved = true;
                resolve(true);
            } else {
                log(`⚠️ GitNexus returned status ${res.statusCode}.`);
                resolved = true;
                resolve(false);
            }
            res.resume();
        });
        
        req.on('error', (err) => {
            if (resolved) return;
            log(`❌ GitNexus is DOWN: ${err.message}`);
            resolved = true;
            resolve(false);
        });
        
        req.setTimeout(3000, () => {
            if (resolved) return;
            req.destroy();
            log("❌ GitNexus check TIMEOUT.");
            resolved = true;
            resolve(false);
        });
    });
}

async function run() {
    log("🐕 Watchdog starting up...");
    purgeLRU(S_AG_DIR);
    updateContextViz();
    const healthy = await checkHealth();
    
    if (!healthy) {
        log("🚀 Attempting to restart GitNexus via VBS...");
        try {
            const vbsPath = path.join(BASE_DIR, 'GitNexus-main', 'gitnexus', 'start_gitnexus.vbs');
            execSync(`wscript.exe "${vbsPath}"`);
            log("✅ Restart command sent.");
        } catch (e) {
            log(`❌ Failed to restart GitNexus: ${e.message}`);
        }
    }
    
    log("🐕 Watchdog cycle complete.");
    process.exit(0);
}

if (require.main === module) {
    run();
}
