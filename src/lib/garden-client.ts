// Garden behaviour in the browser: open linked notes beside the current one
// (the stack is kept in the address as ?stack=a&stack=b), fold covered notes
// into spines, and preview a note when hovering over a link to it.

const SPINE = 40;
const isWide = () => window.matchMedia('(min-width: 801px)').matches;
const pageCache = new Map<string, Promise<HTMLElement | null>>();

function slugOf(href: string): string | null {
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) return null;
  const m = url.pathname.match(/^\/garden\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}

function fetchPane(slug: string): Promise<HTMLElement | null> {
  if (!pageCache.has(slug)) {
    pageCache.set(slug, fetch(`/garden/${slug}`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((html) => new DOMParser().parseFromString(html, 'text/html').querySelector<HTMLElement>('.pane'))
      .catch(() => null));
  }
  return pageCache.get(slug)!.then((pane) => (pane ? (pane.cloneNode(true) as HTMLElement) : null));
}

function panes(stack: HTMLElement): HTMLElement[] {
  return [...stack.querySelectorAll<HTMLElement>(':scope > .pane')];
}

function layout(stack: HTMLElement) {
  panes(stack).forEach((pane, i) => pane.style.setProperty('--i', String(i)));
  updateCollapsed(stack);
  markOpenLinks(stack);
}

// A pane is folded once the next pane slides over all but its spine.
function updateCollapsed(stack: HTMLElement) {
  const list = panes(stack);
  list.forEach((pane, i) => {
    const next = list[i + 1];
    const covered = next ? next.getBoundingClientRect().left - pane.getBoundingClientRect().left < SPINE + 60 : false;
    pane.classList.toggle('collapsed', covered);
  });
}

function markOpenLinks(stack: HTMLElement) {
  const open = new Set(panes(stack).map((p) => p.dataset.slug));
  stack.querySelectorAll<HTMLAnchorElement>('.note a[href^="/garden/"]').forEach((a) => {
    a.classList.toggle('open-in-stack', open.has(slugOf(a.href) ?? '#'));
  });
}

function writeUrl(stack: HTMLElement, push: boolean) {
  const [first, ...rest] = panes(stack);
  const base = first.dataset.slug ? `/garden/${first.dataset.slug}` : '/garden';
  const query = rest.map((p) => `stack=${encodeURIComponent(p.dataset.slug!)}`).join('&');
  const url = base + (query ? `?${query}` : '');
  const title = (rest.at(-1) ?? first).dataset.title + ' ∙ Kanjun Qiu';
  document.title = title;
  if (push) history.pushState({}, title, url); else history.replaceState({}, title, url);
}

// Scroll so a pane is fully in view: a newly opened pane lands at the right
// edge; a folded one unfolds by sliding the panes after it out of its way.
function scrollToPane(stack: HTMLElement, pane: HTMLElement) {
  const i = panes(stack).indexOf(pane);
  const paneW = pane.offsetWidth;
  const showRightEdge = (i + 1) * paneW - stack.clientWidth;
  const uncover = i * (paneW - SPINE);
  const left = Math.max(0, Math.min(Math.max(stack.scrollLeft, showRightEdge), uncover));
  stack.scrollTo({ left, behavior: 'smooth' });
}

async function openAfter(stack: HTMLElement, from: HTMLElement, slug: string) {
  const list = panes(stack);
  const existing = list.find((p) => p.dataset.slug === slug);
  if (existing) {
    existing.classList.remove('flash'); void existing.offsetWidth; existing.classList.add('flash');
    scrollToPane(stack, existing);
    return;
  }
  const pane = await fetchPane(slug);
  if (!pane) { location.href = `/garden/${slug}`; return; }
  list.slice(list.indexOf(from) + 1).forEach((p) => p.remove());
  stack.append(pane);
  layout(stack);
  writeUrl(stack, true);
  requestAnimationFrame(() => scrollToPane(stack, pane));
}

async function restoreFromUrl(stack: HTMLElement) {
  const wanted = new URLSearchParams(location.search).getAll('stack');
  const [first] = panes(stack);
  panes(stack).slice(1).forEach((p) => p.remove());
  for (const slug of wanted) {
    const pane = await fetchPane(slug);
    if (pane) stack.append(pane);
  }
  layout(stack);
  if (first && wanted.length) {
    const last = panes(stack).at(-1)!;
    requestAnimationFrame(() => scrollToPane(stack, last));
  }
}

function setupPopover(stack: HTMLElement) {
  const popover = document.getElementById('popover')!;
  let timer: number | undefined, current: HTMLAnchorElement | null = null;
  const hide = () => { clearTimeout(timer); current = null; popover.hidden = true; };
  stack.addEventListener('mouseover', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('.note a[href^="/garden/"], .backlink');
    if (!a || a === current || !isWide()) return;
    const slug = slugOf(a.href);
    if (!slug) return;
    hide();
    current = a;
    timer = window.setTimeout(async () => {
      const pane = await fetchPane(slug);
      if (current !== a || !pane) return;
      popover.replaceChildren(...[...pane.querySelector('.note')!.childNodes].slice(0, 12).map((n) => n.cloneNode(true)));
      const r = a.getBoundingClientRect();
      const left = Math.min(Math.max(12, r.left), window.innerWidth - 440);
      const below = r.bottom + 330 < window.innerHeight;
      popover.style.left = left + 'px';
      popover.style.top = (below ? r.bottom + 8 : Math.max(12, r.top - 328)) + 'px';
      popover.hidden = false;
    }, 350);
  });
  stack.addEventListener('mouseout', (e) => {
    if (current && !current.contains(e.relatedTarget as Node)) hide();
  });
  stack.addEventListener('click', hide);
  stack.addEventListener('scroll', hide, { passive: true });
}

export function startGarden() {
  const stack = document.getElementById('stack');
  if (!stack) return;
  layout(stack);
  setupPopover(stack);
  if (!panes(stack)[0]?.classList.contains('pane-solo')) {
    stack.addEventListener('scroll', () => updateCollapsed(stack), { passive: true });
    window.addEventListener('resize', () => updateCollapsed(stack));
    stack.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!a || a.hasAttribute('data-no-stack') || e.metaKey || e.ctrlKey || e.shiftKey || !isWide()) return;
      const from = a.closest<HTMLElement>('.pane');
      if (a.classList.contains('spine') && from) {
        e.preventDefault();
        scrollToPane(stack, from);
        return;
      }
      const slug = slugOf(a.href);
      if (!slug || !from) return;
      e.preventDefault();
      openAfter(stack, from, slug);
    });
    window.addEventListener('popstate', () => restoreFromUrl(stack));
    if (new URLSearchParams(location.search).has('stack')) restoreFromUrl(stack);
  }
}
