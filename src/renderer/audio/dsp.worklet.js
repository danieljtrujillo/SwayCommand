// AudioWorklet processors for the track effects that Web Audio's native nodes
// cannot express: a sample-and-hold bit crusher and a tempo-synced trance
// gate. Loaded once by renderer/audio/trackfx.js (ensureWorklet) from the
// dist/ directory; build-renderer.js copies this file beside the bundle.
// Everything here runs on the audio thread: no allocation per block.

class Crusher extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bits', defaultValue: 8, minValue: 1, maxValue: 16, automationRate: 'k-rate' },
      { name: 'rate', defaultValue: 0.5, minValue: 0.01, maxValue: 1, automationRate: 'k-rate' },
      { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }
  constructor() {
    super();
    this.phase = 1; // take the first sample immediately
    this.held = new Float32Array(8);
  }
  process(inputs, outputs, params) {
    const inp = inputs[0];
    const out = outputs[0];
    if (!inp || !inp.length || !out || !out.length) return true;
    const steps = Math.pow(2, params.bits[0]);
    const rate = params.rate[0];
    const mix = params.mix[0];
    const chans = Math.min(inp.length, this.held.length);
    const n = inp[0].length;
    for (let i = 0; i < n; i++) {
      this.phase += rate;
      if (this.phase >= 1) {
        this.phase -= 1;
        for (let c = 0; c < chans; c++) this.held[c] = Math.round(inp[c][i] * steps) / steps;
      }
      for (let c = 0; c < out.length; c++) {
        const ic = c < inp.length ? c : inp.length - 1;
        const hc = ic < chans ? ic : chans - 1;
        out[c][i] = inp[ic][i] * (1 - mix) + this.held[hc] * mix;
      }
    }
    return true;
  }
}

class Gate extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rate', defaultValue: 4, minValue: 0.05, maxValue: 64, automationRate: 'k-rate' }, // Hz
      { name: 'depth', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'shape', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ];
  }
  constructor() {
    super();
    this.phase = 0;
    // The transport posts the grid phase when it (re)schedules, so the gate
    // opens on the beat instead of wherever the node happened to be.
    this.port.onmessage = (e) => {
      if (e.data && e.data.type === 'phase') this.phase = Math.max(0, Math.min(0.999999, Number(e.data.phase) || 0));
    };
  }
  process(inputs, outputs, params) {
    const inp = inputs[0];
    const out = outputs[0];
    if (!inp || !inp.length || !out || !out.length) return true;
    const inc = params.rate[0] / sampleRate;
    const depth = params.depth[0];
    const edge = 0.02 + params.shape[0] * 0.28;
    const n = inp[0].length;
    for (let i = 0; i < n; i++) {
      const ph = this.phase;
      let env = 0;
      if (ph < 0.5) {
        const a = ph / edge;
        const b = (0.5 - ph) / edge;
        env = (a < 1 ? a : 1) * (b < 1 ? b : 1);
      }
      const g = 1 - depth * (1 - env);
      for (let c = 0; c < out.length; c++) {
        const ic = c < inp.length ? c : inp.length - 1;
        out[c][i] = inp[ic][i] * g;
      }
      this.phase += inc;
      if (this.phase >= 1) this.phase -= 1;
    }
    return true;
  }
}

registerProcessor('sway-crusher', Crusher);
registerProcessor('sway-gate', Gate);
