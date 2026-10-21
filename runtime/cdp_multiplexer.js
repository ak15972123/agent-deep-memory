/**
 * 🛠️ CDP-Multiplexer v1.0
 * 兼容性桥接器：将 Antigravity 的 CDP (9333) 镜像到标准 CDP 端口 (9222)，
 * 并支持多客户端（AutoAccept + Agent）流量并发。
 */

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const TARGET_HOST = '127.0.0.1';
const TARGET_PORT = 9333;
const PROXY_PORT = 9222;

console.log(`🚀 Starting CDP Bridge: ${PROXY_PORT} -> ${TARGET_PORT}...`);

// 1. HTTP 代理 (处理 /json/version, /json/list 等)
const httpServer = http.createServer((req, res) => {
    console.log(`  [HTTP] ${req.url}`);
    const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        let body = '';
        proxyRes.on('data', chunk => body += chunk);
        proxyRes.on('end', () => {
            // 关键：重写 WebSocket URL，让客户端连回本代理端口
            if (req.url.includes('/json')) {
                body = body.replace(new RegExp(`:${TARGET_PORT}`, 'g'), `:${PROXY_PORT}`);
            }
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            res.end(body);
        });
    });

    proxyReq.on('error', (err) => {
        res.writeHead(502);
        res.end(`Proxy Error: ${err.message}`);
    });

    req.pipe(proxyReq);
});

// 2. WebSocket 代理 (处理调试指令流)
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
    console.log(`  [WS] New client connected: ${req.url}`);
    
    // 连接到真实的 Antigravity CDP
    const targetWs = new WebSocket(`ws://${TARGET_HOST}:${TARGET_PORT}${req.url}`);

    targetWs.on('open', () => {
        console.log(`  [WS] Link established to 9333`);
        
        // 双向转发流
        ws.on('message', (data) => targetWs.send(data));
        targetWs.on('message', (data) => ws.send(data));
    });

    ws.on('close', () => targetWs.close());
    targetWs.on('close', () => ws.close());
    
    ws.on('error', (err) => console.error('Client WS Error:', err));
    targetWs.on('error', (err) => console.error('Target WS Error:', err));
});

httpServer.listen(PROXY_PORT, '127.0.0.1', () => {
    console.log(`✅ CDP Bridge is ACTIVE on http://127.0.0.1:${PROXY_PORT}`);
    console.log(`   Clients can now use standard 9222 to control the browser share with AutoAccept.`);
});
