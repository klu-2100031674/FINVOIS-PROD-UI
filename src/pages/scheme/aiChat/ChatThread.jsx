import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

const ChatThread = ({ messages, isLoading }) => {
  const endRef = useRef(null);

  const lastAssistantContent =
    messages.length > 0 ? messages[messages.length - 1]?.content : '';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading, lastAssistantContent]);

  const last = messages[messages.length - 1];
  const showThinking =
    isLoading && last?.role === 'assistant' && !String(last?.content || '').trim();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-3 p-4 sm:p-6">
        {messages.map((m) => {
          const isEmptyStreamingAssistant =
            isLoading && m.role === 'assistant' && !String(m.content || '').trim();
          if (isEmptyStreamingAssistant) return null;
          return <ChatMessage key={m.id} role={m.role} content={m.content} />;
        })}

        {showThinking && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-white border border-gray-200 shadow-sm text-gray-700">
              Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default ChatThread;
