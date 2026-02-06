import Header from "./components/header";
import Dashboard from "./components/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
        <Header className="sticky top-0 z-10 w-full" />
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
