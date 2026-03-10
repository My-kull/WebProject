import React, { useState } from "react";

const DOOM_WEB_URL = "https://js-dos.com/games/doom.exe.html";

const DoomGame = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="col-span-1">
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border-4 border-rose-500 rounded-lg p-6 h-full flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-rose-700 dark:text-rose-300">
              DOOM
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Browser build powered by a WebAssembly DOS emulator.
            </p>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-rose-700/80 dark:text-rose-300/70">
            Classic FPS
          </div>
        </div>

        <div className="relative flex-1 min-h-[520px] bg-black border-2 border-rose-500/80 dark:border-rose-300/80 rounded-lg overflow-hidden">
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-200 bg-black/80 z-10">
              Loading DOOM...
            </div>
          )}

          {hasError ? (
            <div className="h-full w-full flex items-center justify-center p-6 text-center text-sm text-slate-200">
              DOOM failed to load. Check your internet connection or try again.
            </div>
          ) : (
            <iframe
              title="DOOM browser game"
              src={DOOM_WEB_URL}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>Controls: keyboard + mouse.</span>
          <a
            href={DOOM_WEB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-rose-700 dark:text-rose-300 hover:underline"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
};

export default DoomGame;
