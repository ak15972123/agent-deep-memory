<!-- ⛔ SOVEREIGN MEMORY FILE — 标准工作流程 -->
<!-- 📌 Schema: v1.0.1 | 衍生自 self-improving-agent -->

# 📋 工作流剧本：主动技能萃取 (Skill Extraction)

**目标**：将高频的踩坑案例或极为通用的普适经验，从冗长的错误重写记录中剥离出来，转化为结构化、可复用、与上下文特定的项目参数无关的原子技能（Skill）或标准作业程序（SOP）。

## 触发条件
- 某坑位在 `pitfalls/INDEX.md` 中的 `Recurrence-Count` ≥ 3。
- 解决问题时发现了不局限于当前项目、可作为通用组件的最佳实践技巧（如：通用内存防抖策略、环境变量的跨平台隔离）。
- 用户已明确指示：**你要把这个变成一个技能/永久记忆。**

## 执行步骤

### Step 1: 经验提纯 (Distill)
丢掉原本解决问题时带随的实例数据（抛弃具体的文件名、抛弃特定的参数值、抛弃具体的运行时间戳）。
将结论浓缩成**不依附于特定项目的通则与伪代码/抽象脚本指令**。

### Step 2: 填充与沉淀 (Construct)
- **若是理念原则**：直接向 `memory/shared/patterns/INDEX.md` 或 `memory/shared/MEMORY.md` 注入浓缩的条目。
- **若是操作流程**：编写全新的标准操作文档（将其建立在 `memory/shared/playbooks/PB-xxx.md` 或类似目录中），必须保证涵盖：
  - **Trigger (触发器)**: 什么时候、什么场景需要使用此技能？
  - **Action (执行动作)**: 具体的指令、排查命令、处理范式。
  - **Verify (验证闭环)**: 怎么才算这一套技能执行成功？

### Step 3: 回溯归档 (Traceback)
回到原来在 `pitfalls` 或任务 `tasks` 中关于此问题的条目。
将其最终处置状态修改为 `**Status**: promoted_to_skill`。
带上新提取的剧本引用路径 `Playbook-Path`。此后旧有的细碎经验记录便可休眠/截断，避免后续的记忆碎片干扰。
