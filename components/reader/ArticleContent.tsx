"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { DefuddleResponse } from "defuddle/node";

function wrapWordsInPlace(container: HTMLElement): void {
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
          span.setAttribute("data-w", String(wordIndex++));
          span.textContent = token;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(token));
        }
      }

      node.parentNode?.replaceChild(fragment, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName.toLowerCase();
      if (tag === "script" || tag === "style") return;
      Array.from(node.childNodes).forEach(walk);
    }
  }

  if (container.querySelector("[data-w]")) return;

  Array.from(container.childNodes).forEach(walk);
}

interface ArticleContentProps {
  article: DefuddleResponse;
  mutedColor: string;
  activeWordIndex: number;
}

export function ArticleContent({
  article,
  mutedColor,
  activeWordIndex,
}: ArticleContentProps) {
  const readingTime = Math.ceil((article.wordCount ?? 0) / 200);
  const bodyRef = useRef<HTMLDivElement>(null);
  const prevHighlightRef = useRef<Element | null>(null);

  // Wrap words in-place after mount — direct DOM mutation, no re-render needed
  useEffect(() => {
    if (bodyRef.current) {
      wrapWordsInPlace(bodyRef.current);
      console.log(
        "[ondoku] word spans:",
        bodyRef.current.querySelectorAll("[data-w]").length,
      );
    }
  }, []);

  // Highlight active word via direct DOM manipulation — avoids re-rendering the article
  useEffect(() => {
    if (prevHighlightRef.current) {
      prevHighlightRef.current.classList.remove("r-word-highlight");
      prevHighlightRef.current = null;
    }
    if (activeWordIndex < 0 || !bodyRef.current) return;
    const el = bodyRef.current.querySelector(`[data-w="${activeWordIndex}"]`);
    if (el) {
      el.classList.add("r-word-highlight");
      prevHighlightRef.current = el;
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeWordIndex]);

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
            {article.author && article.published && (
              <span className="r-meta-sep">·</span>
            )}
            {article.published && (
              <span>
                {new Date(article.published).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {(article.author || article.published) && (
              <span className="r-meta-sep">·</span>
            )}
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
