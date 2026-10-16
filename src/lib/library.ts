// The Library page is built from two plain markdown pages she edits:
// quotes.md (each quote is "**Name -**" then a "> quote"; a "## Heading"
// starts a group, like Friendquotes) and notes.md (each sketch is a
// "### Title", optional words, then its image).

export interface Quote { html: string; by: string }
export interface QuoteGroup { title: string; id: string; quotes: Quote[] }
export interface Sketch { title: string; html: string; image: string; alt: string }

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Bold, italics and links: all the markdown these pages use inside a line. */
export function inline(md: string): string {
  return escape(md)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function parseQuotes(body: string): QuoteGroup[] {
  const groups: QuoteGroup[] = [{ title: 'Quotes', id: 'quotes', quotes: [] }];
  let by = '';
  for (const block of body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)) {
    const heading = block.match(/^##\s+(.+)$/);
    if (heading) { groups.push({ title: heading[1], id: slug(heading[1]), quotes: [] }); by = ''; continue; }
    const name = block.match(/^\*\*(.+?)\s*-\*\*$/);
    if (name) { by = name[1]; continue; }
    if (!block.startsWith('>')) continue;
    let text = block.replace(/^>\s?/gm, '').trim();
    let who = by;
    // Friend quotes carry their name on the same line: "quote <br /><span>— [Name](url), context</span>"
    const credit = text.match(/<br\s*\/?>\s*<span[^>]*>\s*—\s*([\s\S]*?)<\/span>\s*$/);
    if (credit) { who = credit[1].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim(); text = text.slice(0, credit.index).trim(); }
    groups.at(-1)!.quotes.push({ html: inline(text), by: who });
  }
  return groups.filter((g) => g.quotes.length);
}

export function parseSketches(body: string, images: Record<string, string>): { intro: string; sketches: Sketch[] } {
  const [introPart, ...parts] = body.split(/^###\s+/m);
  const sketches = parts.map((part) => {
    const [title, ...rest] = part.split('\n');
    const text = rest.join('\n');
    const img = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const file = img ? img[2].split('/').pop()! : '';
    const words = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim();
    return { title: title.trim(), html: words ? inline(words) : '', image: images[file] ?? '', alt: img?.[1] ?? '' };
  });
  return { intro: introPart.trim(), sketches };
}
