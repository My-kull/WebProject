import { Engine } from "../Engine.js";

/**
 * Game entry point wrapper.
 * Keep this file game-specific, and keep Engine reusable.
 */
export function bootGame(canvas) {
  const engine = new Engine(canvas);
  engine.start();
  return engine;
}
