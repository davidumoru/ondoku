"use client";

import Image from "next/image";
import type { DefuddleResponse } from "defuddle/node";

interface ArticleContentProps {
  article: DefuddleResponse;
  mutedColor: string;
}

export function ArticleContent({ article, mutedColor }: ArticleContentProps) {
  const readingTime = Math.ceil((article.wordCount ?? 0) / 200);

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
          className="r-article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </main>
  );
}
