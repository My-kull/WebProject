import React from "react";
import InfoBox from "./InfoBox";
import GameCanvas from "./GameCanvas";
import Controls from "./Controls";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto mt-8">
        <div className="grid grid-cols-4 gap-4 h-screen">
          {/* Left Column */}
          <div className="space-y-4">
            <InfoBox
              title="Settings"
              icon="⚙️"
              borderColor="cyan"
              textColor="cyan"
              items={["Volume: 80%", "Difficulty: Hard", "Graphics: High"]}
            />
            <InfoBox
              title="Stats"
              icon="📊"
              borderColor="purple"
              textColor="purple"
              items={["Best Score: 9,999", "Level: 5", "Playtime: 12h"]}
            />
          </div>

          {/* Center Column - Game Area */}
          <GameCanvas />

          {/* Right Column */}
          <div className="space-y-4">
            <Controls />
            <InfoBox
              title="Info"
              icon="ℹ️"
              borderColor="yellow"
              textColor="yellow"
              items={["Version: 0.1.0", "Status: Alpha", "Updates: Weekly"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
