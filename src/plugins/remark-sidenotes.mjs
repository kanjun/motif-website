/**
 * Remark plugin to transform standard markdown footnotes into Tufte-style sidenotes.
 *
 * Converts:
 *   Text with a footnote[^1].
 *   [^1]: This is the footnote content.
 *
 * Into HTML that displays as sidenotes on desktop (in the margin)
 * and collapses to expandable footnotes on mobile.
 */

import { visit } from 'unist-util-visit';

let sidenoteCounter = 0;

export function remarkSidenotes() {
  return (tree) => {
    sidenoteCounter = 0;
    const footnoteDefinitions = new Map();

    // First pass: collect all footnote definitions
    visit(tree, 'footnoteDefinition', (node) => {
      const content = node.children
        .map((child) => {
          if (child.type === 'paragraph') {
            return child.children
              .map((c) => {
                if (c.type === 'text') return c.value;
                if (c.type === 'emphasis') return `<em>${c.children.map(x => x.value).join('')}</em>`;
                if (c.type === 'strong') return `<strong>${c.children.map(x => x.value).join('')}</strong>`;
                if (c.type === 'link') return `<a href="${c.url}">${c.children.map(x => x.value).join('')}</a>`;
                return '';
              })
              .join('');
          }
          return '';
        })
        .join(' ');
      footnoteDefinitions.set(node.identifier, content);
    });

    // Second pass: replace footnote references with sidenote HTML
    visit(tree, 'footnoteReference', (node, index, parent) => {
      sidenoteCounter++;
      const id = `sn-${sidenoteCounter}`;
      const num = sidenoteCounter;
      const content = footnoteDefinitions.get(node.identifier) || '';

      // Create sidenote HTML structure with explicit numbers (not CSS counters)
      const sidenoteHtml = {
        type: 'html',
        value: `<label for="${id}" class="margin-toggle"><sup class="sidenote-number">${num}</sup></label><input type="checkbox" id="${id}" class="margin-toggle"/><span class="sidenote"><span class="sidenote-num">${num}.</span> ${content}</span>`,
      };

      // Replace the footnote reference with our sidenote
      parent.children.splice(index, 1, sidenoteHtml);
    });

    // Remove footnote definitions from the tree (they're now inline)
    visit(tree, 'footnoteDefinition', (node, index, parent) => {
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1);
        return index; // Re-visit this index since we removed an element
      }
    });
  };
}

export default remarkSidenotes;
