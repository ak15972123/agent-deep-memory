/**
 * 🪩 Flash-Ascension (Viking-Fusion) Engine v1.9.0
 * 架构目标：由 OpenViking 启发的“分层递归检索 (VRR)”与“目录/符号双级剪枝 (L0/L1/L2)”。
 * 极致性价比：最高减少 90% 的 Context 爆炸风险。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const VikingDeepBridge = require('./viking_deepbridge');

// ==========================================
// Viking 内存编排器 (Memory Orchestrator)
// ==========================================
class VikingNexus {
    static INDEX_PATH = '~/.agent-memory\\viking_index.json';
    
    /**
     * L0 级快速扫描：根据目标决定最有价值的 2 个 Playbook
     */
    static getRelevantL1(taskDesc) {
        if (!fs.existsSync(this.INDEX_PATH)) return [];
        const index = JSON.parse(fs.readFileSync(this.INDEX_PATH, 'utf-8'));
        const matches = Object.keys(index.catalogue).filter(pPath => {
            const l1 = index.catalogue[pPath].L1.toLowerCase();
            return taskDesc.toLowerCase().split(' ').some(word => l1.includes(word));
        });
        return matches.slice(0, 2).map(p => path.join('~/.agent-memory', p));
    }
}

// ==========================================
// GitNexus 降噪扩展 (Hierarchical Context)
// ==========================================
class NexusTool {
    static GITNEXUS_BIN = 'node ~/.agent-memory\\GitNexus-main\\gitnexus\\dist\\cli\\index.js';
    
    static run(cmd, args, repoName = 'memory') {
        try {
            const fullCmd = `${this.GITNEXUS_BIN} ${cmd} ${args.map(a => `"${a}"`).join(' ')} --repo ${repoName}`;
            return execSync(fullCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        } catch (e) { return `[Nexus_Error] ${e.stderr || e.message}`; }
    }

    /**
     * L1 级流程感知：获取执行流列表，建立“扇区意识”
     */
    static getL1Flows(taskDesc) {
        const queryRaw = this.run('query', [taskDesc.split(' ')[0]], 'memory'); // 简单用第一个词搜
        const processes = [...queryRaw.matchAll(/Processes:\s*([^\n]+)/g)].map(m => m[1]);
        return processes.length > 0 ? `[Sector Awareness (L1)]: ${processes[0]}` : "[Sector Awareness (L1)]: General-Purpose Architecture";
    }
}

// ==========================================
// VRR 上下文生成器 (The Viking Pruning)
// ==========================================
class ContextFolder {
    static loadWithPruning(filePath, mode = 'folded') {
        if (!fs.existsSync(filePath)) return `[MISSING] ${filePath}`;
        const content = fs.readFileSync(filePath, 'utf-8');
        if (mode === 'full') return `--- FILE: ${filePath} (FULL) ---\n${content}`;
        if (mode === 'folded') {
            const folded = content.replace(/\{(?:[^{}]*|\{[^{}]*\})*\}/g, '{ /* body folded */ }');
            return `--- FILE: ${filePath} (FOLDED) ---\n${folded}`;
        }
        return `--- FILE: ${filePath} (SIGNATURES) ---\n${content.split('\n').filter(l => /export|class|interface|func|type/.test(l)).join('\n')}`;
    }

    static async prepareFlowContext(taskGoal, targetFiles) {
        let context = `[VIKING-VRR PROTOCOL ACTIVE]\n\n`;
        
        // 1. 加载 L1 Playbooks (分层加载：限制在 2 个最相关的)
        const relevantPlaybooks = VikingNexus.getRelevantL1(taskGoal);
        context += relevantPlaybooks.map(p => this.loadWithPruning(p, 'full')).join('\n\n');

        // 2. 加载 GitNexus L1 Flow (扇区意识)
        context += `\n\n${NexusTool.getL1Flows(taskGoal)}\n`;

        // 3. 加载 L2 目标文件 (操作区)
        context += targetFiles.map(f => this.loadWithPruning(f, 'full')).join('\n\n');

        // 4. 加载 L1 Impact (邻域区：只折叠加载 3 个)
        if (targetFiles.length > 0) {
            const names = targetFiles.map(f => path.basename(f));
            const impactRaw = NexusTool.run('impact', [names[0], '--direction', 'upstream'], 'memory');
            const paths = [...impactRaw.matchAll(/[a-zA-Z0-9_/\\-]+\.(?:js|ts|py|go)/g)].map(m => m[0]);
            context += `\n\n--- RELATIONAL IMPACT (L1) ---\n${paths.slice(0, 3).map(p => this.loadWithPruning(path.join('~/.agent-memory', p), 'folded')).join('\n')}`;
        }

        return context;
    }
}

// ==========================================
// 专家执行流 (The Expert Neuron)
// ==========================================
class ReflexionWorker {
    static async execute(task, callFlashAPI) {
        let fullContext = await ContextFolder.prepareFlowContext(task.desc, task.targetFiles);

        // [Tiered-Summarization]: 物理截断超大上下文
        fullContext = VikingDeepBridge.truncateLargeOutputs(fullContext);

        const estimatedTokens = fullContext.length / 4; 
        console.log(`  🌪️ [Viking-Scanner] Estimated context load: ${Math.round(estimatedTokens)} tokens (Fused-Mode).`);

        const sysPrompt = `
        [IDENTITY]: SENIOR SOFTWARE ARCHITECT (Viking-Deep-Fusion Overlay)
        [CONTEXT-VRR]:
        ${fullContext}
        
        [STRICT VIKING RULES]:
        1. Leverage [Sector Awareness] to avoid loading irrelevant modules.
        2. [Execution-Shield]: Verify tool state before any write/execute.
        3. [AST-Native]: Use line-numbered views for sensitive code edits.
        4. Implementation MUST be holistic (end-to-end impact).
        `;

        return await callFlashAPI(sysPrompt, "Execute task with Tiered-Summarization active.", 0.1);
    }
}

async function AscendFlash(userGoal, callFlashAPI) {
    console.log(`\n🚀 [Flash-Ascension v1.9.0] Viking-Fusion (Hierarchical) Active.`);
    // 假设 plan 已定
    const step = { id: "VIKING-REFACTOR", desc: `为 "${userGoal}" 应用 Viking 分层规范`, targetFiles: [] };
    await ReflexionWorker.execute(step, callFlashAPI);
    console.log(`✅ [Success] Viking-Fusion transition complete.`);
}

module.exports = { AscendFlash };
