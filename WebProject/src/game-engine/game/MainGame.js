import { Engine } from "../Engine.js";

export function bootGame(canvas, options = {}) {
  const engine = new Engine(canvas, options);
  engine.start();
  return engine;
}
