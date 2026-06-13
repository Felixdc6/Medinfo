import { ClaudeVlmProvider } from './claude.js';
import { QwenVlmProvider } from './qwen.js';
import type { VlmProvider } from './types.js';

export type { VlmProvider } from './types.js';

/** Build the active VLM provider from environment configuration. */
export function createVlmProvider(env = process.env): VlmProvider {
  const provider = (env.VLM_PROVIDER ?? 'qwen').toLowerCase();
  switch (provider) {
    case 'claude':
      return new ClaudeVlmProvider({
        apiKey: required(env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY'),
        model: env.CLAUDE_VLM_MODEL ?? 'claude-opus-4-8',
      });
    case 'qwen':
    default:
      return new QwenVlmProvider({
        baseURL: env.QWEN_BASE_URL ?? 'http://localhost:11434/v1',
        ...(env.QWEN_API_KEY ? { apiKey: env.QWEN_API_KEY } : {}),
        model: env.QWEN_MODEL ?? 'qwen2-vl:7b',
      });
  }
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}
