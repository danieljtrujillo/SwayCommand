// Stroke-only chamfered SVG frames for .framed containers. clip-path would
// destroy a CSS border, so the frame is drawn as an absolutely positioned SVG
// path, redrawn by one shared ResizeObserver.

const CUT = 12; // chamfer size in px

function draw(el) {
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!w || !h) return;
  let svg = el.querySelector(':scope > .frame-svg');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'frame-svg');
    svg.setAttribute('aria-hidden', 'true');
    el.prepend(svg);
  }
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const c = Math.min(CUT, w / 4, h / 4);
  svg.innerHTML =
    `<path d="M ${c + 0.5} 0.5 H ${w - 0.5} V ${h - c - 0.5} L ${w - c - 0.5} ${h - 0.5} H 0.5 V ${c + 0.5} Z" />` +
    // corner accents on the two chamfers
    `<path class="frame-tick" d="M 0.5 ${c + 0.5} L ${c + 0.5} 0.5" />` +
    `<path class="frame-tick" d="M ${w - 0.5} ${h - c - 0.5} L ${w - c - 0.5} ${h - 0.5}" />`;
}

export function initFrames(root = document) {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) draw(entry.target);
  });
  for (const el of root.querySelectorAll('.framed')) {
    draw(el);
    observer.observe(el);
  }
  return observer;
}
