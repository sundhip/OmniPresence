"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface FormattedMessageProps {
  text: string;
  isUser?: boolean;
}

/**
 * Parses markdown-like text:
 * - Code blocks (```lang ... ```) with syntax styling and copy-to-clipboard button
 * - Bold (**text**) into <strong>
 * - Italics (*text*) into <em>
 * - Bullet points (•, -, *) into styled list rows with colored bullets
 * - Eliminates raw markdown markers
 */
export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, isUser = false }) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  if (!text) return null;

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Render inline formatting (bold, italic, inline code)
  const renderInline = (content: string) => {
    // Clean up redundant quote asterisk combinations like *"quote"* -> "quote"
    let clean = content.replace(/\*["']([^"']+)["']\*/g, `"$1"`);

    const parts: React.ReactNode[] = [];
    let remaining = clean;
    let keyIdx = 0;

    // Match **bold**, *italic*, or `inline code`
    const formatRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/;

    while (remaining.length > 0) {
      const match = remaining.match(formatRegex);
      if (!match || match.index === undefined) {
        parts.push(remaining);
        break;
      }

      const matchIndex = match.index;
      if (matchIndex > 0) {
        parts.push(remaining.substring(0, matchIndex));
      }

      const matchedToken = match[0];
      if (matchedToken.startsWith("**") && matchedToken.endsWith("**")) {
        const inner = matchedToken.slice(2, -2);
        parts.push(
          <strong
            key={`b_${keyIdx++}`}
            className={isUser ? "font-bold text-white" : "font-bold text-[var(--text-primary)]"}
          >
            {inner}
          </strong>
        );
      } else if (matchedToken.startsWith("*") && matchedToken.endsWith("*")) {
        const inner = matchedToken.slice(1, -1);
        parts.push(
          <em key={`i_${keyIdx++}`} className="italic opacity-95">
            {inner}
          </em>
        );
      } else if (matchedToken.startsWith("`") && matchedToken.endsWith("`")) {
        const inner = matchedToken.slice(1, -1);
        parts.push(
          <code
            key={`c_${keyIdx++}`}
            className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
              isUser
                ? "bg-white/20 text-white"
                : "bg-[var(--surface-soft)] text-[var(--primary)] border border-[var(--border-subtle)]"
            }`}
          >
            {inner}
          </code>
        );
      } else {
        parts.push(matchedToken);
      }

      remaining = remaining.substring(matchIndex + matchedToken.length);
    }

    return parts;
  };

  // Check if text has multiline code blocks (```lang ... ```)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const segments: { type: "text" | "code"; content: string; language?: string }[] = [];

  let lastIndex = 0;
  let codeMatch: RegExpExecArray | null;

  while ((codeMatch = codeBlockRegex.exec(text)) !== null) {
    if (codeMatch.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex, codeMatch.index),
      });
    }

    segments.push({
      type: "code",
      language: codeMatch[1] || "code",
      content: codeMatch[2].trim(),
    });

    lastIndex = codeMatch.index + codeMatch[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  return (
    <div className="space-y-2 leading-relaxed">
      {segments.map((segment, segIdx) => {
        if (segment.type === "code") {
          const isCopied = copiedCodeIdx === segIdx;
          return (
            <div
              key={`code_${segIdx}`}
              className="my-3 rounded-2xl bg-[#1E1E2E] text-[#CDD6F4] border border-[#313244] overflow-hidden text-xs shadow-md"
            >
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#181825] border-b border-[#313244] text-[#A6ADC8] font-mono text-[11px]">
                <span className="font-semibold uppercase tracking-wider">{segment.language}</span>
                <button
                  onClick={() => handleCopyCode(segment.content, segIdx)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#313244] transition-colors text-[10px] text-[#BAC2DE]"
                  title="Copy code"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto font-mono text-[11px] leading-relaxed">
                <code>{segment.content}</code>
              </pre>
            </div>
          );
        }

        const lines = segment.content.split("\n");

        return (
          <div key={`txt_${segIdx}`} className="space-y-1.5">
            {lines.map((line, idx) => {
              const trimmed = line.trim();

              if (!trimmed) {
                return <div key={idx} className="h-1" />;
              }

              if (trimmed.startsWith("•") || trimmed.startsWith("- ") || (trimmed.startsWith("* ") && !trimmed.startsWith("**"))) {
                const bulletContent = trimmed.replace(/^[•\-\*]\s*/, "");
                return (
                  <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        isUser ? "bg-white" : "bg-[var(--primary)]"
                      }`}
                    />
                    <span className="flex-1">{renderInline(bulletContent)}</span>
                  </div>
                );
              }

              return (
                <p key={idx} className={isUser ? "text-white" : "text-[var(--text-primary)]"}>
                  {renderInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
