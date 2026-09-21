/** Paste your unlisted YouTube URL or watch ID when the video is ready. */
export const DEMO_VIDEO = {
  /** Full watch URL, youtu.be link, or 11-char video id. Leave empty until uploaded. */
  url: "",
  title: "Shielded Settle — walkthrough",
  durationHint: "Under 3 minutes",
} as const;

export function youtubeEmbedSrc(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return `https://www.youtube.com/embed/${value}?rel=0`;
  }

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }
    const id = parsed.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) {
      return `https://www.youtube.com/embed/${parts[embedIdx + 1]}?rel=0`;
    }
  } catch {
    return null;
  }
  return null;
}
