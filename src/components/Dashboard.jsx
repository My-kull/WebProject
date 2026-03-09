import React, { useState } from "react";
import InfoBox from "./InfoBox";
import GameCanvas from "./GameCanvas";
import Controls from "./Controls";
import TutorialPanel from "./TutorialPanel";

const Dashboard = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8 transition-colors">
      <div className="max-w-7xl mx-auto mt-8">
        <div
          className={`grid gap-4 h-screen ${
            gameStarted
              ? "md:[grid-template-columns:15%_70%_15%] grid-cols-1"
              : "grid-cols-1 md:grid-cols-4"
          }`}
        >
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

          {/* Center Column */}
          {tutorialComplete ? (
            <GameCanvas
              gameStarted={gameStarted}
              onEnterGame={() => setGameStarted(true)}
            />
          ) : (
            <div className={gameStarted ? "col-span-1" : "md:col-span-2 col-span-1"}>
              <TutorialPanel
                active
                className="h-full min-h-[520px]"
                onComplete={() => setTutorialComplete(true)}
              />
            </div>
          )}

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
