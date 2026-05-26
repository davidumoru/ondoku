"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import type { DefuddleResponse } from "defuddle/node";

const WORD_ATTR = "data-ondoku-word";
const HIGHLIGHT_CLASS = "r-word-highlight";

function wrapWords(container: HTMLElement): void {
  if (container.querySelector(`[${WORD_ATTR}]`)) return;

  let wordIndex = 0;

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!text.trim()) return;

      const tokens = text.split(/(\s+)/);
      const fragment = document.createDocumentFragment();
      for (const token of tokens) {
        if (/\S/.test(token)) {
          const span = document.createElement("span");
          span.setAttribute(WORD_ATTR, String(wordIndex++));
          span.textContent = token;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(token));
        }
      }
      node.parentNode?.replaceChild(fragment, node);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return;
      Array.from(node.childNodes).forEach(walk);
    }
  }

  Array.from(container.childNodes).forEach(walk);
}

function isOffScreen(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  const margin = 80;
  return rect.top < margin || rect.bottom > window.innerHeight - margin;
}

interface Props {
  article: DefuddleResponse;
  mutedColor: string;
  activeWordIndex: number;
  highlightEnabled: boolean;
}

export function ArticleContent({
  article,
  mutedColor,
  activeWordIndex,
  highlightEnabled,
}: Props) {
  const readingTime = Math.max(1, Math.ceil((article.wordCount ?? 0) / 200));
  const bodyRef = useRef<HTMLDivElement>(null);
  const prevHighlightRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    if (highlightEnabled && bodyRef.current) wrapWords(bodyRef.current);
  });

  useEffect(() => {
    if (prevHighlightRef.current) {
      prevHighlightRef.current.classList.remove(HIGHLIGHT_CLASS);
      prevHighlightRef.current = null;
    }
    if (!highlightEnabled || activeWordIndex < 0 || !bodyRef.current) return;
    const el = bodyRef.current.querySelector(`[${WORD_ATTR}="${activeWordIndex}"]`);
    if (!el) return;
    el.classList.add(HIGHLIGHT_CLASS);
    prevHighlightRef.current = el;
    if (isOffScreen(el)) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeWordIndex, highlightEnabled]);

  return (
    <main>
      <div className="r-article">
        <div className="r-article-header">
          {article.image && (
            <Image
              src={article.image}
              alt={article.title ?? ""}
              width={0}
              height={0}
              sizes="100vw"
              unoptimized
              className="r-hero"
            />
          )}
          <h1 className="r-title">{article.title}</h1>
          <div className="r-meta" style={{ color: mutedColor }}>
            {article.author && <span>{article.author}</span>}
            {article.author && article.published && <span className="r-meta-sep">·</span>}
            {article.published && (
              <span>
                {new Date(article.published).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {(article.author || article.published) && <span className="r-meta-sep">·</span>}
            <span>{readingTime} min read</span>
          </div>
        </div>

        <div
          ref={bodyRef}
          className="r-article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </main>
  );
}
