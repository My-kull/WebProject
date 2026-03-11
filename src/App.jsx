import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Header from "./components/header";
import HomePage from "./components/HomePage";
import Dashboard from "./components/Dashboard";
import AboutPage from "./components/AboutPage";
import ContactPage from "./components/ContactPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { ThemeProvider } from "./context/ThemeContext";
import "./App.css";

function AppContent() {
  const [currentGame, setCurrentGame] = useState(null);
  const navigate = useNavigate();

  const navigateHome = () => {
    setCurrentGame(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
      <Header
        className="sticky top-0 z-10 w-full"
        onNavigateHome={navigateHome}
        onNavigate={(page) => {
          setCurrentGame(null);
          navigate(`/${page}`);
        }}
        showBack={!!currentGame}
      />
      {currentGame ? (
        <Dashboard gameId={currentGame} />
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onSelectGame={(id) => setCurrentGame(id)}
              />
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
