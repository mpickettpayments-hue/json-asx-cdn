// engine/registry.js
// Chooses an engine based on channel or app override.
// Contract: createEngine({ mount, workers, vdom }) -> { init(), load(spec), tick(dt), destroy() }

import { createEngine as create2D } from './json-2d/engine.js';
import { createEngine as createXJSON } from './xjson/engine.js';
import { createEngine as create3D } from './json-3d/engine.js';
import { vdom } from './shared/vdom.js';

export function pickEngineId({ channel, override }) {
  if (override) return override; // explicit in spec
  if (channel === 'latest') return 'json-2d';
  if (channel === 'stable') return 'xjson';
  if (channel === 'nightly') return 'json-3d';
  return 'json-2d';
}

export function createEngine({ id, mount, workers }) {
  const common = { mount, workers, vdom };
  if (id === 'json-2d')  return create2D(common);
  if (id === 'xjson')    return createXJSON(common);
  if (id === 'json-3d')  return create3D(common);
  return create2D(common);
}
