import Header from "./components/header";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <Header />
      
      <div className="max-w-7xl mx-auto mt-8">
        <div className="grid grid-cols-4 gap-4 h-screen">
          <div className="space-y-4">
            {/* Settings Box */}
            <div className="bg-slate-700 border-2 border-cyan-400 rounded-lg p-4 h-64">
              <h3 className="text-cyan-400 font-bold text-lg mb-4">⚙️ Settings</h3>
              <div className="space-y-2 text-slate-300 text-sm">
                <div>Volume: 80%</div>
                <div>Difficulty: Hard</div>
                <div>Graphics: High</div>
              </div>
            </div>
            
            {/* Stats Box */}
            <div className="bg-slate-700 border-2 border-purple-400 rounded-lg p-4 flex-1">
              <h3 className="text-purple-400 font-bold text-lg mb-4">📊 Stats</h3>
              <div className="space-y-2 text-slate-300 text-sm">
                <div>Best Score: 9,999</div>
                <div>Level: 5</div>
                <div>Playtime: 12h</div>
              </div>
            </div>
          </div>

          {/* Center Column - Main Game Area */}
          <div className="col-span-2">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-cyan-400 rounded-lg p-8 h-full flex flex-col items-center justify-center">
              <h2 className="text-4xl font-bold text-cyan-400 mb-4">Joku erittäin luova nimi</h2>
              <div className="text-2xl text-slate-400 mb-8">
                🎮 Game Canvas (32x32 Textures)
              </div>
              <div className="w-full h-96 bg-slate-950 border-2 border-cyan-300 rounded flex items-center justify-center mb-6">
                <span className="text-cyan-300 text-xl">Coming Soon...</span>
              </div>
              <button className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold rounded transition">
                Play Now
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Controls Box */}
            <div className="bg-slate-700 border-2 border-green-400 rounded-lg p-4 h-64">
              <h3 className="text-green-400 font-bold text-lg mb-4">🎮 Controls</h3>
              <div className="space-y-2 text-slate-300 text-xs">
                <div><span className="font-bold">WASD</span> - Move</div>
                <div><span className="font-bold">Space</span> - Shoot</div>
                <div><span className="font-bold">E</span> - Special</div>
              </div>
            </div>
            
            <div className="bg-slate-700 border-2 border-yellow-400 rounded-lg p-4 flex-1">
              <h3 className="text-yellow-400 font-bold text-lg mb-4">ℹ️ Info</h3>
              <div className="space-y-2 text-slate-300 text-sm">
                <div>Version: 0.1.0</div>
                <div>Status: Alpha</div>
                <div>Updates: Weekly</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;