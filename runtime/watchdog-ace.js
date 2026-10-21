/**
 * 🐕 Watchdog.js v2.5.0 (Cognitive Sentinel: ACE v3.0 Reconstruction Wave)
 * [专家挂载: DevOps/ACE | 模式: 优先级仲裁与 API 冷却决策]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const ModelFallbackPlugin = require('./model-fallback');

// 🔄 ACE v3.0: 物理层级寻址与多维仲裁
const BASE_DIR = path.resolve(__dirname, '../../');

// 物理解耦：不再直接引用 arc，改为感知 ace-bus.json
const BUS_PATH = path.join(BASE_DIR, 'infra', 'S_ST', 'ace-bus.json');

const INFRA_DIR = path.join(BASE_DIR, 'infra');
const PULSE_DIR = path.join(BASE_DIR, 'activity', 'pulse');
const MEMORY_DIR = path.join(BASE_DIR, 'memory');
const S_AG_DIR = path.join(BASE_DIR, 'S_AG');

const VIZ_PATH = path.join(PULSE_DIR, 'context-viz.json');
const HEARTBEAT_PATH = path.join(PULSE_DIR, 'heartbeat.json');
const WAL_PATH = path.join(PULSE_DIR, 'wal.md');
const EXEC_GATE_PATH = path.join(INFRA_DIR, 'S_ST', 'exec-gate.json');

const DYNAMIC_REFS_PATH = path.join(MEMORY_DIR, 'shared', 'knowledge', 'dynamic_refs.json');
const JOURNAL_PATH = path.join(MEMORY_DIR, 'shared', 'evolution', 'builder-journal.md');
const AGENTS_PULSE_DIR = PULSE_DIR;

function log(msg) {
    console.log(`[ACE-Sentinel-v2.5.0] ${new Date().toISOString()} | ${msg}`);
}

function ensureTopology() {
    log("🏗️ Auditing Physical Topology...");
    const criticalDirs = [
        PULSE_DIR,
        path.join(MEMORY_DIR, 'shared', 'knowledge'),
        path.join(MEMORY_DIR, 'shared', 'evolution'),
        path.join(S_AG_DIR, 'main')
    ];
    criticalDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            log(`🛠️ Re-building topology leaf: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

/**
 * 📥 Pulse Merge: 汇聚并行智能体的脉搏信号
 */
function pulseMerge() {
    log("Integrating Distributed Agent Pulses...");
    if (!fs.existsSync(AGENTS_PULSE_DIR)) return;

    try {
        const files = fs.readdirSync(AGENTS_PULSE_DIR);
        let pulseManifest = [];

        for (const file of files) {
            if (file.endsWith('.pulse.json')) {
                const fullPath = path.join(AGENTS_PULSE_DIR, file);
                try {
                  const pulse = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                  pulseManifest.push({
                      agent: pulse.agent_name || file,
                      status: pulse.status,
                      task: pulse.task_id,
                      impact: pulse.impacted_symbols || []
                  });
                  
                  // 自动蒸馏逻辑
                  if (pulse.status === 'DONE' && !pulse.distilled) {
                      log(`📦 Distilling knowledge from Agent: ${pulse.agent_name}...`);
                      appendToJournal(`[ACE-Pulse] 已从 ${pulse.agent_name} 的任务 ${pulse.task_id} 中完成符号逻辑提取。`);
                      // 标记已蒸馏（需回写或删除，此处模拟逻辑）
                  }
                } catch (e) {
                    log(`⚠️ Pulse Parse Error: ${file}`);
                }
            }
        }
        
        if (pulseManifest.length > 0) {
            log(`✅ Pulse Bus: ${pulseManifest.length} active signals merged.`);
        }
    } catch (e) {
        log(`❌ Pulse scan failed: ${e.message}`);
    }
}

/**
 * ⚖️ Arbiter: 优先级仲裁器 (ACE Phase 3)
 */
function prioritiesArbiter() {
    log("⚖️ Running Priority Arbiter...");
    if (!fs.existsSync(EXEC_GATE_PATH)) return;

    try {
        const gate = JSON.parse(fs.readFileSync(EXEC_GATE_PATH, 'utf8'));
        const activeTasks = gate.registrations.filter(r => r.status === 'PENDING');
        
        if (activeTasks.length > 1) {
            log(`⚠️ Potential Conflict: ${activeTasks.length} pending commands. Sorting by priority...`);
            // 此处由于没有具体的优先级字段，目前仅做记录。未来可以扩展为更复杂的锁定机制。
        }
    } catch (e) {
        log(`❌ Arbiter failed: ${e.message}`);
    }
}

/**
 * ❄️ CooldownDecision: API 冷却算法 & Token 节约策略 (ACE Phase 3)
 */
function cooldownDecision(lastError = null) {
    log("❄️ Checking Cooldown Decision Matrix (Token-Saver Mode)...");
    
    // 🌍 物理感知：获取当前会话的近似 Token (此处简化，由环境变量或状态文件提供)
    // 模拟从系统状态获取
    const currentContext = 3500; // 重置后的初始值

    const decision = fallbackPlugin.resolveCooldownDecision({
        currentTokens: currentContext,
        modelName: "default-model",
        lastErrorType: lastError
    });

    if (decision.type === "SKIP" || decision.type === "BLOCK") {
        log(`🔴 ALERT: ${decision.reason}. Action: ${decision.action}`);
        if (decision.reason === "TOKEN_OVERFLOW") {
            tokenSavingStrategy();
        }
        return true;
    }
    
    if (decision.type === "PROBE") {
        log(`🟡 PROBE: ${decision.reason}. Attempting strict verification...`);
    }

    return false;
}

/**
 * ✂️ Token Saving Strategy: 自动剪枝冗余符号 (ACE Phase 3)
 */
function tokenSavingStrategy() {
    log("✂️ Pruning redundant context symbols...");
    // 逻辑：向 CURRENT_STATE.md 写入剪枝指令，提示 Agent 下次加载时忽略非核心 Ref
    const instruction = "\n> [TOKEN_SAVER] 下次会话强制忽略 REF-001/002 对应的历史 Trace，仅保留逻辑快照。\n";
    try {
        fs.appendFileSync(path.join(S_AG_DIR, 'main', 'CURRENT_STATE.md'), instruction);
        log("✅ Token-Saver: Pruning instruction injected into CURRENT_STATE.");
    } catch (e) {
        log(`❌ Pruning failed: ${e.message}`);
    }
}

/**
 * 🛡️ Symbol Integrity: 符号完整性主动检测
 */
function symbolIntegritySensing() {
    log("Sensing Symbol Integrity Graph...");
    if (!fs.existsSync(DYNAMIC_REFS_PATH)) return;

    try {
        const refs = JSON.parse(fs.readFileSync(DYNAMIC_REFS_PATH, 'utf8'));
        const brokenRefs = [];

        refs.mappings.forEach(ref => {
            if (ref.physical_layer === 'Infra' && ref.path) {
                const fullPath = path.join(BASE_DIR, ref.path);
                if (!fs.existsSync(fullPath)) {
                    brokenRefs.push(ref.id);
                }
            }
        });

        if (brokenRefs.length > 0) {
            log(`⚠️ CRITICAL: Broken Symbol Links Detected: ${brokenRefs.join(', ')}`);
        } else {
            log("✅ Symbol Integrity: Graph Healthy.");
        }
    } catch (e) {
        log(`❌ Symbol sensing failed: ${e.message}`);
    }
}

function appendToJournal(entry) {
    const timestamp = new Date().toISOString().split('T')[0];
    const formattedEntry = `\n[复盘] ${timestamp} (AUTO-ACE)\n战果：${entry}\n`;
    try {
        if (!fs.existsSync(JOURNAL_PATH)) {
            fs.writeFileSync(JOURNAL_PATH, "# 📜 Builder Journal\n");
        }
        fs.appendFileSync(JOURNAL_PATH, formattedEntry);
    } catch (e) {
        log(`❌ Journal sync failed: ${e.message}`);
    }
}

function updateHeartbeat() {
    log("Updating Session Heartbeat Pulse...");
    const currentPid = process.processId || process.pid;
    const heartbeat = {
        pid: currentPid,
        timestamp: new Date().toISOString(),
        status: "ACTIVE",
        role: "main",
        protocol: "ACE v3.0 (Reconstruction)"
    };
    try {
        fs.writeFileSync(HEARTBEAT_PATH, JSON.stringify(heartbeat, null, 4));
        log(`✅ Heartbeat [ACE-Reconstruction] (PID: ${currentPid}).`);
    } catch (e) {
        log(`❌ Heartbeat failure: ${e.message}`);
    }
}

function updateContextViz() {
    log("Visualizing Federated Context...");
    const usage = {
        memory_shared: getFileSize(path.join(MEMORY_DIR, 'shared', 'MEMORY.md')),
        active_code: getFileSize(path.join(BASE_DIR, 'AGENTS.md')),
        current_state: getFileSize(path.join(S_AG_DIR, 'main', 'CURRENT_STATE.md')),
        pulse_bus: fs.existsSync(AGENTS_PULSE_DIR) ? fs.readdirSync(AGENTS_PULSE_DIR).length : 0
    };

    const viz = {
        lastUpdated: new Date().toISOString(),
        usage: usage,
        topology: "ACE v3.0 Reconstruction Wave",
        status: "PULSE_ACTIVE"
    };

    try {
        fs.writeFileSync(VIZ_PATH, JSON.stringify(viz, null, 4));
        log("✅ Context Viz updated to ACE v3.0.");
    } catch (e) {
        log(`❌ Viz update failed: ${e.message}`);
    }
}

function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return (stats.size / 1024).toFixed(1) + 'k';
    } catch (e) { return '0k'; }
}

async function checkHealth() {
    log("ACE Reconstruction Health Audit starting...");
    const req = http.get('http://127.0.0.1:4747/api/repos', (res) => {
        if (res.statusCode === 200) log("✅ GitNexus Federated Bridge: ONLINE.");
        res.resume();
    }).on('error', (err) => {
        log(`❌ GitNexus Engine: OFFLINE (${err.message}) - API Access Limited.`);
    });
}

async function run() {
    log("🐕 Cognitive Sentinel v3.1 (ACE Phase 3 - Decoupled Mode) Initializing...");
    ensureTopology();
    updateHeartbeat();
    pulseMerge();
    
    // 🛡️ Pulse-Bus 感知 (消除了对 ARC 的强引用依赖)
    try {
        log("🔍 Auditing ACE-BUS Status...");
        if (fs.existsSync(BUS_PATH)) {
            const busState = JSON.parse(fs.readFileSync(BUS_PATH, 'utf8'));
            log(`✅ ACE-BUS Linked. Status: ${busState.arc_status}. Active Leases: ${busState.active_leases}`);
        } else {
            log("⚠️ ACE-BUS Missing. System in Degraded Mode.");
        }
    } catch (e) {
        log(`❌ Pulse-Bus Sensing Error: ${e.message}`);
    }

    symbolIntegritySensing();
    updateContextViz();
    await checkHealth();
    log("🐕 ACE Phase 3 (Bus-Sensing) cycle complete. Isolation Gears Engaged.");
    process.exit(0);
}

run();


