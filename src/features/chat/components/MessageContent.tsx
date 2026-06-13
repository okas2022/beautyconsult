"use client";

import { splitMessageWithLinks } from "@/lib/chat/parse-youtube-links";

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  const segments = splitMessageWithLinks(content);

  return (
    <p className="whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.type === "link" ? (
          <a
            key={i}
            href={seg.value}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-mint-dark underline underline-offset-2 hover:text-mint"
          >
            {seg.value}
          </a>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </p>
  );
}
