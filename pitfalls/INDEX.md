# 🕳️ 陷阱索引

> 每条陷阱一行。引用次数 ≥3 触发技能晋升 (PB-Skill-Extraction)。

| ID | Pattern-Key | 场景关键词 | 根因摘要 | 严重度 | 发生时间 | 引用次数 |
|----|-------------|-----------|---------|--------|---------|---------| 
| PF-001-AMNESIA | codebase.amnesia | 路径猜测 | 禁止猜测文件路径，必须通过索引查找 | 高 | 2026-02-28 | 2 |
| PF-001 | wsl2.node.version | WSL2 Node | WSL2 默认 Node 版本过旧及全局权限拒绝 | 中 | 2026-02-28 | 1 |
| PF-002 | host.boundary | 宿主机越权 | 安全软件触发 + 宿主机边界越权 | 高 | 2026-03-01 | 1 |
| PF-003 | cargo.edition.install | Cargo Install | 未带 --locked 导致越界拉包 | 高 | 2026-03-04 | 1 |
| PF-004 | cargo.lock.v4.format | Cargo.lock | v4 格式导致必须全面升级编译器 | 高 | 2026-03-04 | 1 |
| PF-FEISHU-CONFIG | feishu.config | 飞书配置 | AppID/AppSecret 参数错位 | 高 | 2026-03-15 | 1 |
| PF-FEISHU-WS | feishu.websocket | 飞书 WS | PingInterval Undefined 崩溃 | 高 | 2026-03-15 | 1 |
