import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const Header = ({ className, onNavigateHome, onNavigate, showBack }) => {
  const { isAuthenticated, email, clearAuth } = useAuth();

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
              <button
                onClick={() => onNavigate("about")}
                className="hover:text-slate-300 transition-colors"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("contact")}
                className="hover:text-slate-300 transition-colors"
              >
                Contact
              </button>
            </li>
            <li>
              <ThemeToggle />
            </li>
            {isAuthenticated ? (
              <li className="flex items-center gap-3">
                <span className="text-sm text-slate-300 hidden sm:inline">
                  {email}
                </span>
                <button
                  onClick={clearAuth}
                  className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    className="text-sm hover:text-cyan-400 transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="text-sm bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
