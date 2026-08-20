// Assignment rail — the editor for whatever control is selected on the deck.
// Pads pick an action (sample / visual / punch), knobs pick a continuous
// target with a range, buttons learn a CC and pick a toggle, gesture
// dimensions hold modulation routes. All edits mutate the project's live
// assignment objects (the router holds the same references) and report
// through onChanged so the deck labels and dirty flag stay true.

import { parseTarget } from '../../shared/swayproject.js';

const $ = (sel) => document.querySelector(sel);

// Control ids (pad:5, knob:3, button:2, xy:x, gesture:press) are a different
// grammar from assignment targets — parseTarget rejects them by design.
function ctlParts(id) {
  const at = id.indexOf(':');
  return { ns: id.slice(0, at), key: id.slice(at + 1) };
}

const HEADER_NAMES = {
  'xy:x': 'X',
  'xy:y': 'Y',
  'gesture:pulse': 'PULSE',
  'gesture:press': 'PRESS',
  'gesture:sway': 'SWAY',
};

const ENGINE_TARGETS = [
  ['engine:hue', 'palette hue', 0, 1],
  ['engine:fadeTime', 'fade length', 1, 8],
  ['engine:intensity', 'intensity', 0, 1],
];
const SAMPLER_TARGETS = [
  ['sampler:master', 'kit level', 0, 1],
  ['sampler:cutoff', 'kit filter', 0, 1],
  ['sampler:rate', 'kit rate', 0, 1],
  ['sampler:send', 'kit delay', 0, 1],
];
const TOGGLE_TARGETS = [
  ['engine:fxEnabled', 'rack active'],
  ['engine:autoVJ', 'auto rotation'],
  ['synth:enabled', 'synth notes'],
  ['transport:playPause', 'play / pause'],
  ['transport:stop', 'stop'],
];

export function createAssign(deps) {
  const { router, sampler, synth, engine, fxRanges, onChanged } = deps;
  let selected = null;
  let follow = true;
  let learning = false;

  const header = $('#assign-target');
  const body = $('#assign-body');

  function asg() {
    return router.getAssignments();
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function headerName(target) {
    if (!target) return 'SELECT A CONTROL';
    if (HEADER_NAMES[target]) return HEADER_NAMES[target];
    const t = ctlParts(target);
    if (t.ns === 'pad') return `PAD ${Number(t.key) + 1}`;
    if (t.ns === 'knob') return `KNOB ${Number(t.key) + 1}`;
    if (t.ns === 'button') return `BUTTON ${Number(t.key) + 1}`;
    return target.toUpperCase();
  }

  function numericFxOptions(current) {
    return Object.entries(fxRanges)
      .filter(([, spec]) => Array.isArray(spec))
      .map(([key, spec]) => `<option value="fx:${key}" data-min="${spec[0]}" data-max="${spec[1]}"${`fx:${key}` === current ? ' selected' : ''}>${key}</option>`)
      .join('');
  }

  function booleanFxOptions(current) {
    return Object.entries(fxRanges)
      .filter(([, spec]) => spec === true)
      .map(([key]) => `<option value="fx:${key}"${`fx:${key}` === current ? ' selected' : ''}>${key}</option>`)
      .join('');
  }

  function continuousTargetOptions(current) {
    const groups = [];
    groups.push(`<optgroup label="ENGINE">${ENGINE_TARGETS.map(([v, l, lo, hi]) => `<option value="${v}" data-min="${lo}" data-max="${hi}"${v === current ? ' selected' : ''}>${l}</option>`).join('')}</optgroup>`);
    groups.push(`<optgroup label="RACK">${numericFxOptions(current)}</optgroup>`);
    const manifest = synth.controlManifest().filter((c) => c.kind === 'range');
    groups.push(`<optgroup label="SYNTH">${manifest.map((c) => `<option value="synth:${c.key}" data-min="${c.min}" data-max="${c.max}"${`synth:${c.key}` === current ? ' selected' : ''}>${c.label} (${c.group.toLowerCase()})</option>`).join('')}</optgroup>`);
    groups.push(`<optgroup label="KIT">${SAMPLER_TARGETS.map(([v, l, lo, hi]) => `<option value="${v}" data-min="${lo}" data-max="${hi}"${v === current ? ' selected' : ''}>${l}</option>`).join('')}</optgroup>`);
    return groups.join('');
  }

  function sampleOptions(current) {
    const rows = sampler.listSamples().map((s) => `<option value="${esc(s.id)}"${s.id === current ? ' selected' : ''}>${esc(s.name)}</option>`);
    return `<option value=""${current ? '' : ' selected'}>—</option>${rows.join('')}`;
  }

  function sceneOptions(current) {
    return engine.sceneList.map((s) => `<option value="${s.id}"${s.id === current ? ' selected' : ''}>${s.name}</option>`).join('');
  }

  function renderHeader() {
    const learnable = selected && (/^knob:|^xy:|^gesture:/.test(selected) || selected.startsWith('button:'));
    header.innerHTML =
      `<span>${headerName(selected)}</span>` +
      `<button class="chip${follow ? ' on' : ''}" data-act="follow" title="Hardware touch selects here">FOLLOW</button>` +
      (learnable ? `<button class="chip${learning ? ' armed' : ''}" data-act="learn" title="Bind the next incoming CC">LEARN</button>` : '') +
      (selected ? '<button class="chip" data-act="clear">CLEAR</button>' : '');
  }

  function renderBody() {
    if (!selected) {
      body.innerHTML = '<div class="empty">Click a control on the deck, or touch it on the Sway, to edit what it does.</div>';
      return;
    }
    const t = ctlParts(selected);
    if (t.ns === 'pad') return renderPad(Number(t.key));
    if (t.ns === 'knob') return renderKnob(Number(t.key));
    if (t.ns === 'button') return renderButton(Number(t.key));
    return renderRoutes(selected);
  }

  function renderPad(i) {
    const a = asg().pads[i];
    const kind = a ? a.type : 'off';
    const rows = [
      `<div class="assign-row"><span>ACTION</span><select data-pad-kind>
        <option value="off"${kind === 'off' ? ' selected' : ''}>—</option>
        <option value="sample"${kind === 'sample' ? ' selected' : ''}>sample</option>
        <option value="scene"${kind === 'scene' ? ' selected' : ''}>visual</option>
        <option value="fxPunch"${kind === 'fxPunch' ? ' selected' : ''}>punch</option>
      </select></div>`,
    ];
    if (kind === 'sample') {
      const kit = sampler.getKit();
      const pad = kit.pads && kit.pads[i];
      rows.push(`<div class="assign-row"><span>SAMPLE</span><select data-pad-sample>${sampleOptions(pad && pad.id)}</select></div>`);
      if (pad && pad.id) {
        rows.push(`<div class="assign-row"><span>MODE</span><select data-pad-opt="mode">
          <option value="oneshot"${pad.mode === 'oneshot' ? ' selected' : ''}>one-shot</option>
          <option value="loop"${pad.mode === 'loop' ? ' selected' : ''}>loop</option>
          <option value="gate"${pad.mode === 'gate' ? ' selected' : ''}>gate</option>
        </select></div>`);
        rows.push(`<div class="assign-row"><span>GAIN</span><input type="range" data-pad-opt="gain" min="0" max="1.5" step="0.01" value="${pad.gain}"><b>${pad.gain.toFixed(2)}</b></div>`);
        rows.push(`<div class="assign-row"><span>CHOKE</span><input type="number" data-pad-opt="chokeGroup" min="0" max="8" step="1" value="${pad.chokeGroup ?? ''}" placeholder="—"></div>`);
        rows.push('<div class="assign-row"><span></span><button class="btn btn-ghost btn-small" data-pad-trig>TRIG</button></div>');
      }
    } else if (kind === 'scene') {
      rows.push(`<div class="assign-row"><span>VISUAL</span><select data-pad-scene>${sceneOptions(a.scene)}</select></div>`);
      rows.push(`<div class="assign-row"><span>ENTRY</span><select data-pad-trans>
        <option value="cut"${a.transition.type === 'cut' ? ' selected' : ''}>cut</option>
        <option value="crossfade"${a.transition.type === 'crossfade' ? ' selected' : ''}>fade</option>
      </select>${a.transition.type === 'crossfade' ? `<input type="number" data-pad-fade min="0.2" max="20" step="0.1" value="${a.transition.duration}"> s` : ''}</div>`);
    } else if (kind === 'fxPunch') {
      const spec = (parseTarget(`fx:${a.param}`) && fxRanges[a.param]) || [0, 1];
      const [lo, hi] = Array.isArray(spec) ? spec : [0, 1];
      rows.push(`<div class="assign-row"><span>PARAM</span><select data-pad-param>${numericFxOptions(`fx:${a.param}`)}</select></div>`);
      rows.push(`<div class="assign-row"><span>VALUE</span><input type="range" data-pad-value min="${lo}" max="${hi}" step="${(hi - lo) / 200}" value="${a.value}"><b>${Number(a.value).toFixed(2)}</b></div>`);
    }
    body.innerHTML = rows.join('');
  }

  function renderKnob(i) {
    const a = asg().knobs[i];
    const rows = [
      `<div class="assign-row"><span>TARGET</span><select data-knob-target>
        <option value=""${a ? '' : ' selected'}>—</option>${continuousTargetOptions(a && a.target)}
      </select></div>`,
    ];
    if (a) {
      rows.push(`<div class="assign-row"><span>RANGE</span><input type="number" data-knob-min step="any" value="${a.min}"> – <input type="number" data-knob-max step="any" value="${a.max}"></div>`);
      rows.push(`<div class="assign-row"><span>CURVE</span><select data-knob-curve>
        <option value="linear"${a.curve === 'linear' ? ' selected' : ''}>linear</option>
        <option value="detent"${a.curve === 'detent' ? ' selected' : ''}>center detent</option>
      </select></div>`);
    }
    body.innerHTML = rows.join('');
  }

  function renderButton(i) {
    const b = asg().buttons[i];
    const rows = [
      `<div class="assign-row"><span>CC</span><b>${b.cc === null ? '—' : b.cc}</b><span style="min-width:0">${b.cc === null ? 'LEARN captures the hardware button' : ''}</span></div>`,
      `<div class="assign-row"><span>TARGET</span><select data-btn-target>
        <option value=""${b.action ? '' : ' selected'}>—</option>
        <optgroup label="SWITCHES">${TOGGLE_TARGETS.map(([v, l]) => `<option value="${v}"${b.action && b.action.target === v ? ' selected' : ''}>${l}</option>`).join('')}</optgroup>
        <optgroup label="RACK">${booleanFxOptions(b.action && b.action.target)}</optgroup>
      </select></div>`,
    ];
    body.innerHTML = rows.join('');
  }

  function renderRoutes(source) {
    const routes = asg().gestures;
    const rows = [];
    routes.forEach((g, gi) => {
      if (g.source !== source) return;
      rows.push(
        `<div class="assign-list" data-route="${gi}">
          <div class="assign-row"><span>ROUTE</span><select data-route-target="${gi}">${continuousTargetOptions(g.target)}</select>
            <button class="btn btn-ghost btn-small" data-route-del="${gi}">✕</button></div>
          <div class="assign-row"><span>DEPTH</span><input type="number" data-route-min="${gi}" step="any" value="${g.min}"> – <input type="number" data-route-max="${gi}" step="any" value="${g.max}">
            <input type="checkbox" data-route-on="${gi}"${g.enabled ? ' checked' : ''} title="active"></div>
        </div>`
      );
    });
    if (!rows.length) rows.push('<div class="empty">No routes. This dimension can drive any engine, rack, synth, or kit parameter.</div>');
    rows.push('<div class="assign-row"><span></span><button class="btn btn-ghost btn-small" data-route-add>ADD ROUTE</button></div>');
    body.innerHTML = rows.join('');
  }

  function changed(structural) {
    if (onChanged) onChanged();
    if (structural) renderBody();
  }

  // --- events ---------------------------------------------------------------

  header.addEventListener('click', async (e) => {
    const chip = e.target.closest('[data-act]');
    if (!chip) return;
    if (chip.dataset.act === 'follow') {
      follow = !follow;
      renderHeader();
    } else if (chip.dataset.act === 'clear' && selected) {
      const t = ctlParts(selected);
      if (selected.startsWith('pad:')) {
        asg().pads[Number(t.key)] = null;
        sampler.clearPad(Number(t.key));
      } else if (selected.startsWith('knob:')) {
        asg().knobs[Number(t.key)] = null;
      } else if (selected.startsWith('button:')) {
        asg().buttons[Number(t.key)] = { cc: null, channel: null, action: null };
      } else {
        const g = asg().gestures;
        for (let i = g.length - 1; i >= 0; i--) if (g[i].source === selected) g.splice(i, 1);
      }
      changed(true);
    } else if (chip.dataset.act === 'learn' && selected && !learning) {
      learning = true;
      renderHeader();
      deps.onLearnArmed && deps.onLearnArmed(true);
      try {
        if (selected.startsWith('button:')) {
          // Capture the CC into the button slot via a throwaway learn target.
          const slot = ctlParts(selected).key;
          const result = await router.learnBinding(`button:${slot}`);
          const b = asg().buttons[Number(slot)];
          b.cc = result.cc;
          // The captured CC is a button, not a continuous control — drop the
          // override the learn call recorded so it never drives a knob path.
          const overrides = deps.midi.getOverrides();
          delete overrides[result.target];
          deps.midi.setOverrides(overrides);
        } else {
          await router.learnBinding(selected);
        }
      } finally {
        learning = false;
        renderHeader();
        deps.onLearnArmed && deps.onLearnArmed(false);
        changed(true);
      }
    }
  });

  body.addEventListener('change', (e) => {
    if (!selected) return;
    const t = ctlParts(selected);
    const el = e.target;

    if (selected.startsWith('pad:')) {
      const i = Number(t.key);
      if (el.matches('[data-pad-kind]')) {
        const kind = el.value;
        if (kind === 'off') asg().pads[i] = null;
        else if (kind === 'sample') asg().pads[i] = { type: 'sample', pad: i };
        else if (kind === 'scene') asg().pads[i] = { type: 'scene', scene: engine.sceneList[0].id, transition: { type: 'cut', duration: 0 } };
        else asg().pads[i] = { type: 'fxPunch', param: 'glitch', value: 0.8 };
        return changed(true);
      }
      if (el.matches('[data-pad-sample]')) {
        if (el.value) sampler.assignPad(i, el.value, padOpts(i));
        else sampler.clearPad(i);
        return changed(true);
      }
      if (el.matches('[data-pad-opt]')) {
        const kit = sampler.getKit();
        const pad = kit.pads && kit.pads[i];
        if (pad && pad.id) sampler.assignPad(i, pad.id, padOpts(i));
        return changed(false);
      }
      const a = asg().pads[i];
      if (el.matches('[data-pad-scene]')) { a.scene = el.value; return changed(false); }
      if (el.matches('[data-pad-trans]')) {
        a.transition.type = el.value;
        if (el.value === 'crossfade' && !a.transition.duration) a.transition.duration = 2.5;
        return changed(true);
      }
      if (el.matches('[data-pad-fade]')) { a.transition.duration = Number(el.value) || 0; return changed(false); }
      if (el.matches('[data-pad-param]')) {
        a.param = parseTarget(el.value).key;
        const spec = fxRanges[a.param];
        if (Array.isArray(spec)) a.value = Math.min(Math.max(a.value, spec[0]), spec[1]);
        return changed(true);
      }
      if (el.matches('[data-pad-value]')) { a.value = Number(el.value); return changed(false); }
    }

    if (selected.startsWith('knob:')) {
      const i = Number(t.key);
      if (el.matches('[data-knob-target]')) {
        if (!el.value) asg().knobs[i] = null;
        else {
          const opt = el.selectedOptions[0];
          asg().knobs[i] = {
            target: el.value,
            min: Number(opt.dataset.min ?? 0),
            max: Number(opt.dataset.max ?? 1),
            curve: 'linear',
          };
        }
        return changed(true);
      }
      const a = asg().knobs[i];
      if (!a) return;
      if (el.matches('[data-knob-min]')) a.min = Number(el.value) || 0;
      if (el.matches('[data-knob-max]')) a.max = Number(el.value) || 0;
      if (el.matches('[data-knob-curve]')) a.curve = el.value;
      return changed(false);
    }

    if (selected.startsWith('button:')) {
      const b = asg().buttons[Number(t.key)];
      if (el.matches('[data-btn-target]')) {
        b.action = el.value ? { type: 'toggle', target: el.value } : null;
        return changed(false);
      }
    }

    // gesture / xy routes
    const gi = Number(el.dataset.routeTarget ?? el.dataset.routeMin ?? el.dataset.routeMax ?? el.dataset.routeOn);
    const g = asg().gestures[gi];
    if (!g) return;
    if (el.dataset.routeTarget !== undefined) {
      g.target = el.value;
      const opt = el.selectedOptions[0];
      g.min = Number(opt.dataset.min ?? g.min);
      g.max = Number(opt.dataset.max ?? g.max);
      return changed(true);
    }
    if (el.dataset.routeMin !== undefined) g.min = Number(el.value) || 0;
    if (el.dataset.routeMax !== undefined) g.max = Number(el.value) || 0;
    if (el.dataset.routeOn !== undefined) g.enabled = el.checked;
    changed(false);
  });

  body.addEventListener('input', (e) => {
    // live readouts for range rows
    const el = e.target;
    if (el.type !== 'range') return;
    const b = el.parentElement.querySelector('b');
    if (b) b.textContent = Number(el.value).toFixed(2);
  });

  body.addEventListener('click', (e) => {
    if (!selected) return;
    if (e.target.closest('[data-pad-trig]')) {
      sampler.trigger(Number(ctlParts(selected).key), 0.9);
      return;
    }
    const del = e.target.closest('[data-route-del]');
    if (del) {
      asg().gestures.splice(Number(del.dataset.routeDel), 1);
      return changed(true);
    }
    if (e.target.closest('[data-route-add]')) {
      asg().gestures.push({ source: selected, target: 'fx:glitch', min: 0, max: 1, curve: 'linear', enabled: true });
      return changed(true);
    }
  });

  function padOpts(i) {
    const mode = body.querySelector('[data-pad-opt="mode"]');
    const gain = body.querySelector('[data-pad-opt="gain"]');
    const choke = body.querySelector('[data-pad-opt="chokeGroup"]');
    const kit = sampler.getKit();
    const pad = (kit.pads && kit.pads[i]) || {};
    return {
      mode: mode ? mode.value : pad.mode || 'oneshot',
      gain: gain ? Number(gain.value) : pad.gain ?? 1,
      chokeGroup: choke && choke.value !== '' ? Number(choke.value) : null,
      loop: (mode ? mode.value : pad.mode) === 'loop',
    };
  }

  renderHeader();
  renderBody();

  return {
    select(target) {
      selected = target;
      learning = false;
      renderHeader();
      renderBody();
    },
    current() {
      return selected;
    },
    followEnabled() {
      return follow;
    },
    refresh() {
      renderBody();
    },
  };
}
