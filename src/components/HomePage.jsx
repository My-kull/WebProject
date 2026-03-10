import GameCard from "./GameCard";

const games = [
  {
    id: "iso-shmup",
    title: "Iso Shmup",
    description:
      "An isometric shoot-'em-up. Move with WASD, shoot with Space or mouse. Survive all waves to win!",
    icon: "🚀",
    tag: "Alpha",
    tags: ["Action", "Shooter"],
  },
  {
    id: "doom-wasm",
    title: "DOOM",
    description:
      "Classic DOOM running in the browser via a WebAssembly-powered DOS emulator.",
    icon: "👹",
    tag: "Classic",
    tags: ["FPS", "Retro"],
  },
];

const HomePage = ({ onSelectGame }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 transition-colors">
      {/* Hero */}
      <section className="text-center py-16 px-4">
        <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
          🎮 Game Arcade
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Browse and play our collection of browser-based games. Pick one and
          jump right in!
        </p>
      </section>

      {/* Game Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onSelectGame} />
          ))}
        </div>

        {games.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-12">
            No games available yet. Check back soon!
          </p>
        )}
      </section>
    </div>
  );
};

export default HomePage;
