export const LIMITS = {
  archive: 256 * 1024 ** 2,
  entries: 10000,
  json: 10 * 1024 ** 2,
  expanded: 512 * 1024 ** 2,
};
export function normalizePath(path: string): string {
  const p = path.replace(/\\/g, "/");
  if (
    !p ||
    /[\x00-\x1f]/.test(p) ||
    p.startsWith("/") ||
    /^[a-z]+:/i.test(p) ||
    p.split("/").some((s) => s === ".." || s === ".")
  )
    throw new Error("Unsafe archive path.");
  return p;
}
