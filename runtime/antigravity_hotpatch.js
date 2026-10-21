const fs = require('fs');
const path = require('path');
const os = require('os');

// 💡 优化策略: 直接读取 Go 字典文件，实现 0 配置全量同步
const GO_REPO_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity-chinese-go-main';

function extractGoStrings(content) {
    const rules = [];
    const lines = content.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        // 忽略注释或无关代码
        if (line.startsWith('//') || line.startsWith('package ') || line.startsWith('import ') || line.startsWith('var ') || line.startsWith('func ') || line.startsWith('}')) {
            continue;
        }
        
        // 匹配 map 或 array 格式:
        // 1. `"..."`: `"..."`,
        // 2. { `"..."`, `"..."` },
        // 3. `...`: `...`,
        // 提取模式：先找到第一对引号包裹的内容，然后找到第二对
        
        // 更健壮的正则: 匹配 `内容` 或 "内容"
        const strRegex = /(`[^`]*`|"(?:[^"\\]|\\.)*")/g;
        const matches = [...line.matchAll(strRegex)];
        
        if (matches.length >= 2) {
            // 我们只取前两项作为 key / value
            let k = matches[0][1];
            let v = matches[1][1];
            
            // 去除最外层的包围符号 (如果是 ` 则去掉，如果是 " 也去掉, 但要注意 Go 里的 `"..."` 实际上是外层 ` 里层 ")
            if (k.startsWith('`') && k.endsWith('`')) {
                k = k.slice(1, -1);
            } else if (k.startsWith('"') && k.endsWith('"')) {
                // 如果外层是双引号，内部本身经过转义，通过 JSON.parse 还原
                try { k = JSON.parse(k); } catch(e) {}
            }
            
            if (v.startsWith('`') && v.endsWith('`')) {
                v = v.slice(1, -1);
            } else if (v.startsWith('"') && v.endsWith('"')) {
                try { v = JSON.parse(v); } catch(e) {}
            }
            
            rules.push({ k, v });
        }
    }
    return rules;
}

function hotPatchFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`[SKIP] 目标文件未找到: ${filePath}`);
        return false;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalSize = content.length;
    let matchCount = 0;

    for (let rule of replacements) {
        if (content.includes(rule.k)) {
            content = content.split(rule.k).join(rule.v);
            matchCount++;
        }
    }

    if (matchCount > 0) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`[SUCCESS] 修改 ${path.basename(filePath)} | 注入替换率: ${matchCount} 条 | 体积变化: ${content.length - originalSize} bytes`);
        return true;
    }
    console.log(`[NO CHANGES] ${path.basename(filePath)} 未命中任何替换`);
    return false;
}

function patchProductJson(appDir) {
    let pJson = path.join(appDir, 'resources', 'app', 'product.json');
    if (!fs.existsSync(pJson)) return;
    try {
        let data = JSON.parse(fs.readFileSync(pJson, 'utf-8'));
        if (data.checksums) {
            delete data.checksums['jetskiAgent/main.js'];
            delete data.checksums['vs/workbench/workbench.desktop.main.js'];
            delete data.checksums['main.js'];
            fs.writeFileSync(pJson, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`[SEC-BYPASS] 剔除了核心文件的系统完整性校验 (checksums cleaned).`);
        }
    } catch (e) {
        console.log("[ERROR] Parse product.json failed", e.message);
    }
}

function processMainAndChat() {
    const IDE_PATH = "D:\\Antigravity";
    const mainResourceJs = path.join(IDE_PATH, 'resources\\app\\out\\main.js');
    const jetskiAgentJs = path.join(IDE_PATH, 'resources\\app\\out\\jetskiAgent\\main.js');
    const workbenchJs = path.join(IDE_PATH, 'resources\\app\\out\\vs\\workbench\\workbench.desktop.main.js');
    
    // 读取 Go 字典
    const mainGo = path.join(GO_REPO_DIR, 'translations_main.go');
    const chatGo = path.join(GO_REPO_DIR, 'translations_chat.go');
    
    let mainRules = [];
    if (fs.existsSync(mainGo)) {
        mainRules = extractGoStrings(fs.readFileSync(mainGo, 'utf-8'));
    }
    
    let chatRules = [];
    if (fs.existsSync(chatGo)) {
        chatRules = extractGoStrings(fs.readFileSync(chatGo, 'utf-8'));
    }
    
    // 合并并深度去重、打磨术语词 (Hardcode specific expert terms to overwrite generic ones)
    const expertOverrides = {
        '"Agent Decides"': '"由智能体自主决断"',
        '"Review Policy"': '"审计拦截策略"',
        '"Auto-Open Edited Files"': '"后台静默载入编辑区"',
        '"Tab to Jump"': '"Tab 瞬移导航"',
        '"Always Proceed"': '"无人机模式(始终放行)"'
    };
    
    let allRules = [...mainRules, ...chatRules].map(r => ({ k: r.k, v: expertOverrides[r.k] || r.v }));
    
    // 去重，以最后的定义为准
    let ruleMap = new Map();
    for (let r of allRules) ruleMap.set(r.k, r.v);
    const finalRules = Array.from(ruleMap, ([k, v]) => ({ k, v }));
    
    console.log(`载入主程序汉化规则共计 ${finalRules.length} 条...`);
    
    hotPatchFile(mainResourceJs, finalRules);
    hotPatchFile(jetskiAgentJs, finalRules);
    hotPatchFile(workbenchJs, finalRules);
    patchProductJson(IDE_PATH);
}

function processContinue() {
    const extBase = path.join(os.homedir(), '.antigravity', 'extensions');
    if (!fs.existsSync(extBase)) return;
    
    const dirs = fs.readdirSync(extBase);
    let latestDir = dirs.filter(d => d.startsWith('continue.continue')).sort().reverse()[0];
    if (!latestDir) return;
    
    const indexJs = path.join(extBase, latestDir, 'gui', 'assets', 'index.js');
    const continueGo = path.join(GO_REPO_DIR, 'translations_continue.go');
    
    if (!fs.existsSync(continueGo)) return;
    const goContent = fs.readFileSync(continueGo, 'utf-8');
    
    // 分离 quoted 和 raw
    let rules = [];
    let lines = goContent.split('\n');
    let inQuoted = false;
    let inRaw = false;
    
    for (let line of lines) {
        if (line.includes('quotedTranslationsContinue')) { inQuoted = true; inRaw = false; continue; }
        if (line.includes('rawTranslationsContinue')) { inRaw = true; inQuoted = false; continue; }
        if (line.trim() === '}') { inQuoted = false; inRaw = false; }
        
        // For continue, format is "Key": "Value"
        let match = line.match(/"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
        if (match) {
            let k = match[1];
            let v = match[2];
            if (inQuoted) {
                rules.push({ k: `"${k}"`, v: `"${v}"` });
                rules.push({ k: `'${k}'`, v: `'${v}'` });
                rules.push({ k: `\`${k}\``, v: `\`${v}\`` });
            } else if (inRaw) {
                // 原文中的 raw key 是带斜杠的 "\"read_file\"" -> 需要反转义
                try {
                    let parsedK = JSON.parse(`"${k}"`);
                    let parsedV = JSON.parse(`"${v}"`);
                    rules.push({ k: parsedK, v: parsedV });
                } catch(e) {
                    rules.push({ k, v });
                }
            }
        }
    }
    console.log(`载入 Continue 插件汉化规则共计 ${rules.length} 条...`);
    hotPatchFile(indexJs, rules);
}

function run() {
    console.log("=== \x1b[36m🚀 Antigravity 极致汉化热修补 (Node.js 资深降维版)\x1b[0m ===");
    processMainAndChat();
    processContinue();
    console.log("=== 注入完毕，请冷重启 Antigravity 以应用全部深层汉化视图 ===");
}

run();
