const MARKDOWN_LIST_RE = /^(\s*)([-*+]|\d+\.)\s+/;
const MARKDOWN_HEADING_RE = /^#{1,6}\s/;
const MARKDOWN_TABLE_RE = /^\|/;
const MARKDOWN_HR_RE = /^(-{3,}|\*{3,}|_{3,})$/;
const BOLD_ONLY_RE = /^\*\*(.+)\*\*$/;
const NUMBERED_SECTION_RE = /^(\d+)\.\s+(.+)$/;
const SUBSECTION_LABEL_RE = /^([A-Za-z][^:\n]{1,48}):\s*$/;

function isListLikeLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (MARKDOWN_LIST_RE.test(trimmed)) return false;
  if (MARKDOWN_HEADING_RE.test(trimmed)) return false;
  if (MARKDOWN_TABLE_RE.test(trimmed)) return false;
  if (MARKDOWN_HR_RE.test(trimmed)) return false;
  if (SUBSECTION_LABEL_RE.test(trimmed)) return false;
  if (trimmed.endsWith(':') && trimmed.length < 220) return false;
  if (trimmed.length > 180) return false;
  return true;
}

function isSectionHeaderLine(line) {
  const trimmed = line.trim();
  const withoutTrailingBold = trimmed.replace(/\*+$/, '').trim();
  return withoutTrailingBold.endsWith(':') && trimmed.length < 220;
}

function promoteBoldLine(line) {
  const trimmed = line.trim();
  const boldMatch = trimmed.match(BOLD_ONLY_RE);
  if (boldMatch) {
    const inner = boldMatch[1].trim();
    if (inner.length > 120) return `## ${inner}`;
    if (/^\d+\.\s/.test(inner)) return `### ${inner}`;
    if (/advice|summary|conclusion|note|important/i.test(inner)) return `### ${inner}`;
    return `## ${inner}`;
  }

  if (NUMBERED_SECTION_RE.test(trimmed) && trimmed.length < 160) {
    return `### ${trimmed}`;
  }

  return line;
}

function promoteSubsectionLabel(line) {
  const trimmed = line.trim();
  if (SUBSECTION_LABEL_RE.test(trimmed)) {
    return `#### ${trimmed.replace(/:$/, '')}`;
  }
  return line;
}

function convertPlainLists(lines) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isSectionHeaderLine(line) && i + 1 < lines.length) {
      const listLines = [];
      let j = i + 1;

      while (j < lines.length && isListLikeLine(lines[j])) {
        listLines.push(lines[j].trim());
        j += 1;
      }

      if (listLines.length >= 2) {
        out.push(line);
        for (const item of listLines) {
          out.push(`- ${item}`);
        }
        i = j;
        continue;
      }
    }

    out.push(line);
    i += 1;
  }

  return out;
}

/**
 * Normalize AI chat markdown: headings, bullets, numbered sections, subsection labels.
 */
export function normalizeChatMarkdown(text) {
  if (!text || typeof text !== 'string') return text;

  let normalized = text.replace(/\r\n/g, '\n');
  normalized = normalized.replace(/^[\u2022•]\s+/gm, '- ');
  normalized = normalized.replace(/^(\s*)\*\s+(?!\*)/gm, '$1- ');

  const withLists = convertPlainLists(normalized.split('\n'));

  return withLists
    .map((line) => promoteBoldLine(line))
    .map((line) => promoteSubsectionLabel(line))
    .join('\n');
}
