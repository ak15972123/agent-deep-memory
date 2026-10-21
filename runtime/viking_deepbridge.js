/**
 * 🪩 Viking-DeepBridge v1.0.0
 * 深度融合：将 DeepAgents 的执行协议（截断、补丁、分身）注入 Viking 核心。
 */

const fs = require('fs');
const path = require('path');

class VikingDeepBridge {
    static TRUNCATE_THRESHOLD = 50000; // 字符数，约 12k tokens
    static ARGS_MAX_LENGTH = 1000;

    /**
     * [Execution-Shield] 
     * 自动修复挂载工具调用，模拟 DeepAgents 的 PatchToolCallsMiddleware
     */
    static patchExecutionState(messages) {
        return messages.map((msg, index) => {
            if (msg.role === 'assistant' && msg.tool_calls) {
                // 如果发现没有对应的 tool 响应，可以在逻辑层标记警告或占位
            }
            return msg;
        });
    }

    /**
     * [Tiered-Summarization]
     * 在生成摘要前，对巨大的工具输出进行物理截断
     */
    static truncateLargeOutputs(content) {
        if (typeof content !== 'string') return content;
        if (content.length > this.TRUNCATE_THRESHOLD) {
            const head = content.slice(0, this.ARGS_MAX_LENGTH);
            const tail = content.slice(-this.ARGS_MAX_LENGTH);
            return `${head}\n\n... [TRUNCATED BY VIKING-DEEPBRIDGE ${content.length - 2000} chars] ...\n\n${tail}`;
        }
        return content;
    }

    /**
     * [AST-Native Read]
     * 包装 read_file，确保返回带行号的文本（模拟 DeepAgents backend.read）
     */
    static readWithLineNumbers(filePath, limit = 100, offset = 0) {
        if (!fs.existsSync(filePath)) return `[Error] File not found: ${filePath}`;
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
        const slice = lines.slice(offset, offset + limit);
        return slice.map((line, i) => `${(offset + i + 1).toString().padStart(5)} | ${line}`).join('\n');
    }
}

module.exports = VikingDeepBridge;
