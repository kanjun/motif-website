/** Word-level diff of two markdown texts, as markdown with <ins>/<del> marks. */
export function diffWords(before: string, after: string): string {
  // Links count as one word, so a changed link never splits its markdown apart.
  const words = (t: string) => t.match(/\[[^\]]*\]\([^)]*\)|\s+|[^\s[]+|\[/g) ?? [];
  const a = words(before), b = words(after);
  // Longest common subsequence table; notes are short, so this stays small.
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: string[] = [];
  let i = 0, j = 0, ins: string[] = [], del: string[] = [];
  const flush = () => {
    if (del.join('').trim()) out.push(`<del>${del.join('')}</del>`); else out.push(...del.filter((w) => /\n/.test(w)));
    if (ins.join('').trim()) out.push(`<ins>${ins.join('')}</ins>`); else out.push(...ins);
    ins = []; del = [];
  };
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { flush(); out.push(a[i]); i++; j++; }
    else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) { ins.push(b[j]); j++; }
    else { del.push(a[i]); i++; }
  }
  flush();
  return out.join('');
}

/** Minimal markdown for history views: paragraphs, links, emphasis. Input is escaped first. */
export function simpleMarkdown(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // the diff's own marks survive escaping
    .replace(/&lt;(\/?)(ins|del)&gt;/g, '<$1$2>');
  return escaped
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => '<p>' + p
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') + '</p>')
    .join('\n');
}
