const GameCard = ({ game, onPlay }) => {
  return (
    <div
      className="group relative bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1 cursor-pointer"
      onClick={() => onPlay(game.id)}
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-slate-900 flex items-center justify-center overflow-hidden">
        <span className="text-6xl">{game.icon}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        {game.tag && (
          <span className="absolute top-3 right-3 text-xs font-semibold uppercase tracking-wider bg-cyan-500/90 text-white px-2 py-1 rounded">
            {game.tag}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-cyan-500 transition-colors">
          {game.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {game.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {game.tags?.map((t) => (
              <span
                key={t}
                className="text-xs bg-slate-300/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>
          <button
            className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onPlay(game.id);
            }}
          >
            Play →
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
