import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'garden'>;
export interface Backlink {
  note: Note;
  context: string; // the paragraph the link sits in, as plain text
}

const CALLOUT = /<aside class="callout[^"]*"[^>]*>[\s\S]*?<\/aside>/g;
const LINK = /\[([^\]]+)\]\(\/garden\/([a-z0-9-]+)\)/g;

/** Markdown paragraph to plain text: keep link words, drop formatting marks. */
function plain(paragraph: string): string {
  return paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function allNotes(): Promise<Note[]> {
  return (await getCollection('garden')).sort((a, b) => b.data.updated.getTime() - a.data.updated.getTime());
}

/** For each note, the notes that link to it and the paragraph around each link. */
export async function backlinksByNote(): Promise<Map<string, Backlink[]>> {
  const notes = await allNotes();
  const result = new Map<string, Backlink[]>();
  for (const note of notes) {
    // A link in a callout box (Claude's "Related" line) is previewed with the note's own opening words.
    const body = note.body ?? '';
    const callouts = [...body.matchAll(CALLOUT)].map((m) => m[0]);
    const lead = body.replace(CALLOUT, '').split(/\n\s*\n/).find((p) => p.trim()) ?? '';
    const seen = new Set<string>();
    for (const paragraph of [...body.replace(CALLOUT, '').split(/\n\s*\n/), ...callouts]) {
      const targets = new Set([...paragraph.matchAll(LINK)].map((m) => m[2]));
      for (const target of targets) {
        if (target === note.id || seen.has(target)) continue;
        seen.add(target);
        if (!result.has(target)) result.set(target, []);
        result.get(target)!.push({ note, context: plain(callouts.includes(paragraph) ? lead : paragraph) });
      }
    }
  }
  return result;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** "Oct 12" for lists; the year only when it isn't this year. */
export function shortDay(date: Date): string {
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'UTC' });
}
