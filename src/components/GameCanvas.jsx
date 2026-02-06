import React from "react";

const GameCanvas = () => {
  return (
    <div className="col-span-2">
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border-4 border-cyan-400 rounded-lg p-8 h-full flex flex-col items-center justify-center transition-colors">
        <h2 className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mb-4">
          Joku erittäin luova nimi
        </h2>
        <div className="text-2xl text-slate-500 dark:text-slate-400 mb-8">
          🎮 Game Canvas (32x32 Textures)
        </div>
        <div className="w-full h-96 bg-slate-100 dark:bg-slate-950 border-2 border-cyan-500 dark:border-cyan-300 rounded flex items-center justify-center mb-6">
          <span className="text-cyan-600 dark:text-cyan-300 text-xl">Coming Soon...</span>
        </div>
        <button className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white dark:text-slate-900 font-bold rounded transition">
          Play Now
        </button>
      </div>
    </div>
  );
};

export default GameCanvas;
