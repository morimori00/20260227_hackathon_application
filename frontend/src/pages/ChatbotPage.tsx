import { useState, useRef, useEffect } from 'react';
import MessageBubble from '@/components/chatbot/MessageBubble';
import CodeBlock from '@/components/chatbot/CodeBlock';
import ChatInput from '@/components/chatbot/ChatInput';
import { sendChatStream, type ChatMessage, type StreamEvent, type ModelType } from '@/api/chatbot';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  codeBlocks: { code: string; output: string }[];
}

const EXAMPLE_PROMPTS = [
  'How many transactions are flagged as suspicious?',
  'What are the top 5 banks by fraud count?',
  'Show the distribution of payment formats',
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('normal');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const handleSend = async (text: string) => {
    const userMsg: DisplayMessage = { role: 'user', content: text, codeBlocks: [] };
    const assistantMsg: DisplayMessage = { role: 'assistant', content: '', codeBlocks: [] };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const apiMessages: ChatMessage[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    abortRef.current = new AbortController();

    try {
      await sendChatStream(
        apiMessages,
        (event: StreamEvent) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.codeBlocks = [...last.codeBlocks];

            switch (event.type) {
              case 'content':
                last.content += event.content || '';
                break;
              case 'tool_start':
                last.codeBlocks.push({ code: event.code || '', output: '' });
                break;
              case 'tool_result':
                if (last.codeBlocks.length > 0) {
                  const lastBlock = last.codeBlocks[last.codeBlocks.length - 1];
                  last.codeBlocks[last.codeBlocks.length - 1] = {
                    code: lastBlock.code,
                    output: event.output || '',
                  };
                }
                break;
            }

            updated[updated.length - 1] = last;
            return updated;
          });
        },
        abortRef.current.signal,
        selectedModel
      );
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages((prev) => {
          const updated = [...prev];
          const last = { ...updated[updated.length - 1] };
          last.content += '\n\n[Error: Failed to get response]';
          updated[updated.length - 1] = last;
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const isAssistantEmpty =
    streaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    !messages[messages.length - 1].content &&
    messages[messages.length - 1].codeBlocks.length === 0;

  return (
    <div className="flex flex-col h-full max-w-[900px] mx-auto">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Analysis Chatbot</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ask questions about the transaction data. The assistant can execute Python/pandas code to analyze the live dataset.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border bg-muted p-1 shrink-0">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedModel === 'normal'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedModel('normal')}
              disabled={streaming}
            >
              normal
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedModel === 'local'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setSelectedModel('local')}
              disabled={streaming}
            >
              local
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-16">
            <p className="mb-4">Try asking:</p>
            <div className="flex flex-col items-center gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="px-4 py-2 rounded-lg border bg-background hover:bg-muted transition-colors text-foreground text-left max-w-md w-full"
                  onClick={() => handleSend(prompt)}
                  disabled={streaming}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content}>
            {msg.codeBlocks.map((block, j) => (
              <CodeBlock key={j} code={block.code} output={block.output} />
            ))}
          </MessageBubble>
        ))}

        {isAssistantEmpty && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 thinking-glow">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-6 pt-0">
        <ChatInput onSend={handleSend} disabled={streaming} />
      </div>

      <style>{`
        .thinking-glow {
          animation: glow 2s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
      `}</style>
    </div>
  );
}
