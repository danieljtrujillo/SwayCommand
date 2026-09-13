// Shared anchored popover, one #popover root, one open at a time. Items are
// plain buttons carrying data-choice; the opener's callback receives the
// chosen value. Dismissed by outside click, Esc (via the overlay stack), or
// choosing an item.
//
// To assistive technology it is a menu by default: #popover carries
// role="menu" and is labelled by its anchor, items are menu items, the
// anchor's aria-expanded follows it, the arrow keys, Home and End move between
// items, and closing it from inside hands focus back to the anchor. A panel
// holding form controls (opts.role 'dialog') keeps Tab and the arrow keys for
// those controls instead. Keys typed inside either stay inside it, so Space and
// Enter reach the focused control instead of the cockpit shortcuts; Esc still
// reaches the overlay stack.

const $ = (sel) => document.querySelector(sel);

let onChoose = null;
let openedAt = 0;
let anchor = null;
let owner = null;
let role = 'menu';

function items(pop) {
  return [...pop.querySelectorAll('.pop-item:not(:disabled)')];
}

/**
 * Opens (or, for the same anchor, re-renders in place) the popover.
 * opts.owner names it, so a late answer can tell whether it is still the one
 * showing (popoverOwner()); opts.role 'dialog' for a panel of form controls;
 * opts.label names a dialog; opts.align 'left' or 'right' hangs it from that
 * edge of the anchor, measured, and keeps it on screen.
 */
export function openPopover(anchorEl, html, choose, opts = {}) {
  const pop = $('#popover');
  const inPlace = !pop.hidden && anchor === anchorEl;
  const hadFocus = pop.contains(document.activeElement);
  if (anchor && anchor !== anchorEl) anchor.setAttribute('aria-expanded', 'false');
  pop.innerHTML = html;
  pop.hidden = false;
  onChoose = choose || null;
  owner = opts.owner || null;
  role = opts.role === 'dialog' ? 'dialog' : 'menu';
  if (owner) pop.dataset.owner = owner;
  else delete pop.dataset.owner;
  if (!inPlace) openedAt = performance.now();
  anchor = anchorEl;
  anchorEl.setAttribute('aria-expanded', 'true');
  pop.setAttribute('role', role);
  if (opts.label) {
    pop.setAttribute('aria-label', opts.label);
    pop.removeAttribute('aria-labelledby');
  } else {
    pop.removeAttribute('aria-label');
    if (anchorEl.id) pop.setAttribute('aria-labelledby', anchorEl.id);
    else pop.removeAttribute('aria-labelledby');
  }
  if (role === 'menu') {
    for (const el of pop.querySelectorAll('.pop-item')) el.setAttribute('role', 'menuitem');
    for (const el of pop.querySelectorAll('.pop-label, .pop-note')) el.setAttribute('role', 'presentation');
  }

  const r = anchorEl.getBoundingClientRect();
  let x;
  if (opts.align) {
    pop.style.left = '0px';
    pop.style.top = '0px';
    const pw = pop.offsetWidth;
    x = Math.min(opts.align === 'right' ? r.right - pw : r.left, window.innerWidth - pw - 6);
  } else {
    const pw = Math.min(340, window.innerWidth - 20);
    x = Math.min(r.left, window.innerWidth - pw - 10);
  }
  let y = r.bottom + 6;
  pop.style.left = `${Math.max(6, x)}px`;
  pop.style.top = '0px';
  // measure after content lands, then keep it on screen
  const ph = pop.offsetHeight;
  if (y + ph > window.innerHeight - 8) y = Math.max(8, r.top - ph - 6);
  pop.style.top = `${y}px`;

  if (!inPlace || hadFocus) {
    const first =
      role === 'menu'
        ? items(pop)[0]
        : pop.querySelector('select, input, button:not(:disabled), [tabindex]:not([tabindex="-1"])');
    if (first) first.focus({ preventScroll: true });
  }
}

export function closePopover() {
  const pop = $('#popover');
  const refocus = pop.contains(document.activeElement);
  pop.hidden = true;
  pop.innerHTML = '';
  delete pop.dataset.owner;
  onChoose = null;
  owner = null;
  if (anchor) {
    anchor.setAttribute('aria-expanded', 'false');
    if (refocus && anchor.isConnected) anchor.focus({ preventScroll: true });
  }
  anchor = null;
}

export function popoverOpen() {
  return !$('#popover').hidden;
}

/** The element the open popover hangs from, or null. */
export function popoverAnchor() {
  return popoverOpen() ? anchor : null;
}

/** The owner name the open popover was opened with, or null. */
export function popoverOwner() {
  return popoverOpen() ? owner : null;
}

export function wirePopover() {
  const pop = $('#popover');
  pop.addEventListener('click', (e) => {
    const item = e.target.closest('[data-choice]');
    if (!item || item.disabled) return;
    const fn = onChoose;
    closePopover();
    if (fn) fn(item.dataset.choice, item.dataset);
  });
  pop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return; // the overlay stack closes it
    if (role === 'menu') {
      if (e.key === 'Tab') {
        closePopover();
        return;
      }
      const list = items(pop);
      const i = list.indexOf(document.activeElement);
      let next = -1;
      if (e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % list.length;
      else if (e.key === 'ArrowUp') next = i <= 0 ? list.length - 1 : i - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = list.length - 1;
      if (next >= 0 && list.length) {
        e.preventDefault();
        list[next].focus();
      }
    }
    e.stopPropagation();
  });
  window.addEventListener('pointerdown', (e) => {
    if (pop.hidden) return;
    if (performance.now() - openedAt < 120) return; // the opening click itself
    // A press on the anchor is left to the anchor's own click, which toggles.
    if (anchor && anchor.contains(e.target)) return;
    if (!pop.contains(e.target)) closePopover();
  });
}
