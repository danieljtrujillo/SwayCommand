// Scene registry. Every scene follows docs/SCENE_CONTRACT.md.
// Number keys in the perform screen select within the active project's pool,
// not this list, so the registry can grow past the digits.

import * as beams from './beams.js';
import * as swarm from './swarm.js';
import * as ribbons from './ribbons.js';
import * as voxels from './voxels.js';
import * as warp from './warp.js';
import * as nebula from './nebula.js';
import * as mandelbulb from './mandelbulb.js';
import * as cymatic from './cymatic.js';
import * as spectra from './spectra.js';
import * as vjshader from './vjshader.js';
import * as ferrofluid from './ferrofluid.js';
import * as chladni from './chladni.js';
import * as valley from './valley.js';
import * as lattice from './lattice.js';
import * as willidream from './willidream.js';
import * as naturestomb from './naturestomb.js';
import * as miraclemile from './miraclemile.js';

const modules = [
  beams, swarm, ribbons, voxels, warp, nebula, mandelbulb, cymatic,
  spectra, vjshader, ferrofluid, chladni, valley, lattice, willidream, naturestomb, miraclemile,
];

export const sceneList = modules.map((m) => m.meta);
export const creators = Object.fromEntries(modules.map((m) => [m.meta.id, m.createScene]));
