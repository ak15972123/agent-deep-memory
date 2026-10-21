# 陷阱卡：OpenClaw Feishu WebSocket 连接崩溃 (PingInterval Undefined)
**Pattern-Key**: `openclaw-feishu-ws-token-failure`
**时间**: 2026-03-05
**环境**: Windows 11 + `.openclaw`
**复现次数**: 1

## 💥 错误表象
运行时抛出以下级联报错：
1. `[warn]: failed to obtain token`
2. `[ws] code: 1000040346, system busy`
3. `[ws] Cannot read properties of undefined (reading 'PingInterval')`
4. `[info]: unable to connect to the server after trying 6 times`

## 🔍 根因诊断 (Root Cause)
这个报错看似是网络或代码问题，实则是**权限拒绝和官方 SDK Bug 的混合体**：
1. **认证截断 (`1000040346` / `failed to obtain token`)**：
   飞书抛出 1000040346 (模糊提示 system busy) 的真因通常是：
   - OpenClaw 配置文件里的 App ID 或 App Secret 不匹配/无效。
   - 飞书开发者后台未开启“长连接(WebSocket)接受事件”权限。
   - **高发点**：部署环境 (Windows) 的公网 IP 未加入飞书企业自建应用的安全 IP 白名单中。导致换取 `tenant_access_token` 被云端截断。
2. **血崩 Bug (`PingInterval`)**：
   这是字节跳动飞书官方 `@larksuiteoapi/node-sdk` 的内部缺陷。当第一次请求 Token 失败、未能成功建立底层 TCP 实例时，它的连接对象是 `undefined`。结果它内建的心跳机制 (Keep-Alive) 强行去读 `connection.PingInterval`，导致了严重的运行时异常。

## 💡 规避与正解 (Solution)
**第一步：排查飞书开发者后台 (非代码侧)**
- 核查 App ID 和 App Secret 是否正确填入 OpenClaw 配置。
- 去飞书开放平台 -> 安全设置 -> IP 白名单，加入当前机器的外网 IP（或干脆暂时清空白名单测试）。
- 确认应用拥有“事件订阅”的长连接权限。

**第二步：对 OpenClaw 源码的安全加固 (未来动作)**
建议后续让 AI 在 `extensions/feishu/src/monitor.transport.ts` 中针对 `wsClient.start()` 外挂一层前置 Token 探针锁，如果 `try` 捕获到 Token 获取失败，直接 `process.exit` 抛出明文警告，防止其跌入官方 SDK 无解的 `PingInterval` 报错深渊。
