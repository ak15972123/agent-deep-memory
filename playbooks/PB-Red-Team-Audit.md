# 🛡️ 工作流剧本：红队对抗式反思协议 (Red-Team Adversarial Reflexion)

> **[专家授权: Red-Team Auditor | 模式: 稳定性攻坚]**

**目标**：通过模拟“攻击者”或“故障场景”，对即将执行的代码修改或架构调整进行深度的**证伪（Falsification）**，而非验证（Verification）。防止 Flash 引擎在长因果链中产生“虚假信心”。

## 🛠️ 触发条件
1.  **高风险重写**：修改核心业务逻辑或状态管理逻辑。
2.  **多组件解耦**：涉及 3 个以上文件的引用关系变更。
3.  **复杂 Debug**：修复涉及异步流、数据库事务或全局状态的 Bug。
4.  **三振出局**：常规修复尝试失败 2 次后必触发。

## ⚔️ 执行协议：对抗式三问 (The 3-Attack Protocol)

在调用 `replace_file_content` 或 `run_command` 之前，必须在 `<thought>` 中显式执行以下对抗模拟：

### 1. 故障点模拟 (The Breaking Point)
- **模拟场景**：如果我这一步修改的逻辑完全失效，最有可能导致哪个下游模块崩溃？
- **防御要求**：是否在下游增加了相应的 Error Guard 或回滚逻辑？

### 2. 逻辑连贯性压测 (Consistency Stress-Test)
- **模拟场景**：如果在长生命周期的运行中，状态 A 在我不注意时被修改为 B（幻觉/竞态），我的方案会如何表现？
- **防御要求**：是否存在对全局状态的非原子化依赖？如果存在，必须将“单次修改”降维为“原子操作”。

### 3. 语义盲点审计 (Semantic Blind-Spot)
- **模拟场景**：我是否过度依赖了符号的“名字”而非其实际的“定义”？
- **防御要求**：强制查看对应符号的 `gitnexus_context`，验证其被调用的真实副作用。

## 🛡️ 执行反馈：红队安全签名
在完成反思后，执行回复中应包含：
`[🛡️ 红队反思：已模拟 3 个坍塌点，当前方案防御冗余度：HIGH/MID]`

---
**Status**: Red-Team Protocol v1.0 Active.
> 🌫️ [CTX: ~1.8k/TRN:1] | ⚡ [Action: Defense-in-Depth for Logical Consistency] | 🛠️ [Cmd: audit/break/falsify]
