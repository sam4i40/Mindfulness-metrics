import React, { useState, useEffect } from "react";

function ProgressBar() {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 1 : 100));
        setElapsed((prev) => prev + 1); // tick time
      }, 100); // each tick = 100ms
    }
    return () => clearInterval(interval);
  }, [isRunning, progress]);

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (secs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${seconds}`;
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4 p-6">
        <p className="text-lg font-medium">
          You have finished {progress}% of your task
        </p>

        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="#3b82f6"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
          <g transform="rotate(90, 50, 50)">
            <text
              x="50"
              y="55"
              textAnchor="middle"
              className="fill-gray-800 text-xs font-semibold"
            >
              {formatTime(elapsed)}
            </text>
          </g>
        </svg>

        <button
          onClick={() => setIsRunning((prev) => !prev)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isRunning ? "Pause Timer" : "Start Timer"}
        </button>
      </div>
    </>
  );
}

function App() {
  return (
    <>
      <ProgressBar />
    </>
  );
}

export default App;
