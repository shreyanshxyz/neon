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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data = (await response.json()) as { models?: { name: string }[] };
      return (data.models || []).map((model) => model.name);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for chat

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          stream: false,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data = (await response.json()) as { message?: { content?: string } };
      return data.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async *streamChat(messages: ChatMessage[], model?: string): AsyncGenerator<string> {
    const controller = new AbortController();
    // No timeout for streaming - it can take a while

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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

      try {
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
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted');
        return;
      }
      throw error;
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

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7).trim();
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3).trim();
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3).trim();
      }

      const parsed = JSON.parse(cleanedResponse) as ParsedQuery;
      return this.normalizeParsedQuery(parsed);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
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
