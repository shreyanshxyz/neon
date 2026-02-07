import type { ParsedQuery } from './FileIndexer.js';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FileContext {
  path: string;
  name: string;
  content?: string;
  size?: number;
  modified?: string;
}

class OllamaService {
  private baseUrl = 'http://localhost:11434';
  private defaultModel = 'llama3.2';

  async checkConnection(): Promise<{ available: boolean; models: string[] }> {
    try {
      const models = await this.listModels();
      return { available: true, models };
    } catch (error) {
      console.error('Ollama connection failed:', error);
      return { available: false, models: [] };
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = (await response.json()) as { models?: { name: string }[] };
    return (data.models || []).map((model) => model.name);
  }

  async isModelAvailable(model: string): Promise<boolean> {
    const models = await this.listModels();
    return models.includes(model);
  }

  getFallbackModel(models?: string[]): string {
    if (models && models.length > 0) {
      return models.includes(this.defaultModel) ? this.defaultModel : models[0];
    }
    return this.defaultModel;
  }

  async chat(messages: ChatMessage[], model?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.status}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content || '';
  }

  async *streamChat(messages: ChatMessage[], model?: string): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Streaming chat failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          try {
            const parsed = JSON.parse(line) as { message?: { content?: string } };
            const chunk = parsed.message?.content || '';
            if (chunk) {
              yield chunk;
            }
          } catch (error) {
            console.warn('Failed to parse stream chunk:', error);
          }
        }
        newlineIndex = buffer.indexOf('\n');
      }
    }
  }

  async generateSearchQuery(query: string, fileContext?: FileContext): Promise<ParsedQuery> {
    const systemPrompt =
      'You are a file search assistant. Convert the user query into a JSON object matching this TypeScript type: ' +
      '{ keywords: string[]; fileTypes?: string[]; dateRange?: { start: string; end: string }; sizeRange?: { min?: number; max?: number }; namePattern?: string; contentQuery?: string }. ' +
      'Return only valid JSON, no markdown. Use ISO dates. Use empty array for keywords if none.';

    const contextBlock = fileContext
      ? `\nFile context (only if relevant):\nName: ${fileContext.name}\nPath: ${fileContext.path}\nSize: ${fileContext.size ?? 'unknown'}\nModified: ${fileContext.modified ?? 'unknown'}\nContent:\n${fileContext.content ?? ''}`
      : '';

    const userPrompt = `Query: ${query}${contextBlock}`;

    const response = await this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    try {
      const parsed = JSON.parse(response) as ParsedQuery;
      return this.normalizeParsedQuery(parsed);
    } catch (error) {
      console.warn('Failed to parse LLM JSON, falling back to keywords only:', error);
      return this.normalizeParsedQuery({ keywords: query.split(/\s+/).filter(Boolean) });
    }
  }

  private normalizeParsedQuery(parsed: ParsedQuery): ParsedQuery {
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      fileTypes: parsed.fileTypes,
      dateRange: parsed.dateRange,
      sizeRange: parsed.sizeRange,
      namePattern: parsed.namePattern,
      contentQuery: parsed.contentQuery,
    };
  }
}

export type { ChatMessage, FileContext };
export { OllamaService };
export default OllamaService;
