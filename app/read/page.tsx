import { extractArticle } from "@/lib/extract";
import { Reader } from "@/components/reader";
import { redirect } from "next/navigation";

export const maxDuration = 60;

interface Props {
  searchParams: Promise<{ url?: string }>;
}

export default async function ReadPage({ searchParams }: Props) {
  const { url } = await searchParams;
  if (!url) redirect("/");

  const article = await extractArticle(decodeURIComponent(url));

  return <Reader article={article} />;
}
