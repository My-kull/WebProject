import ThemeToggle from "./ThemeToggle";

const Header = ({ className, onNavigateHome, showBack }) => {
  return (
    <header className={`bg-slate-800 text-white px-6 py-4 ${className || ""}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={onNavigateHome}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Back
            </button>
          )}
          <h1
            className="text-2xl font-bold cursor-pointer hover:text-cyan-400 transition-colors"
            onClick={onNavigateHome}
          >
            GameSite
          </h1>
        </div>

        <nav>
          <ul className="flex items-center gap-6">
            <li>
              <button
                onClick={onNavigateHome}
                className="hover:text-slate-300 transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <a
                href="/about"
                className="hover:text-slate-300 transition-colors"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="hover:text-slate-300 transition-colors"
              >
                Contact
              </a>
            </li>
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
