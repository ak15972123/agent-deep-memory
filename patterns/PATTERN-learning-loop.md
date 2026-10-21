<!-- ⛔ SOVEREIGN MEMORY FILE — 认知反思规范 -->
<!-- 📌 Schema: v1.0.1 | 衍生自 self-improving-agent -->

# 🧬 认知晋升循环规范 (Learning Loop)

本文件定义了主权记忆体系中“从踩坑到提纯”的自动反射神经元机制。

## 1. 触发反思 (Event-Driven Reflection)
在任何“原子化交付”前（即回答用户前），必须静默思考：
- 是否通过排查才发现了非直觉的解决方案？
- 刚才系统是否抛出了报错（Exit Code != 0）？
- 我原有知识库中是否存在过时的设定？

## 2. 捕获与折叠 (Pattern Deduplication)
当决定记录至 `pitfalls` 陷阱库时，必须：
1. **全局检索**：先在 `memory/shared/pitfalls/` 中检索有无极度相似的坑。
2. **提取键值**：赋予一个抽象维度的 `Pattern-Key` (如 `wsl.path.leak`)。
3. **计数升级**：如果是已有重犯故障，将原条目对应的 `Recurrence-Count` 加 1。

## 3. 升华晋升 (Promotion Threshold)
满足以下条件之一，必须强制提纯为 **Pattern (模式)** 或 **Skill (技能剧本)**：
- 同一坑的 `Recurrence-Count` ≥ 3。
- 属于极其高价值、可被多个架构直接复用的普适性工作流。
- 用户主动强调 "记住这个套路" 或 "将其抽象为技能"。

## 4. 技能具象化剥离 (Skill Extraction)
一旦满足晋升条件：
1. 根据 `memory/shared/playbooks/PB-Skill-Extraction.md` 将其转化为标准化步骤或方法论。
2. 将结果沉淀至 `shared/SKILLS.md`、`shared/patterns/INDEX.md` 甚至核心 `shared/MEMORY.md`。
3. 标注原 pitfall 的状态为 `promoted_to_skill`。
