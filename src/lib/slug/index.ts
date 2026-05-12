import { randomUUID } from "node:crypto";

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildJobSlug(title: string): string {
  const base = slugify(title).slice(0, 60) || "job";
  return `${base}-${randomUUID().slice(0, 8)}`;
}
