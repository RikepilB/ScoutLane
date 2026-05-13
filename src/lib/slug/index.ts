export { slugify } from "./slugify";

import { randomUUID } from "node:crypto";
import { slugify } from "./slugify";

export function buildJobSlug(title: string): string {
  const base = slugify(title).slice(0, 60) || "job";
  return `${base}-${randomUUID().slice(0, 8)}`;
}
