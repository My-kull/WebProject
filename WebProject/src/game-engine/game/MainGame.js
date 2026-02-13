import { Engine } from "../Engine.js";

 bootGame(canvas) {
  const engine = new Engine(canvas);
  engine.start();
  return engine;
}
