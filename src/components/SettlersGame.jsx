import { useState } from "react";
import DosPlayer from "./DosPlayer";

const SETTLERS_BUNDLE_PATH = "/games/settlers.jsdos";

const SettlersGame = () => {
  const [hasBundle, setHasBundle] = useState(null);
  const [started, setStarted] = useState(false);

  // Check if bundle exists on first render
  if (hasBundle === null) {
    fetch(SETTLERS_BUNDLE_PATH, { method: "HEAD" })
      .then((res) => setHasBundle(res.ok))
      .catch(() => setHasBundle(false));
  }

  return (
    <div className="col-span-1">
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border-4 border-amber-500 rounded-lg p-6 h-full flex flex-col gap-4 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              The Settlers
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Running locally via js-dos WebAssembly DOS emulator.
            </p>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-amber-700/80 dark:text-amber-300/70">
            Classic RTS
          </div>
        </div>

        <div className="relative flex-1 min-h-[520px] bg-black border-2 border-amber-500/80 dark:border-amber-300/80 rounded-lg overflow-hidden">
          {hasBundle === null && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-200 bg-black/80 z-10">
              Checking for game bundle...
            </div>
          )}

          {hasBundle === false && (
            <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-6">
              <div className="text-4xl">🏰</div>
              <h3 className="text-lg font-bold text-amber-300">
                Game Bundle Not Found
              </h3>
              <div className="text-sm text-slate-300 max-w-md space-y-3">
                <p>
                  Place your <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-300">settlers.jsdos</code> bundle
                  in <code className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-300">public/games/</code>
                </p>
                <div className="text-left bg-slate-800 rounded-lg p-4 text-xs space-y-2">
                  <p className="text-slate-400">How to create a .jsdos bundle:</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300">
                    <li>Go to <a href="https://dos.zone/studio" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">dos.zone/studio</a></li>
                    <li>Upload your Settlers game files</li>
                    <li>Configure &amp; download the .jsdos bundle</li>
                    <li>Save it as <code className="text-amber-300">public/games/settlers.jsdos</code></li>
                  </ol>
                </div>
              </div>
              <button
                onClick={() => setHasBundle(null)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {hasBundle && !started && (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">🏰</div>
              <button
                onClick={() => setStarted(true)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-lg font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/30"
              >
                ▶ Launch The Settlers
              </button>
              <p className="text-xs text-slate-400">
                Click to start the DOS emulator
              </p>
            </div>
          )}

          {hasBundle && started && (
            <DosPlayer bundleUrl={SETTLERS_BUNDLE_PATH} />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>Controls: keyboard + mouse.</span>
          <a
            href="https://dos.zone/studio"
            target="_blank"
            rel="noreferrer"
            className="text-amber-700 dark:text-amber-300 hover:underline"
          >
            Create bundles at DOS.Zone Studio
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettlersGame;
