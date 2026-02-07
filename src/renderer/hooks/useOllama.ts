import { useCallback, useEffect, useMemo, useState } from 'react';

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

export function useOllama() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseOllama = useMemo(() => Boolean(window.ollama), []);

  const checkConnection = useCallback(async () => {
    if (!window.ollama) {
      setIsAvailable(false);
      setModels([]);
      setSelectedModel('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const status = await window.ollama.check();
      setIsAvailable(status.available);
      setModels(status.models || []);
      setSelectedModel(status.defaultModel || status.models?.[0] || '');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to Ollama';
      setIsAvailable(false);
      setModels([]);
      setSelectedModel('');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canUseOllama) {
      checkConnection();
    }
  }, [canUseOllama, checkConnection]);

  const sendMessage = useCallback(
    async (message: string, context?: FileContext) => {
      if (!window.ollama) {
        const errorMsg = 'Ollama is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      setError(null);

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content:
            'You are a helpful assistant for a file manager app. Keep answers concise and practical.',
        },
      ];

      if (context) {
        messages.push({
          role: 'system',
          content: `File context:\nName: ${context.name}\nPath: ${context.path}\nSize: ${
            context.size ?? 'unknown'
          }\nModified: ${context.modified ?? 'unknown'}\nContent:\n${context.content ?? ''}`,
        });
      }

      messages.push({ role: 'user', content: message });

      try {
        const response = await window.ollama.chat({
          messages,
          model: selectedModel || undefined,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        return response.response;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedModel]
  );

  const streamMessage = useCallback(
    async (
      message: string,
      onChunk: (chunk: string) => void,
      context?: FileContext,
      conversationHistory?: ChatMessage[]
    ) => {
      if (!window.ollama) {
        const errorMsg = 'Ollama is not available';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      setError(null);

      const messages: ChatMessage[] = [
        {
          role: 'system',
          content:
            'You are a helpful assistant for a file manager app. Keep answers concise and practical.',
        },
      ];

      if (context) {
        messages.push({
          role: 'system',
          content: `File context:\nName: ${context.name}\nPath: ${context.path}\nSize: ${
            context.size ?? 'unknown'
          }\nModified: ${context.modified ?? 'unknown'}\nContent:\n${context.content ?? ''}`,
        });
      }

      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      }

      messages.push({ role: 'user', content: message });

      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      return new Promise<{ cleanup: () => void }>((resolve, reject) => {
        let cleanupFn: (() => void) | undefined;

        cleanupFn = window.ollama?.streamChat(
          { requestId, messages, model: selectedModel || undefined },
          (chunk) => onChunk(chunk),
          () => {
            setIsLoading(false);
          },
          (err) => {
            setIsLoading(false);
            const errorMsg = err || 'Streaming failed';
            setError(errorMsg);
            reject(new Error(errorMsg));
          }
        );

        resolve({ cleanup: cleanupFn || (() => {}) });
      });
    },
    [selectedModel]
  );

  const generateSearch = useCallback(async (query: string, context?: FileContext) => {
    if (!window.ollama) {
      const errorMsg = 'Ollama is not available';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.ollama.generateSearch({ query, context });
      if (!response.success || !response.parsedQuery) {
        throw new Error(response.error || 'AI search failed');
      }
      return response.parsedQuery;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI search failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAvailable,
    models,
    selectedModel,
    setSelectedModel,
    isLoading,
    error,
    checkConnection,
    sendMessage,
    streamMessage,
    generateSearch,
  };
}

export default useOllama;
