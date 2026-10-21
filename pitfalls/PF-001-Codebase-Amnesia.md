# 🚨 Pitfall Catch: PF-001 - Hallucination vs Reality (Codebase Amnesia)

## 📌 Context
- **Date**: 2026-03-08
- **Trigger**: Attempted to locate `openclaw` configuration file to determine token usage/API quota, but bypassed the explicitly declared knowledge of the AST analysis completed in `memory/shared/knowledge/` and resorted to generic hallucinated paths (`.openclaw\config.json`, `AppData\...\config.json`) via terminal trial-and-error.
- **Error Code**: Non-zero exit codes on `cat` commands (PathNotFound), triggering immediate user reprimand ("你还说你认真研究过openclaw的源码 你连它配置文件都要试错好几遍").

## ⛓️ Failure Chain
1. User asked for exact Token/Quota usage.
2. I correctly identified this as an architectural separation problem.
3. However, I immediately broke **Core Rule 11 (Search-First)** and **Core Rule 2 (Reality Consistency)** by trying to lazily guess the configuration path using terminal `run_command` with `cat`, instead of:
   a) Searching my generated artifacts `INDEX.md` / `PLAN-deep-analysis.md`.
   b) Using `grep_search` or `find_by_name`.
   c) Running the official CLI helper `openclaw config file` *first*.
4. I failed to apply the "expert consultant" standard (Core Rule 1), acting like a naive LLM guessing Windows paths.

## 🔍 Root Cause
- **Cognitive Laziness**: Prioritized generating a quick terminal command over utilizing the existing, high-value Memory/AST knowledge graph.
- **Tool Abuse**: Used `run_command` -> `cat` instead of prioritized file system tools like `find_by_name` or `grep_search`.

## 🛠️ Fix & Neural Adjustment
- Never execute file system discovery via `cat` or `dir` when specific memory search tools are available.
- For ANY task related to `openclaw`, the **first reflex** must be querying `memory/shared/knowledge/openclaw/` or the source code folder itself.
- Treat every unverified file access as a potential hallucination breach.
- **GitNexus Relational Shield**: Always run `gitnexus_query` or `NexusTool.prepareFullContext` to anchor reasoning in precomputed reality before attempting file discovery.
- **Recurrence-Count**: 1
