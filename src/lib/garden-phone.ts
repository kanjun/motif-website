// Kanjectures on a phone: the notes you've opened sit side by side, one screen each,
// and you swipe between them. Tapping a link first shows a peek of that note from
// the bottom of the screen; "Open note" adds it to the right and slides over to it.
import { fetchPane, panes, slugOf, writeUrl } from './garden-client';

const isPhone = () => window.matchMedia('(max-width: 800px)').matches;

function current(stack: HTMLElement): HTMLElement {
  const list = panes(stack);
  return list[Math.round(stack.scrollLeft / stack.clientWidth)] ?? list[0];
}

function goTo(stack: HTMLElement, pane: HTMLElement) {
  stack.scrollTo({ left: pane.offsetLeft - stack.offsetLeft, behavior: 'smooth' });
}

// Dots under the notes: one per open note, the one on screen filled in.
function renderDots(stack: HTMLElement, dots: HTMLElement) {
  const list = panes(stack);
  const on = list.indexOf(current(stack));
  dots.hidden = !isPhone() || list.length < 2;
  dots.replaceChildren(...list.map((pane, i) => {
    const dot = document.createElement('button');
    dot.className = i === on ? 'on' : '';
    dot.setAttribute('aria-label', pane.dataset.title || 'Kanjectures');
    dot.onclick = () => goTo(stack, pane);
    return dot;
  }));
}

async function open(stack: HTMLElement, from: HTMLElement, slug: string, dots: HTMLElement) {
  const list = panes(stack);
  const existing = list.find((p) => p.dataset.slug === slug);
  if (existing) { goTo(stack, existing); return; }
  const pane = await fetchPane(slug);
  if (!pane) { location.href = `/garden/${slug}`; return; }
  list.slice(list.indexOf(from) + 1).forEach((p) => p.remove());
  stack.append(pane);
  writeUrl(stack, true);
  renderDots(stack, dots);
  requestAnimationFrame(() => goTo(stack, pane));
}

function makePeek(): HTMLElement {
  const sheet = document.createElement('div');
  sheet.className = 'peek';
  sheet.hidden = true;
  sheet.innerHTML = `<div class="peek-backdrop"></div>
    <div class="peek-card" role="dialog" aria-label="Preview">
      <div class="peek-grip"></div>
      <div class="peek-body"></div>
      <div class="peek-actions"><button class="peek-close">Close</button><button class="peek-open">Open note</button></div>
    </div>`;
  document.body.append(sheet);
  return sheet;
}

export function startPhone(stack: HTMLElement) {
  const dots = document.createElement('nav');
  dots.className = 'note-dots';
  document.body.append(dots);
  const sheet = makePeek();
  const card = sheet.querySelector<HTMLElement>('.peek-card')!;
  const body = sheet.querySelector<HTMLElement>('.peek-body')!;
  const openButton = sheet.querySelector<HTMLButtonElement>('.peek-open')!;
  let peeking: { from: HTMLElement; slug: string } | null = null;

  const closePeek = () => {
    sheet.classList.remove('up');
    peeking = null;
    setTimeout(() => { if (!peeking) sheet.hidden = true; }, 220);
  };
  sheet.querySelector('.peek-backdrop')!.addEventListener('click', closePeek);
  sheet.querySelector('.peek-close')!.addEventListener('click', closePeek);
  openButton.addEventListener('click', () => {
    if (peeking) open(stack, peeking.from, peeking.slug, dots);
    closePeek();
  });
  // Pull the card down to put it away.
  let startY: number | null = null;
  card.addEventListener('touchstart', (e) => { startY = body.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  card.addEventListener('touchend', (e) => {
    if (startY !== null && e.changedTouches[0].clientY - startY > 80) closePeek();
    startY = null;
  });

  stack.addEventListener('click', async (e) => {
    if (!isPhone()) return;
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!a || a.hasAttribute('data-no-stack')) return;
    const slug = slugOf(a.href);
    const from = a.closest<HTMLElement>('.pane');
    if (!slug || !from) return;
    e.preventDefault();
    // A title picked from the front page's lists opens straight away; links inside a note peek first.
    if (from.classList.contains('home')) { open(stack, from, slug, dots); return; }
    const pane = await fetchPane(slug);
    if (!pane) { location.href = a.href; return; }
    const note = pane.querySelector('.note');
    body.replaceChildren(...[...(note?.childNodes ?? [])].slice(0, 14).map((n) => n.cloneNode(true)));
    body.scrollTop = 0;
    openButton.textContent = panes(stack).some((p) => p.dataset.slug === slug) ? 'Go to note' : 'Open note';
    peeking = { from, slug };
    sheet.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('up')));
  });

  let settle: number | undefined;
  stack.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = window.setTimeout(() => renderDots(stack, dots), 80);
  }, { passive: true });
  window.addEventListener('popstate', () => setTimeout(() => renderDots(stack, dots), 300));
  window.addEventListener('resize', () => renderDots(stack, dots));
  // Arriving with several notes already open (a shared link): show the last one.
  setTimeout(() => {
    const list = panes(stack);
    if (isPhone() && list.length > 1) stack.scrollLeft = list.at(-1)!.offsetLeft - stack.offsetLeft;
    renderDots(stack, dots);
  }, 400);
}
