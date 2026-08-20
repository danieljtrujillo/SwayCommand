// Timeline band — ruler with loop region and locators, one visual lane of
// scene clips (DOM), one audio lane with waveforms (canvas), and a playhead.
// The clip objects it edits are the project's own timeline objects; every
// structural change goes through transport.refresh() and onEdit().

import { uid } from '../../shared/swayproject.js';

const $ = (sel) => document.querySelector(sel);
const EDGE = 8; // px resize zone on clip edges
const PEAK_BUCKETS = 2048;

export function createTimeline({ transport, engine, store, onEdit }) {
  const root = $('#timeline');
  const ruler = $('#tl-ruler');
  const visualLane = $('#tl-visual');
  const audioCanvas = $('#tl-audio');
  const playhead = $('#tl-playhead');

  let pxPerSec = 12;
  let scrollX = 0; // seconds at the left edge
  let selectedId = null;
  const peaks = new Map(); // mediaId -> Float32Array(2 * PEAK_BUCKETS)

  function timeline() {
    return transport.collect();
  }
  function visualClips() {
    const tl = timeline();
    return tl ? tl.tracks.find((t) => t.type === 'visual').clips : [];
  }
  function audioClips() {
    const tl = timeline();
    return tl ? tl.tracks.find((t) => t.type === 'audio').clips : [];
  }

  function xToTime(x) {
    return Math.max(0, scrollX + x / pxPerSec);
  }
  function timeToX(t) {
    return (t - scrollX) * pxPerSec;
  }

  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
    }
    return dpr;
  }

  function niceStep() {
    const target = 80 / pxPerSec; // ~80 px between labeled ticks
    const steps = [0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
    return steps.find((s) => s >= target) || 600;
  }

  function fmtTime(t) {
    const m = Math.floor(t / 60);
    const s = t - m * 60;
    return m ? `${m}:${s < 10 ? '0' : ''}${Math.floor(s)}` : `${Math.round(s * 10) / 10}`;
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function renderRuler() {
    const dpr = fitCanvas(ruler);
    const ctx = ruler.getContext('2d');
    const w = ruler.width;
    const h = ruler.height;
    ctx.clearRect(0, 0, w, h);
    const accent = css('--accent') || '#2de1fc';
    const dim = css('--info') || '#64748b';

    const step = niceStep();
    const first = Math.floor(scrollX / step) * step;
    ctx.font = `${9 * dpr}px ${css('--mono') || 'monospace'}`;
    ctx.fillStyle = dim;
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 1;
    for (let t = first; timeToX(t) * dpr < w; t += step) {
      const x = Math.round(timeToX(t) * dpr) + 0.5;
      if (x < 0) continue;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.45);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillText(fmtTime(t), x + 3 * dpr, h * 0.62);
    }

    const loop = transport.state.loop;
    if (loop.end > loop.start) {
      const x0 = timeToX(loop.start) * dpr;
      const x1 = timeToX(loop.end) * dpr;
      ctx.fillStyle = loop.enabled ? 'rgba(45,225,252,.22)' : 'rgba(45,225,252,.09)';
      ctx.fillRect(x0, 0, x1 - x0, h * 0.4);
      ctx.strokeStyle = accent;
      ctx.beginPath();
      ctx.moveTo(x0 + 0.5, 0);
      ctx.lineTo(x0 + 0.5, h * 0.4);
      ctx.moveTo(x1 + 0.5, 0);
      ctx.lineTo(x1 + 0.5, h * 0.4);
      ctx.stroke();
    }

    const tl = timeline();
    if (tl) {
      ctx.fillStyle = accent;
      for (const loc of tl.locators) {
        const x = timeToX(loc.time) * dpr;
        if (x < -8 || x > w + 8) continue;
        ctx.save();
        ctx.translate(x, h * 0.3);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-3 * dpr, -3 * dpr, 6 * dpr, 6 * dpr);
        ctx.restore();
      }
    }
  }

  function buildPeaks(mediaId) {
    if (peaks.has(mediaId)) return peaks.get(mediaId);
    const buffer = transport.getBuffer(mediaId);
    if (!buffer) return null;
    const data = buffer.getChannelData(0);
    const out = new Float32Array(PEAK_BUCKETS * 2);
    const per = Math.max(1, Math.floor(data.length / PEAK_BUCKETS));
    for (let b = 0; b < PEAK_BUCKETS; b++) {
      let lo = 0;
      let hi = 0;
      const start = b * per;
      const end = Math.min(data.length, start + per);
      for (let i = start; i < end; i += 4) {
        const v = data[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      out[b * 2] = lo;
      out[b * 2 + 1] = hi;
    }
    peaks.set(mediaId, out);
    return out;
  }

  function renderAudio() {
    const dpr = fitCanvas(audioCanvas);
    const ctx = audioCanvas.getContext('2d');
    const w = audioCanvas.width;
    const h = audioCanvas.height;
    ctx.clearRect(0, 0, w, h);
    const accent = css('--accent') || '#2de1fc';

    for (const clip of audioClips()) {
      const x0 = timeToX(clip.start) * dpr;
      const x1 = timeToX(clip.end) * dpr;
      if (x1 < 0 || x0 > w) continue;
      const selectedClip = clip.id === selectedId;
      ctx.fillStyle = selectedClip ? 'rgba(45,225,252,.16)' : 'rgba(45,225,252,.07)';
      ctx.fillRect(x0, 2 * dpr, x1 - x0, h - 4 * dpr);
      ctx.strokeStyle = selectedClip ? accent : 'rgba(45,225,252,.4)';
      ctx.strokeRect(x0 + 0.5, 2 * dpr + 0.5, x1 - x0 - 1, h - 4 * dpr - 1);

      const pk = buildPeaks(clip.media);
      const buffer = transport.getBuffer(clip.media);
      if (pk && buffer) {
        ctx.strokeStyle = 'rgba(45,225,252,.55)';
        ctx.beginPath();
        const mid = h / 2;
        const span = h * 0.42;
        const clipDur = clip.end - clip.start;
        const px0 = Math.max(0, x0);
        const px1 = Math.min(w, x1);
        for (let x = px0; x <= px1; x += 2) {
          const t = clip.offset + ((x - x0) / (x1 - x0)) * clipDur;
          const b = Math.min(PEAK_BUCKETS - 1, Math.floor((t / buffer.duration) * PEAK_BUCKETS));
          ctx.moveTo(x + 0.5, mid + pk[b * 2] * span);
          ctx.lineTo(x + 0.5, mid + pk[b * 2 + 1] * span);
        }
        ctx.stroke();
      }
    }
  }

  function renderVisual() {
    const rows = [];
    for (const clip of visualClips()) {
      const left = timeToX(clip.start);
      const width = (clip.end - clip.start) * pxPerSec;
      if (left + width < 0 || left > visualLane.clientWidth) continue;
      const meta = engine.sceneList.find((s) => s.id === clip.scene);
      rows.push(
        `<div class="tl-clip${clip.id === selectedId ? ' selected' : ''}" data-clip="${clip.id}" ` +
          `style="left:${left.toFixed(1)}px;width:${Math.max(8, width).toFixed(1)}px">${meta ? meta.name : clip.scene}</div>`
      );
    }
    visualLane.innerHTML = rows.join('');
  }

  function render() {
    renderRuler();
    renderVisual();
    renderAudio();
  }

  function edited() {
    transport.refresh();
    onEdit && onEdit();
    render();
  }

  // --- interactions ---------------------------------------------------------

  // Ruler: drag scrubs; Shift+drag sets the loop region; double-click drops a
  // locator; a locator click within 6 px jumps to it.
  let rulerDrag = null;
  ruler.addEventListener('pointerdown', (e) => {
    ruler.setPointerCapture(e.pointerId);
    const t = xToTime(e.offsetX);
    if (e.shiftKey) {
      rulerDrag = { mode: 'loop', from: t };
      transport.setLoop(t, t, false);
    } else {
      const tl = timeline();
      const near = tl && tl.locators.find((l) => Math.abs(timeToX(l.time) - e.offsetX) < 6);
      if (near) {
        transport.seek(near.time);
      } else {
        rulerDrag = { mode: 'scrub' };
        transport.seek(t);
      }
    }
    render();
  });
  ruler.addEventListener('pointermove', (e) => {
    if (!rulerDrag) return;
    const t = xToTime(e.offsetX);
    if (rulerDrag.mode === 'scrub') transport.seek(t);
    else {
      transport.setLoop(Math.min(rulerDrag.from, t), Math.max(rulerDrag.from, t), true);
      const tl = timeline();
      if (tl) tl.loop = transport.state.loop;
    }
    render();
  });
  ruler.addEventListener('pointerup', () => {
    if (rulerDrag && rulerDrag.mode === 'loop') edited();
    rulerDrag = null;
  });
  ruler.addEventListener('dblclick', (e) => {
    const tl = timeline();
    if (!tl) return;
    tl.locators.push({ id: uid('loc'), name: '', time: xToTime(e.offsetX), color: null });
    edited();
  });

  // Zoom / pan anywhere on the band.
  root.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      if (e.shiftKey) {
        scrollX = Math.max(0, scrollX + (e.deltaY || e.deltaX) / pxPerSec);
      } else {
        const rect = root.getBoundingClientRect();
        const anchorT = xToTime(e.clientX - rect.left);
        pxPerSec = Math.min(400, Math.max(1.5, pxPerSec * (e.deltaY > 0 ? 1 / 1.2 : 1.2)));
        scrollX = Math.max(0, anchorT - (e.clientX - rect.left) / pxPerSec);
      }
      render();
    },
    { passive: false }
  );

  // Visual clips: drag body to move, edges to resize; double-click empty lane
  // lays the current scene down.
  let clipDrag = null;
  visualLane.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-clip]');
    if (!el) return;
    const clip = visualClips().find((c) => c.id === el.dataset.clip);
    if (!clip) return;
    selectedId = clip.id;
    const rect = el.getBoundingClientRect();
    const atStart = e.clientX - rect.left < EDGE;
    const atEnd = rect.right - e.clientX < EDGE;
    clipDrag = {
      clip,
      mode: atEnd ? 'end' : atStart ? 'start' : 'move',
      grabT: xToTime(e.clientX - visualLane.getBoundingClientRect().left) - clip.start,
    };
    visualLane.setPointerCapture(e.pointerId);
    render();
  });
  visualLane.addEventListener('pointermove', (e) => {
    if (!clipDrag) return;
    const t = xToTime(e.clientX - visualLane.getBoundingClientRect().left);
    const c = clipDrag.clip;
    const snap = (v) => Math.max(0, Math.round(v * 2) / 2);
    if (clipDrag.mode === 'move') {
      const dur = c.end - c.start;
      c.start = snap(t - clipDrag.grabT);
      c.end = c.start + dur;
    } else if (clipDrag.mode === 'end') {
      c.end = Math.max(c.start + 0.5, snap(t));
    } else {
      c.start = Math.min(c.end - 0.5, snap(t));
    }
    renderVisual();
  });
  visualLane.addEventListener('pointerup', () => {
    if (clipDrag) edited();
    clipDrag = null;
  });
  visualLane.addEventListener('dblclick', (e) => {
    if (e.target.closest('[data-clip]')) return;
    const t = Math.round(xToTime(e.offsetX) * 2) / 2;
    const scene = engine.currentScene ? engine.currentScene.id : engine.sceneList[0].id;
    visualClips().push({ id: uid('v'), scene, start: t, end: t + 8, transition: { type: 'cut', duration: 0 } });
    edited();
  });

  // Drops: scenes from the bank onto the visual lane, samples from the kit
  // onto the audio lane.
  for (const lane of [visualLane, audioCanvas]) {
    lane.addEventListener('dragover', (e) => {
      e.preventDefault();
      root.classList.add('droppable');
    });
    lane.addEventListener('dragleave', () => root.classList.remove('droppable'));
  }
  visualLane.addEventListener('drop', (e) => {
    e.preventDefault();
    root.classList.remove('droppable');
    const scene = e.dataTransfer.getData('application/x-sway-scene');
    if (!scene) return;
    const t = Math.round(xToTime(e.offsetX) * 2) / 2;
    visualClips().push({ id: uid('v'), scene, start: t, end: t + 8, transition: { type: 'cut', duration: 0 } });
    edited();
  });
  audioCanvas.addEventListener('drop', async (e) => {
    e.preventDefault();
    root.classList.remove('droppable');
    const mediaId = e.dataTransfer.getData('application/x-sway-media');
    if (!mediaId) return;
    const t = Math.round(xToTime(e.offsetX) * 2) / 2;
    const buffer = await store.loadMediaBuffer(mediaId);
    if (!buffer) return;
    const media = store.project().media.find((m) => m.id === mediaId);
    audioClips().push({
      id: uid('c'),
      name: media ? media.name : '',
      media: mediaId,
      start: t,
      end: t + buffer.duration,
      offset: 0,
      gain: 1,
      fadeIn: 0,
      fadeOut: 0,
    });
    edited();
  });

  let lastPlayheadX = -1;
  return {
    render,
    edited,

    updatePlayhead() {
      const x = timeToX(transport.state.position);
      if (Math.abs(x - lastPlayheadX) < 0.5) return;
      lastPlayheadX = x;
      const w = root.clientWidth;
      if (x < 0 || x > w) {
        if (transport.state.playing && x > w) {
          scrollX = transport.state.position;
          render();
        }
        playhead.style.opacity = x < 0 ? '0' : '1';
      } else {
        playhead.style.opacity = '1';
      }
      playhead.style.transform = `translateX(${Math.max(0, Math.min(w, x)).toFixed(1)}px)`;
    },

    deleteSelected() {
      if (!selectedId) return false;
      const va = visualClips();
      const aa = audioClips();
      let idx = va.findIndex((c) => c.id === selectedId);
      if (idx >= 0) va.splice(idx, 1);
      else {
        idx = aa.findIndex((c) => c.id === selectedId);
        if (idx >= 0) aa.splice(idx, 1);
        else return false;
      }
      selectedId = null;
      edited();
      return true;
    },

    nudgeSelected(dt) {
      const clip = visualClips().find((c) => c.id === selectedId) || audioClips().find((c) => c.id === selectedId);
      if (!clip) return false;
      const dur = clip.end - clip.start;
      clip.start = Math.max(0, clip.start + dt);
      clip.end = clip.start + dur;
      edited();
      return true;
    },

    hasSelection() {
      return selectedId !== null;
    },
    clearSelection() {
      selectedId = null;
      render();
    },
    invalidateMedia(mediaId) {
      peaks.delete(mediaId);
    },
  };
}
