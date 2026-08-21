// Wavetable bank for the SwayCommand synth.
//
// Vital is a spectral-warping wavetable synth: each table is a series of
// frames, and the oscillator morphs continuously between them. Web Audio has
// no wavetable oscillator, but `createPeriodicWave` takes harmonic amplitudes,
// which is exactly how a wavetable frame is specified in the spectral domain.
// A frame therefore becomes a PeriodicWave, and the morph becomes a crossfade
// between the two PeriodicWaves the position sits between.
//
// Harmonic series are generated rather than sampled, so the bank costs a few
// kilobytes instead of a few megabytes and every table is band-limited by
// construction (no aliasing, which is what `createPeriodicWave` guarantees).

const HARMONICS = 64; // per frame; beyond this adds nothing audible at 44.1k
const FRAMES = 8; // frames per table, matching a small Vital table

/**
 * Each generator returns the amplitude of harmonic `n` (1-based) at morph
 * position `f` (0..1 across the table). Returning 0 leaves the harmonic out.
 */
const TABLE_GENS = {
  // Saw -> square: the classic init sweep. Even harmonics fade out as f rises.
  basic: (n, f) => {
    const saw = 1 / n;
    const square = n % 2 === 1 ? 1 / n : 0;
    return saw * (1 - f) + square * f;
  },
  // Sine -> saw: harmonics enter one at a time, so the morph reads as opening.
  harmonic: (n, f) => {
    const reach = 1 + f * (HARMONICS - 1);
    if (n > reach) return 0;
    const fade = Math.min(1, reach - n + 1);
    return (1 / n) * fade;
  },
  // Odd-harmonic hollow tone sweeping toward a reedy full spectrum.
  hollow: (n, f) => {
    if (n % 2 === 0) return f * 0.6 * (1 / n);
    return 1 / (n * (1 + f * 0.5));
  },
  // Formant-ish: two moving spectral peaks, the vowel-like Vital tables.
  formant: (n, f) => {
    const p1 = 3 + f * 9;
    const p2 = 11 + f * 20;
    const b1 = Math.exp(-Math.pow((n - p1) / 2.5, 2));
    const b2 = Math.exp(-Math.pow((n - p2) / 4.5, 2)) * 0.6;
    return (b1 + b2) / n ** 0.3;
  },
  // Bell/inharmonic-leaning: emphasises non-integer-feeling partial clusters.
  bell: (n, f) => {
    const cluster = Math.abs(Math.sin(n * (1.3 + f * 1.7)));
    return (cluster ** 3) / n ** 0.8;
  },
  // Pulse width modulation expressed spectrally: |sin(n*pi*w)| / n.
  pulse: (n, f) => {
    const w = 0.5 - f * 0.42; // 0.5 (square) -> 0.08 (thin pulse)
    return Math.abs(Math.sin(n * Math.PI * w)) / n;
  },
  // Noise-like: deterministic pseudo-random partial amplitudes, denser with f.
  noisy: (n, f) => {
    const h = Math.sin(n * 12.9898 + f * 78.233) * 43758.5453;
    const r = h - Math.floor(h);
    return (r * (0.3 + f * 0.7)) / n ** 0.5;
  },
};

export const TABLE_NAMES = Object.keys(TABLE_GENS);

/**
 * Builds every table once and caches the PeriodicWaves on the context.
 * Returns { get(name, position) -> {a, b, mix} } where a and b are the
 * PeriodicWaves to crossfade and mix is the blend factor.
 */
export function createWavetableBank(ctx) {
  const tables = new Map();

  function buildFrame(gen, f) {
    // Index 0 of a PeriodicWave is DC and must stay silent.
    const real = new Float32Array(HARMONICS + 1);
    const imag = new Float32Array(HARMONICS + 1);
    let peak = 0;
    for (let n = 1; n <= HARMONICS; n++) {
      const amp = gen(n, f) || 0;
      imag[n] = amp; // sine-phase partials
      peak += Math.abs(amp);
    }
    // Normalize so every frame has comparable loudness; without this the morph
    // audibly jumps in level as harmonics come and go.
    if (peak > 0) {
      const k = 1 / peak;
      for (let n = 1; n <= HARMONICS; n++) imag[n] *= k;
    }
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  function table(name) {
    let frames = tables.get(name);
    if (!frames) {
      const gen = TABLE_GENS[name] || TABLE_GENS.basic;
      frames = [];
      for (let i = 0; i < FRAMES; i++) frames.push(buildFrame(gen, i / (FRAMES - 1)));
      tables.set(name, frames);
    }
    return frames;
  }

  return {
    names: TABLE_NAMES,
    frames: FRAMES,
    /** position 0..1 across the table -> the two frames to blend and the mix. */
    get(name, position) {
      const frames = table(name);
      const p = Math.min(0.9999, Math.max(0, position)) * (FRAMES - 1);
      const i = Math.floor(p);
      return { a: frames[i], b: frames[Math.min(FRAMES - 1, i + 1)], mix: p - i };
    },
  };
}
