import { useState } from "react";
import Header from "./components/header";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import "./App.css";

function App() {
  const [currentGame, setCurrentGame] = useState(null);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
        <Header
          className="sticky top-0 z-10 w-full"
          onNavigateHome={() => setCurrentGame(null)}
          showBack={!!currentGame}
        />
        {currentGame ? (
          <Dashboard gameId={currentGame} />
        ) : (
          <HomePage onSelectGame={(id) => setCurrentGame(id)} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
