import { useCallback, useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

const bubbleBase =
  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border';

/**
 * Markdown renderer for assistant replies.
 * User messages bypass markdown and render as pre-wrapped plain text.
 */
const markdownComponents = {
  h1: (props) => <h1 className="text-base font-bold mt-3 mb-2 first:mt-0" {...props} />,
  h2: (props) => <h2 className="text-base font-bold mt-3 mb-2 first:mt-0" {...props} />,
  h3: (props) => <h3 className="text-sm font-bold mt-3 mb-2 first:mt-0" {...props} />,
  h4: (props) => <h4 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props} />,
  h5: (props) => <h5 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props} />,
  h6: (props) => <h6 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props} />,
  p: (props) => <p className="mb-2 last:mb-0" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-700 my-2" {...props} />
  ),
  code: ({ inline, className, children, ...props }) =>
    inline ? (
      <code
        className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-[0.85em] font-mono"
        {...props}
      >
        {children}
      </code>
    ) : (
      <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ),
  a: (props) => (
    <a
      className="text-purple-700 underline hover:text-purple-900"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  hr: () => <hr className="my-3 border-gray-200" />,
  table: (props) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-xs border border-gray-200" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-gray-50" {...props} />,
  th: (props) => (
    <th className="border border-gray-200 px-2 py-1 text-left font-semibold" {...props} />
  ),
  td: (props) => <td className="border border-gray-200 px-2 py-1 align-top" {...props} />,
};

const ChatMessage = ({ role, content }) => {
  const isUser = role === 'user';
  const text = String(content ?? '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    const value = text.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Response copied');
    } catch {
      toast.error('Could not copy response');
    }
  }, [text]);

  const bubble = (
    <div
      className={
        isUser
          ? `${bubbleBase} bg-gray-900 text-white border-gray-900 whitespace-pre-wrap`
          : `${bubbleBase} bg-white text-gray-900 border-gray-200`
      }
    >
      {isUser ? (
        text
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {text}
        </ReactMarkdown>
      )}
    </div>
  );

  if (isUser) {
    return <div className="flex justify-end">{bubble}</div>;
  }

  const canCopy = Boolean(text.trim());

  return (
    <div className="flex justify-start w-full">
      <div className="flex flex-col items-start gap-1.5 max-w-[85%]">
      {bubble}
      {canCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
          aria-label="Copy response"
        >
          <Copy className="w-3.5 h-3.5" aria-hidden />
          {copied ? 'Copied' : 'Copy response'}
        </button>
      )}
      </div>
    </div>
  );
};

export default ChatMessage;
