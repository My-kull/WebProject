import Header from "./components/header";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  return (
    <>
      <Header className="sticky top-0 z-10 w-full" />
      <Dashboard />
    </>
  );
}

export default App;
