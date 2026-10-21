/**
 * 🕵️ Browser-Operator v1.0 (Expert Edition)
 * 直接通过 CDP 协议操作 浏览器，避开 broken 的子代理工具。
 * 兼容性：完美适配 9333 端口上的 AutoAccept 实例。
 */

const http = require('http');
const WebSocket = require('ws');

const TARGET_PORT = 9333;

async function getWsUrl() {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${TARGET_PORT}/json/version`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const info = JSON.parse(data);
                resolve(info.webSocketDebuggerUrl);
            });
        }).on('error', reject);
    });
}

async function runCommand(url, task) {
    const wsUrl = await getWsUrl();
    console.log(`🔗 Connecting to CDP: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
        let id = 1;
        const sessionIdMap = new Map();

        ws.on('open', () => {
            // 1. 监听 Target 变化，获取第一个 Page 的 sessionId
            ws.send(JSON.stringify({ id: id++, method: 'Target.setDiscoverTargets', params: { discover: true } }));
        });

        ws.on('message', async (data) => {
            const msg = JSON.parse(data);
            
            // 捕获 Target 创建事件 (通常 浏览器已经有页面了)
            if (msg.method === 'Target.targetCreated' && msg.params.targetInfo.type === 'page') {
                const targetId = msg.params.targetInfo.targetId;
                ws.send(JSON.stringify({ id: id++, method: 'Target.attachToTarget', params: { targetId, flatten: true } }));
            }

            // 获取到 SessionId 后开始操作
            if (msg.result && msg.result.sessionId) {
                const sessionId = msg.result.sessionId;
                console.log(`🚀 Attached to session: ${sessionId}`);

                // 2. 导航到目标 URL
                ws.send(JSON.stringify({
                    id: id++,
                    sessionId,
                    method: 'Page.navigate',
                    params: { url: task.url }
                }));

                // 3. 等待加载完毕后执行脚本获取内容
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        id: id++,
                        sessionId,
                        method: 'Runtime.evaluate',
                        params: { expression: 'document.title + " | " + document.body.innerText.slice(0, 1000)' }
                    }));
                }, 3000);
            }

            // 处理结果
            if (msg.id && msg.result && msg.result.result && msg.result.result.value) {
                console.log(`✅ Result: ${msg.result.result.value}`);
                ws.close();
                resolve(msg.result.result.value);
            }
        });

        ws.on('error', reject);
    });
}

const args = process.argv.slice(2);
if (args.length > 0) {
    runCommand(args[0], { url: args[0] })
        .then(res => console.log(`FINAL_RESULT: ${res}`))
        .catch(err => console.error(`ERROR: ${err.message}`));
}
