import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeChatMarkdown } from '../../utils/normalizeChatMarkdown';

function buildMarkdownComponents(isUser) {
  const body = isUser ? 'text-[0.8125rem] text-white/95' : 'text-[0.8125rem] text-slate-700';
  const bodyLeading = 'leading-[1.65]';

  const heading1 = isUser
    ? 'text-[1.05rem] font-bold text-white leading-snug'
    : 'text-[1.05rem] font-bold text-slate-900 leading-snug';
  const heading2 = isUser
    ? 'text-[0.95rem] font-bold text-white leading-snug'
    : 'text-[0.95rem] font-bold text-slate-900 leading-snug';
  const heading3 = isUser
    ? 'text-[0.875rem] font-semibold text-white leading-snug'
    : 'text-[0.875rem] font-semibold text-slate-900 leading-snug';
  const heading4 = isUser
    ? 'text-[0.8125rem] font-semibold text-white/95 leading-snug'
    : 'text-[0.8125rem] font-semibold text-slate-800 leading-snug';

  const strong = isUser ? 'font-semibold text-white' : 'font-semibold text-slate-900';
  const em = isUser ? 'italic text-white/90' : 'italic text-slate-600';
  const listMarker = isUser ? 'marker:text-white/70' : 'marker:text-slate-500';

  const codeClass = isUser
    ? 'bg-white/15 text-white px-1.5 py-0.5 rounded text-[0.75rem] font-mono'
    : 'bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[0.75rem] font-mono';
  const preClass = isUser
    ? 'bg-white/10 text-white p-3 rounded-lg overflow-x-auto my-3 text-[0.75rem] font-mono'
    : 'bg-slate-50 text-slate-800 p-3 rounded-lg overflow-x-auto my-3 text-[0.75rem] font-mono border border-slate-200';

  const blockquoteClass = isUser
    ? 'border-l-4 border-white/50 bg-white/10 pl-4 pr-3 py-2.5 my-3 rounded-r-lg text-white/95'
    : 'border-l-4 border-slate-800 bg-slate-50 pl-4 pr-3 py-2.5 my-3 rounded-r-lg text-slate-700';

  return {
    p: ({ children }) => (
      <p className={`m-0 mb-2.5 last:mb-0 ${body} ${bodyLeading}`}>{children}</p>
    ),
    strong: ({ children }) => <strong className={strong}>{children}</strong>,
    b: ({ children }) => <b className={strong}>{children}</b>,
    em: ({ children }) => <em className={em}>{children}</em>,
    h1: ({ children }) => (
      <h1 className={`${heading1} mt-1 mb-3 pb-2 border-b ${isUser ? 'border-white/20' : 'border-slate-200'}`}>
        {children}
      </h1>
    ),
    h2: ({ children }) => <h2 className={`${heading2} mt-4 mb-2 first:mt-0`}>{children}</h2>,
    h3: ({ children }) => (
      <h3
        className={`${heading3} mt-3.5 mb-1.5 first:mt-0 ${
          isUser ? '' : 'pl-2.5 border-l-[3px] border-slate-800'
        }`}
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => <h4 className={`${heading4} mt-2.5 mb-1`}>{children}</h4>,
    h5: ({ children }) => <h5 className={`${heading4} mt-2 mb-1`}>{children}</h5>,
    h6: ({ children }) => <h6 className={`${heading4} mt-2 mb-1`}>{children}</h6>,
    ul: ({ children }) => (
      <ul className={`my-2.5 pl-5 list-disc space-y-1.5 ${listMarker} ${body}`}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={`my-2.5 pl-5 list-decimal space-y-1.5 ${listMarker} ${body}`}>{children}</ol>
    ),
    li: ({ children }) => (
      <li className={`${bodyLeading} pl-0.5 [&>p]:mb-1 [&>p]:last:mb-0`}>{children}</li>
    ),
    blockquote: ({ children }) => <blockquote className={blockquoteClass}>{children}</blockquote>,
    code: ({ children }) => <code className={codeClass}>{children}</code>,
    pre: ({ children }) => <pre className={preClass}>{children}</pre>,
    hr: () => <hr className={`my-4 ${isUser ? 'border-white/25' : 'border-slate-200'}`} />,
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={
          isUser
            ? 'text-white underline underline-offset-2 font-medium hover:text-white/80'
            : 'text-blue-700 hover:text-blue-900 underline underline-offset-2 font-medium'
        }
      >
        {children}
      </a>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
        <table className="table-auto w-full border-collapse text-[0.8125rem]">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={isUser ? 'bg-white/10' : 'bg-slate-100'}>{children}</thead>
    ),
    th: ({ children }) => (
      <th
        className={`border px-3 py-2 text-left font-semibold ${
          isUser ? 'border-white/20 text-white' : 'border-slate-200 text-slate-800'
        }`}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        className={`border px-3 py-2 align-top ${
          isUser ? 'border-white/15 text-white/95' : 'border-slate-200 text-slate-700'
        }`}
      >
        {children}
      </td>
    ),
  };
}

export default function SchemeAiChatMarkdown({ text, isUser = false }) {
  const components = buildMarkdownComponents(isUser);

  return (
    <div
      className={`scheme-ai-chat-md max-w-none break-words ${
        isUser ? 'text-white' : 'text-slate-700'
      } [&_ul]:list-disc [&_ol]:list-decimal [&_li]:text-[0.8125rem] [&_td]:text-[0.8125rem]`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {normalizeChatMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}
