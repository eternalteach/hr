"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className }: Props) {
  return (
    <div className={cn("md-view text-sm text-gray-800 leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: p => <h1 className="text-xl font-semibold mt-4 mb-2 text-gray-900" {...p} />,
          h2: p => <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900" {...p} />,
          h3: p => <h3 className="text-base font-semibold mt-3 mb-1.5 text-gray-900" {...p} />,
          h4: p => <h4 className="text-sm font-semibold mt-3 mb-1 text-gray-900" {...p} />,
          p: p => <p className="my-2" {...p} />,
          ul: p => <ul className="list-disc pl-5 my-2 space-y-1" {...p} />,
          ol: p => <ol className="list-decimal pl-5 my-2 space-y-1" {...p} />,
          li: p => <li className="leading-relaxed" {...p} />,
          a: p => <a className="text-blue-600 hover:underline" target="_blank" rel="noreferrer" {...p} />,
          blockquote: p => (
            <blockquote className="border-l-4 border-gray-200 pl-3 my-2 text-gray-600 italic" {...p} />
          ),
          code: ({ className: cls, children, ...rest }) => {
            const isBlock = /language-/.test(cls ?? "");
            if (isBlock) {
              return (
                <code className={cn("block bg-gray-50 border border-gray-200 rounded-md p-3 text-xs font-mono overflow-auto", cls)} {...rest}>
                  {children}
                </code>
              );
            }
            return <code className="bg-gray-100 text-pink-700 rounded px-1 py-0.5 text-xs font-mono" {...rest}>{children}</code>;
          },
          pre: p => <pre className="my-2" {...p} />,
          table: p => (
            <div className="overflow-auto my-2">
              <table className="w-full text-xs border border-gray-200 rounded-md" {...p} />
            </div>
          ),
          thead: p => <thead className="bg-gray-50" {...p} />,
          th: p => <th className="px-3 py-2 text-left font-medium border-b border-gray-200" {...p} />,
          td: p => <td className="px-3 py-2 border-b border-gray-100" {...p} />,
          hr: () => <hr className="my-4 border-gray-200" />,
          // eslint-disable-next-line @next/next/no-img-element
          img: p => <img className="max-w-full rounded-md my-2" alt="" {...p} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** 마크다운 문법을 제거하고 한 줄 미리보기용 평문을 반환 */
export function stripMarkdown(src: string): string {
  if (!src) return "";
  return src
    .replace(/```[\s\S]*?```/g, " ")        // 코드 블록
    .replace(/`([^`]*)`/g, "$1")             // 인라인 코드
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")  // 이미지
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 링크 → 텍스트
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")      // 헤더 마커
    .replace(/^\s{0,3}>\s?/gm, "")           // 인용
    .replace(/^\s*[-*+]\s+/gm, "")           // 리스트
    .replace(/^\s*\d+\.\s+/gm, "")           // 순서 리스트
    .replace(/(\*\*|__)(.*?)\1/g, "$2")      // 굵게
    .replace(/(\*|_)(.*?)\1/g, "$2")         // 기울임
    .replace(/~~(.*?)~~/g, "$1")             // 취소선
    .replace(/\s+/g, " ")                     // 공백 정리
    .trim();
}
