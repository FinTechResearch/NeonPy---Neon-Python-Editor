/** Extract the first fenced ```python (or generic) code block from markdown. */
export function extractPythonBlock(md: string): string | null {
  const re = /```[a-zA-Z]*\n([\s\S]*?)```/;
  const m = re.exec(md);
  return m?.[1] ? m[1].replace(/\s+$/, "\n") : null;
}

export interface PartialSplit {
  /** Markdown text before the opening fence. */
  prose: string;
  /** Code accumulated so far (fence may still be open), or null. */
  code: string | null;
}

/** Parse a partial markdown stream while it is still arriving. */
export function splitPartial(md: string): PartialSplit {
  const match = /```[a-zA-Z]*\n/.exec(md);
  if (!match) return { prose: md, code: null };
  const fenceStart = match.index;
  const codeStart = fenceStart + match[0].length;
  const rest = md.slice(codeStart);
  const close = rest.indexOf("\n```");
  const code = close >= 0 ? rest.slice(0, close + 1) : rest;
  return { prose: md.slice(0, fenceStart), code };
}
