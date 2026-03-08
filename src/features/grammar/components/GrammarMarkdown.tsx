import type { ReactNode } from "react";

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}:${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}:${index}`}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}:${index}`}>{part.slice(1, -1)}</code>;
    }

    return <span key={`${part}:${index}`}>{part}</span>;
  });
}

type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let unorderedItems: string[] = [];
  let orderedItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" ").replace(/\s+/g, " ").trim(),
    });
    paragraphLines = [];
  };

  const flushUnordered = () => {
    if (unorderedItems.length === 0) {
      return;
    }

    blocks.push({ type: "unordered-list", items: unorderedItems });
    unorderedItems = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length === 0) {
      return;
    }

    blocks.push({ type: "ordered-list", items: orderedItems });
    orderedItems = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushUnordered();
    flushOrdered();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flushAll();
      continue;
    }

    if (line.startsWith("### ")) {
      flushAll();
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushOrdered();
      unorderedItems.push(line.slice(2).trim());
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushUnordered();
      orderedItems.push(orderedMatch[1].trim());
      continue;
    }

    paragraphLines.push(line);
  }

  flushAll();
  return blocks;
}

type GrammarMarkdownProps = {
  markdown: string;
};

export function GrammarMarkdown({ markdown }: GrammarMarkdownProps) {
  const blocks = parseMarkdownBlocks(markdown);

  return (
    <div className="grammar-doc__body">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h4" : "h5";
          return (
            <Tag key={`heading:${index}`} className="grammar-doc__heading">
              {renderInlineMarkdown(block.text)}
            </Tag>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={`ul:${index}`} className="grammar-doc__list">
              {block.items.map((item, itemIndex) => (
                <li key={`ul:${index}:${itemIndex}`} className="grammar-doc__list-item">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={`ol:${index}`} className="grammar-doc__list grammar-doc__list--ordered">
              {block.items.map((item, itemIndex) => (
                <li key={`ol:${index}:${itemIndex}`} className="grammar-doc__list-item">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`p:${index}`} className="grammar-doc__paragraph">
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}
