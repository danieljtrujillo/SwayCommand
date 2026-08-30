// Minimal Markdown renderer for the in-app documentation viewer.
// Supports the subset the SwayCommand documentation actually uses: ATX headings,
// fenced code, pipe tables, ordered/unordered lists, blockquotes, horizontal
// rules, and the inline set (code spans, bold, italic, links, images). Source
// text is HTML-escaped before any markup is generated; code spans are extracted
// first so their contents are never re-processed.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ESCAPES[c]);

// Private-use sentinels bracket extracted code spans. They cannot occur in the
// source and are untouched by escaping, so a placeholder can never collide with
// ordinary digits in the prose.
const SENTINEL_OPEN = '';
const SENTINEL_CLOSE = '';
const PLACEHOLDER = new RegExp(SENTINEL_OPEN + '([0-9]+)' + SENTINEL_CLOSE, 'g');

// Heading -> anchor id, matching the convention used by the docs' own links.
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function inline(src) {
  const spans = [];
  let text = src.replace(/`([^`]+)`/g, (_m, code) => {
    spans.push('<code>' + escapeHtml(code) + '</code>');
    return SENTINEL_OPEN + (spans.length - 1) + SENTINEL_CLOSE;
  });

  text = escapeHtml(text);

  // Images: ![alt](src), and BEFORE the link rule, which would otherwise eat
  // the bracket pair and leave a stray '!'. Only the bundle's own media
  // directory resolves: build-renderer.js copies docs/media/ to media/ beside
  // index.html, so a document's `docs/media/x.webp` becomes `./media/x.webp`
  // whether it is read from the repository root (README.md) or from docs/.
  // Anything else, an external badge above all, renders as its alt text: the
  // renderer's CSP is `img-src 'self' data:`, so a remote src would only ever
  // draw a broken-image icon.
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, src) => {
    const local = /^(?:\.\/)?(?:docs\/)?(media\/[A-Za-z0-9._\/-]+)$/.exec(src);
    if (!local || src.includes('..')) return alt;
    return '<img class="doc-image" src="./' + local[1] + '" alt="' + alt + '" loading="lazy" />';
  });

  // Links: [label](target). Targets are classified by the viewer at click time.
  text = text.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const safe = href.replace(/"/g, '%22');
    return '<a href="#" data-href="' + safe + '">' + label + '</a>';
  });

  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  return text.replace(PLACEHOLDER, (_m, i) => spans[Number(i)]);
}

// A table row splits on unescaped pipes only, so an escaped pipe stays in-cell.
function splitRow(line) {
  const cells = [];
  let cur = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\' && line[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (ch === '|') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  // Leading and trailing pipes produce empty edge cells; drop them.
  if (cells.length && cells[0].trim() === '') cells.shift();
  if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
  return cells.map((c) => c.trim());
}

const isTableDivider = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-');

export function renderMarkdown(source) {
  const lines = source.split(/\r?\n/);
  const out = [];
  const headings = [];
  const para = [];
  let i = 0;

  const flushParagraph = () => {
    if (para.length) {
      out.push('<p>' + inline(para.join(' ')) + '</p>');
      para.length = 0;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code
    if (/^\s*```/.test(line)) {
      flushParagraph();
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++; // closing fence
      out.push('<pre><code>' + escapeHtml(body.join('\n')) + '</code></pre>');
      continue;
    }

    // Heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushParagraph();
      const level = h[1].length;
      const raw = h[2].trim();
      const id = slugify(raw);
      if (level <= 3) headings.push({ id, level, text: raw.replace(/`/g, '') });
      out.push('<h' + level + ' id="' + id + '">' + inline(raw) + '</h' + level + '>');
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushParagraph();
      out.push('<hr>');
      i++;
      continue;
    }

    // Table: a header row followed by a divider row
    if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      flushParagraph();
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const head = header.map((c) => '<th>' + inline(c) + '</th>').join('');
      const body = rows
        .map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>')
        .join('');
      out.push(
        '<div class="table-scroll"><table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>'
      );
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      const body = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + inline(body.join(' ')) + '</blockquote>');
      continue;
    }

    // Lists. A blank line or a non-item line ends the list.
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\s*[0-9]+\.\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = !!numbered;
      const itemRe = ordered ? /^\s*[0-9]+\.\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
      const items = [];
      while (i < lines.length) {
        const m = itemRe.exec(lines[i]);
        if (!m) break;
        const parts = [m[1]];
        i++;
        // Continuation lines are indented and are not themselves list items.
        while (
          i < lines.length &&
          /^\s{2,}\S/.test(lines[i]) &&
          !/^\s*([-*+]|[0-9]+\.)\s+/.test(lines[i])
        ) {
          parts.push(lines[i].trim());
          i++;
        }
        items.push('<li>' + inline(parts.join(' ')) + '</li>');
      }
      out.push(ordered ? '<ol>' + items.join('') + '</ol>' : '<ul>' + items.join('') + '</ul>');
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushParagraph();

  return { html: out.join('\n'), headings };
}
