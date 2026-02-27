interface CodeBlockProps {
  code: string;
  output: string;
}

export default function CodeBlock({ code, output }: CodeBlockProps) {
  return (
    <div className="mt-2 border rounded text-xs overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 text-muted-foreground">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-medium">Python Code</span>
      </div>
      <pre className="p-3 bg-zinc-900 text-zinc-100 overflow-x-auto">
        <code>{code}</code>
      </pre>
      {output && (
        <>
          <div className="px-3 py-1 bg-muted/50 text-muted-foreground font-medium border-t">
            Output
          </div>
          <pre className="p-3 bg-zinc-50 dark:bg-zinc-900 overflow-x-auto text-foreground">
            <code>{output}</code>
          </pre>
        </>
      )}
    </div>
  );
}
