import React from "react";

const InfoBox = ({ title, icon, items, borderColor, textColor }) => {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700 border-2 border-${borderColor}-400 rounded-lg p-4 flex-1 transition-colors`}
    >
      <h3 className={`text-${textColor}-600 dark:text-${textColor}-400 font-bold text-lg mb-4`}>
        {icon} {title}
      </h3>
      <div className="space-y-2 text-slate-700 dark:text-slate-300 text-sm">
        {items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
};

export default InfoBox;
