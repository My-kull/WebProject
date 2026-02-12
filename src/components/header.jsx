import ThemeToggle from "./ThemeToggle";

const Header = ({ className }) => {
  return (
    <header className={`bg-slate-800 text-white px-6 py-4 ${className || ""}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold">GameSite</h1>

        <nav>
          <ul className="flex items-center gap-6">
            <li>
              <a href="/" className="hover:text-slate-300 transition-colors">
                Home
              </a>
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
                href="/services"
                className="hover:text-slate-300 transition-colors"
              >
                Services
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
