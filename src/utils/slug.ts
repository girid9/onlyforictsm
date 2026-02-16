export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ACRONYMS = ["ictsm", "wcs", "ict", "html", "css", "js", "mcq"];

export function humanizeFilename(filename: string): string {
  const name = filename.replace(/\.json$/, "");
  const parts = name.split("_");

  const yearIdx = parts.findIndex((p) => /^\d+(st|nd|rd|th)$/i.test(p));

  const mainParts = yearIdx >= 0 ? parts.slice(0, yearIdx) : parts;
  const yearParts = yearIdx >= 0 ? parts.slice(yearIdx) : [];

  const mainStr = mainParts
    .map((p) =>
      ACRONYMS.includes(p.toLowerCase())
        ? p.toUpperCase()
        : p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join(" ");

  if (yearParts.length > 0) {
    const yearStr = yearParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return `${mainStr} (${yearStr})`;
  }

  return mainStr;
}
