import React, { useEffect, useRef } from "react";
import { bootGame } from "../game-engine/game/MainGame.js";

const GameCanvas = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;
    const engine = bootGame(canvasRef.current);
    engineRef.current = engine;

    return () => {
      engineRef.current?.stop?.();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="col-span-2">
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border-4 border-cyan-400 rounded-lg p-6 h-full flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300">
              Iso Shmup
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Move with WASD. Shoot with Space or mouse.
            </p>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-700/70 dark:text-cyan-300/70">
            Wave Demo
          </div>
        </div>

        <div className="flex-1 min-h-[520px] bg-slate-950 border-2 border-cyan-500/80 dark:border-cyan-300/80 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            id="game"
            className="w-full h-full"
            aria-label="Isometric shooter game canvas"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>Survive all waves to win.</span>
          <span>Reload the page to restart.</span>
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
