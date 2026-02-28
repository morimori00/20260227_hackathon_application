export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamEvent {
  type: 'content' | 'tool_start' | 'tool_result' | 'done';
  content?: string;
  code?: string;
  output?: string;
}

export type ModelType = 'normal' | 'local';

export async function sendChatStream(
  messages: ChatMessage[],
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
  model: ModelType = 'normal'
) {
  const response = await fetch('/api/v1/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event: StreamEvent = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // skip malformed events
        }
      }
    }
  }
}
