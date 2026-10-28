export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function readPath(url: string): string {
  return `/read?url=${encodeURIComponent(url)}`;
}
