# 🛒 PB-ECommerce-Hit-Factory (Wave 8 Pipeline)

> **Status:** `[INIT / WAITING_FOR_NOTEBOOKLM_URL]`
> **Architect:** Flash Vanguard Agent
> **Core Dependency:** NotebookLM MCP (Left-Brain), NanoBanana (Generative)

## 0x01: 目标宗旨 (Objective)
通过联邦智能体协同机制，将全域电商数据（对标文案、转化率统计、用户画像分析）作为源数据，利用 NotebookLM 彻底解决幻觉问题，并提取转化特征，最终输出具有高度关联性和商业爆红潜质的结构化成果。

## 0x02: 流程规范 (Execution Pipeline)

### Phase 1: 防护型预检 (Pre-flight Shield)
1. 强制载入 `.agents/workflows/flash-safety-net.md`，执行全局物理快照。
2. 任何本地爬虫或数据适配器的修改，必须通过 `node -c` 的 AST 验证沙盒。

### Phase 2: 双核思考注入 (Dual-Core Inference via Hybrid Gateway)
1. 挂载电商基准 NotebookLM 库（基于用户提供的 URL）。
2. 执行任意重度逆向工程（Reverse-Prompting）前，Flash **必须** 优先通过 `node ~/.agent-memory/runtime/notebooklm-hybrid-mcp.js` 脚本调用 API 第一引擎提问：
   * “当前待分析商品的最高频用户痛点是什么？”
   * “基于已挂载的对标爆款，提取前 3 个最核心的情绪价值点。”
3. **[熔断兜底]**: 如果混合网关返回 `[HYBRID_FALLBACK_SIGNAL]` 抛锚失败（例如环境包缺失或 Google 端点失效），Flash **必须无缝回滚**，调用原生 `mcp_notebooklm_ask_question` 工具用无头浏览器进行物理 DOM 接管。
4. 将最终提取的【无幻觉特征矩阵】缓存至 `memory/shared/knowledge/e-commerce-matrix.json` 中。

### Phase 3: 多模态生成与联想 (Associative Generation)
1. 根据上一步提炼的特征矩阵，重组 Prompt。
2. 调用外部 Generative Agent（例如 NanoBanana 甚至本地模型引擎）进行多模态文案或图像描述生成。

## 0x03: 护盾约束 (Amnesia & Hallucination Shields)
- Flash 严禁在未查询 NotebookLM 的情况下凭空捏造产品特征。
- 生成的配置或 Prompt 若不满足预设长度或参数，不予保存，直接基于快照丢弃重建。
