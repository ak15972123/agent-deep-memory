# 🪩 工作流剧本：团队主脑联邦协同协议 (Team-Brain Federated Coordination)

> **[专家授权: Team Lead / Architect | 模式: 领域并行与主脑汇总]**

**目标**：通过“分散执行 + 实时脉搏 + 汇总结晶”三位一体，达成多 Agent 对复杂功能模块的无缝协作。

## 📍 触发场景
1.  **大规模功能迭代**：涉及 2 个以上 Agent 并行处理不同层级（如前端、后端、DB）。
2.  **复杂组件集成**：涉及 A 与 B 的多点触达与逻辑链路依赖。

## 🛠️ 第一阶段：分散并行执行 (Pulse Generation)
每个 Agent 在独立执行原子任务时，必须遵守“脉搏落盘”协议：

1.  **初始化脉搏**：在主控分配任务后，立即在 `~/.agent-memory/state/agents/` 下创建 `{agent_id}.pulse.json`。
2.  **实时状态上报 (Interval)**：
    - 在每次 `replace_file_content` 或 `run_command` 完成后，同步更新 `pulse.json` 的 `status`、`current_step` 与 `impacted_symbols`。
3.  **成果证据沉积**：
    - 运行完测试（Evidence），将测试结果路径或关键 Log 片段写入 `evidence_log`。

## 🛠️ 第二阶段：实时协同感知 (Pulse Perception)
- **依赖感知 (The Pulse-Lookahead)**：
  - 子 Agent 在执行受阻或需要调用邻域接口时，**必须**先读取邻域 Agent 的 `pulse.json`。
  - **原则**：读取对方的意图（Intent）先于读取物理代码。如果 A 的意图匹配，B 可以据此先行联调桩代码。

## 🛠️ 第三阶段：主脑联邦汇总 (The Final Consolidation)
当所有任务波次（Wave）标记为 `DONE` 时，执行以下“结晶”动作：

1.  **物理合并审阅**：主脑运行 `gitnexus_detect_changes` 审计各个 Agent 的修改是否导致了符号冲突。
2.  **语义连贯性校验**：根据 `pulse.json` 中的 `Interface Plan` 与最终生成的代码进行对比，验证“意图”与“实现”是否在集成时由于理解偏差而断开。
3.  **全局状态同步**：将所有分散的 `pulse.json` 条目压缩汇总至 `CURRENT_STATE.md` 的 `SUMMARY OF RECENT WORK`，并清空 pulse 目录。

---
**Status**: Team Coordination Protocol v1.0 Activated.
> 🌫️ [CTX: ~2.5k/TRN:1] | ⚡ [Action: Pulse-Sync Protocol Deployed] | 🛠️ [Cmd: pulse/consolidate/bake]
