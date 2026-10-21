# 陷阱卡：OpenClaw 飞书配置文件参数错位 (AppID/AppSecret 置换)
**Pattern-Key**: `openclaw-feishu-config-swapped`
**时间**: 2026-03-05
**环境**: Windows 11 + `~/.openclaw`
**复现次数**: 1

## 💥 错误表象
即便飞书开发者后台已经开放了 IP 白名单（或未设置），系统依然抛出以下报错：
1. `[warn]: failed to obtain token`
2. `[ws] code: 1000040346, system busy`
3. `[ws] Cannot read properties of undefined (reading 'PingInterval')`

## 🔍 根因诊断 (Root Cause)
经过对 `~/.openclaw\openclaw.json` 配置文件的排查，发现 **致命的低级配置错误：`appId` 和 `appSecret` 的值填反了**。

在 `openclaw.json` 的 `channels.feishu` 节点中：
```json
"appId": "V1r02XxqIQsXEw10yWsipemotXFrZCX5",
"appSecret": "cli_a92b23588538dcee"
```
**真相**：
- 飞书的 `App ID` 永远是以 `cli_` 开头的。
- 飞书的 `App Secret` 是一长串随机字符串（如这里的 `V1r02Xx...`）。

由于两个字段完全颠倒，OpenClaw 在底层向飞书请求 `tenant_access_token` 时，传递了非法的身份凭证，导致飞书网关当即拒绝并返回了混淆视听的 `1000040346, system busy`（此时飞书网关甚至都没走到 IP 白名单校验那一步），最终引发后续的 `PingInterval` 官方 SDK 空指针 Bug。

## 💡 规避与正解 (Solution)
**手工修复方案**：
停止 OpenClaw，打开 `~/.openclaw\openclaw.json`，将两者纠正：
```json
"appId": "cli_a92b23588538dcee",
"appSecret": "V1r02XxqIQsXEw10yWsipemotXFrZCX5"
```
保存后重启服务即可。经原生 curl/node 测试，掉换正确的凭据后即可瞬间获取到下发的 `tenant_access_token`。
