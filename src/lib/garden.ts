import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'garden'>;
export interface Backlink {
  note: Note;
  context: string; // the paragraph the link sits in, as plain text
}

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
    for (const paragraph of (note.body ?? '').split(/\n\s*\n/)) {
      const targets = new Set([...paragraph.matchAll(LINK)].map((m) => m[2]));
      for (const target of targets) {
        if (target === note.id) continue;
        if (!result.has(target)) result.set(target, []);
        result.get(target)!.push({ note, context: plain(paragraph) });
      }
    }
  }
  return result;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
