import { Engine } from "../Engine.js";

export function bootGame(canvas) {
  const engine = new Engine(canvas);
  engine.start();
  return engine;
}
