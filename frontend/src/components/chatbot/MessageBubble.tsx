interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  children?: React.ReactNode;
}

export default function MessageBubble({ role, content, children }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
          isUser
            ? 'bg-foreground text-background'
            : 'bg-muted'
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {children}
      </div>
    </div>
  );
}
