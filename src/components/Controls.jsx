import React from "react";

const Controls = () => {
  const controls = [
    { key: "WASD", action: "Move" },
    { key: "Space", action: "Shoot" },
    { key: "E", action: "Special" },
  ];

  return (
    <div className="bg-slate-200 dark:bg-slate-700 border-2 border-green-400 rounded-lg p-4 h-64 transition-colors">
      <h3 className="text-green-600 dark:text-green-400 font-bold text-lg mb-4">🎮 Controls</h3>
      <div className="space-y-2 text-slate-700 dark:text-slate-300 text-xs">
        {controls.map((control, index) => (
          <div key={index}>
            <span className="font-bold">{control.key}</span> - {control.action}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Controls;
