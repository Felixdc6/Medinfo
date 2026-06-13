import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * A text LLM used for two jobs: reformatting official leaflet text into plain
 * language (ingestion), and translating reformatted text on demand (API).
 * Default is the same self-hosted Qwen stack as the VLM (no API cost); Claude
 * is an optional swap-in. Selected via REFORMAT_PROVIDER (falls back to qwen).
 */
export interface TextProvider {
  readonly id: string;
  complete(opts: { system?: string; prompt: string; json?: boolean; maxTokens?: number }): Promise<string>;
}

class OpenAiCompatibleTextProvider implements TextProvider {
  constructor(
    readonly id: string,
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async complete(opts: { system?: string; prompt: string; json?: boolean; maxTokens?: number }): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      ...(opts.json ? { response_format: { type: 'json_object' as const } } : {}),
      max_tokens: opts.maxTokens ?? 2048,
      messages: [
        ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
        { role: 'user' as const, content: opts.prompt },
      ],
    });
    return res.choices[0]?.message.content ?? '';
  }
}

class ClaudeTextProvider implements TextProvider {
  readonly id = 'claude';
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {}

  async complete(opts: { system?: string; prompt: string; json?: boolean; maxTokens?: number }): Promise<string> {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: opts.maxTokens ?? 2048,
      ...(opts.system ? { system: opts.system } : {}),
      messages: [{ role: 'user', content: opts.prompt }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    return block && 'text' in block ? block.text : '';
  }
}

export function createTextProvider(env = process.env): TextProvider {
  const provider = (env.REFORMAT_PROVIDER ?? env.VLM_PROVIDER ?? 'qwen').toLowerCase();
  if (provider === 'claude') {
    if (!env.ANTHROPIC_API_KEY) throw new Error('Missing required env var: ANTHROPIC_API_KEY');
    return new ClaudeTextProvider(
      new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }),
      env.CLAUDE_TEXT_MODEL ?? 'claude-opus-4-8',
    );
  }
  const client = new OpenAI({
    baseURL: env.QWEN_BASE_URL ?? 'http://localhost:11434/v1',
    apiKey: env.QWEN_API_KEY ?? 'not-needed',
  });
  return new OpenAiCompatibleTextProvider('qwen', client, env.QWEN_TEXT_MODEL ?? env.QWEN_MODEL ?? 'qwen2.5:7b');
}
