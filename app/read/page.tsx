import { extractArticle } from "@/lib/extract";
import { Reader } from "@/components/reader";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const maxDuration = 60;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ url?: string }>;
}

export default async function ReadPage({ searchParams }: Props) {
  const { url } = await searchParams;
  if (!url) redirect("/");

  const article = await extractArticle(url);

  return <Reader article={article} sourceUrl={url} />;
}
